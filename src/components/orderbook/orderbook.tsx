'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { TooltipProvider } from '../ui/tooltip';
import OrderbookRowTooltip from './orderbook-row-tooltip';
import { extractDecimals } from './utils';
import OrderbookPopover from './orderbook-popover';
import OrderbookLastTrade from './orderbook-last-trade';
import OrderbookStepPriceDropdown from './orderbook-step-price-dropdown';
import { EOrderTypes } from './types';
import usePriceStepOrdered from './hooks/use-price-step-ordered';
import useCumulativeTooltipData from './hooks/use-cumulative-tooltip-data';
import useOrderBookTooltip from './hooks/use-orderbook-tooltip';
import OrderbookBidAskPercentage from './orderbook-bid-ask-percentage';
import { useBidAskPercentage } from './hooks/use-bid-ask-percentage';
import { TOOLTIP_HEIGHT, TOOLTIP_WIDTH } from './consts';

import OrderBookRow from '@/components/orderbook/orderbook-row';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DefaultBuySellIcon from '@/assets/buy-sell-icon';
import BuyIcon from '@/assets/buy-icon';
import SellIcon from '@/assets/sell-icon';
import { cn } from '@/lib/utils';
import { useOrderBook } from '@/client/use-order-book';
import useExchangeInfo from '@/client/use-exchange-info';
import { EPairs } from '@/types';
import { formatNumber } from '@/utils/format-number';
import mockOrderBookData from '@/mock/mocked-data';

export interface IPopoverFields {
  rounding: boolean;
}

export const popoverFieldsInitialState = {
  rounding: true,
};

interface IOrderBookProps {
  pair: any;
}

export const ROW_HEIGHT = 25; // px (must match CSS)

export default function OrderBook(props: IOrderBookProps) {
  const { pair } = props;

  const [view, setView] = useState({ default: true, bid: false, ask: false });
  const [popoverFields, setPopoverFields] = useState<IPopoverFields>(popoverFieldsInitialState);
  const [priceStep, setPriceStep] = useState('0.01');

  const tooltipDataRef = useRef(null);
  const bidContainerRef = useRef<HTMLDivElement | null>(null);
  const askContainerRef = useRef<HTMLDivElement | null>(null);

  const { bids, asks } = useOrderBook(pair);
  // const { bids, asks } = mockOrderBookData;

  const { data } = useExchangeInfo(pair);

  const sizeDecimals = extractDecimals(data?.stepSize);
  const tickDecimals = extractDecimals(data?.tickSize);

  const handleSetPopoverFields = useCallback((value: boolean, field: keyof typeof popoverFieldsInitialState) => {
    setPopoverFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSetPriceStep = useCallback((value: string) => {
    setPriceStep(value);
  }, []);

  const handleSetView = useCallback((view: string) => {
    setView((prev) =>
      Object.keys(prev).reduce(
        (acc, key) => {
          acc[key as keyof typeof prev] = view === key;
          return acc;
        },
        {} as typeof prev,
      ),
    );
  }, []);

  const cumulativeBidData = useCumulativeTooltipData(bids, sizeDecimals, tickDecimals, EOrderTypes.bid);
  const cumulativeAskData = useCumulativeTooltipData(asks, sizeDecimals, tickDecimals, EOrderTypes.ask);

  const bidsPriceStepOrdered = usePriceStepOrdered(bids, priceStep, view.default, true);
  const asksPriceStepOrdered = usePriceStepOrdered(asks, priceStep, view.default, false);

  const { bidPercentage, askPercentage } = useBidAskPercentage(bids, asks);

  const {
    hoverTooltipContent,
    isTooltipOpen,
    containerRef,
    rowBidRefs,
    rowAskRefs,
    rowBuyHovered,
    rowSellHovered,
    handleHover,
    handleLeave,
    handleTooltipEnter,
    handleTooltipLeave,
    hoveredIndexRef,
  } = useOrderBookTooltip();

  const tooltipData = useMemo(() => {
    if (!hoverTooltipContent) return { base: 0, quote: 0, avgPrice: 0 };
    const { price, orderType } = hoverTooltipContent;
    const data = orderType === EOrderTypes.bid ? cumulativeBidData : cumulativeAskData;
    const tooltipPriceData = data.get(price);
    if (tooltipPriceData) tooltipDataRef.current = tooltipPriceData;
    if (!tooltipPriceData) return tooltipDataRef.current;
    return tooltipPriceData;
  }, [cumulativeBidData, cumulativeAskData, hoverTooltipContent]);

  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? 0;
  const spread = bestBid && bestAsk ? formatNumber(bestAsk - bestBid, 2) : '--';
  const spreadPct = bestBid && bestAsk ? formatNumber(((bestAsk - bestBid) / ((bestBid + bestAsk) / 2)) * 100, 4) : '--';

  const maxBidSize = useMemo(() => {
    if (bids.length === 0) return 1; // prevent divide by 0 / NaN
    return Math.max(...bids.slice(0, 20).map((r) => r.size * r.price));
  }, [bids]);

  const maxAskSize = useMemo(() => {
    if (asks.length === 0) return 1; // prevent divide by 0 / NaN
    return Math.max(...asks.slice(0, 20).map((r) => r.size * r.price));
  }, [bids]);

  const tooltipCoodinates = useMemo(() => {
    const rowNode =
      hoverTooltipContent?.orderType === EOrderTypes.bid
        ? hoverTooltipContent && rowBidRefs.current.get(hoverTooltipContent.price)
        : hoverTooltipContent && rowAskRefs.current.get(hoverTooltipContent.price);

    let tooltipTop;
    let tooltipLeft;

    if (rowNode && containerRef.current) {
      const rowRect = rowNode.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // row position relative to container
      const topRelativeToContainer = rowRect.top - containerRect.top;

      // center tooltip vertically on row
      tooltipTop = topRelativeToContainer + rowRect.height / 2 - TOOLTIP_HEIGHT / 2;

      // tooltip left/right
      // tooltipLeft =
      //   hoverTooltipContent && hoverTooltipContent.orderType === EOrderTypes.bid
      //     ? rowRect.right - containerRect.left + 8
      //     : rowRect.left - containerRect.left - TOOLTIP_WIDTH - 8;
      tooltipLeft = rowRect.right - containerRect.left + 8;
    }

    return { tooltipTop, tooltipLeft };
  }, [hoverTooltipContent]);

  return (
    <TooltipProvider>
      <div ref={containerRef} className="relative w-full max-w-md">
        <Card className="w-full border-border/20 bg-(--card)/40 gap-2">
          <CardHeader className="flex flex-col gap-4">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-foreground">Order Book</CardTitle>
              <OrderbookPopover popoverFields={popoverFields} onCheckedChange={handleSetPopoverFields} />
            </div>
            <Separator className="bg-border/80" />
            <CardAction className="p-0 m-0 flex justify-between w-full">
              <div className="flex gap-2 *:p-0! *:cursor-pointer *:bg-transparent *:hover:bg-transparent">
                <Button onClick={() => handleSetView('default')}>
                  <DefaultBuySellIcon />
                </Button>
                <Button onClick={() => handleSetView(EOrderTypes.bid)}>
                  <BuyIcon />
                </Button>
                <Button onClick={() => handleSetView(EOrderTypes.ask)}>
                  <SellIcon />
                </Button>
              </div>
              <OrderbookStepPriceDropdown value={priceStep} handleSetPriceStep={handleSetPriceStep} pair={EPairs.btcusdc} />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex">
                <div className="text-sm text-muted-foreground flex-1">Price (USDC)</div>
                <div className="text-sm text-muted-foreground flex-1 text-end">Amount (BTC)</div>
                <div className="text-sm text-muted-foreground flex-1 text-end">Total (USDC)</div>
              </div>

              {/* Bids */}
              {(view.default || view.bid) && (
                <div className={cn('space-y-1npx orderbook-radix-table-full -mb-2')}>
                  <div className="relative" style={{ height: bidsPriceStepOrdered.length * ROW_HEIGHT }} ref={bidContainerRef}>
                    {bidsPriceStepOrdered.map(({ price, size }, index) => {
                      return (
                        <OrderBookRow
                          key={price}
                          price={price}
                          size={size}
                          handleHover={handleHover}
                          handleLeave={handleLeave}
                          orderType={EOrderTypes.bid}
                          ref={(el) => {
                            if (el) rowBidRefs.current.set(price, el);
                            else rowBidRefs.current.delete(price);
                          }}
                          rowHovered={rowBuyHovered.current}
                          isRounding={popoverFields.rounding}
                          maxSize={maxBidSize}
                          index={index}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <>
                <Separator className="bg-border/80" />
                <OrderbookLastTrade spread={spread} spreadPct={spreadPct} pair={pair} />
                <Separator className="bg-border/80" />
              </>

              {/* Asks */}
              {(view.default || view.ask) && (
                <div className={cn('space-y-1npx -mt-2')}>
                  <div className="relative" style={{ height: asksPriceStepOrdered.length * ROW_HEIGHT }} ref={askContainerRef}>
                    {asksPriceStepOrdered.map(({ price, size }, index) => {
                      return (
                        <OrderBookRow
                          key={price}
                          price={price}
                          size={size}
                          handleHover={handleHover}
                          handleLeave={handleLeave}
                          orderType={EOrderTypes.ask}
                          ref={(el) => {
                            if (el) rowAskRefs.current.set(price, el);
                            else rowAskRefs.current.delete(price);
                          }}
                          rowHovered={rowSellHovered.current}
                          isRounding={popoverFields.rounding}
                          maxSize={maxAskSize}
                          index={index}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {isTooltipOpen && tooltipData && hoveredIndexRef.current !== null && (
                <div
                  className="absolute left-full ml-2 z-50"
                  style={{
                    top: tooltipCoodinates.tooltipTop,
                    left: tooltipCoodinates.tooltipLeft,
                    width: TOOLTIP_WIDTH,
                    height: TOOLTIP_HEIGHT,
                  }}
                  onPointerEnter={handleTooltipEnter}
                  onPointerLeave={handleTooltipLeave}
                >
                  <OrderbookRowTooltip tooltipData={tooltipData} sizeDecimals={sizeDecimals} tickDecimals={tickDecimals} />
                </div>
              )}
            </div>

            {view.default && <OrderbookBidAskPercentage bidPercentage={bidPercentage} askPercentage={askPercentage} />}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

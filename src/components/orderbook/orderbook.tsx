'use client';

import { useCallback, useMemo, useState } from 'react';

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

import OrderBookRow from '@/components/orderbook/orderbook-row';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import DefaultBuySellIcon from '@/assets/buy-sell-icon';
import BuyIcon from '@/assets/buy-icon';
import SellIcon from '@/assets/sell-icon';
import { cn } from '@/lib/utils';
import { useOrderBook } from '@/client/use-order-book';
import useExchangeInfo from '@/client/use-exchange-info';
import { EPairs } from '@/types';
import { formatNumber } from '@/utils/format-number';

export interface IPopoverFields {
  rounding: boolean;
}

export const popoverFieldsInitialState = {
  rounding: true,
};

interface IOrderBookProps {
  pair: any;
}

export default function OrderBook(props: IOrderBookProps) {
  const { pair } = props;

  const [view, setView] = useState({ default: true, bid: false, ask: false });
  const [popoverFields, setPopoverFields] = useState<IPopoverFields>(popoverFieldsInitialState);
  const [priceStep, setPriceStep] = useState('0.01');

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

  const bidsPriceStepOrdered = usePriceStepOrdered(bids, priceStep, true);
  const asksPriceStepOrdered = usePriceStepOrdered(asks, priceStep, false);

  const { bidPercentage, askPercentage } = useBidAskPercentage(bids, asks);

  const {
    isTooltipOpen,
    hoverTooltipContent,
    hoverRect,
    containerRef,
    rowBidRefs,
    rowAskRefs,
    priceToBidIdRef,
    priceToAskIdRef,
    rowBuyHovered,
    rowSellHovered,
    handleHover,
    handleLeave,
    handleTooltipEnter,
    handleTooltipLeave,
  } = useOrderBookTooltip();

  const tooltipData = useMemo(() => {
    if (!hoverTooltipContent) return { base: 0, quote: 0, avgPrice: 0 };
    const { price, orderType } = hoverTooltipContent;
    const data = orderType === EOrderTypes.bid ? cumulativeBidData : cumulativeAskData;
    return data.get(price);
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

  // console.log('price', price);
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
              <div className="flex gap-2 *:p-0! *:cursor-pointer *:bg-transparent! *:hover:bg-transparen">
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
              <div className="flex pe-3">
                <div className="text-sm text-muted-foreground flex-1">Price (USDC)</div>
                <div className="text-sm text-muted-foreground flex-1 text-end">Amount (BTC)</div>
                <div className="text-sm text-muted-foreground flex-1 text-end">Total (USDC)</div>
              </div>

              {/* Bids */}
              {(view.default || view.bid) && (
                <div
                  className={cn(
                    'space-y-1npx pe-3 orderbook-radix-table-full -mb-2 overflow-hidden',
                    view.bid ? 'min-h-120 h-full' : 'h-72',
                  )}
                >
                  <div className="flex flex-col justify-end h-full">
                    {/* {hoverRect && (
                      <div
                        className="absolute left-0 right-0 bg-yellow-200 opacity-30 pointer-events-none"
                        style={{ top: hoverRect.top, height: hoverRect.height }}
                      />
                    )} */}
                    {bidsPriceStepOrdered.map(({ price, size }, index) => {
                      const stableId = `bid-${index}`;
                      return (
                        <OrderBookRow
                          key={stableId}
                          price={price}
                          size={size}
                          handleHover={handleHover}
                          handleLeave={handleLeave}
                          orderType={EOrderTypes.bid}
                          ref={(el) => {
                            if (el) {
                              rowBidRefs.current.set(stableId, el);
                              priceToBidIdRef.current.set(price, stableId);
                            } else {
                              rowBidRefs.current.delete(stableId);
                              priceToBidIdRef.current.delete(price);
                            }
                          }}
                          rowHovered={rowBuyHovered.current}
                          isRounding={popoverFields.rounding}
                          maxSize={maxBidSize}
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
                <ScrollArea className={cn('space-y-1npx pe-3 -mt-2', view.ask ? 'min-h-120 h-full' : 'h-72')}>
                  <div className="flex flex-col justify-start h-full">
                    {asksPriceStepOrdered.map(({ price, size }, index) => {
                      const stableId = `ask-${index}`;
                      return (
                        <OrderBookRow
                          key={stableId}
                          price={price}
                          size={size}
                          handleHover={handleHover}
                          handleLeave={handleLeave}
                          orderType={EOrderTypes.ask}
                          ref={(el) => {
                            if (el) {
                              rowAskRefs.current.set(stableId, el);
                              priceToAskIdRef.current.set(price, stableId);
                            } else {
                              rowAskRefs.current.delete(stableId);
                              priceToAskIdRef.current.delete(price);
                            }
                          }}
                          rowHovered={rowSellHovered.current}
                          isRounding={popoverFields.rounding}
                          maxSize={maxAskSize}
                        />
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
            {view.default && <OrderbookBidAskPercentage bidPercentage={bidPercentage} askPercentage={askPercentage} />}
          </CardContent>
        </Card>

        {/* Single Tooltip */}
        {hoverRect && hoverTooltipContent && (
          <OrderbookRowTooltip
            isTooltipOpen={isTooltipOpen}
            hoverRect={hoverRect}
            handleTooltipEnter={handleTooltipEnter}
            handleTooltipLeave={handleTooltipLeave}
            tooltipData={tooltipData}
            sizeDecimals={sizeDecimals}
            tickDecimals={tickDecimals}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

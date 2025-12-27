'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { TooltipProvider } from '../ui/tooltip';
import OrderbookRowTooltip from './orderbook-row-tooltip';
import { extractDecimals } from './utils';
import OrderbookPopover from './orderbook-popover';
import OrderbookLastTrade from './orderbook-last-trade';
import OrderbookDropdown from './orderbook-dropdown';
import type { TOrderType } from './types';
import { EOrderTypes } from './types';

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
import mockOrderBookData from '@/mock/mocked-data';
import useExchangeInfo from '@/client/use-exchange-info';
import { EPairs } from '@/type';
import { formatNumber } from '@/utils/format-number';

export interface IPopoverFields {
  rounding: boolean;
}

export const popoverFieldsInitialState = {
  rounding: true,
};

export default function OrderBook() {
  const [view, setView] = useState({ default: true, buy: false, sell: false });
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [hoverTooltipContent, setHoverTooltipContent] = useState<{
    price: number;
    orderType: string;
  } | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [popoverFields, setPopoverFields] = useState<IPopoverFields>(popoverFieldsInitialState);
  const [priceStep, setPriceStep] = useState('0.01');

  const containerRef = useRef<HTMLDivElement | null>(null);
  // It maps the reference of every row, it's used Map in order to have quicker access to the rows and improve performance
  const rowBidRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const rowAskRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const rafRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // It tracks when tooltip is hovered
  const isHoveringTooltipRef = useRef(false);
  // It tracks when row is hovered
  const isHoveringRowRef = useRef(false);
  // It tracks when buy or sell row are hovered
  const rowBuyHovered = useRef<number | null>(null);
  const rowSellHovered = useRef<number | null>(null);

  // const { bids, asks } = useOrderBook();
  // console.log(bids);

  const { data } = useExchangeInfo(EPairs.btcusdc);

  const sizeDecimals = extractDecimals(data?.stepSize);
  const tickDecimals = extractDecimals(data?.tickSize);

  const { bids, asks } = mockOrderBookData;
  // 26,751.303974
  // 26.751k

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

  const cumulativeBidData = useMemo(() => {
    const bidsMap = new Map(bids.entries());
    const bidsMapCumulative = new Map();

    let baseInt = BigInt(0);
    let quoteInt = BigInt(0);

    for (let i = bidsMap.size - 1; i >= 0; i--) {
      const row = bidsMap.get(i);
      if (!row) continue;

      // Floor to avoid floating-point artifacts and prevent rounding up quantities
      // Even after scaling (size * 10^decimals), JS may produce a non-integer like 44999.99999999999.
      // Floor ensures a safe integer for BigInt and avoids rounding up.
      const sizeInt = BigInt(Math.floor(row.size * 10 ** sizeDecimals));
      const priceInt = BigInt(Math.floor(row.price * 10 ** tickDecimals));

      baseInt += sizeInt;
      quoteInt += sizeInt * priceInt;

      bidsMapCumulative.set(row.price, {
        base: baseInt,
        quote: quoteInt,
        avgPrice: baseInt === 0n ? 0n : quoteInt / baseInt,
      });
    }

    return bidsMapCumulative;
  }, [bids, data?.stepSize, data?.tickSize, sizeDecimals, tickDecimals]);

  const cumulativeAskData = useMemo(() => {
    const asksMap = new Map(asks.entries());
    const asksMapCumulative = new Map();

    let baseInt = BigInt(0);
    let quoteInt = BigInt(0);

    for (let i = 0; i < asksMap.size; i++) {
      const row = asksMap.get(i);
      if (!row) continue;

      // Floor to avoid floating-point artifacts and prevent rounding up quantities
      // Even after scaling (size * 10^decimals), JS may produce a non-integer like 44999.99999999999.
      // Floor ensures a safe integer for BigInt and avoids rounding up.
      const sizeInt = BigInt(Math.floor(row.size * 10 ** sizeDecimals));
      const priceInt = BigInt(Math.floor(row.price * 10 ** tickDecimals));

      baseInt += sizeInt;
      quoteInt += sizeInt * priceInt;

      asksMapCumulative.set(row.price, {
        base: baseInt,
        quote: quoteInt,
        avgPrice: baseInt === 0n ? 0n : quoteInt / baseInt,
      });
    }

    return asksMapCumulative;
  }, [asks]);

  /**
   * Groups and sorts bids or asks by a given priceStep.
   * - Step = '0.01' → returns original array (no grouping)
   * - Step > 0.01 → groups prices into steps, sums sizes, and sorts
   * @param orders Array of orders (bids or asks)
   * @param priceStep Step as string, e.g., '0.01', '0.1', '1', '10'
   * @param isBid Whether the orders are bids (descending) or asks (ascending)
   */
  const usePriceStepOrdered = (orders: { price: number; size: number }[], priceStep: string, isBid: boolean) => {
    return useMemo(() => {
      if (priceStep === '0.01') return orders;

      const grouped = orders.reduce(
        (acc, next) => {
          // 1. Divide the price by the step size → how many steps fit into this price
          // 2. Math.floor → round down to the start of the step group
          // 3. Multiply by step → convert back to actual grouped price
          const price = Math.floor(next.price / Number(priceStep)) * Number(priceStep);

          if (!acc[price]) {
            acc[price] = { ...next, price };
          } else {
            acc[price] = { ...next, size: acc[price].size + next.size };
          }

          return acc;
        },
        {} as Record<string, { price: number; size: number }>,
      );

      // Convert grouped object to array and sort:
      // - bids → descending
      // - asks → ascending
      const sorted = Object.values(grouped).sort((a, b) => (isBid ? b.price - a.price : a.price - b.price));

      return sorted;
    }, [orders, priceStep, isBid]);
  };

  const bidsPriceStepOrdered = usePriceStepOrdered(bids, priceStep, true);
  const asksPriceStepOrdered = usePriceStepOrdered(asks, priceStep, false);

  const tooltipData = useMemo(() => {
    if (!hoverTooltipContent) return { base: 0, quote: 0, avgPrice: 0 };
    const { price, orderType } = hoverTooltipContent;
    const data = orderType === 'buy' ? cumulativeBidData : cumulativeAskData;
    return data.get(price);
  }, [cumulativeBidData, cumulativeAskData, hoverTooltipContent]);

  const handleHover = useCallback((price: number, orderType: TOrderType) => {
    // It cancels pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    // It sets that we currently hovering a row
    isHoveringRowRef.current = true;

    if (orderType === EOrderTypes.buy) {
      rowBuyHovered.current = price;
    } else {
      rowSellHovered.current = price;
    }

    // It deletes the previous animation when a new row is hovered
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // It stores the animation reference
    rafRef.current = requestAnimationFrame(() => {
      // It gets from the rows map the current row hovered
      const node = orderType === EOrderTypes.buy ? rowBidRefs.current.get(price) : rowAskRefs.current.get(price);
      if (!node || !containerRef.current) return;

      const nodeRect = node.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeNodeRect = new DOMRect(
        nodeRect.left - containerRect.left,
        nodeRect.top - containerRect.top,
        nodeRect.width,
        nodeRect.height,
      );
      // It sets the row position relative to its wrapper
      setHoverRect(relativeNodeRect);

      setHoverTooltipContent({ price, orderType });

      setIsTooltipOpen(true);
    });
  }, []);

  const handleLeave = useCallback(() => {
    isHoveringRowRef.current = false;
    rowBuyHovered.current = null;
    rowSellHovered.current = null;

    // The delay is used to avoid to clsoe the tooltip when we pass from one row to another one
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRowRef.current && !isHoveringTooltipRef.current) {
        setIsTooltipOpen(false);
        setHoverTooltipContent(null);
        setHoverRect(null);
      }
    }, 80); // 50–120ms is a good compromise
  }, []);

  const handleTooltipEnter = useCallback(() => {
    isHoveringTooltipRef.current = true;

    // Since the hover is moved on the tooltip, we can cancel the timeout applied to the row
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleTooltipLeave = useCallback(() => {
    isHoveringTooltipRef.current = false;

    // When we leave the tooltip if the hover is not on the row, we can close the tooltip and reset all
    if (!isHoveringRowRef.current) {
      setIsTooltipOpen(false);
      setHoverTooltipContent(null);
      setHoverRect(null);
    }
  }, []);

  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? 0;
  const spread = bestBid && bestAsk ? formatNumber(bestAsk - bestBid, 2) : '--';
  const spreadPct = bestBid && bestAsk ? formatNumber(((bestAsk - bestBid) / ((bestBid + bestAsk) / 2)) * 100, 4) : '--';

  return (
    <TooltipProvider>
      <div ref={containerRef} className="relative w-full">
        <Card className="w-full border-border/20 bg-(--card)/40 max-w-md gap-2">
          <CardHeader className="flex flex-col gap-4">
            <div className="flex items-center justify-between w-full">
              <CardTitle className="text-foreground">Order Book</CardTitle>
              <OrderbookPopover popoverFields={popoverFields} onCheckedChange={handleSetPopoverFields} />
            </div>
            <Separator className="bg-border/80" />
            <CardAction className="p-0 m-0 flex justify-between w-full">
              <div className="flex gap-2 *:p-0! *:cursor-pointer *:bg-transparent *:hover:bg-transparen">
                <Button onClick={() => handleSetView('default')}>
                  <DefaultBuySellIcon />
                </Button>
                <Button onClick={() => handleSetView(EOrderTypes.buy)}>
                  <BuyIcon />
                </Button>
                <Button onClick={() => handleSetView(EOrderTypes.sell)}>
                  <SellIcon />
                </Button>
              </div>
              <OrderbookDropdown value={priceStep} handleSetPriceStep={handleSetPriceStep} pair="btcusdc" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex pe-3">
                <div className="text-sm text-muted-foreground flex-1">Price (USDC)</div>
                <div className="text-sm text-muted-foreground flex-1 text-end">Amount (BTC)</div>
                <div className="text-sm text-muted-foreground flex-1 text-end">Total (USDC)</div>
              </div>

              {/* Bids */}
              {(view.default || view.buy) && (
                <ScrollArea className={cn('space-y-1npx pe-3 orderbook-radix-table-full', view.buy ? 'h-full' : 'h-72')}>
                  <div className="flex flex-col justify-end h-full">
                    {bidsPriceStepOrdered.map(({ price, size }) => (
                      <OrderBookRow
                        key={price}
                        price={price}
                        size={size}
                        handleHover={handleHover}
                        handleLeave={handleLeave}
                        orderType={EOrderTypes.buy}
                        ref={(el) => {
                          if (el) rowBidRefs.current.set(price, el);
                          else rowBidRefs.current.delete(price);
                        }}
                        rowHovered={rowBuyHovered.current}
                        isRounding={popoverFields.rounding}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}

              {view.default && (
                <>
                  <Separator className="bg-border/80" />
                  <OrderbookLastTrade spread={spread} spreadPct={spreadPct} />
                  <Separator className="bg-border/80" />
                </>
              )}

              {/* Asks */}
              {(view.default || view.sell) && (
                <ScrollArea className={cn('space-y-1npx pe-3', view.sell ? 'h-full' : 'h-72')}>
                  {asksPriceStepOrdered.map(({ price, size }) => (
                    <div className="flex flex-col justify-start h-full">
                      <OrderBookRow
                        key={price}
                        price={price}
                        size={size}
                        handleHover={handleHover}
                        handleLeave={handleLeave}
                        orderType={EOrderTypes.sell}
                        ref={(el) => {
                          if (el) rowAskRefs.current.set(price, el);
                          else rowAskRefs.current.delete(price);
                        }}
                        rowHovered={rowSellHovered.current}
                        isRounding={popoverFields.rounding}
                      />
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
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

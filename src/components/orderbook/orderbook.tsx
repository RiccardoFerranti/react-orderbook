'use client';

import { Fragment, useCallback, useRef, useState } from 'react';

import OrderbookRowTooltip from './orderbook-row-tooltip';
import { extractDecimals } from './utils';
import OrderbookPopover from './orderbook-popover';
import OrderbookLastTrade from './orderbook-last-trade';
import OrderbookStepPriceDropdown from './orderbook-step-price-dropdown';
import type { ITooltipData } from './types';
import { EOrderTypes } from './types';
import OrderbookBidAskPercentage from './orderbook-bid-ask-percentage';
import { useOrderBookBidAskPercentage } from './hooks/use-orderbook-bid-ask-percentage';
import {
  DEFAULT_PRICE_STEP,
  ORDERBOOK_LABELS,
  ROW_HEIGHT,
  ROWS_NUMBER_EXPANDED,
  ROWS_NUMBER_NOT_EXPANDED,
  TOOLTIP_HEIGHT,
  TOOLTIP_WIDTH,
} from './consts';
import OrderbookSkeletonRow from './orderbook-skeleton-row';
import useOrderBookTooltipCoordinates from './hooks/use-orderbook-tooltip-coordinates';
import useOrderBookTooltipData from './hooks/use-orderbook-tooltip-data';
import useOrderBookCumulativeTooltipData from './hooks/use-orderbook-cumulative-tooltip-data';
import useOrderBookTooltip from './hooks/use-orderbook-tooltip';
import useOrderBookPriceStepOrdered from './hooks/use-orderbook-price-step-ordered';
import useOrderbookMaxBidAskSize from './hooks/use-orderbook-max-bid-ask-size';

import OrderBookRow from '@/components/orderbook/orderbook-row';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DefaultBuySellIcon from '@/assets/buy-sell-icon';
import BuyIcon from '@/assets/buy-icon';
import SellIcon from '@/assets/sell-icon';
import { cn } from '@/lib/utils';
import type { IOrderBook } from '@/client/use-order-book';
import useExchangeInfo from '@/client/use-exchange-info';
import type { EPairs } from '@/types';
import { formatNumber } from '@/utils/format-number';

export interface IPopoverFields {
  rounding: boolean;
}

export const popoverFieldsInitialState = {
  rounding: true,
};

interface IOrderBookProps extends IOrderBook {
  pair: EPairs;
  isOrdersLoading: boolean;
}

export default function OrderBook(props: IOrderBookProps) {
  const { pair, bids, asks, isOrdersLoading } = props;

  const [view, setView] = useState({ default: true, bid: false, ask: false });
  const [popoverFields, setPopoverFields] = useState<IPopoverFields>(popoverFieldsInitialState);
  const [priceStep, setPriceStep] = useState(DEFAULT_PRICE_STEP);

  const tooltipDataRef = useRef<ITooltipData | null>(null);
  const bidContainerRef = useRef<HTMLDivElement | null>(null);
  const askContainerRef = useRef<HTMLDivElement | null>(null);

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

  /**
   * Precomputes and retrieves cumulative tooltip data for the bid side of the order book.
   * Utilizes the useCumulativeTooltipData hook, which calculates cumulative base and quote
   * values for each bid price level, allowing for O(1) lookup during row hover events.
   */
  const cumulativeBidData = useOrderBookCumulativeTooltipData(bids, sizeDecimals, tickDecimals, EOrderTypes.bid);
  const cumulativeAskData = useOrderBookCumulativeTooltipData(asks, sizeDecimals, tickDecimals, EOrderTypes.ask);

  /**
   * Returns the list of bid orders, processed and grouped according to the selected price step and view settings.
   */
  const bidsPriceStepOrdered = useOrderBookPriceStepOrdered(bids, priceStep, view.default, true);

  /**
   * Returns the list of ask orders, processed and grouped according to the selected price step and view settings.
   */
  const asksPriceStepOrdered = useOrderBookPriceStepOrdered(asks, priceStep, view.default, false);

  /**
   * Calculates the percentage share of bid and ask volumes in the order book.
   * Utilizes the useBidAskPercentage hook to compute the respective percentages
   * based on the top N (default 20) entries from both bids and asks arrays.
   */
  const { bidPercentage, askPercentage } = useOrderBookBidAskPercentage(bids, asks);

  /**
   * Custom order book tooltip hook providing state and handlers for tooltip display and row hover effects.
   */
  const {
    hoverTooltipContent,
    isTooltipOpen,
    containerRef,
    rowBidRefs,
    rowAskRefs,
    handleHover,
    handleLeave,
    handleTooltipEnter,
    handleTooltipLeave,
    hoveredIndexRef,
    bidRowHoveredById,
    askRowHoveredById,
    isHoveringBidRowRef,
    isHoveringAskRowRef,
  } = useOrderBookTooltip();

  /**
   * Retrieves the tooltip data to display for the currently hovered row in the order book.
   * Leverages precomputed cumulative data for bids and asks, and returns tooltip content
   * for the current hover context.
   */
  const tooltipData = useOrderBookTooltipData({ cumulativeBidData, cumulativeAskData, hoverTooltipContent, tooltipDataRef });

  /**
   * Calculates and returns the tooltip coordinates for the order book based
   * on the current hovered order row and container references.
   * Uses useTooltipCoordinates hook to get top/left coordinates for the tooltip.
   */
  const tooltipCoordinates = useOrderBookTooltipCoordinates({
    hoverTooltipContent,
    rowBidRefs,
    rowAskRefs,
    containerRef,
  });

  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? 0;
  const spread = bestBid && bestAsk ? formatNumber(bestAsk - bestBid, 2) : '--';
  const spreadPct = bestBid && bestAsk ? formatNumber(((bestAsk - bestBid) / ((bestBid + bestAsk) / 2)) * 100, 4) : '--';

  /**
   * Calculates the maximum cumulative size (size * price) among the top 20 bids and asks.
   * This is used to determine proportional bar widths for the orderbook heatmap.
   * Returns 1 as the minimum value to avoid NaN/divide-by-zero.
   */
  const { maxBidSize, maxAskSize } = useOrderbookMaxBidAskSize({ bids, asks });

  const { priceToken, amountToken, totalToken } = ORDERBOOK_LABELS[pair as keyof typeof EPairs];

  const visibleRows = view.default ? ROWS_NUMBER_NOT_EXPANDED : ROWS_NUMBER_EXPANDED;

  return (
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
            <OrderbookStepPriceDropdown value={priceStep} handleSetPriceStep={handleSetPriceStep} pair={pair} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <div className="flex">
              <div className="text-sm text-muted-foreground flex-1">Price ({priceToken})</div>
              <div className="text-sm text-muted-foreground flex-1 text-end">Amount ({amountToken})</div>
              <div className="text-sm text-muted-foreground flex-1 text-end">Total ({totalToken})</div>
            </div>

            {/* Asks */}
            {(view.default || view.ask) && (
              <div className={cn('space-y-1npx -mt-2')}>
                <div
                  ref={askContainerRef}
                  className="relative overflow-hidden"
                  style={{
                    minHeight: view.ask && !view.bid ? ROWS_NUMBER_EXPANDED * ROW_HEIGHT : ROWS_NUMBER_NOT_EXPANDED * ROW_HEIGHT,
                    height: visibleRows * ROW_HEIGHT,
                  }}
                >
                  {/* SKELETON ROWS — ONLY ON FIRST LOAD */}
                  {isOrdersLoading &&
                    asksPriceStepOrdered.length === 0 &&
                    Array.from({ length: visibleRows }).map((_, index) => (
                      <OrderbookSkeletonRow key={`ask-skeleton-${index}`} index={index} />
                    ))}

                  {/* REAL ROWS */}
                  {!isOrdersLoading &&
                    asksPriceStepOrdered.map((ask, index) => {
                      if (!ask) return null;

                      return (
                        <Fragment key={ask.price}>
                          {/* HOVER / SELECTION OVERLAY */}
                          {isHoveringAskRowRef.current &&
                            askRowHoveredById.current !== null &&
                            askRowHoveredById.current <= index && (
                              <div
                                className={cn('absolute left-0 pointer-events-none w-full z-1 bg-(--card-foreground)/5', {
                                  'border-t border-dashed border-border': askRowHoveredById.current === index,
                                })}
                                style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
                              />
                            )}

                          <OrderBookRow
                            price={ask.price}
                            size={ask.size}
                            handleHover={handleHover}
                            handleLeave={handleLeave}
                            orderType={EOrderTypes.ask}
                            ref={(el) => {
                              if (el) rowAskRefs.current.set(ask.price, el);
                              else rowAskRefs.current.delete(ask.price);
                            }}
                            isRounding={popoverFields.rounding}
                            maxSize={maxAskSize}
                            index={index}
                          />
                        </Fragment>
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

            {/* Bids */}
            {(view.default || view.bid) && (
              <div className={cn('space-y-1npx orderbook-radix-table-full -mb-2')}>
                <div
                  ref={bidContainerRef}
                  className="relative overflow-hidden"
                  style={{
                    height: visibleRows * ROW_HEIGHT,
                    minHeight: !view.ask && view.bid ? ROWS_NUMBER_EXPANDED * ROW_HEIGHT : ROWS_NUMBER_NOT_EXPANDED * ROW_HEIGHT,
                  }}
                >
                  {/* SKELETON ROWS — ONLY ON FIRST LOAD */}
                  {isOrdersLoading &&
                    bidsPriceStepOrdered.length === 0 &&
                    Array.from({ length: visibleRows }).map((_, index) => (
                      <OrderbookSkeletonRow key={`bid-skeleton-${index}`} index={index} />
                    ))}

                  {/* REAL ROWS */}
                  {!isOrdersLoading &&
                    bidsPriceStepOrdered.map((bid, index) => {
                      if (!bid) return null;

                      return (
                        <Fragment key={bid.price}>
                          {/* HOVER / SELECTION OVERLAY */}
                          {isHoveringBidRowRef.current &&
                            bidRowHoveredById.current !== null &&
                            bidRowHoveredById.current >= index && (
                              <div
                                className={cn('absolute left-0 top-0 w-full pointer-events-none z-1 bg-(--card-foreground)/5', {
                                  'border-b border-dashed border-border': bidRowHoveredById.current === index,
                                })}
                                style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
                              />
                            )}

                          <OrderBookRow
                            price={bid.price}
                            size={bid.size}
                            index={index}
                            orderType={EOrderTypes.bid}
                            handleHover={handleHover}
                            handleLeave={handleLeave}
                            isRounding={popoverFields.rounding}
                            maxSize={maxBidSize}
                            ref={(el) => {
                              if (el) rowBidRefs.current.set(bid.price, el);
                              else rowBidRefs.current.delete(bid.price);
                            }}
                          />
                        </Fragment>
                      );
                    })}
                </div>
              </div>
            )}
            {isTooltipOpen && tooltipData && hoveredIndexRef.current !== null && (
              <div
                className="absolute left-full ml-2 z-50"
                style={{
                  top: tooltipCoordinates.tooltipTop,
                  left: tooltipCoordinates.tooltipLeft,
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
  );
}

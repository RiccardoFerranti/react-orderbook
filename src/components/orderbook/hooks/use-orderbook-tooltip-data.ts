import type { RefObject } from 'react';
import { useMemo } from 'react';

import { EOrderTypes } from '@/components/orderbook/types';
import type { IHoverTooltipContent, ITooltipData } from '@/components/orderbook/types';

interface IUseOrderBookTooltipData {
  cumulativeBidData: Map<number, ITooltipData>;
  cumulativeAskData: Map<number, ITooltipData>;
  hoverTooltipContent: IHoverTooltipContent | null;
  tooltipDataRef: RefObject<ITooltipData | null>;
}

/**
 * Custom React hook to provide tooltip data for the order book tooltip.
 *
 * Retrieves cumulative base/quote/price data for the row currently hovered,
 * picking from the bids or asks map according to the hovered row.
 * If no tooltip data is found for the hovered row, falls back to
 * the last known tooltip data stored in the provided ref.
 *
 * @param {Object} params
 * @param {Map<number, ITooltipData>} params.cumulativeBidData - Map of bid price to cumulative data.
 * @param {Map<number, ITooltipData>} params.cumulativeAskData - Map of ask price to cumulative data.
 * @param {IHoverTooltipContent|null} params.hoverTooltipContent - The current hover state (price + type).
 * @param {React.RefObject<ITooltipData|null>} params.tooltipDataRef - Mutable ref to persist last tooltip data.
 * @returns {ITooltipData} tooltipData - Data for the hovered row or most recent available.
 */
const useOrderBookTooltipData = ({
  cumulativeBidData,
  cumulativeAskData,
  hoverTooltipContent,
  tooltipDataRef,
}: IUseOrderBookTooltipData): ITooltipData | null => {
  const tooltipData = useMemo(() => {
    if (!hoverTooltipContent) return { base: BigInt(0), quote: BigInt(0), avgPrice: BigInt(0) };
    const { price, orderType } = hoverTooltipContent;
    const data = orderType === EOrderTypes.bid ? cumulativeBidData : cumulativeAskData;
    const tooltipPriceData = data.get(price);
    if (tooltipPriceData) tooltipDataRef.current = tooltipPriceData;
    if (!tooltipPriceData) return tooltipDataRef.current;
    return tooltipPriceData;
  }, [cumulativeBidData, cumulativeAskData, hoverTooltipContent]);

  return tooltipData;
};

export default useOrderBookTooltipData;

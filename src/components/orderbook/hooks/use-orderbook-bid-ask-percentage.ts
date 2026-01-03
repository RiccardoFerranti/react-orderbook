import { useMemo } from 'react';

import type { IOrder } from '@/components/orderbook/adapters/types';

/**
 * Custom hook to calculate the percentage share of bid and ask volumes
 * within the order book, based on the top N orders for both sides.
 *
 * @param {IOrder[]} bids - Array of bid orders (descending price).
 * @param {IOrder[]} asks - Array of ask orders (ascending price).
 * @param {number} [topN=20] - Number of top entries to consider from each side.
 * @returns {{ bidPercentage: number, askPercentage: number }} - Percentages of bid and ask volume.
 */

interface IUseOrderBookBidAskPercentageReturn {
  bidPercentage: number;
  askPercentage: number;
}

export function useOrderBookBidAskPercentage(bids: IOrder[], asks: IOrder[], topN = 20): IUseOrderBookBidAskPercentageReturn {
  return useMemo(() => {
    const topBids = bids.slice(0, topN);
    const topAsks = asks.slice(0, topN);

    const bidSumSizes = topBids.reduce((acc, next) => acc + next.size, 0);
    const askSumSizes = topAsks.reduce((acc, next) => acc + next.size, 0);

    const total = bidSumSizes + askSumSizes;
    if (total === 0) return { bidPercentage: 50, askPercentage: 50 }; // avoid division by 0

    return {
      bidPercentage: (bidSumSizes / total) * 100,
      askPercentage: (askSumSizes / total) * 100,
    };
  }, [bids, asks, topN]);
}

import { useMemo } from 'react';

import { EOrderTypes, type TOrderType } from '@/components/orderbook/types';
import type { IOrder } from '@/components/orderbook/adapters/types';

/**
 * A custom hook that calculates cumulative tooltip data for the order book rows.
 *
 *  We precompute cumulative order book data for tooltips.
 *
 * The tooltip does NOT represent a single order-book level.
 * Instead, it answers:
 *
 * - Bids: "If I sell INTO bids down to this price, how much base asset will I sell and how much quote will I receive?"
 *
 * - Asks: "If I buy FROM asks up to this price, how much base asset will I buy and how much quote will I pay?"
 *
 * To achieve this:
 * - Bids are accumulated from best bid → downward
 * - Asks are accumulated from best ask → upward
 *
 * Cumulative data is precomputed to allow O(1) lookup on hover and avoid recalculating totals during mouse movement.
 *
 * BigInt + flooring is used to avoid floating-point precision errors and prevent rounding up financial values.
 *
 * For each price level, it sums up the cumulative base (quantity), quote (base × price), and calculates the average price
 * up to that row. Returns a Map where the key is the row price and the value is:
 *    { base: BigInt, quote: BigInt, avgPrice: BigInt }
 *
 * Intended for use with tooltips that display cumulative values for an order book.
 *
 * @param {IOrder[]} orders - The order book rows to process.
 * @param {number} sizeDecimals - Number of decimals for base size.
 * @param {number} tickDecimals - Number of decimals for price.
 * @param {TOrderType} orderType - The order type (bid/ask).
 * @returns {Map<number, { base: bigint, quote: bigint, avgPrice: bigint }>} - Map from price to cumulative row data.
 */

interface IUseOrderBookCumulativeTooltipDataReturn {
  base: bigint;
  quote: bigint;
  avgPrice: bigint;
}

const useOrderBookCumulativeTooltipData = (
  orders: IOrder[],
  sizeDecimals: number,
  tickDecimals: number,
  orderType: TOrderType,
): Map<number, IUseOrderBookCumulativeTooltipDataReturn> => {
  const cumulativeData = useMemo(() => {
    const ordersMap: Map<number, IOrder> = new Map(orders.entries());
    const ordersMapCumulative = new Map();

    let baseInt = BigInt(0);
    let quoteInt = BigInt(0);

    const start = orderType === EOrderTypes.bid ? ordersMap.size - 1 : 0;
    const end = orderType === EOrderTypes.bid ? -1 : ordersMap.size;
    const step = orderType === EOrderTypes.bid ? -1 : 1;

    for (let i = start; i !== end; i += step) {
      const row = ordersMap.get(i);
      if (!row) continue;

      // Floor to avoid floating-point artifacts and prevent rounding up quantities
      // Even after scaling (size * 10^decimals), JS may produce a non-integer like 44999.99999999999.
      // Floor ensures a safe integer for BigInt and avoids rounding up.
      const sizeInt = BigInt(Math.floor(row.size * 10 ** sizeDecimals));
      const priceInt = BigInt(Math.floor(row.price * 10 ** tickDecimals));

      baseInt += sizeInt;
      quoteInt += sizeInt * priceInt;

      ordersMapCumulative.set(row.price, {
        base: baseInt,
        quote: quoteInt,
        avgPrice: baseInt === BigInt(0) ? BigInt(0) : quoteInt / baseInt,
      });
    }

    return ordersMapCumulative;
  }, [orders, sizeDecimals, tickDecimals]);

  return cumulativeData;
};

export default useOrderBookCumulativeTooltipData;

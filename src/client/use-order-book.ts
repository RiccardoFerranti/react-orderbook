import { useEffect, useRef, useState } from 'react';

import { BINANCE_WS_URL } from '@/consts/config';
import { EPairs } from '@/types';

export interface IOrder {
  price: number;
  size: number;
}

export interface IOrderBook {
  bids: IOrder[];
  asks: IOrder[];
}

/**
 * Merge new order book values with previous ones while preserving references
 * for rows that haven't changed.
 *
 * This optimization prevents unnecessary re-renders of OrderBookRow components
 * when only some prices/sizes change in the real-time WebSocket stream.
 *
 * @param {IOrder[]} prevValues - The previous array of order book values.
 * @param {IOrder[]} newValues - The new array of order book values from the WebSocket.
 * @returns {IOrder[]} The merged values, reusing references where size hasn't changed.
 */
const mergeValues = (prevValues: IOrder[], newValues: IOrder[]): IOrder[] => {
  const prevMap = new Map(prevValues.map((v) => [v.price, v]));

  const mergedValues = newValues.map((value: IOrder) => {
    const equalValue = prevMap.get(value.price);

    if (equalValue && equalValue?.size === value.size) return equalValue;

    return value;
  });

  return mergedValues;
};

/**
 * React hook to provide live Binance order book for a trading pair, with throttled updates.
 *
 * Connects to the Binance WebSocket API and parses live depth updates for the specified pair.
 *
 * - Returns the top 20 levels of bids and asks by price and size.
 * - Uses throttling (default 300ms) to avoid flooding state updates.
 * - Merges new order book data to avoid unnecessary row re-renders.
 *
 * @param {string} [pair='btcusdc'] - Trading pair symbol (lowercase, e.g., 'btcusdc', 'ethusdc').
 * @param {number} [throttle=300] - Throttle time (ms) for update frequency, minimum time between updates.
 * @returns {IOrderBook} Order book with bids and asks, e.g. `{ bids: IOrder[], asks: IOrder[] }`
 *
 * @example
 * const { bids, asks } = useOrderBook('ethusdc', 200);
 * Bids: [ { price: 3500, size: 0.25 }, ... ]
 * Asks: [ { price: 3501, size: 0.1 }, ... ]
 */

export function useOrderBook(pair = EPairs.btcusdc, throttle = 300) {
  const wsRef = useRef<WebSocket | null>(null);
  const lastUpdateRef = useRef(0); // timestamp of last update

  const [orderBook, setOrderBook] = useState<IOrderBook>({
    bids: [],
    asks: [],
  });

  useEffect(() => {
    // WebSocket endpoint for real-time BTC/USDT order book depth (20 levels, updates each 100ms)
    const wsUrl = `${BINANCE_WS_URL}${pair}@depth20@100ms`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < throttle) return; // skip if too soon

      lastUpdateRef.current = now;

      const data = JSON.parse(event.data);
      console.log(data);
      // Binance sends bids & asks as [price, size] strings
      const bids: IOrder[] = data.bids.map(([price, size]: [string, string]) => ({
        price: Number(price),
        size: Number(size),
      }));

      const asks: IOrder[] = data.asks.map(([price, size]: [string, string]) => ({
        price: Number(price),
        size: Number(size),
      }));

      setOrderBook((prev) => ({
        bids: mergeValues(prev.bids, bids),
        asks: mergeValues(prev.asks, asks),
      }));
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
    };

    return () => {
      ws.close();
    };
  }, [pair]);

  return orderBook;
}

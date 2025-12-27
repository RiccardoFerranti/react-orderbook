import { useEffect, useRef, useState } from 'react';

import { BINANCE_WS_URL } from '@/consts/config';

interface IOrder {
  price: number;
  size: number;
}

interface IOrderBook {
  bids: IOrder[];
  asks: IOrder[];
}

// WebSocket endpoint for real-time BTC/USDT order book depth (20 levels, updates each 100ms)
const WS_URL = `${BINANCE_WS_URL}btcusdt@depth20@100ms`;

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

export function useOrderBook(throttle = 300) {
  const wsRef = useRef<WebSocket | null>(null);
  const lastUpdateRef = useRef(0); // timestamp of last update

  const [orderBook, setOrderBook] = useState<IOrderBook>({
    bids: [],
    asks: [],
  });

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < throttle) return; // skip if too soon

      lastUpdateRef.current = now;

      const data = JSON.parse(event.data);

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
  }, []);

  return orderBook;
}

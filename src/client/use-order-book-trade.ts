import { useEffect, useRef, useState } from 'react';

import { BINANCE_WS_URL } from '@/consts/config';
import { EOrderTypes } from '@/components/orderbook/types';

interface IUseOrderBookTrade {
  value: number;
  orderType: EOrderTypes.bid | EOrderTypes.ask;
}

/**
 * Hook for subscribing to the latest trade of a symbol on Binance order book, returns price and buy/sell.
 *
 * @typedef {Object} IUseOrderBookTrade
 * @property {number} value - Last traded price
 * @property {EOrderTypes.bid | EOrderTypes.ask} orderType - Type of the last trade ("bid" for buy, "ask" for sell)
 *
 * @param {string} symbol - Trading pair symbol (e.g., 'btcusdt')
 * @returns {IUseOrderBookTrade | null} - The latest trade price and order type, or null if not available
 *
 * @example
 * const trade = useOrderBookTrade('btcusdt');
 * if (trade) {
 *   console.log(trade.value, trade.orderType); // e.g. 26400, EOrderTypes.bid
 * }
 */

export function useOrderBookTrade(pair: string): IUseOrderBookTrade | null {
  if (!pair) throw new Error('The pair is mandatory');

  const [lastTradePrice, setLastTradePrice] = useState<IUseOrderBookTrade | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${BINANCE_WS_URL}${pair.toLowerCase()}@trade`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const trade = JSON.parse(event.data);
      setLastTradePrice({
        value: Number(trade.p),
        // true → sell, false → buy
        orderType: trade.m ? EOrderTypes.ask : EOrderTypes.bid,
      });
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
    };

    return () => ws.close();
  }, [pair]);

  return lastTradePrice;
}

import { useEffect, useRef, useState } from 'react';

import { BINANCE_WS_URL } from '@/consts/config';
import { EOrderTypes } from '@/components/orderbook/types';

interface IUseOrderBookTrade {
  value: number;
  orderType: EOrderTypes.buy | EOrderTypes.sell;
}

export function useOrderBookTrade(symbol: string): IUseOrderBookTrade | null {
  const [lastTradePrice, setLastTradePrice] = useState<IUseOrderBookTrade | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${BINANCE_WS_URL}${symbol.toLowerCase()}@trade`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const trade = JSON.parse(event.data);
      setLastTradePrice({
        value: Number(trade.p),
        // true → sell, false → buy
        orderType: trade.m ? EOrderTypes.sell : EOrderTypes.buy,
      });
    };

    ws.onerror = (err) => {
      console.error('WebSocket error', err);
    };

    return () => ws.close();
  }, [symbol]);

  return lastTradePrice;
}

export interface IOrder {
  price: number;
  size: number;
}

export interface IOrderBook {
  bids: IOrder[];
  asks: IOrder[];
}

import { useEffect, useState } from 'react';

import type { IOrderBookAdapter } from '@/components/orderbook/adapters/types';

/**
 * React hook to provide a live order book for a specified trading pair using the given adapter.
 *
 * This hook connects to an order book adapter (such as a WebSocket-based API)
 * and manages internal state for order book bids and asks. It will automatically
 * reset state and re-connect if the trading pair or adapter changes.
 *
 * @param {string} pair - Trading pair symbol (e.g., 'btcusdc', 'ethusdc') in lower-case.
 * @param {IOrderBookAdapter} adapter - Adapter providing a connect() method to receive live book data.
 * @returns {{
 *   orderBook: IOrderBook,
 *   isOrderBookBidsLoading: boolean,
 *   isOrderBookAsksLoading: boolean,
 * }}
 *   An object containing the current state of the order book and loading status for bids and asks.
 *
 * @example
 * const { orderBook, isOrderBookBidsLoading, isOrderBookAsksLoading } = useOrderBook('btcusdc', binanceOrderBookAdapter);
 */
export function useOrderBook(pair: string, adapter: IOrderBookAdapter) {
  const [orderBook, setOrderBook] = useState<IOrderBook>({
    bids: [],
    asks: [],
  });

  useEffect(() => {
    setOrderBook({ bids: [], asks: [] }); // reset on pair change

    const disconnect = adapter.connect(pair, setOrderBook);

    return disconnect;
  }, [pair, adapter]);

  return {
    orderBook,
    isOrderBookBidsLoading: orderBook.bids.length === 0,
    isOrderBookAsksLoading: orderBook.asks.length === 0,
  };
}

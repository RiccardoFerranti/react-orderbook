import { useEffect, useState } from 'react';

import type { IOrderBook, IOrderBookAdapter } from '@/components/orderbook/adapters/types';
import type { EPairs } from '@/types';

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
export function useOrderBook(pair: EPairs, adapter: IOrderBookAdapter) {
  const [orderBook, setOrderBook] = useState<IOrderBook>({
    bids: [],
    asks: [],
  });

  useEffect(() => {
    setOrderBook({ bids: [], asks: [] }); // reset on pair change

    const disconnect = adapter.connectOrderBook(pair, setOrderBook);

    return () => disconnect();
  }, [pair, adapter]);

  return {
    orderBook,
    isLoading: orderBook.bids.length === 0 || orderBook.asks.length === 0,
    capabilities: adapter.capabilities,
  };
}

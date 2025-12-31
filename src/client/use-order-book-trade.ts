import { useEffect, useState } from 'react';

import type { IOrderBookAdapter, IOrderBookTradeRaw } from '@/components/orderbook/adapters/types';
import type { EPairs } from '@/types';

/**
 * React hook to subscribe to live trades for a given trading pair using a specified order book adapter.
 *
 * This hook connects to the adapter's trade stream and returns the most recent trade received.
 * Automatically unsubscribes when the pair or adapter changes.
 *
 * @param {EPairs} pair - The trading pair symbol (e.g., 'btcusdc', 'ethusdc').
 * @param {IOrderBookAdapter} adapter - The order book adapter providing the trade subscription.
 * @returns {IOrderBookTradeRaw | null} The most recent trade, or null if no trade has been received.
 */
export function useOrderBookTrades(pair: EPairs, adapter: IOrderBookAdapter) {
  const [lastTrade, setLastTrade] = useState<IOrderBookTradeRaw | null>(null);

  useEffect(() => {
    if (!adapter.capabilities.trades || !adapter.connectTrades) return;

    const disconnect = adapter.connectTrades(pair, setLastTrade);
    return () => disconnect();
  }, [pair, adapter]);

  return lastTrade;
}

import { useCallback, useEffect, useRef, useState } from 'react';

import type { TConnectionStatus } from './types';

import type { IOrderBookAdapter, IOrderBookTradeRaw, TOrderBookUnsubscribe } from '@/components/orderbook/adapters/types';
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
// export function useOrderBookTrades(pair: EPairs, adapter: IOrderBookAdapter) {
//   const [lastTrade, setLastTrade] = useState<IOrderBookTradeRaw | null>(null);

//   useEffect(() => {
//     if (!adapter.capabilities.trades || !adapter.connectTrades) return;

//     const disconnect = adapter.connectTrades(pair, setLastTrade);
//     return () => disconnect();
//   }, [pair, adapter]);

//   return lastTrade;
// }

interface IUseOrderBookTradesReturn extends IOrderBookTradeRaw {}
interface IUseOrderBookTrades {
  pair: EPairs;
  adapter: IOrderBookAdapter;
  maxRetries?: number;
  baseRetryDelay?: number;
}

export function useOrderBookTrades({
  pair,
  adapter,
  maxRetries = 5,
  baseRetryDelay = 500,
}: IUseOrderBookTrades): IUseOrderBookTradesReturn | null {
  const [lastTrade, setLastTrade] = useState<IOrderBookTradeRaw | null>(null);
  const [status, setStatus] = useState<TConnectionStatus>('connecting');

  const disconnectRef = useRef<TOrderBookUnsubscribe | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);

  const scheduleRetry = useCallback(() => {
    if (document.hidden) return;

    if (retryCountRef.current >= maxRetries) {
      setStatus('disconnected');
      return;
    }

    // Applied exponential backoff to reduces pressure on the WebSocket server, to prevent flooding with retries when
    // the connection is unstable and to make the retry behavior more resilient in poor network conditions.
    const delay = baseRetryDelay * (retryCountRef.current + 1);
    retryCountRef.current += 1;
    setStatus('connecting');

    retryTimeoutRef.current = window.setTimeout(() => connect(), delay);
  }, [baseRetryDelay, maxRetries]);

  const connect = useCallback(() => {
    if (!adapter.connectTrades || document.hidden) return;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    disconnectRef.current?.();
    disconnectRef.current = null;

    setStatus('connecting');

    disconnectRef.current = adapter.connectTrades(
      pair,
      (trade) => {
        setLastTrade(trade);
        setStatus('connected');
        retryCountRef.current = 0;
      },
      scheduleRetry,
    );
  }, [adapter, pair, scheduleRetry]);

  useEffect(() => {
    connect();
    return () => {
      retryTimeoutRef.current && clearTimeout(retryTimeoutRef.current);
      disconnectRef.current?.();
    };
  }, [connect]);

  useEffect(() => {
    const handleOnline = () => {
      if (status !== 'connected') {
        retryCountRef.current = 0;
        connect();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [connect, status]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        disconnectRef.current?.();
        disconnectRef.current = null;
        setStatus('disconnected');
      } else {
        if (status !== 'connected') {
          retryCountRef.current = 0;
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connect, status]);

  return lastTrade;
}

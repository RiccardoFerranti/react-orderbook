import { useCallback, useEffect, useRef, useState } from 'react';

import type { IOrderBook, IOrderBookAdapter, TOrderBookUnsubscribe } from '@/components/orderbook/adapters/types';
import type { EPairs } from '@/types';

export type TConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface IUseOrderBook {
  orderBook: IOrderBook;
  isLoading: boolean;
  capabilities: IOrderBookAdapter['capabilities'];
  status: TConnectionStatus;
}

/**
 * React hook to provide a live, resilient order book connection for a specified trading pair and adapter.
 *
 * This hook manages the order book state, connection status, and reconnection logic with throttling and
 * exponential backoff in case of connection issues. It resets when the trading pair or adapter changes.
 *
 * @param {EPairs} pair - The trading pair symbol (e.g., 'btcusdc', 'ethusdc').
 * @param {IOrderBookAdapter} adapter - The adapter with a connectOrderBook method supplying live order book data.
 * @param {number} [throttle=500] - Minimum time in ms between updates to avoid excessive re-renders.
 * @param {number} [maxRetries=5] - Maximum number of automatic connection retries before giving up.
 * @param {number} [baseRetryDelay=2000] - Base delay in ms for exponential backoff when retrying a failed connection.
 * @returns {IUseOrderBook} An object with the latest order book, loading status, connection capabilities, and connection status.
 */
export function useOrderBook(
  pair: EPairs,
  adapter: IOrderBookAdapter,
  throttle = 500,
  maxRetries = 5,
  baseRetryDelay = 2000,
): IUseOrderBook {
  const [orderBook, setOrderBook] = useState<IOrderBook>({ bids: [], asks: [] });
  const [status, setStatus] = useState<TConnectionStatus>('connecting');

  const disconnectRef = useRef<TOrderBookUnsubscribe | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  // Schedule a retry with exponential backoff
  const scheduleRetry = useCallback(() => {
    if (document.hidden) return;

    if (retryCountRef.current >= maxRetries) {
      setStatus('disconnected');
      return;
    }

    // Applied wxponential backoff to reduces pressure on the WebSocket server, to prevent flooding with retries when
    // the connection is unstable and to make the retry behavior more resilient in poor network conditions.
    const delay = baseRetryDelay * 2 ** retryCountRef.current;
    retryCountRef.current += 1;
    setStatus('connecting');

    retryTimeoutRef.current = window.setTimeout(() => {
      connect();
    }, delay);
  }, [baseRetryDelay, maxRetries]);

  const connect = useCallback(() => {
    if (!adapter.connectOrderBook || document.hidden) return;

    // Cancel previous retry to avoid overlap
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Disconnect previous WS if exists
    disconnectRef.current?.();
    disconnectRef.current = null;

    setStatus('connecting');

    disconnectRef.current = adapter.connectOrderBook(
      pair,
      (data) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < throttle) return;

        lastUpdateRef.current = now;
        setOrderBook(data);
        setStatus('connected');
        retryCountRef.current = 0; // reset retries
      },
      scheduleRetry,
    );
  }, [adapter, pair, throttle, scheduleRetry]);

  // Initial connect
  useEffect(() => {
    connect();
    return () => {
      retryTimeoutRef.current && clearTimeout(retryTimeoutRef.current);
      disconnectRef.current?.();
    };
  }, [connect]);

  // Reconnect on network restore
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

  // Handle tab visibility
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

  return {
    orderBook,
    isLoading: orderBook.bids.length === 0 || orderBook.asks.length === 0,
    capabilities: adapter.capabilities,
    status,
  };
}

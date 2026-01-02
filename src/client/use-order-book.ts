import { useCallback, useEffect, useRef, useState } from 'react';

import { EConnectStuses, type TConnectionStatus } from './types';

import type { IOrderBook, IOrderBookAdapter, TOrderBookUnsubscribe } from '@/components/orderbook/adapters/types';
import type { EPairs } from '@/types';

interface IUseOrderBookReturn {
  orderBook: IOrderBook;
  isLoading: boolean;
  capabilities: IOrderBookAdapter['capabilities'];
  isInitialOrdersLoading: boolean;
  status: TConnectionStatus;
}

interface IUseOrderBook {
  pair: EPairs;
  adapter: IOrderBookAdapter;
  throttle?: number;
  maxRetries?: number;
  baseRetryDelay?: number;
  healthRetryDelay?: number;
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
export function useOrderBook({
  pair,
  adapter,
  throttle = 500,
  maxRetries = 5,
  baseRetryDelay = 500,
  healthRetryDelay = 10000,
}: IUseOrderBook): IUseOrderBookReturn {
  // Stores bids and asks received from the WS
  const [orderBook, setOrderBook] = useState<IOrderBook>({ bids: [], asks: [] });

  // Tracks the connection status: 'connecting' | 'connected' | 'disconnected'
  const [status, setStatus] = useState<TConnectionStatus>(EConnectStuses.connecting);

  // References to manage WS disconnect function, retry timeout, health check interval, and last Update
  const disconnectRef = useRef<TOrderBookUnsubscribe | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  const hasEverConnectedRef = useRef(false);

  /**
   * scheduleRetry
   * Called when the WebSocket fails or closes unexpectedly.
   * Implements limited retries with incremental delay (exponential backoff).
   * Stops retrying after maxRetries and sets status to 'disconnected'.
   */
  const scheduleRetry = useCallback(() => {
    if (document.hidden) return; // Do not retry if tab is hidden

    if (retryCountRef.current >= maxRetries) {
      setStatus(EConnectStuses.disconnected);
      return;
    }

    // Applied exponential backoff to reduces pressure on the WebSocket server, to prevent flooding with retries when
    // the connection is unstable and to make the retry behavior more resilient in poor network conditions.
    const delay = baseRetryDelay * (retryCountRef.current + 1);
    retryCountRef.current += 1;
    setStatus(EConnectStuses.connecting);

    retryTimeoutRef.current = window.setTimeout(() => {
      connect();
    }, delay);
  }, [baseRetryDelay, maxRetries]);

  /**
   * connect
   * Initiates a WebSocket connection via adapter.connectTrades.
   * Clears previous retries and disconnects any existing WS to prevent overlap.
   * Resets retry count and updates status on successful trade messages.
   */
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

    setStatus(EConnectStuses.connecting);

    disconnectRef.current = adapter.connectOrderBook(
      pair,
      (data) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < throttle) return;

        lastUpdateRef.current = now;
        setOrderBook(data);
        setStatus(EConnectStuses.connected);
        retryCountRef.current = 0; // reset retries
        hasEverConnectedRef.current = true;
      },
      scheduleRetry, // Adapter will call this on WS error/close
    );
  }, [adapter, pair, throttle, scheduleRetry]);

  /**
   * Initial connection when hook mounts
   */
  useEffect(() => {
    connect();
    return () => {
      retryTimeoutRef.current && clearTimeout(retryTimeoutRef.current);
      disconnectRef.current?.();
    };
  }, [connect]);

  /**
   * Reconnect when the network comes back online
   */
  useEffect(() => {
    const handleOnline = () => {
      if (status !== EConnectStuses.connected) {
        retryCountRef.current = 0;
        connect();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [connect, status]);

  /**
   * Handle tab visibility changes:
   * - Disconnect WS when tab is hidden
   * - Reconnect when tab becomes visible
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        disconnectRef.current?.();
        disconnectRef.current = null;
        setStatus(EConnectStuses.disconnected);
      } else {
        if (status !== EConnectStuses.connected) {
          retryCountRef.current = 0;
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connect, status]);

  /**
   * Periodic health check
   * Runs only when status is 'disconnected' after exhausting maxRetries.
   * Tries to reconnect every healthRetryDelay ms until successful.
   */
  useEffect(() => {
    if (status !== EConnectStuses.disconnected) return;

    retryCountRef.current = 0;

    const id = window.setInterval(() => {
      connect();
    }, healthRetryDelay); // health probe interval

    return () => clearInterval(id);
  }, [status, connect]);

  return {
    orderBook,
    isLoading: orderBook.bids.length === 0 || orderBook.asks.length === 0,
    capabilities: adapter.capabilities,
    isInitialOrdersLoading: !hasEverConnectedRef.current && status === EConnectStuses.connecting,
    status,
  };
}

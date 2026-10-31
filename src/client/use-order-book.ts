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
 * incremental retry delays in case of connection issues. It resets when the trading pair or adapter changes.
 *
 * @param {EPairs} pair - The trading pair symbol (e.g., 'btcusdc', 'ethusdc').
 * @param {IOrderBookAdapter} adapter - The adapter with a connectOrderBook method supplying live order book data.
 * @param {number} [throttle=500] - Minimum time in ms between updates to avoid excessive re-renders.
 * @param {number} [maxRetries=5] - Maximum number of automatic connection retries before giving up.
 * @param {number} [baseRetryDelay=500] - Base delay in ms for incremental retries after a failed connection.
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

  // References to manage the socket, retries, health checks, and throttled updates.
  const disconnectRef = useRef<TOrderBookUnsubscribe | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number | null>(null);
  // Keep the existing health check interval ID so offline/hidden can cancel it immediately.
  const healthIntervalRef = useRef<number | null>(null);
  // Invalidates callbacks from sockets that were closed or replaced.
  const connectionIdRef = useRef(0);
  // A scheduled retry must use the latest pair and adapter after a render.
  const connectRef = useRef<() => void>(() => {});

  const hasEverConnectedRef = useRef(false);

  const stopConnection = useCallback(() => {
    connectionIdRef.current += 1;

    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (healthIntervalRef.current !== null) {
      clearInterval(healthIntervalRef.current);
      healthIntervalRef.current = null;
    }

    const disconnect = disconnectRef.current;
    disconnectRef.current = null;
    disconnect?.();
  }, []);

  /**
   * scheduleRetry
   * Called when the WebSocket fails or closes unexpectedly.
   * Implements limited retries with an incremental delay.
   * Stops retrying after maxRetries and sets status to 'disconnected'.
   */
  const scheduleRetry = useCallback(() => {
    if (document.hidden || !navigator.onLine || retryTimeoutRef.current !== null) return;

    if (retryCountRef.current >= maxRetries) {
      setStatus(EConnectStuses.disconnected);
      return;
    }

    // Increase the delay between attempts to avoid flooding the server during connection failures.
    const delay = baseRetryDelay * (retryCountRef.current + 1);
    retryCountRef.current += 1;
    setStatus(EConnectStuses.connecting);

    retryTimeoutRef.current = window.setTimeout(() => {
      retryTimeoutRef.current = null;
      connectRef.current();
    }, delay);
  }, [baseRetryDelay, maxRetries]);

  /**
   * connect
   * Initiates a WebSocket connection via adapter.connectOrderBook.
   * Clears previous retries and disconnects any existing WS to prevent overlap.
   * Resets retry count and updates status on successful trade messages.
   */
  const connect = useCallback(() => {
    if (!navigator.onLine) {
      stopConnection();
      setStatus(EConnectStuses.disconnected);
      return;
    }
    if (!adapter.connectOrderBook || document.hidden) {
      setStatus(EConnectStuses.disconnected);
      return;
    }

    stopConnection();
    lastUpdateRef.current = null;
    const connectionId = connectionIdRef.current;

    setStatus(EConnectStuses.connecting);

    const disconnect = adapter.connectOrderBook(
      pair,
      (data) => {
        if (connectionIdRef.current !== connectionId || !navigator.onLine || document.hidden) return;

        const now = Date.now();
        if (lastUpdateRef.current !== null && now - lastUpdateRef.current < throttle) return;

        lastUpdateRef.current = now;
        setOrderBook(data);
        setStatus(EConnectStuses.connected);
        retryCountRef.current = 0; // reset retries
        hasEverConnectedRef.current = true;
      },
      () => {
        if (connectionIdRef.current !== connectionId) return;
        stopConnection();
        scheduleRetry();
      },
    );
    if (connectionIdRef.current === connectionId) disconnectRef.current = disconnect;
    else disconnect();
  }, [adapter, pair, throttle, scheduleRetry, stopConnection]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  /**
   * Initial connection when hook mounts
   */
  useEffect(() => {
    connect();
    return () => stopConnection();
  }, [connect, stopConnection]);

  /**
   * Stop immediately when the browser goes offline.
   */
  useEffect(() => {
    const handleOffline = () => {
      stopConnection();
      setStatus(EConnectStuses.disconnected);
    };

    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [stopConnection]);

  /**
   * Reconnect promptly when the browser comes back online.
   */
  useEffect(() => {
    const handleOnline = () => {
      if (disconnectRef.current === null) {
        retryCountRef.current = 0;
        connect();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [connect]);

  /**
   * Handle tab visibility changes:
   * - Disconnect WS when tab is hidden
   * - Reconnect when tab becomes visible
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopConnection();
        setStatus(EConnectStuses.disconnected);
      } else if (disconnectRef.current === null) {
        retryCountRef.current = 0;
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connect, stopConnection]);

  /**
   * Periodic health check
   * Runs only when status is 'disconnected' after exhausting maxRetries.
   * Tries to reconnect every healthRetryDelay ms until successful.
   */
  useEffect(() => {
    if (status !== EConnectStuses.disconnected || !navigator.onLine || document.hidden) return;

    retryCountRef.current = 0;

    healthIntervalRef.current = window.setInterval(() => {
      connect();
    }, healthRetryDelay); // health probe interval

    return () => {
      if (healthIntervalRef.current !== null) {
        clearInterval(healthIntervalRef.current);
        healthIntervalRef.current = null;
      }
    };
  }, [status, connect, healthRetryDelay]);

  return {
    orderBook,
    isLoading: orderBook.bids.length === 0 || orderBook.asks.length === 0,
    capabilities: adapter.capabilities,
    isInitialOrdersLoading: !hasEverConnectedRef.current && status === EConnectStuses.connecting,
    status,
  };
}

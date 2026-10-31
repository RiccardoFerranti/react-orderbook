import { useCallback, useEffect, useRef, useState } from 'react';

import { EConnectStuses, type TConnectionStatus } from './types';

import type { IOrderBookAdapter, IOrderBookTradeRaw, TOrderBookUnsubscribe } from '@/components/orderbook/adapters/types';
import type { EPairs } from '@/types';
import type { EOrderTypes } from '@/components/orderbook/types';

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

interface IUseOrderBookTradesReturn {
  price?: number;
  orderType?: EOrderTypes.bid | EOrderTypes.ask;
  status: TConnectionStatus;
}

interface IUseOrderBookTrades {
  pair: EPairs;
  adapter: IOrderBookAdapter;
  maxRetries?: number;
  baseRetryDelay?: number;
  healthRetryDelay?: number;
}

export function useOrderBookTrades({
  pair,
  adapter,
  maxRetries = 5,
  baseRetryDelay = 500,
  healthRetryDelay = 10000,
}: IUseOrderBookTrades): IUseOrderBookTradesReturn {
  // Stores the most recent trade received from the WS
  const [lastTrade, setLastTrade] = useState<IOrderBookTradeRaw | null>(null);

  // Tracks the connection status: 'connecting' | 'connected' | 'disconnected'
  const [status, setStatus] = useState<TConnectionStatus>(EConnectStuses.connecting);

  // References to manage WS disconnect function, retry timeout, and health check interval
  const disconnectRef = useRef<TOrderBookUnsubscribe | null>(null);
  const retryCountRef = useRef(0); // Tracks retries for incremental delays
  const retryTimeoutRef = useRef<number | null>(null);
  // Keep the existing health check interval ID so offline/hidden can cancel it immediately.
  const healthIntervalRef = useRef<number | null>(null);
  // Invalidates callbacks from sockets that were closed or replaced.
  const connectionIdRef = useRef(0);
  // A scheduled retry must use the latest pair and adapter after a render.
  const connectRef = useRef<() => void>(() => {});

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
      setStatus(EConnectStuses.disconnected); // Stop retrying after max attempts
      return;
    }

    // Incremental delay
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
   * Initiates a WebSocket connection via adapter.connectTrades.
   * Clears previous retries and disconnects any existing WS to prevent overlap.
   * Resets retry count and updates status on successful trade messages.
   */
  const connect = useCallback(() => {
    if (!navigator.onLine) {
      stopConnection();
      setStatus(EConnectStuses.disconnected);
      return;
    }
    if (!adapter.connectTrades || document.hidden) {
      setStatus(EConnectStuses.disconnected);
      return;
    }

    stopConnection();
    const connectionId = connectionIdRef.current;

    setStatus(EConnectStuses.connecting);

    const disconnect = adapter.connectTrades(
      pair,
      (trade) => {
        if (connectionIdRef.current !== connectionId || !navigator.onLine || document.hidden) return;

        setLastTrade(trade);
        setStatus(EConnectStuses.connected);
        retryCountRef.current = 0; // reset retries
      },
      () => {
        if (connectionIdRef.current !== connectionId) return;
        stopConnection();
        scheduleRetry();
      },
    );
    if (connectionIdRef.current === connectionId) disconnectRef.current = disconnect;
    else disconnect();
  }, [adapter, pair, scheduleRetry, stopConnection]);

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
    price: lastTrade?.price,
    orderType: lastTrade?.orderType,
    status,
  };
}

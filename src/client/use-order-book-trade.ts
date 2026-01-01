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
  const retryCountRef = useRef(0); // Tracks retries for exponential backoff
  const retryTimeoutRef = useRef<number | null>(null);

  /**
   * scheduleRetry
   * Called when the WebSocket fails or closes unexpectedly.
   * Implements limited retries with incremental delay (exponential backoff).
   * Stops retrying after maxRetries and sets status to 'disconnected'.
   */
  const scheduleRetry = useCallback(() => {
    if (document.hidden) return; // Do not retry if tab is hidden

    if (retryCountRef.current >= maxRetries) {
      setStatus(EConnectStuses.disconnected); // Stop retrying after max attempts
      return;
    }

    // Incremental delay
    const delay = baseRetryDelay * (retryCountRef.current + 1);
    retryCountRef.current += 1;
    setStatus(EConnectStuses.connecting);

    retryTimeoutRef.current = window.setTimeout(() => connect(), delay);
  }, [baseRetryDelay, maxRetries]);

  /**
   * connect
   * Initiates a WebSocket connection via adapter.connectTrades.
   * Clears previous retries and disconnects any existing WS to prevent overlap.
   * Resets retry count and updates status on successful trade messages.
   */
  const connect = useCallback(() => {
    if (!adapter.connectTrades || document.hidden) return;

    // Cancel previous retry to avoid overlap
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Disconnect previous WS if exists
    disconnectRef.current?.();
    disconnectRef.current = null;

    setStatus(EConnectStuses.connecting);

    disconnectRef.current = adapter.connectTrades(
      pair,
      (trade) => {
        setLastTrade(trade);
        setStatus(EConnectStuses.connected);
        retryCountRef.current = 0; // reset retries
      },
      scheduleRetry, // Adapter will call this on WS error/close
    );
  }, [adapter, pair, scheduleRetry]);

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
    price: lastTrade?.price,
    orderType: lastTrade?.orderType,
    status,
  };
}

import type { IOrder, IOrderBook, IOrderBookAdapter, IOrderBookTradeRaw } from '../types';
import mergeValues from './merge-values';
import { EOrderTypes } from '../../types';

import { BINANCE_DEPTH_LEVEL, BINANCE_UPDATE_MS, BINANCE_WS_URL } from '@/consts/config';

/**
 * React hook to provide live Binance order book for a trading pair, with throttled updates.
 *
 * Connects to the Binance WebSocket API and parses live depth updates for the specified pair.
 *
 * - Returns the top 20 levels of bids and asks by price and size.
 * - Uses throttling (default 300ms) to avoid flooding state updates.
 * - Merges new order book data to avoid unnecessary row re-renders.
 *
 * @param {string} [pair='btcusdc'] - Trading pair symbol (lowercase, e.g., 'btcusdc', 'ethusdc').
 * @param {number} [throttle=300] - Throttle time (ms) for update frequency, minimum time between updates.
 * @returns {IOrderBook} Order book with bids and asks, e.g. `{ bids: IOrder[], asks: IOrder[] }`
 *
 * @example
 * const { bids, asks } = useOrderBook('ethusdc', 200);
 * Bids: [ { price: 3500, size: 0.25 }, ... ]
 * Asks: [ { price: 3501, size: 0.1 }, ... ]
 */

export const binanceOrderBookAdapter: IOrderBookAdapter = {
  id: 'binance',
  version: '1.0.0',

  capabilities: {
    depth: true,
    trades: true,
  },

  connectOrderBook(pair, onData, onDisconnect) {
    const wsUrl = `${BINANCE_WS_URL}${pair}@depth${BINANCE_DEPTH_LEVEL}@${BINANCE_UPDATE_MS}ms`;
    const ws = new WebSocket(wsUrl);

    // let lastUpdate = 0;
    let current: IOrderBook = { bids: [], asks: [] };

    // ws.onmessage = (event) => {
    //   const now = Date.now();
    //   if (now - lastUpdate < 500) return;
    //   lastUpdate = now;

    //   const data = JSON.parse(event.data);

    //   const bids: IOrder[] = data.bids.map(([price, size]: [string, string]) => ({
    //     price: Number(price),
    //     size: Number(size),
    //   }));

    //   const asks: IOrder[] = data.asks.map(([price, size]: [string, string]) => ({
    //     price: Number(price),
    //     size: Number(size),
    //   }));

    //   current = {
    //     bids: mergeValues(current.bids, bids),
    //     asks: mergeValues(current.asks, asks),
    //   };

    //   onData(current);
    // };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      const bids: IOrder[] = data.bids.map(([price, size]: [string, string]) => ({
        price: Number(price),
        size: Number(size),
      }));

      const asks: IOrder[] = data.asks.map(([price, size]: [string, string]) => ({
        price: Number(price),
        size: Number(size),
      }));

      current = {
        bids: mergeValues(current.bids, bids),
        asks: mergeValues(current.asks, asks),
      };

      onData(current); // the hook will throttle updates
    };

    ws.onerror = () => {
      console.warn('[Binance WS] error');
      () => onDisconnect();
    };

    ws.onclose = (event: CloseEvent) => {
      console.warn('[Binance WS] closed', event.code, event.reason || '(no reason)');
      onDisconnect();
    };

    return () => ws.close();
  },

  connectTrades(pair, onTrade) {
    const wsUrl = `${BINANCE_WS_URL}${pair.toLowerCase()}@trade`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Normalize to our internal format
      const trade: IOrderBookTradeRaw = {
        price: Number(data.p),
        orderType: data.m ? EOrderTypes.ask : EOrderTypes.bid,
      };

      onTrade(trade);
    };

    ws.onerror = (err) => {
      console.error('Binance WS error', err);
    };

    return () => ws.close();
  },
};

import type { EOrderTypes } from '@/components/orderbook/types';
import type { EPairs } from '@/types';

export type TOrderBookUnsubscribe = () => void;

export interface IOrderBookAdapterCapabilities {
  depth: boolean;
  trades: boolean;
}

export interface IOrderBookTradeRaw {
  price: number;
  orderType: EOrderTypes.bid | EOrderTypes.ask;
}

export interface IOrder {
  price: number;
  size: number;
}

export interface IOrderBook {
  bids: IOrder[];
  asks: IOrder[];
}

export interface IOrderBookAdapter {
  id: string;
  version: string;
  capabilities: IOrderBookAdapterCapabilities;
  connectOrderBook: (pair: EPairs, onData: (data: IOrderBook) => void, onDisconnect: () => void) => TOrderBookUnsubscribe;
  connectTrades: (pair: EPairs, onTrade: (data: IOrderBookTradeRaw) => void) => TOrderBookUnsubscribe;
}

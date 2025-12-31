import type { IOrderBook } from '@/client/use-order-book';

export type TOrderBookUnsubscribe = () => void;

export interface IOrderBookAdapter {
  connect: (pair: string, onData: (data: IOrderBook) => void) => TOrderBookUnsubscribe;
}

import { renderHook } from '@testing-library/react';

import { useOrderBookTrades } from './use-order-book-trade';
import { EConnectStuses } from './types';

import type { IOrderBookAdapter, IOrderBookTradeRaw } from '@/components/orderbook/adapters/types';
import { EPairs } from '@/types';
import { EOrderTypes } from '@/components/orderbook/types';

describe('useOrderBookTrades', () => {
  const mockedPair = EPairs.btcusdc;

  // Adapter mock
  const adapter: IOrderBookAdapter = {
    id: 'test-adapter',
    version: '1.0.0',
    capabilities: {
      depth: true,
      trades: true,
    },
    connectOrderBook: jest.fn(),
    connectTrades: jest.fn(),
  };

  const fakeTrade: IOrderBookTradeRaw = {
    price: 123,
    orderType: EOrderTypes.bid,
  };

  it('should initialize with undefined price/orderType and connecting status', () => {
    const { result } = renderHook(() => useOrderBookTrades({ pair: mockedPair, adapter }));

    expect(result.current.price).toBeUndefined();
    expect(result.current.orderType).toBeUndefined();
    expect(result.current.status).toBe(EConnectStuses.connecting);
  });

  it('should update price, orderType and status when adapter callback is called', () => {
    // Mock connectTrades to call the callback immediately
    adapter.connectTrades = (_pair, onTrade) => {
      onTrade(fakeTrade);
      return () => {}; // unsubscribe
    };

    const { result } = renderHook(() => useOrderBookTrades({ pair: mockedPair, adapter }));

    expect(result.current.price).toBe(fakeTrade.price);
    expect(result.current.orderType).toBe(fakeTrade.orderType);
    expect(result.current.status).toBe(EConnectStuses.connected);
  });

  it('should call disconnect function on unmount', () => {
    const disconnectMock = jest.fn();
    adapter.connectTrades = () => disconnectMock;

    const { unmount } = renderHook(() => useOrderBookTrades({ pair: mockedPair, adapter }));

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });
});

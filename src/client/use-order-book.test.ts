import { renderHook } from '@testing-library/react';

import type { IOrderBookAdapter, IOrderBook } from '@/components/orderbook/adapters/types';
import { useOrderBook } from '@/client/use-order-book';
import { EConnectStuses } from '@/client/types';
import { EPairs } from '@/types';

describe('useOrderBook', () => {
  const mockedPair = EPairs.btcusdc;

  // Simple adapter mock
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

  const fakeOrderBook: IOrderBook = {
    bids: [{ price: 1, size: 2 }],
    asks: [{ price: 3, size: 4 }],
  };

  it('should initialize with empty `orderBook` and `connecting status`', () => {
    const { result } = renderHook(() => useOrderBook({ pair: mockedPair, adapter }));
    expect(result.current.orderBook).toEqual({ bids: [], asks: [] });
    expect(result.current.status).toBe(EConnectStuses.connecting);
    expect(result.current.isLoading).toBe(true);
  });

  it('should update `orderBook` and `status` when adapter callback is called', () => {
    // Mock connectOrderBook to call the callback immediately
    adapter.connectOrderBook = (_pair, callback) => {
      callback(fakeOrderBook);
      return () => {}; // return unsubscribe
    };

    const { result } = renderHook(
      () => useOrderBook({ pair: mockedPair, adapter, throttle: 0 }), // no throttle for test
    );

    expect(result.current.orderBook).toEqual(fakeOrderBook);
    expect(result.current.status).toBe(EConnectStuses.connected);
    expect(result.current.isLoading).toBe(false);
  });

  it('should call `disconnect` function on unmount', () => {
    const disconnectMock = jest.fn();
    adapter.connectOrderBook = () => disconnectMock;

    const { unmount } = renderHook(() => useOrderBook({ pair: mockedPair, adapter }));

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });
});

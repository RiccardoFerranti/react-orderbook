import { act, renderHook } from '@testing-library/react';

import { EConnectStuses } from '@/client/types';
import { useOrderBookTrades } from '@/client/use-order-book-trade';
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

describe('useOrderBookTrades network recovery', () => {
  const pair = EPairs.btcusdc;
  const trade: IOrderBookTradeRaw = { price: 123, orderType: EOrderTypes.bid };

  function createAdapter() {
    const connections: {
      onTrade: (data: IOrderBookTradeRaw) => void;
      onDisconnect: () => void;
      disconnect: jest.Mock;
    }[] = [];
    const adapter: IOrderBookAdapter = {
      id: 'test-adapter',
      version: '1.0.0',
      capabilities: { depth: true, trades: true },
      connectOrderBook: jest.fn(),
      connectTrades: jest.fn((_pair, onTrade, onDisconnect) => {
        const disconnect = jest.fn();
        connections.push({ onTrade, onDisconnect, disconnect });
        return disconnect;
      }),
    };
    return { adapter, connections };
  }

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should disconnect immediately offline and reconnect only after a new trade', () => {
    const online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { adapter, connections } = createAdapter();
    const { result } = renderHook(() => useOrderBookTrades({ pair, adapter }));

    act(() => connections[0].onTrade(trade));
    expect(result.current.status).toBe(EConnectStuses.connected);

    online.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current.status).toBe(EConnectStuses.disconnected);
    expect(connections[0].disconnect).toHaveBeenCalledTimes(1);

    act(() => connections[0].onTrade(trade));
    expect(result.current.status).toBe(EConnectStuses.disconnected);

    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(connections).toHaveLength(2);
    expect(result.current.status).toBe(EConnectStuses.connecting);

    act(() => connections[0].onDisconnect());
    act(() => jest.advanceTimersByTime(1000));
    expect(connections).toHaveLength(2);

    act(() => connections[1].onTrade(trade));
    expect(result.current.status).toBe(EConnectStuses.connected);
  });

  it('should cancel a pending trade retry when going offline', () => {
    const online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { adapter, connections } = createAdapter();
    const { result } = renderHook(() => useOrderBookTrades({ pair, adapter, baseRetryDelay: 500 }));

    act(() => connections[0].onDisconnect());
    online.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event('offline')));
    act(() => jest.advanceTimersByTime(1000));
    expect(connections).toHaveLength(1);
    expect(result.current.status).toBe(EConnectStuses.disconnected);

    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(connections).toHaveLength(2);
    act(() => jest.advanceTimersByTime(1000));
    expect(connections).toHaveLength(2);
  });

  it('should keep the same trade socket during repeated online and visible events', () => {
    const online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const { adapter, connections } = createAdapter();
    renderHook(() => useOrderBookTrades({ pair, adapter }));

    online.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event('offline')));
    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(connections).toHaveLength(2);

    act(() => window.dispatchEvent(new Event('online')));
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(connections).toHaveLength(2);
    expect(connections[1].disconnect).not.toHaveBeenCalled();
  });

  it('should wait online when mounted offline and clean up on unmount', () => {
    const online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { adapter, connections } = createAdapter();
    const { result, unmount } = renderHook(() => useOrderBookTrades({ pair, adapter }));

    expect(result.current.status).toBe(EConnectStuses.disconnected);
    expect(connections).toHaveLength(0);
    act(() => jest.advanceTimersByTime(30000));
    expect(connections).toHaveLength(0);

    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(connections).toHaveLength(1);

    unmount();
    expect(connections[0].disconnect).toHaveBeenCalledTimes(1);
    act(() => window.dispatchEvent(new Event('online')));
    expect(connections).toHaveLength(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('should wait for the tab to become visible when mounted hidden', () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    const { adapter, connections } = createAdapter();
    const { result } = renderHook(() => useOrderBookTrades({ pair, adapter }));

    expect(result.current.status).toBe(EConnectStuses.disconnected);
    expect(connections).toHaveLength(0);

    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current.status).toBe(EConnectStuses.connecting);
    expect(connections).toHaveLength(1);
  });

  it('should retain normal retry behavior and reset the delay after a trade', () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { adapter, connections } = createAdapter();
    const { result } = renderHook(() => useOrderBookTrades({ pair, adapter, baseRetryDelay: 100 }));

    act(() => connections[0].onDisconnect());
    act(() => jest.advanceTimersByTime(100));
    expect(connections).toHaveLength(2);

    act(() => connections[1].onTrade(trade));
    expect(result.current.status).toBe(EConnectStuses.connected);

    act(() => connections[1].onDisconnect());
    act(() => jest.advanceTimersByTime(100));
    expect(connections).toHaveLength(3);
  });

  it('should retry the currently selected pair after it changes', () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { adapter, connections } = createAdapter();
    const { rerender } = renderHook(
      ({ selectedPair }) => useOrderBookTrades({ pair: selectedPair, adapter, baseRetryDelay: 100 }),
      { initialProps: { selectedPair: EPairs.btcusdc } },
    );

    rerender({ selectedPair: EPairs.ethusdc });
    expect(adapter.connectTrades).toHaveBeenLastCalledWith(EPairs.ethusdc, expect.any(Function), expect.any(Function));

    act(() => connections[1].onDisconnect());
    act(() => jest.advanceTimersByTime(100));
    expect(adapter.connectTrades).toHaveBeenLastCalledWith(EPairs.ethusdc, expect.any(Function), expect.any(Function));
  });
});

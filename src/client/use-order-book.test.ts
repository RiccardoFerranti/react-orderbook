import { act, renderHook } from '@testing-library/react';

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

describe('useOrderBook network recovery', () => {
  const pair = EPairs.btcusdc;
  const book: IOrderBook = {
    bids: [{ price: 1, size: 2 }],
    asks: [{ price: 3, size: 4 }],
  };

  function createAdapter() {
    const connections: {
      onData: (data: IOrderBook) => void;
      onDisconnect: () => void;
      disconnect: jest.Mock;
    }[] = [];
    const adapter: IOrderBookAdapter = {
      id: 'test-adapter',
      version: '1.0.0',
      capabilities: { depth: true, trades: true },
      connectOrderBook: jest.fn((_pair, onData, onDisconnect) => {
        const disconnect = jest.fn();
        connections.push({ onData, onDisconnect, disconnect });
        return disconnect;
      }),
      connectTrades: jest.fn(),
    };
    return { adapter, connections };
  }

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should disconnect immediately offline and reconnect only after fresh order book data', () => {
    const online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { adapter, connections } = createAdapter();
    const { result } = renderHook(() => useOrderBook({ pair, adapter, throttle: 500 }));

    act(() => connections[0].onData(book));
    expect(result.current.status).toBe(EConnectStuses.connected);

    online.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current.status).toBe(EConnectStuses.disconnected);
    expect(connections[0].disconnect).toHaveBeenCalledTimes(1);

    act(() => connections[0].onData(book));
    expect(result.current.status).toBe(EConnectStuses.disconnected);
    act(() => jest.advanceTimersByTime(20000));
    expect(connections).toHaveLength(1);

    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(connections).toHaveLength(2);
    expect(result.current.status).toBe(EConnectStuses.connecting);

    act(() => connections[0].onDisconnect());
    act(() => jest.advanceTimersByTime(1000));
    expect(connections).toHaveLength(2);

    act(() => connections[1].onData(book));
    expect(result.current.status).toBe(EConnectStuses.connected);
  });

  it('should cancel a pending retry offline and avoid a duplicate reconnect online', () => {
    const online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { adapter, connections } = createAdapter();
    const { result } = renderHook(() => useOrderBook({ pair, adapter, baseRetryDelay: 500 }));

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

  it('should keep the same socket during repeated online and visible events', () => {
    const online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const { adapter, connections } = createAdapter();
    renderHook(() => useOrderBook({ pair, adapter }));

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

  it('should wait for the browser to come online when mounted offline', () => {
    const online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { adapter, connections } = createAdapter();
    const { result } = renderHook(() => useOrderBook({ pair, adapter }));

    expect(result.current.status).toBe(EConnectStuses.disconnected);
    expect(connections).toHaveLength(0);
    act(() => jest.advanceTimersByTime(30000));
    expect(connections).toHaveLength(0);

    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(result.current.status).toBe(EConnectStuses.connecting);
    expect(connections).toHaveLength(1);
  });

  it('should wait for the tab to become visible when mounted hidden', () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    const { adapter, connections } = createAdapter();
    const { result } = renderHook(() => useOrderBook({ pair, adapter }));

    expect(result.current.status).toBe(EConnectStuses.disconnected);
    expect(connections).toHaveLength(0);

    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current.status).toBe(EConnectStuses.connecting);
    expect(connections).toHaveLength(1);
  });

  it('should stop health probes offline after retries are exhausted', () => {
    const online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { adapter, connections } = createAdapter();
    const { result } = renderHook(() =>
      useOrderBook({ pair, adapter, maxRetries: 1, baseRetryDelay: 100, healthRetryDelay: 1000 }),
    );

    act(() => connections[0].onDisconnect());
    act(() => jest.advanceTimersByTime(100));
    expect(connections).toHaveLength(2);

    act(() => connections[1].onDisconnect());
    expect(result.current.status).toBe(EConnectStuses.disconnected);

    online.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event('offline')));
    act(() => jest.advanceTimersByTime(5000));
    expect(connections).toHaveLength(2);
    expect(jest.getTimerCount()).toBe(0);

    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(connections).toHaveLength(3);
    expect(result.current.status).toBe(EConnectStuses.connecting);
  });

  it('should replace the socket on pair change and ignore the old socket', () => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { adapter, connections } = createAdapter();
    const { result, rerender } = renderHook(
      ({ selectedPair }) => useOrderBook({ pair: selectedPair, adapter, baseRetryDelay: 100 }),
      { initialProps: { selectedPair: EPairs.btcusdc } },
    );

    rerender({ selectedPair: EPairs.ethusdc });
    expect(connections[0].disconnect).toHaveBeenCalledTimes(1);
    expect(adapter.connectOrderBook).toHaveBeenLastCalledWith(EPairs.ethusdc, expect.any(Function), expect.any(Function));
    expect(connections).toHaveLength(2);

    act(() => connections[0].onDisconnect());
    act(() => connections[0].onData(book));
    expect(result.current.status).toBe(EConnectStuses.connecting);
    expect(connections).toHaveLength(2);

    act(() => connections[1].onData(book));
    expect(result.current.status).toBe(EConnectStuses.connected);

    act(() => connections[1].onDisconnect());
    act(() => jest.advanceTimersByTime(100));
    expect(adapter.connectOrderBook).toHaveBeenLastCalledWith(EPairs.ethusdc, expect.any(Function), expect.any(Function));
  });

  it('should respect tab visibility and remove network listeners on unmount', () => {
    const online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const hidden = jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    const { adapter, connections } = createAdapter();
    const { result, unmount } = renderHook(() => useOrderBook({ pair, adapter }));

    hidden.mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current.status).toBe(EConnectStuses.disconnected);
    expect(connections[0].disconnect).toHaveBeenCalledTimes(1);

    online.mockReturnValue(false);
    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(connections).toHaveLength(1);

    unmount();
    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(connections).toHaveLength(1);
    expect(jest.getTimerCount()).toBe(0);
  });
});

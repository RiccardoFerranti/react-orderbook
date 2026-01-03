import { renderHook } from '@testing-library/react';

import useOrderbookMaxBidAskSize from '@/components/orderbook/hooks/use-orderbook-max-bid-ask-size';
import type { IOrderBook } from '@/components/orderbook/adapters/types';

describe('useOrderbookMaxBidAskSize', () => {
  it('should calculate max `bid` and `ask` sizes correctly', () => {
    const orderBook: IOrderBook = {
      bids: [
        { price: 100, size: 2 }, // 200
        { price: 99, size: 5 }, // 495
      ],
      asks: [
        { price: 101, size: 1 }, // 101
        { price: 102, size: 3 }, // 306
      ],
    };

    const { result } = renderHook(() => useOrderbookMaxBidAskSize(orderBook));

    expect(result.current.maxBidSize).toBe(495);
    expect(result.current.maxAskSize).toBe(306);
  });

  it('should return `1` when bids are empty', () => {
    const orderBook: IOrderBook = {
      bids: [],
      asks: [{ price: 100, size: 1 }],
    };

    const { result } = renderHook(() => useOrderbookMaxBidAskSize(orderBook));

    expect(result.current.maxBidSize).toBe(1);
  });

  it('should return `1` when asks are empty', () => {
    const orderBook: IOrderBook = {
      bids: [{ price: 100, size: 1 }],
      asks: [],
    };

    const { result } = renderHook(() => useOrderbookMaxBidAskSize(orderBook));

    expect(result.current.maxAskSize).toBe(1);
  });

  it('should only consider the top `20` bids and asks', () => {
    const bids = Array.from({ length: 25 }, (_, i) => ({
      price: 100,
      size: i + 1,
    }));

    const asks = Array.from({ length: 25 }, (_, i) => ({
      price: 200,
      size: i + 1,
    }));

    const { result } = renderHook(() => useOrderbookMaxBidAskSize({ bids, asks }));

    // top 20 sizes → max = 20 * price
    expect(result.current.maxBidSize).toBe(20 * 100);
    expect(result.current.maxAskSize).toBe(20 * 200);
  });

  it('should recompute values when `bids` or `asks` change', () => {
    const initial: IOrderBook = {
      bids: [{ price: 100, size: 1 }],
      asks: [{ price: 101, size: 1 }],
    };

    const { result, rerender } = renderHook(({ data }) => useOrderbookMaxBidAskSize(data), { initialProps: { data: initial } });

    expect(result.current.maxBidSize).toBe(100);

    const updated: IOrderBook = {
      bids: [{ price: 100, size: 5 }],
      asks: [{ price: 101, size: 1 }],
    };

    rerender({ data: updated });

    expect(result.current.maxBidSize).toBe(500);
  });
});

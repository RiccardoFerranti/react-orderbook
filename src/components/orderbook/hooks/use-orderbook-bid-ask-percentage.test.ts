import { renderHook } from '@testing-library/react';

import { useOrderBookBidAskPercentage } from '@/components/orderbook/hooks/use-orderbook-bid-ask-percentage';
import type { IOrder } from '@/components/orderbook/adapters/types';

describe('useOrderBookBidAskPercentage', () => {
  it('should calculate `bid` and `ask` percentages correctly', () => {
    const bids: IOrder[] = [
      { price: 100, size: 3 },
      { price: 99, size: 2 },
    ];

    const asks: IOrder[] = [{ price: 101, size: 5 }];

    const { result } = renderHook(() => useOrderBookBidAskPercentage(bids, asks));

    // total = 3 + 2 + 5 = 10
    expect(result.current.bidPercentage).toBe(50);
    expect(result.current.askPercentage).toBe(50);
  });

  it('should respect the `topN` parameter', () => {
    const bids: IOrder[] = [
      { price: 100, size: 10 },
      { price: 99, size: 1 },
    ];

    const asks: IOrder[] = [
      { price: 101, size: 5 },
      { price: 102, size: 5 },
    ];

    const { result } = renderHook(() => useOrderBookBidAskPercentage(bids, asks, 1));

    // only first bid (10) and first ask (5)
    // total = 15
    expect(result.current.bidPercentage).toBeCloseTo(66.6667, 4);
    expect(result.current.askPercentage).toBeCloseTo(33.3333, 4);
  });

  it('should return `50/50` when both sides are empty', () => {
    const { result } = renderHook(() => useOrderBookBidAskPercentage([], []));

    expect(result.current.bidPercentage).toBe(50);
    expect(result.current.askPercentage).toBe(50);
  });

  it('should return `50/50` when total volume is zero', () => {
    const bids: IOrder[] = [{ price: 100, size: 0 }];
    const asks: IOrder[] = [{ price: 101, size: 0 }];

    const { result } = renderHook(() => useOrderBookBidAskPercentage(bids, asks));

    expect(result.current.bidPercentage).toBe(50);
    expect(result.current.askPercentage).toBe(50);
  });

  it('should recompute when `bids` or `asks` change', () => {
    const bids: IOrder[] = [{ price: 100, size: 5 }];
    const asks: IOrder[] = [{ price: 101, size: 5 }];

    const { result, rerender } = renderHook(({ bids, asks }) => useOrderBookBidAskPercentage(bids, asks), {
      initialProps: { bids, asks },
    });

    expect(result.current.bidPercentage).toBe(50);

    rerender({
      bids: [{ price: 100, size: 8 }],
      asks: [{ price: 101, size: 2 }],
    });

    expect(result.current.bidPercentage).toBe(80);
    expect(result.current.askPercentage).toBe(20);
  });
});

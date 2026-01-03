import { renderHook } from '@testing-library/react';

import useOrderBookCumulativeTooltipData from '@/components/orderbook/hooks/use-orderbook-cumulative-tooltip-data';
import { EOrderTypes } from '@/components/orderbook/types';
import type { IOrder } from '@/components/orderbook/adapters/types';

describe('useOrderBookCumulativeTooltipData', () => {
  it('should calculate `cumulative data` correctly for `asks` (ascending)', () => {
    const orders: IOrder[] = [
      { price: 100, size: 1 },
      { price: 101, size: 2 },
    ];

    const { result } = renderHook(() => useOrderBookCumulativeTooltipData(orders, 2, 2, EOrderTypes.ask));

    const map = result.current;
    // price 100
    const row100 = map.get(100)!;

    expect(row100.base).toBe(BigInt(100)); // 1 * 10^2
    expect(row100.quote).toBe(BigInt(1000000)); // 100 * 100
    expect(row100.avgPrice).toBe(BigInt(1000000 / 100)); // 100.00

    // price 101
    const row101 = map.get(101)!;
    expect(row101.base).toBe(BigInt(300)); // 1 + 2 = 3 * 10^2 → 300
    expect(row101.quote).toBe(BigInt(3020000)); // (100 * 100 * 100 + 200 * 101 * 100)
    expect(row101.avgPrice).toBe(BigInt(3020000) / BigInt(300));
  });

  it('should calculate `cumulative data` correctly for `bids` (descending)', () => {
    const orders: IOrder[] = [
      { price: 101, size: 1 },
      { price: 100, size: 2 },
    ];

    const { result } = renderHook(() => useOrderBookCumulativeTooltipData(orders, 2, 2, EOrderTypes.bid));

    const map = result.current;

    // best bid first (price 100)
    const row100 = map.get(100)!;
    expect(row100.base).toBe(BigInt(200));
    expect(row100.quote).toBe(BigInt(2000000)); // 200 * 100 * 100
    expect(row100.avgPrice).toBe(BigInt(2000000 / 200)); // 10000

    // then include 101
    const row101 = map.get(101)!;
    expect(row101.base).toBe(BigInt(300)); // 1 + 2 = 3 * 10^2 → 300
    expect(row101.quote).toBe(BigInt(1010000 + 2000000)); // 101 * 100 * 100 + 100 * 100 * 200
    expect(row101.avgPrice).toBe(BigInt(3010000) / BigInt(300)); // 10033
  });

  it('should floor `floating point` artifacts before BigInt conversion', () => {
    const orders: IOrder[] = [{ price: 100.123456, size: 0.449999999999 }];

    const { result } = renderHook(() => useOrderBookCumulativeTooltipData(orders, 5, 2, EOrderTypes.ask));

    const row = result.current.get(100.123456)!;

    // size floor: 0.44999 * 10^5 = 44999
    expect(row.base).toBe(BigInt(44999));

    // price floor: 100.123456 * 10^2 = 10012
    expect(row.quote).toBe(BigInt(44999 * 10012));
  });

  it('should return an `empty Map` when orders are empty', () => {
    const { result } = renderHook(() => useOrderBookCumulativeTooltipData([], 2, 2, EOrderTypes.ask));

    expect(result.current.size).toBe(0);
  });

  it('should recompute when `orders` change', () => {
    const initialOrders: IOrder[] = [{ price: 100, size: 1 }];
    const updatedOrders: IOrder[] = [
      { price: 100, size: 1 },
      { price: 101, size: 1 },
    ];

    const { result, rerender } = renderHook(({ orders }) => useOrderBookCumulativeTooltipData(orders, 2, 2, EOrderTypes.ask), {
      initialProps: { orders: initialOrders },
    });

    expect(result.current.size).toBe(1);

    rerender({ orders: updatedOrders });

    expect(result.current.size).toBe(2);
  });
});

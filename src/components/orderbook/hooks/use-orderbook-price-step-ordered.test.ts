import { renderHook } from '@testing-library/react';

import useOrderBookPriceStepOrdered from '@/components/orderbook/hooks/use-orderbook-price-step-ordered';

describe('useOrderBookPriceStepOrdered', () => {
  const orders = [
    { price: 101.12, size: 1 },
    { price: 101.18, size: 2 },
    { price: 100.95, size: 3 },
    { price: 100.01, size: 4 },
  ];

  it('shoudl return `sorted orders` without grouping when `defaultView=true` and `priceStep=0.01` (bids)', () => {
    const { result } = renderHook(() => useOrderBookPriceStepOrdered([...orders], '0.01', true, true));

    expect(result.current).toEqual([
      { price: 101.18, size: 2 },
      { price: 101.12, size: 1 },
      { price: 100.95, size: 3 },
      { price: 100.01, size: 4 },
    ]);
  });

  it('should return `sorted orders` without grouping when `defaultView=true` and `priceStep=0.01` (asks)', () => {
    const { result } = renderHook(() => useOrderBookPriceStepOrdered([...orders], '0.01', true, false));

    expect(result.current).toEqual([
      { price: 100.01, size: 4 },
      { price: 100.95, size: 3 },
      { price: 101.12, size: 1 },
      { price: 101.18, size: 2 },
    ]);
  });

  it('should group `priceStep=1` and `sums sizes` (bids)', () => {
    const { result } = renderHook(() => useOrderBookPriceStepOrdered([...orders], '1', false, true));

    // 101.x → 101
    // 100.x → 100
    expect(result.current).toEqual([
      { price: 101.18, size: 3 }, // 1 + 2
      { price: 100.01, size: 7 }, // 3 + 4
    ]);
  });

  it('should group `priceStep=1` and `sorts ascending` for asks', () => {
    const { result } = renderHook(() => useOrderBookPriceStepOrdered([...orders], '1', false, false));

    expect(result.current).toEqual([
      { price: 100.01, size: 7 },
      { price: 101.18, size: 3 },
    ]);
  });

  it('should group `priceStep=10` and `sorts ascending` for asks', () => {
    const { result } = renderHook(() => useOrderBookPriceStepOrdered([...orders], '10', false, false));

    expect(result.current).toEqual([{ price: 100.01, size: 10 }]);
  });

  it('should still group when `priceStep=0.01` but `defaultView=false`', () => {
    const { result } = renderHook(() =>
      useOrderBookPriceStepOrdered(
        [
          { price: 100.01, size: 1 },
          { price: 100.01, size: 2 },
        ],
        '0.01',
        false,
        true,
      ),
    );

    expect(result.current).toEqual([{ price: 100.01, size: 3 }]);
  });
});

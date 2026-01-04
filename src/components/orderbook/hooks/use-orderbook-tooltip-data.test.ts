import { renderHook } from '@testing-library/react';

import useOrderBookTooltipData from '@/components/orderbook/hooks/use-orderbook-tooltip-data';
import type { ITooltipData } from '@/components/orderbook/types';
import { EOrderTypes } from '@/components/orderbook/types';

describe('useOrderBookTooltipData', () => {
  const bidData = new Map<number, ITooltipData>([[100, { base: BigInt(10), quote: BigInt(1000), avgPrice: BigInt(100) }]]);
  const askData = new Map<number, ITooltipData>([[101, { base: BigInt(5), quote: BigInt(505), avgPrice: BigInt(101) }]]);

  it('should returns `zeroed values` when `hoverTooltipContent is null`', () => {
    const tooltipDataRef = { current: null };
    const { result } = renderHook(() =>
      useOrderBookTooltipData({
        cumulativeBidData: bidData,
        cumulativeAskData: askData,
        hoverTooltipContent: null,
        tooltipDataRef,
      }),
    );
    expect(result.current).toEqual({
      base: BigInt(0),
      quote: BigInt(0),
      avgPrice: BigInt(0),
    });
  });

  it('should return `bid tooltip data` when `hovering bid row`', () => {
    const tooltipDataRef = { current: null };

    const { result } = renderHook(() =>
      useOrderBookTooltipData({
        cumulativeBidData: bidData,
        cumulativeAskData: askData,
        hoverTooltipContent: {
          price: 100,
          orderType: EOrderTypes.bid,
        },
        tooltipDataRef,
      }),
    );

    expect(result.current).toEqual(bidData.get(100));
    expect(tooltipDataRef.current).toEqual(bidData.get(100));
  });

  it('should return `ask tooltip data` when `hovering ask row`', () => {
    const tooltipDataRef = { current: null };

    const { result } = renderHook(() =>
      useOrderBookTooltipData({
        cumulativeBidData: bidData,
        cumulativeAskData: askData,
        hoverTooltipContent: {
          price: 101,
          orderType: EOrderTypes.ask,
        },
        tooltipDataRef,
      }),
    );

    expect(result.current).toEqual(askData.get(101));
    expect(tooltipDataRef.current).toEqual(askData.get(101));
  });

  it('should fall back to `last tooltip data` when `price is missing`', () => {
    const tooltipDataRef = {
      current: bidData.get(100)!,
    };

    const { result } = renderHook(() =>
      useOrderBookTooltipData({
        cumulativeBidData: bidData,
        cumulativeAskData: askData,
        hoverTooltipContent: {
          price: 999,
          orderType: EOrderTypes.bid,
        },
        tooltipDataRef,
      }),
    );

    expect(result.current).toEqual(bidData.get(100));
  });

  it('should return `null` when `no data exists` and `ref is empty`', () => {
    const tooltipDataRef = { current: null };

    const { result } = renderHook(() =>
      useOrderBookTooltipData({
        cumulativeBidData: bidData,
        cumulativeAskData: askData,
        hoverTooltipContent: {
          price: 999,
          orderType: EOrderTypes.ask,
        },
        tooltipDataRef,
      }),
    );

    expect(result.current).toBeNull();
  });

  it('should update `ref` when moving from one valid row to another', () => {
    const tooltipDataRef = { current: null };

    const { result, rerender } = renderHook(
      ({ hover }) =>
        useOrderBookTooltipData({
          cumulativeBidData: bidData,
          cumulativeAskData: askData,
          hoverTooltipContent: hover,
          tooltipDataRef,
        }),
      {
        initialProps: {
          hover: { price: 100, orderType: EOrderTypes.bid },
        },
      },
    );

    expect(result.current).toEqual(bidData.get(100));

    rerender({
      hover: { price: 101, orderType: EOrderTypes.ask },
    });

    expect(result.current).toEqual(askData.get(101));
    expect(tooltipDataRef.current).toEqual(askData.get(101));
  });
});

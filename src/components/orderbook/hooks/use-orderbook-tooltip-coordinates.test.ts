import { renderHook } from '@testing-library/react';

import useOrderBookTooltipCoordinates from '@/components/orderbook/hooks/use-orderbook-tooltip-coordinates';
import { EOrderTypes } from '@/components/orderbook/types';
import { TOOLTIP_HEIGHT, TOOLTIP_WIDTH } from '@/components/orderbook/consts';

function mockRect({ top = 100, left = 100, width = 50, height = 20 } = {}) {
  return {
    top,
    left,
    bottom: top + height,
    right: left + width,
    width,
    height,
  } as DOMRect;
}

describe('useOrderBookTooltipCoordinates', () => {
  beforeEach(() => {
    // Ensure stable viewport
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
  });

  it('should returns `{0,0}` when there is `no hovered row`', () => {
    const rowBidRefs = { current: new Map() };
    const rowAskRefs = { current: new Map() };
    const containerRef = { current: null };

    const { result } = renderHook(() =>
      useOrderBookTooltipCoordinates({
        hoverTooltipContent: null,
        rowBidRefs,
        rowAskRefs,
        containerRef,
      }),
    );

    expect(result.current).toEqual({
      tooltipTop: 0,
      tooltipLeft: 0,
    });
  });

  it('should calculate coordinates when a `bid row is hovered`', () => {
    const row = document.createElement('div');
    const container = document.createElement('div');

    jest.spyOn(row, 'getBoundingClientRect').mockReturnValue(mockRect({ top: 200, left: 300 }));

    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue(mockRect({ top: 100, left: 100, width: 600, height: 600 }));

    const rowBidRefs = {
      current: new Map([[50000, row]]),
    };

    const rowAskRefs = { current: new Map() };
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useOrderBookTooltipCoordinates({
        hoverTooltipContent: {
          price: 50000,
          orderType: EOrderTypes.bid,
        },
        rowBidRefs,
        rowAskRefs,
        containerRef,
      }),
    );

    expect(result.current.tooltipTop).toBeGreaterThan(0);
    expect(result.current.tooltipLeft).toBeGreaterThan(0);
  });

  it('should place tooltip to the `left` when there is `no space on the right`', () => {
    const row = document.createElement('div');
    const container = document.createElement('div');

    // Row near right edge
    jest.spyOn(row, 'getBoundingClientRect').mockReturnValue(mockRect({ top: 200, left: 1050, width: 100 }));

    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue(mockRect({ top: 0, left: 0, width: 1200, height: 800 }));

    const rowAskRefs = {
      current: new Map([[51000, row]]),
    };

    const rowBidRefs = { current: new Map() };
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useOrderBookTooltipCoordinates({
        hoverTooltipContent: {
          price: 51000,
          orderType: EOrderTypes.ask,
        },
        rowBidRefs,
        rowAskRefs,
        containerRef,
      }),
    );

    // Tooltip should be placed to the left of the row
    expect(result.current.tooltipLeft).toBeLessThan(1050);
  });

  it('should fall back inside container when `no direction fits`', () => {
    const row = document.createElement('div');
    const container = document.createElement('div');

    jest.spyOn(row, 'getBoundingClientRect').mockReturnValue(
      mockRect({
        top: 5,
        left: 5,
        width: 50,
        height: 20,
      }),
    );

    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue(
      mockRect({
        top: 0,
        left: 0,
        width: 300,
        height: 200,
      }),
    );

    Object.defineProperty(window, 'innerWidth', {
      value: TOOLTIP_WIDTH,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: TOOLTIP_HEIGHT,
      writable: true,
    });

    const rowBidRefs = {
      current: new Map([[49000, row]]),
    };

    const rowAskRefs = { current: new Map() };
    const containerRef = { current: container };

    const { result } = renderHook(() =>
      useOrderBookTooltipCoordinates({
        hoverTooltipContent: {
          price: 49000,
          orderType: EOrderTypes.bid,
        },
        rowBidRefs,
        rowAskRefs,
        containerRef,
      }),
    );

    expect(result.current.tooltipTop).toBeGreaterThanOrEqual(0);
    expect(result.current.tooltipLeft).toBeGreaterThanOrEqual(0);

    expect(result.current.tooltipTop).toBeLessThanOrEqual(200 - TOOLTIP_HEIGHT);
    expect(result.current.tooltipLeft).toBeLessThanOrEqual(300 - TOOLTIP_WIDTH);
  });
});

import { renderHook, act } from '@testing-library/react';

import useOrderBookTooltip from './use-orderbook-tooltip';
import { EOrderTypes } from '../types';

describe('useOrderBookTooltip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllTimers();
  });

  it('should set initial state correctly', () => {
    const { result } = renderHook(() => useOrderBookTooltip());

    expect(result.current.isTooltipOpen).toBe(false);
    expect(result.current.hoverTooltipContent).toBeNull();
    expect(result.current.hoverRect).toBeNull();
    expect(result.current.rowBidRefs.current.size).toBe(0);
    expect(result.current.rowAskRefs.current.size).toBe(0);
    expect(result.current.bidRowHoveredById.current).toBeNull();
    expect(result.current.askRowHoveredById.current).toBeNull();
  });

  it('should call `handleHover` and open the tooltip and set content for bid', () => {
    const { result } = renderHook(() => useOrderBookTooltip());

    act(() => {
      result.current.handleHover(100, EOrderTypes.bid, 2);
    });

    expect(result.current.isTooltipOpen).toBe(true);
    expect(result.current.hoverTooltipContent).toEqual({ price: 100, orderType: EOrderTypes.bid });
    expect(result.current.bidRowHoveredById.current).toBe(2);
    expect(result.current.askRowHoveredById.current).toBeNull();
    expect(result.current.hoveredIndexRef.current).toBe(2);
  });

  it('should call `handleHover` and open tooltip and set content for ask', () => {
    const { result } = renderHook(() => useOrderBookTooltip());

    act(() => {
      result.current.handleHover(101, EOrderTypes.ask, 5);
    });

    expect(result.current.isTooltipOpen).toBe(true);
    expect(result.current.hoverTooltipContent).toEqual({ price: 101, orderType: EOrderTypes.ask });
    expect(result.current.askRowHoveredById.current).toBe(5);
    expect(result.current.bidRowHoveredById.current).toBeNull();
    expect(result.current.hoveredIndexRef.current).toBe(5);
  });

  it('should call `handleLeave` and schedule closing tooltip after 80ms', () => {
    const { result } = renderHook(() => useOrderBookTooltip());

    act(() => {
      result.current.handleHover(100, EOrderTypes.bid, 1);
      result.current.handleLeave();
    });

    // Tooltip still open before timeout
    expect(result.current.isTooltipOpen).toBe(true);

    act(() => {
      jest.advanceTimersByTime(80);
    });

    expect(result.current.isTooltipOpen).toBe(false);
    expect(result.current.hoverTooltipContent).toBeNull();
    expect(result.current.bidRowHoveredById.current).toBeNull();
    expect(result.current.hoveredIndexRef.current).toBeNull();
  });

  it('should call `handleTooltipEnter` and cancel close timeout', () => {
    const { result } = renderHook(() => useOrderBookTooltip());

    act(() => {
      result.current.handleHover(100, EOrderTypes.bid, 1);
      result.current.handleLeave();
      result.current.handleTooltipEnter();
    });

    // Advance time beyond 80ms, should still be open
    act(() => jest.advanceTimersByTime(200));

    expect(result.current.isTooltipOpen).toBe(true);
  });

  it('should call `handleTooltipLeave` and close tooltip if row not hovered', () => {
    const { result } = renderHook(() => useOrderBookTooltip());

    act(() => {
      result.current.handleHover(100, EOrderTypes.bid, 1);
      result.current.handleLeave();
      result.current.handleTooltipEnter();
      result.current.handleTooltipLeave();
    });

    expect(result.current.isTooltipOpen).toBe(false);
    expect(result.current.hoverTooltipContent).toBeNull();
    expect(result.current.hoverRect).toBeNull();
  });

  it('should `handleTooltipLeave` and do not close tooltip if row still hovered', () => {
    const { result } = renderHook(() => useOrderBookTooltip());

    act(() => {
      result.current.handleHover(100, EOrderTypes.bid, 1);
      // simulate row still hovered
      result.current.isHoveringBidRowRef.current = true;
      result.current.handleTooltipLeave();
    });

    expect(result.current.isTooltipOpen).toBe(true);
  });

  it('should `cleanup` clears timeout on unmount', () => {
    const { result, unmount } = renderHook(() => useOrderBookTooltip());

    act(() => {
      result.current.handleHover(100, EOrderTypes.bid, 1);
      result.current.handleLeave();
    });

    unmount();
    // Advance timers to see if any errors occur
    act(() => jest.advanceTimersByTime(200));
  });
});

import { renderHook, act } from '@testing-library/react';

import { useIsMobile } from './use-is-mobile';

describe('useIsMobile', () => {
  let matchMediaMock: jest.SpyInstance;

  beforeEach(() => {
    matchMediaMock = jest.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      let matches = false;

      if (query === '(max-width: 639px)') {
        matches = false; // set initial value for this test
      }

      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return false if width is above 639px', () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should return true if width is below 639px', () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should update value on media query change', () => {
    let listener: ((event: MediaQueryListEvent) => void) | null = null;

    matchMediaMock.mockImplementation(
      (query) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: (_: string, cb: (event: MediaQueryListEvent) => void) => {
            listener = cb;
          },
          removeEventListener: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          dispatchEvent: jest.fn(),
        }) as unknown as MediaQueryList,
    );

    const { result } = renderHook(() => useIsMobile());

    // Initially false
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      listener?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });
});

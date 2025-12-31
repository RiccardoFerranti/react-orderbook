import { useState, useEffect } from 'react';

/**
 * Hook to detect if the screen is "mobile" according to Tailwind breakpoints.
 * Defaults to `sm` breakpoint (<640px).
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 639px)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // For modern browsers
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

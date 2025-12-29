import { useEffect, useRef } from 'react';

export default function usePrevious<T = unknown>(value: T): undefined | T {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

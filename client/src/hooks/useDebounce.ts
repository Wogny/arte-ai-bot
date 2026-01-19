import { useState, useEffect } from "react";

/**
 * Hook para debounce de valores
 * Útil para otimizar buscas e inputs que disparam requests
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para throttle de funções
 * Útil para eventos de scroll e resize
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    const now = Date.now();

    if (now >= lastUpdated + interval) {
      setLastUpdated(now);
      setThrottledValue(value);
    } else {
      const id = setTimeout(() => {
        setLastUpdated(Date.now());
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(id);
    }
  }, [value, interval, lastUpdated]);

  return throttledValue;
}

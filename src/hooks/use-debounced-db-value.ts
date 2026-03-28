import { useEffect, useRef } from 'react';

import { dbHelper } from '@/lib/db';

export function useDebouncedDbValue<T>(
  key: string,
  value: T,
  enabled: boolean,
  delay = 250
) {
  const latestValueRef = useRef(value);
  const latestEnabledRef = useRef(enabled);

  latestValueRef.current = value;
  latestEnabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    const flush = () => {
      if (disposed || !latestEnabledRef.current) return;
      void dbHelper.setItem(key, latestValueRef.current).catch(console.error);
    };

    const timer = window.setTimeout(flush, delay);

    const handlePageHide = () => {
      window.clearTimeout(timer);
      flush();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;
      handlePageHide();
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [delay, enabled, key, value]);
}

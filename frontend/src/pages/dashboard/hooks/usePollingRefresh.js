// ============================================================
// usePollingRefresh.js
// Hook ndogo ya polling — inarun `fetcher` kila `intervalMs` wakati
// ukurasa uko active (document visible). Inasimama kama tab
// haiko active, ili kuokoa bandwidth/CPU.
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";

export function usePollingRefresh(fetcher, { intervalMs = 60000, enabled = true } = {}) {
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);

  // Keep fetcher ref up to date bila ku-trigger effect
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setError(null);
    try {
      await fetcherRef.current();
      setLastRefreshedAt(Date.now());
    } catch (err) {
      setError(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let timerId = null;

    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.hidden) {
        // Tab haiko active — ruka refresh, lakini endelea kupanga
        timerId = setTimeout(tick, intervalMs);
        return;
      }
      await refresh();
      if (!cancelled) {
        timerId = setTimeout(tick, intervalMs);
      }
    };

    // Refresh ya kwanza baada ya muda kidogo (epuka kugongana na boot loader)
    timerId = setTimeout(tick, 1500);

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs]);

  return { refresh, isRefreshing, lastRefreshedAt, error };
}

export default usePollingRefresh;
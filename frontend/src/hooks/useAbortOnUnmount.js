import { useEffect, useRef } from "react";

/**
 * Returns an AbortSignal tied to the component's lifetime.
 * The controller is recreated on every mount, so remounts
 * (React 18 StrictMode, Suspense, or shell remounts) get a
 * fresh, non-aborted signal.
 */
export function useAbortOnUnmount() {
  const controllerRef = useRef(null);

  useEffect(() => {
    controllerRef.current = new AbortController();
    return () => {
      try {
        controllerRef.current?.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  // Initial render (before the effect runs) — return a live signal
  // so consumers calling fetch() on the first render still work.
  if (!controllerRef.current) {
    controllerRef.current = new AbortController();
  }
  return controllerRef.current.signal;
}

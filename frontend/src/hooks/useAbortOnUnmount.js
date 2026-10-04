import { useEffect, useMemo } from "react";

/**
 * Returns an AbortSignal tied to the component's lifetime.
 * useMemo creates the controller during render so the consumer
 * gets the same signal object across the component's lifetime.
 * The effect cleanup aborts it on unmount.
 */
export function useAbortOnUnmount() {
  const controller = useMemo(() => new AbortController(), []);

  useEffect(() => {
    return () => {
      try {
        controller.abort();
      } catch {
        /* noop */
      }
    };
  }, [controller]);

  return controller.signal;
}

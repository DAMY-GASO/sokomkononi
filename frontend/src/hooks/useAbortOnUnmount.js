import { useEffect, useRef } from "react";

export function useAbortOnUnmount() {
  const controllerRef = useRef(null);
  if (!controllerRef.current) controllerRef.current = new AbortController();
  useEffect(() => {
    return () => {
      try { controllerRef.current?.abort(); } catch { /* noop */ }
    };
  }, []);
  return controllerRef.current.signal;
}

// ============================================================
// utils/authErrors.js
// Rate-limit (HTTP 429 / DRF throttle) helpers kwa Login & Register.
// ============================================================
import { useCallback, useEffect, useState } from "react";

/**
 * Inatambua kama kosa ni throttle. Inarudisha { seconds } au null.
 * DRF inarudisha: {"detail": "Request was throttled. Expected available in 42 seconds."}
 */
export function getRateLimit(err) {
  if (!err) return null;
  const status = err.status ?? err.response?.status;
  const detail = typeof err.data?.detail === "string" ? err.data.detail : "";
  const throttled = status === 429 || /throttled/i.test(detail);
  if (!throttled) return null;

  const m = detail.match(/(\d+)\s*second/i);
  const header = Number(err.headers?.["retry-after"] ?? err.retryAfter);
  let seconds = m ? Number(m[1]) : Number.isFinite(header) && header > 0 ? header : 60;
  seconds = Math.min(Math.max(Math.ceil(seconds), 1), 3600);
  return { seconds };
}

/** Countdown ya kufunga fomu: [secondsLeft, start(seconds)] */
export function useLockout() {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const start = useCallback((seconds) => setLeft(seconds), []);
  return [left, start];
}

export function lockMessage(lang, seconds) {
  const time =
    seconds < 60
      ? lang === "sw" ? `sekunde ${seconds}` : `${seconds}s`
      : lang === "sw" ? `dakika ${Math.ceil(seconds / 60)}` : `${Math.ceil(seconds / 60)} min`;
  return lang === "sw"
    ? `Majaribio ni mengi sana. Subiri ${time} kisha ujaribu tena.`
    : `Too many attempts. Please wait ${time} and try again.`;
}
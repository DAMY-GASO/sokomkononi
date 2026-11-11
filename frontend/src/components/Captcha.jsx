// ============================================================
// Captcha.jsx — Cloudflare Turnstile (env-gated, degrades to no-op)
// Set VITE_TURNSTILE_SITE_ID in .env to enable.
//
// - Script inapakiwa MARA MOJA (shared promise) hata kama kuna Captcha nyingi
//   au StrictMode inamount mara mbili.
// - `render=explicit` — hakuna auto-render inayogongana na render ya React.
// - Cleanup inaondoa widget; haiita render kama component imeondolewa
//   (huzuia kosa la "postMessage target origin mismatch").
// ============================================================
import React, { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_ID || "";
export const isCaptchaEnabled = Boolean(SITE_KEY);

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise = null;

function loadTurnstile() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => {
      scriptPromise = null; // ruhusu jaribio jingine
      reject(new Error("Turnstile script failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export default function Captcha({ onVerify, onExpire }) {
  const ref = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  }, [onVerify, onExpire]);

  useEffect(() => {
    if (!isCaptchaEnabled || !ref.current) return undefined;
    let cancelled = false;
    const node = ref.current;

    loadTurnstile()
      .then((ts) => {
        if (cancelled || !ts || !node.isConnected) return;
        const theme = document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";
        widgetIdRef.current = ts.render(node, {
          sitekey: SITE_KEY,
          theme,
          callback: (token) => onVerifyRef.current?.(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => onExpireRef.current?.(),
        });
      })
      .catch(() => onExpireRef.current?.());

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      widgetIdRef.current = null;
      if (id != null && window.turnstile) {
        try { window.turnstile.remove(id); } catch { /* noop */ }
      }
    };
  }, []);

  if (!isCaptchaEnabled) return null;
  return <div ref={ref} className="flex justify-center my-3" />;
}
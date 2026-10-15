// ============================================================
// Captcha.jsx — Cloudflare Turnstile (env-gated, degrades to no-op)
// Set VITE_TURNSTILE_SITE_KEY in .env to enable.
//
// FIXED:
//   - callbacks stored in refs so parent re-renders don't remount widget
//   - theme follows document.documentElement.dark
// ============================================================
import React, { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

export const isCaptchaEnabled = Boolean(SITE_KEY);

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

    function mount() {
      if (cancelled || !window.turnstile || !ref.current) return;
      if (widgetIdRef.current) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
      const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme,
        callback: (token) => onVerifyRef.current?.(token),
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": () => onExpireRef.current?.(),
      });
    }

    if (window.turnstile) {
      mount();
    } else {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.onload = mount;
      document.head.appendChild(s);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, []);   // empty deps — mount once

  if (!isCaptchaEnabled) return null;
  return <div ref={ref} className="flex justify-center my-3" />;
}

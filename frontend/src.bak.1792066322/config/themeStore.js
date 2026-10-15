// ============================================================
// themeStore.js — light / dark mode
// Persists to localStorage, syncs across tabs, prefers OS
// setting on first visit.
// ============================================================
import { useEffect, useState } from "react";

const KEY = "sokomkononi_theme_v1";
const EV = "sokomkononi:theme-updated";

function readStored() {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "dark" || v === "light") return v;
    return null;
  } catch { return null; }
}

function getSystemPreference() {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark" : "light";
}

export function getTheme() { return readStored() || getSystemPreference(); }

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
}

export function setTheme(theme) {
  if (theme !== "light" && theme !== "dark") return;
  try { window.localStorage.setItem(KEY, theme); } catch {}
  applyTheme(theme);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EV));
}

export function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

export function clearThemePreference() {
  try { window.localStorage.removeItem(KEY); } catch {}
  applyTheme(getSystemPreference());
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EV));
}

export function useTheme() {
  const [theme, setLocal] = useState(() => getTheme());

  useEffect(() => {
    applyTheme(theme);
    const sync = () => setLocal(getTheme());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (!readStored()) {
        const next = getSystemPreference();
        applyTheme(next);
        setLocal(next);
      }
    };
    mql?.addEventListener?.("change", onSystem);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
      mql?.removeEventListener?.("change", onSystem);
    };
  }, [theme]);

  return { theme, setTheme, toggle: toggleTheme };
}

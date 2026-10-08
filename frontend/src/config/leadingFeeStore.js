// ============================================================
// leadingFeeStore.js — Leading Fee (API-backed)
// Backend: GET/PATCH /api/leading-fees/
//          POST      /api/leading-fees/toggle/
//
// Kumbuka: `price` na `days` zimeondolewa. Zinatoka kwenye
// `leadingPackagesStore.js` (packages). Store hii inahifadhi
// `is_enabled` pekee (toggle ya jumla).
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_leading_fee_config_v4";
const EV = "sokomkononi:leading-fee-config-updated";

const FALLBACK = {
  is_enabled: true,
  label: { sw: "Ada ya Kipaumbele", en: "Leading Fee" },
  desc: { sw: "", en: "" },
  updated_at: null,
};

function read() {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return FALLBACK;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? { ...FALLBACK, ...p } : FALLBACK;
  } catch { return FALLBACK; }
}

function write(cfg) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event(EV));
}

function norm(raw) {
  if (!raw) return null;
  return {
    is_enabled: raw.is_enabled !== false,
    label: raw.label || FALLBACK.label,
    desc: raw.desc || FALLBACK.desc,
    updated_at: raw.updated_at || null,
  };
}

export function getLeadingFeeConfig() { return read(); }

export async function hydrateLeadingFeeFromApi() {
  try {
    const d = await api.get("/leading-fees/");
    const row = Array.isArray(d) ? d[0] : (d?.results?.[0] ?? d);
    const normalized = norm(row);
    if (normalized) {
      write(normalized);
      console.info("[leadingFeeStore] hydrated:", normalized);
    }
    return { ok: true, config: normalized };
  } catch (err) {
    console.warn("[leadingFeeStore] hydrate failed:", err?.message, err?.status);
    return { ok: false, error: err };
  }
}

export async function toggleLeadingFeeAsync() {
  const cur = getLeadingFeeConfig();
  const newState = !cur.is_enabled;
  write({ ...cur, is_enabled: newState });

  try {
    const raw = await api.post("/leading-fees/toggle/", {});
    const updated = { ...cur, is_enabled: raw?.is_enabled ?? newState };
    write(updated);
    return { ok: true, is_enabled: updated.is_enabled };
  } catch (err) {
    write(cur);
    return { ok: false, error: err };
  }
}

export function useLeadingFeeConfig() {
  const [cfg, setCfg] = useState(() => read());
  useEffect(() => {
    hydrateLeadingFeeFromApi();
    const sync = () => setCfg(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return cfg;
}
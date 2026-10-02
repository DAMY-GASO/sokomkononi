// ============================================================
// leadingFeeStore.js — Leading Fee (API-backed)
// Backend: GET/PATCH /api/leading-fees/
//          POST      /api/leading-fees/toggle/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_leading_fee_config_v3";
const EV = "sokomkononi:leading-fee-config-updated";

const FALLBACK = {
  price: 0,
  days: 7,
  is_enabled: true,
  label: { sw: "Ada ya Kipaumbele", en: "Leading Fee" },
  desc: { sw: "", en: "" },
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
function normalizeLabel(raw, fallback) {
  if (!raw) return fallback;
  if (typeof raw === "string") return { sw: raw, en: raw };
  return { sw: raw.sw || raw.en || "", en: raw.en || raw.sw || "" };
}
function norm(raw) {
  if (!raw) return null;
  return {
    backendId: raw.id,
    price: Number(raw.price) || 0,
    days: Number(raw.days) || 7,
    is_enabled: raw.is_enabled !== false,
    label: normalizeLabel(raw.label, FALLBACK.label),
    desc: normalizeLabel(raw.desc, FALLBACK.desc),
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

export async function updateLeadingFeePriceAsync(price) {
  const num = Number(price);
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: new Error("price must be non-negative") };
  }
  const cur = getLeadingFeeConfig();
  write({ ...cur, price: num });

  try {
    const raw = await api.patch("/leading-fees/", { price: num });
    const updated = norm(raw) || { ...cur, price: num };
    write(updated);
    return { ok: true, config: updated };
  } catch (errPatch) {
    if (errPatch?.status && errPatch.status !== 404 && errPatch.status !== 405) {
      write(cur);
      return { ok: false, error: errPatch };
    }
    try {
      const raw = await api.post("/leading-fees/", { price: num });
      const updated = norm(raw) || { ...cur, price: num };
      write(updated);
      return { ok: true, config: updated };
    } catch (errPost) {
      write(cur);
      return { ok: false, error: errPost || errPatch };
    }
  }
}

// ⬇️ MPYA — Toggle
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
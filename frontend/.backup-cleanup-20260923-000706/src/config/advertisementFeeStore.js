// ============================================================
// advertisementFeeStore.js — API-only via /api/advertisement-fees/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_advertisement_fee_config_v1";
const EV = "sokomkononi:advertisement-fee-config-updated";

const FALLBACK = {
  price: 0,
  days: 0,
  label: { sw: "Ada ya Matangazo", en: "Advertisement Fee" },
  desc: { sw: "", en: "" },
};

function read() {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return FALLBACK;
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return FALLBACK;
    return { ...FALLBACK, ...p };
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
    backendId: raw.id,
    price: Number(raw.price) || 0,
    days: Number(raw.days) || 0,
    label: raw.label || FALLBACK.label,
    desc: raw.desc || FALLBACK.desc,
  };
}

export function getAdvertisementFeeConfig() { return read(); }

export async function hydrateAdvertisementFeeFromApi() {
  try {
    const d = await api.get("/advertisement-fees/?page_size=100");
    const row = Array.isArray(d) ? d[0] : (d?.results?.[0] ?? d);
    const normalized = norm(row);
    if (normalized) write(normalized);
    return { ok: true, config: normalized };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateAdvertisementFeePriceAsync(price) {
  const num = Number(price);
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: new Error("price must be a positive number") };
  }
  const cur = getAdvertisementFeeConfig();
  if (!cur.backendId) {
    return { ok: false, error: new Error("No backend id — hydrate first") };
  }
  try {
    const raw = await api.patch(`/advertisement-fees/${cur.backendId}/`, { price: num });
    const updated = norm(raw) || { ...cur, price: num };
    write(updated);
    return { ok: true, config: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export function useAdvertisementFeeConfig() {
  const [cfg, setCfg] = useState(() => read());
  useEffect(() => {
    hydrateAdvertisementFeeFromApi();
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

// LEGACY (compat shims)
export const SEED_ADVERTISEMENT_FEE_CONFIG = { price: 0, days: 0, label: { sw: '', en: '' }, desc: { sw: '', en: '' } };
export function saveAdvertisementFeeConfig() {}
export function updateAdvertisementFeePrice() {}
export async function updateAdvertisementFeeAsync() { return { ok: false }; }

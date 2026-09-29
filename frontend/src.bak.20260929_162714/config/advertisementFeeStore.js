// ============================================================
// advertisementFeeStore.js — Advertisement Fee (API-backed)
// Backend: GET/PATCH/POST /api/advertisement-fees/
//   Spec: PATCH/POST on collection — NO /{id}/ subpath.
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_advertisement_fee_config_v2";
const EV = "sokomkononi:advertisement-fee-config-updated";

const FALLBACK = {
  price: 0,
  days: 7,
  label: { sw: "Ada ya Matangazo", en: "Advertisement Fee" },
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
    label: normalizeLabel(raw.label, FALLBACK.label),
    desc: normalizeLabel(raw.desc, FALLBACK.desc),
  };
}

export function getAdvertisementFeeConfig() { return read(); }

export async function hydrateAdvertisementFeeFromApi() {
  try {
    const d = await api.get("/advertisement-fees/?page_size=100");
    const row = Array.isArray(d) ? d[0] : (d?.results?.[0] ?? d);
    const normalized = norm(row);
    if (normalized) {
      write(normalized);
      console.info("[advertisementFeeStore] hydrated:", normalized);
    }
    return { ok: true, config: normalized };
  } catch (err) {
    console.warn("[advertisementFeeStore] hydrate failed:", err?.message, err?.status);
    return { ok: false, error: err };
  }
}

export async function updateAdvertisementFeePriceAsync(price) {
  const num = Number(price);
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: new Error("price must be non-negative") };
  }
  const cur = getAdvertisementFeeConfig();

  // Backend spec: PATCH or POST to /advertisement-fees/ (collection).
  try {
    console.info(`[advertisementFeeStore] PATCH /advertisement-fees/ price=${num}`);
    const raw = await api.patch("/advertisement-fees/", { price: num });
    const updated = norm(raw) || { ...cur, price: num };
    write(updated);
    return { ok: true, config: updated };
  } catch (errPatch) {
    if (errPatch?.status && errPatch.status !== 404 && errPatch.status !== 405) {
      return { ok: false, error: errPatch };
    }
    try {
      console.info(`[advertisementFeeStore] POST /advertisement-fees/ price=${num}`);
      const raw = await api.post("/advertisement-fees/", { price: num });
      const updated = norm(raw) || { ...cur, price: num };
      write(updated);
      return { ok: true, config: updated };
    } catch (errPost) {
      return { ok: false, error: errPost || errPatch };
    }
  }
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

// Legacy
export const SEED_ADVERTISEMENT_FEE_CONFIG = { price: 0, days: 0, label: { sw: "", en: "" }, desc: { sw: "", en: "" } };
export function saveAdvertisementFeeConfig() {}
export function updateAdvertisementFeePrice() {}
export async function updateAdvertisementFeeAsync() { return { ok: false }; }

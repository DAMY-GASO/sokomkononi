// ============================================================
// advertisementFeeStore.js — API-backed via /api/advertisement-fees/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_advertisement_fee_config_v1";
const UPDATE_EVENT = "sokomkononi:advertisement-fee-config-updated";

export const SEED_ADVERTISEMENT_FEE_CONFIG = {
  price: 25000,
  days: 7,
  label: { sw: "Ada ya Matangazo", en: "Advertisement Fee" },
  desc: {
    sw: "Banner inayozunguka kwenye Dashboard (5s rotation) kwa siku 7",
    en: "Rotating banner on the Dashboard (5s rotation) for 7 days",
  },
};

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return SEED_ADVERTISEMENT_FEE_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_ADVERTISEMENT_FEE_CONFIG;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.price !== "number") return SEED_ADVERTISEMENT_FEE_CONFIG;
    return { ...SEED_ADVERTISEMENT_FEE_CONFIG, ...parsed };
  } catch {
    return SEED_ADVERTISEMENT_FEE_CONFIG;
  }
}

function saveLocal(config) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// NORMALIZER
// ============================================================
function normalizeFromApi(raw) {
  if (!raw) return SEED_ADVERTISEMENT_FEE_CONFIG;
  return {
    backendId: raw.id,
    price: Number(raw.price) || SEED_ADVERTISEMENT_FEE_CONFIG.price,
    days: Number(raw.days) || SEED_ADVERTISEMENT_FEE_CONFIG.days,
    label: raw.label || SEED_ADVERTISEMENT_FEE_CONFIG.label,
    desc: raw.desc || SEED_ADVERTISEMENT_FEE_CONFIG.desc,
  };
}

// ============================================================
// READS
// ============================================================
export function getAdvertisementFeeConfig() {
  return readFromStorage();
}

export function saveAdvertisementFeeConfig(config) {
  saveLocal(config);
}

// ============================================================
// HYDRATE
// ============================================================
export async function hydrateAdvertisementFeeFromApi() {
  try {
    const data = await api.get("/advertisement-fees/");
    const normalized = normalizeFromApi(data);
    saveLocal(normalized);
    return { source: "api", config: normalized };
  } catch (err) {
    console.warn("[advertisementFeeStore] hydrate failed:", err);
    return { source: "error", config: getAdvertisementFeeConfig() };
  }
}

// ============================================================
// ASYNC MUTATIONS — with rollback
// ============================================================
export async function updateAdvertisementFeePriceAsync(price) {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return { ok: false, error: new Error("Bei lazima iwe namba chanya") };
  }

  const previous = getAdvertisementFeeConfig();
  const next = { ...previous, price: numericPrice };

  saveLocal(next);

  try {
    await api.patch("/advertisement-fees/", { price: numericPrice });
    return { ok: true, config: next };
  } catch (err) {
    saveLocal(previous); // Rollback
    console.warn("[advertisementFeeStore] updatePrice failed:", err);
    return { ok: false, error: err };
  }
}

export async function updateAdvertisementFeeAsync(patch) {
  const previous = getAdvertisementFeeConfig();
  const next = { ...previous, ...patch };
  saveLocal(next);

  const payload = {};
  if (patch.price != null) payload.price = Number(patch.price);
  if (patch.days != null) payload.days = Number(patch.days);
  if (patch.label != null) payload.label = patch.label;
  if (patch.desc != null) payload.desc = patch.desc;

  try {
    await api.patch("/advertisement-fees/", payload);
    return { ok: true, config: next };
  } catch (err) {
    saveLocal(previous); // Rollback
    console.warn("[advertisementFeeStore] update failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// LEGACY SYNC (deprecated)
// ============================================================
/** @deprecated Use updateAdvertisementFeePriceAsync */
export function updateAdvertisementFeePrice(price) {
  const current = getAdvertisementFeeConfig();
  const next = { ...current, price: Number(price) };
  saveLocal(next);
  api.patch("/advertisement-fees/", { price: next.price })
    .catch((err) => console.warn("[advertisementFeeStore] sync failed (silent):", err));
  return next;
}

// ============================================================
// HOOK
// ============================================================
export function useAdvertisementFeeConfig() {
  const [config, setConfig] = useState(() => getAdvertisementFeeConfig());

  useEffect(() => {
    hydrateAdvertisementFeeFromApi();
    const sync = () => setConfig(getAdvertisementFeeConfig());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return config;
}

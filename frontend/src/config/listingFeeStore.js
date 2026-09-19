// ============================================================
// leadingFeeStore.js — API-backed via /api/leading-fees/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_leading_fee_config_v1";
const UPDATE_EVENT = "sokomkononi:leading-fee-config-updated";

export const SEED_LEADING_FEE_CONFIG = {
  price: 10000,
  days: 7,
  label: { sw: "Ada ya Kipaumbele", en: "Leading Fee" },
  desc: {
    sw: "Bidhaa yako inapanda juu ya matokeo ya utafutaji kwa siku 7",
    en: "Your listing appears at the top of search results for 7 days",
  },
};

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return SEED_LEADING_FEE_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LEADING_FEE_CONFIG;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.price !== "number") return SEED_LEADING_FEE_CONFIG;
    return { ...SEED_LEADING_FEE_CONFIG, ...parsed };
  } catch {
    return SEED_LEADING_FEE_CONFIG;
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
  if (!raw) return SEED_LEADING_FEE_CONFIG;
  return {
    backendId: raw.id,  // ⬅️ hifadhi kwa PATCH
    price: Number(raw.price) || SEED_LEADING_FEE_CONFIG.price,
    days: Number(raw.days) || SEED_LEADING_FEE_CONFIG.days,
    label: raw.label || SEED_LEADING_FEE_CONFIG.label,
    desc: raw.desc || SEED_LEADING_FEE_CONFIG.desc,
  };
}

// ============================================================
// READS
// ============================================================
export function getLeadingFeeConfig() {
  return readFromStorage();
}

export function saveLeadingFeeConfig(config) {
  saveLocal(config);
}

// ============================================================
// HYDRATE
// ============================================================
export async function hydrateLeadingFeeFromApi() {
  try {
    const data = await api.get("/leading-fees/");
    const normalized = normalizeFromApi(data);
    saveLocal(normalized);
    return { source: "api", config: normalized };
  } catch (err) {
    console.warn("[leadingFeeStore] hydrate failed:", err);
    return { source: "error", config: getLeadingFeeConfig() };
  }
}

// ============================================================
// ASYNC MUTATIONS — with rollback
// ============================================================
export async function updateLeadingFeePriceAsync(price) {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return { ok: false, error: new Error("Bei lazima iwe namba chanya") };
  }

  const previous = getLeadingFeeConfig();
  const next = { ...previous, price: numericPrice };

  // Optimistic
  saveLocal(next);

  try {
    // Backend inaweza kuwa singleton — tumia PATCH bila id
    await api.patch("/leading-fees/", { price: numericPrice });
    return { ok: true, config: next };
  } catch (err) {
    saveLocal(previous); // Rollback
    console.warn("[leadingFeeStore] updatePrice failed:", err);
    return { ok: false, error: err };
  }
}

export async function updateLeadingFeeAsync(patch) {
  const previous = getLeadingFeeConfig();
  const next = { ...previous, ...patch };
  saveLocal(next);

  const payload = {};
  if (patch.price != null) payload.price = Number(patch.price);
  if (patch.days != null) payload.days = Number(patch.days);
  if (patch.label != null) payload.label = patch.label;
  if (patch.desc != null) payload.desc = patch.desc;

  try {
    await api.patch("/leading-fees/", payload);
    return { ok: true, config: next };
  } catch (err) {
    saveLocal(previous); // Rollback
    console.warn("[leadingFeeStore] update failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// LEGACY SYNC (deprecated)
// ============================================================
/** @deprecated Use updateLeadingFeePriceAsync */
export function updateLeadingFeePrice(price) {
  const current = getLeadingFeeConfig();
  const next = { ...current, price: Number(price) };
  saveLocal(next);
  api.patch("/leading-fees/", { price: next.price })
    .catch((err) => console.warn("[leadingFeeStore] sync failed (silent):", err));
  return next;
}

// ============================================================
// HOOK
// ============================================================
export function useLeadingFeeConfig() {
  const [config, setConfig] = useState(() => getLeadingFeeConfig());

  useEffect(() => {
    hydrateLeadingFeeFromApi();
    const sync = () => setConfig(getLeadingFeeConfig());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return config;
}

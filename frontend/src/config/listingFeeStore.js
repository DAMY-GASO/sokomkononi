// ============================================================
// listingFeeStore.js
// Backend source: /api/listings/fee-rules/
// Backend stores `percentage` (e.g. 2.50 = 2.5%). Frontend uses
// `rate` (0.025). Conversion handled here.
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { listingFeeRulesApi } from "../api/listingFeeRules.js";

const STORAGE_KEY = "sokomkononi_listing_fee_config_v1";
const UPDATE_EVENT = "sokomkononi:listing-fee-config-updated";

export const SEED_LISTING_FEE_CONFIG = [
  { key: "nyumba", rate: 0.010, min: 20000, max: 300000 },
  { key: "viwanja", rate: 0.008, min: 15000, max: 250000 },
  { key: "magari", rate: 0.015, min: 10000, max: 150000 },
  { key: "biashara", rate: 0.012, min: 20000, max: 200000 },
  { key: "mashine", rate: 0.010, min: 15000, max: 180000 },
];

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return SEED_LISTING_FEE_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LISTING_FEE_CONFIG;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_LISTING_FEE_CONFIG;
    return parsed;
  } catch {
    return SEED_LISTING_FEE_CONFIG;
  }
}

export function saveListingFeeConfigs(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// READS
// ============================================================
export function getListingFeeConfigs() { return readFromStorage(); }

export function getListingFeeConfig(categoryKey) {
  if (!categoryKey) return null;
  return getListingFeeConfigs().find((c) => c.key === categoryKey) || null;
}

export function hasFeeConfig(categoryKey) {
  return getListingFeeConfigs().some((c) => c.key === categoryKey);
}

// ============================================================
// SYNC MUTATIONS (deprecated — use async)
// ============================================================
/** @deprecated Use updateListingFeeConfigAsync */
export function updateListingFeeConfig(categoryKey, patch) {
  const current = getListingFeeConfigs();
  const target = current.find((c) => c.key === categoryKey);
  const next = current.map((c) => (c.key === categoryKey ? { ...c, ...patch } : c));
  saveListingFeeConfigs(next);
  if (target?.id) {
    const apiPatch = {};
    if (patch.rate != null) apiPatch.percentage = patch.rate * 100;
    if (patch.min != null) apiPatch.min_price = patch.min;
    if (patch.max != null) apiPatch.max_price = patch.max;
    listingFeeRulesApi.update(target.id, apiPatch).catch(() => {});
  }
  return next;
}

/** @deprecated Use addFeeConfigAsync */
export function addFeeConfig(categoryKey, _label) {
  const current = getListingFeeConfigs();
  if (current.some((c) => c.key === categoryKey)) {
    throw new Error(`Fee config for "${categoryKey}" already exists.`);
  }
  const next = [...current, { key: categoryKey, rate: 0.01, min: 10000, max: 100000 }];
  saveListingFeeConfigs(next);
  listingFeeRulesApi.create({
    name: categoryKey, percentage: 1.0, min_price: 10000, max_price: 100000,
  }).catch(() => {});
  return next;
}

/** @deprecated Use removeFeeConfigAsync */
export function removeFeeConfig(categoryKey) {
  const current = getListingFeeConfigs();
  const target = current.find((c) => c.key === categoryKey);
  const next = current.filter((c) => c.key !== categoryKey);
  saveListingFeeConfigs(next);
  if (target?.id) listingFeeRulesApi.remove(target.id).catch(() => {});
  return next;
}

// ============================================================
// ASYNC MUTATIONS
// ============================================================
export async function updateListingFeeConfigAsync(categoryKey, patch) {
  const previous = getListingFeeConfigs();
  const target = previous.find((c) => c.key === categoryKey);
  if (!target) return { ok: false, error: new Error("Fee config not found") };

  const optimistic = { ...target, ...patch };
  saveListingFeeConfigs(previous.map((c) => (c.key === categoryKey ? optimistic : c)));

  if (typeof target.id !== "number") {
    return { ok: true, warning: "local_only", config: optimistic };
  }

  const apiPatch = {};
  if (patch.rate != null) apiPatch.percentage = patch.rate * 100;
  if (patch.min != null) apiPatch.min_price = patch.min;
  if (patch.max != null) apiPatch.max_price = patch.max;

  try {
    await listingFeeRulesApi.update(target.id, apiPatch);
    return { ok: true, config: optimistic };
  } catch (err) {
    saveListingFeeConfigs(previous);
    console.warn("[listingFeeStore] updateListingFeeConfig failed:", err);
    return { ok: false, error: err };
  }
}

export async function addFeeConfigAsync(categoryKey) {
  if (!categoryKey) return { ok: false, error: new Error("Category key required") };
  const previous = getListingFeeConfigs();
  if (previous.some((c) => c.key === categoryKey)) {
    return { ok: false, error: new Error(`Fee config for "${categoryKey}" already exists`) };
  }

  const optimistic = { key: categoryKey, rate: 0.01, min: 10000, max: 100000 };
  saveListingFeeConfigs([...previous, optimistic]);

  try {
    const raw = await listingFeeRulesApi.create({
      name: categoryKey, percentage: 1.0, min_price: 10000, max_price: 100000,
    });
    if (raw?.id) {
      const normalized = {
        id: raw.id,
        key: categoryKey,
        rate: (Number(raw.percentage) || 1) / 100,
        min: Number(raw.min_price) || 10000,
        max: Number(raw.max_price) || 100000,
      };
      const current = getListingFeeConfigs();
      saveListingFeeConfigs(current.map((c) => (c.key === categoryKey ? normalized : c)));
      return { ok: true, config: normalized };
    }
    return { ok: true, config: optimistic };
  } catch (err) {
    saveListingFeeConfigs(previous);
    console.warn("[listingFeeStore] addFeeConfig failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeFeeConfigAsync(categoryKey) {
  const previous = getListingFeeConfigs();
  const target = previous.find((c) => c.key === categoryKey);
  if (!target) return { ok: false, error: new Error("Fee config not found") };

  saveListingFeeConfigs(previous.filter((c) => c.key !== categoryKey));

  if (typeof target.id !== "number") return { ok: true, warning: "local_only" };

  try {
    await listingFeeRulesApi.remove(target.id);
    return { ok: true };
  } catch (err) {
    saveListingFeeConfigs(previous);
    console.warn("[listingFeeStore] removeFeeConfig failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// API NORMALIZER
// ============================================================
function toSlug(str) {
  return String(str || "").trim().toLowerCase()
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function normalizeFeeRuleFromApi(raw) {
  if (!raw) return null;
  const pct = Number(raw.percentage) || 0;
  return {
    id: raw.id,
    key: toSlug(raw.name),
    rate: pct / 100,
    min: Number(raw.min_price) || 0,
    max: raw.max_price != null ? Number(raw.max_price) : 999999999,
    isActive: raw.is_active !== false,
    priority: raw.priority ?? 0,
  };
}

// ============================================================
// HYDRATE
// ============================================================
export async function hydrateListingFeeConfigsFromApi() {
  try {
    const data = await api.get("/listings/fee-rules/?page_size=100");
    const rawList = Array.isArray(data) ? data : data?.results || [];
    if (!rawList.length) {
      return { source: "seed", count: getListingFeeConfigs().length };
    }
    const normalized = rawList.map(normalizeFeeRuleFromApi).filter(Boolean);
    saveListingFeeConfigs(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[listingFeeStore] hydrate failed:", err);
    return { source: "error", count: getListingFeeConfigs().length };
  }
}

// ============================================================
// HOOK
// ============================================================
export function useListingFeeConfigs() {
  const [configs, setConfigs] = useState(() => getListingFeeConfigs());
  useEffect(() => {
    hydrateListingFeeConfigsFromApi();
    const sync = () => setConfigs(getListingFeeConfigs());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return configs;
}

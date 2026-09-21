// ============================================================
// listingFeeStore.js
// Backend source: /api/listings/fee-rules/ (read-only for
// non-admin). Backend stores `percentage` (e.g. 2.50 for 2.5%).
// Frontend uses `rate` (e.g. 0.025). Conversion handled here.
// ============================================================

import { useEffect, useState } from "react";
import { api } from "../api/client.js";

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
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SEED_LISTING_FEE_CONFIG;
    }
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
export function getListingFeeConfigs() {
  return readFromStorage();
}

/**
 * getListingFeeConfig(categoryKey)
 * Rudisha config ya category moja kwa key yake (mfano "nyumba").
 * Build inatafuta hii — MUHIMU.
 */
export function getListingFeeConfig(categoryKey) {
  if (!categoryKey) return null;
  return getListingFeeConfigs().find((c) => c.key === categoryKey) || null;
}

export function hasFeeConfig(categoryKey) {
  return getListingFeeConfigs().some((c) => c.key === categoryKey);
}

// ============================================================
// MUTATIONS (admin/local)
// ============================================================
export function updateListingFeeConfig(categoryKey, patch) {
  const current = getListingFeeConfigs();
  const next = current.map((c) =>
    c.key === categoryKey ? { ...c, ...patch } : c
  );
  saveListingFeeConfigs(next);
  return next;
}

export function addFeeConfig(categoryKey, _label) {
  const current = getListingFeeConfigs();
  if (current.some((c) => c.key === categoryKey)) {
    throw new Error(`Fee config ya "${categoryKey}" ipo tayari.`);
  }
  const next = [
    ...current,
    { key: categoryKey, rate: 0.01, min: 10000, max: 100000 },
  ];
  saveListingFeeConfigs(next);
  return next;
}

export function removeFeeConfig(categoryKey) {
  const next = getListingFeeConfigs().filter((c) => c.key !== categoryKey);
  saveListingFeeConfigs(next);
  return next;
}

// ============================================================
// API NORMALIZER
// Backend `name` field ni category key/slug.
// ============================================================
function toSlug(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
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
// HYDRATE FROM API
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

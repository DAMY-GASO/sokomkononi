// ============================================================
// bundlesStore.js — API-backed via /api/bundles/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_bundles_v1";
const UPDATE_EVENT = "sokomkononi:bundles-updated";

export const SEED_BUNDLES = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_BUNDLES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_BUNDLES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_BUNDLES;
  } catch {
    return SEED_BUNDLES;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function normalizeFromApi(raw) {
  if (!raw) return null;
  const typeMap = {
    LISTING: "listing", LEADING: "leading", BOOST: "boost",
    RESERVATION: "reservation", ADS: "ads", PREMIUM: "premium", PACKAGE: "package",
  };
  return {
    id: raw.id,
    code: raw.code,
    type: typeMap[raw.type] || raw.type,
    name: raw.name || { sw: "", en: "" },
    description: raw.description || { sw: "", en: "" },
    price: Number(raw.price) || 0,
    credits: raw.credits || {},
    validityDays: raw.validityDays || 90,
    services: raw.services || [],
    discountPercent: raw.discountPercent || 0,
    icon: raw.icon || "",
    color: raw.color || "",
    active: !!raw.active,
    featured: !!raw.featured,
  };
}

export function getBundles() { return readFromStorage(); }
export function getActiveBundles() { return getBundles().filter((b) => b.active !== false); }
export function getBundle(id) { return getBundles().find((b) => b.id === id) || null; }
export function getBundlesByType(type) {
  return getActiveBundles().filter((b) => b.type === type);
}

export function initializeBundles(list) {
  if (!Array.isArray(list) || list.length === 0) return getBundles();
  const current = getBundles();
  if (current.length > 0) return current;
  saveAll(list);
  return list;
}

export function resetBundles(list = SEED_BUNDLES) { saveAll(list); return list; }

export async function hydrateBundlesFromApi() {
  try {
    const data = await api.get("/bundles/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeFromApi).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[bundlesStore] hydrate failed:", err);
    return { source: "error", count: getBundles().length };
  }
}

export async function purchaseBundleAsync(bundleId, payment_reference = "") {
  return api.post("/bundles/purchases/", {
    bundle: bundleId, payment_reference,
  });
}

export function addBundle() {}
export function updateBundle(id, patch) {
  const next = getBundles().map((b) => (b.id === id ? { ...b, ...patch } : b));
  saveAll(next);
  return next;
}
export function toggleBundleActive(id) {
  const next = getBundles().map((b) => b.id === id ? { ...b, active: !b.active } : b);
  saveAll(next);
  return next;
}
export function removeBundle(id) {
  const next = getBundles().filter((b) => b.id !== id);
  saveAll(next);
  return next;
}

export function useBundles() {
  const [list, setList] = useState(() => getBundles());
  useEffect(() => {
    hydrateBundlesFromApi();
    const sync = () => setList(getBundles());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return list;
}
export function useActiveBundles() { return useBundles().filter((b) => b.active !== false); }
export function useBundlesByType(type) { return useBundles().filter((b) => b.active !== false && b.type === type); }

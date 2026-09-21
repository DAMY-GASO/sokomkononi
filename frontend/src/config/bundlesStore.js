// ============================================================
// bundlesStore.js — API-backed via /api/bundles/
// Admin CRUD + user purchase. Graceful local fallback.
// ============================================================
import { useEffect, useState } from "react";
import { bundlesApi } from "../api/bundles.js";

const STORAGE_KEY = "sokomkononi_bundles_v1";
const UPDATE_EVENT = "sokomkononi:bundles-updated";

export const SEED_BUNDLES = [];

// ---------- STORAGE ----------
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

// ---------- NORMALIZER ----------
const TYPE_FROM_API = {
  LISTING: "listing", LEADING: "leading", BOOST: "boost",
  RESERVATION: "reservation", ADS: "ads", PREMIUM: "premium", PACKAGE: "package",
};

function normalizeFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    code: raw.code || raw.id,
    type: TYPE_FROM_API[raw.type] || (raw.type || "package").toLowerCase(),
    name: raw.name || { sw: "", en: "" },
    description: raw.description || { sw: "", en: "" },
    price: Number(raw.price) || 0,
    credits: raw.credits || {},
    validityDays: raw.validityDays || raw.validity_days || 90,
    services: raw.services || [],
    discountPercent: raw.discountPercent || raw.discount_percent || 0,
    icon: raw.icon || "Package",
    color: raw.color || "night",
    active: raw.active !== false && raw.is_active !== false,
    featured: !!raw.featured,
  };
}

function toApiPayload(form) {
  const creditsObj =
    form.credits && typeof form.credits === "object"
      ? form.credits
      : { [form.type || "listing"]: Number(form.credits) || 1 };

  return {
    code: form.code || form.id,
    type: (form.type || "PACKAGE").toUpperCase(),
    name: form.name,
    description: form.description,
    price: Number(form.price) || 0,
    credits: creditsObj,
    validity_days: Number(form.validityDays) || 90,
    services: form.services || [],
    discount_percent: Number(form.discountPercent) || 0,
    icon: form.icon || "Package",
    color: form.color || "night",
    is_active: form.active !== false,
    featured: !!form.featured,
  };
}

// ---------- READS ----------
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

// ---------- HYDRATE ----------
export async function hydrateBundlesFromApi() {
  try {
    const data = await bundlesApi.list({ page_size: 100 });
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeFromApi).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[bundlesStore] hydrate failed:", err);
    return { source: "error", count: getBundles().length };
  }
}

// ---------- ASYNC CRUD (Admin) ----------
export async function createBundleAsync(form) {
  const code = (form?.code || form?.id || "").trim();
  if (!code) return { ok: false, error: new Error("Bundle code/ID is required") };
  if (!form?.name?.sw?.trim() || !form?.name?.en?.trim()) {
    return { ok: false, error: new Error("Bilingual name (SW + EN) is required") };
  }

  const previous = getBundles();
  const optimistic = {
    id: code,
    code,
    type: form.type || "listing",
    name: form.name,
    description: form.description || { sw: "", en: "" },
    price: Number(form.price) || 0,
    credits: form.credits || {},
    validityDays: Number(form.validityDays) || 90,
    services: form.services || [],
    discountPercent: Number(form.discountPercent) || 0,
    icon: form.icon || "Package",
    color: form.color || "night",
    active: form.active !== false,
    featured: !!form.featured,
  };
  saveAll([...previous, optimistic]);

  try {
    const raw = await bundlesApi.create(toApiPayload(form));
    const created = normalizeFromApi(raw);
    if (created) {
      const current = getBundles();
      saveAll(current.map((b) => (b.id === code ? created : b)));
      return { ok: true, bundle: created };
    }
    return { ok: true, bundle: optimistic };
  } catch (err) {
    saveAll(previous);
    console.warn("[bundlesStore] createBundle failed:", err);
    return { ok: false, error: err };
  }
}

export async function updateBundleAsync(id, patch) {
  const previous = getBundles();
  const target = previous.find((b) => b.id === id);
  if (!target) return { ok: false, error: new Error("Bundle not found") };

  const optimistic = { ...target, ...patch };
  saveAll(previous.map((b) => (b.id === id ? optimistic : b)));

  // Local-only (no backend id yet)
  if (typeof id !== "number") {
    return { ok: true, warning: "local_only", bundle: optimistic };
  }

  try {
    const raw = await bundlesApi.update(id, toApiPayload(optimistic));
    const updated = normalizeFromApi(raw);
    if (updated) {
      const current = getBundles();
      saveAll(current.map((b) => (b.id === id ? updated : b)));
      return { ok: true, bundle: updated };
    }
    return { ok: true, bundle: optimistic };
  } catch (err) {
    saveAll(previous);
    console.warn("[bundlesStore] updateBundle failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeBundleAsync(id) {
  const previous = getBundles();
  saveAll(previous.filter((b) => b.id !== id));

  if (typeof id !== "number") return { ok: true, warning: "local_only" };

  try {
    await bundlesApi.remove(id);
    return { ok: true };
  } catch (err) {
    saveAll(previous);
    console.warn("[bundlesStore] removeBundle failed:", err);
    return { ok: false, error: err };
  }
}

export async function toggleBundleActiveAsync(id) {
  const previous = getBundles();
  const target = previous.find((b) => b.id === id);
  if (!target) return { ok: false, error: new Error("Bundle not found") };

  const nextActive = !target.active;
  saveAll(previous.map((b) => (b.id === id ? { ...b, active: nextActive } : b)));

  if (typeof id !== "number") return { ok: true, active: nextActive };

  try {
    await bundlesApi.toggleActive(id);
    return { ok: true, active: nextActive };
  } catch (err) {
    saveAll(previous);
    console.warn("[bundlesStore] toggleBundleActive failed:", err);
    return { ok: false, error: err };
  }
}

// ---------- PURCHASE (user) ----------
export async function purchaseBundleAsync(bundleId, payment_reference = "") {
  return bundlesApi.purchase(bundleId, payment_reference);
}

// ---------- LEGACY SYNC (deprecated) ----------
/** @deprecated Use createBundleAsync */
export function addBundle(bundle) {
  if (!bundle?.id) return getBundles();
  const current = getBundles();
  const next = [...current, bundle];
  saveAll(next);
  bundlesApi.create(toApiPayload(bundle)).catch(() => {});
  return next;
}

/** @deprecated Use updateBundleAsync */
export function updateBundle(id, patch) {
  const next = getBundles().map((b) => (b.id === id ? { ...b, ...patch } : b));
  saveAll(next);
  if (typeof id === "number") bundlesApi.update(id, patch).catch(() => {});
  return next;
}

/** @deprecated Use toggleBundleActiveAsync */
export function toggleBundleActive(id) {
  const next = getBundles().map((b) =>
    b.id === id ? { ...b, active: !b.active } : b
  );
  saveAll(next);
  if (typeof id === "number") bundlesApi.toggleActive(id).catch(() => {});
  return next;
}

/** @deprecated Use removeBundleAsync */
export function removeBundle(id) {
  const next = getBundles().filter((b) => b.id !== id);
  saveAll(next);
  if (typeof id === "number") bundlesApi.remove(id).catch(() => {});
  return next;
}

// ---------- HOOKS ----------
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

export function useActiveBundles() {
  return useBundles().filter((b) => b.active !== false);
}

export function useBundlesByType(type) {
  return useBundles().filter((b) => b.active !== false && b.type === type);
}

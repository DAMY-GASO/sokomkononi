// ============================================================
// bundlesStore.js — API-only via /api/bundles/
// ============================================================
import { useEffect, useState } from "react";
import { bundlesApi } from "../api/bundles.js";

const KEY = "sokomkononi_bundles_v1";
const EV = "sokomkononi:bundles-updated";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}
function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

const TYPE_FROM_API = {
  LISTING: "listing", LEADING: "leading", BOOST: "boost",
  RESERVATION: "reservation", ADS: "ads", PREMIUM: "premium", PACKAGE: "package",
};
function norm(raw) {
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
function toApi(form) {
  const credits = form.credits && typeof form.credits === "object"
    ? form.credits
    : { [form.type || "listing"]: Number(form.credits) || 1 };
  return {
    code: form.code,
    type: (form.type || "PACKAGE").toUpperCase(),
    name: form.name, description: form.description,
    price: Number(form.price) || 0,
    credits,
    validity_days: Number(form.validityDays) || 90,
    services: form.services || [],
    discount_percent: Number(form.discountPercent) || 0,
    icon: form.icon || "Package",
    color: form.color || "night",
    is_active: form.active !== false,
    featured: !!form.featured,
  };
}

export function getBundles() { return read(); }
export function getActiveBundles() { return read().filter((b) => b.active !== false); }
export function getBundle(id) { return read().find((b) => b.id === id) || null; }
export function getBundlesByType(type) { return getActiveBundles().filter((b) => b.type === type); }

export function initializeBundles() { /* API-only */ }
export function resetBundles(list) { write(Array.isArray(list) ? list : []); }

export async function hydrateBundlesFromApi() {
  try {
    const d = await bundlesApi.list({ page_size: 200 });
    const list = Array.isArray(d) ? d : d?.results || [];
    const normalized = list.map(norm).filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function createBundleAsync(form) {
  if (!form?.code?.trim()) return { ok: false, error: new Error("Bundle code/ID required") };
  if (!form?.name?.sw?.trim() || !form?.name?.en?.trim()) {
    return { ok: false, error: new Error("Bilingual name (SW+EN) required") };
  }
  try {
    const raw = await bundlesApi.create(toApi(form));
    const created = norm(raw);
    write([created, ...read()]);
    return { ok: true, bundle: created };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateBundleAsync(id, patch) {
  const target = getBundle(id);
  if (!target) return { ok: false, error: new Error("Bundle not found") };
  if (typeof id !== "number") return { ok: false, error: new Error("Bundle has no backend id") };
  try {
    const raw = await bundlesApi.update(id, toApi({ ...target, ...patch }));
    const updated = norm(raw);
    write(read().map((b) => (b.id === id ? updated : b)));
    return { ok: true, bundle: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeBundleAsync(id) {
  try {
    await bundlesApi.remove(id);
    write(read().filter((b) => b.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function toggleBundleActiveAsync(id) {
  const target = getBundle(id);
  if (!target) return { ok: false, error: new Error("Bundle not found") };
  if (typeof id !== "number") return { ok: false, error: new Error("Bundle has no backend id") };
  try {
    const raw = await bundlesApi.toggleActive(id);
    const updated = norm(raw) || { ...target, active: !target.active };
    write(read().map((b) => (b.id === id ? updated : b)));
    return { ok: true, active: updated.active };
  } catch (err) { return { ok: false, error: err }; }
}

export async function purchaseBundleAsync(id, ref = "") {
  try {
    const raw = await bundlesApi.purchase(id, ref);
    return { ok: true, purchase: raw };
  } catch (err) { return { ok: false, error: err }; }
}

export function useBundles() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateBundlesFromApi();
    const sync = () => setList(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return list;
}
export function useActiveBundles() { return useBundles().filter((b) => b.active !== false); }
export function useBundlesByType(type) { return useBundles().filter((b) => b.active !== false && b.type === type); }

// ══════════════════════════════════════════════════════════════
// LEGACY EXPORTS (backward compat — API is source of truth)
// ══════════════════════════════════════════════════════════════
export const SEED_BUNDLES = [];

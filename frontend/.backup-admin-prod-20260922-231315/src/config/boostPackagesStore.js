// ============================================================
// boostPackagesStore.js
// CHANZO KIMOJA CHA UKWELI kwa bei za Boost Packages.
// Read: /api/boosting/packages/ (public)
// Update: PATCH /api/boosting/packages/{id}/  (admin)
// ============================================================
import { useEffect, useState } from "react";
import { boostingApi } from "../api/boosting.js";
import { boostPackagesApi } from "../api/boostPackages.js";

const STORAGE_KEY = "sokomkononi_boost_packages_v1";
const UPDATE_EVENT = "sokomkononi:boost-packages-updated";

export const SEED_BOOST_PACKAGES = [
  {
    key: "basic",
    label: { sw: "Basic Boost", en: "Basic Boost" },
    days: 3, price: 5000,
    benefits: {
      sw: ["Inapanda juu ya matokeo ya utafutaji", "Badge ya 'Boosted' kwenye tangazo"],
      en: ["Appears above search results", "'Boosted' badge on the listing"],
    },
  },
  {
    key: "featured",
    label: { sw: "Featured Boost", en: "Featured Boost" },
    days: 7, price: 12000,
    benefits: {
      sw: ["Kila kitu cha Basic Boost", "Inaonekana kwenye sehemu ya 'Featured' ukurasa wa mwanzo", "Kipaumbele kwenye matokeo ya category yako"],
      en: ["Everything in Basic Boost", "Appears in the 'Featured' section of the homepage", "Priority in your category's search results"],
    },
  },
  {
    key: "premium",
    label: { sw: "Premium Boost", en: "Premium Boost" },
    days: 14, price: 20000,
    benefits: {
      sw: ["Kila kitu cha Featured Boost", "Inaonekana kwenye 'Featured' kwa muda mrefu zaidi", "Ripoti ya views/inquiries ya kina baada ya kila wiki"],
      en: ["Everything in Featured Boost", "Appears in 'Featured' for longer", "Detailed views/inquiries report every week"],
    },
  },
];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_BOOST_PACKAGES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_BOOST_PACKAGES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_BOOST_PACKAGES;
    return parsed;
  } catch {
    return SEED_BOOST_PACKAGES;
  }
}

export function getBoostPackages() { return readFromStorage(); }

export function saveBoostPackages(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function getBoostPackage(key) {
  return getBoostPackages().find((p) => p.key === key);
}

function normalizePackageFromApi(raw) {
  if (!raw) return null;
  const slug = (raw.code || raw.name || "")
    .toString().toLowerCase()
    .replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  const days = Math.round((raw.duration_hours || 0) / 24) || 1;
  return {
    id: raw.id,
    key: slug,
    label: { sw: raw.name, en: raw.name },
    days,
    price: Number(raw.price) || 0,
    description: raw.description || "",
    benefits: { sw: [], en: [] },
    isActive: raw.is_active !== false,
  };
}

export async function hydrateBoostPackagesFromApi() {
  try {
    const data = await boostingApi.packages({ page_size: 100 });
    const rawList = Array.isArray(data) ? data : data?.results || [];
    if (!rawList.length) return { source: "seed", count: getBoostPackages().length };
    const normalized = rawList.map(normalizePackageFromApi).filter(Boolean);
    saveBoostPackages(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[boostPackagesStore] hydrate failed:", err);
    return { source: "error", count: getBoostPackages().length };
  }
}

// ============================================================
// ASYNC UPDATE — admin price editor
// ============================================================
export async function updateBoostPackagePriceAsync(key, price) {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return { ok: false, error: new Error("Price must be a positive number") };
  }

  const previous = getBoostPackages();
  const target = previous.find((p) => p.key === key);
  if (!target) return { ok: false, error: new Error(`Package "${key}" not found`) };

  const next = previous.map((p) => (p.key === key ? { ...p, price: numericPrice } : p));
  saveBoostPackages(next);

  // Local-only package (no backend id yet)
  if (typeof target.id !== "number") {
    return { ok: true, warning: "local_only", packages: next };
  }

  try {
    await boostPackagesApi.update(target.id, { price: numericPrice });
    return { ok: true, packages: next };
  } catch (err) {
    saveBoostPackages(previous);
    console.warn("[boostPackagesStore] updatePrice failed:", err);
    return { ok: false, error: err };
  }
}

/** @deprecated Use updateBoostPackagePriceAsync */
export function updateBoostPackagePrice(key, price) {
  const current = getBoostPackages();
  const next = current.map((p) => (p.key === key ? { ...p, price: Number(price) } : p));
  saveBoostPackages(next);
  return next;
}

// ============================================================
// ASYNC ACTIONS — backend-backed
// ============================================================
export async function createBoostAsync({ listingId, packageId }) {
  const boost = await boostingApi.create({ listing: listingId, package: packageId });
  window.dispatchEvent(new Event(UPDATE_EVENT));
  return boost;
}

export async function payBoostAsync(boostId, payment_reference) {
  const boost = await boostingApi.pay(boostId, payment_reference);
  window.dispatchEvent(new Event(UPDATE_EVENT));
  return boost;
}

export async function activateBoostAsync(boostId) {
  const boost = await boostingApi.activate(boostId);
  window.dispatchEvent(new Event(UPDATE_EVENT));
  return boost;
}

export async function cancelBoostAsync(boostId) {
  const boost = await boostingApi.cancel(boostId);
  window.dispatchEvent(new Event(UPDATE_EVENT));
  return boost;
}

export async function fetchMyBoostsAsync() {
  try {
    const data = await boostingApi.mine({ page_size: 100 });
    return Array.isArray(data) ? data : data?.results || [];
  } catch (err) {
    console.warn("[boostPackagesStore] fetchMyBoosts failed:", err);
    return [];
  }
}

// ============================================================
// HOOK
// ============================================================
export function useBoostPackages() {
  const [packages, setPackages] = useState(() => getBoostPackages());
  useEffect(() => {
    hydrateBoostPackagesFromApi();
    const sync = () => setPackages(getBoostPackages());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return packages;
}

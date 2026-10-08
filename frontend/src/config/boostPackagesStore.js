// ============================================================
// boostPackagesStore.js — API-only via /api/boosting/packages/
// No seeds. Update requires a real backend id.
// ============================================================
import { useEffect, useState } from "react";
import { boostingApi } from "../api/boosting.js";
import { boostPackagesApi } from "../api/boostPackages.js";

const KEY = "sokomkononi_boost_packages_v1";
const EV = "sokomkononi:boost-packages-updated";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

function norm(raw) {
  if (!raw) return null;
  const slug = (raw.code || raw.name || "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  const hours = Number(raw.duration_hours) || 0;
  const days = Math.round(hours / 24) || 1;
  return {
    id: raw.id,
    key: slug,
    name: raw.name,
    label: { sw: raw.name, en: raw.name },
    days,
    hours,
    price: Number(raw.price) || 0,
    pricing: raw.pricing || null,
    description: raw.description || "",
    benefits: { sw: [], en: [] },
    isActive: raw.is_active !== false,
    ordering: Number(raw.ordering) || 0,
  };
}

export function getBoostPackages() {
  return read();
}

export function getBoostPackage(key) {
  return read().find((p) => p.key === key);
}

let _boostPkgsHydratePromise = null;
export async function hydrateBoostPackagesFromApi() {
  if (_boostPkgsHydratePromise) return _boostPkgsHydratePromise;
  _boostPkgsHydratePromise = (async () => {
    try {
      const data = await boostingApi.packages({ page_size: 200 });
      const list = Array.isArray(data) ? data : data?.results || [];
      const normalized = list.map(norm).filter(Boolean);
      write(normalized);
      return { ok: true, count: normalized.length };
    } catch (err) {
      return { ok: false, error: err };
    }
  })().finally(() => { _boostPkgsHydratePromise = null; });
  return _boostPkgsHydratePromise;
}

export async function updateBoostPackagePriceAsync(key, price) {
  const num = Number(price);
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: new Error("price must be a positive number") };
  }
  const target = getBoostPackage(key);
  if (!target) {
    return { ok: false, error: new Error(`Package "${key}" not found`) };
  }
  if (typeof target.id !== "number") {
    return {
      ok: false,
      error: new Error(`Package "${key}" has no backend id — hydrate first`),
    };
  }
  try {
    const raw = await boostPackagesApi.update(target.id, { price: num });
    const updated = norm(raw) || { ...target, price: num };
    write(read().map((p) => (p.key === key ? updated : p)));
    return { ok: true, package: updated };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// RENAME — badilisha jina la boost package
// ============================================================
export async function renameBoostPackageAsync(key, name) {
  const clean = (name || "").trim();
  if (!clean) return { ok: false, error: new Error("Name required") };

  const target = getBoostPackage(key);
  if (!target) return { ok: false, error: new Error(`Package "${key}" not found`) };
  if (typeof target.id !== "number") {
    return { ok: false, error: new Error("Package has no backend id") };
  }

  // Optimistic
  write(read().map((p) => (p.key === key ? { ...p, name: clean } : p)));

  try {
    const raw = await boostPackagesApi.update(target.id, { name: clean });
    const updated = norm(raw);
    if (updated) {
      write(read().map((p) => (p.key === key ? updated : p)));
    }
    return { ok: true, package: updated || { ...target, name: clean } };
  } catch (err) {
    // Rollback
    write(read().map((p) => (p.key === key ? target : p)));
    return { ok: false, error: err };
  }
}

// ============================================================
// TOGGLE ACTIVE
// ============================================================
export async function toggleBoostPackageActiveAsync(key) {
  const target = getBoostPackage(key);
  if (!target) {
    return { ok: false, error: new Error(`Package "${key}" not found`) };
  }
  if (typeof target.id !== "number") {
    return {
      ok: false,
      error: new Error(`Package "${key}" has no backend id — hydrate first`),
    };
  }
  try {
    const nextActive = !target.isActive;
    const raw = await boostPackagesApi.update(target.id, {
      is_active: nextActive,
    });
    const updated = norm(raw) || { ...target, isActive: nextActive };
    write(read().map((p) => (p.key === key ? updated : p)));
    return { ok: true, package: updated };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// REMOVE — futa boost package
// ============================================================
export async function removeBoostPackageAsync(key) {
  const target = getBoostPackage(key);
  if (!target) {
    return { ok: false, error: new Error(`Package "${key}" not found`) };
  }
  if (typeof target.id !== "number") {
    return {
      ok: false,
      error: new Error(`Package "${key}" has no backend id — hydrate first`),
    };
  }
  const previous = read();
  // Optimistic
  write(previous.filter((p) => p.key !== key));
  try {
    await boostPackagesApi.remove(target.id);
    return { ok: true };
  } catch (err) {
    // Rollback
    write(previous);
    return { ok: false, error: err };
  }
}

export function useBoostPackages() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateBoostPackagesFromApi();
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

export function useActiveBoostPackages() {
  return useBoostPackages().filter((p) => p.isActive);
}
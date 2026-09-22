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
  } catch { return []; }
}
function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

function norm(raw) {
  if (!raw) return null;
  const slug = (raw.code || raw.name || "")
    .toString().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  const days = Math.round((raw.duration_hours || 0) / 24) || 1;
  return {
    id: raw.id,
    key: slug,
    name: raw.name,
    label: { sw: raw.name, en: raw.name },
    days,
    hours: raw.duration_hours,
    price: Number(raw.price) || 0,
    description: raw.description || "",
    benefits: { sw: [], en: [] },
    isActive: raw.is_active !== false,
  };
}

export function getBoostPackages() { return read(); }
export function getBoostPackage(key) { return read().find((p) => p.key === key); }

export async function hydrateBoostPackagesFromApi() {
  try {
    const data = await boostingApi.packages({ page_size: 200 });
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(norm).filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateBoostPackagePriceAsync(key, price) {
  const num = Number(price);
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: new Error("price must be a positive number") };
  }
  const target = getBoostPackage(key);
  if (!target) return { ok: false, error: new Error(`Package "${key}" not found`) };
  if (typeof target.id !== "number") {
    return { ok: false, error: new Error(`Package "${key}" has no backend id — hydrate first`) };
  }
  try {
    const raw = await boostPackagesApi.update(target.id, { price: num });
    const updated = norm(raw) || { ...target, price: num };
    write(read().map((p) => (p.key === key ? updated : p)));
    return { ok: true, package: updated };
  } catch (err) { return { ok: false, error: err }; }
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

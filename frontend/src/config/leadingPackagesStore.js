// src/config/leadingPackagesStore.js
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_leading_packages_v1";
const EV = "sokomkononi:leading-packages-updated";

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
  const hours = Number(raw.duration_hours) || 0;
  return {
    id: raw.id,
    name: raw.name,
    hours,
    days: Math.round(hours / 24) || 1,
    price: Number(raw.price) || 0,
    pricing: raw.pricing || null,
    description: raw.description || "",
    isActive: raw.is_active !== false,
    ordering: Number(raw.ordering) || 0,
  };
}

export function getLeadingPackages() { return read(); }

let _hydratePromise = null;
export async function hydrateLeadingPackagesFromApi() {
  if (_hydratePromise) return _hydratePromise;
  _hydratePromise = (async () => {
    try {
      const d = await api.get("/leading-fees/packages/?page_size=200");
      const list = Array.isArray(d) ? d : d?.results || [];
      write(list.map(norm).filter(Boolean));
      return { ok: true, count: list.length };
    } catch (err) {
      return { ok: false, error: err };
    }
  })().finally(() => { _hydratePromise = null; });
  return _hydratePromise;
}

export async function addLeadingPackageAsync({ name, hours, price, ordering }) {
  try {
    const raw = await api.post("/leading-fees/packages/", {
      name,
      duration_hours: Number(hours),
      price: Number(price),
      is_active: true,
      ordering: Number(ordering) || 0,
    });
    const created = norm(raw);
    write([...read(), created]);
    return { ok: true, package: created };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateLeadingPackageAsync(id, patch) {
  try {
    const body = {};
    if (patch.name != null) body.name = patch.name;
    if (patch.hours != null) body.duration_hours = Number(patch.hours);
    if (patch.price != null) body.price = Number(patch.price);
    if (patch.ordering != null) body.ordering = Number(patch.ordering);
    if (patch.isActive != null) body.is_active = patch.isActive;
    const raw = await api.patch(`/leading-fees/packages/${id}/`, body);
    const updated = norm(raw);
    write(read().map((p) => (p.id === id ? updated : p)));
    return { ok: true, package: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeLeadingPackageAsync(id) {
  try {
    await api.delete(`/leading-fees/packages/${id}/`);
    write(read().filter((p) => p.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function toggleLeadingPackageAsync(id) {
  try {
    const raw = await api.post(`/leading-fees/packages/${id}/toggle/`, {});
    const current = read().find((p) => p.id === id);
    const updated = { ...current, isActive: raw?.is_active ?? !current.isActive };
    write(read().map((p) => (p.id === id ? updated : p)));
    return { ok: true, isActive: updated.isActive };
  } catch (err) { return { ok: false, error: err }; }
}

export function useLeadingPackages() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateLeadingPackagesFromApi();
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
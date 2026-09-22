// ============================================================
// listingFeeStore.js — API-only via /api/listings/fee-rules/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { listingFeeRulesApi } from "../api/listingFeeRules.js";

const KEY = "sokomkononi_listing_fee_config_v1";
const EV = "sokomkononi:listing-fee-config-updated";

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

export function getListingFeeConfigs() { return read(); }
export function getListingFeeConfig(key) { return key ? read().find((c) => c.key === key) || null : null; }
export function hasFeeConfig(key) { return read().some((c) => c.key === key); }

function toSlug(str) {
  return String(str || "").trim().toLowerCase()
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function norm(raw) {
  if (!raw) return null;
  const pct = Number(raw.percentage) || 0;
  return {
    id: raw.id,
    key: toSlug(raw.name),
    name: raw.name,
    rate: pct / 100,
    percentage: pct,
    min: Number(raw.min_price) || 0,
    max: raw.max_price != null ? Number(raw.max_price) : 999999999,
    isActive: raw.is_active !== false,
    priority: raw.priority ?? 0,
  };
}

export async function hydrateListingFeeConfigsFromApi() {
  try {
    const data = await api.get("/listings/fee-rules/?page_size=200");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(norm).filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateListingFeeConfigAsync(key, patch) {
  const target = getListingFeeConfig(key);
  if (!target) return { ok: false, error: new Error("Fee config not found") };
  if (typeof target.id !== "number") {
    return { ok: false, error: new Error("Fee config has no backend id — hydrate first") };
  }
  const apiPatch = {};
  if (patch.rate != null) apiPatch.percentage = patch.rate * 100;
  if (patch.min != null) apiPatch.min_price = patch.min;
  if (patch.max != null) apiPatch.max_price = patch.max;
  if (!Object.keys(apiPatch).length) return { ok: true, config: target };
  try {
    const raw = await listingFeeRulesApi.update(target.id, apiPatch);
    const updated = norm(raw) || { ...target, ...patch };
    write(read().map((c) => (c.key === key ? updated : c)));
    return { ok: true, config: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export async function addFeeConfigAsync({ name, percentage = 1.0, min_price = 10000, max_price = 100000, priority = 0 }) {
  if (!name) return { ok: false, error: new Error("name required") };
  const key = toSlug(name);
  if (hasFeeConfig(key)) return { ok: false, error: new Error(`Fee config for "${key}" already exists`) };
  try {
    const raw = await listingFeeRulesApi.create({
      name, percentage, min_price, max_price, priority, is_active: true,
    });
    const created = norm(raw);
    write([created, ...read()]);
    return { ok: true, config: created };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeFeeConfigAsync(key) {
  const target = getListingFeeConfig(key);
  if (!target) return { ok: false, error: new Error("Fee config not found") };
  try {
    await listingFeeRulesApi.remove(target.id);
    write(read().filter((c) => c.key !== key));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function useListingFeeConfigs() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateListingFeeConfigsFromApi();
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

// LEGACY
export const SEED_LISTING_FEE_CONFIG = [];
export function saveListingFeeConfigs() {}
export function updateListingFeeConfig() {}
export function addFeeConfig() {}
export function removeFeeConfig() {}

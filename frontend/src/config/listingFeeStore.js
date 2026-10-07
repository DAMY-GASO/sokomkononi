// ============================================================
// listingFeeStore.js — API-only via /api/listings/fee-rules/
// Sasa ina: fee_mode (PERCENTAGE|FLAT), flat_fee, is_enabled.
// DEDUPE: kila seedKey ina rule moja pekee (active > Title Case > id ndogo).
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { listingFeeRulesApi } from "../api/listingFeeRules.js";
import { getSeedKeyFromSlug, isKnownCategoryKey, getCategoryIdByKey } from "./categoriesStore.js";

const KEY = "sokomkononi_listing_fee_config_v2";
const EV = "sokomkononi:listing-fee-config-updated";

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

// ------------------------------------------------------------
// Synchronous reads
// ------------------------------------------------------------
export function getListingFeeConfigs() {
  return read();
}
export function getListingFeeConfig(key) {
  if (!key) return null;
  const target = getSeedKeyFromSlug(key);
  return (
    read().find((c) => c.key === target) ||
    read().find((c) => c.key === key) ||
    null
  );
}
export function hasFeeConfig(categoryKey) {
  if (!categoryKey) return false;
  const target = getSeedKeyFromSlug(categoryKey);
  return read().some((c) => c.key === target);
}

function toSlug(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ------------------------------------------------------------
// Normalizer — sasa ina fee_mode, flat_fee, is_enabled
// ------------------------------------------------------------
function norm(raw) {
  if (!raw) return null;
  const pct = Number(raw.percentage) || 0;
  const rawSlug = toSlug(raw.name);
  const seedKey = getSeedKeyFromSlug(rawSlug);
  const orphan = !isKnownCategoryKey(rawSlug);

  return {
    id: raw.id,
    key: seedKey,
    backendKey: rawSlug,
    name: raw.name,
    orphan,
    feeMode: raw.fee_mode || "PERCENTAGE",
    percentage: pct,
    rate: pct / 100,
    flatFee: Number(raw.flat_fee) || 0,
    min: Number(raw.min_price) || 0,
    max: raw.max_price != null ? Number(raw.max_price) : 999999999,
    isActive: raw.is_active !== false,
    priority: raw.priority ?? 0,
  };
}

// ------------------------------------------------------------
// Hydrate na dedupe kwa seedKey
// Chagua rule moja pekee kwa kila seedKey:
//   active > Title Case > ina nafasi > id ndogo
// ------------------------------------------------------------
export async function hydrateListingFeeConfigsFromApi() {
  try {
    const data = await api.get("/listings/fee-rules/?page_size=200");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(norm).filter(Boolean);

    // ⬇️ DEDUPE kwa `key` (seedKey)
    const byKey = new Map();
    for (const rule of normalized) {
      const existing = byKey.get(rule.key);
      if (!existing) {
        byKey.set(rule.key, rule);
        continue;
      }

      const existingScore =
        (existing.isActive ? 10 : 0) +
        (existing.name?.[0]?.toUpperCase() === existing.name?.[0] ? 5 : 0) +
        (existing.name?.includes(" ") ? 3 : 0) -
        (existing.id || 0) / 1_000_000;

      const ruleScore =
        (rule.isActive ? 10 : 0) +
        (rule.name?.[0]?.toUpperCase() === rule.name?.[0] ? 5 : 0) +
        (rule.name?.includes(" ") ? 3 : 0) -
        (rule.id || 0) / 1_000_000;

      if (ruleScore > existingScore) {
        byKey.set(rule.key, rule);
      }
    }

    const deduped = Array.from(byKey.values());

    console.info("[listingFeeStore] hydrated:", {
      raw: normalized.length,
      deduped: deduped.length,
      removed: normalized.length - deduped.length,
    });

    write(deduped);
    return { ok: true, count: deduped.length };
  } catch (err) {
    console.error("[listingFeeStore] hydrate failed:", err);
    return { ok: false, error: err };
  }
}

// ------------------------------------------------------------
// Mutations
// ------------------------------------------------------------
export async function updateListingFeeConfigAsync(key, patch) {
  const target = getListingFeeConfig(key);
  if (!target) return { ok: false, error: new Error("Fee config not found") };
  if (typeof target.id !== "number") {
    return {
      ok: false,
      error: new Error("Fee config has no backend id — hydrate first"),
    };
  }
  const apiPatch = {};
  if (patch.rate != null) apiPatch.percentage = patch.rate * 100;
  if (patch.percentage != null) apiPatch.percentage = patch.percentage;
  if (patch.min != null) apiPatch.min_price = patch.min;
  if (patch.max != null) apiPatch.max_price = patch.max;
  if (patch.flat_fee != null) apiPatch.flat_fee = patch.flat_fee;
  if (patch.fee_mode != null) apiPatch.fee_mode = patch.fee_mode;
  if (patch.is_active != null) apiPatch.is_active = patch.is_active;
  if (!Object.keys(apiPatch).length) return { ok: true, config: target };
  try {
    const raw = await listingFeeRulesApi.update(target.id, apiPatch);
    const updated = norm(raw) || { ...target, ...patch };
    write(read().map((c) => (c.id === target.id ? updated : c)));
    return { ok: true, config: updated };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function updateListingFeeFlatAsync(key, flatFee) {
  const num = Number(flatFee);
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: new Error("flat_fee must be non-negative") };
  }
  return updateListingFeeConfigAsync(key, { flat_fee: num });
}

export async function updateListingFeeModeAsync(key, mode) {
  if (!["PERCENTAGE", "FLAT"].includes(mode)) {
    return { ok: false, error: new Error("fee_mode must be PERCENTAGE or FLAT") };
  }
  return updateListingFeeConfigAsync(key, { fee_mode: mode });
}

export async function toggleListingFeeActiveAsync(key) {
  const target = getListingFeeConfig(key);
  if (!target) return { ok: false, error: new Error("Fee config not found") };
  return updateListingFeeConfigAsync(key, { is_active: !target.isActive });
}

export async function addFeeConfigAsync({
  category_key,
  name,
  percentage = 0,
  min_price = 10000,
  max_price = 100000,
  flat_fee = 3000,
  fee_mode = "FLAT",
  priority = 0,
}) {
  if (!name) return { ok: false, error: new Error("name required") };
  const slug = toSlug(category_key || name);
  const seedKey = getSeedKeyFromSlug(slug);
  if (hasFeeConfig(seedKey)) {
    return {
      ok: false,
      error: new Error(`Fee config for "${seedKey}" already exists`),
    };
  }
  const categoryId = getCategoryIdByKey(seedKey);
  if (!categoryId) {
    return {
      ok: false,
      error: new Error(
        `Category "${seedKey}" haina backend id. Hydrate categories kwanza.`
      ),
    };
  }
  try {
    const raw = await listingFeeRulesApi.create({
      category: categoryId,
      name,
      percentage,
      min_price,
      max_price,
      flat_fee,
      fee_mode,
      priority,
      is_active: true,
    });
    const created = norm(raw);
    write([created, ...read()]);
    return { ok: true, config: created };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function removeFeeConfigAsync(key) {
  const target = getListingFeeConfig(key);
  if (!target) return { ok: false, error: new Error("Fee config not found") };
  try {
    await listingFeeRulesApi.remove(target.id);
    write(read().filter((c) => c.id !== target.id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function cleanupOrphanFeeConfigsAsync() {
  const orphans = read().filter((c) => c.orphan);
  if (orphans.length === 0) return { ok: true, removed: 0 };
  const results = await Promise.allSettled(
    orphans.map((c) => listingFeeRulesApi.remove(c.id))
  );
  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  await hydrateListingFeeConfigsFromApi();
  return { ok: true, removed: succeeded, total: orphans.length };
}

// ------------------------------------------------------------
// Hook
// ------------------------------------------------------------
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
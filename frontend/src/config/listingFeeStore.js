// ============================================================
// listingFeeStore.js — API-only via /api/listings/fee-rules/
// Sasa ina: fee_mode (PERCENTAGE|FLAT), flat_fee, is_enabled.
// DEDUPE: kila seedKey ina rule moja pekee (active > Title Case > id ndogo).
//
// ✅ FIX #1: addFeeConfigAsync inafanya upsert sahihi (PATCH kama ipo, POST kama haipo)
// ✅ FIX #2: Inatuma flat_fee tu kwa FLAT, percentage tu kwa PERCENTAGE
// ✅ FIX #3: Inafilter rules kwa categoryId kwenye frontend (defensive)
// ✅ FIX #4: Inasasisha cache (hydrate) baada ya POST/PATCH kufanikiwa
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { listingFeeRulesApi } from "../api/listingFeeRules.js";
import {
  getSeedKeyFromSlug,
  isKnownCategoryKey,
  getCategoryIdByKey,
} from "./categoriesStore.js";

const KEY = "sokomkononi_listing_fee_config_v2";
const EV = "sokomkononi:listing-fee-config-updated";

// ============================================================
// LOCAL STORAGE
// ============================================================
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

// ============================================================
// SYNCHRONOUS READS
// ============================================================
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

// ============================================================
// HELPERS
// ============================================================
function toSlug(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ============================================================
// NORMALIZER
// ============================================================
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
    // category FK id — muhimu kwa filtering ya frontend
    categoryId:
      raw.category != null
        ? Number(raw.category)
        : raw.category_id != null
        ? Number(raw.category_id)
        : null,
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

// ============================================================
// HYDRATE + DEDUPE
// Chagua rule moja pekee kwa kila seedKey:
//   active > Title Case > ina nafasi > id ndogo
// ============================================================
export async function hydrateListingFeeConfigsFromApi() {
  try {
    const data = await api.get("/listings/fee-rules/?page_size=200");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(norm).filter(Boolean);

    // DEDUPE kwa `key` (seedKey)
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

// ============================================================
// MUTATIONS — UPDATE
// ============================================================
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
    return {
      ok: false,
      error: new Error("fee_mode must be PERCENTAGE or FLAT"),
    };
  }
  const target = getListingFeeConfig(key);
  if (!target) return { ok: false, error: new Error("Fee config not found") };

  // Seed sensible default when the target mode has no value yet.
  const patch = { fee_mode: mode };
  if (mode === "FLAT" && !(Number(target.flatFee) > 0)) {
    patch.flat_fee = 3000;
  }
  if (mode === "PERCENTAGE" && !(Number(target.rate) > 0)) {
    patch.percentage = 1.0;
  }
  return updateListingFeeConfigAsync(key, patch);
}

export async function toggleListingFeeActiveAsync(key) {
  const target = getListingFeeConfig(key);
  if (!target) return { ok: false, error: new Error("Fee config not found") };
  return updateListingFeeConfigAsync(key, { is_active: !target.isActive });
}

// ============================================================
// ADD — upsert sahihi (PATCH kama ipo, POST kama haipo)
// ✅ FIX: Inasasisha cache baada ya POST/PATCH kufanikiwa
// ============================================================
/**
 * ✅ addFeeConfigAsync
 *
 * - Inafilter rules kwa `categoryId` kwenye frontend (defensive).
 * - Inatuma `flat_fee` TU kwa FLAT, `percentage` TU kwa PERCENTAGE.
 * - Kama rule ipo kwa category → PATCH (update, is_active=true).
 * - Kama haipo → POST (create).
 * - Baada ya kufanikiwa, inasasisha cache (hydrate) ili frontend
 *   ionee rule mpya mara moja.
 *
 * Hii inazuia `DUPLICATE_ACTIVE_RULE` na "category bila fee config".
 */
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

  // ── Hakikisha fee > 0 kulingana na mode ─────────────────
  let safeFlatFee = Number(flat_fee) || 0;
  let safePercentage = Number(percentage) || 0;
  const mode = String(fee_mode || "FLAT").toUpperCase();

  if (mode === "FLAT" && safeFlatFee <= 0) {
    safeFlatFee = 3000;
  }
  if (mode === "PERCENTAGE" && safePercentage <= 0) {
    safePercentage = 2.5;
  }

  // ── Pata categoryId kutoka store ───────────────────────
  const slug = toSlug(category_key || name);
  const seedKey = getSeedKeyFromSlug(slug);
  const categoryId = getCategoryIdByKey(seedKey);

  if (!categoryId) {
    return {
      ok: false,
      error: new Error(
        `Category "${seedKey}" haina backend id. Hydrate categories kwanza.`
      ),
    };
  }

  // ── Payload ya msingi ──────────────────────────────────
  const basePayload = {
    category: categoryId,
    name,
    min_price,
    max_price,
    fee_mode: mode,
    priority,
    is_active: true,
  };

  if (mode === "FLAT") {
    basePayload.flat_fee = safeFlatFee;
  } else {
    basePayload.percentage = safePercentage;
  }

  try {
    // ── Tafuta rules zilizopo kwa category hii ───────────
    let existing = [];
    try {
      existing = await listingFeeRulesApi.byCategory(categoryId);
    } catch (err) {
      // ✅ FALLBACK: kama byCategory inashindwa (CORS/network),
      //    tumia cache ya ndani.
      console.warn(
        "[addFeeConfigAsync] byCategory failed, using cache:",
        err?.message || err
      );
      existing = read().filter(
        (c) => Number(c.categoryId) === Number(categoryId)
      );
    }

    // ✅ Filter kwa categoryId kwenye frontend (defensive)
    const matching = (existing || []).filter((r) => {
      const rid =
        r?.category != null
          ? Number(r.category)
          : r?.category_id != null
          ? Number(r?.category_id)
          : r?.categoryId != null
          ? Number(r?.categoryId)
          : null;
      return rid === Number(categoryId);
    });

    if (matching.length > 0) {
      // ✅ PATCH — chagua active kwanza, kisha ya kwanza
      const target =
        matching.find((r) => r.is_active !== false) || matching[0];
      const raw = await listingFeeRulesApi.update(target.id, basePayload);
      const updated = norm(raw);

      write(read().map((c) => (c.id === updated.id ? updated : c)));

      // ✅ SASISHA CACHE — ili frontend ionee rule mpya
      try {
        await hydrateListingFeeConfigsFromApi();
      } catch (hydrateErr) {
        console.warn("[addFeeConfigAsync] hydrate after PATCH failed:", hydrateErr);
      }

      return { ok: true, config: updated, mode: "updated" };
    }

    // ✅ POST — hakuna rule kwa category hii
    const raw = await listingFeeRulesApi.create(basePayload);
    const created = norm(raw);

    // Badilisha entry iliyopo (kama ipo kwa seedKey) au ongeza mpya
    const existingIdx = read().findIndex((c) => c.id === created.id);
    if (existingIdx >= 0) {
      write(read().map((c) => (c.id === created.id ? created : c)));
    } else {
      write([created, ...read()]);
    }

    // ✅ SASISHA CACHE — ili frontend ionee rule mpya
    try {
      await hydrateListingFeeConfigsFromApi();
    } catch (hydrateErr) {
      console.warn("[addFeeConfigAsync] hydrate after POST failed:", hydrateErr);
    }

    return { ok: true, config: created, mode: "created" };
  } catch (err) {
    // ── Error handling bora ────────────────────────────
    if (err?.status === 400) {
      const detail =
        err?.data?.detail ||
        err?.data?.category?.[0] ||
        err?.data?.flat_fee?.[0] ||
        err?.data?.percentage?.[0] ||
        err?.data?.name?.[0] ||
        err?.message;
      return {
        ok: false,
        error: new Error(
          detail ||
            "Imeshindwa kuunda fee rule. Angalia Network tab kwa maelezo zaidi."
        ),
      };
    }
    return { ok: false, error: err };
  }
}

// ============================================================
// REMOVE
// ============================================================
export async function removeFeeConfigAsync(key) {
  const target = getListingFeeConfig(key);
  if (!target) return { ok: false, error: new Error("Fee config not found") };
  try {
    await listingFeeRulesApi.remove(target.id);
    write(read().filter((c) => c.id !== target.id));

    // ✅ SASISHA CACHE — ili frontend ionee mabadiliko
    try {
      await hydrateListingFeeConfigsFromApi();
    } catch (hydrateErr) {
      console.warn("[removeFeeConfigAsync] hydrate after DELETE failed:", hydrateErr);
    }

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

// ============================================================
// HOOK
// ============================================================
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
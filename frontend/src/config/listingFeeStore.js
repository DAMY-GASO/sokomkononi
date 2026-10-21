// ============================================================
// listingFeeStore.js — API-only via /api/listings/fee-rules/
//
// ✅ FIX #1: addFeeConfigAsync inafanya upsert sahihi (PATCH kama ipo, POST kama haipo)
// ✅ FIX #2: Inatuma flat_fee tu kwa FLAT, percentage tu kwa PERCENTAGE
// ✅ FIX #3: Inafilter rules kwa categoryId kwenye frontend (defensive)
// ✅ FIX #4: Inasasisha cache (hydrate) baada ya POST/PATCH kufanikiwa
// ✅ FIX #5: norm() inatumia safeString() — kila field ni PRIMITIVE (string/number)
// ✅ FIX #6: updateListingFeeConfigAsync inafanya OPTIMISTIC UPDATE + rollback
// ✅ FIX #7: useListingFeeConfigs HAITII hydrate kila mara (inaepuka overwrite)
// ✅ FIX #8: React Error #31 fix — hakuna object inayoweza kufika kwenye JSX
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
// HELPERS — SAFE PRIMITIVE EXTRACTION
// ============================================================
function toSlug(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ✅ FIX: safeString inarudisha STRING kila mara, hata kama input ni object
function safeString(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return "";
  if (typeof v === "object") {
    // Localized object: {sw, en} au {name, slug} au {id, name, slug}
    if (typeof v.sw === "string") return v.sw;
    if (typeof v.en === "string") return v.en;
    if (typeof v.name === "string") return v.name;
    if (typeof v.slug === "string") return v.slug;
    if (typeof v.key === "string") return v.key;
  }
  return "";
}

// ✅ FIX: safeNumber inarudisha NUMBER au null, hata kama input ni object
function safeNumber(v) {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === "object" && typeof v.id === "number") {
    return v.id;
  }
  if (typeof v === "object" && typeof v.id === "string") {
    const n = Number(v.id);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// ============================================================
// NORMALIZER
// ✅ FIX: Kila field ni PRIMITIVE (string / number / boolean / null)
//    Hakuna object inayoweza kufika kwenye JSX.
// ============================================================
function norm(raw) {
  if (!raw) return null;

  const pct = Number(raw.percentage) || 0;

  // ── name: LAZIMA iwe string ──────────────────────────
  const safeName = safeString(raw.name);

  // ── categoryId: LAZIMA iwe number au null ────────────
  let categoryId = null;
  if (typeof raw.category === "number") {
    categoryId = raw.category;
  } else if (raw.category && typeof raw.category === "object") {
    categoryId = safeNumber(raw.category.id);
  } else if (raw.category_id != null) {
    categoryId = safeNumber(raw.category_id);
  }

  // ── categorySlug: LAZIMA iwe string ─────────────────
  let categorySlug = "";
  if (typeof raw.category_slug === "string") {
    categorySlug = raw.category_slug;
  } else if (raw.category && typeof raw.category === "object") {
    categorySlug = safeString(raw.category.slug);
  }

  // ── slugSource: categorySlug > name ─────────────────
  const slugSource = categorySlug || safeName || "";
  const rawSlug = toSlug(slugSource);
  const seedKey = getSeedKeyFromSlug(rawSlug);
  const orphan = !isKnownCategoryKey(rawSlug);

  return {
    id: raw.id,
    key: seedKey,
    backendKey: rawSlug,
    name: safeName,               // ✅ STRING
    orphan,
    categoryId,                   // ✅ NUMBER au NULL
    feeMode: raw.fee_mode || "PERCENTAGE",
    percentage: pct,              // ✅ NUMBER
    rate: pct / 100,              // ✅ NUMBER
    flatFee: Number(raw.flat_fee) || 0,       // ✅ NUMBER
    min: Number(raw.min_price) || 0,          // ✅ NUMBER
    max:
      raw.max_price != null
        ? Number(raw.max_price)   // ✅ NUMBER
        : 999999999,
    isActive: raw.is_active !== false,        // ✅ BOOLEAN
    priority: raw.priority ?? 0,              // ✅ NUMBER
  };
}

// ============================================================
// HYDRATE + DEDUPE
// ============================================================
export async function hydrateListingFeeConfigsFromApi() {
  try {
    const data = await api.get("/listings/fee-rules/?page_size=200");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(norm).filter(Boolean);

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
// MUTATIONS — UPDATE (optimistic + rollback + kinga ya id/key)
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

  const optimistic = {
    ...target,
    ...(patch.rate != null
      ? { rate: patch.rate, percentage: patch.rate * 100 }
      : {}),
    ...(patch.percentage != null
      ? { percentage: patch.percentage, rate: patch.percentage / 100 }
      : {}),
    ...(patch.min != null ? { min: patch.min } : {}),
    ...(patch.max != null ? { max: patch.max } : {}),
    ...(patch.flat_fee != null ? { flatFee: patch.flat_fee } : {}),
    ...(patch.fee_mode != null ? { feeMode: patch.fee_mode } : {}),
    ...(patch.is_active != null ? { isActive: patch.is_active } : {}),
  };

  write(read().map((c) => (c.id === target.id ? optimistic : c)));

  const apiPatch = {};
  if (patch.rate != null) apiPatch.percentage = patch.rate * 100;
  if (patch.percentage != null) apiPatch.percentage = patch.percentage;
  if (patch.min != null) apiPatch.min_price = patch.min;
  if (patch.max != null) apiPatch.max_price = patch.max;
  if (patch.flat_fee != null) apiPatch.flat_fee = patch.flat_fee;
  if (patch.fee_mode != null) apiPatch.fee_mode = patch.fee_mode;
  if (patch.is_active != null) apiPatch.is_active = patch.is_active;

  if (!Object.keys(apiPatch).length) {
    return { ok: true, config: target };
  }

  try {
    const raw = await listingFeeRulesApi.update(target.id, apiPatch);
    const updated = norm(raw) || { ...target, ...patch };

    // ✅ KINGA: hakikisha `id` na `key` hazibadiliki
    updated.id = target.id;
    updated.key = target.key;
    updated.backendKey = target.backendKey;

    write(read().map((c) => (c.id === target.id ? updated : c)));
    return { ok: true, config: updated };
  } catch (err) {
    write(read().map((c) => (c.id === target.id ? target : c)));
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
// ADD — upsert (PATCH kama ipo, POST kama haipo)
// ============================================================
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

  let safeFlatFee = Number(flat_fee) || 0;
  let safePercentage = Number(percentage) || 0;
  const mode = String(fee_mode || "FLAT").toUpperCase();

  if (mode === "FLAT" && safeFlatFee <= 0) {
    safeFlatFee = 3000;
  }
  if (mode === "PERCENTAGE" && safePercentage <= 0) {
    safePercentage = 2.5;
  }

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
    let existing = [];
    try {
      existing = await listingFeeRulesApi.byCategory(categoryId);
    } catch (err) {
      console.warn(
        "[addFeeConfigAsync] byCategory failed, using cache:",
        err?.message || err
      );
      existing = read().filter(
        (c) => Number(c.categoryId) === Number(categoryId)
      );
    }

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
      const target =
        matching.find((r) => r.is_active !== false) || matching[0];
      const raw = await listingFeeRulesApi.update(target.id, basePayload);
      const updated = norm(raw);

      write(read().map((c) => (c.id === updated.id ? updated : c)));

      try {
        await hydrateListingFeeConfigsFromApi();
      } catch (hydrateErr) {
        console.warn(
          "[addFeeConfigAsync] hydrate after PATCH failed:",
          hydrateErr
        );
      }

      return { ok: true, config: updated, mode: "updated" };
    }

    const raw = await listingFeeRulesApi.create(basePayload);
    const created = norm(raw);

    const existingIdx = read().findIndex((c) => c.id === created.id);
    if (existingIdx >= 0) {
      write(read().map((c) => (c.id === created.id ? created : c)));
    } else {
      write([created, ...read()]);
    }

    try {
      await hydrateListingFeeConfigsFromApi();
    } catch (hydrateErr) {
      console.warn(
        "[addFeeConfigAsync] hydrate after POST failed:",
        hydrateErr
      );
    }

    return { ok: true, config: created, mode: "created" };
  } catch (err) {
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

    try {
      await hydrateListingFeeConfigsFromApi();
    } catch (hydrateErr) {
      console.warn(
        "[removeFeeConfigAsync] hydrate after DELETE failed:",
        hydrateErr
      );
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
// HOOK — HAIITII hydrate (inaepuka overwrite)
// ============================================================
export function useListingFeeConfigs() {
  const [list, setList] = useState(() => read());

  useEffect(() => {
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
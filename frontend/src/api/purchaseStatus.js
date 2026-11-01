import { api } from "./client";

/**
 * Ramani ya module → URL base ya backend.
 *
 * Kila backend ina URL tofauti:
 *   boosting       → /boosting/status/<listing_id>/
 *   banners        → /banners/status/<listing_id>/
 *   leading        → /leading-fees/purchases/status/<listing_id>/
 */
const MODULE_URLS = {
  boosting: "/boosting",
  banners: "/banners",
  leading: "/leading-fees/purchases",
};

const STATUS_TIMEOUT_MS = 8000;

// ============================================================
// CACHE ndogo (kwa session) — ili kurudi kwenye ukurasa kusionyeshe
// "loading" tena. Thamani: object ya status AU null (= hakuna purchase).
// Majibu ya "unknown" HAYAWEKWI kwenye cache.
// ============================================================
const _cache = new Map();
const _key = (module, listingId) => `${module}:${listingId}`;

/** Rudisha status iliyo kwenye cache, au `undefined` kama haipo. */
export function peekPurchaseStatus(module, listingId) {
  return _cache.get(_key(module, listingId));
}

export function invalidatePurchaseStatus(module) {
  if (!module) return _cache.clear();
  const prefix = `${module}:`;
  for (const k of Array.from(_cache.keys())) {
    if (k.startsWith(prefix)) _cache.delete(k);
  }
}

/**
 * Pata hali ya purchase (boost/banner/leading) kwa listing.
 *
 * Matokeo:
 *   - object ya status      → backend ilijibu
 *   - null                  → backend ilijibu 404 (HAKUNA purchase)
 *   - { unknown: true }     → timeout / network / 5xx — hali HAIJULIKANI.
 *                             UI isiruhusu malipo mapya mpaka ithibitishwe.
 *
 * @param {"boosting"|"banners"|"leading"} module
 * @param {number} listingId
 * @returns {Promise<object|null>}
 */
export async function getPurchaseStatus(module, listingId) {
  const base = MODULE_URLS[module];
  if (!base) {
    console.warn(`[purchaseStatus] Unknown module: ${module}`);
    return { unknown: true };
  }
  const url = `${base}/status/${listingId}/`;

  let timer = null;
  try {
    const timeoutPromise = new Promise((resolve) => {
      timer = setTimeout(() => {
        console.warn("[purchaseStatus] timeout:", url);
        resolve({ unknown: true });
      }, STATUS_TIMEOUT_MS);
    });

    const result = await Promise.race([api.get(url), timeoutPromise]);

    if (timer) clearTimeout(timer);
    if (result && result.unknown) return result;

    const value = result ?? null;
    _cache.set(_key(module, listingId), value);
    return value;
  } catch (err) {
    if (timer) clearTimeout(timer);
    if (err?.status === 404) {
      _cache.set(_key(module, listingId), null);
      return null;
    }
    console.warn("[purchaseStatus] error:", url, err?.message || err);
    return { unknown: true };
  }
}

export async function cancelPendingPurchase(module, purchaseId) {
  const base = MODULE_URLS[module];
  if (!base) throw new Error(`Unknown purchase module: ${module}`);
  try {
    return await api.post(`${base}/${purchaseId}/cancel/`, {});
  } finally {
    invalidatePurchaseStatus(module);
  }
}
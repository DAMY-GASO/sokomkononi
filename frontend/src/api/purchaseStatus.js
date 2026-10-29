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

const STATUS_TIMEOUT_MS = 5000;

/**
 * Pata hali ya purchase (boost/banner/leading) kwa listing.
 *
 * Kumbuka: kama request inashindwa (404, CORS, network, timeout),
 * tunarudisha `null` ili UI isikwame kwenye loading milele.
 *
 * @param {"boosting"|"banners"|"leading"} module
 * @param {number} listingId
 * @returns {Promise<object|null>}
 */
export async function getPurchaseStatus(module, listingId) {
  const base = MODULE_URLS[module];
  if (!base) {
    console.warn(`[purchaseStatus] Unknown module: ${module}`);
    return null;
  }
  const url = `${base}/status/${listingId}/`;

  let timer = null;
  try {
    // Timeout ya sekunde 5 — kama request haipati resolve/reject, tunarudisha null.
    const timeoutPromise = new Promise((resolve) => {
      timer = setTimeout(() => {
        console.warn("[purchaseStatus] timeout:", url);
        resolve(null);
      }, STATUS_TIMEOUT_MS);
    });

    const result = await Promise.race([
      api.get(url),
      timeoutPromise,
    ]);

    if (timer) clearTimeout(timer);
    return result ?? null;
  } catch (err) {
    if (timer) clearTimeout(timer);
    if (err?.status === 404) return null;
    // Kwa makosa mengine (CORS, network, 500), rudisha null ili
    // UI isikwame. Tuna-log kwa debugging.
    console.warn("[purchaseStatus] error:", url, err?.message || err);
    return null;
  }
}

export async function cancelPendingPurchase(module, purchaseId) {
  const base = MODULE_URLS[module];
  if (!base) throw new Error(`Unknown purchase module: ${module}`);
  return api.post(`${base}/${purchaseId}/cancel/`, {});
}
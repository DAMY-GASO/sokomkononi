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

/**
 * Pata hali ya purchase (boost/banner/leading) kwa listing.
 * @param {"boosting"|"banners"|"leading"} module
 * @param {number} listingId
 */
export async function getPurchaseStatus(module, listingId) {
  const base = MODULE_URLS[module];
  if (!base) {
    throw new Error(`Unknown purchase module: ${module}`);
  }
  const url = `${base}/status/${listingId}/`;
  try {
    return await api.get(url);
  } catch (err) {
    if (err?.status === 404) return null;
    throw err;
  }
}

export async function cancelPendingPurchase(module, purchaseId) {
  const base = MODULE_URLS[module];
  if (!base) {
    throw new Error(`Unknown purchase module: ${module}`);
  }
  return api.post(`${base}/${purchaseId}/cancel/`, {});
}
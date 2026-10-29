import { api } from "./client";

/**
 * Pata hali ya purchase (boost/banner/leading) kwa listing.
 * @param {"boosting"|"banners"|"leading"} module
 * @param {number} listingId
 */
export async function getPurchaseStatus(module, listingId) {
  const url = `/${module}/status/${listingId}/`;
  try {
    return await api.get(url);
  } catch (err) {
    if (err?.status === 404) return null;
    throw err;
  }
}

export async function cancelPendingPurchase(module, purchaseId) {
  return api.post(`/${module}/${purchaseId}/cancel/`, {});
}
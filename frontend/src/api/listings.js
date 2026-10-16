// ============================================================
// api/listings.js
//
// Marekebisho:
//  - Ongeza markSold() method — kwa seller kumark listing kama SOLD
// ============================================================
import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v != null && v !== ""
  );
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const listingsApi = {
  // ----- Reads -----
  list: (params = {}) => api.get(`/listings/${toQuery(params)}`),
  mine: (userId, params = {}) =>
    api.get(`/listings/${toQuery({ seller: userId, ...params })}`),
  detail: (id) => api.get(`/listings/${id}/`),
  featured: (params = {}) =>
    api.get(`/listings/${toQuery({ is_featured: true, ...params })}`),
  byCategory: (categoryId, params = {}) =>
    api.get(`/listings/${toQuery({ category: categoryId, ...params })}`),

  // ----- Mutations -----
  create: (payload) => api.post("/listings/", payload),

  // ── Multipart: create listing + images in a single request ──
  // body: FormData with category/title/description/price/location,
  // optional latitude/longitude/address_text/attributes, plus `images` files.
  createWithImages: (formData) =>
    api.upload("/listings/create-with-images/", formData),

  // ── Update only location fields (JSON) ──
  // payload: { latitude?, longitude?, location?, address_text? }
  updateLocation: (id, payload) =>
    api.patch(`/listings/${id}/location/`, payload),

  // ── Bulk image upload to an existing listing ──
  // formData: FormData with `images` files (multiple)
  bulkUploadImages: (id, formData) =>
    api.upload(`/listings/${id}/images/bulk/`, formData),

  update: (id, patch) => api.patch(`/listings/${id}/`, patch),

  remove: (id, { hard = false, reason = "" } = {}) => {
    const qs = hard ? "?hard=true" : "";
    return api.delete(`/listings/${id}/${qs}`, reason ? { reason } : {});
  },

  // ⬇️ RESTORE — rejesha listing iliyofutwa (soft delete undo)
  restore: (id) => api.post(`/listings/${id}/restore/`, {}),

  // ⬇️ MARK AS SOLD — seller ana-mark listing kama imeuzwa
  // Backend: inabadilisha status → SOLD, inatuma notification kwa admins,
  //          inaandika audit log
  markSold: (id) => api.post(`/listings/${id}/mark-sold/`, {}),

  // ----- Fee -----
  getFee: (id) => api.get(`/listings/${id}/fee/`),
  payFee: (id, payload) => api.post(`/listings/${id}/fee/pay/`, payload),

  // ----- Images -----
  listImages: (id) => api.get(`/listings/${id}/images/`),
  uploadImage: (id, formData) =>
    api.upload(`/listings/${id}/images/`, formData),
  updateImage: (listingId, imageId, payload) =>
    api.patch(`/listings/${listingId}/images/${imageId}/`, payload),
  deleteImage: (listingId, imageId) =>
    api.delete(`/listings/${listingId}/images/${imageId}/`),

  // ============================================================
  // CATEGORY-SPECIFIC DETAILS
  // ============================================================
  createPropertyDetails: (id, payload) =>
    api.post(`/listings/${id}/property-details/`, payload),
  updatePropertyDetails: (id, payload) =>
    api.patch(`/listings/${id}/property-details/`, payload),

  createLandDetails: (id, payload) =>
    api.post(`/listings/${id}/land-details/`, payload),
  updateLandDetails: (id, payload) =>
    api.patch(`/listings/${id}/land-details/`, payload),

  createVehicleDetails: (id, payload) =>
    api.post(`/listings/${id}/vehicle-details/`, payload),
  updateVehicleDetails: (id, payload) =>
    api.patch(`/listings/${id}/vehicle-details/`, payload),

  createBusinessDetails: (id, payload) =>
    api.post(`/listings/${id}/business-details/`, payload),
  updateBusinessDetails: (id, payload) =>
    api.patch(`/listings/${id}/business-details/`, payload),

  createEquipmentDetails: (id, payload) =>
    api.post(`/listings/${id}/equipment-details/`, payload),
  updateEquipmentDetails: (id, payload) =>
    api.patch(`/listings/${id}/equipment-details/`, payload),

  // ============================================================
  // ADMIN — Moderation
  // ============================================================
  pending: () => api.get("/listings/admin/pending/"),

  approve: (id) => api.post(`/listings/${id}/approve/`, {}),

  reject: (id, rejection_reason) =>
    api.post(`/listings/${id}/reject/`, { rejection_reason }),

  disapprove: (id, rejection_reason) =>
    api.post(`/listings/${id}/disapprove/`, { rejection_reason }),

  // ── Moderation mpya (Chaguo B) ───────────────────────────
  // Admin ameomba uhariri — rudisha kwa seller kwa mabadiliko
  requestEdit: (id, reason) =>
    api.post(`/listings/${id}/request-edit/`, { reason }),

  // Admin ameona ni nzuri — mwambie seller alipe fee
  requestPayment: (id, reason = "") =>
    api.post(`/listings/${id}/request-payment/`, { reason }),

  // Admin analidhinisha mwisho baada ya fee kulipwa
  finalizeApproval: (id) =>
    api.post(`/listings/${id}/finalize-approval/`, {}),
};

export default listingsApi;
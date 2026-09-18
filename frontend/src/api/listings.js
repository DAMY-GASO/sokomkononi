import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const listingsApi = {
  // Public + filtered
  list: (params = {}) => api.get(`/listings/${toQuery(params)}`),

  // Seller-specific — pass seller=<userId> as filter
  mine: (userId, params = {}) =>
    api.get(`/listings/${toQuery({ seller: userId, ...params })}`),

  detail: (id) => api.get(`/listings/${id}/`),

  // Helpers that map to real filters
  featured: (params = {}) =>
    api.get(`/listings/${toQuery({ is_featured: true, ...params })}`),

  byCategory: (categoryId, params = {}) =>
    api.get(`/listings/${toQuery({ category: categoryId, ...params })}`),

  // CRUD
  create: (payload) => api.post("/listings/", payload),
  update: (id, patch) => api.patch(`/listings/${id}/`, patch),
  remove: (id) => api.delete(`/listings/${id}/`),

  // Fee
  getFee: (id) => api.get(`/listings/${id}/fee/`),
  payFee: (id, payload) => api.post(`/listings/${id}/fee/pay/`, payload),

  // Images
  listImages: (id) => api.get(`/listings/${id}/images/`),
  uploadImage: (id, formData) =>
    api.upload(`/listings/${id}/images/`, formData),
  updateImage: (listingId, imageId, payload) =>
    api.patch(`/listings/${listingId}/images/${imageId}/`, payload),
  deleteImage: (listingId, imageId) =>
    api.delete(`/listings/${listingId}/images/${imageId}/`),

  // Category detail sub-resources
  createPropertyDetails: (id, payload) =>
    api.post(`/listings/${id}/property-details/`, payload),
  updatePropertyDetails: (id, payload) =>
    api.patch(`/listings/${id}/property-details/detail/`, payload),

  createLandDetails: (id, payload) =>
    api.post(`/listings/${id}/land-details/`, payload),
  updateLandDetails: (id, payload) =>
    api.patch(`/listings/${id}/land-details/detail/`, payload),

  createVehicleDetails: (id, payload) =>
    api.post(`/listings/${id}/vehicle-details/`, payload),
  updateVehicleDetails: (id, payload) =>
    api.patch(`/listings/${id}/vehicle-details/detail/`, payload),

  createBusinessDetails: (id, payload) =>
    api.post(`/listings/${id}/business-details/`, payload),
  updateBusinessDetails: (id, payload) =>
    api.patch(`/listings/${id}/business-details/detail/`, payload),

  createEquipmentDetails: (id, payload) =>
    api.post(`/listings/${id}/equipment-details/`, payload),
  updateEquipmentDetails: (id, payload) =>
    api.patch(`/listings/${id}/equipment-details/detail/`, payload),

  // Admin
  pending: () => api.get("/listings/admin/pending/"),
  approve: (id) => api.post(`/listings/${id}/approve/`, {}),
  reject: (id, rejection_reason) =>
    api.post(`/listings/${id}/reject/`, { rejection_reason }),
};
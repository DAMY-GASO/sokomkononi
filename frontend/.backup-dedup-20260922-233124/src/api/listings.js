import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const listingsApi = {
  list: (params = {}) => api.get(`/listings/${toQuery(params)}`),
  mine: (userId, params = {}) =>
    api.get(`/listings/${toQuery({ seller: userId, ...params })}`),
  detail: (id) => api.get(`/listings/${id}/`),
  featured: (params = {}) =>
    api.get(`/listings/${toQuery({ is_featured: true, ...params })}`),
  byCategory: (categoryId, params = {}) =>
    api.get(`/listings/${toQuery({ category: categoryId, ...params })}`),

  create: (payload) => api.post("/listings/", payload),
  update: (id, patch) => api.patch(`/listings/${id}/`, patch),
  remove: (id) => api.delete(`/listings/${id}/`),

  getFee: (id) => api.get(`/listings/${id}/fee/`),
  payFee: (id, payload) => api.post(`/listings/${id}/fee/pay/`, payload),

  listImages: (id) => api.get(`/listings/${id}/images/`),
  uploadImage: (id, formData) => api.upload(`/listings/${id}/images/`, formData),
  updateImage: (listingId, imageId, payload) =>
    api.patch(`/listings/${listingId}/images/${imageId}/`, payload),
  deleteImage: (listingId, imageId) =>
    api.delete(`/listings/${listingId}/images/${imageId}/`),

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

  pending: () => api.get("/listings/admin/pending/"),
  approve: (id) => api.post(`/listings/${id}/approve/`, {}),
  reject: (id, rejection_reason) =>
    api.post(`/listings/${id}/reject/`, { rejection_reason }),
};

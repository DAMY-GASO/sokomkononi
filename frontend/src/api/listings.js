import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const listingsApi = {
  list: (params = {}) => api.get(`/listings/${toQuery(params)}`),
  mine: (params = {}) => api.get(`/listings/${toQuery({ mine: true, ...params })}`),
  detail: (id) => api.get(`/listings/${id}/`),
  featured: (params = {}) => api.get(`/listings/${toQuery({ featured: true, ...params })}`),
  byCategory: (categoryKey, params = {}) =>
    api.get(`/listings/${toQuery({ category: categoryKey, ...params })}`),

  create: (payload) => api.post("/listings/", payload),
  update: (id, patch) => api.patch(`/listings/${id}/`, patch),
  remove: (id) => api.delete(`/listings/${id}/`),

  payFee: (id, payload) => api.post(`/listings/${id}/fee/pay/`, payload),
  boost: (id, payload) => api.post(`/listings/${id}/boost/`, payload),
  leading: (id, payload) => api.post(`/listings/${id}/leading/`, payload),
  reserve: (id, payload) => api.post(`/listings/${id}/reserve/`, payload),
};

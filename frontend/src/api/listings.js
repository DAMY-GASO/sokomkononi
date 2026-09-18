import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const listingsApi = {
  list: (params = {}) => api.get(`/listings/${toQuery(params)}`),
  detail: (id) => api.get(`/listings/${id}/`),
  featured: (params = {}) => api.get(`/listings/${toQuery({ featured: true, ...params })}`),
  byCategory: (categoryKey, params = {}) => api.get(`/listings/${toQuery({ category: categoryKey, ...params })}`),
  payFee: (id, payload) => api.post(`/listings/${id}/fee/pay/`, payload),
};

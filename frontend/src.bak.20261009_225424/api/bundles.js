// ============================================================
// bundles.js — API client for Service Bundles
// Used by admin CRUD + user purchase flow.
// ============================================================
import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const bundlesApi = {
  list: (params = {}) => api.get(`/bundles/${toQuery(params)}`),
  detail: (id) => api.get(`/bundles/${id}/`),
  create: (payload) => api.post("/bundles/", payload),
  update: (id, patch) => api.patch(`/bundles/${id}/`, patch),
  remove: (id) => api.delete(`/bundles/${id}/`),
  toggleActive: (id) => api.post(`/bundles/${id}/toggle/`, {}),
  purchase: (bundleId, payment_reference = "") =>
    api.post("/bundles/purchases/", { bundle: bundleId, payment_reference }),
};

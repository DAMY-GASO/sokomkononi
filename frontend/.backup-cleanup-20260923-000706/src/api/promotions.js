// ============================================================
// api/promotions.js
// ============================================================
import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const promotionsApi = {
  analytics: (params = {}) => api.get(`/promotions/analytics/${toQuery(params)}`),

  campaigns: {
    list: (params = {}) => api.get(`/promotions/campaigns/${toQuery(params)}`),
    detail: (id) => api.get(`/promotions/campaigns/${id}/`),
    create: (payload) => api.post("/promotions/campaigns/", payload),
    update: (id, patch) => api.patch(`/promotions/campaigns/${id}/`, patch),
    remove: (id) => api.delete(`/promotions/campaigns/${id}/`),
  },
};

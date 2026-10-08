// src/api/promotions.js
import { api } from "./client";

export const promotionsApi = {
  analytics: () => api.get("/banners/analytics/"),

  campaigns: {
    list: () => api.get("/banners/campaigns/"),
    detail: (id) => api.get(`/banners/campaigns/${id}/`),
    create: (payload) => api.post("/banners/campaigns/", payload),
    update: (id, patch) => api.patch(`/banners/campaigns/${id}/`, patch),
    remove: (id) => api.delete(`/banners/campaigns/${id}/`),
    toggle: (id) => api.post(`/banners/campaigns/${id}/toggle/`, {}),
  },
};
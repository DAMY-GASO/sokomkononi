// ============================================================
// boostPackages.js — Admin update for boost package prices.
// Read goes through /api/boosting/packages/ (public GET).
// ============================================================
import { api } from "./client";

export const boostPackagesApi = {
  list: () => api.get("/boosting/packages/?page_size=100"),
  detail: (id) => api.get(`/boosting/packages/${id}/`),
  update: (id, patch) => api.patch(`/boosting/packages/${id}/`, patch),
};

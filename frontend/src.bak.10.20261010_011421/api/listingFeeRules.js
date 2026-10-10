// ============================================================
// listingFeeRules.js — Admin update for listing fee rules.
// ============================================================
import { api } from "./client";

export const listingFeeRulesApi = {
  list: () => api.get("/listings/fee-rules/?page_size=100"),
  update: (id, patch) => api.patch(`/listings/fee-rules/${id}/`, patch),
  create: (payload) => api.post("/listings/fee-rules/", payload),
  remove: (id) => api.delete(`/listings/fee-rules/${id}/`),
};

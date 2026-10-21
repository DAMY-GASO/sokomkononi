// ============================================================
// listingFeeRules.js — Admin update for listing fee rules.
// ============================================================
import { api } from "./client";

export const listingFeeRulesApi = {
  list: () => api.get("/listings/fee-rules/?page_size=100"),

  update: (id, patch) =>
    api.patch(`/listings/fee-rules/${id}/`, patch),

  create: (payload) =>
    api.post("/listings/fee-rules/", payload),

  remove: (id) =>
    api.delete(`/listings/fee-rules/${id}/`),

  // ⬇️ MPYA: upsert — kama category tayari ina rule active, update;
  // vinginevyo create mpya. Inazuia DUPLICATE_ACTIVE_RULE (400).
  upsert: async (payload) => {
    if (!payload?.category) {
      return api.post("/listings/fee-rules/", payload);
    }

    // Tafuta rule active kwa category
    try {
      const existing = await api.get(
        `/listings/fee-rules/?category=${payload.category}&page_size=100`
      );
      const list = Array.isArray(existing)
        ? existing
        : existing?.results || [];

      // Chagua rule active (is_active !== false)
      const active = list.find((r) => r.is_active !== false);

      if (active) {
        // Update rule iliyopo — usiunde mpya
        return api.patch(
          `/listings/fee-rules/${active.id}/`,
          payload
        );
      }
    } catch (err) {
      console.warn(
        "[listingFeeRules] upsert lookup failed:",
        err
      );
    }

    // Hakuna rule active — unda mpya
    return api.post("/listings/fee-rules/", payload);
  },
};
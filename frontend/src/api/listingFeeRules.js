// ============================================================
// listingFeeRules.js — API client for /listings/fee-rules/
// Upsert: PATCH kama rule ipo (kwa category), POST kama haipo.
// ============================================================
import { api } from "./client.js";

export const listingFeeRulesApi = {
  /**
   * Orodha ya fee rules zote.
   */
  list: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/listings/fee-rules/${qs ? `?${qs}` : ""}`);
  },

  /**
   * Tafuta rule moja kwa ID.
   */
  get: async (id) => {
    return api.get(`/listings/fee-rules/${id}/`);
  },

  /**
   * Tafuta rules kwa category (ID).
   * Inarudisha array (tupu kama hakuna).
   */
  byCategory: async (categoryId) => {
    if (!categoryId) return [];
    try {
      const data = await api.get(
        `/listings/fee-rules/?category=${categoryId}&page_size=200`
      );
      return Array.isArray(data) ? data : data?.results || [];
    } catch (err) {
      console.warn("[listingFeeRulesApi] byCategory failed:", err);
      return [];
    }
  },

  /**
   * Unda rule mpya.
   */
  create: async (payload) => {
    return api.post("/listings/fee-rules/", payload);
  },

  /**
   * Sasisha rule iliyopo (PATCH).
   */
  update: async (id, payload) => {
    return api.patch(`/listings/fee-rules/${id}/`, payload);
  },

  /**
   * Futa rule (soft delete).
   */
  remove: async (id) => {
    return api.delete(`/listings/fee-rules/${id}/`);
  },

  /**
   * Upsert — PATCH kama rule ipo kwa category, POST kama haipo.
   *
   * Hii inazuia IntegrityError ya `unique_active_rule_per_category`:
   *   - Kama rule ipo (hata is_active=False), tunaiweka active na
   *     kusasisha fields zote.
   *   - Kama haipo, tunaunda mpya.
   */
  upsert: async (payload) => {
    if (!payload) throw new Error("payload is required");
    if (!payload.category) {
      throw new Error("category (id) is required for upsert");
    }

    // 1. Tafuta rule zilizopo kwa category hii
    const existing = await listingFeeRulesApi.byCategory(payload.category);

    // 2. Kama ipo, PATCH (chagua active kwanza, kisha ya kwanza)
    if (existing.length > 0) {
      const target = existing.find((r) => r.is_active) || existing[0];
      const updated = await listingFeeRulesApi.update(target.id, {
        ...payload,
        is_active: true,
      });
      return updated;
    }

    // 3. Haipo — POST
    return listingFeeRulesApi.create(payload);
  },
};
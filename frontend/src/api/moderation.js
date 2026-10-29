// ============================================================
// api/moderation.js
// ============================================================
import { api } from "./client";

export const moderationApi = {
  // ── Queue ──────────────────────────────────────────────
  pendingListings: () => api.get("/admin/listings/pending/"),

  // ── Decisions (legacy) ─────────────────────────────────
  approve: (listingId) =>
    api.post(`/admin/listings/${listingId}/approve/`, {}),

  reject: (listingId, rejection_reason) =>
    api.post(`/admin/listings/${listingId}/reject/`, { rejection_reason }),

  disapprove: (listingId, reason = "") =>
    api.post(`/listings/${listingId}/disapprove/`, {
      rejection_reason: reason,
    }),

  // ── Moderation mpya (Chaguo B) ─────────────────────────

  // Admin ameomba uhariri — rudisha kwa seller kwa mabadiliko
  requestEdit: (listingId, reason) =>
    api.post(`/admin/listings/${listingId}/request-edit/`, { reason }),

  // Admin ameona ni nzuri — mwambie seller alipe fee
  requestPayment: (listingId, reason = "") =>
    api.post(`/admin/listings/${listingId}/request-payment/`, { reason }),

  // Mnunuzi ameshindwa kununua — rudisha mali LIVE (ada hairudishwi)
  releaseReservation: (listingId, reason = "") =>
    api.post(`/admin/listings/${listingId}/release-reservation/`, { reason }),

  // Admin analidhinisha mwisho baada ya fee kulipwa
  finalizeApproval: (listingId) =>
    api.post(`/admin/listings/${listingId}/finalize-approval/`, {}),

  // ── Hard delete (scam / permanent) ─────────────────────
  delete: (listingId, reason = "") =>
    api.delete(
      `/listings/${listingId}/?hard=true`,
      reason ? { reason } : undefined
    ),
};

export default moderationApi;
// ============================================================
// api/moderation.js
// ============================================================
import { api } from "./client";

export const moderationApi = {
  // ── Queue ──────────────────────────────────────────────
  pendingListings: () => api.get("/listings/admin/pending/"),

  // ── Decisions (legacy) ─────────────────────────────────
  approve: (listingId) =>
    api.post(`/listings/${listingId}/approve/`, {}),

  reject: (listingId, rejection_reason) =>
    api.post(`/listings/${listingId}/reject/`, { rejection_reason }),

  disapprove: (listingId, reason = "") =>
    api.post(`/listings/${listingId}/disapprove/`, {
      rejection_reason: reason,
    }),

  // ── Moderation mpya (Chaguo B) ─────────────────────────

  // Admin ameomba uhariri — rudisha kwa seller kwa mabadiliko
  requestEdit: (listingId, reason) =>
    api.post(`/listings/${listingId}/request-edit/`, { reason }),

  // Admin ameona ni nzuri — mwambie seller alipe fee
  requestPayment: (listingId, reason = "") =>
    api.post(`/listings/${listingId}/request-payment/`, { reason }),

  // Admin analidhinisha mwisho baada ya fee kulipwa
  finalizeApproval: (listingId) =>
    api.post(`/listings/${listingId}/finalize-approval/`, {}),

  // ── Hard delete (scam / permanent) ─────────────────────
  delete: (listingId, reason = "") =>
    api.delete(
      `/listings/${listingId}/?hard=true`,
      reason ? { reason } : undefined
    ),
};

export default moderationApi;
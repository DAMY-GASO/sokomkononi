import { api } from "./client";

export const moderationApi = {
  pendingListings: () => api.get("/listings/admin/pending/"),

  approve: (listingId) =>
    api.post(`/listings/${listingId}/approve/`, {}),

  reject: (listingId, rejection_reason) =>
    api.post(`/listings/${listingId}/reject/`, { rejection_reason }),

  // ⬇️ MPYA: disapprove (approve → rejected)
  disapprove: (listingId, reason = "") =>
    api.post(`/listings/${listingId}/disapprove/`, {
      rejection_reason: reason,
    }),

  // Hard delete kwa scam. Tunatuma reason tu kama ipo (baadhi ya proxies
  // hupoteza DELETE bodies, na backend inaweza kuchukulia `{reason:""}`
  // kama valid payload).
  delete: (listingId, reason = "") =>
    api.delete(
      `/listings/${listingId}/?hard=true`,
      reason ? { reason } : undefined
    ),
};
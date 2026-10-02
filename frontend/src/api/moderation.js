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

  // ⬇️ MPYA: delete (hard delete kwa scam)
  // Inatumia ListingViewSet.destroy na ?hard=true
  delete: (listingId, reason = "") =>
    api.delete(`/listings/${listingId}/?hard=true`, { reason }),
};
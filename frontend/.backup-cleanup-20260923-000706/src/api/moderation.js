import { api } from "./client";

export const moderationApi = {
  pendingListings: () => api.get("/listings/admin/pending/"),
  approve: (listingId) => api.post(`/listings/${listingId}/approve/`, {}),
  reject: (listingId, rejection_reason) =>
    api.post(`/listings/${listingId}/reject/`, { rejection_reason }),
};

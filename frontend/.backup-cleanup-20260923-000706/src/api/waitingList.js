import { api } from "./client";

export const waitingListApi = {
  list: () => api.get("/waiting-list/"),
  detail: (id) => api.get(`/waiting-list/${id}/`),
  mine: () => api.get("/waiting-list/mine/"),
  join: (listingId) => api.post("/waiting-list/", { listing: listingId }),
  leave: (id) => api.delete(`/waiting-list/${id}/`),
  listingEntries: (listingId) => api.get(`/waiting-list/listing/${listingId}/`),
};

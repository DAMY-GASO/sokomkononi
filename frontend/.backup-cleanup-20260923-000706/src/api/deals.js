import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const dealsApi = {
  list: (params = {}) => api.get(`/deals/${toQuery(params)}`),
  detail: (id) => api.get(`/deals/${id}/`),
  create: (listingId) => api.post("/deals/", { listing_id: listingId }),
  sendOffer: (dealRoomId, { amount, message = "", responded_to = null }) =>
    api.post(`/deals/${dealRoomId}/offers/`, {
      amount, message, responded_to,
    }),
  acceptOffer: (dealRoomId, offerId) =>
    api.post(`/deals/${dealRoomId}/accept-offer/`, { offer_id: offerId }),
  cancel: (dealRoomId, reason = "") =>
    api.post(`/deals/${dealRoomId}/cancel/`, { reason }),
};

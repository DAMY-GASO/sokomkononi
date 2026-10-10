// ============================================================
// api/deals.js
// Deal Rooms API — deals, messages, offers, payment proof
// Backend: /api/deals/
// ============================================================
import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const dealsApi = {
  // ── Deals ────────────────────────────────────────────────
  list: (params = {}) => api.get(`/deals/${toQuery(params)}`),
  detail: (id) => api.get(`/deals/${id}/`),
  create: (listingId) => api.post("/deals/", { listing_id: listingId }),

  // ── Offers ───────────────────────────────────────────────
  sendOffer: (dealRoomId, { amount, message = "", responded_to = null }) =>
    api.post(`/deals/${dealRoomId}/offers/`, {
      amount,
      message,
      responded_to,
    }),
  acceptOffer: (dealRoomId, offerId) =>
    api.post(`/deals/${dealRoomId}/accept-offer/`, { offer_id: offerId }),

  // ── Cancel ───────────────────────────────────────────────
  cancel: (dealRoomId, reason = "") =>
    api.post(`/deals/${dealRoomId}/cancel/`, { reason }),

  // ── Messages ─────────────────────────────────────────────
  messages: (dealRoomId, params = {}) =>
    api.get(`/deals/${dealRoomId}/messages/${toQuery(params)}`),

  // ⬇️ MPYA — Tuma ujumbe (POST)
  sendDealMessage: (dealRoomId, { text }) =>
    api.post(`/deals/${dealRoomId}/messages/`, { text }),

  // ── Offers list (kwa admin view) ─────────────────────────
  offers: (dealRoomId) => api.get(`/deals/${dealRoomId}/offers/`),

  // ── Payment proof (kwa admin view) ───────────────────────
  paymentProof: (dealRoomId) =>
    api.get(`/deals/${dealRoomId}/payment-proof/`),
};
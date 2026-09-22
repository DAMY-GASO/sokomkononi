import { api } from "./client";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const transactionsApi = {
  list: (params = {}) => api.get(`/transactions/${toQuery(params)}`),
  detail: (id) => api.get(`/transactions/${id}/`),
  mine: () => api.get("/transactions/mine/"),
  create: (dealRoomId) => api.post("/transactions/", { deal_room: dealRoomId }),
  createReservation: (id, duration_hours = 48) =>
    api.post(`/transactions/${id}/reservation/`, { duration_hours }),
  payReservation: (id, payment_reference) =>
    api.post(`/transactions/${id}/reservation/pay/`, { payment_reference }),
  startInspection: (id, duration_hours = 24) =>
    api.post(`/transactions/${id}/inspection/`, { duration_hours }),
  submitDecision: (id, { buyer_decision, buyer_decision_note = "" }) =>
    api.post(`/transactions/${id}/decision/`, {
      buyer_decision, buyer_decision_note,
    }),
  uploadFinalPayment: (id, { final_payment_proof, final_payment_reference = "" }) => {
    const formData = new FormData();
    formData.append("final_payment_proof", final_payment_proof);
    if (final_payment_reference) {
      formData.append("final_payment_reference", final_payment_reference);
    }
    return api.upload(`/transactions/${id}/final-payment/`, formData);
  },
  confirmPayment: (id, confirmation_note = "") =>
    api.post(`/transactions/${id}/confirm-payment/`, { confirmation_note }),
  cancel: (id, cancellation_reason) =>
    api.post(`/transactions/${id}/cancel/`, { cancellation_reason }),
  resolveDispute: (id, { resolution, note = "" }) =>
    api.post(`/transactions/${id}/resolve-dispute/`, { resolution, note }),
  expireReservation: (id) =>
    api.post(`/transactions/${id}/expire-reservation/`, {}),
  expireInspection: (id) =>
    api.post(`/transactions/${id}/expire-inspection/`, {}),
};

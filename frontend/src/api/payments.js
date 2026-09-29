// ============================================================
// api/payments.js — FimiPay order-status polling
// ============================================================
import { api } from "./client";

export const paymentsApi = {
  /**
   * Poll the status of a FimiPay order.
   * @param {string} orderId - e.g. "LSF-42" returned by the /pay/ endpoints
   * @returns {Promise<{order_id, payment_status, amount, currency, transid?, channel?, simulated?}>}
   */
  orderStatus: (orderId) =>
    api.post("/payments/order-status/", { order_id: orderId }),

  /**
   * Advanced: create a generic FimiPay order.
   * @param {{ amount:number, currency?:string, purpose:string, reference?:string }} payload
   */
  createOrder: (payload) => api.post("/payments/create-order/", payload),

  /**
   * Merchant transactions (staff only).
   * @param {{page_size?:number, page?:number, channel?:string, status?:string}} params
   */
  transactions: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== "")
    ).toString();
    return api.get(`/payments/transactions/${q ? `?${q}` : ""}`);
  },

  /** Payouts (staff only) */
  payouts: {
    list: (params = {}) => {
      const q = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null && v !== "")
      ).toString();
      return api.get(`/payments/payouts/${q ? `?${q}` : ""}`);
    },
    create: (payload) => api.post("/payments/payouts/create/", payload),
    detail: (id) => api.get(`/payments/payouts/${id}/`),
    sync: (id) => api.post(`/payments/payouts/${id}/sync/`, {}),
  },
};

// Terminal statuses — polling must stop when one of these appears.
export const TERMINAL_SUCCESS = new Set(["SUCCESS"]);
export const TERMINAL_FAILURE = new Set([
  "CANCELLED",
  "USERCANCELLED",
  "REJECTED",
  "FAILED",
]);
/** Non-terminal statuses — polling must continue. */
export const NON_TERMINAL = new Set(["PENDING", "INPROGRESS"]);

export function isTerminal(status) {
  const s = String(status || "").toUpperCase();
  return TERMINAL_SUCCESS.has(s) || TERMINAL_FAILURE.has(s);
}

export function isNonTerminal(status) {
  const s = String(status || "").toUpperCase();
  return NON_TERMINAL.has(s);
}

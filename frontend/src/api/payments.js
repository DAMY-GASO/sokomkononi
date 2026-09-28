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
};

// Terminal statuses — polling must stop when one of these appears.
export const TERMINAL_SUCCESS = new Set(["SUCCESS"]);
export const TERMINAL_FAILURE = new Set([
  "CANCELLED",
  "USERCANCELLED",
  "REJECTED",
  "FAILED",
]);

export function isTerminal(status) {
  const s = String(status || "").toUpperCase();
  return TERMINAL_SUCCESS.has(s) || TERMINAL_FAILURE.has(s);
}

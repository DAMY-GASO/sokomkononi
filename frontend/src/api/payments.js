// ============================================================
// api/payments.js — FimiPay payment client
//
// Contract (per FimiPay docs):
//   - Base URL is your backend, never fimipay.com directly
//   - Backend routes to FimiPay using its secret key
//   - `payment_method` + `currency` select the rail
//   - Mobile → poll order-status until terminal
//   - Card/bank → backend returns payment_gateway_url; redirect
// ============================================================
import { api } from "./client";

// ── Terminal-status helpers (spec) ──────────────────────────
export const TERMINAL_SUCCESS = new Set(["SUCCESS"]);
export const TERMINAL_FAILURE = new Set([
  "CANCELLED",
  "USERCANCELLED",
  "REJECTED",
  "FAILED",
]);
export const NON_TERMINAL = new Set(["PENDING", "INPROGRESS"]);

export function isTerminal(status) {
  const s = String(status || "").toUpperCase();
  return TERMINAL_SUCCESS.has(s) || TERMINAL_FAILURE.has(s);
}

export function isNonTerminal(status) {
  const s = String(status || "").toUpperCase();
  return NON_TERMINAL.has(s);
}

// ── Payment methods (Tanzania) ──────────────────────────────
// `value` is what the backend forwards to FimiPay as
// payment_method / channel. Adjust to match your backend's enum.
export const MOBILE_METHODS = [
  { key: "mpesa",       label: "M-Pesa",           icon: "smartphone" },
  { key: "airtel",      label: "Airtel Money",     icon: "smartphone" },
  { key: "mixx",        label: "Mixx by Yas",      icon: "smartphone" },
  { key: "halopesa",    label: "HaloPesa",         icon: "smartphone" },
  { key: "mtn",         label: "MTN MoMo",         icon: "smartphone" },
  { key: "orange",      label: "Orange Money",     icon: "smartphone" },
];

export const CARD_METHODS = [
  { key: "card",        label: "Kadi (Visa/Mastercard)", icon: "card" },
  { key: "bank",        label: "Benki (Instant Transfer)", icon: "bank" },
];

export const ALL_METHODS = [...MOBILE_METHODS, ...CARD_METHODS];

export function getPaymentMethod(key) {
  return ALL_METHODS.find((m) => m.key === key) || null;
}

export function isMobileMethod(key) {
  return MOBILE_METHODS.some((m) => m.key === key);
}

export function isCardMethod(key) {
  return CARD_METHODS.some((m) => m.key === key);
}

// ── Phone validation (Tanzania) ─────────────────────────────
// Accepts: 0712345678, 0755123456, +255712345678, 255712345678
export function normalizeTzPhone(raw) {
  const digits = String(raw || "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("255") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "255" + digits.slice(1);
  if (digits.length === 9) return "255" + digits;
  return "";
}

export function isValidTzPhone(raw) {
  return normalizeTzPhone(raw).length === 12;
}

// ── Public API ──────────────────────────────────────────────
export const paymentsApi = {
  /**
   * Poll the status of a FimiPay order.
   * @param {string} orderId - e.g. "LSF-42" returned by /pay/ endpoints
   */
  orderStatus: (orderId) =>
    api.post("/payments/order-status/", { order_id: orderId }),

  /**
   * Advanced: create a generic FimiPay order.
   * @param {{ amount:number, currency?:string, purpose:string, reference?:string, payment_method?:string, phone?:string }} payload
   */
  createOrder: (payload) => api.post("/payments/create-order/", payload),

  /** Merchant transactions (staff only) */
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

export default paymentsApi;

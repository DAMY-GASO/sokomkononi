// ============================================================
// api/payments.js — FimiPay client utilities
//
// Spec: https://docs.fimipay.com
//   - Frontend never talks to FimiPay directly
//   - Backend holds the secret key; frontend holds the JWT
//   - payment_method + phone go to the backend /pay/ endpoint
//   - Poll /payments/order-status/ until a terminal state
// ============================================================
import { api } from "./client";

// ── Polling cadence (spec Section 6.3) ─────────────────────
export const POLL_INTERVAL_MS = 4000;
export const MAX_POLL_ATTEMPTS = 30;       // ~2 minutes

// ── Terminal-status sets (spec Section 6.4) ────────────────
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

// ── Payment methods (spec Section 3.1) ─────────────────────
export const MOBILE_METHODS = [
  { key: "mpesa",    label: "M-Pesa",       icon: "smartphone" },
  { key: "airtel",   label: "Airtel Money", icon: "smartphone" },
  { key: "mixx",     label: "Mixx by Yas",  icon: "smartphone" },
  { key: "halopesa", label: "HaloPesa",     icon: "smartphone" },
  { key: "mtn",      label: "MTN MoMo",     icon: "smartphone" },
  { key: "orange",   label: "Orange Money", icon: "smartphone" },
];

export const CARD_METHODS = [
  { key: "card", label: "Kadi (Visa/Mastercard)",     icon: "card" },
  { key: "bank", label: "Benki (Instant Bank Transfer)", icon: "bank" },
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

// ── Phone normalization (spec Section 3.2) ─────────────────
//   0712345678    → 255712345678
//   +255712345678 → 255712345678
//   255712345678  → 255712345678
//   0712 345 678  → 255712345678
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

// Formats a raw phone input for display as "0712 345 678"
export function formatTzPhoneDisplay(value) {
  const digits = String(value).replace(/[^0-9]/g, "").slice(0, 10);
  if (!digits) return "";
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

// ── Polling helper (spec Section 6.5) ──────────────────────
export async function pollOrderStatus(orderId, { onProgress, signal } = {}) {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    if (signal?.aborted) {
      return { ok: false, status: "ABORTED", data: { detail: "Cancelled." } };
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    if (signal?.aborted) {
      return { ok: false, status: "ABORTED", data: { detail: "Cancelled." } };
    }
    onProgress?.(i + 1);

    let data;
    try {
      data = await api.post("/payments/order-status/", { order_id: orderId });
    } catch {
      continue; // network blip — retry next interval
    }

    const status = String(data?.payment_status || "").toUpperCase();
    if (TERMINAL_SUCCESS.has(status)) return { ok: true, data, status };
    if (TERMINAL_FAILURE.has(status)) return { ok: false, data, status };
    // PENDING / INPROGRESS → keep going
  }

  return {
    ok: false,
    status: "TIMEOUT",
    data: { detail: "Payment timed out. Check your transaction history." },
  };
}

// ── Public API ─────────────────────────────────────────────
export const paymentsApi = {
  orderStatus: (orderId) =>
    api.post("/payments/order-status/", { order_id: orderId }),

  createOrder: (payload) => api.post("/payments/create-order/", payload),

  transactions: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== "")
    ).toString();
    return api.get(`/payments/transactions/${q ? `?${q}` : ""}`);
  },

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

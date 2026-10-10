// ============================================================
// transactionsStore.js
// Backend sources:
//   GET /api/finance/my-transactions/   → flat list of fee payments
//   GET /api/transactions/mine/          → transaction rows
// ============================================================
import { useEffect, useState } from "react";
import { financeApi } from "../api/finance.js";

const STORAGE_KEY = "sokomkononi_transactions_v1";
const UPDATE_EVENT = "sokomkononi:transactions-updated";

export const SEED_TRANSACTIONS = [];

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return SEED_TRANSACTIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_TRANSACTIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_TRANSACTIONS;
    return parsed;
  } catch {
    return SEED_TRANSACTIONS;
  }
}

export function getTransactions() {
  return readFromStorage();
}

export function saveTransactions(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/**
 * Ongeza transaction mpya.
 * @param {object} txn - Transaction data
 * @returns {Array} List mpya ya transactions
 */
export function addTransaction(txn) {
  if (!txn || typeof txn !== "object") {
    console.warn("[transactionsStore] addTransaction: invalid txn");
    return getTransactions();
  }

  // ✅ FIX: `...txn` kwanza, kisha `id`/`ref`/`at` baada ili defaults
  // zisipotezwe na fields za txn. Field za txn zinaweza override tu
  // kama zipo wazi.
  const entry = {
    // 1. Defaults (zinatumika kama txn haina)
    ...txn,
    // 2. Override na values za txn (kama zipo)
    id:
      txn.id ||
      `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ref:
      txn.ref ||
      `SM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    at: txn.at || new Date().toISOString(),
  };

  const next = [entry, ...getTransactions()];
  saveTransactions(next);
  return next;
}

// ============================================================
// NORMALIZER — /api/finance/my-transactions/ shape → frontend shape
// ============================================================
function normalizeMyTransaction(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    ref: raw.ref,
    type: raw.type, // "listing_fee" | "boost" | "reservation" | "bundle_purchase"
    source: raw.source,
    title: raw.title,
    property: raw.listing_title || raw.title,
    listingId: raw.listing_id,
    amount: Number(raw.amount) || 0,
    status: (raw.status || "pending").toLowerCase(),
    paymentStatus: raw.payment_status,
    paymentReference: raw.payment_reference,
    method: raw.method || null,
    paidAt: raw.paid_at,
    at: raw.created_at || raw.paid_at,
    // ⬇️ MPYA — Bundle fields
    bundleId: raw.bundle_id,
    bundleName: raw.bundle_name,
    credits: raw.credits,
  };
}

// ============================================================
// HYDRATE FROM API
// ============================================================
async function _hydrateTxImpl() {
  try {
    const data = await financeApi.myTransactions();
    const rawList = Array.isArray(data) ? data : data?.results || [];
    const normalized = rawList.map(normalizeMyTransaction).filter(Boolean);
    saveTransactions(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[transactionsStore] hydrate failed:", err);
    return { source: "error", count: getTransactions().length };
  }
}

// ============================================================
// HOOKS
// ============================================================
let _inflight_hydrateTransactionsFromApi = null;
export function hydrateTransactionsFromApi(...args) {
  if (_inflight_hydrateTransactionsFromApi) return _inflight_hydrateTransactionsFromApi;
  _inflight_hydrateTransactionsFromApi = _hydrateTxImpl(...args).finally(() => { _inflight_hydrateTransactionsFromApi = null; });
  return _inflight_hydrateTransactionsFromApi;
}

export function useTransactions() {
  const [list, setList] = useState(() => getTransactions());

  useEffect(() => {
    hydrateTransactionsFromApi();

    const sync = () => setList(getTransactions());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return list;
}

export function useMyTransactionsAggregate() {
  const list = useTransactions();
  const FEE_TYPES = [
    "listing_fee",
    "reservation",
    "boost",
    "leading",
    "advertisement",
    "bundle_purchase",   // ⬅️ MPYA
  ];
  const revenue = list
    .filter((t) => t.status === "completed" && FEE_TYPES.includes(t.type))
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const spent = revenue;
  const earned = list
    .filter((t) => t.status === "completed" && t.type === "sale")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  return { revenue, spent, earned, totalCount: list.length };
}

export function useFeeTransactions() {
  return useTransactions();
}
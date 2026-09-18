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

export function addTransaction(txn) {
  const entry = {
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ref: txn.ref || `SM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    at: new Date().toISOString(),
    ...txn,
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
    type: raw.type,                    // "listing_fee" | "boost" | "reservation"
    source: raw.source,
    title: raw.title,
    property: raw.listing_title || raw.title,
    listingId: raw.listing_id,
    amount: Number(raw.amount) || 0,
    status: (raw.status || "pending").toLowerCase(),  // "completed" | "pending" | ...
    paymentStatus: raw.payment_status,
    paymentReference: raw.payment_reference,
    method: raw.method || null,
    paidAt: raw.paid_at,
    at: raw.created_at || raw.paid_at,
  };
}

// ============================================================
// HYDRATE FROM API
// ============================================================
export async function hydrateTransactionsFromApi() {
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
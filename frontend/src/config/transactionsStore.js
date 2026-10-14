// ============================================================
// transactionsStore.js — v2
// Inaunganisha finance + transactions API
// Ina-normalize status/type kwa usahihi
// ============================================================
import { useEffect, useState } from "react";
import { financeApi } from "../api/finance.js";
import { transactionsApi } from "../api/transactions.js";

const STORAGE_KEY = "sokomkononi_transactions_v1";
const UPDATE_EVENT = "sokomkononi:transactions-updated";

export const SEED_TRANSACTIONS = [];

// ═══════════════════════════════════════════════════════════
// STATUS NORMALIZER — hii ndiyo sababu kuu
// ═══════════════════════════════════════════════════════════
function normalizeStatus(raw) {
  const s = String(raw || "").toLowerCase().trim();
  // Zote hizi zinamaanisha "completed"
  if (["completed", "complete", "success", "succeeded", "paid", "done", "settled"].includes(s)) {
    return "completed";
  }
  if (["pending", "processing", "in_progress", "awaiting", "initiated"].includes(s)) {
    return "pending";
  }
  if (["failed", "failure", "declined", "rejected", "error"].includes(s)) {
    return "failed";
  }
  if (["cancelled", "canceled", "expired"].includes(s)) {
    return "cancelled";
  }
  return s || "pending";
}

// ═══════════════════════════════════════════════════════════
// TYPE NORMALIZER
// ═══════════════════════════════════════════════════════════
function normalizeType(raw) {
  const t = String(raw || "").toLowerCase().trim();
  const map = {
    // listing fee
    "listing_fee": "listing_fee",
    "listingfee": "listing_fee",
    "listing fee": "listing_fee",
    "publication_fee": "listing_fee",

    // boost
    "boost": "boost",
    "boost_fee": "boost",

    // leading
    "leading": "leading",
    "lead": "leading",
    "lead_fee": "leading",

    // advertisement
    "advertisement": "advertisement",
    "ad": "advertisement",
    "ads": "advertisement",
    "advert": "advertisement",

    // reservation
    "reservation": "reservation",
    "reservation_fee": "reservation",
    "hold": "reservation",

    // sale
    "sale": "sale",
    "sales": "sale",
    "sold": "sale",

    // purchase
    "purchase": "purchase",
    "buy": "purchase",
    "buying": "purchase",

    // bundle
    "bundle": "bundle_purchase",
    "bundle_purchase": "bundle_purchase",
    "bundle purchase": "bundle_purchase",

    // success fee
    "success_fee": "success_fee",
    "successfee": "success_fee",
    "success fee": "success_fee",
  };
  return map[t] || t || "other";
}

// ═══════════════════════════════════════════════════════════
// AMOUNT NORMALIZER
// ═══════════════════════════════════════════════════════════
function normalizeAmount(raw) {
  if (raw == null) return 0;
  if (typeof raw === "number") return raw;
  const cleaned = String(raw).replace(/[^\d.-]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

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

export function addTransaction(txn) {
  if (!txn || typeof txn !== "object") {
    console.warn("[transactionsStore] addTransaction: invalid txn");
    return getTransactions();
  }

  const entry = {
    ...txn,
    id: txn.id || `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ref: txn.ref || `SM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    at: txn.at || new Date().toISOString(),
  };

  const next = [entry, ...getTransactions()];
  saveTransactions(next);
  return next;
}

// ============================================================
// NORMALIZERS
// ============================================================
function normalizeMyTransaction(raw) {
  if (!raw) return null;

  // ✅ Tumia normalizeAmount, normalizeStatus, normalizeType
  const amount = normalizeAmount(
    raw.amount ?? raw.price ?? raw.fee_amount ?? raw.total ?? raw.value
  );

  const status = normalizeStatus(raw.status ?? raw.payment_status);

  const type = normalizeType(raw.type ?? raw.transaction_type ?? raw.source);

  return {
    id: raw.id,
    ref: raw.ref || raw.reference || `TXN-${raw.id}`,
    type,
    source: raw.source || "finance",
    title: raw.title || raw.description || raw.listing_title || `Transaction #${raw.id}`,
    property: raw.listing_title || raw.property || null,
    listingId: raw.listing_id || raw.listing || null,
    amount,
    status,
    paymentStatus: raw.payment_status,
    paymentReference: raw.payment_reference,
    method: raw.method || raw.payment_method || null,
    paidAt: raw.paid_at || raw.completed_at,
    at: raw.created_at || raw.paid_at || raw.updated_at,
    bundleId: raw.bundle_id,
    bundleName: raw.bundle_name,
    credits: raw.credits,
  };
}

function normalizeTransactionRow(raw) {
  if (!raw) return null;

  const amount = normalizeAmount(
    raw.amount ?? raw.final_price ?? raw.reservation_fee ?? raw.success_fee_amount ?? raw.price
  );

  const status = normalizeStatus(raw.status ?? raw.payment_status);

  const type = normalizeType(raw.transaction_type ?? raw.type);

  return {
    id: raw.id,
    ref: raw.reference || raw.ref || `TXN-${raw.id}`,
    type,
    source: "transactions",
    title: raw.title || raw.listing_title || raw.description || `Transaction #${raw.id}`,
    property: raw.listing_title || null,
    listingId: raw.listing,
    amount,
    status,
    paymentStatus: raw.payment_status,
    paymentReference: raw.payment_reference,
    method: raw.method || raw.payment_method || null,
    paidAt: raw.paid_at || raw.completed_at,
    at: raw.created_at || raw.updated_at,
  };
}

// ============================================================
// HYDRATE FROM API — vyanzo viwili
// ============================================================
async function _hydrateTxImpl() {
  const results = await Promise.allSettled([
    financeApi.myTransactions(),
    transactionsApi.mine(),
  ]);

  const financeRes = results[0];
  const txRes = results[1];

  const financeList =
    financeRes.status === "fulfilled"
      ? Array.isArray(financeRes.value)
        ? financeRes.value
        : financeRes.value?.results || []
      : [];

  const txList =
    txRes.status === "fulfilled"
      ? Array.isArray(txRes.value)
        ? txRes.value
        : txRes.value?.results || []
      : [];

  // ✅ DEBUG (ondoa baada ya kuthibitisha)
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    console.log("[transactionsStore] finance raw:", financeList);
    console.log("[transactionsStore] tx raw:", txList);
  }

  const normalizedFinance = financeList.map(normalizeMyTransaction).filter(Boolean);
  const normalizedTx = txList.map(normalizeTransactionRow).filter(Boolean);

  // ✅ DEBUG
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    console.log("[transactionsStore] finance normalized:", normalizedFinance);
    console.log("[transactionsStore] tx normalized:", normalizedTx);
  }

  // Prefix keys so finance txn #5 and deal txn #5 stay distinct.
  const byId = new Map();
  normalizedFinance.forEach((tr) => byId.set(`fin_${tr.id}`, tr));
  normalizedTx.forEach((tr) => byId.set(`tx_${tr.id}`, tr));

  const all = Array.from(byId.values());
  all.sort((a, b) => new Date(b.at) - new Date(a.at));

  saveTransactions(all);

  return {
    source: "api",
    count: all.length,
    completed: all.filter((t) => t.status === "completed").length,
    finance: normalizedFinance.length,
    tx: normalizedTx.length,
  };
}

let _inflight = null;
export function hydrateTransactionsFromApi(...args) {
  if (_inflight) return _inflight;
  _inflight = _hydrateTxImpl(...args).finally(() => {
    _inflight = null;
  });
  return _inflight;
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

// ============================================================
// AGGREGATES
// ============================================================
export function useMyTransactionsAggregate() {
  const list = useTransactions();
  const FEE_TYPES = [
    "listing_fee",
    "reservation",
    "boost",
    "leading",
    "advertisement",
    "bundle_purchase",
    "success_fee",
    "purchase",
  ];

  const spent = list
    .filter((t) => t.status === "completed" && FEE_TYPES.includes(t.type))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const earned = list
    .filter((t) => t.status === "completed" && t.type === "sale")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return {
    revenue: spent,
    spent,
    earned,
    totalCount: list.length,
  };
}

export function useFeeTransactions() {
  return useTransactions();
}
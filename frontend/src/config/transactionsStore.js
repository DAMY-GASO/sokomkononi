// ============================================================
// transactionsStore.js — v4
// Inaunganisha finance + transactions API
// Ina-normalize status/type kwa usahihi
//
// SASISHO v4:
//  - FIX: _findTx na _upsertTx sasa zina-handle rawId na prefixed id
//         (fin_42, tx_7) kwa usahihi — mzunguko wa lifecycle hautavunjika
//         baada ya hydration.
//  - FIX: payReservationAsync ina-guard null kabla ya _upsertTx.
// ============================================================
import { useEffect, useState } from "react";
import { financeApi } from "../api/finance.js";
import { transactionsApi } from "../api/transactions.js";

const STORAGE_KEY = "sokomkononi_transactions_v1";
const UPDATE_EVENT = "sokomkononi:transactions-updated";

export const SEED_TRANSACTIONS = [];

// ═══════════════════════════════════════════════════════════
// STATUS NORMALIZER
// ═══════════════════════════════════════════════════════════
function normalizeStatus(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (
    ["completed", "complete", "success", "succeeded", "paid", "done", "settled"].includes(s)
  ) {
    return "completed";
  }
  if (
    ["pending", "processing", "in_progress", "awaiting", "initiated"].includes(s)
  ) {
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
    listing_fee: "listing_fee",
    listingfee: "listing_fee",
    "listing fee": "listing_fee",
    publication_fee: "listing_fee",
    boost: "boost",
    boost_fee: "boost",
    leading: "leading",
    lead: "leading",
    lead_fee: "leading",
    advertisement: "advertisement",
    ad: "advertisement",
    ads: "advertisement",
    advert: "advertisement",
    reservation: "reservation",
    reservation_fee: "reservation",
    hold: "reservation",
    sale: "sale",
    sales: "sale",
    sold: "sale",
    purchase: "purchase",
    buy: "purchase",
    buying: "purchase",
    bundle: "bundle_purchase",
    bundle_purchase: "bundle_purchase",
    "bundle purchase": "bundle_purchase",
    success_fee: "success_fee",
    successfee: "success_fee",
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
    rawId: txn.rawId || txn.id || null,
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
// NORMALIZERS
// ============================================================
function normalizeMyTransaction(raw) {
  if (!raw) return null;

  const amount = normalizeAmount(
    raw.amount ?? raw.price ?? raw.fee_amount ?? raw.total ?? raw.value
  );
  const status = normalizeStatus(raw.status ?? raw.payment_status);
  const type = normalizeType(raw.type ?? raw.transaction_type ?? raw.source);

  return {
    rawId: raw.raw_id ?? raw.id,
    id: raw.id,
    ref: raw.ref || raw.reference || `TXN-${raw.id}`,
    type,
    source: raw.source || "finance",
    title:
      raw.title ||
      raw.description ||
      raw.listing_title ||
      `Transaction #${raw.id}`,
    property: raw.listing_title || raw.property || null,
    listingId: raw.listing_id || raw.listing || null,
    amount,
    status,
    paymentStatus: raw.payment_status,
    paymentReference: raw.payment_reference,
    method: raw.method || raw.payment_method || null,
    paidAt: raw.paid_at || raw.completed_at,
    at: raw.paid_at || raw.created_at || raw.updated_at,
    bundleId: raw.bundle_id,
    bundleName: raw.bundle_name,
    credits: raw.credits,
  };
}

function normalizeTransactionRow(raw) {
  if (!raw) return null;

  const amount = normalizeAmount(
    raw.amount ??
      raw.final_price ??
      raw.reservation_fee ??
      raw.success_fee_amount ??
      raw.price
  );
  const status = normalizeStatus(raw.status ?? raw.payment_status);
  const type = normalizeType(raw.transaction_type ?? raw.type);

  return {
    rawId: raw.raw_id ?? raw.id,
    id: raw.id,
    ref: raw.reference || raw.ref || `TXN-${raw.id}`,
    type,
    source: "transactions",
    title:
      raw.title ||
      raw.listing_title ||
      raw.description ||
      `Transaction #${raw.id}`,
    property: raw.listing_title || null,
    listingId: raw.listing,
    reservationExpiresAt:
      raw.reservation_expires_at ||
      raw.reservation?.expires_at ||
      raw.reserved_until ||
      null,
    amount,
    status,
    paymentStatus: raw.payment_status,
    paymentReference: raw.payment_reference,
    method: raw.method || raw.payment_method || null,
    paidAt: raw.paid_at || raw.completed_at,
    at: raw.paid_at || raw.created_at || raw.updated_at,
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

  const normalizedFinance = financeList
    .map(normalizeMyTransaction)
    .filter(Boolean);
  const normalizedTx = txList.map(normalizeTransactionRow).filter(Boolean);

  // Prefix keys so finance txn #5 and deal txn #5 stay distinct.
  const byId = new Map();
  normalizedFinance.forEach((tr) =>
    byId.set(`fin_${tr.rawId || tr.id}`, { ...tr, _prefix: "fin_" })
  );
  normalizedTx.forEach((tr) =>
    byId.set(`tx_${tr.rawId || tr.id}`, { ...tr, _prefix: "tx_" })
  );

  const all = Array.from(byId.values())
    .map((tr) => {
      const prefix = tr._prefix || "fin_";
      const backendId = tr.rawId || tr.id;
      const { _prefix, ...rest } = tr;
      return {
        ...rest,
        id: `${prefix}${backendId}`,
        rawId: backendId,
      };
    })
    .sort((a, b) => new Date(b.at) - new Date(a.at));

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

// ============================================================
// LIFECYCLE API
// ============================================================
import { transactionsApi as _txApi } from "../api/transactions.js";

export const TX_STATUS = {
  PENDING: "pending",
  RESERVED: "reserved",
  RESERVED_PAID: "reserved_paid",
  INSPECTING: "inspecting",
  DECIDED_ACCEPT: "decided_accept",
  DECIDED_REJECT: "decided_reject",
  AWAITING_CONFIRMATION: "awaiting_confirmation",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DISPUTED: "disputed",
  EXPIRED: "expired",
};

// ── FIX: Strip hydration prefix ili rawId na prefixed id zilingane ──
function _stripPrefix(id) {
  const s = String(id ?? "");
  if (s.startsWith("fin_") || s.startsWith("tx_")) return s.slice(4);
  return s;
}

function _findTx(id) {
  if (id == null) return null;
  const key = _stripPrefix(id);
  if (!key) return null;
  return (
    readFromStorage().find((t) => {
      const tid = _stripPrefix(t.id);
      const traw = _stripPrefix(t.rawId);
      return tid === key || traw === key;
    }) || null
  );
}

function _upsertTx(tx) {
  if (!tx) return;
  const key = _stripPrefix(tx.id ?? tx.rawId);
  if (!key) {
    // Fallback: no id — prepend only, avoid wiping existing entries
    saveTransactions([tx, ...readFromStorage()]);
    return;
  }

  const current = readFromStorage();
  const existing = current.find((t) => {
    const tid = _stripPrefix(t.id);
    const traw = _stripPrefix(t.rawId);
    return tid === key || traw === key;
  });

  const merged = { ...tx };

  // Preserve hydrated prefix on id so the list stays consistent
  if (
    existing &&
    (String(existing.id).startsWith("tx_") ||
      String(existing.id).startsWith("fin_"))
  ) {
    merged.id = existing.id;
  }
  if (existing && existing.rawId != null && merged.rawId == null) {
    merged.rawId = existing.rawId;
  }

  const list = current.filter((t) => {
    const tid = _stripPrefix(t.id);
    const traw = _stripPrefix(t.rawId);
    return tid !== key && traw !== key;
  });
  saveTransactions([merged, ...list]);
}

async function _mutate({ id, patch, apiCall }) {
  const previous = readFromStorage();
  const current = _findTx(id);
  if (!current) return { ok: false, error: new Error("Transaction not found") };
  _upsertTx({ ...current, ...patch, updatedAt: new Date().toISOString() });
  try {
    const raw = await apiCall();
    const normalized = normalizeTransactionRow(raw) || normalizeMyTransaction(raw);
    if (normalized) _upsertTx(normalized);
    return { ok: true, transaction: normalized || current };
  } catch (err) {
    saveTransactions(previous);
    return { ok: false, error: err };
  }
}

export async function createTransactionAsync(dealRoomId) {
  if (!dealRoomId) return { ok: false, error: new Error("dealRoomId is required") };
  try {
    const raw = await _txApi.create(dealRoomId);
    const tx = normalizeTransactionRow(raw) || normalizeMyTransaction(raw);
    if (tx) _upsertTx(tx);
    return { ok: true, transaction: tx };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function createReservationAsync(id, durationHours = 48) {
  return _mutate({
    id,
    patch: { status: TX_STATUS.RESERVED, reservationHours: durationHours },
    apiCall: () => _txApi.createReservation(id, durationHours),
  });
}

export async function payReservationAsync(id, opts = {}) {
  if (!id) return { ok: false, error: new Error("Transaction id is required") };
  const isCredits = opts.paymentReference === "credits";
  if (isCredits) {
    const current = _findTx(id);
    if (!current) {
      return { ok: false, error: new Error("Transaction not found") };
    }
    _upsertTx({
      ...current,
      status: TX_STATUS.RESERVED_PAID,
      reservationPaidAt: new Date().toISOString(),
    });
  }
  try {
    const raw = await _txApi.payReservation(id, {
      payment_reference: opts.paymentReference || undefined,
      payment_method: opts.paymentMethod || undefined,
      phone: opts.phone || undefined,
    });
    // FimiPay order — caller polls status.
    // Backend inarudisha { reservation_id, payment_status, fimipay: {...} }
    const fp = raw?.fimipay || raw;
    if (fp?.order_id && !isCredits) {
      return {
        ok: true,
        pending: true,
        orderId: fp.order_id,
        reference: fp.order_id,
        checkoutUrl: fp.payment_url || fp.checkout_url || null,
        transaction: _findTx(id),
      };
    }
    const tx = normalizeTransactionRow(raw) || normalizeMyTransaction(raw);
    if (tx) _upsertTx(tx);
    return { ok: true, pending: false, transaction: tx || _findTx(id) };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function pollReservationStatusAsync(id, { attempts = 15, intervalMs = 4000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const raw = await _txApi.detail(id);
      const tx = normalizeTransactionRow(raw) || normalizeMyTransaction(raw);
      if (!tx) continue;
      _upsertTx(tx);
      if ([TX_STATUS.RESERVED_PAID, TX_STATUS.INSPECTING, TX_STATUS.DECIDED_ACCEPT, TX_STATUS.AWAITING_CONFIRMATION, TX_STATUS.COMPLETED].includes(tx.status)) {
        return { ok: true, transaction: tx };
      }
      if ([TX_STATUS.CANCELLED, TX_STATUS.EXPIRED].includes(tx.status)) {
        return { ok: false, transaction: tx, error: new Error("Reservation expired/cancelled") };
      }
    } catch { /* retry */ }
  }
  return { ok: false, error: new Error("Reservation not activated after waiting") };
}

export async function startInspectionAsync(id, durationHours = 24) {
  return _mutate({
    id,
    patch: { status: TX_STATUS.INSPECTING, inspectionHours: durationHours, inspectionStartedAt: new Date().toISOString() },
    apiCall: () => _txApi.startInspection(id, durationHours),
  });
}

const _DECISION_MAP = {
  READY_FOR_FINAL_PAYMENT: "READY_FOR_FINAL_PAYMENT",
  NOT_AS_DESCRIBED: "NOT_AS_DESCRIBED",
  REQUEST_NEGOTIATION: "REQUEST_NEGOTIATION",
  CANCEL_TRANSACTION: "CANCEL_TRANSACTION",
  ACCEPT: "READY_FOR_FINAL_PAYMENT",
  REJECT: "NOT_AS_DESCRIBED",
  CANCEL: "CANCEL_TRANSACTION",
};

export async function submitDecisionAsync(id, { buyerDecision, buyerDecisionNote = "" }) {
  if (!buyerDecision) return { ok: false, error: new Error("buyerDecision required") };
  const apiValue = _DECISION_MAP[String(buyerDecision).toUpperCase()] || buyerDecision;
  const newStatus =
    apiValue === "READY_FOR_FINAL_PAYMENT" ? TX_STATUS.DECIDED_ACCEPT
    : apiValue === "REQUEST_NEGOTIATION" || apiValue === "NOT_AS_DESCRIBED" ? TX_STATUS.DISPUTED
    : TX_STATUS.CANCELLED;
  return _mutate({
    id,
    patch: { status: newStatus, buyerDecision: apiValue, buyerDecisionNote },
    apiCall: () => _txApi.submitDecision(id, { buyer_decision: apiValue, buyer_decision_note: buyerDecisionNote }),
  });
}

export async function uploadFinalPaymentAsync(id, { finalPaymentProof, finalPaymentReference = "" }) {
  if (!finalPaymentProof) return { ok: false, error: new Error("finalPaymentProof required") };
  return _mutate({
    id,
    patch: { status: TX_STATUS.AWAITING_CONFIRMATION, finalPaymentReference, finalPaymentUploadedAt: new Date().toISOString() },
    apiCall: () => _txApi.uploadFinalPayment(id, { final_payment_proof: finalPaymentProof, final_payment_reference: finalPaymentReference }),
  });
}

export async function confirmPaymentAsync(id, confirmationNote = "") {
  return _mutate({
    id,
    patch: { status: TX_STATUS.COMPLETED, confirmationNote, confirmedAt: new Date().toISOString() },
    apiCall: () => _txApi.confirmPayment(id, confirmationNote),
  });
}

export async function cancelTransactionAsync(id, cancellationReason = "") {
  return _mutate({
    id,
    patch: { status: TX_STATUS.CANCELLED, cancellationReason, cancelledAt: new Date().toISOString() },
    apiCall: () => _txApi.cancel(id, cancellationReason),
  });
}

export async function fetchDealRoomDetailAsync(dealRoomId) {
  if (!dealRoomId) return { ok: false, error: new Error("dealRoomId is required") };
  try {
    const { dealsApi } = await import("../api/deals.js");
    const data = await dealsApi.detail(dealRoomId);
    return {
      ok: true,
      dealRoom: data,
      messages: data?.messages || [],
      paymentProof: data?.payment_proof || null,
      reservation: { fee: data?.reservation_fee, hours: data?.reservation_hours, method: data?.reservation_method, expiresAt: data?.reservation_expires_at },
      disputeNote: data?.dispute_note || "",
    };
  } catch (err) {
    return { ok: false, error: err, messages: [], paymentProof: null };
  }
}

export function getDealTranscript(dealId, currentUserId = null, lang = "sw") {
  const tx = _findTx(dealId);
  if (!tx) return null;
  return { deal: tx, meta: { dealRoomId: tx.id, listingTitle: tx.listingTitle, buyerName: tx.buyerName, sellerName: tx.sellerName, status: tx.status }, messages: [] };
}

// ============================================================
// EXTEND RESERVATION (ada inalipwa kwanza)
// ============================================================
export async function extendReservationAsync(id, additionalHours, opts = {}) {
  if (!id) return { ok: false, error: new Error("Transaction id is required") };
  try {
    const raw = await _txApi.extendReservation(id, additionalHours, {
      payment_reference: opts.paymentReference || undefined,
      payment_method: opts.paymentMethod || undefined,
      phone: opts.phone || undefined,
    });
    const fp = raw?.fimipay;
    if (fp) {
      return {
        ok: true,
        pending: true,
        orderId: fp.order_id || null,
        reference: fp.order_id || null,
        checkoutUrl: fp.payment_url || fp.checkout_url || null,
        extensionId: raw.extension_id,
        fee: Number(raw.fee) || 0,
      };
    }
    return { ok: true, pending: false, expiresAt: raw?.expires_at || null };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// Subiri hadi expires_at ya reservation iongezeke (malipo yamethibitishwa)
export async function pollExtensionAsync(
  id,
  previousExpiresAt,
  { attempts = 15, intervalMs = 4000 } = {}
) {
  const before = previousExpiresAt ? new Date(previousExpiresAt).getTime() : 0;
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const raw = await _txApi.detail(id);
      const exp = raw?.reservation?.expires_at;
      if (exp && new Date(exp).getTime() > before) {
        return { ok: true, expiresAt: exp };
      }
    } catch { /* retry */ }
  }
  return { ok: false, error: new Error("Extension not confirmed yet") };
}

// ============================================================
// transactionLifecycleStore.js
// Backend: /api/transactions/
// Reservation flow: create → pay (FimiPay au credits au free) → activate
// ============================================================
import { useEffect, useState } from "react";
import { transactionsApi } from "../api/transactions.js";

const STORAGE_KEY = "sokomkononi_transactions_lifecycle_v1";
const UPDATE_EVENT = "sokomkononi:transactions-lifecycle-updated";

export const SEED_TRANSACTIONS = [];

// ============================================================
// STATUS VOCABULARY
// Frontend slug ↔ Backend enum (kama backend inatumia CAPS)
// ============================================================
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

const API_TO_STATUS = {
  PENDING: TX_STATUS.PENDING,
  RESERVED: TX_STATUS.RESERVED,
  RESERVATION_PAID: TX_STATUS.RESERVED_PAID,
  INSPECTION: TX_STATUS.INSPECTING,
  INSPECTING: TX_STATUS.INSPECTING,
  DECIDED_ACCEPT: TX_STATUS.DECIDED_ACCEPT,
  ACCEPTED: TX_STATUS.DECIDED_ACCEPT,
  DECIDED_REJECT: TX_STATUS.DECIDED_REJECT,
  REJECTED: TX_STATUS.DECIDED_REJECT,
  AWAITING_CONFIRMATION: TX_STATUS.AWAITING_CONFIRMATION,
  COMPLETED: TX_STATUS.COMPLETED,
  CANCELLED: TX_STATUS.CANCELLED,
  DISPUTED: TX_STATUS.DISPUTED,
  EXPIRED: TX_STATUS.EXPIRED,
};

// ============================================================
// STORAGE HELPERS
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

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function upsertLocal(tx) {
  const current = readFromStorage();
  const next = [tx, ...current.filter((t) => t.id !== tx.id)];
  saveAll(next);
  return next;
}

// ============================================================
// NORMALIZER — backend → frontend shape
// ============================================================
function normalizeTransactionFromApi(raw) {
  if (!raw) return null;
  const listing = raw.listing || raw.deal_room?.listing || {};
  const buyer = raw.buyer || raw.deal_room?.buyer || {};
  const seller = raw.seller || raw.deal_room?.seller || {};

  const status =
    API_TO_STATUS[raw.status] ||
    (raw.status || "PENDING").toLowerCase();

  return {
    id: raw.id,
    ref: raw.reference || raw.ref || null,
    dealRoomId: raw.deal_room?.id ?? raw.deal_room ?? null,
    listingId: listing.id ?? raw.listing_id ?? null,
    listingTitle: listing.title || raw.listing_title || "",
    listingPrice: Number(listing.price ?? raw.listing_price) || 0,
    location: listing.location || "",
    category: listing.category?.slug || listing.category || null,

    buyerId: buyer.id ?? null,
    buyerName: buyer.name || raw.buyer_name || "",
    sellerId: seller.id ?? null,
    sellerName: seller.name || raw.seller_name || "",

    status,
    agreedPrice: Number(raw.agreed_price ?? raw.price) || 0,

    // Reservation
    reservationHours: raw.reservation_hours ?? null,
    reservationFee: Number(raw.reservation_fee) || 0,
    reservationPaidAt: raw.reservation_paid_at || null,
    reservationExpiresAt: raw.reservation_expires_at || null,

    // Inspection
    inspectionHours: raw.inspection_hours ?? null,
    inspectionStartedAt: raw.inspection_started_at || null,
    inspectionExpiresAt: raw.inspection_expires_at || null,

    // Decision
    buyerDecision: raw.buyer_decision || null,
    buyerDecisionNote: raw.buyer_decision_note || "",

    // Final payment
    finalPaymentReference: raw.final_payment_reference || "",
    finalPaymentProof: raw.final_payment_proof || null,
    finalPaymentUploadedAt: raw.final_payment_uploaded_at || null,

    // Confirmation
    confirmationNote: raw.confirmation_note || "",
    confirmedAt: raw.confirmed_at || null,

    // Cancel / Dispute
    cancellationReason: raw.cancellation_reason || "",
    cancelledAt: raw.cancelled_at || null,
    disputeReason: raw.dispute_reason || "",
    resolution: raw.resolution || "",
    resolutionNote: raw.resolution_note || "",
    resolvedAt: raw.resolved_at || null,

    createdAt: raw.created_at || new Date().toISOString(),
    updatedAt: raw.updated_at || new Date().toISOString(),
  };
}

// ============================================================
// SYNC READS
// ============================================================
export function getTransactions() {
  return readFromStorage();
}

export function getTransaction(id) {
  return readFromStorage().find((t) => t.id === id) || null;
}

export function getTransactionByDealRoom(dealRoomId) {
  return readFromStorage().find((t) => t.dealRoomId === dealRoomId) || null;
}

export function getTransactionsForListing(listingId) {
  return readFromStorage().filter((t) => t.listingId === listingId);
}

// ============================================================
// HYDRATE FROM API
// ============================================================
export async function hydrateTransactionsFromApi() {
  try {
    const data = await transactionsApi.mine();
    const rawList = Array.isArray(data) ? data : data?.results || [];
    const normalized = rawList.map(normalizeTransactionFromApi).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[transactionLifecycleStore] hydrate failed:", err);
    return { source: "error", count: getTransactions().length };
  }
}

export async function fetchTransactionDetailAsync(id) {
  try {
    const raw = await transactionsApi.detail(id);
    const tx = normalizeTransactionFromApi(raw);
    if (tx) upsertLocal(tx);
    return { ok: true, transaction: tx };
  } catch (err) {
    console.warn("[transactionLifecycleStore] detail failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// HELPER — wrapper for API mutation with optimistic + rollback
// ============================================================
async function mutateWithRollback({ id, patch, apiCall }) {
  const previous = getTransactions();
  const current = previous.find((t) => t.id === id);
  if (!current) return { ok: false, error: new Error("Transaction not found") };

  // Optimistic update
  const optimistic = { ...current, ...patch, updatedAt: new Date().toISOString() };
  upsertLocal(optimistic);

  try {
    const raw = await apiCall();
    const serverTx = normalizeTransactionFromApi(raw);
    if (serverTx) upsertLocal(serverTx);
    return { ok: true, transaction: serverTx || optimistic };
  } catch (err) {
    // Rollback
    saveAll(previous);
    console.warn("[transactionLifecycleStore] mutation failed, rolled back:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// 1. CREATE — unda transaction kutoka deal room
// ============================================================
export async function createTransactionAsync(dealRoomId) {
  if (!dealRoomId) {
    return { ok: false, error: new Error("dealRoomId is required") };
  }
  try {
    const raw = await transactionsApi.create(dealRoomId);
    const tx = normalizeTransactionFromApi(raw);
    if (tx) upsertLocal(tx);
    return { ok: true, transaction: tx };
  } catch (err) {
    console.warn("[transactionLifecycleStore] create failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// 2a. CREATE RESERVATION
// Backend inaamua:
//   - Kama fee imezimwa → reservation ina-activate papo hapo
//     (status: RESERVED_PAID, fee: 0)
//   - Kama fee imewashwa → reservation ipo PENDING_PAYMENT
//     inasubiri payReservationAsync
// ============================================================
export async function createReservationAsync(id, durationHours = 48) {
  return mutateWithRollback({
    id,
    patch: {
      status: TX_STATUS.RESERVED,
      reservationHours: durationHours,
    },
    apiCall: () => transactionsApi.createReservation(id, durationHours),
  });
}

// ============================================================
// 2b. PAY RESERVATION
// Backend (reservation.py confirm_reservation_payment):
//   - payment_reference: "credits"   → consume credit, activate papo hapo
//   - payment_reference: <staff>     → staff manual confirmation
//   - hakuna ref + fee enabled       → FimiPay order (inaunda order)
//   - fee imezimwa                   → tayari ime-activate kwenye create
//
// FimiPay response (kutoka fimipay.py create_order):
//   data.order_id    — IPO (obligatory)
//   data.payment_url — URL ya kulipia (kama ipo)
//   data.status      — "PENDING", n.k.
//
// Backend inarudisha `data` moja kwa moja (sio { fimipay: data }).
// ============================================================
export async function payReservationAsync(
  id,
  { paymentReference = null, paymentMethod = "", phone = "" } = {}
) {
  if (!id) {
    return { ok: false, error: new Error("Transaction id is required") };
  }

  const isCredits = paymentReference === "credits";
  const isFimiPay = Boolean(paymentMethod && String(paymentMethod).trim());

  if (!isCredits && !isFimiPay) {
    return {
      ok: false,
      error: new Error(
        "Chagua njia ya malipo: credits au mobile (payment_method + phone)."
      ),
    };
  }

  const previous = getTransactions();
  const current = previous.find((t) => t.id === id);
  if (!current) return { ok: false, error: new Error("Transaction not found") };

  // Credits: tunaweza kuashiria optimistic "reserved_paid"
  // Cash (FimiPay): tunaacha status kama ilivyo — webhook itabadilisha
  if (isCredits) {
    const optimistic = {
      ...current,
      status: TX_STATUS.RESERVED_PAID,
      reservationPaidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    upsertLocal(optimistic);
  }

  try {
    const payload = {};
    if (paymentReference) payload.payment_reference = paymentReference;
    if (isFimiPay) {
      payload.payment_method = paymentMethod;
      payload.phone = phone;
    }
    const raw = await transactionsApi.payReservation(id, payload);

    // ── Kesi A: FimiPay order ─────────────────────────────
    // Backend inarudisha data moja kwa moja, ina `order_id`.
    const fimipayOrderId = raw?.order_id;
    const fimipayUrl =
      raw?.payment_url ||
      raw?.checkout_url ||
      raw?.redirect_url ||
      raw?.url ||
      null;

    if (fimipayOrderId && !isCredits) {
      return {
        ok: true,
        pending: true,
        fimipay: raw,
        orderId: fimipayOrderId,
        reference: raw.reference || raw.ref || fimipayOrderId,
        checkoutUrl: fimipayUrl,
        transaction: current,
      };
    }

    // ── Kesi B: Reservation imewashwa papo hapo (credits/free) ─
    const serverTx = normalizeTransactionFromApi(raw);
    if (serverTx) upsertLocal(serverTx);
    return {
      ok: true,
      pending: false,
      transaction: serverTx || current,
    };
  } catch (err) {
    if (isCredits) saveAll(previous);
    console.warn("[transactionLifecycleStore] payReservation failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// 2c. POLL RESERVATION STATUS (baada ya FimiPay)
// Webhook RSV inasasisha backend; frontend inaangalia kila baada ya X sekunde.
// ============================================================
export async function pollReservationStatusAsync(
  id,
  { attempts = 15, intervalMs = 4000 } = {}
) {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await fetchTransactionDetailAsync(id);
    if (res.ok && res.transaction) {
      const st = res.transaction.status;
      // Ime-activate
      if (
        st === TX_STATUS.RESERVED_PAID ||
        st === TX_STATUS.INSPECTING ||
        st === TX_STATUS.DECIDED_ACCEPT ||
        st === TX_STATUS.AWAITING_CONFIRMATION ||
        st === TX_STATUS.COMPLETED
      ) {
        return { ok: true, transaction: res.transaction };
      }
      // Imekwisha / imeghairiwa
      if (st === TX_STATUS.CANCELLED || st === TX_STATUS.EXPIRED) {
        return {
          ok: false,
          transaction: res.transaction,
          error: new Error("Reservation expired/cancelled"),
        };
      }
    }
  }
  return {
    ok: false,
    error: new Error("Reservation haijawashwa baada ya kusubiri"),
  };
}

// ============================================================
// 2d. EXPIRE RESERVATION
// ============================================================
export async function expireReservationAsync(id) {
  return mutateWithRollback({
    id,
    patch: { status: TX_STATUS.EXPIRED },
    apiCall: () => transactionsApi.expireReservation(id),
  });
}

// ============================================================
// 3. INSPECTION
// ============================================================
export async function startInspectionAsync(id, durationHours = 24) {
  return mutateWithRollback({
    id,
    patch: {
      status: TX_STATUS.INSPECTING,
      inspectionHours: durationHours,
      inspectionStartedAt: new Date().toISOString(),
    },
    apiCall: () => transactionsApi.startInspection(id, durationHours),
  });
}

export async function expireInspectionAsync(id) {
  return mutateWithRollback({
    id,
    patch: { status: TX_STATUS.EXPIRED },
    apiCall: () => transactionsApi.expireInspection(id),
  });
}

// ============================================================
// 4. DECISION
// ============================================================
// Backend API accepts these exact strings for `buyer_decision`:
//   READY_FOR_FINAL_PAYMENT | NOT_AS_DESCRIBED | REQUEST_NEGOTIATION | CANCEL_TRANSACTION
// Never send "ACCEPT"/"REJECT" — the backend rejects them with 400.
const DECISION_TO_API = {
  READY_FOR_FINAL_PAYMENT: "READY_FOR_FINAL_PAYMENT",
  NOT_AS_DESCRIBED: "NOT_AS_DESCRIBED",
  REQUEST_NEGOTIATION: "REQUEST_NEGOTIATION",
  CANCEL_TRANSACTION: "CANCEL_TRANSACTION",
  // Legacy aliases accepted from any old caller:
  ACCEPT: "READY_FOR_FINAL_PAYMENT",
  REJECT: "NOT_AS_DESCRIBED",
  CANCEL: "CANCEL_TRANSACTION",
};

export async function submitDecisionAsync(id, { buyerDecision, buyerDecisionNote = "" }) {
  if (!buyerDecision) {
    return { ok: false, error: new Error("buyerDecision is required") };
  }
  const apiValue = DECISION_TO_API[String(buyerDecision).toUpperCase()] || buyerDecision;

  // Local status mapping must align with the four real backend values.
  const newStatus =
    apiValue === "READY_FOR_FINAL_PAYMENT"
      ? TX_STATUS.DECIDED_ACCEPT
      : apiValue === "REQUEST_NEGOTIATION" || apiValue === "NOT_AS_DESCRIBED"
        ? TX_STATUS.DISPUTED
        : TX_STATUS.CANCELLED;

  return mutateWithRollback({
    id,
    patch: {
      status: newStatus,
      buyerDecision: apiValue,
      buyerDecisionNote,
    },
    apiCall: () =>
      transactionsApi.submitDecision(id, {
        buyer_decision: apiValue,
        buyer_decision_note: buyerDecisionNote,
      }),
  });
}

// ============================================================
// 5. FINAL PAYMENT
// ============================================================
export async function uploadFinalPaymentAsync(
  id,
  { finalPaymentProof, finalPaymentReference = "" }
) {
  if (!finalPaymentProof) {
    return { ok: false, error: new Error("finalPaymentProof is required") };
  }
  return mutateWithRollback({
    id,
    patch: {
      status: TX_STATUS.AWAITING_CONFIRMATION,
      finalPaymentReference,
      finalPaymentUploadedAt: new Date().toISOString(),
    },
    apiCall: () =>
      transactionsApi.uploadFinalPayment(id, {
        final_payment_proof: finalPaymentProof,
        final_payment_reference: finalPaymentReference,
      }),
  });
}

// ============================================================
// 6. CONFIRM PAYMENT (seller)
// ============================================================
export async function confirmPaymentAsync(id, confirmationNote = "") {
  return mutateWithRollback({
    id,
    patch: {
      status: TX_STATUS.COMPLETED,
      confirmationNote,
      confirmedAt: new Date().toISOString(),
    },
    apiCall: () => transactionsApi.confirmPayment(id, confirmationNote),
  });
}

// ============================================================
// 7. CANCEL
// ============================================================
export async function cancelTransactionAsync(id, cancellationReason = "") {
  return mutateWithRollback({
    id,
    patch: {
      status: TX_STATUS.CANCELLED,
      cancellationReason,
      cancelledAt: new Date().toISOString(),
    },
    apiCall: () => transactionsApi.cancel(id, cancellationReason),
  });
}

// ============================================================
// 8. RESOLVE DISPUTE (admin)
// ============================================================
export async function resolveDisputeAsync(id, { resolution, note = "" }) {
  if (!resolution) {
    return { ok: false, error: new Error("resolution is required") };
  }
  const lower = String(resolution).toLowerCase();
  const newStatus =
    lower.includes("refund") || lower.includes("cancel")
      ? TX_STATUS.CANCELLED
      : lower.includes("continue")
        ? TX_STATUS.INSPECTING
        : TX_STATUS.COMPLETED;

  return mutateWithRollback({
    id,
    patch: {
      status: newStatus,
      resolution,
      resolutionNote: note,
      resolvedAt: new Date().toISOString(),
    },
    apiCall: () => transactionsApi.resolveDispute(id, { resolution, note }),
  });
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

export function useTransaction(id) {
  const list = useTransactions();
  if (!id) return null;
  return list.find((t) => t.id === id) || null;
}

export function useTransactionsByStatus(status) {
  const list = useTransactions();
  if (!status || status === "all") return list;
  return list.filter((t) => t.status === status);
}

export function useTransactionsForListing(listingId) {
  const list = useTransactions();
  if (!listingId) return [];
  return list.filter((t) => t.listingId === listingId);
}

export function useTransactionsCount() {
  return useTransactions().length;
}

export function useActiveTransactionsCount() {
  const ACTIVE = [
    TX_STATUS.PENDING,
    TX_STATUS.RESERVED,
    TX_STATUS.RESERVED_PAID,
    TX_STATUS.INSPECTING,
    TX_STATUS.DECIDED_ACCEPT,
    TX_STATUS.AWAITING_CONFIRMATION,
    TX_STATUS.DISPUTED,
  ];
  return useTransactions().filter((t) => ACTIVE.includes(t.status)).length;
}

export function useDealTransactions() {
  return useTransactions();
}

// ============================================================
// DEAL ROOM DETAIL — fetch messages, offers, payment proof
// Inatumika na admin (DealsSection) kuona kilichojiri.
// ============================================================
import { dealsApi } from "../api/deals.js";

export async function fetchDealRoomDetailAsync(dealRoomId) {
  if (!dealRoomId) {
    return { ok: false, error: new Error("dealRoomId is required") };
  }

  try {
    const data = await dealsApi.detail(dealRoomId);

    return {
      ok: true,
      dealRoom: data,
      messages: data?.messages || [],
      paymentProof: data?.paymentProof || null,
      reservation: {
        fee: data?.reservationFee,
        hours: data?.reservationHours,
        method: data?.reservationMethod,
        expiresAt: data?.reservationExpiresAt,
      },
      disputeNote: data?.disputeNote || "",
    };
  } catch (err) {
    console.warn("[transactionLifecycleStore] fetchDealRoomDetail failed:", err);
    return {
      ok: false,
      error: err,
      messages: [],
      paymentProof: null,
    };
  }
}
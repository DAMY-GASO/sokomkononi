// ============================================================
// dealsStore.js — Backend: /api/deals/
// ============================================================
import { useEffect, useState } from "react";
import { dealsApi } from "../api/deals.js";
import { transactionsApi } from "../api/transactions.js";
import { getTransactionByDealRoom } from "./transactionLifecycleStore.js";

const STORAGE_KEY = "sokomkononi_deals_v1";
const UPDATE_EVENT = "sokomkononi:deals-updated";

export const SEED_DEALS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_DEALS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_DEALS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_DEALS;
  } catch {
    return SEED_DEALS;
  }
}
function saveDeals(deals) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}
const sameId = (a, b) => String(a) === String(b);

export function getDeals() {
  return readFromStorage();
}
export function updateDeal(id, patch) {
  const current = getDeals();
  const next = current.map((d) => (sameId(d.id, id) ? { ...d, ...patch } : d));
  saveDeals(next);
  return next;
}
export function getDeal(id) {
  return getDeals().find((d) => sameId(d.id, id)) || null;
}
export function getDealByListing(listingId) {
  return getDeals().find((d) => sameId(d.listingId, listingId)) || null;
}

function normalizeDealFromApi(raw, currentUserId) {
  if (!raw) return null;
  const buyerId = raw.buyer?.id ?? raw.buyer_id ?? null;
  const isBuyer = sameId(buyerId, currentUserId);
  const counterparty = isBuyer ? raw.seller : raw.buyer;
  const buyer = raw.buyer || {};
  const seller = raw.seller || {};
  const listing = raw.listing || {};
  const dealRoom = raw.deal_room || {};

  return {
    id: raw.id,
    dealRoomId: dealRoom.id ?? raw.deal_room ?? null,
    transactionId: raw.transaction?.id ?? raw.transaction ?? null,
    listingId: listing.id ?? raw.listing ?? null,
    listingTitle: listing.title || raw.listing_title || "",
    category: listing.category_name || null,
    location: listing.location || "",
    askingPrice: Number(listing.price) || 0,
    currentOffer: Number(raw.agreed_price) || Number(listing.price) || 0,
    counterpartyName: counterparty?.name || "",
    buyerId: buyer.id ?? buyerId,
    buyerName: buyer.name || raw.buyer_name || "",
    sellerId: seller.id ?? null,
    sellerName: seller.name || raw.seller_name || "",
    status: (raw.status || "OPEN").toLowerCase(),
    agreedPrice: raw.agreed_price != null ? Number(raw.agreed_price) : null,
    agreedAt: raw.agreed_at,

    // ── Reservation ────────────────────────────────────────
    reservationHours: raw.reservation_hours ?? null,
    reservationFee: Number(raw.reservation_fee) || 0,
    reservationMethod: raw.reservation_method || "",
    reservationPaidAt: raw.reservation_paid_at || null,
    reservationExpiresAt:
      raw.reservation_expires_at || raw.reserved_until || null,

    // ── Inspection / decision ──────────────────────────────
    inspectionHours: raw.inspection_hours ?? null,
    inspectionStartedAt: raw.inspection_started_at || null,
    inspectionExpiresAt: raw.inspection_expires_at || null,
    buyerDecision: raw.buyer_decision || null,
    buyerDecisionNote: raw.buyer_decision_note || "",

    // ── Payment proof ──────────────────────────────────────
    paymentProof: raw.payment_proof
      ? {
          method: raw.payment_proof.method || "",
          reference: raw.payment_proof.reference || "",
          dataUrl:
            raw.payment_proof.data_url ||
            raw.payment_proof.proof ||
            raw.payment_proof.file ||
            null,
          submittedAt:
            raw.payment_proof.submitted_at ||
            raw.payment_proof.created_at ||
            null,
        }
      : null,
    finalPaymentReference: raw.final_payment_reference || "",

    // ── Dispute / cancel notes ─────────────────────────────
    disputeNote:
      raw.dispute_note ||
      raw.buyer_decision_note ||
      raw.dispute_reason ||
      "",
    cancelNote: raw.cancellation_reason || raw.cancel_note || "",

    createdAt: raw.created_at,
    updatedAt: raw.updated_at,

    messages: [
      // Real chat messages (if the backend ever returns them).
      ...((raw.messages || []).map((m) => ({
        id: m.id,
        sender: sameId(m.sender_id ?? m.sender, currentUserId) ? "me" : "them",
        text: m.text || "",
        offerAmount: null,
        at: m.created_at,
        status: m.status || null,
      }))),
      // Offers appear as their own bubbles.
      ...((raw.offers || []).map((o) => ({
        id: o.id,
        sender: sameId(o.offered_by, currentUserId) ? "me" : "them",
        text: o.message || "",
        offerAmount: Number(o.amount) || null,
        at: o.created_at,
        status: o.status,
      }))),
    ].sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0)),
  };
}

export async function hydrateDealsFromApi(currentUserId) {
  try {
    const data = await dealsApi.list({ page_size: 100 });
    const rawList = Array.isArray(data) ? data : data?.results || [];
    const normalized = rawList
      .map((raw) => normalizeDealFromApi(raw, currentUserId))
      .filter(Boolean);
    saveDeals(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[dealsStore] hydrate failed:", err);
    return { source: "error", count: getDeals().length };
  }
}

export async function getOrCreateDealAsync({
  listingId,
  currentUserId,
  sellerName,
  buyerName,
  initialMessage,
}) {
  try {
    const raw = await dealsApi.create(listingId);
    const deal = normalizeDealFromApi(raw, currentUserId);
    if (!deal) return { ok: false, error: new Error("Invalid deal response") };

    const current = getDeals();
    saveDeals([deal, ...current.filter((d) => !sameId(d.id, deal.id))]);

    if (initialMessage) {
      try {
        await dealsApi.sendOffer(deal.id, {
          amount: deal.askingPrice,
          message: initialMessage,
        });
      } catch (offerErr) {
        console.warn("[dealsStore] initial offer failed:", offerErr);
        return {
          ok: true,
          deal,
          warning: "initial_offer_failed",
          warningError: offerErr,
        };
      }
    }
    return { ok: true, deal };
  } catch (err) {
    console.warn("[dealsStore] createDeal failed:", err);
    return { ok: false, error: err };
  }
}

export async function sendOfferAsync(dealId, amount, message = "", respondedTo = null) {
  const previous = getDeals();
  const deal = previous.find((d) => sameId(d.id, dealId));
  if (!deal) return { ok: false, error: new Error("Deal haipo") };

  const tempMsgId = `temp_${Date.now()}`;
  const optimisticDeal = {
    ...deal,
    currentOffer: amount,
    messages: [
      ...(deal.messages || []),
      {
        id: tempMsgId,
        sender: "me",
        text: message,
        offerAmount: amount,
        at: new Date().toISOString(),
        status: "pending",
      },
    ],
  };
  saveDeals(previous.map((d) => (sameId(d.id, dealId) ? optimisticDeal : d)));

  try {
    const raw = await dealsApi.sendOffer(dealId, {
      amount,
      message,
      responded_to_id: respondedTo,
    });
    const current = getDeals();
    const target = current.find((d) => sameId(d.id, dealId));
    if (target && raw) {
      const realMsg = {
        id: raw.id,
        sender: "me",
        text: raw.message || message,
        offerAmount: Number(raw.amount) || amount,
        at: raw.created_at || new Date().toISOString(),
        status: raw.status || "pending",
      };
      saveDeals(
        current.map((d) =>
          sameId(d.id, dealId)
            ? {
                ...d,
                messages: (d.messages || []).map((m) =>
                  m.id === tempMsgId ? realMsg : m
                ),
              }
            : d
        )
      );
    }
    return { ok: true, offer: raw };
  } catch (err) {
    saveDeals(previous);
    console.warn("[dealsStore] sendOffer failed:", err);
    return { ok: false, error: err };
  }
}

export async function acceptOfferAsync(dealId, offerId) {
  const previous = getDeals();
  const deal = previous.find((d) => sameId(d.id, dealId));
  if (!deal) return { ok: false, error: new Error("Deal haipo") };

  saveDeals(
    previous.map((d) =>
      sameId(d.id, dealId)
        ? { ...d, status: "accepted", agreedAt: new Date().toISOString() }
        : d
    )
  );

  try {
    const raw = await dealsApi.acceptOffer(dealId, offerId);
    return { ok: true, offer: raw };
  } catch (err) {
    saveDeals(previous);
    return { ok: false, error: err };
  }
}

export async function cancelDealAsync(dealId, reason = "") {
  const previous = getDeals();
  const deal = previous.find((d) => sameId(d.id, dealId));
  if (!deal) return { ok: false, error: new Error("Deal haipo") };

  saveDeals(
    previous.map((d) =>
      sameId(d.id, dealId)
        ? { ...d, status: "cancelled", cancelReason: reason }
        : d
    )
  );

  try {
    await dealsApi.cancel(dealId, reason);
    return { ok: true };
  } catch (err) {
    saveDeals(previous);
    return { ok: false, error: err };
  }
}

export async function resolveDisputeAsync(
  dealId,
  { resolution, note = "", transactionId = null }
) {
  if (!resolution) {
    return { ok: false, error: new Error("resolution inahitajika") };
  }
  const previous = getDeals();
  const deal = previous.find((d) => sameId(d.id, dealId));
  if (!deal) return { ok: false, error: new Error("Deal haipo") };

  let txId = transactionId;
  if (!txId) {
    const tx =
      getTransactionByDealRoom(deal.dealRoomId) ||
      getTransactionByDealRoom(deal.id);
    txId = tx?.id ?? null;
  }

  if (!txId) {
    return {
      ok: false,
      error: new Error(
        "Transaction haijatengenezwa bado kwa deal hii. Mwambie buyer/muuzaji aanzishe transaction kwanza."
      ),
    };
  }

  saveDeals(
    previous.map((d) =>
      sameId(d.id, dealId)
        ? {
            ...d,
            disputeResolvedAt: new Date().toISOString(),
            disputeResolutionAction: resolution,
            adminNote: note,
          }
        : d
    )
  );

  try {
    await transactionsApi.resolveDispute(txId, { resolution, note });
    return { ok: true };
  } catch (err) {
    saveDeals(previous);
    return { ok: false, error: err };
  }
}

export function resolveDispute(id, { action, adminNote = "" } = {}) {
  updateDeal(id, {
    disputeResolvedAt: new Date().toISOString(),
    disputeResolutionAction: action,
    adminNote,
  });
  console.warn("[dealsStore] resolveDispute (sync) deprecated — local only");
  return getDeals();
}

export function getOrCreateDeal(payload) {
  const current = getDeals();
  const existing = current.find(
    (d) =>
      (payload?.listingId && sameId(d.listingId, payload.listingId)) ||
      (payload?.listingTitle && d.listingTitle === payload.listingTitle)
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const deal = {
    id: `deal_${Date.now()}`,
    listingId: payload?.listingId || null,
    listingTitle: payload?.listingTitle || "",
    category: payload?.category || null,
    location: payload?.location || null,
    askingPrice: payload?.askingPrice ?? null,
    currentOffer: payload?.askingPrice ?? null,
    counterpartyName: payload?.sellerName || "",
    buyerName: payload?.buyerName || "",
    sellerName: payload?.sellerName || "",
    status: "negotiating",
    createdAt: now,
    messages: [],
  };
  saveDeals([...current, deal]);
  return deal;
}

export function checkReservationReminders() {
  return getDeals();
}

export function useDeals(currentUserId) {
  const [deals, setDeals] = useState(() => getDeals());
  useEffect(() => {
    hydrateDealsFromApi(currentUserId);
    const sync = () => setDeals(getDeals());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, [currentUserId]);
  return deals;
}

export function useDeal(id) {
  const deals = useDeals();
  if (!id) return null;
  return deals.find((d) => sameId(d.id, id)) || null;
}

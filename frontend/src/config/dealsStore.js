// ============================================================
// dealsStore.js — Backend: /api/deals/
//
// CHAGUO A: buyer + seller wote wanaweza kutuma offers na kukubali.
// Ulinzi wa store unalingana na backend:
//   - NegotiationOfferCreateSerializer (buyer + seller)
//   - DealRoomAcceptOfferSerializer (yeyote aliye upande wa pili)
// ============================================================
import { useEffect, useState, useMemo } from "react";
import { dealsApi } from "../api/deals.js";
import { transactionsApi } from "../api/transactions.js";
import { getTransactionByDealRoom } from "./transactionLifecycleStore.js";
import { getListings, useListings } from "./listingsStore.js";
import { getUser as getUserById } from "./usersStore.js";

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

// Backend statuses → frontend slugs.
const API_TO_FRONTEND_DEAL_STATUS = {
  OPEN: "negotiating",
  PENDING: "negotiating",
  NEW: "negotiating",
  NEGOTIATING: "negotiating",
  OFFER_SENT: "offer_sent",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  REJECTED: "declined",
  RESERVED: "reserved",
  RESERVATION_PAID: "reserved",
  RESERVATION_PENDING: "reserved",
  RESERVATION_CONFIRMED: "reserved",
  INSPECTION: "inspecting",
  INSPECTING: "inspecting",
  READY_FOR_FINAL_PAYMENT: "awaiting_final_payment",
  AWAITING_FINAL_PAYMENT: "awaiting_final_payment",
  PAYMENT_PROOF_SUBMITTED: "payment_proof_submitted",
  FINAL_PAYMENT_SUBMITTED: "payment_proof_submitted",
  COMPLETED: "completed",
  DONE: "completed",
  DISPUTED: "disputed",
  DISPUTE: "disputed",
  CANCELLED: "cancelled",
  CANCELED: "cancelled",
  EXPIRED: "cancelled",
};

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

// ── Price resolution ────────────────────────────────────────
function resolveAskingPrice(raw, listing, listingId) {
  const candidates = [
    listing?.price,
    raw?.listing?.price,
    raw?.asking_price,
    raw?.price,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const id = listing?.id ?? raw?.listing_id ?? raw?.listing ?? listingId;
  if (id != null) {
    try {
      const cached = getListings().find((l) => String(l.id) === String(id));
      const n = Number(cached?.price);
      if (Number.isFinite(n) && n > 0) return n;
    } catch {
      /* noop */
    }
  }
  return 0;
}

function resolveCurrentOffer(raw, offers) {
  const arr = Array.isArray(offers) ? offers : raw?.offers || [];
  if (arr.length > 0) {
    const sorted = [...arr].sort(
      (a, b) =>
        new Date(b.created_at || b.createdAt || 0) -
        new Date(a.created_at || a.createdAt || 0)
    );
    const latest = sorted[0];
    const n = Number(latest?.amount ?? latest?.offer_amount ?? latest?.value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const candidates = [
    raw?.latest_offer?.amount,
    raw?.latest_offer_amount,
    raw?.best_offer?.amount,
    raw?.agreed_price,
    raw?.current_offer,
    raw?.offer_amount,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function resolveMeta(raw, listing, listingId) {
  let category =
    listing?.category_name ||
    listing?.category?.name ||
    listing?.category?.slug ||
    (typeof listing?.category === "string" ? listing.category : null) ||
    raw?.category_name ||
    raw?.category?.slug ||
    raw?.category ||
    null;
  let location =
    listing?.location || listing?.region || listing?.address ||
    raw?.location || raw?.listing_location || "";
  let listingTitle =
    listing?.title || listing?.name ||
    raw?.listing_title || raw?.listing_name || "";
  if (!category || !location || !listingTitle) {
    const id =
      (listing && typeof listing === "object" && listing.id) ??
      raw?.listing_id ??
      (typeof raw?.listing === "object" ? raw.listing?.id : raw?.listing) ??
      listingId;
    if (id != null) {
      try {
        const cached = getListings().find((l) => String(l.id) === String(id));
        if (cached) {
          category = category || cached.category || null;
          location = location || cached.location || cached.region || "";
          listingTitle = listingTitle || cached.title || cached.name || "";
        }
      } catch { /* noop */ }
    }
  }
  return { category, location, listingTitle };
}

function _asObject(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
function _asId(v) {
  if (v == null) return null;
  if (typeof v === "object") return v.id ?? v.pk ?? null;
  return v;
}
function _nameOf(...objs) {
  for (const o of objs) {
    if (!o || typeof o !== "object") continue;
    const n = o.name || o.full_name || o.username || o.display_name;
    if (n) return n;
  }
  return "";
}

function normalizeDealFromApi(raw, currentUserId) {
  if (!raw) return null;

  const buyer = _asObject(raw.buyer);
  const seller = _asObject(raw.seller);
  const listing = _asObject(raw.listing);
  const dealRoom = _asObject(raw.deal_room);
  const transaction = _asObject(raw.transaction);

  const buyerId = buyer.id ?? raw.buyer_id ?? _asId(raw.buyer);
  const sellerId = seller.id ?? raw.seller_id ?? _asId(raw.seller);
  const listingId = listing.id ?? raw.listing_id ?? _asId(raw.listing);

  const isBuyer = sameId(buyerId, currentUserId);
  const counterparty = isBuyer ? seller : buyer;

  let buyerName =
    _nameOf(buyer) || raw.buyer_name || raw.buyer_display_name || "";
  let sellerName =
    _nameOf(seller) || raw.seller_name || raw.seller_display_name || "";

  if (!buyerName && buyerId != null) {
    const u = getUserById(buyerId);
    if (u?.name) buyerName = u.name;
  }
  if (!sellerName && sellerId != null) {
    const u = getUserById(sellerId);
    if (u?.name) sellerName = u.name;
  }

  const statusRaw = String(raw.status || "OPEN").toUpperCase();
  const status =
    API_TO_FRONTEND_DEAL_STATUS[statusRaw] || statusRaw.toLowerCase();

  return {
    id: raw.id,
    dealRoomId: dealRoom.id ?? raw.deal_room ?? null,
    transactionId: transaction.id ?? raw.transaction ?? null,
    listingId,
    ...resolveMeta(raw, listing, listingId ?? raw?.listing_id ?? raw?.listing),
    askingPrice: resolveAskingPrice(
      raw,
      listing,
      listingId ?? raw?.listing_id ?? raw?.listing
    ),
    currentOffer: resolveCurrentOffer(raw, raw?.offers),
    counterpartyName:
      counterparty?.name || counterparty?.full_name || "",
    buyerId,
    buyerName,
    sellerId,
    sellerName,
    sellerPhone:
      seller.phone ?? seller.phone_number ??
      raw.seller_phone ?? raw.seller_contact?.phone ?? null,
    status,
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
      // Real chat messages (kama backend itazirudisha).
      ...(raw.messages || []).map((m) => ({
        id: m.id,
        sender: sameId(m.sender_id ?? m.sender, currentUserId) ? "me" : "them",
        text: m.text || "",
        offerAmount: null,
        at: m.created_at,
        status: m.status || null,
      })),
      // Offers zinaonekana kama bubbles zao wenyewe.
      ...(raw.offers || []).map((o) => ({
        id: o.id,
        sender: sameId(o.offered_by, currentUserId) ? "me" : "them",
        text: o.message || "",
        offerAmount: Number(o.amount) || null,
        at: o.created_at,
        status: o.status,
      })),
    ].sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0)),
  };
}

let _dealsUserId = null;

export async function hydrateDealsFromApi(currentUserId) {
  _dealsUserId = currentUserId ?? _dealsUserId;
  try {
    const data = await dealsApi.list({ page_size: 200 });
    const rawList = Array.isArray(data) ? data : data?.results || [];
    const normalized = rawList
      .map((raw) => normalizeDealFromApi(raw, _dealsUserId))
      .filter(Boolean);
    saveDeals(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[dealsStore] hydrate failed:", err);
    return { source: "error", count: getDeals().length };
  }
}

export async function fetchDealDetailAsync(dealId) {
  if (!dealId) return { ok: false, error: new Error("dealId is required") };
  try {
    const raw = await dealsApi.detail(dealId);
    const deal = normalizeDealFromApi(raw, _dealsUserId);
    if (!deal) return { ok: false, error: new Error("Invalid deal response") };
    const current = getDeals();
    const existing = current.find((d) => sameId(d.id, dealId));
    const merged = existing
      ? {
          ...existing,
          ...deal,
          messages:
            (deal.messages?.length || 0) >= (existing.messages?.length || 0)
              ? deal.messages
              : existing.messages,
        }
      : deal;
    saveDeals(
      existing
        ? current.map((d) => (sameId(d.id, dealId) ? merged : d))
        : [deal, ...current]
    );
    return { ok: true, deal: merged };
  } catch (err) {
    console.warn("[dealsStore] fetchDealDetail failed:", err);
    return { ok: false, error: err };
  }
}

export async function getOrCreateDealAsync({
  listingId,
  currentUserId,
  sellerName,
  buyerName,
  initialMessage,
}) {
  // Mmiliki hawezi kuanzisha deal kwenye tangazo lake mwenyewe.
  try {
    const own = getListings().find((l) => sameId(l.id, listingId));
    if (
      own &&
      currentUserId != null &&
      own.sellerId != null &&
      sameId(own.sellerId, currentUserId)
    ) {
      return {
        ok: false,
        error: new Error("Huwezi kuanzisha deal kwenye tangazo lako mwenyewe."),
      };
    }
  } catch {
    /* noop */
  }

  try {
    const raw = await dealsApi.create(listingId);
    const deal = normalizeDealFromApi(raw, currentUserId);
    if (!deal) return { ok: false, error: new Error("Invalid deal response") };

    const current = getDeals();
    saveDeals([deal, ...current.filter((d) => !sameId(d.id, deal.id))]);

    if (initialMessage) {
      try {
        // Send as a plain chat message — do NOT auto-create an offer at
        // the asking price. That was a bug: every "ask a question" turned
        // into a full-price offer.
        await dealsApi.sendDealMessage(deal.id, { text: initialMessage });
      } catch (msgErr) {
        console.warn("[dealsStore] initial message failed:", msgErr);
        return {
          ok: true,
          deal,
          warning: "initial_message_failed",
          warningError: msgErr,
        };
      }
    }
    return { ok: true, deal };
  } catch (err) {
    console.warn("[dealsStore] createDeal failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// SEND OFFER — CHAGUO A
// Buyer NA seller wote wanaweza kutuma offers (counter-offers).
// Ulinzi: mtumiaji LAZIMA awe mshiriki wa deal hii.
// ============================================================
export async function sendOfferAsync(
  dealId,
  amount,
  message = "",
  respondedTo = null,
  currentUserId = null
) {
  const previous = getDeals();
  const deal = previous.find((d) => sameId(d.id, dealId));
  if (!deal) return { ok: false, error: new Error("Deal haipo") };

  // Ulinzi: mtumiaji lazima awe buyer au seller wa deal hii.
  if (currentUserId != null) {
    const isBuyer =
      deal.buyerId != null && sameId(deal.buyerId, currentUserId);
    const isSeller =
      deal.sellerId != null && sameId(deal.sellerId, currentUserId);
    if (!isBuyer && !isSeller) {
      return {
        ok: false,
        error: new Error("Huruhusiwi kutuma ofa kwenye Deal Room hii."),
      };
    }
  }

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

// ============================================================
// ACCEPT OFFER — CHAGUO A
// Yeyote aliye UPANDE WA PILI wa offer ya mwisho anaweza kukubali.
//   - Mnunuzi anatuma offer → muuzaji anaweza kukubali
//   - Muuzaji anatuma counter → mnunuzi anaweza kukubali
// Ulinzi: mtumiaji LAZIMA awe mshiriki, na ASIWE mwenyekiti wa offer.
// ============================================================
export async function acceptOfferAsync(dealId, offerId, currentUserId = null) {
  const previous = getDeals();
  const deal = previous.find((d) => sameId(d.id, dealId));
  if (!deal) return { ok: false, error: new Error("Deal haipo") };

  if (currentUserId != null) {
    // 1. Lazima awe mshiriki wa deal
    const isBuyer =
      deal.buyerId != null && sameId(deal.buyerId, currentUserId);
    const isSeller =
      deal.sellerId != null && sameId(deal.sellerId, currentUserId);
    if (!isBuyer && !isSeller) {
      return {
        ok: false,
        error: new Error("Huruhusiwi kukubali ofa kwenye Deal Room hii."),
      };
    }

    // 2. Hauwezi kukubali ofa yako mwenyewe
    const targetOffer = (deal.messages || []).find(
      (m) => m.offerAmount && sameId(m.id, offerId)
    );
    if (targetOffer && targetOffer.sender === "me") {
      return {
        ok: false,
        error: new Error("Huwezi kukubali ofa yako mwenyewe."),
      };
    }
  }

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

export function resolveDispute(_id, _opts = {}) {
  // Removed: this used to write to localStorage without calling the API,
  // making disputes look resolved when they were not. Use
  // `resolveDisputeAsync` instead.
  throw new Error(
    "resolveDispute() is deprecated. Use resolveDisputeAsync() instead."
  );
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
  const listings = useListings();

  useEffect(() => {
    if (currentUserId == null) return;
    hydrateDealsFromApi(currentUserId);
    const sync = () => setDeals(getDeals());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, [currentUserId]);

  return useMemo(() => {
    return deals.map((d) => {
      const needsPrice = !d.askingPrice || d.askingPrice <= 0;
      const needsMeta = !d.category || !d.location || !d.listingTitle;
      if (!needsPrice && !needsMeta) return d;

      const cached = listings.find(
        (l) => String(l.id) === String(d.listingId)
      );
      if (!cached) return d;

      return {
        ...d,
        askingPrice: needsPrice ? Number(cached.price) || 0 : d.askingPrice,
        category: d.category || cached.category || null,
        location: d.location || cached.location || "",
        listingTitle: d.listingTitle || cached.title || "",
      };
    });
  }, [deals, listings]);
}

export function useDeal(id) {
  const deals = useDeals();
  if (!id) return null;
  return deals.find((d) => sameId(d.id, id)) || null;
}
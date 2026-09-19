// ============================================================
// dealsStore.js
// Backend: /api/deals/
// ============================================================

import { useEffect, useState } from "react";
import { dealsApi } from "../api/deals.js";
import { transactionsApi } from "../api/transactions.js";

const STORAGE_KEY = "sokomkononi_deals_v1";
const UPDATE_EVENT = "sokomkononi:deals-updated";

export const SEED_DEALS = [];

// ---------- STORAGE ----------
function readFromStorage() {
  if (typeof window === "undefined") return SEED_DEALS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_DEALS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_DEALS;
    return parsed;
  } catch {
    return SEED_DEALS;
  }
}

export function getDeals() {
  return readFromStorage();
}

export function saveDeals(deals) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function updateDeal(id, patch) {
  const current = getDeals();
  const next = current.map((d) => (d.id === id ? { ...d, ...patch } : d));
  saveDeals(next);
  return next;
}

export function getDeal(id) {
  return getDeals().find((d) => d.id === id) || null;
}

export function getDealByListing(listingId) {
  return getDeals().find((d) => d.listingId === listingId) || null;
}

// ---------- NORMALIZER ----------
function normalizeDealFromApi(raw, currentUserId) {
  if (!raw) return null;
  const isBuyer = raw.buyer?.id === currentUserId;
  const counterparty = isBuyer ? raw.seller : raw.buyer;
  const buyer = raw.buyer || {};
  const seller = raw.seller || {};
  const listing = raw.listing || {};

  return {
    id: raw.id,
    listingId: listing.id,
    listingTitle: listing.title || "",
    category: listing.category_name || null,
    location: listing.location || "",
    askingPrice: Number(listing.price) || 0,
    currentOffer: Number(raw.agreed_price) || Number(listing.price) || 0,
    counterpartyName: counterparty?.name || "",
    buyerName: buyer.name || "",
    sellerName: seller.name || "",
    status: (raw.status || "OPEN").toLowerCase(),
    agreedPrice: raw.agreed_price != null ? Number(raw.agreed_price) : null,
    agreedAt: raw.agreed_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    messages: (raw.offers || []).map((o) => ({
      id: o.id,
      sender: o.offered_by === currentUserId ? "me" : "them",
      text: o.message || "",
      offerAmount: Number(o.amount) || null,
      at: o.created_at,
      status: o.status,
    })),
  };
}

// ---------- HYDRATE ----------
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

// ---------- ASYNC ACTIONS ----------
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
    saveDeals([deal, ...current.filter((d) => d.id !== deal.id)]);

    // Tuma offer ya kwanza kama initialMessage imetolewa
    if (initialMessage) {
      try {
        await dealsApi.sendOffer(deal.id, {
          amount: deal.askingPrice,
          message: initialMessage,
        });
      } catch (offerErr) {
        console.warn("[dealsStore] initial offer failed (deal still created):", offerErr);
        // Hii si fatal — deal imeundwa. Tunarudisha ok: true lakini na warning.
        return { ok: true, deal, warning: "initial_offer_failed", warningError: offerErr };
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
  const deal = previous.find((d) => d.id === dealId);
  if (!deal) return { ok: false, error: new Error("Deal haipo") };

  // Optimistic: ongeza message kwenye thread
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
  saveDeals(previous.map((d) => (d.id === dealId ? optimisticDeal : d)));

  try {
    const raw = await dealsApi.sendOffer(dealId, {
      amount,
      message,
      responded_to: respondedTo,
    });

    // Badilisha temp na offer halisi kutoka backend
    const current = getDeals();
    const target = current.find((d) => d.id === dealId);
    if (target && raw) {
      const realMsg = {
        id: raw.id,
        sender: "me",
        text: raw.message || message,
        offerAmount: Number(raw.amount) || amount,
        at: raw.created_at || new Date().toISOString(),
        status: raw.status || "pending",
      };
      saveDeals(current.map((d) =>
        d.id === dealId
          ? {
              ...d,
              messages: (d.messages || []).map((m) => (m.id === tempMsgId ? realMsg : m)),
            }
          : d
      ));
    }
    return { ok: true, offer: raw };
  } catch (err) {
    saveDeals(previous); // Rollback
    console.warn("[dealsStore] sendOffer failed:", err);
    return { ok: false, error: err };
  }
}

export async function acceptOfferAsync(dealId, offerId) {
  const previous = getDeals();
  const deal = previous.find((d) => d.id === dealId);
  if (!deal) return { ok: false, error: new Error("Deal haipo") };

  // Optimistic
  saveDeals(previous.map((d) =>
    d.id === dealId ? { ...d, status: "accepted", agreedAt: new Date().toISOString() } : d
  ));

  try {
    const raw = await dealsApi.acceptOffer(dealId, offerId);
    const current = getDeals();
    const target = current.find((d) => d.id === dealId);
    if (target && raw) {
      const normalized = normalizeDealFromApi(raw, target.messages?.[0]?.sender === "me" ? null : null);
      if (normalized) {
        saveDeals(current.map((d) => (d.id === dealId ? { ...d, ...normalized } : d)));
      }
    }
    return { ok: true, offer: raw };
  } catch (err) {
    saveDeals(previous); // Rollback
    console.warn("[dealsStore] acceptOffer failed:", err);
    return { ok: false, error: err };
  }
}

export async function cancelDealAsync(dealId, reason = "") {
  const previous = getDeals();
  const deal = previous.find((d) => d.id === dealId);
  if (!deal) return { ok: false, error: new Error("Deal haipo") };

  saveDeals(previous.map((d) =>
    d.id === dealId ? { ...d, status: "cancelled", cancelReason: reason } : d
  ));

  try {
    await dealsApi.cancel(dealId, reason);
    return { ok: true };
  } catch (err) {
    saveDeals(previous); // Rollback
    console.warn("[dealsStore] cancel failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// RESOLVE DISPUTE — sasa inatumia transactionsApi
// ============================================================
/**
 * Admin ana-resolve dispute kwa deal.
 * Backend endpoint ni /api/transactions/{id}/resolve-dispute/
 * Kwa hiyo tunahitaji `transactionId` — sio `dealId`.
 *
 * Kama transaction haijatengenezwa bado, function inarudisha error.
 */
export async function resolveDisputeAsync(dealId, { resolution, note = "", transactionId = null }) {
  if (!resolution) {
    return { ok: false, error: new Error("resolution inahitajika") };
  }

  // Kama hukupewa transactionId, jaribu kuipata kutoka local transactions
  let txId = transactionId;

  const previous = getDeals();
  const deal = previous.find((d) => d.id === dealId);
  if (!deal) return { ok: false, error: new Error("Deal haipo") };

  // Optimistic — sasisha local deal
  saveDeals(previous.map((d) =>
    d.id === dealId
      ? {
          ...d,
          disputeResolvedAt: new Date().toISOString(),
          disputeResolutionAction: resolution,
          adminNote: note,
        }
      : d
  ));

  if (!txId) {
    console.warn("[dealsStore] resolveDispute: hakuna transactionId — local only");
    return {
      ok: true,
      warning: "no_transaction_id",
      message: "Imesasishwa local pekee. Tafadhali toa transactionId ili ku-sync backend.",
    };
  }

  try {
    await transactionsApi.resolveDispute(txId, { resolution, note });
    return { ok: true };
  } catch (err) {
    saveDeals(previous); // Rollback
    console.warn("[dealsStore] resolveDispute failed:", err);
    return { ok: false, error: err };
  }
}

/** @deprecated Use resolveDisputeAsync */
export function resolveDispute(id, { action, adminNote = "" } = {}) {
  updateDeal(id, {
    disputeResolvedAt: new Date().toISOString(),
    disputeResolutionAction: action,
    adminNote,
  });
  console.warn("[dealsStore] resolveDispute (sync) ni deprecated — local only");
  return getDeals();
}

// ---------- LEGACY ----------
/** @deprecated Use getOrCreateDealAsync */
export function getOrCreateDeal(payload) {
  const current = getDeals();
  const existing = current.find(
    (d) =>
      (payload?.listingId && d.listingId === payload.listingId) ||
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

  if (payload?.listingId) {
    dealsApi.create(payload.listingId).catch((err) =>
      console.warn("[dealsStore] create silent fail:", err)
    );
  }

  return deal;
}

export function checkReservationReminders() {
  return getDeals();
}

// ---------- HOOK ----------
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
  return deals.find((d) => d.id === id) || null;
}

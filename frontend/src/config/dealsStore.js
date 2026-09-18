// ============================================================
// dealsStore.js
// Backend: /api/deals/
//   GET    /api/deals/                   → list own
//   POST   /api/deals/                   → create { listing_id }
//   GET    /api/deals/{id}/              → detail
//   POST   /api/deals/{id}/offers/       → send offer
//   POST   /api/deals/{id}/accept-offer/ → accept offer
//   POST   /api/deals/{id}/cancel/       → cancel
// ============================================================

import { useEffect, useState } from "react";
import { dealsApi } from "../api/deals.js";

const STORAGE_KEY = "sokomkononi_deals_v1";
const UPDATE_EVENT = "sokomkononi:deals-updated";

export const SEED_DEALS = [];

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

// ============================================================
// NORMALIZER — backend deal → frontend shape
// ============================================================
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

// ============================================================
// HYDRATE
// ============================================================
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

// ============================================================
// ASYNC ACTIONS
// ============================================================
export async function getOrCreateDealAsync({
  listingId,
  currentUserId,
  sellerName,
  buyerName,
  initialMessage,
}) {
  const raw = await dealsApi.create(listingId);
  const deal = normalizeDealFromApi(raw, currentUserId);
  const current = getDeals();
  const next = [deal, ...current.filter((d) => d.id !== deal.id)];
  saveDeals(next);

  if (initialMessage) {
    try {
      await dealsApi.sendOffer(deal.id, {
        amount: deal.askingPrice,
        message: initialMessage,
      });
    } catch {
      // ignore — offer may fail, deal still created
    }
  }

  return deal;
}

export async function sendOfferAsync(dealId, amount, message = "", respondedTo = null) {
  const offer = await dealsApi.sendOffer(dealId, {
    amount,
    message,
    responded_to: respondedTo,
  });
  return offer;
}

export async function acceptOfferAsync(dealId, offerId) {
  return dealsApi.acceptOffer(dealId, offerId);
}

export async function cancelDealAsync(dealId, reason = "") {
  return dealsApi.cancel(dealId, reason);
}

// ============================================================
// LOCAL HELPERS (retained for compatibility)
// ============================================================
export function getOrCreateDeal(payload) {
  // Synchronous fallback — returns existing local deal or a stub.
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

  // Fire-and-forget backend create
  if (payload?.listingId) {
    dealsApi.create(payload.listingId).catch(() => {});
  }

  return deal;
}

export function resolveDispute(id, { action, adminNote = "" } = {}) {
  // Admin only — backend endpoint is /api/transactions/{id}/resolve-dispute/
  updateDeal(id, {
    disputeResolvedAt: new Date().toISOString(),
    disputeResolutionAction: action,
    adminNote,
  });
  return getDeals();
}

export function checkReservationReminders() {
  // Backend handles reservation expiry via Celery beat
  return getDeals();
}

// ============================================================
// HOOK
// ============================================================
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
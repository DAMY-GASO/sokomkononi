// ============================================================
// dealsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Deal Rooms.
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useDeals) hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";
import {
  notifyReservationExpiringSoon,
  notifyDisputeResolved,
} from "./notificationsStore.js";
import { releaseListingToWaitlist } from "./waitingListStore.js";
import { updateListing, updateListingByTitle } from "./listingsStore.js";

const STORAGE_KEY = "sokomkononi_deals_v1";
const UPDATE_EVENT = "sokomkononi:deals-updated";

// ============================================================
// SEED_DEALS — tupu. Data itakuja kutoka backend baadaye.
// ============================================================
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

/** Soma deals za sasa (snapshot moja, si reactive). */
export function getDeals() {
  return readFromStorage();
}

/** Andika orodha mpya kamili ya deals. */
export function saveDeals(deals) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/**
 * Sasisha listing inayohusika na deal.
 */
function syncListingFromDeal(deal, patch) {
  const newStatus = patch.status;
  const currentStatus = deal.status;

  if (newStatus === "reserved" && currentStatus !== "reserved") {
    applyListingPatch(deal, {
      status: "reserved",
      reservedUntil: patch.reservationExpiresAt || deal.reservationExpiresAt || null,
      reservedBy: deal.buyerName || null,
    });
    return;
  }

  if (newStatus === "completed") {
    applyListingPatch(deal, {
      status: "sold",
      reservedUntil: null,
      soldAt: new Date().toISOString(),
    });
    return;
  }

  if (newStatus === "cancelled" || newStatus === "declined") {
    applyListingPatch(deal, {
      status: "live",
      reservedUntil: null,
      reservedBy: null,
    });
    return;
  }

  if (newStatus === "disputed") {
    applyListingPatch(deal, {
      status: "reserved",
      reservedUntil: patch.reservationExpiresAt || deal.reservationExpiresAt || null,
    });
    return;
  }
}

function applyListingPatch(deal, patch) {
  if (deal.listingId) {
    updateListing(deal.listingId, patch);
  } else if (deal.listingTitle) {
    updateListingByTitle(deal.listingTitle, patch);
  }
}

/** Badilisha (merge patch) deal moja tu kwa id yake. */
export function updateDeal(id, patch) {
  const current = getDeals();
  const before = current.find((d) => d.id === id);
  const next = current.map((d) => (d.id === id ? { ...d, ...patch } : d));
  saveDeals(next);

  if (before && patch.status && patch.status !== before.status) {
    syncListingFromDeal(before, patch);
  }

  if (
    before &&
    before.status !== "cancelled" &&
    patch.status === "cancelled" &&
    before.reservationFee
  ) {
    releaseListingToWaitlist(before.listingTitle);
  }

  return next;
}

/** Hook ya React inayosoma deals na kujisasisha yenyewe. */
export function useDeals() {
  const [deals, setDeals] = useState(() => getDeals());
  useEffect(() => {
    const sync = () => setDeals(getDeals());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return deals;
}

// ============================================================
// ANZISHA (AU PATA ILIYOPO) DEAL ROOM
// Inaitwa pale mnunuzi anapobofya "Wasiliana na Muuzaji" kwenye
// ukurasa wa mali. Ikiwa tayari kuna deal kati ya mnunuzi huyu na
// mali hii, irudishe hiyo hiyo badala ya kuunda mpya.
// ============================================================
export function getOrCreateDeal({
  listingId,
  listingTitle,
  category,
  askingPrice,
  location,
  sellerName,
  buyerName,
  initialMessage,
} = {}) {
  const current = getDeals();

  const existing = current.find((d) =>
    listingId ? d.listingId === listingId : d.listingTitle === listingTitle
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const deal = {
    id: `deal_${Date.now()}`,
    listingId: listingId || null,
    listingTitle: listingTitle || "",
    category: category || null,
    location: location || null,
    askingPrice: askingPrice ?? null,
    currentOffer: askingPrice ?? null,
    offerFrom: null,
    counterpartyName: sellerName || "",
    buyerName: buyerName || "",
    sellerName: sellerName || "",
    status: "negotiating",
    createdAt: now,
    messages: [
      {
        id: `m_${Date.now()}`,
        sender: "me",
        text: initialMessage || {
          sw: "Habari, ninavutiwa na mali hii. Naomba maelezo zaidi.",
          en: "Hi, I'm interested in this property. Could you share more details?",
        },
        at: now,
      },
    ],
  };

  saveDeals([...current, deal]);
  return deal;
}

// ============================================================
// UTATUZI WA MGOGORO (Admin pekee anaita hii)
// action: "refund" | "continue" | "cancel"
// ============================================================
export function resolveDispute(id, { action, adminNote = "" } = {}) {
  const current = getDeals();
  const deal = current.find((d) => d.id === id);
  if (!deal) return current;

  const at = new Date().toISOString();
  let patch = {
    disputeResolvedAt: at,
    disputeResolutionAction: action,
    adminNote,
  };
  let systemNote = null;

  if (action === "refund") {
    patch.status = "cancelled";
    patch.refunded = true;
    systemNote = {
      sw: "Timu ya SokoMkononi imethibitisha mgogoro na imerejesha malipo kwa mnunuzi.",
      en: "The SokoMkononi team confirmed the dispute and refunded the buyer.",
    };
  } else if (action === "continue") {
    patch.status = "negotiating";
    patch.disputeNote = null;
    systemNote = {
      sw: "Timu ya SokoMkononi imepitia mgogoro na imeamua deal iendelee (negotiation upya).",
      en: "The SokoMkononi team reviewed the dispute and decided the deal should continue (negotiation restarted).",
    };
  } else if (action === "cancel") {
    patch.status = "cancelled";
    patch.refunded = false;
    systemNote = {
      sw: "Timu ya SokoMkononi imeghairi deal hii kufuatia mgogoro. Hakuna urejeshaji wa fedha.",
      en: "The SokoMkononi team cancelled this deal following the dispute. No refund.",
    };
  } else {
    return current;
  }

  // Ongeza adminNote kama ipo (bilingual)
  if (adminNote) {
    systemNote = {
      sw: `${systemNote.sw} Maelezo ya Admin: ${adminNote}`,
      en: `${systemNote.en} Admin note: ${adminNote}`,
    };
  }

  // Message ya admin — `text` inaweza kuwa { sw, en }
  patch.messages = [
    ...(deal.messages || []),
    {
      id: `m_admin_${Date.now()}`,
      sender: "admin",
      text: systemNote,
      at,
    },
  ];

  updateDeal(id, patch);

  notifyDisputeResolved({
    dealId: id,
    listingTitle: deal.listingTitle,
    action,
    adminNote,
  });

  return getDeals();
}

// ============================================================
// KUMBUSHO LA RESERVATION KUKARIBIA KUISHA
// ============================================================
const REMINDER_WINDOW_HOURS = 6;
const ACTIVE_STATUSES = new Set(["negotiating", "accepted", "disputed"]);

export function checkReservationReminders() {
  const now = Date.now();
  const current = getDeals();
  let changed = false;

  const next = current.map((deal) => {
    if (!deal.reservationExpiresAt) return deal;
    if (deal.reservationReminderSent) return deal;
    if (!ACTIVE_STATUSES.has(deal.status)) return deal;

    const expiresAtMs = new Date(deal.reservationExpiresAt).getTime();
    const hoursLeft = (expiresAtMs - now) / 3600000;
    if (hoursLeft <= 0 || hoursLeft > REMINDER_WINDOW_HOURS) return deal;

    notifyReservationExpiringSoon({
      dealId: deal.id,
      listingTitle: deal.listingTitle,
      hoursLeft: Math.max(1, Math.ceil(hoursLeft)),
    });
    changed = true;
    return { ...deal, reservationReminderSent: true };
  });

  if (changed) saveDeals(next);
  return next;
}

// ============================================================
// dealsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Deal Rooms.
//
// AWAMU HII: deals sasa zina `listingId` (au `listingTitle` kwa zile za
// zamani). Kila deal inapobadilisha status, listing inayohusika
// inasasishwa kwa wakati mmoja:
//
//   deal.status = "reserved"  -> listing.status = "reserved"
//                                + listing.reservedUntil = reservationExpiresAt
//                                + listing.reservedBy    = deal.buyerName
//   deal.status = "completed" -> listing.status = "sold"
//                                (listing haifutwi — inabaki kwa historia)
//   deal.status = "cancelled" -> listing.status = "live" (release)
//                                + listing.reservedUntil = null
//                                + releaseListingToWaitlist() (kama ilivyo)
//
// Hii inahakikisha buyer mwingine anaona RESERVED kwenye Browse/Detail
// (badge + "Reservation ends in: ...") — Doc §3.3, §3.5.
// ============================================================

import { useEffect, useState } from "react";
import { notifyReservationExpiringSoon } from "./notificationsStore.js";
import { releaseListingToWaitlist } from "./waitingListStore.js";
import {
  updateListing,
  updateListingByTitle,
} from "./listingsStore.js";

const STORAGE_KEY = "sokomkononi_deals_v1";
const UPDATE_EVENT = "sokomkononi:deals-updated";

// SEED_DEALS: kila deal SASA ina `listingId` inayolingana na SEED_LISTINGS.
export const SEED_DEALS = [
  {
    id: "d1",
    listingId: "l1", // <-- NEW
    listingTitle: "Nyumba ya Ghorofa Mbezi Beach",
    // ... (kama ilivyo)
  },
  {
    id: "d2",
    listingId: "l2", // <-- NEW
    listingTitle: "Toyota Harrier 2016",
    // ...
  },
  {
    id: "d3",
    listingId: "l3", // <-- NEW
    listingTitle: "Kiwanja Ubungo — Hati Miliki",
    // ...
  },
  {
    id: "d4",
    listingId: "l4", // <-- NEW
    listingTitle: "Duka la Vifaa vya Ujenzi — Kariakoo",
    // ...
  },
];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_DEALS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_DEALS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_DEALS;
    return parsed;
  } catch {
    return SEED_DEALS;
  }
}

export function getDeals() { return readFromStorage(); }

export function saveDeals(deals) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/**
 * Sasisha listing inayohusika na deal — inaitwa ndani ya updateDeal
 * kila mara deal.status inabadilika kwenye hatua za reservation/sold/cancel.
 * Hii ni replacement ya "backend trigger" (DB level) ambayo Developer A
 * ataiweka kwenye API baadaye.
 */
function syncListingFromDeal(deal, patch) {
  const newStatus = patch.status;
  const currentStatus = deal.status;

  // Reserved: listing inakuwa reserved + tunaonyesha muda wa reservation.
  if (newStatus === "reserved" && currentStatus !== "reserved") {
    const patchForListing = {
      status: "reserved",
      reservedUntil: patch.reservationExpiresAt || deal.reservationExpiresAt || null,
      reservedBy: deal.buyerName || null,
    };
    applyListingPatch(deal, patchForListing);
    return;
  }

  // Completed: listing inakuwa sold (haitafutwi — Doc §3.8).
  if (newStatus === "completed") {
    applyListingPatch(deal, {
      status: "sold",
      reservedUntil: null,
      soldAt: new Date().toISOString(),
    });
    return;
  }

  // Cancelled / declined / disputed(refund-cancel): listing inarudi live.
  if (newStatus === "cancelled" || newStatus === "declined") {
    applyListingPatch(deal, {
      status: "live",
      reservedUntil: null,
      reservedBy: null,
    });
    return;
  }

  // Disputed (bado chini ya ukaguzi): haibadilishi listing status bado,
  // lakini inaonyesha kwamba sasa iko kwenye mgogoro.
  if (newStatus === "disputed") {
    applyListingPatch(deal, {
      status: "reserved", // bado haiko huru — iko kwenye mgogoro
      reservedUntil: patch.reservationExpiresAt || deal.reservationExpiresAt || null,
    });
    return;
  }
}

function applyListingPatch(deal, patch) {
  if (deal.listingId) {
    updateListing(deal.listingId, patch);
  } else if (deal.listingTitle) {
    // Mpito kwa deals za zamani ambazo bado hazina listingId.
    updateListingByTitle(deal.listingTitle, patch);
  }
}

export function updateDeal(id, patch) {
  const current = getDeals();
  const before = current.find((d) => d.id === id);
  const next = current.map((d) => (d.id === id ? { ...d, ...patch } : d));
  saveDeals(next);

  // 1) Sasisha listing inayohusika (reserved/sold/live).
  if (before && patch.status && patch.status !== before.status) {
    syncListingFromDeal(before, patch);
  }

  // 2) Waitlist release ikiwa deal iliyokuwa na reservation imeghairiwa.
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

// resolveDispute() + checkReservationReminders() — kama ilivyo, ILA:
//   - resolveDispute sasa inaita notifyDisputeResolved() kwa user audience
//   - updateDeal() (juu) inashughulikia listing status sync
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
  let systemNote = "";

  if (action === "refund") {
    patch.status = "cancelled";
    patch.refunded = true;
    systemNote = "Timu ya SokoMkononi imethibitisha mgogoro na imerejesha malipo kwa mnunuzi.";
  } else if (action === "continue") {
    patch.status = "negotiating";
    patch.disputeNote = null;
    systemNote = "Timu ya SokoMkononi imepitia mgogoro na imeamua deal iendelee (negotiation upya).";
  } else if (action === "cancel") {
    patch.status = "cancelled";
    patch.refunded = false;
    systemNote = "Timu ya SokoMkononi imeghairi deal hii kufuatia mgogoro. Hakuna urejeshaji wa fedha.";
  } else {
    return current;
  }

  if (adminNote) systemNote += ` Maelezo ya Admin: ${adminNote}`;

  patch.messages = [
    ...deal.messages,
    { id: `m_admin_${Date.now()}`, sender: "admin", text: systemNote, at },
  ];

  updateDeal(id, patch);

  // NEW: mwite msikilizaji wa user (buyer + seller wote wawili) ili
  // waone taarifa ya uamuzi wa Admin.
  // (Import inaonekana juu: notifyDisputeResolved kutoka notificationsStore.)
  notifyDisputeResolved({
    dealId: id,
    listingTitle: deal.listingTitle,
    action,
    adminNote,
  });

  return getDeals();
}

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
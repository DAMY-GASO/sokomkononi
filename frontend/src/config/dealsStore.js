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
import {
  notifyReservationExpiringSoon,
  notifyDisputeResolved,
} from "./notificationsStore.js";
import { releaseListingToWaitlist } from "./waitingListStore.js";
import { updateListing, updateListingByTitle } from "./listingsStore.js";

const STORAGE_KEY = "sokomkononi_deals_v1";
const UPDATE_EVENT = "sokomkononi:deals-updated";

// ------------------------------------------------------------
// SEED_DEALS — kila deal SASA ina `listingId` inayolingana na
// SEED_LISTINGS (l1..l4). `listingTitle` inabaki kwa UI convenience.
// ------------------------------------------------------------
export const SEED_DEALS = [
  {
    id: "d1",
    listingId: "l1",
    listingTitle: "Nyumba ya Ghorofa Mbezi Beach",
    category: "nyumba",
    askingPrice: 85000000,
    buyerName: "Sarah Mwangi",
    sellerName: "John Doe",
    counterpartyName: "Sarah Mwangi",
    status: "completed",
    currentOffer: 85000000,
    offerFrom: "them",
    reservationHours: 48,
    reservationFee: 18000,
    reservationMethod: "M-Pesa",
    paymentProof: {
      method: "M-Pesa",
      reference: "QF7X9K2LM1",
      submittedAt: "2026-09-10T10:20:00.000Z",
    },
    messages: [
      { id: "m1", sender: "them", text: "Nimependa nyumba hii, tunaweza kukubaliana TZS 85,000,000?", at: "2026-09-08T09:00:00.000Z", offerAmount: 85000000 },
      { id: "m2", sender: "me", text: "Tumekubaliana, karibu tuendelee.", at: "2026-09-08T09:10:00.000Z" },
      { id: "m3", sender: "me", text: "Reservation Deposit ya TZS 18,000 imelipwa (M-Pesa) — muda: Saa 48 (Siku 2).", at: "2026-09-08T09:15:00.000Z" },
      { id: "m4", sender: "me", text: "Mnunuzi ameridhika na ukaguzi — tayari kwa malipo ya mwisho.", at: "2026-09-09T12:00:00.000Z" },
      { id: "m5", sender: "me", text: "Uthibitisho wa malipo umetumwa (M-Pesa, Ref: QF7X9K2LM1).", at: "2026-09-10T10:20:00.000Z" },
      { id: "m6", sender: "me", text: "Muuzaji amethibitisha: Nimepokea Malipo. Muamala umekamilika.", at: "2026-09-10T10:25:00.000Z" },
    ],
  },
  {
    id: "d2",
    listingId: "l2",
    listingTitle: "Toyota Harrier 2016",
    category: "magari",
    askingPrice: 42000000,
    buyerName: "Michael Kato",
    sellerName: "Jane Mushi",
    counterpartyName: "Michael Kato",
    status: "disputed",
    currentOffer: 39500000,
    offerFrom: "them",
    reservationHours: 72,
    reservationFee: 25000,
    reservationMethod: "Tigo Pesa",
    reservationExpiresAt: "2026-09-12T14:00:00.000Z",
    disputeNote:
      "Gari ina mikwaruzo mikubwa upande wa kushoto ambayo haikutajwa kwenye tangazo, na injini inatoa mlio usio wa kawaida wakati wa kuwasha.",
    messages: [
      { id: "m1", sender: "them", text: "Gari hii mileage ni kiasi gani hasa?", at: "2026-09-09T08:00:00.000Z" },
      { id: "m2", sender: "me", text: "85,000 km, single owner, huduma zote zipo kwenye vitabu.", at: "2026-09-09T08:10:00.000Z" },
      { id: "m3", sender: "them", text: "Naomba punguzo — TZS 39,500,000?", at: "2026-09-09T08:15:00.000Z", offerAmount: 39500000 },
      { id: "m4", sender: "me", text: "Sawa, tumekubaliana.", at: "2026-09-09T08:20:00.000Z" },
      { id: "m5", sender: "me", text: "Reservation Deposit ya TZS 25,000 imelipwa (Tigo Pesa) — muda: Saa 72 (Siku 3).", at: "2026-09-09T08:25:00.000Z" },
      {
        id: "m6",
        sender: "me",
        text: "Mnunuzi ameripoti: bidhaa/mali sio kama ilivyoelezwa. Sababu: Gari ina mikwaruzo mikubwa upande wa kushoto ambayo haikutajwa kwenye tangazo, na injini inatoa mlio usio wa kawaida wakati wa kuwasha.",
        at: "2026-09-11T10:00:00.000Z",
      },
    ],
  },
  {
    id: "d3",
    listingId: "l3",
    listingTitle: "Kiwanja Ubungo — Hati Miliki",
    category: "viwanja",
    askingPrice: 28000000,
    buyerName: "Peter Lema",
    sellerName: "Mary Mwangi",
    counterpartyName: "Peter Lema",
    status: "negotiating",
    currentOffer: 25000000,
    offerFrom: "them",
    messages: [
      { id: "m1", sender: "them", text: "Kiwanja hiki title deed ipo?", at: "2026-09-10T11:00:00.000Z" },
      { id: "m2", sender: "me", text: "Ndiyo, title deed halisi ipo tayari.", at: "2026-09-10T11:05:00.000Z" },
      { id: "m3", sender: "them", text: "Naomba TZS 25,000,000.", at: "2026-09-10T11:07:00.000Z", offerAmount: 25000000 },
    ],
  },
  {
    id: "d4",
    listingId: "l4",
    listingTitle: "Duka la Vifaa vya Ujenzi — Kariakoo",
    category: "biashara",
    askingPrice: 15000000,
    buyerName: "Neema Mushi",
    sellerName: "John Doe",
    counterpartyName: "Neema Mushi",
    status: "accepted",
    currentOffer: 14200000,
    offerFrom: "them",
    messages: [
      { id: "m1", sender: "them", text: "Tumekubaliana kwenye bei TZS 14,200,000, sahihi?", at: "2026-09-02T11:00:00.000Z", offerAmount: 14200000 },
      { id: "m2", sender: "me", text: "Sahihi kabisa, tunaendelea na hatua inayofuata.", at: "2026-09-02T11:03:00.000Z" },
    ],
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

  // Cancelled / declined: listing inarudi live.
  if (newStatus === "cancelled" || newStatus === "declined") {
    applyListingPatch(deal, {
      status: "live",
      reservedUntil: null,
      reservedBy: null,
    });
    return;
  }

  // Disputed: bado chini ya ukaguzi — listing inabaki reserved,
  // lakini reservation muda unaonyeshwa (bado iko kwenye mgogoro).
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
    // Mpito kwa deals za zamani ambazo bado hazina listingId.
    updateListingByTitle(deal.listingTitle, patch);
  }
}

/** Badilisha (merge patch) deal moja tu kwa id yake. */
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

/**
 * Hook ya React inayosoma deals na kujisasisha yenyewe — kwenye
 * DealRooms na AdminDashboard (Deals & Disputes) papo hapo, bila reload.
 */
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

  // Taarifa kwa upande wa mtumiaji — buyer na seller wote wawili
  // (kwa demo hii single-user, inaonekana kwa mtumiaji aliyeingia).
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

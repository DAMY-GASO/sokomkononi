// ============================================================
// dealsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Deal Rooms.
//
// Kabla ya hii, DealRooms.jsx ilikuwa na SEED_DEALS yake, na
// AdminDashboard.jsx ilikuwa na INITIAL_DEALS TOFAUTI kabisa (majina
// tofauti ya mali/watu) — ndiyo maana Admin hakuweza kuona deal halisi
// alizoziona muuzaji/mnunuzi. Sasa zote mbili zinasoma/kuandika hapa.
//
// Kama feePolicy.js, hii ni demo ya front-end pekee — tunatumia
// localStorage + custom event kuiga "backend ya pamoja". Backend halisi
// ikiwepo, badilisha tu functions hizi ziite API; sehemu zinazotumia
// useDeals() na updateDeal() hazitahitaji kubadilika.
//
// KUMBUKA: `counterpartyName` kwenye kila deal ni jina la "mwenzake"
// kutoka mtazamo wa muuzaji (DealRooms inatumia side="seller" kama
// default). Tumeongeza `buyerName` na `sellerName` wazi ili
// AdminDashboard (anayeona pande zote mbili) asitegemee "side".
// ============================================================

import { useEffect, useState } from "react";
import { notifyReservationExpiringSoon } from "./notificationsStore.js";
import { releaseListingToWaitlist } from "./waitingListStore.js";

const STORAGE_KEY = "sokomkononi_deals_v1";
const UPDATE_EVENT = "sokomkononi:deals-updated";

export const SEED_DEALS = [
  {
    id: "d1",
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
    listingTitle: "Kiwanja Ubungo",
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

/** Badilisha (merge patch) deal moja tu kwa id yake. */
export function updateDeal(id, patch) {
  const current = getDeals();
  const before = current.find((d) => d.id === id);
  const next = current.map((d) => (d.id === id ? { ...d, ...patch } : d));
  saveDeals(next);

  // Deal yenye reservation ikighairiwa (dispute refund/cancel, au njia
  // nyingine yoyote inayotumia updateDeal) - mali inaachiwa huru, hivyo
  // mtu wa kwanza kwenye Waiting List ya mali hiyo anataarifiwa.
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
 * DealRooms (upande wa muuzaji/mnunuzi) na AdminDashboard (Deals &
 * Disputes) papo hapo, bila reload.
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
//   refund   -> Malalamiko ni sahihi: deal inaghairiwa, mnunuzi anarejeshewa fedha.
//   continue -> Baada ya kukagua, deal inarudi "negotiating" iendelee kawaida.
//   cancel   -> Deal inasitishwa kabisa, hakuna urejeshaji wa fedha.
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

  return updateDeal(id, patch);
}

// ============================================================
// KUMBUSHO LA RESERVATION KUKARIBIA KUISHA
// Huangalia deals zenye reservationExpiresAt ambayo bado haijafika, na
// ambazo hazijakamilika/kughairiwa. Mara muda uliobaki ukiwa chini ya
// REMINDER_WINDOW_HOURS, hutuma taarifa MOJA TU (reservationReminderSent
// inazuia kurudia kila mara function hii inapoitwa, mfano kila
// DashboardShell inapopakiwa au kila dakika chache kupitia setInterval).
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

    // Tayari imeisha au bado mbali sana (> window) - hakuna cha kufanya sasa.
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

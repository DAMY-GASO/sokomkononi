// ============================================================
// waitingListStore.js
// CHANZO KIMOJA CHA UKWELI kwa Waiting List (foleni ya wanunuzi
// wanaosubiri mali iliyo na Reservation/imeuzwa ipate kuachiwa huru).
//
// Kabla ya hii, WaitingListPage.jsx ilitumia SEED_WAITING_LIST + useState
// yake ya ndani, na DashboardShell.jsx ilikuwa na useState TOFAUTI
// (ilianzishwa kutoka SEED_WAITING_LIST ileile lakini haikushirikiana
// na page nyingine yoyote) — hivyo hapakuwa na njia ya "kujiunga" (join)
// wala ya moja kwa moja kumtaarifu mtu foleni yake ikifunguka. Sasa
// zinahifadhiwa hapa (localStorage + custom event), kama dealsStore.js/
// notificationsStore.js/messagesStore.js.
//
// UNGANISHO NA DEALS: dealsStore.js -> updateDeal() inapoona status ya
// deal ikibadilika kwenda "cancelled" (deal yenye reservation ambayo
// haikukamilika/ilighairiwa), inaita releaseListingToWaitlist() hapa
// chini moja kwa moja — mtu wa kwanza kwenye foleni ya mali hiyo
// anapewa nafasi (status -> "notified") na anatumiwa notification.
// ============================================================

import { useEffect, useState } from "react";
import { notifyListingReleased } from "./notificationsStore.js";

const STORAGE_KEY = "sokomkononi_waiting_list_v1";
const UPDATE_EVENT = "sokomkononi:waiting-list-updated";

// Muda buyer anaopewa kuchukua nafasi kabla haijapita kwa mfuatiliaji
// anayefuata kwenye foleni.
const RESPOND_WINDOW_HOURS = 24;

export const SEED_WAITING_LIST = [
  {
    id: "w1",
    property: "Kiwanja Ubungo — Hati Miliki",
    category: "viwanja",
    price: 28000000,
    location: "Ubungo, Dar es Salaam",
    status: "pending",
    position: 2,
    joinedAt: "2026-09-05T10:00:00.000Z",
  },
  {
    id: "w2",
    property: "Ghorofa Mikocheni",
    category: "nyumba",
    price: 120000000,
    location: "Mikocheni, Dar es Salaam",
    status: "notified",
    joinedAt: "2026-08-20T09:00:00.000Z",
    notifiedAt: "2026-09-10T12:00:00.000Z",
    respondBy: "2026-09-13T12:00:00.000Z",
  },
  {
    id: "w3",
    property: "Toyota Hiace 2014",
    category: "magari",
    price: 32000000,
    location: "Kariakoo, Dar es Salaam",
    status: "expired",
    joinedAt: "2026-07-01T09:00:00.000Z",
    notifiedAt: "2026-07-15T09:00:00.000Z",
  },
];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_WAITING_LIST;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_WAITING_LIST;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_WAITING_LIST;
    return parsed;
  } catch {
    return SEED_WAITING_LIST;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Soma waiting list ya sasa (snapshot moja, si reactive). */
export function getWaitingList() {
  return readFromStorage();
}

/**
 * Hook ya React — hutumika kwenye WaitingListPage.jsx/DashboardShell.jsx.
 * Inajisasisha yenyewe papo hapo popote join/leave/release inapoitwa.
 */
export function useWaitingList() {
  const [entries, setEntries] = useState(() => getWaitingList());

  useEffect(() => {
    const sync = () => setEntries(getWaitingList());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return entries;
}

/**
 * Mnunuzi anajiunga na foleni ya mali fulani (kitufe "Jiunge na Waiting
 * List" kwenye tangazo la mali iliyo na Reservation/imeuzwa tayari).
 * `property` ndiyo ufunguo wa kuoanisha na deal husika (dealsStore.js
 * inatumia listingTitle ileile) — backend halisi ikiwepo, badilisha hii
 * itumie listingId badala ya jina.
 */
export function joinWaitingList({ property, category, price, location }) {
  const current = getWaitingList();
  const already = current.find(
    (e) => e.property === property && (e.status === "pending" || e.status === "notified")
  );
  if (already) return already;

  const position =
    current.filter((e) => e.property === property && e.status === "pending").length + 1;

  const entry = {
    id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    property,
    category,
    price,
    location,
    status: "pending",
    position,
    joinedAt: new Date().toISOString(),
  };
  saveAll([entry, ...current]);
  return entry;
}

export function leaveWaitingList(id) {
  const next = getWaitingList().filter((e) => e.id !== id);
  saveAll(next);
  return next;
}

/**
 * Inaitwa na dealsStore.js pale deal yenye reservation inapoghairiwa
 * (dispute refund/cancel, au reservation kuisha muda bila kukamilika).
 * Mtu wa kwanza (position ndogo zaidi, status "pending") kwenye foleni
 * ya `propertyTitle` anapewa nafasi: status -> "notified" + notification.
 * Waliobaki foleni hawaguswi (nafasi zao zitasogea tu pale huyu
 * atakapoacha foleni bila kuchukua nafasi — leaveWaitingList/expiry).
 */
export function releaseListingToWaitlist(propertyTitle) {
  if (!propertyTitle) return getWaitingList();

  const current = getWaitingList();
  const queue = current
    .filter((e) => e.property === propertyTitle && e.status === "pending")
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const nextInLine = queue[0];
  if (!nextInLine) return current; // hakuna aliyekuwa akisubiri mali hii

  const at = new Date().toISOString();
  const respondBy = new Date(Date.now() + RESPOND_WINDOW_HOURS * 3600000).toISOString();

  const next = current.map((e) =>
    e.id === nextInLine.id ? { ...e, status: "notified", notifiedAt: at, respondBy } : e
  );
  saveAll(next);

  notifyListingReleased({ listingId: nextInLine.id, listingTitle: propertyTitle });

  return next;
}

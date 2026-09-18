// ============================================================
// waitingListStore.js
// CHANZO KIMOJA CHA UKWELI kwa Waiting List (foleni ya wanunuzi
// wanaosubiri mali iliyo na Reservation/imeuzwa ipate kuachiwa huru).
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useWaitingList) hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";
import { notifyListingReleased } from "./notificationsStore.js";

const STORAGE_KEY = "sokomkononi_waiting_list_v1";
const UPDATE_EVENT = "sokomkononi:waiting-list-updated";

// Muda buyer anaopewa kuchukua nafasi kabla haijapita kwa mfuatiliaji
// anayefuata kwenye foleni.
const RESPOND_WINDOW_HOURS = 24;

// ============================================================
// SEED_WAITING_LIST — tupu. Data itakuja kutoka backend baadaye.
// ============================================================
export const SEED_WAITING_LIST = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_WAITING_LIST;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_WAITING_LIST;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_WAITING_LIST;
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
 * Mnunuzi anajiunga na foleni ya mali fulani.
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
 * Inaitwa na dealsStore.js pale deal yenye reservation inapoghairiwa.
 */
export function releaseListingToWaitlist(propertyTitle) {
  if (!propertyTitle) return getWaitingList();

  const current = getWaitingList();
  const queue = current
    .filter((e) => e.property === propertyTitle && e.status === "pending")
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const nextInLine = queue[0];
  if (!nextInLine) return current;

  const at = new Date().toISOString();
  const respondBy = new Date(Date.now() + RESPOND_WINDOW_HOURS * 3600000).toISOString();

  const next = current.map((e) =>
    e.id === nextInLine.id ? { ...e, status: "notified", notifiedAt: at, respondBy } : e
  );
  saveAll(next);

  notifyListingReleased({ listingId: nextInLine.id, listingTitle: propertyTitle });

  return next;
}

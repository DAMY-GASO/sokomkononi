// ============================================================
// recentlyViewedStore.js
// CHANZO KIMOJA CHA UKWELI kwa Listings Alizoziona Buyer Hivi Karibuni.
//
// Kila buyer anafungua listing, tunaongeza kwenye historia yake.
// Tunaweka max 20 za hivi karibuni.
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useRecentlyViewed) hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_recently_viewed_v1";
const UPDATE_EVENT = "sokomkononi:recently-viewed-updated";
const MAX_ITEMS = 20;

// ============================================================
// SEED — tupu
// ============================================================
export const SEED_RECENTLY_VIEWED = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_RECENTLY_VIEWED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_RECENTLY_VIEWED;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_RECENTLY_VIEWED;
    return parsed;
  } catch {
    return SEED_RECENTLY_VIEWED;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// HELPERS
// ============================================================

/** Soma historia ya sasa (snapshot moja, si reactive). */
export function getRecentlyViewed() {
  return readFromStorage();
}

/** Ongeza listing kwenye historia (ikiwa ipo tayari, isonge juu). */
export function trackViewed(listingId) {
  if (!listingId) return getRecentlyViewed();
  const current = getRecentlyViewed();
  const filtered = current.filter((id) => id !== listingId);
  const next = [listingId, ...filtered].slice(0, MAX_ITEMS);
  saveAll(next);
  return next;
}

/** Ondoa listing kwenye historia. */
export function removeViewed(listingId) {
  const next = getRecentlyViewed().filter((id) => id !== listingId);
  saveAll(next);
  return next;
}

/** Futa historia yote. */
export function clearRecentlyViewed() {
  saveAll([]);
  return [];
}

// ============================================================
// HOOKS
// ============================================================

/** Hook: historia yote. */
export function useRecentlyViewedIds() {
  const [ids, setIds] = useState(() => getRecentlyViewed());

  useEffect(() => {
    const sync = () => setIds(getRecentlyViewed());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return ids;
}

/** Hook: idadi ya listings zilizoangaliwa. */
export function useRecentlyViewedCount() {
  return useRecentlyViewedIds().length;
}

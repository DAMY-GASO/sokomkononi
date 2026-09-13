// ============================================================
// savedStore.js
// CHANZO KIMOJA CHA UKWELI kwa saved-properties (Zilizohifadhiwa).
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useSavedIds) hazitahitaji kubadilika.
//
// SNAPSHOT: Tunahifadhi bei + status ya kila listing wakati
// buyer anaihifadhi. Hii inaturuhusu kuona mabadiliko na kutuma
// notifications.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_saved_v1";
const SNAPSHOT_KEY = "sokomkononi_saved_snapshots_v1";
const UPDATE_EVENT = "sokomkononi:saved-updated";
const SNAPSHOT_UPDATE_EVENT = "sokomkononi:saved-snapshots-updated";

// ============================================================
// SEED_SAVED_IDS — tupu
// ============================================================
const SEED_SAVED_IDS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_SAVED_IDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_SAVED_IDS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_SAVED_IDS;
    return parsed;
  } catch {
    return SEED_SAVED_IDS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// SNAPSHOTS — kuhifadhi bei + status ya listing wakati inahifadhiwa
// ============================================================

function readSnapshots() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveSnapshots(snapshots) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
  window.dispatchEvent(new Event(SNAPSHOT_UPDATE_EVENT));
}

/** Hifadhi snapshot ya listing (bei, status). */
export function saveSnapshot(listing) {
  if (!listing?.id) return readSnapshots();
  const snapshots = readSnapshots();
  const next = {
    ...snapshots,
    [listing.id]: {
      price: listing.price,
      status: listing.status,
      title: listing.title,
      savedAt: new Date().toISOString(),
    },
  };
  saveSnapshots(next);
  return next;
}

/** Ondoa snapshot ya listing. */
export function removeSnapshot(id) {
  const snapshots = readSnapshots();
  const next = { ...snapshots };
  delete next[id];
  saveSnapshots(next);
  return next;
}

/** Pata snapshot ya listing. */
export function getSnapshot(id) {
  return readSnapshots()[id] || null;
}

/** Soma snapshots zote. */
export function getSnapshots() {
  return readSnapshots();
}

// ============================================================
// SAVED IDS
// ============================================================

export function getSavedIds() {
  return readFromStorage();
}

export function saveSavedIds(ids) {
  saveAll(ids);
}

export function toggleSaved(id) {
  const current = getSavedIds();
  const next = current.includes(id)
    ? current.filter((i) => i !== id)
    : [...current, id];
  saveAll(next);
  return next;
}

export function isSaved(id) {
  return getSavedIds().includes(id);
}

export function useSavedIds() {
  const [ids, setIds] = useState(() => getSavedIds());
  useEffect(() => {
    const sync = () => setIds(getSavedIds());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return ids;
}

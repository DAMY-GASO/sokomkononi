// ============================================================
// savedStore.js
// CHANZO KIMOJA CHA UKWELI kwa saved-properties (Zilizohifadhiwa).
//
// Kabla ya hii, BrowseProperties ilikuwa na savedIds yake ya ndani,
// na SavedPropertiesPage ilikuwa na SEED_SAVED yake — mtumiaji
// akihifadhi kwenye Browse, haionekani SavedPropertiesPage.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_saved_v1";
const UPDATE_EVENT = "sokomkononi:saved-updated";

const SEED_SAVED_IDS = ["l1", "l2", "l3"];

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

export function getSavedIds() {
  return readFromStorage();
}

export function saveSavedIds(ids) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function toggleSaved(id) {
  const current = getSavedIds();
  const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
  saveSavedIds(next);
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

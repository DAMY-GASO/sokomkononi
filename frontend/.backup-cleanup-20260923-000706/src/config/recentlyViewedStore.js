// ============================================================
// recentlyViewedStore.js — local only (no backend endpoint)
// ============================================================
import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_recently_viewed_v1";
const UPDATE_EVENT = "sokomkononi:recently-viewed-updated";
const MAX_ITEMS = 20;

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

export function getRecentlyViewed() {
  return readFromStorage();
}

export function trackViewed(listingId) {
  if (!listingId) return getRecentlyViewed();
  const current = getRecentlyViewed();
  const filtered = current.filter((id) => id !== listingId);
  const next = [listingId, ...filtered].slice(0, MAX_ITEMS);
  saveAll(next);
  return next;
}

export function removeViewed(listingId) {
  const next = getRecentlyViewed().filter((id) => id !== listingId);
  saveAll(next);
  return next;
}

export function clearRecentlyViewed() {
  saveAll([]);
  return [];
}

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

export function useRecentlyViewedCount() {
  return useRecentlyViewedIds().length;
}

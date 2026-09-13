// ============================================================
// searchesStore.js
// CHANZO KIMOJA CHA UKWELI kwa Saved Searches (Buyer Alerts).
//
// Buyer anaweka search ("Toyota Harrier chini ya TZS 50M Dar")
// na mfumo unamjulishe listing mpya inayolingana.
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useSearches) hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_searches_v1";
const UPDATE_EVENT = "sokomkononi:searches-updated";

// ============================================================
// SEED — tupu
// ============================================================
export const SEED_SEARCHES = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_SEARCHES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_SEARCHES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_SEARCHES;
    return parsed;
  } catch {
    return SEED_SEARCHES;
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

/** Soma saved searches zote. */
export function getSearches() {
  return readFromStorage();
}

/**
 * Ongeza saved search.
 * @param {Object} search - { name, query, category, minPrice, maxPrice, region }
 */
export function addSearch(search) {
  const current = getSearches();
  const entry = {
    id: `search_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: search.name || "Search",
    query: search.query || "",
    category: search.category || null,
    minPrice: search.minPrice ?? null,
    maxPrice: search.maxPrice ?? null,
    region: search.region || null,
    verifiedOnly: search.verifiedOnly ?? false,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    matchCount: 0,
  };
  const next = [entry, ...current];
  saveAll(next);
  return entry;
}

/** Badilisha saved search. */
export function updateSearch(id, patch) {
  const next = getSearches().map((s) => (s.id === id ? { ...s, ...patch } : s));
  saveAll(next);
  return next;
}

/** Ondoa saved search. */
export function removeSearch(id) {
  const next = getSearches().filter((s) => s.id !== id);
  saveAll(next);
  return next;
}

/**
 * Hesabu listings zinazolingana na search.
 * Inatumika kuonyesha matchCount.
 */
export function countMatches(search, listings) {
  if (!search || !Array.isArray(listings)) return 0;

  return listings.filter((l) => {
    if (l.status !== "live") return false;

    if (search.category && l.category !== search.category) return false;

    if (search.region && l.region !== search.region) return false;

    if (search.minPrice != null && l.price < search.minPrice) return false;
    if (search.maxPrice != null && l.price > search.maxPrice) return false;

    if (search.verifiedOnly && !l.verified) return false;

    if (search.query) {
      const q = search.query.toLowerCase();
      const text = `${l.title || ""} ${l.location || ""} ${
        l.description || ""
      }`.toLowerCase();
      if (!text.includes(q)) return false;
    }

    return true;
  }).length;
}

// ============================================================
// HOOKS
// ============================================================

/** Hook: saved searches zote. */
export function useSearches() {
  const [searches, setSearches] = useState(() => getSearches());

  useEffect(() => {
    const sync = () => setSearches(getSearches());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return searches;
}

/** Idadi ya searches. */
export function useSearchesCount() {
  return useSearches().length;
}

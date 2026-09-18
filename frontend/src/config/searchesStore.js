// ============================================================
// searchesStore.js — API-backed via /api/searches/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_searches_v1";
const UPDATE_EVENT = "sokomkononi:searches-updated";

export const SEED_SEARCHES = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_SEARCHES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_SEARCHES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_SEARCHES;
  } catch {
    return SEED_SEARCHES;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function normalizeFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name,
    query: raw.query || "",
    category: raw.category_slug || null,
    minPrice: raw.min_price != null ? Number(raw.min_price) : null,
    maxPrice: raw.max_price != null ? Number(raw.max_price) : null,
    region: raw.region || null,
    verifiedOnly: !!raw.verified_only,
    matchCount: raw.match_count || 0,
    lastChecked: raw.last_checked,
    createdAt: raw.created_at,
  };
}

export function getSearches() {
  return readFromStorage();
}

export async function hydrateSearchesFromApi() {
  try {
    const data = await api.get("/searches/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeFromApi).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[searchesStore] hydrate failed:", err);
    return { source: "error", count: getSearches().length };
  }
}

export function addSearch(search) {
  const payload = {
    name: search.name || "Search",
    query: search.query || "",
    category_slug: search.category || "",
    region: search.region || "",
    min_price: search.minPrice ?? null,
    max_price: search.maxPrice ?? null,
    verified_only: search.verifiedOnly ?? false,
  };

  api.post("/searches/", payload).then((raw) => {
    const created = normalizeFromApi(raw);
    const current = getSearches();
    saveAll([created, ...current]);
  }).catch(() => {});

  const entry = {
    id: `local_${Date.now()}`,
    name: payload.name,
    query: payload.query,
    category: search.category || null,
    minPrice: search.minPrice ?? null,
    maxPrice: search.maxPrice ?? null,
    region: search.region || null,
    verifiedOnly: payload.verified_only,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    matchCount: 0,
  };
  saveAll([entry, ...getSearches()]);
  return entry;
}

export function updateSearch(id, patch) {
  const next = getSearches().map((s) => (s.id === id ? { ...s, ...patch } : s));
  saveAll(next);
  if (typeof id === "number") {
    api.patch(`/searches/${id}/`, patch).catch(() => {});
  }
  return next;
}

export function removeSearch(id) {
  const next = getSearches().filter((s) => s.id !== id);
  saveAll(next);
  if (typeof id === "number") {
    api.delete(`/searches/${id}/`).catch(() => {});
  }
  return next;
}

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
      const text = `${l.title || ""} ${l.location || ""} ${l.description || ""}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  }).length;
}

export function checkNewListingMatches() {}

export function useSearches() {
  const [searches, setSearches] = useState(() => getSearches());
  useEffect(() => {
    hydrateSearchesFromApi();
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

export function useSearchesCount() {
  return useSearches().length;
}

// ============================================================
// searchesStore.js — API-only via /api/searches/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_searches_v1";
const EV = "sokomkononi:searches-updated";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}
function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}
function norm(raw) {
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

export function getSearches() { return read(); }

export async function hydrateSearchesFromApi() {
  try {
    const d = await api.get("/searches/?page_size=100");
    const list = Array.isArray(d) ? d : d?.results || [];
    const normalized = list.map(norm).filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function addSearchAsync(search) {
  try {
    const raw = await api.post("/searches/", {
      name: search.name || "Search",
      query: search.query || "",
      category_slug: search.category || "",
      region: search.region || "",
      min_price: search.minPrice ?? null,
      max_price: search.maxPrice ?? null,
      verified_only: search.verifiedOnly ?? false,
    });
    const created = norm(raw);
    write([created, ...read()]);
    return { ok: true, search: created };
  } catch (err) { return { ok: false, error: err }; }
}

export function addSearch(search) { addSearchAsync(search); }

export async function removeSearchAsync(id) {
  try {
    await api.delete(`/searches/${id}/`);
    write(read().filter((s) => s.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function removeSearch(id) { removeSearchAsync(id); }

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

export function useSearches() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateSearchesFromApi();
    const sync = () => setList(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return list;
}
export function useSearchesCount() { return useSearches().length; }

// LEGACY
export const SEED_SEARCHES = [];
export function updateSearch() {}
export function checkNewListingMatches() {}

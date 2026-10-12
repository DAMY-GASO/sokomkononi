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

export function addSearch(search) { return addSearchAsync(search); }

export async function removeSearchAsync(id) {
  try {
    await api.delete(`/searches/${id}/`);
    write(read().filter((s) => s.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function removeSearch(id) { return removeSearchAsync(id); }

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



// ============================================================
// SEARCH ALERTS
// When a new listing matches a saved search and the user has
// not been notified for that (search, listing) pair yet, emit
// a notification.
// ============================================================
import { getPublicListings } from "./listingsStore.js";
import { notificationsApi } from "../api/notifications.js";

const SEEN_KEY = "sokomkononi_search_alerts_seen_v1";

function readSeen() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function writeSeen(map) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_KEY, JSON.stringify(map));
}

function match(search, listing) {
  if (!listing || listing.status !== "live") return false;
  if (search.category && listing.category !== search.category) return false;
  if (search.region && listing.region !== search.region) return false;
  if (search.minPrice != null && Number(listing.price) < search.minPrice) return false;
  if (search.maxPrice != null && Number(listing.price) > search.maxPrice) return false;
  if (search.verifiedOnly && !listing.verified) return false;
  if (search.query) {
    const q = search.query.toLowerCase();
    const text = `${listing.title || ""} ${listing.location || ""} ${listing.description || ""}`.toLowerCase();
    if (!text.includes(q)) return false;
  }
  return true;
}

export async function detectSearchAlertsAsync() {
  const searches = getSearches();
  if (searches.length === 0) return { ok: true, alerts: [] };

  const listings = getPublicListings();
  const seen = readSeen();
  const alerts = [];

  for (const search of searches) {
    const seenForSearch = new Set(seen[search.id] || []);
    const matches = listings.filter(
      (l) => match(search, l) && !seenForSearch.has(String(l.id))
    );
    // Cap per-run so we don't spam the user
    const take = matches.slice(0, 5);
    for (const l of take) {
      alerts.push({ search, listing: l });
      seenForSearch.add(String(l.id));
    }
    seen[search.id] = Array.from(seenForSearch);
  }

  writeSeen(seen);
  if (alerts.length === 0) return { ok: true, alerts: [] };

  for (const a of alerts) {
    try {
      await notificationsApi.create({
        notification_type: "SEARCH_ALERT",
        audience: "user",
        title: "Tangazo jipya linafanana na utafutaji wako",
        message: `"${a.search.name}": ${a.listing.title} — TZS ${Number(a.listing.price || 0).toLocaleString("en-US")}`,
        related_object_type: "listing",
        related_object_id: a.listing.id,
        action_url: `/mali/${a.listing.id}`,
        priority: "normal",
      });
    } catch (e) {
      console.warn("[searchesStore] alert notify failed:", e);
    }
  }

  return { ok: true, alerts };
}

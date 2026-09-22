// ============================================================
// waitingListStore.js — API-backed via /api/waiting-list/
// ============================================================
import { useEffect, useState } from "react";
import { waitingListApi } from "../api/waitingList.js";

const STORAGE_KEY = "sokomkononi_waiting_list_v1";
const UPDATE_EVENT = "sokomkononi:waiting-list-updated";
const RESPOND_WINDOW_HOURS = 24;

export const SEED_WAITING_LIST = [];

// ============================================================
// STORAGE HELPERS
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return SEED_WAITING_LIST;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_WAITING_LIST;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_WAITING_LIST;
  } catch {
    return SEED_WAITING_LIST;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// NORMALIZER — backend → frontend shape
// ============================================================
function normalizeEntryFromApi(raw) {
  if (!raw) return null;
  const listing = raw.listing || {};
  return {
    id: raw.id,
    listingId: listing.id,
    property: listing.title || "",
    category: listing.category?.slug || listing.category || null,
    price: Number(listing.price) || 0,
    location: listing.location || "",
    status: (raw.status || "WAITING").toLowerCase(),
    position: raw.position ?? 1,
    joinedAt: raw.joined_at,
    notifiedAt: raw.notified_at,
    updatedAt: raw.updated_at,
  };
}

// ============================================================
// SYNC READS
// ============================================================
export function getWaitingList() {
  return readFromStorage();
}

export function getWaitingListEntry(id) {
  return getWaitingList().find((e) => e.id === id) || null;
}

export function getWaitingListForListing(listingId) {
  return getWaitingList().filter((e) => e.listingId === listingId);
}

// ============================================================
// HYDRATE FROM API
// ============================================================
export async function hydrateWaitingListFromApi() {
  try {
    const data = await waitingListApi.mine();
    const rawList = Array.isArray(data) ? data : data?.results || [];
    const normalized = rawList.map(normalizeEntryFromApi).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[waitingListStore] hydrate failed:", err);
    return { source: "error", count: getWaitingList().length };
  }
}

// ============================================================
// ASYNC ACTIONS (preferred — with proper error handling)
// ============================================================

/**
 * Join waiting list via API. Returns { ok, entry, error }.
 */
export async function joinWaitingListAsync(listingId) {
  if (!listingId) {
    return { ok: false, error: new Error("listingId is required") };
  }

  try {
    const raw = await waitingListApi.join(listingId);
    const created = normalizeEntryFromApi(raw);
    if (!created) {
      return { ok: false, error: new Error("Invalid response from server") };
    }

    // Replace any existing entry for same listing, prepend new one
    const current = getWaitingList();
    const filtered = current.filter(
      (e) => e.id !== created.id && e.listingId !== created.listingId
    );
    saveAll([created, ...filtered]);

    return { ok: true, entry: created };
  } catch (err) {
    console.warn("[waitingListStore] join failed:", err);
    return { ok: false, error: err };
  }
}

/**
 * Leave waiting list via API. Returns { ok, error }.
 */
export async function leaveWaitingListAsync(id) {
  if (!id) {
    return { ok: false, error: new Error("id is required") };
  }

  const previous = getWaitingList();
  const entry = previous.find((e) => e.id === id);

  // Optimistic: remove locally first
  saveAll(previous.filter((e) => e.id !== id));

  // If entry was local-only (never synced), we're done
  if (!entry || typeof id !== "number") {
    return { ok: true };
  }

  try {
    await waitingListApi.leave(id);
    return { ok: true };
  } catch (err) {
    // Rollback on failure
    console.warn("[waitingListStore] leave failed, rolling back:", err);
    saveAll(previous);
    return { ok: false, error: err };
  }
}

/**
 * Fetch entries for a specific listing (admin/seller view).
 */
export async function fetchListingEntriesAsync(listingId) {
  if (!listingId) return { ok: false, entries: [], error: new Error("listingId required") };
  try {
    const data = await waitingListApi.listingEntries(listingId);
    const rawList = Array.isArray(data) ? data : data?.results || [];
    const entries = rawList.map(normalizeEntryFromApi).filter(Boolean);
    return { ok: true, entries };
  } catch (err) {
    console.warn("[waitingListStore] fetchListingEntries failed:", err);
    return { ok: false, entries: [], error: err };
  }
}

// ============================================================
// LEGACY SYNC HELPERS (kept for backward compatibility)
// These are fire-and-forget and only used by older UI code.
// New code should use the async variants above.
// ============================================================

/**
 * @deprecated Use joinWaitingListAsync instead.
 */
export function joinWaitingList(payload) {
  const listingId =
    typeof payload === "number"
      ? payload
      : payload?.listingId || payload?.listing || payload?.id;

  const localEntry = {
    id: `local_${Date.now()}`,
    listingId,
    property: payload?.property || payload?.listingTitle || "",
    category: payload?.category || null,
    price: payload?.price ?? 0,
    location: payload?.location || "",
    status: "pending",
    position: 1,
    joinedAt: new Date().toISOString(),
  };

  saveAll([localEntry, ...getWaitingList()]);

  // Fire-and-forget; replaces local entry on success
  if (listingId && typeof listingId === "number") {
    waitingListApi
      .join(listingId)
      .then((raw) => {
        const created = normalizeEntryFromApi(raw);
        if (created) {
          saveAll([
            created,
            ...getWaitingList().filter((e) => e.id !== localEntry.id),
          ]);
        }
      })
      .catch(() => {});
  }

  return localEntry;
}

/**
 * @deprecated Use leaveWaitingListAsync instead.
 */
export function leaveWaitingList(id) {
  const next = getWaitingList().filter((e) => e.id !== id);
  saveAll(next);
  if (typeof id === "number") {
    waitingListApi.leave(id).catch(() => {});
  }
  return next;
}

/**
 * @deprecated Backend handles release logic.
 */
export function releaseListingToWaitlist() {
  return getWaitingList();
}

// ============================================================
// HOOKS
// ============================================================
export function useWaitingList() {
  const [entries, setEntries] = useState(() => getWaitingList());

  useEffect(() => {
    hydrateWaitingListFromApi();

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

export function useWaitingListForListing(listingId) {
  const entries = useWaitingList();
  if (!listingId) return [];
  return entries.filter((e) => e.listingId === listingId);
}

export function useWaitingListCount() {
  return useWaitingList().length;
}

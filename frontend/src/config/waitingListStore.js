// ============================================================
// waitingListStore.js
// Backend: /api/waiting-list/
//   GET    /api/waiting-list/           → list own / all (staff)
//   POST   /api/waiting-list/           → join { listing: <id> }
//   GET    /api/waiting-list/{id}/
//   DELETE /api/waiting-list/{id}/      → leave
//   GET    /api/waiting-list/mine/      → own entries
// ============================================================

import { useEffect, useState } from "react";
import { waitingListApi } from "../api/waitingList.js";

const STORAGE_KEY = "sokomkononi_waiting_list_v1";
const UPDATE_EVENT = "sokomkononi:waiting-list-updated";
const RESPOND_WINDOW_HOURS = 24;

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

export function getWaitingList() {
  return readFromStorage();
}

// ============================================================
// NORMALIZER — backend → frontend
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
// ASYNC ACTIONS
// ============================================================
export async function joinWaitingListAsync(listingId) {
  const created = await waitingListApi.join(listingId);
  const normalized = normalizeEntryFromApi(created);
  const next = [normalized, ...getWaitingList()];
  saveAll(next);
  return normalized;
}

export async function leaveWaitingListAsync(id) {
  await waitingListApi.leave(id);
  const next = getWaitingList().filter((e) => e.id !== id);
  saveAll(next);
  return next;
}

// ============================================================
// LOCAL-ONLY HELPERS (kept for backward compatibility)
// ============================================================
export function leaveWaitingList(id) {
  const next = getWaitingList().filter((e) => e.id !== id);
  saveAll(next);
  // Fire-and-forget backend call
  leaveWaitingListAsync(id).catch(() => {});
  return next;
}

export function releaseListingToWaitlist(propertyTitle) {
  // Backend handles this via Celery task; local stub returns current
  return getWaitingList();
}

// ============================================================
// HOOK
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
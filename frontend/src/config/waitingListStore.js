// ============================================================
// waitingListStore.js — API-backed via /api/waiting-list/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

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

export function getWaitingList() {
  return readFromStorage();
}

export async function hydrateWaitingListFromApi() {
  try {
    const data = await api.get("/waiting-list/mine/");
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
// JOIN — accepts both ({ property, category, price, location })
// and a plain listing id, and returns the local entry.
// ============================================================
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

  const next = [localEntry, ...getWaitingList()];
  saveAll(next);

  if (listingId && typeof listingId === "number") {
    api.post("/waiting-list/", { listing: listingId })
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

export async function joinWaitingListAsync(listingId) {
  const raw = await api.post("/waiting-list/", { listing: listingId });
  const normalized = normalizeEntryFromApi(raw);
  const next = [normalized, ...getWaitingList()];
  saveAll(next);
  return normalized;
}

export function leaveWaitingList(id) {
  const next = getWaitingList().filter((e) => e.id !== id);
  saveAll(next);
  if (typeof id === "number") {
    api.delete(`/waiting-list/${id}/`).catch(() => {});
  }
  return next;
}

export async function leaveWaitingListAsync(id) {
  await api.delete(`/waiting-list/${id}/`);
  const next = getWaitingList().filter((e) => e.id !== id);
  saveAll(next);
  return next;
}

export function releaseListingToWaitlist(propertyTitle) {
  return getWaitingList();
}

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

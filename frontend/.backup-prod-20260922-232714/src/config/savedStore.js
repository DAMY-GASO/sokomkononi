// ============================================================
// savedStore.js — API-backed via /api/saved/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_saved_v1";
const SNAPSHOT_KEY = "sokomkononi_saved_snapshots_v1";
const UPDATE_EVENT = "sokomkononi:saved-updated";
const SNAPSHOT_UPDATE_EVENT = "sokomkononi:saved-snapshots-updated";

const SEED_SAVED_IDS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_SAVED_IDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_SAVED_IDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_SAVED_IDS;
  } catch {
    return SEED_SAVED_IDS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

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

export function removeSnapshot(id) {
  const snapshots = readSnapshots();
  const next = { ...snapshots };
  delete next[id];
  saveSnapshots(next);
  return next;
}

export function getSnapshot(id) {
  return readSnapshots()[id] || null;
}

export function getSnapshots() {
  return readSnapshots();
}

export function getSavedIds() {
  return readFromStorage();
}

export function saveSavedIds(ids) {
  saveAll(ids);
}

export function toggleSaved(id, listing = null) {
  const current = getSavedIds();
  const wasSaved = current.includes(id);
  const next = wasSaved ? current.filter((i) => i !== id) : [...current, id];
  saveAll(next);

  if (wasSaved) {
    removeSnapshot(id);
    api.delete(`/saved/listing/${id}/`).catch(() => {});
  } else {
    if (listing) saveSnapshot(listing);
    api.post("/saved/", { listing: id }).catch(() => {});
  }

  return next;
}

export function isSaved(id) {
  return getSavedIds().includes(id);
}

export async function hydrateSavedFromApi() {
  try {
    const data = await api.get("/saved/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const ids = list.map((s) => s.listing?.id).filter(Boolean);

    const snapshots = {};
    for (const item of list) {
      if (!item.listing?.id) continue;
      snapshots[item.listing.id] = {
        price: item.snapshot_price,
        status: item.snapshot_status,
        title: item.listing.title,
        savedAt: item.saved_at,
      };
    }

    saveAll(ids);
    saveSnapshots(snapshots);
    return { source: "api", count: ids.length };
  } catch (err) {
    console.warn("[savedStore] hydrate failed:", err);
    return { source: "error", count: getSavedIds().length };
  }
}

export function useSavedIds() {
  const [ids, setIds] = useState(() => getSavedIds());
  useEffect(() => {
    hydrateSavedFromApi();
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

export function useSavedSnapshots() {
  const [snapshots, setSnapshots] = useState(() => readSnapshots());
  useEffect(() => {
    const sync = () => setSnapshots(readSnapshots());
    window.addEventListener("storage", sync);
    window.addEventListener(SNAPSHOT_UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SNAPSHOT_UPDATE_EVENT, sync);
    };
  }, []);
  return snapshots;
}

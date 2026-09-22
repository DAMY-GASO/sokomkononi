// ============================================================
// savedStore.js — API-only via /api/saved/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const IDS_KEY = "sokomkononi_saved_v1";
const SNAP_KEY = "sokomkononi_saved_snapshots_v1";
const EV = "sokomkononi:saved-updated";
const SNAP_EV = "sokomkononi:saved-snapshots-updated";

function readIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(IDS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}
function writeIds(ids) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(IDS_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EV));
}
function readSnaps() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SNAP_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? p : {};
  } catch { return {}; }
}
function writeSnaps(s) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SNAP_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(SNAP_EV));
}

export function getSavedIds() { return readIds(); }
export function getSnapshots() { return readSnaps(); }
export function getSnapshot(id) { return readSnaps()[id] || null; }
export function isSaved(id) { return readIds().includes(id); }

export async function hydrateSavedFromApi() {
  try {
    const data = await api.get("/saved/?page_size=200");
    const list = Array.isArray(data) ? data : data?.results || [];
    const ids = list.map((s) => s.listing?.id).filter(Boolean);
    const snaps = {};
    for (const item of list) {
      if (!item.listing?.id) continue;
      snaps[item.listing.id] = {
        price: item.snapshot_price,
        status: item.snapshot_status,
        title: item.listing.title,
        savedAt: item.saved_at,
      };
    }
    writeIds(ids);
    writeSnaps(snaps);
    return { ok: true, count: ids.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function toggleSaved(id, listing = null) {
  const current = readIds();
  const wasSaved = current.includes(id);
  try {
    if (wasSaved) {
      await api.delete(`/saved/listing/${id}/`);
      writeIds(current.filter((i) => i !== id));
      const snaps = readSnaps();
      delete snaps[id];
      writeSnaps(snaps);
      return { ok: true, saved: false };
    } else {
      await api.post("/saved/", { listing: id });
      writeIds([...current, id]);
      if (listing) {
        const snaps = readSnaps();
        snaps[id] = {
          price: listing.price,
          status: listing.status,
          title: listing.title,
          savedAt: new Date().toISOString(),
        };
        writeSnaps(snaps);
      }
      return { ok: true, saved: true };
    }
  } catch (err) { return { ok: false, error: err }; }
}

export function useSavedIds() {
  const [ids, setIds] = useState(() => readIds());
  useEffect(() => {
    hydrateSavedFromApi();
    const sync = () => setIds(readIds());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return ids;
}

export function useSavedSnapshots() {
  const [snaps, setSnaps] = useState(() => readSnaps());
  useEffect(() => {
    hydrateSavedFromApi();
    const sync = () => setSnaps(readSnaps());
    window.addEventListener("storage", sync);
    window.addEventListener(SNAP_EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SNAP_EV, sync);
    };
  }, []);
  return snaps;
}

// LEGACY
export function saveSnapshot() {}
export function removeSnapshot() {}
export function saveSavedIds() {}

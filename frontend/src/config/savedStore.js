// ============================================================
// savedStore.js — API-only via /api/saved/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { getListing } from "./listingsStore.js";

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
  } catch {
    return [];
  }
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
  } catch {
    return {};
  }
}
function writeSnaps(s) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SNAP_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(SNAP_EV));
}

export function getSavedIds() {
  return readIds();
}
export function getSnapshots() {
  return readSnaps();
}
export function getSnapshot(id) {
  return readSnaps()[id] || null;
}
export function isSaved(id) {
  return readIds().includes(id);
}

export async function hydrateSavedFromApi() {
  try {
    const data = await api.get("/saved/?page_size=200");
    const list = Array.isArray(data) ? data : data?.results || [];
    const serverIds = list.map((s) => s.listing?.id).filter(Boolean);
    const snaps = {};
    for (const item of list) {
      if (!item.listing?.id) continue;
      snaps[item.listing.id] = {
        price: item.snapshot_price ?? item.listing.price,
        status: item.snapshot_status ?? item.listing.status,
        title: item.listing.title,
        savedAt: item.saved_at,
      };
    }
    // Server is the source of truth. Locally-saved ids that the server
    // doesn't know about are almost always from another device where the
    // user already removed the save — do NOT resurrect them.
    const mergedSnaps = { ...snaps };
    writeIds(serverIds);
    writeSnaps(mergedSnaps);
    return { ok: true, count: serverIds.length };
  } catch (err) {
    return { ok: false, error: err };
  }
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

      // If the caller didn't pass the listing object, look it up from the
      // listings store so the price/status snapshot is always recorded.
      // Without this, "we'll notify you when the price changes" never works.
      const target = listing || getListing(id) || null;
      if (target) {
        const snaps = readSnaps();
        snaps[id] = {
          price: target.price,
          status: target.status,
          title: target.title,
          savedAt: new Date().toISOString(),
        };
        writeSnaps(snaps);
      }
      return { ok: true, saved: true };
    }
  } catch (err) {
    return { ok: false, error: err };
  }
}

export function useSavedIds() {
  const [ids, setIds] = useState(() => readIds());
  useEffect(() => {
    hydrateSavedFromApi().then(() => detectPriceDropsAsync().catch(() => {}));
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

export function saveSnapshot(listing) {
  if (!listing?.id) return;
  const snaps = readSnaps();
  snaps[listing.id] = {
    price: listing.price,
    status: listing.status,
    title: listing.title,
    savedAt: new Date().toISOString(),
  };
  writeSnaps(snaps);
}
export function removeSnapshot(id) {
  const snaps = readSnaps();
  delete snaps[id];
  writeSnaps(snaps);
}
export function saveSavedIds(ids) {
  writeIds(ids);
}


// ============================================================
// PRICE ALERTS
// Compare each saved snapshot's price against the current
// listing price. When the price drops, emit a local notification.
// ============================================================
import { notificationsApi } from "../api/notifications.js";

export async function detectPriceDropsAsync() {
  const snaps = readSnaps();
  const ids = Object.keys(snaps);
  if (ids.length === 0) return { ok: true, drops: [] };

  // Fetch current prices of all saved listings in one call
  let current = [];
  try {
    const d = await api.get(`/listings/?id__in=${ids.join(",")}&page_size=200`);
    current = Array.isArray(d) ? d : d?.results || [];
  } catch (err) {
    return { ok: false, error: err };
  }

  const drops = [];
  for (const l of current) {
    const snap = snaps[l.id];
    if (!snap) continue;
    const oldPrice = Number(snap.price) || 0;
    const newPrice = Number(l.price) || 0;
    if (oldPrice > 0 && newPrice > 0 && newPrice < oldPrice) {
      drops.push({
        listingId: l.id,
        title: l.title || snap.title || "",
        oldPrice,
        newPrice,
      });
    }
  }

  if (drops.length === 0) return { ok: true, drops: [] };

  // Emit a local notification for each drop (also reachable via the badge)
  const { notificationsApi: NA } = await import("../api/notifications.js");
  for (const d of drops) {
    try {
      await NA.create({
        notification_type: "PRICE_DROP",
        audience: "user",
        title: "Bei imeshuka! / Price dropped!",
        message: `${d.title}: TZS ${d.oldPrice.toLocaleString("en-US")} → TZS ${d.newPrice.toLocaleString("en-US")}`,
        related_object_type: "listing",
        related_object_id: d.listingId,
        action_url: `/mali/${d.listingId}`,
        priority: "normal",
      });
    } catch (e) {
      // Silent — will retry on next hydrate
      console.warn("[savedStore] price-drop notify failed:", e);
    }
  }

  // Update snapshots to the new prices so we don't alert twice
  const updated = { ...snaps };
  drops.forEach((d) => {
    updated[d.listingId] = { ...updated[d.listingId], price: d.newPrice };
  });
  writeSnaps(updated);

  return { ok: true, drops };
}

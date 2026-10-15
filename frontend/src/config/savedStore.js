// ============================================================
// savedStore.js — API-backed favourites.
// Endpoints (per backend guide):
//   GET    /saved/                     list my saves (paginated)
//   POST   /saved/                     {listing} — idempotent save
//   POST   /saved/toggle/              {listing} — flip; returns {saved, saved_ids, data}
//   DELETE /saved/listing/{listing_id}/ remove by listing id
//   DELETE /saved/{saved_id}/          remove by saved record id
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const IDS_KEY = "sokomkononi_saved_v1";
const SNAP_KEY = "sokomkononi_saved_snapshots_v1";
const EV = "sokomkononi:saved-updated";
const SNAP_EV = "sokomkononi:saved-snapshots-updated";

/* ── Storage helpers ─────────────────────────────────────── */
function readIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(IDS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [];
  } catch { return []; }
}
function writeIds(ids) {
  if (typeof window === "undefined") return;
  const unique = Array.from(new Set((ids || []).map(String)));
  window.localStorage.setItem(IDS_KEY, JSON.stringify(unique));
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
function dispatchToast(type, message) {
  try {
    window.dispatchEvent(
      new CustomEvent("sokomkononi:toast", { detail: { type, message } })
    );
  } catch { /* noop */ }
}
function isAuthed() {
  try { return Boolean(localStorage.getItem("sokomkononi_access")); }
  catch { return false; }
}

/* ── Sync reads ──────────────────────────────────────────── */
export function getSavedIds() { return readIds(); }
export function getSnapshots() { return readSnaps(); }
export function getSnapshot(id) { return readSnaps()[String(id)] || null; }
export function isSaved(id) { return readIds().some((x) => x === String(id)); }

/* ── Hydrate from API ────────────────────────────────────── */
let _hydratePromise = null;
export async function hydrateSavedFromApi() {
  if (_hydratePromise) return _hydratePromise;
  _hydratePromise = (async () => {
    if (!isAuthed()) {
      writeIds([]);
      writeSnaps({});
      return { ok: true, count: 0, source: "unauthenticated" };
    }
    try {
      const data = await api.get("/saved/?page_size=200");
      const list = Array.isArray(data) ? data : data?.results || [];
      const ids = [];
      const snaps = {};
      for (const item of list) {
        const listing = item?.listing || {};
        const lid = listing.id ?? item?.listing_id;
        if (lid == null) continue;
        ids.push(lid);
        snaps[String(lid)] = {
          price: item.snapshot_price ?? listing.price,
          status: item.snapshot_status ?? listing.status,
          title: item.snapshot_title ?? listing.title,
          savedAt: item.saved_at,
        };
      }
      writeIds(ids);
      writeSnaps(snaps);
      return { ok: true, count: ids.length, source: "api" };
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        writeIds([]);
        writeSnaps({});
        return { ok: true, count: 0, source: "unauthenticated" };
      }
      console.warn("[savedStore] hydrate failed:", err);
      return { ok: false, error: err, count: getSavedIds().length };
    } finally {
      _hydratePromise = null;
    }
  })();
  return _hydratePromise;
}

/* ═══════════════════════════════════════════════════════════
   TOGGLE — uses /toggle/ as primary, falls back gracefully
   ═══════════════════════════════════════════════════════════ */
export async function toggleSaved(id, listing = null) {
  if (id == null) return { ok: false, error: new Error("No listing id") };

  // ── Auth gate ────────────────────────────────────────────
  if (!isAuthed()) {
    dispatchToast("info",
      "Ingia kwanza ili kuhifadhi / Please log in to save listings.");
    return { ok: false, error: new Error("Not authenticated"), code: "NOT_AUTHENTICATED" };
  }

  const listingId = String(id);
  const before = readIds();
  const wasSaved = before.includes(listingId);

  // ── Optimistic flip ──────────────────────────────────────
  const next = wasSaved
    ? before.filter((x) => x !== listingId)
    : [...before, listingId];
  writeIds(next);

  // If we have a listing object, remember the snapshot immediately
  if (listing && !wasSaved) {
    const snaps = readSnaps();
    snaps[listingId] = {
      price: listing.price,
      status: listing.status,
      title: listing.title,
      savedAt: new Date().toISOString(),
    };
    writeSnaps(snaps);
  }

  // ── Call /toggle/ ────────────────────────────────────────
  try {
    const raw = await api.post("/saved/toggle/", { listing: Number(id) });

    // Backend returns:
    //   { saved: true|false, saved_ids?: [...], data?: {...} }
    const serverSaved = raw?.saved;

    // If the server explicitly tells us its full list, use it — this
    // heals any local drift (e.g. another device saved/unsaved).
    if (Array.isArray(raw?.saved_ids)) {
      writeIds(raw.saved_ids);
    } else if (typeof serverSaved === "boolean" && serverSaved !== !wasSaved) {
      // Server disagreed with our optimistic guess — correct it
      writeIds(
        serverSaved
          ? [...before, listingId]
          : before.filter((x) => x !== listingId)
      );
    }

    // Remove snapshot when unsaved
    if (serverSaved === false) {
      const snaps = readSnaps();
      delete snaps[listingId];
      writeSnaps(snaps);
    }

    return { ok: true, saved: !!serverSaved };
  } catch (err) {
    // ── Rollback on failure ────────────────────────────────
    writeIds(before);
    if (listing && !wasSaved) {
      // Undo snapshot
      const snaps = readSnaps();
      delete snaps[listingId];
      writeSnaps(snaps);
    }

    const status = err?.status;
    if (status === 401 || status === 403) {
      dispatchToast("info",
        "Kipindi kimeisha. Ingia tena / Session expired. Please log in again.");
      return { ok: false, error: err, code: "SESSION_EXPIRED" };
    }
    if (status === 404) {
      // Endpoint missing on backend — fall back to POST + DELETE
      return await toggleSavedFallback(id, listing, wasSaved, before);
    }
    if (status === 400) {
      const detail =
        err?.data?.detail ||
        err?.data?.error?.message ||
        (Array.isArray(err?.data?.listing) ? err.data.listing[0] : null) ||
        "Tangazo hili haliwezi kuhifadhiwa / This listing can't be saved.";
      dispatchToast("warning", detail);
      return { ok: false, error: err };
    }
    dispatchToast("error",
      err?.data?.detail || err?.message ||
      "Imeshindwa kuhifadhi. Jaribu tena / Could not save. Try again.");
    return { ok: false, error: err };
  }
}

/* ── Fallback path (only used if /toggle/ returns 404) ──── */
async function toggleSavedFallback(id, listing, wasSaved, before) {
  const listingId = String(id);
  try {
    if (wasSaved) {
      await api.delete(`/saved/listing/${id}/`);
      const snaps = readSnaps();
      delete snaps[listingId];
      writeSnaps(snaps);
    } else {
      await api.post("/saved/", { listing: Number(id) });
      if (listing) {
        const snaps = readSnaps();
        snaps[listingId] = {
          price: listing.price,
          status: listing.status,
          title: listing.title,
          savedAt: new Date().toISOString(),
        };
        writeSnaps(snaps);
      }
    }
    return { ok: true, saved: !wasSaved };
  } catch (err2) {
    writeIds(before);
    dispatchToast("error",
      err2?.data?.detail || err2?.message ||
      "Imeshindwa kuhifadhi. Jaribu tena / Could not save. Try again.");
    return { ok: false, error: err2 };
  }
}

/* ── Remove by listing id (dedicated, idempotent) ────────── */
export async function removeSavedAsync(id) {
  if (id == null) return { ok: false, error: new Error("No listing id") };
  if (!isAuthed()) return { ok: false, error: new Error("Not authenticated") };

  const listingId = String(id);
  const before = readIds();
  writeIds(before.filter((x) => x !== listingId));
  const snaps = readSnaps();
  delete snaps[listingId];
  writeSnaps(snaps);

  try {
    await api.delete(`/saved/listing/${id}/`);
    return { ok: true };
  } catch (err) {
    // Treat 404 as success — already removed
    if (err?.status === 404) return { ok: true };
    writeIds(before);
    return { ok: false, error: err };
  }
}

/* ── Snapshots ───────────────────────────────────────────── */
export function saveSnapshot(listing) {
  if (!listing?.id) return;
  const snaps = readSnaps();
  snaps[String(listing.id)] = {
    price: listing.price,
    status: listing.status,
    title: listing.title,
    savedAt: new Date().toISOString(),
  };
  writeSnaps(snaps);
}
export function removeSnapshot(id) {
  const snaps = readSnaps();
  delete snaps[String(id)];
  writeSnaps(snaps);
}

/* ═══════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════ */
export function useSavedIds() {
  const [ids, setIds] = useState(() => readIds());

  useEffect(() => {
    // Hydrate once on mount if logged in
    if (isAuthed()) hydrateSavedFromApi();

    const sync = () => setIds(readIds());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);

    // Re-hydrate when the tab regains focus (catches other devices)
    const onVisible = () => { if (!document.hidden && isAuthed()) hydrateSavedFromApi(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
      document.removeEventListener("visibilitychange", onVisible);
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

export function useIsSaved(id) {
  const ids = useSavedIds();
  if (id == null) return false;
  return ids.some((x) => x === String(id));
}

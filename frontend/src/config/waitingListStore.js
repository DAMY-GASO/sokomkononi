// ============================================================
// waitingListStore.js — API-only via /api/waiting-list/
// ============================================================
import { useEffect, useState } from "react";
import { waitingListApi } from "../api/waitingList.js";

const KEY = "sokomkononi_waiting_list_v1";
const EV = "sokomkononi:waiting-list-updated";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}
function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}
function norm(raw) {
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
    position: raw.position ?? null,
    joinedAt: raw.joined_at,
    notifiedAt: raw.notified_at,
    respondBy: raw.respond_by,
    updatedAt: raw.updated_at,
  };
}

export function getWaitingList() {
  return read();
}
export function getWaitingListEntry(id) {
  return read().find((e) => e.id === id) || null;
}
export function getWaitingListForListing(id) {
  return read().filter((e) => e.listingId === id);
}

export async function hydrateWaitingListFromApi() {
  try {
    const data = await waitingListApi.mine();
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(norm).filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function joinWaitingListAsync(listingId) {
  if (!listingId) return { ok: false, error: new Error("listingId required") };
  try {
    const raw = await waitingListApi.join(listingId);
    const created = norm(raw);
    const current = read().filter((e) => e.listingId !== listingId);
    if (created) write([created, ...current]);
    return { ok: true, entry: created };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function leaveWaitingListAsync(id) {
  try {
    await waitingListApi.leave(id);
    write(read().filter((e) => e.id !== id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// Backwards-compat shim: now forwards to the async version.
export function joinWaitingList(listingId) {
  return joinWaitingListAsync(listingId);
}
export function leaveWaitingList(id) {
  return leaveWaitingListAsync(id);
}

export function useWaitingList() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateWaitingListFromApi();
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
export function useWaitingListForListing(id) {
  const list = useWaitingList();
  return id ? list.filter((e) => e.listingId === id) : [];
}
export function useWaitingListCount() {
  return useWaitingList().length;
}


// ============================================================
// RESERVATION EXPIRY WATCH (Option A: notify first in queue)
// The backend is the source of truth for expiry. This helper
// simply nudges the backend when a reservation has expired
// (idempotent), then refetches the list.
// ============================================================
import { api } from "../api/client";
import { transactionsApi } from "../api/transactions.js";

export async function expireStaleReservationsAsync() {
  try {
    const data = await waitingListApi.mine();
    const list = Array.isArray(data) ? data : data?.results || [];
    const now = Date.now();

    let anyExpired = false;
    for (const item of list) {
      if (item.status !== "WAITING" && item.status !== "NOTIFIED") continue;
      if (!item.listing) continue;
      const listingStatus = String(item.listing.status || "").toUpperCase();
      if (listingStatus !== "RESERVED") continue;
      const expiresAt = item.listing.reservation_expires_at;
      if (!expiresAt) continue;
      if (new Date(expiresAt).getTime() > now) continue;

      // Nudge the backend to release the reservation and advance the queue.
      try {
        // Preferred endpoint if your backend exposes one:
        // POST /listings/{id}/release-reservation/
        await api.post(`/listings/${item.listing.id}/release-reservation/`, {});
        anyExpired = true;
      } catch (e) {
        // Fallback: try transaction-level expire (already exists)
        const txId = item.listing.active_transaction_id;
        if (txId) {
          try {
            await transactionsApi.expireReservation(txId);
            anyExpired = true;
          } catch { /* give up, try again next cycle */ }
        }
      }
    }

    if (anyExpired) {
      await hydrateWaitingListFromApi();
      return { ok: true, changed: true };
    }
    return { ok: true, changed: false };
  } catch (err) {
    return { ok: false, error: err };
  }
}

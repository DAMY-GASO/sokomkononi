// ============================================================
// moderationStore.js — API-only via /api/listings/admin/
// ============================================================
import { useEffect, useState } from "react";
import { moderationApi } from "../api/moderation.js";
import { normalizeListingFromApi } from "./listingsStore.js";

const KEY = "sokomkononi_moderation_queue_v1";
const DEC_KEY = "sokomkononi_moderation_decisions_v1";
const EV = "sokomkononi:moderation-updated";
const DEC_EV = "sokomkononi:moderation-decisions-updated";

function read(key, fb = []) {
  if (typeof window === "undefined") return fb;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fb;
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : fb;
  } catch { return fb; }
}
function write(key, event, list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new Event(event));
}

export function getModerationQueue() { return read(KEY); }
export function getModerationDecisions() { return read(DEC_KEY); }
export function getDecisionForListing(id) { return getModerationDecisions().find((d) => d.listingId === id) || null; }

export async function hydrateModerationQueueFromApi() {
  try {
    const data = await moderationApi.pendingListings();
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeListingFromApi).filter(Boolean);
    write(KEY, EV, normalized);
    return { ok: true, count: normalized.length };
  } catch (err) { return { ok: false, error: err }; }
}

function recordDecision(entry) {
  const next = [{ ...entry, id: `dec_${Date.now()}`, at: new Date().toISOString() }, ...getModerationDecisions()].slice(0, 500);
  write(DEC_KEY, DEC_EV, next);
}

export async function approveListingFromQueueAsync(listingId, { adminName = "Admin" } = {}) {
  const target = getModerationQueue().find((l) => l.id === listingId);
  if (!target) return { ok: false, error: new Error("Listing not in queue") };
  try {
    await moderationApi.approve(listingId);
    write(KEY, EV, getModerationQueue().filter((l) => l.id !== listingId));
    recordDecision({ listingId, listingTitle: target.title, action: "approved", adminName });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function rejectListingFromQueueAsync(listingId, reason, { adminName = "Admin" } = {}) {
  if (!reason) return { ok: false, error: new Error("Reason required") };
  const target = getModerationQueue().find((l) => l.id === listingId);
  if (!target) return { ok: false, error: new Error("Listing not in queue") };
  try {
    await moderationApi.reject(listingId, reason);
    write(KEY, EV, getModerationQueue().filter((l) => l.id !== listingId));
    recordDecision({ listingId, listingTitle: target.title, action: "rejected", reason, adminName });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function bulkApproveAsync(ids, opts) {
  const results = await Promise.allSettled(ids.map((id) => approveListingFromQueueAsync(id, opts)));
  const succeeded = [], failed = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.ok) succeeded.push(ids[i]);
    else failed.push({ listingId: ids[i], error: r.value?.error || r.reason });
  });
  return { ok: failed.length === 0, succeeded, failed };
}
export async function bulkRejectAsync(ids, reason, opts) {
  if (!reason) return { ok: false, error: new Error("Reason required"), succeeded: [], failed: [] };
  const results = await Promise.allSettled(ids.map((id) => rejectListingFromQueueAsync(id, reason, opts)));
  const succeeded = [], failed = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.ok) succeeded.push(ids[i]);
    else failed.push({ listingId: ids[i], error: r.value?.error || r.reason });
  });
  return { ok: failed.length === 0, succeeded, failed };
}

export function getModerationStats() {
  const d = getModerationDecisions();
  const today = new Date().toISOString().slice(0, 10);
  const td = d.filter((x) => x.at.startsWith(today));
  return {
    totalDecisions: d.length,
    approved: d.filter((x) => x.action === "approved").length,
    rejected: d.filter((x) => x.action === "rejected").length,
    todayApproved: td.filter((x) => x.action === "approved").length,
    todayRejected: td.filter((x) => x.action === "rejected").length,
    queueSize: getModerationQueue().length,
  };
}

export function clearDecisions() { write(DEC_KEY, DEC_EV, []); }

export function useModerationQueue() {
  const [q, setQ] = useState(() => getModerationQueue());
  useEffect(() => {
    hydrateModerationQueueFromApi();
    const sync = () => setQ(getModerationQueue());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return q;
}
export function useModerationDecisions() {
  const [d, setD] = useState(() => getModerationDecisions());
  useEffect(() => {
    const sync = () => setD(getModerationDecisions());
    window.addEventListener("storage", sync);
    window.addEventListener(DEC_EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(DEC_EV, sync);
    };
  }, []);
  return d;
}
export function usePendingModerationCount() { return useModerationQueue().length; }

// LEGACY (compat shims)
export const SEED_QUEUE = [];
export const SEED_DECISIONS = [];

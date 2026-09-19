// ============================================================
// moderationStore.js — API-backed via /api/listings/admin/
// Inalenga admin workflows: pending queue, bulk actions, stats.
//
// Kwa approve/reject ya listing moja, tumia listingsStore
// (approveListingAsync / rejectListingAsync) — zina rollback.
// ============================================================

import { useEffect, useState, useMemo } from "react";
import { moderationApi } from "../api/moderation.js";
import { listingsApi } from "../api/listings.js";
import {
  normalizeListingFromApi,
  updateListing,
  getListings,
} from "./listingsStore.js";

const STORAGE_KEY = "sokomkononi_moderation_queue_v1";
const DECISIONS_KEY = "sokomkononi_moderation_decisions_v1";
const UPDATE_EVENT = "sokomkononi:moderation-updated";
const DECISIONS_EVENT = "sokomkononi:moderation-decisions-updated";

export const SEED_QUEUE = [];
export const SEED_DECISIONS = [];

// ============================================================
// STORAGE
// ============================================================
function readFromStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveAll(key, event, list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new Event(event));
}

// ============================================================
// READS
// ============================================================
export function getModerationQueue() {
  return readFromStorage(STORAGE_KEY, SEED_QUEUE);
}

export function getModerationDecisions() {
  return readFromStorage(DECISIONS_KEY, SEED_DECISIONS);
}

export function getDecisionForListing(listingId) {
  return getModerationDecisions().find((d) => d.listingId === listingId) || null;
}

// ============================================================
// HYDRATE
// ============================================================
export async function hydrateModerationQueueFromApi() {
  try {
    const data = await moderationApi.pendingListings();
    const rawList = Array.isArray(data) ? data : data?.results || [];
    const normalized = rawList.map(normalizeListingFromApi).filter(Boolean);
    saveAll(STORAGE_KEY, UPDATE_EVENT, normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[moderationStore] hydrate queue failed:", err);
    return { source: "error", count: getModerationQueue().length };
  }
}

// ============================================================
// DECISIONS LOG — hifadhi history ya decisions
// ============================================================
function recordDecision(listingId, listingTitle, action, reason = "", adminName = "Admin") {
  const entry = {
    id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    listingId,
    listingTitle,
    action, // "approved" | "rejected"
    reason,
    adminName,
    at: new Date().toISOString(),
  };
  const previous = getModerationDecisions();
  saveAll(DECISIONS_KEY, DECISIONS_EVENT, [entry, ...previous].slice(0, 500));
  return entry;
}

// ============================================================
// ASYNC ACTIONS — with rollback
// ============================================================

/**
 * Approve listing kutoka kwenye moderation queue.
 * Ina-update queue, listingsStore, na decisions log.
 */
export async function approveListingFromQueueAsync(listingId, { adminName = "Admin" } = {}) {
  const queue = getModerationQueue();
  const target = queue.find((l) => l.id === listingId);
  if (!target) return { ok: false, error: new Error("Listing haipo kwenye queue") };

  const previousQueue = queue;

  // Optimistic: ondoa kwenye queue
  saveAll(STORAGE_KEY, UPDATE_EVENT, queue.filter((l) => l.id !== listingId));

  try {
    await moderationApi.approve(listingId);

    // Sasisha listingsStore pia
    updateListing(listingId, {
      status: "live",
      approvedAt: new Date().toISOString(),
      rejectionReason: "",
    });

    // Rekodi decision
    recordDecision(listingId, target.title, "approved", "", adminName);

    return { ok: true };
  } catch (err) {
    saveAll(STORAGE_KEY, UPDATE_EVENT, previousQueue); // Rollback
    console.warn("[moderationStore] approve failed:", err);
    return { ok: false, error: err };
  }
}

/**
 * Reject listing kutoka kwenye moderation queue.
 */
export async function rejectListingFromQueueAsync(listingId, reason = "", { adminName = "Admin" } = {}) {
  if (!reason) {
    return { ok: false, error: new Error("Sababu ya kukataa inahitajika") };
  }

  const queue = getModerationQueue();
  const target = queue.find((l) => l.id === listingId);
  if (!target) return { ok: false, error: new Error("Listing haipo kwenye queue") };

  const previousQueue = queue;

  saveAll(STORAGE_KEY, UPDATE_EVENT, queue.filter((l) => l.id !== listingId));

  try {
    await moderationApi.reject(listingId, reason);

    updateListing(listingId, {
      status: "rejected",
      rejectionReason: reason,
      rejectedAt: new Date().toISOString(),
    });

    recordDecision(listingId, target.title, "rejected", reason, adminName);

    return { ok: true };
  } catch (err) {
    saveAll(STORAGE_KEY, UPDATE_EVENT, previousQueue); // Rollback
    console.warn("[moderationStore] reject failed:", err);
    return { ok: false, error: err };
  }
}

/**
 * Bulk approve — inarudisha { ok, succeeded, failed }.
 */
export async function bulkApproveAsync(listingIds, { adminName = "Admin" } = {}) {
  const results = await Promise.allSettled(
    listingIds.map((id) => approveListingFromQueueAsync(id, { adminName }))
  );

  const succeeded = [];
  const failed = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.ok) {
      succeeded.push(listingIds[i]);
    } else {
      failed.push({
        listingId: listingIds[i],
        error: r.status === "fulfilled" ? r.value.error : r.reason,
      });
    }
  });

  return { ok: failed.length === 0, succeeded, failed };
}

/**
 * Bulk reject — inarudisha { ok, succeeded, failed }.
 */
export async function bulkRejectAsync(listingIds, reason, { adminName = "Admin" } = {}) {
  if (!reason) return { ok: false, error: new Error("Sababu inahitajika"), succeeded: [], failed: [] };

  const results = await Promise.allSettled(
    listingIds.map((id) => rejectListingFromQueueAsync(id, reason, { adminName }))
  );

  const succeeded = [];
  const failed = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.ok) {
      succeeded.push(listingIds[i]);
    } else {
      failed.push({
        listingId: listingIds[i],
        error: r.status === "fulfilled" ? r.value.error : r.reason,
      });
    }
  });

  return { ok: failed.length === 0, succeeded, failed };
}

// ============================================================
// STATS
// ============================================================
export function getModerationStats() {
  const decisions = getModerationDecisions();
  const today = new Date().toISOString().slice(0, 10);
  const todayDecisions = decisions.filter((d) => d.at.startsWith(today));

  return {
    totalDecisions: decisions.length,
    approved: decisions.filter((d) => d.action === "approved").length,
    rejected: decisions.filter((d) => d.action === "rejected").length,
    todayApproved: todayDecisions.filter((d) => d.action === "approved").length,
    todayRejected: todayDecisions.filter((d) => d.action === "rejected").length,
    queueSize: getModerationQueue().length,
  };
}

// ============================================================
// CLEAR
// ============================================================
export function clearDecisions() {
  saveAll(DECISIONS_KEY, DECISIONS_EVENT, []);
  return [];
}

// ============================================================
// HOOKS
// ============================================================
export function useModerationQueue() {
  const [queue, setQueue] = useState(() => getModerationQueue());

  useEffect(() => {
    hydrateModerationQueueFromApi();
    const sync = () => setQueue(getModerationQueue());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return queue;
}

export function useModerationDecisions() {
  const [decisions, setDecisions] = useState(() => getModerationDecisions());

  useEffect(() => {
    const sync = () => setDecisions(getModerationDecisions());
    window.addEventListener("storage", sync);
    window.addEventListener(DECISIONS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(DECISIONS_EVENT, sync);
    };
  }, []);

  return decisions;
}

export function useModerationStats() {
  const decisions = useModerationDecisions();
  const queue = useModerationQueue();

  return useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayDecisions = decisions.filter((d) => d.at.startsWith(today));

    return {
      totalDecisions: decisions.length,
      approved: decisions.filter((d) => d.action === "approved").length,
      rejected: decisions.filter((d) => d.action === "rejected").length,
      todayApproved: todayDecisions.filter((d) => d.action === "approved").length,
      todayRejected: todayDecisions.filter((d) => d.action === "rejected").length,
      queueSize: queue.length,
    };
  }, [decisions, queue]);
}

export function usePendingModerationCount() {
  return useModerationQueue().length;
}

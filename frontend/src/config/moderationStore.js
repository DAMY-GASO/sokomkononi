import { useEffect, useState } from "react";
import { moderationApi } from "../api/moderation.js";
import { normalizeListingFromApi, decideListing, removeListing } from "./listingsStore.js";

const KEY = "sokomkononi_moderation_queue_v1";
const DEC_KEY = "sokomkononi_moderation_decisions_v1";
const EV = "sokomkononi:moderation-updated";
const DEC_EV = "sokomkononi:moderation-decisions-updated";

const sameId = (a, b) => String(a) === String(b);

function read(key, fb = []) {
  if (typeof window === "undefined") return fb;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fb;
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : fb;
  } catch {
    return fb;
  }
}

function write(key, event, list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.warn("[moderationStore] storage write failed:", err);
  }
  window.dispatchEvent(new Event(event));
}

export function getModerationQueue() {
  return read(KEY);
}
export function getModerationDecisions() {
  return read(DEC_KEY);
}
export function getDecisionForListing(id) {
  return getModerationDecisions().find((d) => sameId(d.listingId, id)) || null;
}

function findInQueue(id) {
  return getModerationQueue().find((l) => sameId(l.id, id)) || null;
}
function removeFromQueue(id) {
  write(KEY, EV, getModerationQueue().filter((l) => !sameId(l.id, id)));
}

// ── Hydrate (dedupe: ikiwa inaendelea, rudisha promise ileile) ──
let hydrateInflight = null;

async function runHydrate() {
  try {
    const data = await moderationApi.pendingListings();
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list
      .map((r) => normalizeListingFromApi(r, "in_review"))
      .filter(Boolean);
    write(KEY, EV, normalized);
    return { ok: true, count: normalized.length };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export function hydrateModerationQueueFromApi() {
  if (hydrateInflight) return hydrateInflight;
  hydrateInflight = runHydrate().finally(() => {
    hydrateInflight = null;
  });
  return hydrateInflight;
}

// ── Decisions ───────────────────────────────────────────────
function recordDecision(entry) {
  const next = [
    { ...entry, id: `dec_${Date.now()}`, at: new Date().toISOString() },
    ...getModerationDecisions(),
  ].slice(0, 500);
  write(DEC_KEY, DEC_EV, next);
}

// ============================================================
// APPROVE — idhinisha listing
// ============================================================
export async function approveListingFromQueueAsync(listingId, { adminName = "Admin" } = {}) {
  const target = findInQueue(listingId);
  if (!target) return { ok: false, error: new Error("Listing not in queue") };
  try {
    await moderationApi.approve(listingId);
  } catch (err) {
    hydrateModerationQueueFromApi();
    return { ok: false, error: err };
  }
  removeFromQueue(listingId);
  decideListing(target.id, "live");
  recordDecision({
    listingId: target.id,
    listingTitle: target.title,
    action: "approved",
    adminName,
  });
  return {
    ok: true,
    listing: {
      ...target,
      status: "live",
      approvedAt: new Date().toISOString(),
      rejectionReason: "",
    },
  };
}

// ============================================================
// REJECT — kataa listing
// ============================================================
export async function rejectListingFromQueueAsync(
  listingId,
  reason,
  { adminName = "Admin" } = {}
) {
  const cleanReason = (reason || "").trim();
  if (!cleanReason) return { ok: false, error: new Error("Reason required") };
  const target = findInQueue(listingId);
  if (!target) return { ok: false, error: new Error("Listing not in queue") };
  try {
    await moderationApi.reject(listingId, cleanReason);
  } catch (err) {
    hydrateModerationQueueFromApi();
    return { ok: false, error: err };
  }
  removeFromQueue(listingId);
  decideListing(target.id, "rejected", cleanReason);
  recordDecision({
    listingId: target.id,
    listingTitle: target.title,
    action: "rejected",
    reason: cleanReason,
    adminName,
  });
  return {
    ok: true,
    listing: {
      ...target,
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      rejectionReason: cleanReason,
    },
  };
}

// ============================================================
// DISAPPROVE — rudisha listing iliyoidhinishwa kuwa rejected
// (kama admin alikosea kuapprove)
// ============================================================
export async function disapproveListingAsync(
  listingId,
  reason = "",
  { adminName = "Admin" } = {}
) {
  const cleanReason = (reason || "").trim() || "Disapproved by admin";

  // Jaribu endpoint maalum
  try {
    await moderationApi.disapprove(listingId, cleanReason);
  } catch (err) {
    // Fallback: tumia reject
    if (err?.status === 404 || err?.status === 405) {
      console.warn("[moderationStore] /disapprove/ haipo — tumia reject");
      try {
        await moderationApi.reject(listingId, cleanReason);
      } catch (fallbackErr) {
        return { ok: false, error: fallbackErr };
      }
    } else {
      return { ok: false, error: err };
    }
  }

  // Sasisha cache ya listingsStore
  decideListing(listingId, "rejected", cleanReason);

  recordDecision({
    listingId,
    action: "disapproved",
    reason: cleanReason,
    adminName,
  });

  return {
    ok: true,
    listing: {
      id: listingId,
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      rejectionReason: cleanReason,
    },
  };
}

// ============================================================
// DELETE — futa listing kabisa (kwa scam)
// ============================================================
export async function deleteListingFromModerationAsync(
  listingId,
  reason = "",
  { adminName = "Admin" } = {}
) {
  const cleanReason = (reason || "").trim();

  // Jaribu endpoint maalum ya moderation
  try {
    await moderationApi.delete(listingId, cleanReason);
  } catch (err) {
    // Fallback: tumia listingsApi.remove
    if (err?.status === 404 || err?.status === 405) {
      console.warn("[moderationStore] /delete/ haipo — tumia listingsApi");
      try {
        const { listingsApi } = await import("../api/listings.js");
        await listingsApi.remove(listingId);
      } catch (fallbackErr) {
        return { ok: false, error: fallbackErr };
      }
    } else {
      return { ok: false, error: err };
    }
  }

  // Ondoa kwenye cache zote
  removeFromQueue(listingId);
  try {
    removeListing(listingId);
  } catch { /* ignore */ }

  recordDecision({
    listingId,
    action: "deleted",
    reason: cleanReason,
    adminName,
  });

  return { ok: true };
}

// ── Bulk ────────────────────────────────────────────────────
function settle(results, ids) {
  const succeeded = [];
  const failed = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.ok) succeeded.push(ids[i]);
    else failed.push({ listingId: ids[i], error: r.value?.error || r.reason });
  });
  return { ok: failed.length === 0, succeeded, failed };
}

export async function bulkApproveAsync(ids, opts) {
  const results = await Promise.allSettled(
    ids.map((id) => approveListingFromQueueAsync(id, opts))
  );
  return settle(results, ids);
}

export async function bulkRejectAsync(ids, reason, opts) {
  if (!(reason || "").trim()) {
    return { ok: false, error: new Error("Reason required"), succeeded: [], failed: [] };
  }
  const results = await Promise.allSettled(
    ids.map((id) => rejectListingFromQueueAsync(id, reason, opts))
  );
  return settle(results, ids);
}

export async function bulkDisapproveAsync(ids, reason, opts) {
  const results = await Promise.allSettled(
    ids.map((id) => disapproveListingAsync(id, reason, opts))
  );
  return settle(results, ids);
}

export async function bulkDeleteAsync(ids, reason, opts) {
  const results = await Promise.allSettled(
    ids.map((id) => deleteListingFromModerationAsync(id, reason, opts))
  );
  return settle(results, ids);
}

// ── Stats ───────────────────────────────────────────────────
const localDay = (iso) => new Date(iso).toLocaleDateString("en-CA");

export function getModerationStats() {
  const d = getModerationDecisions();
  const today = new Date().toLocaleDateString("en-CA");
  const td = d.filter((x) => localDay(x.at) === today);
  return {
    totalDecisions: d.length,
    approved: d.filter((x) => x.action === "approved").length,
    rejected: d.filter((x) => x.action === "rejected").length,
    disapproved: d.filter((x) => x.action === "disapproved").length,
    deleted: d.filter((x) => x.action === "deleted").length,
    todayApproved: td.filter((x) => x.action === "approved").length,
    todayRejected: td.filter((x) => x.action === "rejected").length,
    queueSize: getModerationQueue().length,
  };
}

export function clearDecisions() {
  write(DEC_KEY, DEC_EV, []);
}

// ── Hooks ───────────────────────────────────────────────────
export function useModerationQueue({ hydrate = true } = {}) {
  const [q, setQ] = useState(() => getModerationQueue());
  useEffect(() => {
    if (hydrate) hydrateModerationQueueFromApi();
    const sync = () => setQ(getModerationQueue());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, [hydrate]);
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

export function usePendingModerationCount() {
  return useModerationQueue().length;
}
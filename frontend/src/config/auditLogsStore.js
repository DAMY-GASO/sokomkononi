// ============================================================
// auditLogsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Audit Logs.
//
// Kila action ya Admin ina-log:
//   - Nani (adminName)
//   - Lini (at)
//   - Nini (action)
//   - Kwenye nini (target — listing, user, n.k.)
//   - Maelezo (details)
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useAuditLogs) hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_audit_logs_v1";
const UPDATE_EVENT = "sokomkononi:audit-logs-updated";
const MAX_LOGS = 500;

// ============================================================
// ACTION TYPES — aina za actions zinazoweza ku-log
// ============================================================
export const AUDIT_ACTIONS = [
  { key: "listing.approved", label: { sw: "Idhinisha Mali", en: "Approve Listing" }, color: "green" },
  { key: "listing.rejected", label: { sw: "Kataa Mali", en: "Reject Listing" }, color: "rust" },
  { key: "user.suspended", label: { sw: "Simamisha Mtumiaji", en: "Suspend User" }, color: "rust" },
  { key: "user.activated", label: { sw: "Washa Mtumiaji", en: "Activate User" }, color: "green" },
  { key: "verification.approved", label: { sw: "Idhinisha Uthibitisho", en: "Approve Verification" }, color: "green" },
  { key: "verification.rejected", label: { sw: "Kataa Uthibitisho", en: "Reject Verification" }, color: "rust" },
  { key: "dispute.resolved", label: { sw: "Tatua Mgogoro", en: "Resolve Dispute" }, color: "gold" },
  { key: "fee.updated", label: { sw: "Badilisha Ada", en: "Update Fee" }, color: "gold" },
  { key: "category.created", label: { sw: "Ongeza Kategoria", en: "Create Category" }, color: "green" },
  { key: "category.updated", label: { sw: "Badilisha Kategoria", en: "Update Category" }, color: "gold" },
  { key: "category.deleted", label: { sw: "Futa Kategoria", en: "Delete Category" }, color: "rust" },
  { key: "announcement.sent", label: { sw: "Tuma Tangazo", en: "Send Announcement" }, color: "gold" },
  { key: "refund.issued", label: { sw: "Toa Refund", en: "Issue Refund" }, color: "rust" },
  { key: "subadmin.added", label: { sw: "Ongeza Sub-Admin", en: "Add Sub-Admin" }, color: "green" },
  { key: "subadmin.removed", label: { sw: "Ondoa Sub-Admin", en: "Remove Sub-Admin" }, color: "rust" },
];

// ============================================================
// SEED — tupu
// ============================================================
export const SEED_AUDIT_LOGS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_AUDIT_LOGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_AUDIT_LOGS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_AUDIT_LOGS;
    return parsed;
  } catch {
    return SEED_AUDIT_LOGS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  const trimmed = list.slice(0, MAX_LOGS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// HELPERS
// ============================================================

/** Soma logs zote. */
export function getAuditLogs() {
  return readFromStorage();
}

/**
 * Ongeza log mpya.
 * @param {Object} log - { action, adminName, target, targetId, details }
 */
export function addAuditLog({
  action,
  adminName = "Admin",
  target = "",
  targetId = null,
  details = "",
}) {
  const entry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    action,
    adminName,
    target,
    targetId,
    details,
    at: new Date().toISOString(),
  };
  const next = [entry, ...getAuditLogs()];
  saveAll(next);
  return entry;
}

/** Ondoa log moja. */
export function removeAuditLog(id) {
  const next = getAuditLogs().filter((l) => l.id !== id);
  saveAll(next);
  return next;
}

/** Futa logs zote. */
export function clearAuditLogs() {
  saveAll([]);
  return [];
}

// ============================================================
// HOOKS
// ============================================================

/** Hook: logs zote. */
export function useAuditLogs() {
  const [logs, setLogs] = useState(() => getAuditLogs());

  useEffect(() => {
    const sync = () => setLogs(getAuditLogs());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return logs;
}

/** Idadi ya logs. */
export function useAuditLogsCount() {
  return useAuditLogs().length;
}

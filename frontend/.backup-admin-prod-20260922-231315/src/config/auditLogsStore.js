// ============================================================
// auditLogsStore.js — API-backed via /api/audit/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_audit_logs_v1";
const UPDATE_EVENT = "sokomkononi:audit-logs-updated";

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

export const SEED_AUDIT_LOGS = [];

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return SEED_AUDIT_LOGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_AUDIT_LOGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_AUDIT_LOGS;
  } catch {
    return SEED_AUDIT_LOGS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 500)));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function normalizeFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    action: raw.action,
    adminName: raw.admin_name || "Admin",
    target: raw.target || "",
    targetId: raw.target_id,
    details: raw.details || "",
    at: raw.created_at,
  };
}

// ============================================================
// READS
// ============================================================
export function getAuditLogs() {
  return readFromStorage();
}

export function saveAuditLogs(list) {
  saveAll(list);
}

// ============================================================
// HYDRATE
// ============================================================
export async function hydrateAuditLogsFromApi() {
  try {
    const data = await api.get("/audit/?page_size=200");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeFromApi).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[auditLogsStore] hydrate failed:", err);
    return { source: "error", count: getAuditLogs().length };
  }
}

// ============================================================
// ASYNC ACTIONS — with rollback
// ============================================================
export async function removeAuditLogAsync(id) {
  const previous = getAuditLogs();
  const target = previous.find((l) => l.id === id);
  if (!target) return { ok: false, error: new Error("Log haipo") };

  // Optimistic
  saveAll(previous.filter((l) => l.id !== id));

  if (typeof id !== "number") return { ok: true };

  try {
    await api.delete(`/audit/${id}/`);
    return { ok: true };
  } catch (err) {
    saveAll(previous); // Rollback
    console.warn("[auditLogsStore] remove failed:", err);
    return { ok: false, error: err };
  }
}

export async function clearAuditLogsAsync() {
  const previous = getAuditLogs();
  saveAll([]);

  try {
    await api.post("/audit/clear/", {});
    return { ok: true };
  } catch (err) {
    saveAll(previous); // Rollback
    console.warn("[auditLogsStore] clearAll failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// LEGACY SYNC (deprecated)
// ============================================================
export function addAuditLog() {}

/** @deprecated Use removeAuditLogAsync */
export function removeAuditLog(id) {
  const next = getAuditLogs().filter((l) => l.id !== id);
  saveAll(next);
  if (typeof id === "number") {
    api.delete(`/audit/${id}/`).catch(() => {});
  }
  return next;
}

/** @deprecated Use clearAuditLogsAsync */
export function clearAuditLogs() {
  saveAll([]);
  api.post("/audit/clear/", {}).catch(() => {});
  return [];
}

// ============================================================
// HOOKS
// ============================================================
export function useAuditLogs() {
  const [logs, setLogs] = useState(() => getAuditLogs());
  useEffect(() => {
    hydrateAuditLogsFromApi();
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

export function useAuditLogsCount() {
  return useAuditLogs().length;
}

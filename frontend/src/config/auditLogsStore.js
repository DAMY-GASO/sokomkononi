// ============================================================
// auditLogsStore.js — API-only via /api/audit/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_audit_logs_v1";
const EV = "sokomkononi:audit-logs-updated";

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
];

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}
function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 500)));
  window.dispatchEvent(new Event(EV));
}
function norm(raw) {
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

export function getAuditLogs() { return read(); }

export async function hydrateAuditLogsFromApi() {
  try {
    const d = await api.get("/audit/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    write(list.map(norm).filter(Boolean));
    return { ok: true, count: list.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeAuditLogAsync(id) {
  try {
    await api.delete(`/audit/${id}/`);
    write(read().filter((l) => l.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function clearAuditLogsAsync() {
  try {
    await api.post("/audit/clear/", {});
    write([]);
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function useAuditLogs() {
  const [logs, setLogs] = useState(() => read());
  useEffect(() => {
    hydrateAuditLogsFromApi();
    const sync = () => setLogs(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return logs;
}
export function useAuditLogsCount() { return useAuditLogs().length; }

// LEGACY (compat shims)
export const SEED_AUDIT_LOGS = [];
export function saveAuditLogs() {}
export function removeAuditLog() {}
export function clearAuditLogs() {}
export function addAuditLog() {}

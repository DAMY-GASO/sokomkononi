// ============================================================
// auditLogsStore.js — API-only via /api/audit/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { guarded } from "./hydrateGuard.js";

const KEY = "sokomkononi_audit_logs_v1";
const EV = "sokomkononi:audit-logs-updated";

export const AUDIT_ACTIONS = [
  // Listings
  { key: "listing.approved", label: { sw: "Idhinisha Mali", en: "Approve Listing" }, color: "green" },
  { key: "listing.rejected", label: { sw: "Kataa Mali", en: "Reject Listing" }, color: "rust" },
  { key: "listing.deleted", label: { sw: "Futa Mali", en: "Delete Listing" }, color: "rust" },
  { key: "listing.restored", label: { sw: "Rejesha Mali", en: "Restore Listing" }, color: "green" },

  // Users
  { key: "user.suspended", label: { sw: "Simamisha Mtumiaji", en: "Suspend User" }, color: "rust" },
  { key: "user.activated", label: { sw: "Washa Mtumiaji", en: "Activate User" }, color: "green" },
  { key: "user.verified", label: { sw: "Thibitisha Mtumiaji", en: "Verify User" }, color: "green" },
  { key: "user.deleted", label: { sw: "Futa Mtumiaji", en: "Delete User" }, color: "rust" },

  // Verifications
  { key: "verification.approved", label: { sw: "Idhinisha Uthibitisho", en: "Approve Verification" }, color: "green" },
  { key: "verification.rejected", label: { sw: "Kataa Uthibitisho", en: "Reject Verification" }, color: "rust" },

  // Deals / Disputes
  { key: "dispute.resolved", label: { sw: "Tatua Mgogoro", en: "Resolve Dispute" }, color: "gold" },
  { key: "deal.cancelled", label: { sw: "Ghairi Deal", en: "Cancel Deal" }, color: "rust" },
  { key: "refund.issued", label: { sw: "Toa Refund", en: "Issue Refund" }, color: "gold" },

  // Fees
  { key: "fee.updated", label: { sw: "Badilisha Ada", en: "Update Fee" }, color: "gold" },

  // Categories
  { key: "category.created", label: { sw: "Ongeza Kategoria", en: "Create Category" }, color: "green" },
  { key: "category.updated", label: { sw: "Badilisha Kategoria", en: "Update Category" }, color: "gold" },
  { key: "category.deleted", label: { sw: "Futa Kategoria", en: "Delete Category" }, color: "rust" },

  // Announcements
  { key: "announcement.created", label: { sw: "Unda Tangazo", en: "Create Announcement" }, color: "gold" },
  { key: "announcement.sent", label: { sw: "Tuma Tangazo", en: "Send Announcement" }, color: "gold" },
  { key: "announcement.deleted", label: { sw: "Futa Tangazo", en: "Delete Announcement" }, color: "rust" },

  // Content
  { key: "content.banner.created", label: { sw: "Ongeza Banner", en: "Create Banner" }, color: "green" },
  { key: "content.banner.updated", label: { sw: "Badilisha Banner", en: "Update Banner" }, color: "gold" },
  { key: "content.banner.deleted", label: { sw: "Futa Banner", en: "Delete Banner" }, color: "rust" },

  // Bundles
  { key: "bundle.created", label: { sw: "Ongeza Kifurushi", en: "Create Bundle" }, color: "green" },
  { key: "bundle.updated", label: { sw: "Badilisha Kifurushi", en: "Update Bundle" }, color: "gold" },
  { key: "bundle.deleted", label: { sw: "Futa Kifurushi", en: "Delete Bundle" }, color: "rust" },

  // RBAC / Staff
  { key: "rbac.role.created", label: { sw: "Ongeza Role", en: "Create Role" }, color: "green" },
  { key: "rbac.role.updated", label: { sw: "Badilisha Role", en: "Update Role" }, color: "gold" },
  { key: "rbac.role.deleted", label: { sw: "Futa Role", en: "Delete Role" }, color: "rust" },
  { key: "rbac.staff.assigned", label: { sw: "Ongeza Mfanyakazi", en: "Assign Staff" }, color: "green" },
  { key: "rbac.staff.removed", label: { sw: "Ondoa Mfanyakazi", en: "Remove Staff" }, color: "rust" },

  // Trash
  { key: "trash.restored", label: { sw: "Rejesha kutoka Trash", en: "Restore from Trash" }, color: "green" },
  { key: "trash.hard_deleted", label: { sw: "Futa Kabisa", en: "Permanent Delete" }, color: "rust" },
  { key: "core.purge_soft_deleted", label: { sw: "Safisha Trash", en: "Purge Trash" }, color: "rust" },

  // System
  { key: "webhook.created", label: { sw: "Ongeza Webhook", en: "Create Webhook" }, color: "green" },
  { key: "webhook.deleted", label: { sw: "Futa Webhook", en: "Delete Webhook" }, color: "rust" },
  { key: "system.policy.updated", label: { sw: "Badilisha Sera", en: "Update Policy" }, color: "gold" },

  // Audit (meta)
  { key: "audit.deleted", label: { sw: "Futa Log", en: "Delete Log" }, color: "rust" },
  { key: "audit.cleared", label: { sw: "Futa Logs Zote", en: "Clear All Logs" }, color: "rust" },
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
    adminUserId: raw.admin_user,
    target: raw.target || "",
    targetId: raw.target_id,
    // details: toleo la zamani (fallback). detailsSw/detailsEn: logs mpya zenye lugha mbili.
    details: raw.details || raw.details_sw || raw.details_en || "",
    detailsSw: raw.details_sw || "",
    detailsEn: raw.details_en || "",
    ipAddress: raw.ip_address || null,
    userAgent: raw.user_agent || null,
    requestPath: raw.request_path || null,
    requestMethod: raw.request_method || null,
    at: raw.created_at,
  };
}

export function getAuditLogs() { return read(); }

async function _hydrateAuditLogsFromApi_impl() {
  try {
    const d = await api.get("/audit/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    write(list.map(norm).filter(Boolean));
    return { ok: true, count: list.length };
  } catch (err) { return { ok: false, error: err }; }
}

// ============================================================
// DELETE — moja moja
// ============================================================
export async function removeAuditLogAsync(id) {
  try {
    await api.delete(`/audit/${id}/`);
    write(read().filter((l) => l.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ============================================================
// CLEAR — zote
// ============================================================
export async function clearAuditLogsAsync() {
  try {
    const data = await api.post("/audit/clear/", {});
    write([]);
    return { ok: true, deleted: data?.deleted || 0 };
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

export const hydrateAuditLogsFromApi = guarded(_hydrateAuditLogsFromApi_impl, { key: "hydrateAuditLogsFromApi" });
// ============================================================
// AuditLogsSection.jsx
// Admin — Audit Logs (nani, lini, nini).
//
// Marekebisho:
//  - Delete button kwa kila log (moja moja)
//  - "Clear All" button (zote)
//  - Detail modal ya kufungua log
//  - Actions zote zina icons
// ============================================================

import React, { useState, useMemo } from "react";
import {
  History,
  Search,
  Trash2,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  DollarSign,
  Tag,
  Megaphone,
  UserCog,
  Loader2,
  RotateCcw,
  Image as ImageIcon,
  Package,
  Webhook,
  Eye,
  X,
  Globe,
  Monitor,
  Route,
  Hash,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useAuditLogs,
  removeAuditLogAsync,
  clearAuditLogsAsync,
  AUDIT_ACTIONS,
} from "../../../../config/auditLogsStore.js";

// ============================================================
// ACTION ICONS
// ============================================================
const ACTION_ICONS = {
  // Listings
  "listing.approved": CheckCircle,
  "listing.rejected": XCircle,
  "listing.deleted": Trash2,
  "listing.restored": RotateCcw,

  // Users
  "user.suspended": AlertTriangle,
  "user.activated": CheckCircle,
  "user.verified": ShieldCheck,
  "user.deleted": Trash2,

  // Verifications
  "verification.approved": ShieldCheck,
  "verification.rejected": XCircle,

  // Deals / Disputes
  "dispute.resolved": AlertTriangle,
  "deal.cancelled": XCircle,
  "refund.issued": DollarSign,

  // Fees
  "fee.updated": DollarSign,

  // Categories
  "category.created": Tag,
  "category.updated": Tag,
  "category.deleted": Trash2,

  // Announcements
  "announcement.created": Megaphone,
  "announcement.sent": Megaphone,
  "announcement.deleted": Trash2,

  // Content
  "content.banner.created": ImageIcon,
  "content.banner.updated": ImageIcon,
  "content.banner.deleted": Trash2,

  // Bundles
  "bundle.created": Package,
  "bundle.updated": Package,
  "bundle.deleted": Trash2,

  // RBAC
  "rbac.role.created": ShieldCheck,
  "rbac.role.updated": ShieldCheck,
  "rbac.role.deleted": Trash2,
  "rbac.staff.assigned": UserCog,
  "rbac.staff.removed": UserCog,

  // Trash
  "trash.restored": RotateCcw,
  "trash.hard_deleted": Trash2,
  "core.purge_soft_deleted": Trash2,

  // System
  "webhook.created": Webhook,
  "webhook.deleted": Trash2,
  "system.policy.updated": ShieldCheck,

  // Audit
  "audit.deleted": Trash2,
  "audit.cleared": Trash2,
};

const ACTION_COLORS = {
  green: { bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
  rust: { bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
  gold: { bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
};

// ============================================================
// CONFIRM MODAL
// ============================================================
function ConfirmModal({ open, title, description, confirmLabel, danger, busy, onConfirm, onClose, lang }) {
  if (!open) return null;
  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="text-center mb-5">
          <div
            style={{
              background: danger ? `${COLORS.rust}15` : `${COLORS.gold}15`,
            }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <AlertTriangle size={26} color={danger ? COLORS.rust : COLORS.gold} />
          </div>
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <p className="text-sm text-secondary mt-2">{description}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary disabled:opacity-50"
          >
            {t("Ghairi", "Cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              background: danger ? COLORS.rust : COLORS.gold,
              color: danger ? "white" : COLORS.night,
            }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("Inafanya...", "Working...")}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DETAIL MODAL
// ============================================================
function LogDetailModal({ log, lang, onClose }) {
  if (!log) return null;
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const action = AUDIT_ACTIONS.find((a) => a.key === log.action);
  const colors = ACTION_COLORS[action?.color] || ACTION_COLORS.gold;
  const Icon = ACTION_ICONS[log.action] || FileText;

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              style={{ background: colors.bg }}
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            >
              <Icon size={18} color={colors.fg} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary truncate">
                {action?.label?.[lang] || action?.label?.sw || log.action}
              </p>
              <p className="text-[11px] text-muted font-mono truncate">
                {log.action}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-secondary shrink-0"
            aria-label={t("Funga", "Close")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Admin */}
          <Field
            icon={User}
            label={t("Msimamizi", "Admin")}
            value={log.adminName || "—"}
          />

          {/* Time */}
          <Field
            icon={Clock}
            label={t("Muda", "Time")}
            value={formatDate(log.at)}
          />

          {/* Target */}
          {log.target && (
            <Field
              icon={Tag}
              label={t("Kitu", "Target")}
              value={`${log.target}${log.targetId ? ` #${log.targetId}` : ""}`}
            />
          )}

          {/* Details */}
          {log.details && (
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase mb-1 flex items-center gap-1">
                <FileText size={11} />
                {t("Maelezo", "Details")}
              </p>
              <div
                style={{ background: COLORS.sand, borderColor: COLORS.sandLine }}
                className="rounded-lg border p-3 text-xs text-primary leading-relaxed break-words whitespace-pre-wrap"
              >
                {log.details}
              </div>
            </div>
          )}

          {/* IP */}
          {log.ipAddress && (
            <Field
              icon={Globe}
              label={t("IP Address", "IP Address")}
              value={log.ipAddress}
              mono
            />
          )}

          {/* Request Path */}
          {log.requestPath && (
            <Field
              icon={Route}
              label={t("Njia", "Request Path")}
              value={`${log.requestMethod || ""} ${log.requestPath}`}
              mono
            />
          )}

          {/* User Agent */}
          {log.userAgent && (
            <Field
              icon={Monitor}
              label={t("User Agent", "User Agent")}
              value={log.userAgent}
            />
          )}

          {/* Log ID */}
          <Field
            icon={Hash}
            label={t("Log ID", "Log ID")}
            value={`#${log.id}`}
            mono
          />
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, mono = false }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted uppercase mb-1 flex items-center gap-1">
        <Icon size={11} />
        {label}
      </p>
      <p
        className={`text-xs text-primary break-words ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

// ============================================================
// MAIN SECTION
// ============================================================
export default function AuditLogsSection() {
  const { lang } = useLanguage();
  const logs = useAuditLogs();
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const [detailLog, setDetailLog] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const actionCounts = useMemo(() => {
    const counts = { all: logs.length };
    AUDIT_ACTIONS.forEach((a) => {
      counts[a.key] = logs.filter((l) => l.action === a.key).length;
    });
    return counts;
  }, [logs]);

  const filtered = useMemo(() => {
    let result = [...logs];

    if (actionFilter !== "all") {
      result = result.filter((l) => l.action === actionFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (l) =>
          l.adminName?.toLowerCase().includes(q) ||
          l.target?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q) ||
          l.action?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, actionFilter, query]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleRemoveConfirm = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setBusy((b) => ({ ...b, [id]: true }));
    setError("");
    const res = await removeAuditLogAsync(id);
    setBusy((b) => {
      const n = { ...b };
      delete n[id];
      return n;
    });
    setConfirmDelete(null);
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa log.", "Failed to remove log.")
      );
    }
  };

  const handleClearConfirm = async () => {
    setBusy((b) => ({ ...b, clearAll: true }));
    setError("");
    const res = await clearAuditLogsAsync();
    setBusy((b) => {
      const n = { ...b };
      delete n.clearAll;
      return n;
    });
    setConfirmClear(false);
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kufuta logs zote.", "Failed to clear all logs.")
      );
    } else {
      setError("");
      // Reflect the actual count cleared
      window.dispatchEvent(new CustomEvent("sokomkononi:toast", {
        detail: {
          type: "success",
          message: t(
            `Imetolewa ${res.deleted || 0} logs`,
            `Cleared ${res.deleted || 0} logs`
          ),
        },
      }));
    }
  };

  const getActionLabel = (key) => {
    const action = AUDIT_ACTIONS.find((a) => a.key === key);
    return action?.label?.[lang] || action?.label?.sw || key;
  };

  const getActionColor = (key) => {
    const action = AUDIT_ACTIONS.find((a) => a.key === key);
    return ACTION_COLORS[action?.color] || ACTION_COLORS.gold;
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Kumbukumbu za Matendo", "Audit Logs")}
        subtitle={t(
          "Nani alifanya nini, lini, na kwenye kitu gani.",
          "Who did what, when, and on what."
        )}
      />

      {error && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      {/* Summary + Clear All */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-xl border p-3 sm:p-4 mb-5 flex items-start gap-3 flex-wrap w-full min-w-0"
      >
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
        >
          <History size={16} color={COLORS.night} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary break-words">
            {logs.length} {t("matendo yame-logiwa", "actions logged")}
          </p>
          <p className="text-xs text-secondary mt-0.5 break-words">
            {t(
              "Kumbukumbu za matendo zinaonyesha kila hatua ya Admin. Unaweza kufuta moja moja au zote.",
              "Audit logs show every Admin action. You can delete one by one or all."
            )}
          </p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            disabled={busy.clearAll}
            style={{ color: COLORS.rust }}
            className="flex items-center gap-1 text-xs font-semibold shrink-0 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy.clearAll ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            {t("Futa Zote", "Clear All")}
          </button>
        )}
      </div>

      {/* Action filter */}
      {logs.length > 0 && (
        <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2 w-full min-w-0">
          <button
            onClick={() => setActionFilter("all")}
            style={{
              background: actionFilter === "all" ? COLORS.night : "white",
              color:
                actionFilter === "all" ? COLORS.sand : "var(--text-primary)",
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
          >
            {t("Zote", "All")} ({actionCounts.all})
          </button>
          {AUDIT_ACTIONS.filter((a) => actionCounts[a.key] > 0).map((action) => (
            <button
              key={action.key}
              onClick={() => setActionFilter(action.key)}
              style={{
                background:
                  actionFilter === action.key ? COLORS.night : "white",
                color:
                  actionFilter === action.key
                    ? COLORS.sand
                    : "var(--text-primary)",
                borderColor: COLORS.sandLine,
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
            >
              {action.label?.[lang] || action.label?.sw} (
              {actionCounts[action.key]})
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {logs.length > 0 && (
        <div className="relative w-full mb-4 min-w-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "Tafuta kwa admin, target, au maelezo...",
              "Search by admin, target, or details..."
            )}
            className="smk-inline-search w-full rounded-lg border border-gray-200 bg-white pl-3 pr-10 py-2 text-xs outline-none focus:outline-none focus-visible:outline-none"
            style={{ WebkitAppearance: "none" }}
          />
          <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
        >
          <History size={40} className="mx-auto text-muted mb-3" />
          <h3
            style={{ color: "var(--text-primary)" }}
            className="font-semibold mb-1"
          >
            {query || actionFilter !== "all"
              ? t("Hakuna matokeo", "No results")
              : t("Hakuna kumbukumbu", "No audit logs")}
          </h3>
          <p className="text-sm text-secondary">
            {query || actionFilter !== "all"
              ? t(
                  "Jaribu kubadilisha vichujio au utafutaji wako.",
                  "Try changing your filters or search."
                )
              : t(
                  "Matendo ya Admin yataonekana hapa.",
                  "Admin actions will appear here."
                )}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full min-w-0">
          {filtered.map((log) => {
            const ActionIcon = ACTION_ICONS[log.action] || FileText;
            const colors = getActionColor(log.action);
            const isBusy = !!busy[log.id];

            return (
              <div
                key={log.id}
                style={{ borderColor: COLORS.sandLine, background: "white" }}
                className="rounded-xl border p-3 sm:p-4 flex items-start gap-2 sm:gap-3 w-full max-w-full min-w-0 overflow-hidden"
              >
                <div
                  style={{ background: colors?.bg || "#F5F3EC" }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                >
                  <ActionIcon size={15} color={colors.fg} />
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      style={{
                        background: colors?.bg || "#F5F3EC",
                        color: colors?.fg || "#101A2E",
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                    >
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-[10px] text-muted flex items-center gap-1 shrink-0 whitespace-nowrap">
                      <Clock size={10} />
                      {timeAgo(log.at, lang)}
                    </span>
                  </div>

                  <p className="text-sm text-primary font-medium break-words">
                    {log.target}
                  </p>

                  {log.details && (
                    <p className="text-xs text-secondary mt-1 leading-relaxed break-words line-clamp-2">
                      {log.details}
                    </p>
                  )}

                  <p className="text-[11px] text-muted mt-1.5 flex items-center gap-1 min-w-0">
                    <User size={10} className="shrink-0" />
                    <span className="truncate">{log.adminName}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setDetailLog(log)}
                    className="p-1.5 text-muted hover:text-[#2F6D4F] transition-colors"
                    aria-label={t("Fungua", "Open")}
                    title={t("Fungua", "Open")}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(log)}
                    disabled={isBusy}
                    className="p-1.5 text-muted hover:text-[#C1502E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t("Futa", "Delete")}
                    title={t("Futa", "Delete")}
                  >
                    {isBusy ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <LogDetailModal
        log={detailLog}
        lang={lang}
        onClose={() => setDetailLog(null)}
      />

      {/* Confirm — delete one */}
      <ConfirmModal
        open={!!confirmDelete}
        busy={!!busy[confirmDelete?.id]}
        danger
        title={t("Futa Log Hii?", "Delete This Log?")}
        description={t(
          "Log hii itafutwa kabisa. Hatua hii haiwezi kurudishwa.",
          "This log will be permanently deleted. This action cannot be undone."
        )}
        confirmLabel={
          <>
            <Trash2 size={14} />
            {t("Futa", "Delete")}
          </>
        }
        onConfirm={handleRemoveConfirm}
        onClose={() => !busy[confirmDelete?.id] && setConfirmDelete(null)}
        lang={lang}
      />

      {/* Confirm — clear all */}
      <ConfirmModal
        open={confirmClear}
        busy={!!busy.clearAll}
        danger
        title={t("Futa Logs Zote?", "Clear All Logs?")}
        description={t(
          `Logs zote ${logs.length} zitafutwa kabisa. Hatua hii haiwezi kurudishwa.`,
          `All ${logs.length} logs will be permanently deleted. This action cannot be undone.`
        )}
        confirmLabel={
          <>
            <Trash2 size={14} />
            {t("Futa Zote", "Clear All")}
          </>
        }
        onConfirm={handleClearConfirm}
        onClose={() => !busy.clearAll && setConfirmClear(false)}
        lang={lang}
      />
    </div>
  );
}
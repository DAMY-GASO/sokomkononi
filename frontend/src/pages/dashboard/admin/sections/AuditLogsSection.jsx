// ============================================================
// AuditLogsSection.jsx
// Admin — Audit Logs (nani, lini, nini).
// Bilingual + mobile-responsive + Async actions na rollback.
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
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
// ⬇️ MABADILIKO: tumia store moja kwa moja + api
import {
  useAuditLogs,
  getAuditLogs,
  saveAuditLogs,
  AUDIT_ACTIONS,
} from "../../../../config/auditLogsStore.js";
import { api } from "../../../../api/client.js";

// ============================================================
// ASYNC HELPERS — tunaunda hapa kwa sababu store haina (bado)
// ============================================================
async function removeAuditLogAsync(id) {
  const previous = getAuditLogs();
  const target = previous.find((l) => l.id === id);
  if (!target) return { ok: false, error: new Error("Log haipo") };

  // Optimistic
  saveAuditLogs(previous.filter((l) => l.id !== id));

  if (typeof id !== "number") return { ok: true };

  try {
    await api.delete(`/audit/${id}/`);
    return { ok: true };
  } catch (err) {
    saveAuditLogs(previous); // Rollback
    console.warn("[AuditLogsSection] remove failed:", err);
    return { ok: false, error: err };
  }
}

async function clearAuditLogsAsync() {
  const previous = getAuditLogs();
  saveAuditLogs([]);

  try {
    await api.post("/audit/clear/", {});
    return { ok: true };
  } catch (err) {
    saveAuditLogs(previous); // Rollback
    console.warn("[AuditLogsSection] clearAll failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// ACTION ICONS
// ============================================================
const ACTION_ICONS = {
  "listing.approved": CheckCircle,
  "listing.rejected": XCircle,
  "user.suspended": AlertTriangle,
  "user.activated": CheckCircle,
  "verification.approved": ShieldCheck,
  "verification.rejected": XCircle,
  "dispute.resolved": AlertTriangle,
  "fee.updated": DollarSign,
  "category.created": Tag,
  "category.updated": Tag,
  "category.deleted": Trash2,
  "announcement.sent": Megaphone,
  "refund.issued": DollarSign,
  "subadmin.added": UserCog,
  "subadmin.removed": UserCog,
};

const ACTION_COLORS = {
  green: { bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
  rust: { bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
  gold: { bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
};

// ============================================================
// MAIN SECTION
// ============================================================
export default function AuditLogsSection() {
  const { lang } = useLanguage();
  const logs = useAuditLogs();
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  // ⬇️ MPYA: busy + error
  const [busy, setBusy] = useState({}); // { [id]: true, clearing: true }
  const [error, setError] = useState("");

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
          AUDIT_ACTIONS.find((a) => a.key === l.action)
            ?.label?.[lang]?.toLowerCase()
            .includes(q)
      );
    }

    return result;
  }, [logs, actionFilter, query, lang]);

  // ============================================================
  // HANDLERS — async
  // ============================================================
  const handleClearAll = async () => {
    if (
      !window.confirm(
        t(
          "Futa logs zote? Hatua hii haiwezi kurudishwa.",
          "Delete all logs? This cannot be undone."
        )
      )
    )
      return;

    if (busy.clearing) return;

    setBusy((b) => ({ ...b, clearing: true }));
    setError("");

    const res = await clearAuditLogsAsync();

    setBusy((b) => {
      const next = { ...b };
      delete next.clearing;
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kufuta logs.", "Failed to clear logs.")
      );
    }
  };

  const handleRemove = async (id) => {
    if (busy[id]) return;

    setBusy((b) => ({ ...b, [id]: true }));
    setError("");

    const res = await removeAuditLogAsync(id);

    setBusy((b) => {
      const next = { ...b };
      delete next[id];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa log.", "Failed to remove log.")
      );
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

      {/* Error banner */}
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

      {/* Summary */}
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
              "Kumbukumbu za matendo zinaonyesha kila hatua ya Admin.",
              "Audit logs show every Admin action."
            )}
          </p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={busy.clearing}
            style={{ color: COLORS.rust }}
            className="flex items-center gap-1 text-xs font-semibold shrink-0 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy.clearing ? (
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
              color: actionFilter === "all" ? COLORS.sand : "var(--text-primary)",
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
                background: actionFilter === action.key ? COLORS.night : "white",
                color: actionFilter === action.key ? COLORS.sand : "var(--text-primary)",
                borderColor: COLORS.sandLine,
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
            >
              {action.label?.[lang] || action.label?.sw} ({actionCounts[action.key]})
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {logs.length > 0 && (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-4 w-full min-w-0">
          <Search size={14} className="text-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "Tafuta kwa admin, target, au maelezo...",
              "Search by admin, target, or details..."
            )}
            className="outline-none text-xs flex-1 min-w-0"
          />
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
        >
          <History size={40} className="mx-auto text-muted mb-3" />
          <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-1">
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
                  style={{ background: colors.bg }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                >
                  <ActionIcon size={15} color={colors.fg} />
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      style={{
                        background: colors.bg,
                        color: colors.fg,
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
                    <p className="text-xs text-secondary mt-1 leading-relaxed break-words">
                      {log.details}
                    </p>
                  )}

                  <p className="text-[11px] text-muted mt-1.5 flex items-center gap-1 min-w-0">
                    <User size={10} className="shrink-0" />
                    <span className="truncate">{log.adminName}</span>
                  </p>
                </div>

                <button
                  onClick={() => handleRemove(log.id)}
                  disabled={isBusy}
                  className="p-1.5 text-muted hover:text-[#C1502E] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t("Ondoa", "Remove")}
                >
                  {isBusy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

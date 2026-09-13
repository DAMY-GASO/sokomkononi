// ============================================================
// AuditLogsSection.jsx
// Admin — Audit Logs (nani, lini, nini).
// Bilingual + mobile-responsive (imeboreshwa).
// ============================================================

import React, { useState, useMemo } from "react";
import {
  History,
  Search,
  Trash2,
  Filter,
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
  Home,
  Users,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useAuditLogs,
  removeAuditLog,
  clearAuditLogs,
  AUDIT_ACTIONS,
} from "../../../../config/auditLogsStore.js";

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

// ============================================================
// ACTION COLORS
// ============================================================
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

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // Action counts
  const actionCounts = useMemo(() => {
    const counts = { all: logs.length };
    AUDIT_ACTIONS.forEach((a) => {
      counts[a.key] = logs.filter((l) => l.action === a.key).length;
    });
    return counts;
  }, [logs]);

  // Filtered
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

  const handleClearAll = () => {
    if (
      window.confirm(
        t(
          "Futa logs zote? Hatua hii haiwezi kurudishwa.",
          "Delete all logs? This cannot be undone."
        )
      )
    ) {
      clearAuditLogs();
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
    <div className="w-full max-w-7xl mx-auto">
      <SectionHeader
        title={t("Kumbukumbu za Matendo", "Audit Logs")}
        subtitle={t(
          "Nani alifanya nini, lini, na kwenye kitu gani.",
          "Who did what, when, and on what."
        )}
      />

      {/* Summary — responsive */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-xl border p-3 sm:p-4 mb-5 flex items-start gap-3 flex-wrap min-w-0"
      >
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
        >
          <History size={16} color={COLORS.night} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">
            {logs.length} {t("matendo yame-logiwa", "actions logged")}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {t(
              "Kumbukumbu za matendo zinaonyesha kila hatua ya Admin.",
              "Audit logs show every Admin action."
            )}
          </p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{ color: COLORS.rust }}
            className="flex items-center gap-1 text-xs font-semibold shrink-0 hover:underline"
          >
            <Trash2 size={12} />
            {t("Futa Zote", "Clear All")}
          </button>
        )}
      </div>

      {/* Action filter — scroll horizontal */}
      {logs.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActionFilter("all")}
            style={{
              background: actionFilter === "all" ? COLORS.night : "white",
              color: actionFilter === "all" ? COLORS.sand : COLORS.night,
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
                  actionFilter === action.key ? COLORS.sand : COLORS.night,
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
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-4 min-w-0">
          <Search size={14} className="text-gray-400 shrink-0" />
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
          <History size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 style={{ color: COLORS.night }} className="font-semibold mb-1">
            {query || actionFilter !== "all"
              ? t("Hakuna matokeo", "No results")
              : t("Hakuna kumbukumbu", "No audit logs")}
          </h3>
          <p className="text-sm text-gray-500">
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
            return (
              <div
                key={log.id}
                style={{ borderColor: COLORS.sandLine, background: "white" }}
                className="rounded-xl border p-3 sm:p-4 flex items-start gap-2 sm:gap-3 w-full min-w-0"
              >
                <div
                  style={{ background: colors.bg }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
                >
                  <ActionIcon size={15} color={colors.fg} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      style={{
                        background: colors.bg,
                        color: colors.fg,
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    >
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                      <Clock size={10} />
                      {timeAgo(log.at, lang)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-800 font-medium break-words">
                    {log.target}
                  </p>

                  {log.details && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed break-words">
                      {log.details}
                    </p>
                  )}

                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1 min-w-0">
                    <User size={10} className="shrink-0" />
                    <span className="truncate">{log.adminName}</span>
                  </p>
                </div>

                <button
                  onClick={() => removeAuditLog(log.id)}
                  className="p-1.5 text-gray-300 hover:text-[#C1502E] transition-colors shrink-0"
                  aria-label={t("Ondoa", "Remove")}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// RefundsSection.jsx
// Admin — Refunds za promotions zilizofutwa.
// ============================================================
import React, { useState, useMemo } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  X,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useToast } from "../../../../components/Toast.jsx";
import {
  useRefunds,
  hydrateRefundsFromApi,
  completeRefundAsync,
  failRefundAsync,
} from "../../../../config/refundsStore.js";

// ============================================================
// STATUS FILTERS
// ============================================================
const STATUS_FILTERS = [
  { key: "all", label: { sw: "Zote", en: "All" } },
  { key: "PENDING", label: { sw: "Zinasubiri", en: "Pending" } },
  { key: "PROCESSING", label: { sw: "Inaendelea", en: "Processing" } },
  { key: "COMPLETED", label: { sw: "Zimekamilika", en: "Completed" } },
  { key: "FAILED", label: { sw: "Zimeshindwa", en: "Failed" } },
];

// ============================================================
// STATUS BADGE
// ============================================================
function StatusBadge({ status, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const styles = {
    PENDING: {
      bg: "rgba(232,163,61,0.12)",
      fg: "#8A5A16",
      label: t("Inasubiri", "Pending"),
    },
    PROCESSING: {
      bg: "rgba(37,99,235,0.12)",
      fg: "#2563EB",
      label: t("Inaendelea", "Processing"),
    },
    COMPLETED: {
      bg: "rgba(47,109,79,0.12)",
      fg: COLORS.green,
      label: t("Imekamilika", "Completed"),
    },
    FAILED: {
      bg: "rgba(193,80,46,0.12)",
      fg: COLORS.rust,
      label: t("Imeshindwa", "Failed"),
    },
  };

  const s = styles[status] || styles.PENDING;

  return (
    <span
      style={{ background: s.bg, color: s.fg }}
      className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
    >
      {s.label}
    </span>
  );
}

// ============================================================
// REFUND CARD
// ============================================================
function RefundCard({ refund, lang, onComplete, onFail, isBusy }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const isPending = refund.status === "PENDING";
  const isCompleted = refund.status === "COMPLETED";
  const isFailed = refund.status === "FAILED";

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 w-full min-w-0"
    >
      <div className="flex items-start gap-3 w-full min-w-0">
        <div
          style={{ background: "rgba(37,99,235,0.1)" }}
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        >
          <Wallet size={16} color="#2563EB" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              style={{ background: "rgba(16,26,46,0.08)", color: COLORS.night }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
            >
              {refund.promotionType} #{refund.promotionId}
            </span>
            <StatusBadge status={refund.status} lang={lang} />
          </div>

          <p className="text-sm font-semibold text-primary truncate">
            {refund.userName || `User #${refund.userId}`}
          </p>

          <p className="text-base font-bold text-primary mt-1">
            {formatTZS(refund.amountPaid)}
          </p>

          {refund.reason && (
            <p className="text-xs text-secondary mt-1 break-words">
              {refund.reason}
            </p>
          )}

          {refund.refundReference && (
            <p className="text-[10px] text-muted mt-1 font-mono">
              Ref: {refund.refundReference}
            </p>
          )}

          <p className="text-[11px] text-muted mt-1">
            {refund.createdAt ? timeAgo(refund.createdAt, lang) : "—"}
          </p>
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: COLORS.sandLine }}>
          <button
            onClick={() => onComplete(refund)}
            disabled={isBusy}
            style={{ background: COLORS.green, color: "white" }}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
          >
            {isBusy ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCircle2 size={12} />
            )}
            {t("Kamilisha Refund", "Complete Refund")}
          </button>
          <button
            onClick={() => onFail(refund)}
            disabled={isBusy}
            style={{ color: COLORS.rust, borderColor: COLORS.sandLine }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border disabled:opacity-50"
          >
            <XCircle size={12} />
            {t("Imeshindwa", "Fail")}
          </button>
        </div>
      )}

      {isCompleted && (
        <div
          className="mt-3 pt-3 border-t text-xs text-center"
          style={{ borderColor: COLORS.sandLine, color: COLORS.green }}
        >
          <CheckCircle2 size={14} className="inline mr-1" />
          {t("Refund imekamilika", "Refund completed")}
        </div>
      )}

      {isFailed && (
        <div
          className="mt-3 pt-3 border-t text-xs text-center"
          style={{ borderColor: COLORS.sandLine, color: COLORS.rust }}
        >
          <XCircle size={14} className="inline mr-1" />
          {t("Refund imeshindwa", "Refund failed")}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function RefundsSection() {
  const { lang } = useLanguage();
  const toast = useToast();
  const refunds = useRefunds();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [confirmComplete, setConfirmComplete] = useState(null);
  const [confirmFail, setConfirmFail] = useState(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ── Filtered ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = refunds;

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (r) =>
          r.userName?.toLowerCase().includes(q) ||
          r.promotionType?.toLowerCase().includes(q) ||
          r.refundReference?.toLowerCase().includes(q) ||
          String(r.promotionId).includes(q)
      );
    }

    return result;
  }, [refunds, statusFilter, query]);

  // ── Counts ───────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: refunds.length };
    ["PENDING", "PROCESSING", "COMPLETED", "FAILED"].forEach((s) => {
      c[s] = refunds.filter((r) => r.status === s).length;
    });
    return c;
  }, [refunds]);

  // ── Handlers ─────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    await hydrateRefundsFromApi();
    setRefreshing(false);
  };

  const handleCompleteConfirm = async () => {
    if (!confirmComplete) return;
    const id = confirmComplete.id;
    setBusy((b) => ({ ...b, [id]: "complete" }));
    const res = await completeRefundAsync(id, { adminNote: "" });
    setBusy((b) => {
      const n = { ...b };
      delete n[id];
      return n;
    });
    setConfirmComplete(null);

    if (res.ok) {
      toast.success(t("Refund imekamilika.", "Refund completed."));
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kukamilisha refund.", "Failed to complete refund.")
      );
    }
  };

  const handleFailConfirm = async () => {
    if (!confirmFail) return;
    const id = confirmFail.id;
    setBusy((b) => ({ ...b, [id]: "fail" }));
    const res = await failRefundAsync(id, { adminNote: "" });
    setBusy((b) => {
      const n = { ...b };
      delete n[id];
      return n;
    });
    setConfirmFail(null);

    if (res.ok) {
      toast.warning(t("Refund imewekwa kama imeshindwa.", "Refund marked as failed."));
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuweka refund kama imeshindwa.", "Failed to fail refund.")
      );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0">
      <SectionHeader
        title={t("Refunds", "Refunds")}
        subtitle={t(
          "Fuatilia na kamilisha refunds za promotions zilizofutwa.",
          "Track and complete refunds for cancelled promotions."
        )}
      />

      {error && (
        <div
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      {/* Summary + Refresh */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-xl border p-3 sm:p-4 mb-5 flex items-start gap-3 flex-wrap w-full min-w-0"
      >
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
        >
          <Wallet size={16} color={COLORS.night} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary break-words">
            {refunds.length} {t("refunds", "refunds")}
          </p>
          <p className="text-xs text-secondary mt-0.5">
            {t(
              "Refunds za promotions zilizofutwa. Zinahitaji kukamilishwa.",
              "Refunds for cancelled promotions. They need to be completed."
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ borderColor: COLORS.sandLine, color: "var(--text-primary)" }}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">
            {refreshing ? t("Inasasisha...", "Refreshing...") : t("Sasisha", "Refresh")}
          </span>
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-0">
          <Search size={14} className="text-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Tafuta refund...", "Search refund...")}
            className="outline-none text-xs flex-1 min-w-0"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted hover:text-secondary shrink-0"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {STATUS_FILTERS.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  background: isActive ? COLORS.night : "white",
                  color: isActive ? COLORS.sand : "var(--text-primary)",
                  borderColor: COLORS.sandLine,
                }}
                className="text-[11px] font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
              >
                {tab.label[lang] || tab.label.sw}
                {counts[tab.key] > 0 ? ` (${counts[tab.key]})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
        >
          <Wallet size={40} className="mx-auto text-muted mb-3" />
          <h3 className="font-semibold text-primary mb-1">
            {query || statusFilter !== "all"
              ? t("Hakuna matokeo", "No results")
              : t("Hakuna refunds", "No refunds")}
          </h3>
          <p className="text-sm text-secondary">
            {query || statusFilter !== "all"
              ? t(
                  "Jaribu kubadilisha vichujio au utafutaji.",
                  "Try changing filters or search."
                )
              : t(
                  "Refunds zitaonekana hapa promotions zikifutwa.",
                  "Refunds will appear here when promotions are cancelled."
                )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((refund) => (
            <RefundCard
              key={refund.id}
              refund={refund}
              lang={lang}
              isBusy={!!busy[refund.id]}
              onComplete={(r) => setConfirmComplete(r)}
              onFail={(r) => setConfirmFail(r)}
            />
          ))}
        </div>
      )}

      {/* Complete Confirm Modal */}
      {confirmComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="text-center mb-5">
              <div
                style={{ background: `${COLORS.green}15` }}
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <CheckCircle2 size={26} color={COLORS.green} />
              </div>
              <h3 className="text-lg font-bold text-primary">
                {t("Kamilisha Refund?", "Complete Refund?")}
              </h3>
              <p className="text-sm text-secondary mt-2">
                {formatTZS(confirmComplete.amountPaid)} — {confirmComplete.userName}
              </p>
              <p className="text-xs text-muted mt-2">
                {t(
                  "Hii itaweka refund kama imekamilika. Mtumiaji atapata taarifa.",
                  "This will mark the refund as completed. The user will be notified."
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmComplete(null)}
                disabled={!!busy[confirmComplete.id]}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary disabled:opacity-50"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={handleCompleteConfirm}
                disabled={!!busy[confirmComplete.id]}
                style={{ background: COLORS.green, color: "white" }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {busy[confirmComplete.id] ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {t("Kamilisha", "Complete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Confirm Modal */}
      {confirmFail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="text-center mb-5">
              <div
                style={{ background: `${COLORS.rust}15` }}
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <AlertTriangle size={26} color={COLORS.rust} />
              </div>
              <h3 className="text-lg font-bold text-primary">
                {t("Weka Refund kama Imeshindwa?", "Mark Refund as Failed?")}
              </h3>
              <p className="text-sm text-secondary mt-2">
                {formatTZS(confirmFail.amountPaid)} — {confirmFail.userName}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmFail(null)}
                disabled={!!busy[confirmFail.id]}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary disabled:opacity-50"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={handleFailConfirm}
                disabled={!!busy[confirmFail.id]}
                style={{ background: COLORS.rust, color: "white" }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {busy[confirmFail.id] ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={14} />
                )}
                {t("Weka Imeshindwa", "Mark Failed")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
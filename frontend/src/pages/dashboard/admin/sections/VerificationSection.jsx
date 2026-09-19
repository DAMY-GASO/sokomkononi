// ============================================================
// VerificationSection.jsx
// Admin — Verifications za seller, buyer, property, vehicle, business.
// Bilingual + mobile-responsive + Async actions na rollback.
// ============================================================

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  User,
  UserCheck,
  Home as HomeIcon,
  Car,
  Briefcase,
  Check,
  X,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
// ⬇️ MABADILIKO: tumia async variants
import {
  useVerifications,
  approveVerificationAsync,
  rejectVerificationAsync,
  removeVerificationAsync,
  VERIFICATION_TYPES,
  VERIFICATION_STATUSES,
} from "../../../../config/verificationsStore.js";

// ============================================================
// ICON MAP
// ============================================================
const TYPE_ICONS = {
  seller: User,
  buyer: UserCheck,
  property: HomeIcon,
  vehicle: Car,
  business: Briefcase,
};

// ============================================================
// STATUS BADGE
// ============================================================
function StatusBadge({ status, lang }) {
  const config = {
    pending: {
      label: { sw: "Inasubiri", en: "Pending" },
      bg: "rgba(232,163,61,0.16)",
      fg: "#8A5A16",
    },
    approved: {
      label: { sw: "Imeidhinishwa", en: "Approved" },
      bg: "rgba(47,109,79,0.16)",
      fg: COLORS.green,
    },
    rejected: {
      label: { sw: "Imekataliwa", en: "Rejected" },
      bg: "rgba(193,80,46,0.16)",
      fg: COLORS.rust,
    },
  };
  const s = config[status] || config.pending;
  const label = s.label?.[lang] || s.label?.sw;
  return (
    <span
      style={{ background: s.bg, color: s.fg }}
      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
    >
      {label}
    </span>
  );
}

// ============================================================
// VERIFICATION CARD — responsive + async
// ============================================================
function VerificationCard({ request, lang }) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  // ⬇️ MPYA: busy + error state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const TypeIcon = TYPE_ICONS[request.type] || ShieldCheck;
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleApprove = async () => {
    if (
      !window.confirm(
        t(
          `Idhinisha uthibitisho wa "${request.subject}"?`,
          `Approve verification for "${request.subject}"?`
        )
      )
    )
      return;

    setBusy(true);
    setError("");
    const res = await approveVerificationAsync(request.id);
    setBusy(false);
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuidhinisha.", "Failed to approve.")
      );
    }
  };

  const handleReject = async () => {
    if (!rejecting) {
      setRejecting(true);
      return;
    }

    setBusy(true);
    setError("");
    const res = await rejectVerificationAsync(request.id, rejectReason.trim());
    setBusy(false);
    if (res.ok) {
      setRejecting(false);
      setRejectReason("");
    } else {
      setError(
        res.error?.message || t("Imeshindwa kukataa.", "Failed to reject.")
      );
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(t("Ondoa ombi hili?", "Remove this request?"))) return;

    setBusy(true);
    setError("");
    const res = await removeVerificationAsync(request.id);
    setBusy(false);
    if (!res.ok) {
      setError(
        res.error?.message || t("Imeshindwa kuondoa.", "Failed to remove.")
      );
    }
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border overflow-hidden w-full max-w-full min-w-0"
    >
      {/* Header */}
      <div className="p-3 sm:p-4 w-full min-w-0">
        <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
          <div
            style={{ background: `${COLORS.night}0D` }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <TypeIcon size={15} color={COLORS.night} />
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                style={{ background: `${COLORS.gold}20`, color: "#8A5A16" }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {VERIFICATION_TYPES.find((v) => v.key === request.type)?.label?.[lang] ||
                  request.type}
              </span>
              <StatusBadge status={request.status} lang={lang} />
            </div>

            <p
              style={{ color: "var(--text-primary)" }}
              className="text-sm font-semibold truncate w-full"
            >
              {request.subject}
            </p>
            <p className="text-xs text-secondary mt-0.5 truncate w-full">
              {request.userName}
            </p>
            <p className="text-[10px] text-muted mt-0.5 truncate w-full">
              {request.userEmail}
            </p>
            <p className="text-[11px] text-muted mt-1">
              {t("Iliwasilishwa", "Submitted")} {timeAgo(request.submittedAt, lang)}
            </p>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-muted hover:text-secondary shrink-0"
            aria-label={expanded ? "Funga" : "Fungua"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded — Details */}
      {expanded && (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="border-t p-3 sm:p-4 flex flex-col gap-3 w-full max-w-full min-w-0 overflow-hidden"
        >
          {/* Error banner */}
          {error && (
            <div
              style={{
                background: "rgba(193,80,46,0.1)",
                color: COLORS.rust,
              }}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
            >
              {error}
            </div>
          )}

          {/* Notes */}
          {request.notes && (
            <div className="min-w-0 w-full">
              <p className="text-[10px] font-semibold text-secondary uppercase mb-1">
                {t("Maelezo", "Notes")}
              </p>
              <p className="text-xs text-primary bg-white rounded-lg p-2.5 leading-relaxed break-words w-full">
                {request.notes}
              </p>
            </div>
          )}

          {/* Documents */}
          {request.documents && request.documents.length > 0 && (
            <div className="min-w-0 w-full">
              <p className="text-[10px] font-semibold text-secondary uppercase mb-1">
                {t("Nyaraka", "Documents")}
              </p>
              <div className="flex flex-col gap-1.5 w-full">
                {request.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-primary bg-white rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors w-full min-w-0"
                  >
                    <FileText size={12} className="text-muted shrink-0" />
                    <span className="truncate flex-1 min-w-0">{doc.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {request.status === "rejected" && request.rejectionReason && (
            <div
              style={{
                background: "rgba(193,80,46,0.08)",
                color: COLORS.rust,
              }}
              className="rounded-lg px-3 py-2 text-xs break-words w-full"
            >
              <span className="font-semibold">
                {t("Sababu ya kukataliwa", "Rejection reason")}:
              </span>{" "}
              {request.rejectionReason}
            </div>
          )}

          {/* Reviewed info */}
          {request.reviewedAt && (
            <p className="text-[11px] text-muted break-words">
              {request.status === "approved"
                ? t("Ilidhinishwa", "Approved")
                : t("Ilidhinishwa", "Reviewed")}{" "}
              {timeAgo(request.reviewedAt, lang)} · {request.reviewedBy}
            </p>
          )}

          {/* Reject reason input */}
          {rejecting && (
            <div className="min-w-0 w-full">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t(
                  "Sababu ya kukataa (hiari)...",
                  "Reason for rejection (optional)..."
                )}
                rows={2}
                className="w-full rounded-lg border px-3 py-2 text-xs outline-none resize-none bg-white"
                style={{ borderColor: COLORS.sandLine }}
              />
            </div>
          )}

          {/* Actions */}
          {request.status === "pending" && (
            <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
              <button
                onClick={handleApprove}
                disabled={busy}
                style={{ background: COLORS.green, color: "white" }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                {t("Idhinisha", "Approve")}
              </button>

              <button
                onClick={handleReject}
                disabled={busy}
                style={{
                  background: rejecting ? COLORS.rust : "transparent",
                  color: rejecting ? "white" : COLORS.rust,
                  borderColor: "rgba(193,80,46,0.35)",
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy && rejecting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <X size={12} />
                )}
                {rejecting
                  ? t("Thibitisha Kukataa", "Confirm Rejection")
                  : t("Kataa", "Reject")}
              </button>

              {rejecting && (
                <button
                  onClick={() => {
                    setRejecting(false);
                    setRejectReason("");
                  }}
                  disabled={busy}
                  className="text-xs font-semibold px-3 py-2 rounded-lg text-secondary hover:bg-gray-100 transition-colors shrink-0 disabled:opacity-50"
                >
                  {t("Ghairi", "Cancel")}
                </button>
              )}

              <button
                onClick={handleRemove}
                disabled={busy}
                className="ml-auto text-xs font-semibold px-2 py-2 rounded-lg text-muted hover:text-[#C1502E] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t("Ondoa", "Remove")}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN SECTION
// ============================================================
export default function VerificationSection() {
  const { lang } = useLanguage();
  const requests = useVerifications();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const counts = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  const typeCounts = useMemo(() => {
    const counts = { all: requests.length };
    VERIFICATION_TYPES.forEach((v) => {
      counts[v.key] = requests.filter((r) => r.type === v.key).length;
    });
    return counts;
  }, [requests]);

  const filtered = useMemo(() => {
    let result = [...requests];

    if (typeFilter !== "all") {
      result = result.filter((r) => r.type === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (r) =>
          r.subject?.toLowerCase().includes(q) ||
          r.userName?.toLowerCase().includes(q) ||
          r.userEmail?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });

    return result;
  }, [requests, typeFilter, statusFilter, query]);

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Uthibitisho", "Verification")}
        subtitle={t(
          "Idhinisha au kataa uthibitisho wa wauzaji, wanunuzi, mali, magari, na biashara.",
          "Approve or reject verifications for sellers, buyers, properties, vehicles, and businesses."
        )}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 w-full">
        {[
          { label: t("Zote", "Total"), value: counts.total, color: "var(--text-primary)" },
          { label: t("Zinasubiri", "Pending"), value: counts.pending, color: "#8A5A16" },
          { label: t("Zimeidhinishwa", "Approved"), value: counts.approved, color: COLORS.green },
          { label: t("Zimekataliwa", "Rejected"), value: counts.rejected, color: COLORS.rust },
        ].map((stat, i) => (
          <div
            key={i}
            style={{ borderColor: COLORS.sandLine, background: "white" }}
            className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full"
          >
            <p className="text-[10px] font-semibold text-secondary uppercase truncate">
              {stat.label}
            </p>
            <p
              style={{ color: stat.color }}
              className="text-base sm:text-lg lg:text-xl font-bold mt-0.5 break-words"
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Type Tabs */}
      <div className="flex justify-center gap-2 mb-3 overflow-x-auto pb-2 w-full min-w-0">
        <button
          onClick={() => setTypeFilter("all")}
          style={{
            background: typeFilter === "all" ? COLORS.night : "white",
            color: typeFilter === "all" ? COLORS.sand : "var(--text-primary)",
            borderColor: COLORS.sandLine,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
        >
          {t("Zote", "All")} ({typeCounts.all})
        </button>
        {VERIFICATION_TYPES.map((type) => (
          <button
            key={type.key}
            onClick={() => setTypeFilter(type.key)}
            style={{
              background: typeFilter === type.key ? COLORS.night : "white",
              color: typeFilter === type.key ? COLORS.sand : "var(--text-primary)",
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
          >
            {type.label?.[lang] || type.label?.sw} ({typeCounts[type.key]})
          </button>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex justify-center gap-2 mb-3 overflow-x-auto pb-2 w-full min-w-0">
        <button
          onClick={() => setStatusFilter("all")}
          style={{
            background: statusFilter === "all" ? COLORS.gold : "white",
            color: "var(--text-primary)",
            borderColor: COLORS.sandLine,
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
        >
          {t("Zote", "All")}
        </button>
        {VERIFICATION_STATUSES.map((status) => (
          <button
            key={status.key}
            onClick={() => setStatusFilter(status.key)}
            style={{
              background: statusFilter === status.key ? COLORS.gold : "white",
              color: "var(--text-primary)",
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
          >
            {status.label?.[lang] || status.label?.sw}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-4 w-full min-w-0">
        <Search size={14} className="text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Tafuta...", "Search...")}
          className="outline-none text-xs flex-1 min-w-0"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
        >
          <ShieldCheck size={40} className="mx-auto text-muted mb-3" />
          <h3 style={{ color: "var(--text-primary)" }} className="font-semibold mb-1">
            {t("Hakuna maombi ya uthibitisho", "No verification requests")}
          </h3>
          <p className="text-sm text-secondary">
            {query || typeFilter !== "all" || statusFilter !== "all"
              ? t(
                  "Jaribu kubadilisha vichujio au utafutaji wako.",
                  "Try changing your filters or search."
                )
              : t(
                  "Maombi ya uthibitisho yataonekana hapa.",
                  "Verification requests will appear here."
                )}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full min-w-0">
          {filtered.map((request) => (
            <VerificationCard
              key={request.id}
              request={request}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}

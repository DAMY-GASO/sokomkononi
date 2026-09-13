// ============================================================
// VerificationSection.jsx
// Admin — Verifications za seller, buyer, property, vehicle, business.
// Bilingual + mobile-responsive (imeboreshwa).
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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { COLORS, FONTS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useVerifications,
  approveVerification,
  rejectVerification,
  removeVerification,
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
// VERIFICATION CARD — responsive
// ============================================================
function VerificationCard({ request, lang }) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const TypeIcon = TYPE_ICONS[request.type] || ShieldCheck;
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleApprove = () => {
    if (
      window.confirm(
        t(
          `Idhinisha uthibitisho wa "${request.subject}"?`,
          `Approve verification for "${request.subject}"?`
        )
      )
    ) {
      approveVerification(request.id);
    }
  };

  const handleReject = () => {
    if (!rejecting) {
      setRejecting(true);
      return;
    }
    rejectVerification(request.id, rejectReason.trim());
    setRejecting(false);
    setRejectReason("");
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border overflow-hidden w-full min-w-0"
    >
      {/* Header */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div
            style={{ background: `${COLORS.night}0D` }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <TypeIcon size={16} color={COLORS.night} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                style={{ background: `${COLORS.gold}20`, color: "#8A5A16" }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              >
                {VERIFICATION_TYPES.find((v) => v.key === request.type)?.label?.[lang] ||
                  request.type}
              </span>
              <StatusBadge status={request.status} lang={lang} />
            </div>

            <p
              style={{ color: COLORS.night }}
              className="text-sm font-semibold truncate"
            >
              {request.subject}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {request.userName} · {request.userEmail}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {t("Iliwasilishwa", "Submitted")} {timeAgo(request.submittedAt, lang)}
            </p>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-600 shrink-0"
            aria-label={expanded ? "Funga" : "Fungua"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Notes */}
        {request.notes && !expanded && (
          <p className="text-xs text-gray-600 leading-relaxed mt-2 line-clamp-2">
            {request.notes}
          </p>
        )}
      </div>

      {/* Expanded — Details */}
      {expanded && (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="border-t p-3 sm:p-4 flex flex-col gap-3 min-w-0"
        >
          {/* Notes */}
          {request.notes && (
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                {t("Maelezo", "Notes")}
              </p>
              <p className="text-xs text-gray-700 bg-white rounded-lg p-2.5 leading-relaxed break-words">
                {request.notes}
              </p>
            </div>
          )}

          {/* Documents */}
          {request.documents && request.documents.length > 0 && (
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                {t("Nyaraka", "Documents")}
              </p>
              <div className="flex flex-col gap-1.5">
                {request.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-gray-700 bg-white rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors min-w-0"
                  >
                    <FileText size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{doc.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason (kama imekataliwa) */}
          {request.status === "rejected" && request.rejectionReason && (
            <div
              style={{
                background: "rgba(193,80,46,0.08)",
                color: COLORS.rust,
              }}
              className="rounded-lg px-3 py-2 text-xs break-words"
            >
              <span className="font-semibold">
                {t("Sababu ya kukataliwa", "Rejection reason")}:
              </span>{" "}
              {request.rejectionReason}
            </div>
          )}

          {/* Reviewed info */}
          {request.reviewedAt && (
            <p className="text-[11px] text-gray-400">
              {request.status === "approved"
                ? t("Ilidhinishwa", "Approved")
                : t("Ilidhinishwa", "Reviewed")}{" "}
              {timeAgo(request.reviewedAt, lang)} · {request.reviewedBy}
            </p>
          )}

          {/* Reject reason input */}
          {rejecting && (
            <div className="min-w-0">
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

          {/* Actions — responsive */}
          {request.status === "pending" && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleApprove}
                style={{ background: COLORS.green, color: "white" }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Check size={12} />
                {t("Idhinisha", "Approve")}
              </button>

              <button
                onClick={handleReject}
                style={{
                  background: rejecting ? COLORS.rust : "transparent",
                  color: rejecting ? "white" : COLORS.rust,
                  borderColor: "rgba(193,80,46,0.35)",
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors"
              >
                <X size={12} />
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
                  className="text-xs font-semibold px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  {t("Ghairi", "Cancel")}
                </button>
              )}

              <button
                onClick={() => {
                  if (
                    window.confirm(
                      t("Ondoa ombi hili?", "Remove this request?")
                    )
                  ) {
                    removeVerification(request.id);
                  }
                }}
                className="ml-auto text-xs font-semibold px-2 py-2 rounded-lg text-gray-400 hover:text-[#C1502E] transition-colors"
              >
                {t("Ondoa", "Remove")}
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

  // Counts
  const counts = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  // Type counts
  const typeCounts = useMemo(() => {
    const counts = { all: requests.length };
    VERIFICATION_TYPES.forEach((v) => {
      counts[v.key] = requests.filter((r) => r.type === v.key).length;
    });
    return counts;
  }, [requests]);

  // Filtered
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

    // Sort: pending kwanza, kisha kwa tarehe
    result.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });

    return result;
  }, [requests, typeFilter, statusFilter, query]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <SectionHeader
        title={t("Uthibitisho", "Verification")}
        subtitle={t(
          "Idhinisha au kataa uthibitisho wa wauzaji, wanunuzi, mali, magari, na biashara.",
          "Approve or reject verifications for sellers, buyers, properties, vehicles, and businesses."
        )}
      />

      {/* Summary Stats — responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-2.5 sm:p-3 min-w-0"
        >
          <p className="text-[10px] font-semibold text-gray-500 uppercase">
            {t("Zote", "Total")}
          </p>
          <p
            style={{ color: COLORS.night }}
            className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
          >
            {counts.total}
          </p>
        </div>
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-2.5 sm:p-3 min-w-0"
        >
          <p className="text-[10px] font-semibold text-gray-500 uppercase">
            {t("Zinasubiri", "Pending")}
          </p>
          <p
            className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
            style={{ color: "#8A5A16" }}
          >
            {counts.pending}
          </p>
        </div>
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-2.5 sm:p-3 min-w-0"
        >
          <p className="text-[10px] font-semibold text-gray-500 uppercase">
            {t("Zimeidhinishwa", "Approved")}
          </p>
          <p
            className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
            style={{ color: COLORS.green }}
          >
            {counts.approved}
          </p>
        </div>
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-2.5 sm:p-3 min-w-0"
        >
          <p className="text-[10px] font-semibold text-gray-500 uppercase">
            {t("Zimekataliwa", "Rejected")}
          </p>
          <p
            className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
            style={{ color: COLORS.rust }}
          >
            {counts.rejected}
          </p>
        </div>
      </div>

      {/* Type Tabs — scroll horizontal */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setTypeFilter("all")}
          style={{
            background: typeFilter === "all" ? COLORS.night : "white",
            color: typeFilter === "all" ? COLORS.sand : COLORS.night,
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
              color: typeFilter === type.key ? COLORS.sand : COLORS.night,
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
          >
            {type.label?.[lang] || type.label?.sw} ({typeCounts[type.key]})
          </button>
        ))}
      </div>

      {/* Status Tabs + Search — responsive */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 shrink-0">
          {VERIFICATION_STATUSES.map((status) => (
            <button
              key={status.key}
              onClick={() => setStatusFilter(status.key)}
              style={{
                background: statusFilter === status.key ? COLORS.gold : "white",
                color: statusFilter === status.key ? COLORS.night : COLORS.night,
                borderColor: COLORS.sandLine,
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
            >
              {status.label?.[lang] || status.label?.sw}
            </button>
          ))}
          <button
            onClick={() => setStatusFilter("all")}
            style={{
              background: statusFilter === "all" ? COLORS.gold : "white",
              color: COLORS.night,
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
          >
            {t("Zote", "All")}
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-0 sm:max-w-xs">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Tafuta...", "Search...")}
            className="outline-none text-xs flex-1 min-w-0"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
        >
          <ShieldCheck size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 style={{ color: COLORS.night }} className="font-semibold mb-1">
            {t("Hakuna maombi ya uthibitisho", "No verification requests")}
          </h3>
          <p className="text-sm text-gray-500">
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

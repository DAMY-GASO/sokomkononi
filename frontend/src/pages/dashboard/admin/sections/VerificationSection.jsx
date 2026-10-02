// ============================================================
// VerificationSection.jsx (admin)
// - A: Admin anaona maombi, approve/reject
// - B: Admin anaweza kuomba documents zaidi
// - Upload documents kwa niaba ya mtumiaji
// ============================================================

import React, { useState, useMemo } from "react";
import {
  ShieldCheck, User, UserCheck, Building2, CarFront, Building,
  Check, X, FileText, ChevronDown, ChevronUp, Search, Trash2,
  Loader2, Upload, MessageSquare, AlertCircle,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useVerifications,
  approveVerificationAsync,
  rejectVerificationAsync,
  removeVerificationAsync,
  requestDocumentsAsync,
  uploadVerificationDocumentAsync,
  VERIFICATION_TYPES,
  VERIFICATION_STATUSES,
} from "../../../../config/verificationsStore.js";

const TYPE_ICONS = {
  seller: User,
  buyer: UserCheck,
  property: Building2,
  vehicle: CarFront,
  business: Building,
};

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
  return (
    <span
      style={{ background: s?.bg, color: s?.fg }}
      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
    >
      {s.label?.[lang] || s.label?.sw}
    </span>
  );
}

function VerificationCard({ request, lang }) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestingDocs, setRequestingDocs] = useState(false);
  const [docsMessage, setDocsMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = React.useRef(null);

  const TypeIcon = TYPE_ICONS[request.type] || ShieldCheck;
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const hasDocsRequest = !!request.documentsRequestedAt;

  const handleApprove = async () => {
    if (!window.confirm(t(
      `Idhinisha uthibitisho wa "${request.subject}"?`,
      `Approve verification for "${request.subject}"?`
    ))) return;

    setBusy(true);
    setError("");
    const res = await approveVerificationAsync(request.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error?.message || t("Imeshindwa.", "Failed."));
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
      setError(res.error?.message || t("Imeshindwa.", "Failed."));
    }
  };

  const handleRequestDocs = async () => {
    if (!requestingDocs) {
      setRequestingDocs(true);
      return;
    }
    if (!docsMessage.trim()) {
      setError(t("Andika ujumbe kwa mtumiaji.", "Write a message for the user."));
      return;
    }
    setBusy(true);
    setError("");
    const res = await requestDocumentsAsync(request.id, docsMessage.trim());
    setBusy(false);
    if (res.ok) {
      setRequestingDocs(false);
      setDocsMessage("");
    } else {
      setError(res.error?.message || t("Imeshindwa.", "Failed."));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError(t("Faili ni kubwa sana (max 10MB).", "File too large (max 10MB)."));
      return;
    }
    setUploading(true);
    setError("");
    const res = await uploadVerificationDocumentAsync(request.id, file);
    setUploading(false);
    if (!res.ok) {
      setError(res.error?.message || t("Imeshindwa kupakia.", "Upload failed."));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = async () => {
    if (!window.confirm(t("Ondoa ombi hili?", "Remove this request?"))) return;
    setBusy(true);
    setError("");
    const res = await removeVerificationAsync(request.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error?.message || t("Imeshindwa.", "Failed."));
    }
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border overflow-hidden w-full"
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div
            style={{ background: `${COLORS.night}0D` }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <TypeIcon size={15} color={COLORS.night} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                style={{ background: `${COLORS.gold}20`, color: "#8A5A16" }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {VERIFICATION_TYPES.find((v) => v.key === request.type)?.label?.[lang] ||
                  request.type}
              </span>
              <StatusBadge status={request.status} lang={lang} />
              {hasDocsRequest && (
                <span
                  style={{ background: "rgba(232,163,61,0.20)", color: "#8A5A16" }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                >
                  {t("Docs zimeombwa", "Docs requested")}
                </span>
              )}
            </div>

            <p className="text-sm font-semibold truncate">{request.subject}</p>
            <p className="text-xs text-secondary mt-0.5 truncate">{request.userName}</p>
            <p className="text-[10px] text-muted mt-0.5 truncate">{request.userEmail}</p>
            <p className="text-[11px] text-muted mt-1">
              {t("Iliwasilishwa", "Submitted")} {timeAgo(request.submittedAt, lang)}
            </p>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-muted hover:text-secondary shrink-0"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="border-t p-3 sm:p-4 flex flex-col gap-3"
        >
          {error && (
            <div
              style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
            >
              {error}
            </div>
          )}

          {/* Notes */}
          {request.notes && (
            <div>
              <p className="text-[10px] font-semibold text-secondary uppercase mb-1">
                {t("Maelezo", "Notes")}
              </p>
              <p className="text-xs text-primary bg-white rounded-lg p-2.5 leading-relaxed">
                {request.notes}
              </p>
            </div>
          )}

          {/* Documents */}
          {request.documents && request.documents.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-secondary uppercase mb-1">
                {t("Nyaraka", "Documents")} ({request.documents.length})
              </p>
              <div className="flex flex-col gap-1.5">
                {request.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url || doc.file || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-primary bg-white rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <FileText size={12} className="text-muted shrink-0" />
                    <span className="truncate flex-1">{doc.name || `Document ${i + 1}`}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Docs request message */}
          {hasDocsRequest && request.documentsRequestMessage && (
            <div
              style={{
                background: "rgba(232,163,61,0.12)",
                color: "#8A5A16",
                borderColor: "rgba(232,163,61,0.35)",
              }}
              className="rounded-lg border px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <MessageSquare size={11} />
                {t("Ujumbe kwa mtumiaji", "Message to user")}
              </div>
              {request.documentsRequestMessage}
              <p className="text-[10px] mt-1 opacity-75">
                {timeAgo(request.documentsRequestedAt, lang)}
              </p>
            </div>
          )}

          {/* Rejection reason */}
          {request.status === "rejected" && request.rejectionReason && (
            <div
              style={{ background: "rgba(193,80,46,0.08)", color: COLORS.rust }}
              className="rounded-lg px-3 py-2 text-xs"
            >
              <span className="font-semibold">
                {t("Sababu ya kukataliwa", "Rejection reason")}:
              </span>{" "}
              {request.rejectionReason}
            </div>
          )}

          {/* Reviewed info */}
          {request.reviewedAt && (
            <p className="text-[11px] text-muted">
              {request.status === "approved"
                ? t("Ilidhinishwa", "Approved")
                : t("Ilikaguliwa", "Reviewed")}{" "}
              {timeAgo(request.reviewedAt, lang)} · {request.reviewedBy}
            </p>
          )}

          {/* Reject reason input */}
          {rejecting && (
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
          )}

          {/* Docs request message input */}
          {requestingDocs && (
            <textarea
              value={docsMessage}
              onChange={(e) => setDocsMessage(e.target.value)}
              placeholder={t(
                "Eleza documents zipi unahitaji...",
                "Explain which documents you need..."
              )}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-xs outline-none resize-none bg-white"
              style={{ borderColor: COLORS.sandLine }}
            />
          )}

          {/* Actions */}
          {request.status === "pending" && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleApprove}
                disabled={busy || uploading}
                style={{ background: COLORS.green, color: "white" }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {t("Idhinisha", "Approve")}
              </button>

              <button
                onClick={handleReject}
                disabled={busy || uploading}
                style={{
                  background: rejecting ? COLORS.rust : "transparent",
                  color: rejecting ? "white" : COLORS.rust,
                  borderColor: "rgba(193,80,46,0.35)",
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border disabled:opacity-50"
              >
                {busy && rejecting ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                {rejecting
                  ? t("Thibitisha", "Confirm")
                  : t("Kataa", "Reject")}
              </button>

              {rejecting && (
                <button
                  onClick={() => {
                    setRejecting(false);
                    setRejectReason("");
                  }}
                  disabled={busy}
                  className="text-xs font-semibold px-3 py-2 rounded-lg text-secondary hover:bg-gray-100"
                >
                  {t("Ghairi", "Cancel")}
                </button>
              )}

              {/* Omba docs */}
              <button
                onClick={handleRequestDocs}
                disabled={busy || uploading}
                style={{
                  background: requestingDocs ? COLORS.gold : "transparent",
                  color: requestingDocs ? COLORS.night : "#8A5A16",
                  borderColor: "rgba(232,163,61,0.5)",
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border disabled:opacity-50"
              >
                {busy && requestingDocs ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <MessageSquare size={12} />
                )}
                {requestingDocs
                  ? t("Tuma Ombi", "Send Request")
                  : t("Omba Docs", "Request Docs")}
              </button>

              {requestingDocs && (
                <button
                  onClick={() => {
                    setRequestingDocs(false);
                    setDocsMessage("");
                  }}
                  disabled={busy}
                  className="text-xs font-semibold px-3 py-2 rounded-lg text-secondary hover:bg-gray-100"
                >
                  {t("Ghairi", "Cancel")}
                </button>
              )}

              {/* Upload document kwa niaba */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={busy || uploading}
                style={{ borderColor: COLORS.sandLine, color: "var(--text-primary)" }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border bg-white disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} />
                )}
                {t("Pakia", "Upload")}
              </button>

              <button
                onClick={handleRemove}
                disabled={busy || uploading}
                className="ml-auto text-xs font-semibold p-2 rounded-lg text-muted hover:text-[#C1502E] disabled:opacity-50"
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
    if (typeFilter !== "all") result = result.filter((r) => r.type === typeFilter);
    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter);
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
          "Idhinisha, kataa, au omba documents zaidi kwa wauzaji, wanunuzi, mali, magari, na biashara.",
          "Approve, reject, or request more documents from sellers, buyers, properties, vehicles, and businesses."
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
            className="rounded-xl border p-2.5 sm:p-3"
          >
            <p className="text-[10px] font-semibold text-secondary uppercase truncate">
              {stat.label}
            </p>
            <p style={{ color: stat.color }} className="text-base sm:text-lg lg:text-xl font-bold mt-0.5">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Type Tabs */}
      <div className="flex justify-center gap-2 mb-3 overflow-x-auto pb-2">
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
      <div className="flex justify-center gap-2 mb-3 overflow-x-auto pb-2">
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
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-4">
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
          className="rounded-2xl border-2 border-dashed p-8 text-center"
        >
          <ShieldCheck size={40} className="mx-auto text-muted mb-3" />
          <h3 className="font-semibold mb-1">
            {t("Hakuna maombi ya uthibitisho", "No verification requests")}
          </h3>
          <p className="text-sm text-secondary">
            {query || typeFilter !== "all" || statusFilter !== "all"
              ? t(
                  "Jaribu kubadilisha vichujio au utafutaji.",
                  "Try changing filters or search."
                )
              : t(
                  "Maombi yataonekana hapa.",
                  "Requests will appear here."
                )}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((request) => (
            <VerificationCard key={request.id} request={request} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
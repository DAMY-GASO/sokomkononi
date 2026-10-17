// ============================================================
// VerificationSection.jsx (admin)
// - Admin anaona maombi, approve/reject
// - Admin anaweza kuomba documents zaidi
// - Admin anaweza kuona UserDrawer (muktadha kamili)
// - Documents zinaonyeshwa kama preview (image/PDF)
// - Filter ya type (Seller/Buyer) iko ndani ya search bar
//
// SASISHO: DocumentPreview inafetch signed URL mpya kila
// "Fungua"/"Onyesha" (URL inaisha baada ya SIGNED_URL_EXPIRY).
// ============================================================

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  User,
  UserCheck,
  Check,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
  Loader2,
  MessageSquare,
  ExternalLink,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import UserDrawer from "../shared/UserDrawer.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useVerifications,
  approveVerificationAsync,
  rejectVerificationAsync,
  removeVerificationAsync,
  requestDocumentsAsync,
  fetchDocumentUrlAsync,
  VERIFICATION_TYPES,
  VERIFICATION_STATUSES,
} from "../../../../config/verificationsStore.js";

const TYPE_ICONS = {
  seller: User,
  buyer: UserCheck,
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

function RoleBadge({ role, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  if (role === "both") {
    return (
      <span
        style={{ background: "rgba(124,58,237,0.14)", color: "#7C3AED" }}
        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
      >
        {t("Wote Wawili", "Both Roles")}
      </span>
    );
  }
  if (role === "seller") {
    return (
      <span
        style={{ background: "rgba(232,163,61,0.16)", color: "#8A5A16" }}
        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
      >
        {t("Muuzaji", "Seller")}
      </span>
    );
  }
  if (role === "buyer") {
    return (
      <span
        style={{ background: "rgba(47,109,79,0.14)", color: COLORS.green }}
        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
      >
        {t("Mnunuzi", "Buyer")}
      </span>
    );
  }
  return null;
}

const MIN_REASON = 5;

// ============================================================
// DOCUMENT PREVIEW
// ============================================================
function DocumentPreview({ doc, verificationId, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [freshUrl, setFreshUrl] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const isImage = doc.is_image;
  const isPdf = doc.is_pdf;

  // Tumia freshUrl kama ipo, vinginevyo doc.url
  const url = freshUrl || doc.url || doc.preview_url;

  // ── Fungua document: fetch URL mpya kutoka backend ──
  
  const getStreamUrl = () => {
    const token = localStorage.getItem("sokomkononi_admin_access") || localStorage.getItem("sokomkononi_access") || "";
    const base = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
    return `${base}/verifications/${verificationId}/documents/${doc.id}/stream/?token=${encodeURIComponent(token)}`;
  };

  const handleOpen = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;
    setLoading(true);
    setLoadError(false);

    try {
      const { url, token } = getStreamUrl(doc.id);
      const res = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.status === 404) {
        setLoadError(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setLoadError(true);
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      window.open(objUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
    } catch (err) {
      console.error("[DocumentPreview] stream failed:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };;;

  // ── Preview: pia refresh kabla ya kuonyesha ──
  const handleExpand = async () => {
    if (expanded) { setExpanded(false); return; }
    setFreshUrl(getStreamUrl());
    setExpanded(true);
  };

  if (!doc.id) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted bg-white rounded-lg px-3 py-2">
        <FileText size={12} className="shrink-0" />
        <span className="truncate flex-1">
          {doc.name || t("Document", "Document")}
        </span>
        <span className="text-[10px] text-muted italic">
          {t("Hakuna ID", "No ID")}
        </span>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg overflow-hidden"
      style={{ borderColor: COLORS.sandLine }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: COLORS.sandLine }}
      >
        <FileText size={12} className="shrink-0 text-muted" />
        <span className="truncate flex-1 text-xs text-primary">
          {doc.name || t("Document", "Document")}
        </span>
        <button
          type="button"
          onClick={handleExpand}
          disabled={loading}
          className="text-[10px] font-semibold text-muted hover:text-secondary flex items-center gap-1 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Eye size={11} />
          )}
          {expanded ? t("Funga", "Close") : t("Onyesha", "Show")}
        </button>
        <a
          href={url || "#"}
          onClick={handleOpen}
          target="_blank"
          rel="noreferrer"
          download={doc.name || undefined}
          className="text-[10px] font-semibold hover:underline flex items-center gap-1"
          style={{ color: COLORS.rust }}
        >
          {loading ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <ExternalLink size={11} />
          )}
          {t("Fungua", "Open")}
        </a>
      </div>

      {expanded && (
        <div className="p-2">
          {loadError ? (
            <div className="text-center py-6">
              <AlertTriangle
                size={32}
                className="mx-auto mb-2"
                color={COLORS.rust}
              />
              <p className="text-xs text-secondary mb-3">
                {t(
                  "Imeshindwa kupakia document. Bofya 'Fungua' ili kuipakua.",
                  "Failed to load document. Click 'Open' to download."
                )}
              </p>
            </div>
          ) : isImage ? (
            <img
              src={url}
              alt={doc.name || "Document"}
              className="w-full max-h-96 object-contain rounded"
              onError={() => setLoadError(true)}
            />
          ) : isPdf ? (
            <iframe
              src={url}
              title={doc.name || "PDF"}
              className="w-full h-96 rounded"
              style={{ border: "none" }}
              onError={() => setLoadError(true)}
            />
          ) : (
            <div className="text-center py-6">
              <FileText size={32} className="mx-auto text-muted mb-2" />
              <p className="text-xs text-secondary mb-3">
                {t(
                  "Aina ya faili haijulikani — bofya 'Fungua' ili kuipakua.",
                  "Unknown file type — click 'Open' to download."
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// VERIFICATION CARD
// ============================================================
function VerificationCard({ request, lang, onOpenUser }) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestingDocs, setRequestingDocs] = useState(false);
  const [docsMessage, setDocsMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const TypeIcon = TYPE_ICONS[request.type] || ShieldCheck;
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const hasDocsRequest = !!request.documentsRequestedAt;

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
      setError(res.error?.message || t("Imeshindwa.", "Failed."));
    }
  };

  const handleReject = async () => {
    if (!rejecting) {
      setRejecting(true);
      setError("");
      return;
    }

    const reason = rejectReason.trim();
    if (reason.length < MIN_REASON) {
      setError(
        t(
          `Sababu ya kukataa lazima iwe na angalau herufi ${MIN_REASON}.`,
          `Rejection reason must be at least ${MIN_REASON} characters.`
        )
      );
      return;
    }

    setBusy(true);
    setError("");
    const res = await rejectVerificationAsync(request.id, reason);
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
              {request.isBothRoles ? (
                <RoleBadge role="both" lang={lang} />
              ) : (
                <span
                  style={{ background: `${COLORS.gold}20`, color: "#8A5A16" }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                >
                  {VERIFICATION_TYPES.find((v) => v.key === request.type)
                    ?.label?.[lang] || request.type}
                </span>
              )}
              <StatusBadge status={request.status} lang={lang} />
              {hasDocsRequest && (
                <span
                  style={{
                    background: "rgba(232,163,61,0.20)",
                    color: "#8A5A16",
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                >
                  {t("Docs zimeombwa", "Docs requested")}
                </span>
              )}
            </div>

            <p className="text-sm font-semibold truncate">{request.subject}</p>
            <p className="text-xs text-secondary mt-0.5 truncate">
              {request.userName}
            </p>
            <p className="text-[10px] text-muted mt-0.5 truncate">
              {request.userEmail}
            </p>
            <p className="text-[11px] text-muted mt-1">
              {t("Iliwasilishwa", "Submitted")}{" "}
              {timeAgo(request.submittedAt, lang)}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {request.userId && onOpenUser && (
              <button
                onClick={() =>
                  onOpenUser({
                    id: request.userId,
                    name: request.userName,
                    email: request.userEmail,
                    isVerified: request.status === "approved",
                  })
                }
                title={t("Angalia mtumiaji", "View user")}
                className="p-1.5 text-muted hover:text-secondary transition-colors"
              >
                <User size={16} />
              </button>
            )}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-muted hover:text-secondary"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
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

          {request.documents && request.documents.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-secondary uppercase mb-1">
                {t("Nyaraka", "Documents")} ({request.documents.length})
              </p>
              <div className="flex flex-col gap-2">
                {request.documents.map((doc, i) => (
                  <DocumentPreview
                    key={doc.id || i}
                    doc={doc}
                    verificationId={request.id}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          )}

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

          {request.reviewedAt && (
            <p className="text-[11px] text-muted">
              {request.status === "approved"
                ? t("Ilidhinishwa", "Approved")
                : t("Ilikaguliwa", "Reviewed")}{" "}
              {timeAgo(request.reviewedAt, lang)}
              {request.reviewedByName && ` · ${request.reviewedByName}`}
            </p>
          )}

          {rejecting && (
            <div>
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (error) setError("");
                }}
                placeholder={t(
                  "Sababu ya kukataa (angalau herufi 5)...",
                  "Reason for rejection (at least 5 characters)..."
                )}
                rows={2}
                className="w-full rounded-lg border px-3 py-2 text-xs outline-none resize-none bg-white"
                style={{ borderColor: COLORS.sandLine }}
              />
              <p className="text-[10px] text-muted mt-1 text-right">
                {rejectReason.trim().length}/{MIN_REASON}+
              </p>
            </div>
          )}

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

          {request.status === "pending" && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleApprove}
                disabled={busy}
                style={{ background: COLORS.green, color: "white" }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
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
                disabled={
                  busy || (rejecting && rejectReason.trim().length < MIN_REASON)
                }
                style={{
                  background: rejecting ? COLORS.rust : "transparent",
                  color: rejecting ? "white" : COLORS.rust,
                  borderColor: "rgba(193,80,46,0.35)",
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border disabled:opacity-50"
              >
                {busy && rejecting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <X size={12} />
                )}
                {rejecting ? t("Thibitisha", "Confirm") : t("Kataa", "Reject")}
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

              <button
                onClick={handleRequestDocs}
                disabled={busy}
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

              <button
                onClick={handleRemove}
                disabled={busy}
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

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function VerificationSection() {
  const { lang } = useLanguage();
  const requests = useVerifications();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const counts = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  const filtered = useMemo(() => {
    let result = [...requests];

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((r) => r.type === typeFilter);
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
  }, [requests, statusFilter, typeFilter, query]);

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Uthibitisho", "Verification")}
        subtitle={t(
          "Idhinisha, kataa, au omba documents zaidi kwa wauzaji na wanunuzi.",
          "Approve, reject, or request more documents from sellers and buyers."
        )}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 w-full">
        {[
          {
            label: t("Zote", "Total"),
            value: counts.total,
            color: "var(--text-primary)",
          },
          {
            label: t("Zinasubiri", "Pending"),
            value: counts.pending,
            color: "#8A5A16",
          },
          {
            label: t("Zimeidhinishwa", "Approved"),
            value: counts.approved,
            color: COLORS.green,
          },
          {
            label: t("Zimekataliwa", "Rejected"),
            value: counts.rejected,
            color: COLORS.rust,
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{ borderColor: COLORS.sandLine, background: "white" }}
            className="rounded-xl border p-2.5 sm:p-3"
          >
            <p className="text-[10px] font-semibold text-secondary uppercase truncate">
              {stat.label}
            </p>
            <p
              style={{ color: stat.color }}
              className="text-base sm:text-lg lg:text-xl font-bold mt-0.5"
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-2 sm:justify-center">
        <button
          onClick={() => setStatusFilter("all")}
          style={{
            background: statusFilter === "all" ? COLORS.gold : "white",
            color: "var(--text-primary)",
            borderColor: COLORS.sandLine,
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
        >
          {t("Zote", "All")} ({counts.total})
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

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Tafuta...", "Search...")}
            className="smk-inline-search w-full rounded-lg border border-gray-200 bg-white pl-3 pr-10 py-2 text-xs outline-none focus:outline-none focus-visible:outline-none"
            style={{ WebkitAppearance: "none" }}
          />
          <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-primary shrink-0"
        >
          <option value="all">{t("Aina: Zote", "Type: All")}</option>
          {VERIFICATION_TYPES.map((type) => (
            <option key={type.key} value={type.key}>
              {type.label?.[lang] || type.label?.sw}
            </option>
          ))}
        </select>
      </div>

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
              : t("Maombi yataonekana hapa.", "Requests will appear here.")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((request) => (
            <VerificationCard
              key={request.id}
              request={request}
              lang={lang}
              onOpenUser={setSelectedUser}
            />
          ))}
        </div>
      )}

      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
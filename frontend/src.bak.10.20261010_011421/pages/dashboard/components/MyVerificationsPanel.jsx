// ============================================================
// MyVerificationsPanel.jsx (mtumiaji)
// - C: Mtumiaji anaomba uthibitisho
// - Upload documents
// - Anaona status ya maombi yake
// ============================================================
import React, { useState } from "react";
import {
  ShieldCheck, Loader2, Upload, FileText, Plus, X,
} from "lucide-react";
import { COLORS, timeAgo } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import {
  useVerifications,
  addVerificationAsync,
  uploadVerificationDocumentAsync,
  VERIFICATION_TYPES,
} from "../../../config/verificationsStore.js";

export default function MyVerificationsPanel() {
  const { lang } = useLanguage();
  const requests = useVerifications();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "seller",
    subject: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.type || !form.subject.trim()) {
      setError(t("Jaza sehemu zote.", "Fill all fields."));
      return;
    }
    setBusy(true);
    setError("");
    const res = await addVerificationAsync({
      type: form.type,
      subject: form.subject.trim(),
      notes: form.notes.trim(),
    });
    setBusy(false);
    if (res.ok) {
      setForm({ type: "seller", subject: "", notes: "" });
      setShowForm(false);
    } else {
      setError(res.error?.message || t("Imeshindwa.", "Failed."));
    }
  };

  const handleUpload = async (reqId, file) => {
    if (!file) return;
    setBusy(true);
    const res = await uploadVerificationDocumentAsync(reqId, file);
    setBusy(false);
    if (!res.ok) {
      setError(res.error?.message || t("Imeshindwa kupakia.", "Upload failed."));
    }
  };

  return (
    <div style={{ background: COLORS.sand, minHeight: "600px" }} className="w-full p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <ShieldCheck size={32} color={COLORS.gold} className="mx-auto mb-2" />
          <h1 className="h-title">{t("Uthibitisho Wangu", "My Verifications")}</h1>
          <p className="text-secondary text-sm mt-2">
            {t(
              "Omba uthibitisho na ufuatilie hali ya maombi yako.",
              "Request verification and track your request status."
            )}
          </p>
        </div>

        {error && (
          <div
            style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
            className="rounded-xl px-3 py-2 mb-4 text-xs"
          >
            {error}
          </div>
        )}

        <button
          onClick={() => setShowForm((v) => !v)}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-4"
        >
          <Plus size={16} />
          {showForm ? t("Funga Form", "Close Form") : t("Omba Uthibitisho Mpya", "Request New Verification")}
        </button>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{ background: "white", borderColor: COLORS.sandLine }}
            className="rounded-2xl border p-4 mb-4 flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-secondary">
                {t("Aina ya Uthibitisho", "Verification Type")}
              </span>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              >
                {VERIFICATION_TYPES.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label?.[lang] || v.label?.sw}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-secondary">
                {t("Kichwa / Jina", "Subject / Name")}
              </span>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder={t("mfano: Jina lako kamili", "e.g. Your full name")}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-secondary">
                {t("Maelezo (hiari)", "Notes (optional)")}
              </span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              style={{ background: COLORS.green, color: "white" }}
              className="py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}
              {t("Tuma Ombi", "Submit Request")}
            </button>
          </form>
        )}

        {/* Requests list */}
        <div className="flex flex-col gap-3">
          {requests.length === 0 ? (
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-2xl border-2 border-dashed p-8 text-center"
            >
              <p className="text-sm text-muted">
                {t("Hakuna maombi bado.", "No requests yet.")}
              </p>
            </div>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                style={{ background: "white", borderColor: COLORS.sandLine }}
                className="rounded-xl border p-4"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E8A33D]/20 text-[#8A5A16]">
                    {VERIFICATION_TYPES.find((v) => v.key === r.type)?.label?.[lang] || r.type}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        r.status === "approved" ? "rgba(47,109,79,0.16)" :
                        r.status === "rejected" ? "rgba(193,80,46,0.16)" :
                        "rgba(232,163,61,0.16)",
                      color:
                        r.status === "approved" ? COLORS.green :
                        r.status === "rejected" ? COLORS.rust :
                        "#8A5A16",
                    }}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-sm font-semibold mb-1">{r.subject}</p>
                <p className="text-xs text-muted mb-2">
                  {t("Iliwasilishwa", "Submitted")} {timeAgo(r.submittedAt, lang)}
                </p>

                {r.documentsRequestMessage && (
                  <div
                    style={{ background: "rgba(232,163,61,0.10)", color: "#8A5A16" }}
                    className="rounded-lg px-2.5 py-2 text-xs mb-2"
                  >
                    <strong>{t("Admin:", "Admin:")}</strong> {r.documentsRequestMessage}
                  </div>
                )}

                {r.rejectionReason && (
                  <div
                    style={{ background: "rgba(193,80,46,0.08)", color: COLORS.rust }}
                    className="rounded-lg px-2.5 py-2 text-xs mb-2"
                  >
                    <strong>{t("Sababu:", "Reason:")}</strong> {r.rejectionReason}
                  </div>
                )}

                {r.documents?.length > 0 && (
                  <div className="flex flex-col gap-1 mb-2">
                    {r.documents.map((doc, i) => (
                      <a
                        key={i}
                        href={doc.url || doc.file || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary hover:text-[#E8A33D]"
                      >
                        <FileText size={11} /> {doc.name || `Document ${i + 1}`}
                      </a>
                    ))}
                  </div>
                )}

                {r.status === "pending" && (
                  <label className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border cursor-pointer"
                    style={{ borderColor: COLORS.sandLine }}>
                    {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {t("Pakia Document", "Upload Document")}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleUpload(r.id, e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
// ============================================================
// MyVerificationsPanel.jsx (mtumiaji)
// - Mtumiaji anaomba uthibitisho
// - Upload documents
// - Anaona status ya maombi yake
// + Hydrate kutoka API kwenye mount
// ✅ MPYA: Ushawishi + mahitaji ya documents wazi kwa kila aina
// ============================================================
import React, { useState, useEffect } from "react";
import {
  ShieldCheck, Loader2, Upload, FileText, Plus, X,
  CheckCircle2, TrendingUp, Award, Clock,
  UserRound, Store, ShoppingBag, Info,
} from "lucide-react";
import { COLORS, timeAgo } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import {
  useVerifications,
  hydrateVerificationsFromApi,
  addVerificationAsync,
  uploadVerificationDocumentAsync,
  VERIFICATION_TYPES,
  VERIFICATION_CREATE_TYPES,
} from "../../../config/verificationsStore.js";

// ============================================================
// MAHITAJI YA DOCUMENTS KWA KILA AINA YA UTHIBITISHO
// ============================================================
const REQUIREMENTS_BY_TYPE = {
  seller: {
    icon: Store,
    color: COLORS.green,
    titleSw: "Kwa Muuzaji (Seller)",
    titleEn: "For Seller",
    documentsSw: [
      "Kadi ya NIDA au Pasipoti (picha ya mbele na nyuma)",
      "Leseni ya biashara (Business Licence) — kama una biashara rasmi",
      "Hati miliki ya mali (Property Title) — kama wewe ni mmiliki",
      "Barua ya uthibitisho kutoka Serikali ya Mtaa/Kijiji",
    ],
    documentsEn: [
      "NIDA Card or Passport (front and back photos)",
      "Business Licence — if you run a registered business",
      "Property Title Deed — if you're the property owner",
      "Local Government/Street verification letter",
    ],
    benefitsSw: [
      "Ongeza uaminifu kwa wanunuzi wanaotaka kununua mali yako",
      "Tangazo lako lionekane juu kwenye matokeo ya utafutaji",
      "Pata beji ya 'Verified Seller' kwenye profile yako",
      "Fungua deals zaidi na kwa haraka",
    ],
    benefitsEn: [
      "Build trust with buyers interested in your property",
      "Your listings rank higher in search results",
      "Get a 'Verified Seller' badge on your profile",
      "Close more deals, faster",
    ],
  },
  buyer: {
    icon: ShoppingBag,
    color: "#2563EB",
    titleSw: "Kwa Mnunuzi (Buyer)",
    titleEn: "For Buyer",
    documentsSw: [
      "Kadi ya NIDA au Pasipoti (picha ya mbele na nyuma)",
      "Uthibitisho wa makazi — bili ya umeme/maji au barua ya mtaa",
      "Namba ya simu iliyosajiliwa kwa jina lako (kwa malipo)",
    ],
    documentsEn: [
      "NIDA Card or Passport (front and back photos)",
      "Proof of residence — utility bill or local letter",
      "Phone number registered under your name (for payments)",
    ],
    benefitsSw: [
      "Wauzaji watakuamini zaidi na kukubali kujadiliana nawe",
      "Upate kipaumbele kwenye deal rooms za mali unazovutiwa",
      "Pata beji ya 'Verified Buyer' kwenye profile yako",
      "Rahisi kufanya malipo na reservations",
    ],
    benefitsEn: [
      "Sellers trust you more and negotiate with you",
      "Get priority in deal rooms for properties you like",
      "Get a 'Verified Buyer' badge on your profile",
      "Easier to make payments and reservations",
    ],
  },
};

// ============================================================
// SUB-COMPONENT: Kadi ya Ushawishi (Why Get Verified?)
// ============================================================
function WhyGetVerifiedCard({ lang, type }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const req = REQUIREMENTS_BY_TYPE[type] || REQUIREMENTS_BY_TYPE.buyer;
  const benefits = lang === "sw" ? req.benefitsSw : req.benefitsEn;

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 mb-4"
      style={{
        background: "linear-gradient(135deg, #011957 0%, #1a2842 100%)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Award size={20} color={COLORS.gold} />
        {/* ✅ Tumia !text-white kulazimisha rangi nyeupe */}
        <h3 className="text-sm sm:text-base font-bold !text-white">
          {t("Kwa Nini Uthibitishe Akaunti Yako?", "Why Get Verified?")}
        </h3>
      </div>
      <ul className="space-y-2">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
            <CheckCircle2
              size={14}
              color={COLORS.gold}
              className="shrink-0 mt-0.5"
            />
            {/* ✅ Tumia !text-white hapa pia */}
            <span className="!text-white">{b}</span>
          </li>
        ))}
      </ul>
      <div
        className="mt-3 rounded-lg px-3 py-2 flex items-center gap-2"
        style={{ background: "rgba(232,163,61,0.15)" }}
      >
        <Info size={13} color={COLORS.gold} className="shrink-0" />
        <p className="text-[11px] sm:text-xs !text-white">
          {t(
            "Uthibitisho ni BURE. Utachukua siku 1-3 za kazi kukamilika.",
            "Verification is FREE. It takes 1-3 business days to complete."
          )}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: Kadi ya Mahitaji (What You Need)
// ============================================================
function RequirementsCard({ lang, type, compact = false }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const req = REQUIREMENTS_BY_TYPE[type] || REQUIREMENTS_BY_TYPE.buyer;
  const Icon = req.icon;
  const documents = lang === "sw" ? req.documentsSw : req.documentsEn;

  if (compact) {
    // Compact — kwa ndani ya form
    return (
      <div
        className="rounded-xl border p-3"
        style={{
          background: "rgba(47,109,79,0.04)",
          borderColor: "rgba(47,109,79,0.2)",
        }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <FileText size={13} color={req.color} />
          <p className="text-xs font-bold" style={{ color: req.color }}>
            {t(
              "Documents Zinazohitajika",
              "Required Documents"
            )}
          </p>
        </div>
        <ul className="space-y-1 ml-1">
          {documents.map((d, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-[11px] sm:text-xs text-secondary"
            >
              <span
                className="font-bold shrink-0"
                style={{ color: req.color }}
              >
                {i + 1}.
              </span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Full — kwa kila aina (Seller + Buyer zote)
  return (
    <div
      style={{ background: "white", borderColor: COLORS.sandLine }}
      className="rounded-2xl border p-4 mb-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <FileText size={16} color={COLORS.night} />
        <h3 className="text-sm font-bold text-primary">
          {t("Documents Zinazohitajika", "Required Documents")}
        </h3>
      </div>

      <div className="space-y-3">
        {["seller", "buyer"].map((key) => {
          const r = REQUIREMENTS_BY_TYPE[key];
          const rIcon = r.icon;
          const docs = lang === "sw" ? r.documentsSw : r.documentsEn;
          return (
            <div
              key={key}
              className="rounded-lg p-3 border"
              style={{
                background: `${r.color}08`,
                borderColor: `${r.color}25`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <rIcon size={13} color={r.color} />
                <p className="text-xs font-bold" style={{ color: r.color }}>
                  {lang === "sw" ? r.titleSw : r.titleEn}
                </p>
              </div>
              <ul className="space-y-0.5 ml-1">
                {docs.map((d, i) => (
                  <li
                    key={i}
                    className="text-[11px] sm:text-xs text-secondary flex items-start gap-1.5"
                  >
                    <span style={{ color: r.color }} className="font-bold shrink-0">
                      {i + 1}.
                    </span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] sm:text-xs text-muted mt-3 leading-relaxed">
        {t(
          "Kumbuka: Picha ziwe wazi. Ukikosa document moja, unaweza kuomba na kuipakia baadaye — Admin atakuomba.",
          "Note: Photos should be clear. If you miss a document, you can still submit and upload later — Admin will request it."
        )}
      </p>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MyVerificationsPanel({ side = "buyer" }) {
  const { lang } = useLanguage();
  const requests = useVerifications();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: side === "seller" ? "seller" : "buyer",
    subject: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // Hydrate kutoka backend kwenye mount
  useEffect(() => {
    hydrateVerificationsFromApi();
  }, []);

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
      setForm({
        type: side === "seller" ? "seller" : "buyer",
        subject: "",
        notes: "",
      });
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
    <div
      style={{ background: COLORS.sand, minHeight: "600px" }}
      className="w-full p-4 sm:p-6"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <ShieldCheck size={36} color={COLORS.gold} className="mx-auto mb-2" />
          <h1 className="h-title">
            {t("Uthibitisho Wangu", "My Verifications")}
          </h1>
          <p className="text-secondary text-sm mt-2 max-w-md mx-auto">
            {t(
              "Pata beji ya uthibitisho — ongeza uaminifu, fungua deals zaidi, na uonekane juu ya wengine.",
              "Get a verified badge — build trust, close more deals, and stand out from the crowd."
            )}
          </p>
        </div>

        {/* ✅ Kadi ya Ushawishi */}
        <WhyGetVerifiedCard lang={lang} type={form.type} />

        {/* ✅ Kadi ya Mahitaji (Seller + Buyer zote) */}
        <RequirementsCard lang={lang} />

        {/* Error */}
        {error && (
          <div
            style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
            className="rounded-xl px-3 py-2 mb-4 text-xs"
          >
            {error}
          </div>
        )}

        {/* Button ya Kuomba */}
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-4"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm
            ? t("Funga Form", "Close Form")
            : t("Omba Uthibitisho Mpya", "Request New Verification")}
        </button>

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{ background: "white", borderColor: COLORS.sandLine }}
            className="rounded-2xl border p-4 mb-4 flex flex-col gap-3"
          >
            {/* Aina */}
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-secondary">
                {t("Aina ya Uthibitisho", "Verification Type")}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {VERIFICATION_CREATE_TYPES.map((v) => {
                  const Icon =
                    v.key === "seller" ? Store : ShoppingBag;
                  const active = form.type === v.key;
                  const color =
                    v.key === "seller" ? COLORS.green : "#2563EB";
                  return (
                    <button
                      type="button"
                      key={v.key}
                      onClick={() => setForm({ ...form, type: v.key })}
                      style={{
                        background: active ? `${color}12` : "white",
                        borderColor: active ? color : COLORS.sandLine,
                        color: active ? color : COLORS.night,
                      }}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg border"
                    >
                      <Icon size={13} />
                      {v.label?.[lang] || v.label?.sw}
                    </button>
                  );
                })}
              </div>
            </label>

            {/* ✅ Mahitaji maalum kwa aina iliyochaguliwa */}
            <RequirementsCard lang={lang} type={form.type} compact />

            {/* Subject */}
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-secondary">
                {t("Jina Kamili (kama ilivyo kwenye NIDA)", "Full Name (as on NIDA)")}
              </span>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder={t(
                  "mfano: Juma Hamisi Mwakyusa",
                  "e.g. Juma Hamisi Mwakyusa"
                )}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </label>

            {/* Notes */}
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-secondary">
                {t("Maelezo ya Ziada (hiari)", "Additional Notes (optional)")}
              </span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder={t(
                  "Eleza uzoefu wako au sababu ya kuomba uthibitisho...",
                  "Describe your experience or why you're requesting verification..."
                )}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none"
              />
            </label>

            <div
              style={{ background: "rgba(232,163,61,0.10)", color: "#8A5A16" }}
              className="rounded-lg px-3 py-2 text-[11px] flex items-start gap-2"
            >
              <Clock size={12} className="shrink-0 mt-0.5" />
              <span>
                {t(
                  "Baada ya kuwasilisha, utaweza kupakia documents hapa. Admin atapitia maombi yako ndani ya siku 1-3.",
                  "After submitting, you'll be able to upload documents here. Admin will review within 1-3 days."
                )}
              </span>
            </div>

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

        {/* Maombi yaliyopo */}
        <div className="flex flex-col gap-3">
          {requests.length === 0 ? (
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-2xl border-2 border-dashed p-8 text-center"
            >
              <UserRound size={28} color="rgba(16,26,46,0.25)" className="mx-auto mb-2" />
              <p className="text-sm font-semibold text-primary mb-1">
                {t("Bado hujaomba uthibitisho.", "You haven't requested verification yet.")}
              </p>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {t(
                  "Bofya kitufe cha 'Omba Uthibitisho Mpya' hapo juu kuanza. Ni bure na inachukua dakika 2 tu.",
                  "Click 'Request New Verification' above to start. It's free and takes only 2 minutes."
                )}
              </p>
            </div>
          ) : (
            requests.map((r) => {
              const req = REQUIREMENTS_BY_TYPE[r.type] || REQUIREMENTS_BY_TYPE.buyer;
              return (
                <div
                  key={r.id}
                  style={{ background: "white", borderColor: COLORS.sandLine }}
                  className="rounded-xl border p-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FEA406]/20 text-[#8A5A16]">
                      {VERIFICATION_TYPES.find((v) => v.key === r.type)?.label?.[
                        lang
                      ] || r.type}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background:
                          r.status === "approved"
                            ? "rgba(47,109,79,0.16)"
                            : r.status === "rejected"
                              ? "rgba(193,80,46,0.16)"
                              : "rgba(232,163,61,0.16)",
                        color:
                          r.status === "approved"
                            ? COLORS.green
                            : r.status === "rejected"
                              ? COLORS.rust
                              : "#8A5A16",
                      }}
                    >
                      {r.status === "approved"
                        ? t("Imeidhinishwa", "Approved")
                        : r.status === "rejected"
                          ? t("Imekataliwa", "Rejected")
                          : t("Inasubiri", "Pending")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mb-1">{r.subject}</p>
                  <p className="text-xs text-muted mb-2">
                    {t("Iliwasilishwa", "Submitted")}{" "}
                    {timeAgo(r.submittedAt, lang)}
                  </p>

                  {r.documentsRequestMessage && (
                    <div
                      style={{
                        background: "rgba(232,163,61,0.10)",
                        color: "#8A5A16",
                      }}
                      className="rounded-lg px-2.5 py-2 text-xs mb-2"
                    >
                      <strong>{t("Admin:", "Admin:")}</strong>{" "}
                      {r.documentsRequestMessage}
                    </div>
                  )}

                  {r.rejectionReason && (
                    <div
                      style={{
                        background: "rgba(193,80,46,0.08)",
                        color: COLORS.rust,
                      }}
                      className="rounded-lg px-2.5 py-2 text-xs mb-2"
                    >
                      <strong>{t("Sababu:", "Reason:")}</strong>{" "}
                      {r.rejectionReason}
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
                          className="flex items-center gap-1.5 text-xs text-primary hover:text-[#FEA406]"
                        >
                          <FileText size={11} />{" "}
                          {doc.name || `Document ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Upload eneo — kwa pending au documents requested */}
                  {(r.status === "pending" || r.documentsRequestMessage) && (
                    <div className="mt-2">
                      <div
                        style={{
                          background: `${req.color}08`,
                          borderColor: `${req.color}25`,
                        }}
                        className="rounded-lg border p-2.5 mb-2"
                      >
                        <p className="text-[11px] font-semibold mb-1" style={{ color: req.color }}>
                          {t(
                            "Documents zinazohitajika kwa aina hii:",
                            "Documents required for this type:"
                          )}
                        </p>
                        <ul className="space-y-0.5">
                          {(lang === "sw" ? req.documentsSw : req.documentsEn).map((d, i) => (
                            <li key={i} className="text-[10px] sm:text-[11px] text-secondary flex items-start gap-1">
                              <span style={{ color: req.color }}>•</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <label
                        className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border cursor-pointer hover:opacity-80"
                        style={{
                          borderColor: req.color,
                          color: req.color,
                          background: `${req.color}08`,
                        }}
                      >
                        {busy ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Upload size={12} />
                        )}
                        {t("Pakia Document", "Upload Document")}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) =>
                            handleUpload(r.id, e.target.files?.[0])
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
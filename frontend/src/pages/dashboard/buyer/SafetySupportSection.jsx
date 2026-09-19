// ============================================================
// SafetySupportSection.jsx
// Buyer — Safety & Support (report, help center, complaints).
// Bilingual + mobile-responsive + KILA KITU CENTERED.
// ============================================================

import React, { useState } from "react";
import {
  Shield,
  Flag,
  MessageSquare,
  BookOpen,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { COLORS } from "../components/shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { pushNotification } from "../../../config/notificationsStore.js";

const FAQ_ITEMS = [
  {
    q: {
      sw: "Je, SokoMkononi ni salama?",
      en: "Is SokoMkononi safe?",
    },
    a: {
      sw: "Ndio. Tuna mfumo wa uthibitishaji wa wauzaji na wanunuzi, pamoja na Deal Rooms zinazolindwa.",
      en: "Yes. We have a verification system for sellers and buyers, plus protected Deal Rooms.",
    },
  },
  {
    q: {
      sw: "Ninawezaje kuripoti tangazo la udanganyifu?",
      en: "How do I report a fraudulent listing?",
    },
    a: {
      sw: "Bofya 'Ripoti Tangazo' hapa chini, kisha chagua listing na eleza tatizo. Timu yetu itachukua hatua ndani ya saa 24.",
      en: "Click 'Report Listing' below, select the listing, and describe the issue. Our team will act within 24 hours.",
    },
  },
  {
    q: {
      sw: "Ninawezaje kuwasiliana na muuzaji?",
      en: "How do I contact a seller?",
    },
    a: {
      sw: "Tumia Deal Room au Messages ndani ya jukwaa. Usitoe namba yako ya simu kwa mtu usiyemjua.",
      en: "Use the Deal Room or Messages inside the platform. Never share your phone number with strangers.",
    },
  },
  {
    q: {
      sw: "Nifanye nini nikikutana na muuzaji?",
      en: "What should I do when meeting a seller?",
    },
    a: {
      sw: "Kutana sehemu za wazi, wakati wa mchana, na uende na mtu mwingine. Usilipe kabla ya kuona mali.",
      en: "Meet in public places, during daylight, and bring someone with you. Never pay before viewing the property.",
    },
  },
];

export default function SafetySupportSection() {
  const { lang } = useLanguage();
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] = useState("listing");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleReportSubmit = () => {
    if (!reportDetails.trim()) return;

    pushNotification({
      audience: "admin",
      type: "fraud_flag",
      title: {
        sw: `Ripoti mpya ya ${reportType === "listing" ? "tangazo" : "mtumiaji"}`,
        en: `New report for ${reportType === "listing" ? "listing" : "user"}`,
      },
      body: reportDetails.trim(),
      target: "moderation",
    });

    setReportSent(true);
    setReportDetails("");
    setTimeout(() => {
      setReportSent(false);
      setShowReportForm(false);
    }, 3000);
  };

  return (
    <div
      style={{ background: COLORS.sand, minHeight: "100%" }}
      className="w-full p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto">
        {/* ============================================================ */}
        {/* HEADER — CENTERED */}
        {/* ============================================================ */}
        <div className="mb-6 text-center">
          <h1 className="h-title">
            {t("Usalama & Msaada", "Safety & Support")}
          </h1>
          <p className="text-secondary text-body-sm mt-2 max-w-xl mx-auto">
            {t(
              "Ripoti tatizo, soma vidokezo vya usalama, au wasiliana nasi.",
              "Report an issue, read safety tips, or contact us."
            )}
          </p>
        </div>

        {/* ============================================================ */}
        {/* SAFETY TIPS — CENTERED */}
        {/* ============================================================ */}
        <div
          style={{
            background: "rgba(47,109,79,0.08)",
            borderColor: COLORS.green,
            borderWidth: "2px",
          }}
          className="rounded-2xl border p-4 sm:p-5 mb-4"
        >
          <div className="flex flex-col items-center text-center gap-2 mb-4">
            <div
              style={{ background: COLORS.green }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            >
              <Shield size={18} color="white" />
            </div>
            <div>
              <p style={{ color: COLORS.green }} className="h-card">
                {t("Vidokezo vya Usalama", "Safety Tips")}
              </p>
              <p className="text-secondary text-body-sm mt-0.5">
                {t(
                  "Fuata vidokezo hivi ili kulinda pesa zako.",
                  "Follow these tips to protect your money."
                )}
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-body-sm text-secondary max-w-md mx-auto">
            <li className="flex items-start gap-2 text-left">
              <CheckCircle
                size={14}
                className="text-green-600 shrink-0 mt-0.5"
              />
              <span>
                {t(
                  "Thibitisha akaunti ya muuzaji kabla ya kuendelea.",
                  "Verify the seller's account before proceeding."
                )}
              </span>
            </li>
            <li className="flex items-start gap-2 text-left">
              <CheckCircle
                size={14}
                className="text-green-600 shrink-0 mt-0.5"
              />
              <span>
                {t(
                  "Kutana sehemu za wazi, wakati wa mchana.",
                  "Meet in public places, during daylight."
                )}
              </span>
            </li>
            <li className="flex items-start gap-2 text-left">
              <CheckCircle
                size={14}
                className="text-green-600 shrink-0 mt-0.5"
              />
              <span>
                {t(
                  "Usilipe kabla ya kuona mali na hati zake.",
                  "Never pay before viewing the property and its documents."
                )}
              </span>
            </li>
            <li className="flex items-start gap-2 text-left">
              <CheckCircle
                size={14}
                className="text-green-600 shrink-0 mt-0.5"
              />
              <span>
                {t(
                  "Tumia Deal Room yetu — mazungumzo yote yanahifadhiwa.",
                  "Use our Deal Room — all conversations are recorded."
                )}
              </span>
            </li>
          </ul>
        </div>

        {/* ============================================================ */}
        {/* REPORT — CENTERED */}
        {/* ============================================================ */}
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border p-4 sm:p-5 mb-4"
        >
          <div className="flex flex-col items-center text-center gap-2 mb-4">
            <div
              style={{ background: `${COLORS.rust}15` }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            >
              <Flag size={18} color={COLORS.rust} />
            </div>
            <div>
              <p className="text-primary h-card">
                {t("Ripoti Tatizo", "Report an Issue")}
              </p>
              <p className="text-secondary text-body-sm mt-0.5 max-w-md mx-auto">
                {t(
                  "Unaona tangazo la udanganyifu au mtumiaji mwenye tabia ya kutiliwa shaka?",
                  "See a fraudulent listing or suspicious user?"
                )}
              </p>
            </div>
          </div>

          {reportSent ? (
            <div
              style={{
                background: "rgba(47,109,79,0.1)",
                color: COLORS.green,
              }}
              className="flex items-center justify-center gap-2 text-body-sm font-semibold rounded-lg px-3 py-2.5 max-w-md mx-auto text-center"
            >
              <CheckCircle size={14} />
              {t(
                "Ripoti yako imetumwa. Timu yetu itachukua hatua ndani ya saa 24.",
                "Your report was sent. Our team will act within 24 hours."
              )}
            </div>
          ) : !showReportForm ? (
            <div className="flex justify-center">
              <button
                onClick={() => setShowReportForm(true)}
                style={{ background: COLORS.rust, color: "white" }}
                className="flex items-center gap-1.5 text-btn font-semibold px-4 py-2.5 rounded-lg"
              >
                <Flag size={13} />
                {t("Anza Ripoti", "Start Report")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-md mx-auto">
              {/* Type */}
              <div className="flex gap-2">
                <button
                  onClick={() => setReportType("listing")}
                  style={{
                    background:
                      reportType === "listing" ? COLORS.night : "transparent",
                    color:
                      reportType === "listing" ? COLORS.sand : COLORS.night,
                    borderColor: COLORS.sandLine,
                  }}
                  className="flex-1 text-btn font-semibold px-3 py-2 rounded-lg border"
                >
                  {t("Tangazo", "Listing")}
                </button>
                <button
                  onClick={() => setReportType("user")}
                  style={{
                    background:
                      reportType === "user" ? COLORS.night : "transparent",
                    color: reportType === "user" ? COLORS.sand : COLORS.night,
                    borderColor: COLORS.sandLine,
                  }}
                  className="flex-1 text-btn font-semibold px-3 py-2 rounded-lg border"
                >
                  {t("Mtumiaji", "User")}
                </button>
              </div>

              {/* Details */}
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder={t(
                  "Eleza tatizo kwa ufupi (lazima)...",
                  "Describe the issue briefly (required)..."
                )}
                rows={4}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none resize-none focus:border-[#E8A33D] text-center sm:text-left"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowReportForm(false);
                    setReportDetails("");
                  }}
                  className="text-btn font-semibold px-3 py-2 rounded-lg border border-gray-200 text-secondary"
                >
                  {t("Ghairi", "Cancel")}
                </button>
                <button
                  onClick={handleReportSubmit}
                  disabled={!reportDetails.trim()}
                  style={{
                    background: reportDetails.trim()
                      ? COLORS.rust
                      : COLORS.sandLine,
                    color: reportDetails.trim()
                      ? "white"
                      : "rgba(16,26,46,0.4)",
                  }}
                  className="flex-1 text-btn font-semibold px-3 py-2 rounded-lg"
                >
                  {t("Tuma Ripoti", "Submit Report")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* FAQ — CENTERED (title centered, items zimeachwa) */}
        {/* ============================================================ */}
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border p-4 sm:p-5 mb-4"
        >
          <div className="flex flex-col items-center text-center gap-2 mb-4">
            <div
              style={{ background: `${COLORS.gold}15` }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            >
              <BookOpen size={18} color="#8A5A16" />
            </div>
            <div>
              <p className="text-primary h-card">
                {t("Maswali Yanayoulizwa Sana", "Frequently Asked Questions")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  style={{ borderColor: COLORS.sandLine }}
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-primary h-card">
                      {item.q?.[lang] || item.q?.sw}
                    </span>
                    {isOpen ? (
                      <ChevronUp
                        size={16}
                        className="text-muted shrink-0"
                      />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="text-muted shrink-0"
                      />
                    )}
                  </button>
                  {isOpen && (
                    <div
                      style={{ borderColor: COLORS.sandLine }}
                      className="px-3 py-3 border-t text-body-sm text-secondary leading-relaxed"
                    >
                      {item.a?.[lang] || item.a?.sw}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* CONTACT — CENTERED */}
        {/* ============================================================ */}
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border p-4 sm:p-5"
        >
          <div className="flex flex-col items-center text-center gap-2 mb-4">
            <div
              style={{ background: `${COLORS.night}10` }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            >
              <MessageSquare size={18} color={COLORS.night} />
            </div>
            <div>
              <p className="text-primary h-card">
                {t("Wasiliana Nasi", "Contact Us")}
              </p>
              <p className="text-secondary text-body-sm mt-0.5">
                {t(
                  "Timu yetu iko tayari kukusaidia.",
                  "Our team is ready to help."
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-w-md mx-auto">
            <a
              href="mailto:support@sokomkononi.co.tz"
              className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail size={16} className="text-muted" />
              <span className="text-body-sm text-secondary">
                support@sokomkononi.co.tz
              </span>
            </a>
            <a
              href="tel:+255700000000"
              className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Phone size={16} className="text-muted" />
              <span className="text-body-sm text-secondary">+255 700 000 000</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

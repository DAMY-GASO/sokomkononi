// ============================================================
// SafetySupportSection.jsx
// Buyer — Safety & Support (report, help center, complaints).
// Bilingual + mobile-responsive + KILA KITU CENTERED.
//
// SASISHO: Ongeza "Ripoti Zangu" — inaonyesha tickets za mtumiaji
// + mazungumzo (thread) + composer ya kutuma reply kwa admin.
// ============================================================

import React, { useState, useEffect } from "react";
import {
  Shield,
  Flag,
  MessageSquare,
  BookOpen,
  Phone,
  Mail,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Send,
  Clock,
  Inbox,
} from "lucide-react";
import { COLORS, timeAgo } from "../components/shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { api } from "../../../api/client.js";
import {
  useTickets,
  addTicketMessageAsync,
  hydrateTicketsFromApi,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../../../config/ticketsStore.js";

const FAQ_ITEMS = [
  {
    q: { sw: "Je, SokoMkononi ni salama?", en: "Is SokoMkononi safe?" },
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
    q: { sw: "Ninawezaje kuwasiliana na muuzaji?", en: "How do I contact a seller?" },
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

// ============================================================
// COLOR MAP — kwa status/category badges
// ============================================================
const COLOR_MAP = {
  gray: { bg: "rgba(16,26,46,0.08)", fg: COLORS.night },
  gold: { bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
  rust: { bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
  green: { bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
  blue: { bg: "rgba(37,99,235,0.12)", fg: "#2563EB" },
  night: { bg: "rgba(16,26,46,0.08)", fg: COLORS.night },
};

// ============================================================
// TICKET CARD — kwa mtumiaji
// ============================================================
function MyTicketCard({ ticket, lang }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const category = TICKET_CATEGORIES.find((c) => c.key === ticket.category);
  const priority = TICKET_PRIORITIES.find((p) => p.key === ticket.priority);
  const status = TICKET_STATUSES.find((s) => s.key === ticket.status);

  const catColors = COLOR_MAP[category?.color] || COLOR_MAP.night;
  const priColors = COLOR_MAP[priority?.color] || COLOR_MAP.gold;
  const statusColors = COLOR_MAP[status?.color] || COLOR_MAP.rust;

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;
    if (ticket.status === "closed") {
      setError(t("Ticket imefungwa. Hauwezi kutuma ujumbe.", "Ticket is closed. You cannot send messages."));
      return;
    }

    setSending(true);
    setError("");

    const res = await addTicketMessageAsync(ticket.id, {
      text: replyText.trim(),
    });

    setSending(false);

    if (res.ok) {
      setReplyText("");
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kutuma jibu.", "Failed to send reply.")
      );
    }
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border overflow-hidden w-full"
    >
      {/* Header */}
      <div className="p-3 sm:p-4 w-full">
        <div className="flex items-start gap-2 sm:gap-3 w-full">
          <div
            style={{ background: catColors.bg }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <MessageSquare size={16} color={catColors.fg} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-[10px] font-bold text-muted">
                {ticket.code || ticket.id}
              </span>
              <span
                style={{ background: catColors.bg, color: catColors.fg }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {category?.label?.[lang] || ticket.category}
              </span>
              <span
                style={{ background: statusColors.bg, color: statusColors.fg }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {status?.label?.[lang] || ticket.status}
              </span>
            </div>

            <p className="text-sm font-semibold text-primary truncate">
              {ticket.subject}
            </p>

            <div className="flex items-center gap-2 mt-1 text-xs text-secondary flex-wrap">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {timeAgo(ticket.updatedAt || ticket.createdAt, lang)}
              </span>
              {ticket.messages?.length > 0 && (
                <>
                  <span className="text-muted">•</span>
                  <span>
                    {ticket.messages.length}{" "}
                    {ticket.messages.length === 1
                      ? t("ujumbe", "message")
                      : t("ujumbe", "messages")}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-muted hover:text-secondary shrink-0"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded — thread + composer */}
      {expanded && (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="border-t p-3 sm:p-4 flex flex-col gap-3 w-full"
        >
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

          {/* Thread */}
          <div>
            <p className="text-[10px] font-semibold text-secondary uppercase mb-2">
              {t("Mazungumzo", "Conversation")}
            </p>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {(!ticket.messages || ticket.messages.length === 0) && (
                <p className="text-xs text-muted text-center py-3">
                  {t(
                    "Hakuna ujumbe bado. Subiri majibu ya timu yetu.",
                    "No messages yet. Wait for our team's reply."
                  )}
                </p>
              )}
              {ticket.messages?.map((msg) => {
                const isAdmin = msg.from === "admin";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      style={{
                        background: isAdmin ? "white" : COLORS.night,
                        color: isAdmin ? COLORS.night : COLORS.sand,
                        borderColor: COLORS.sandLine,
                      }}
                      className="border rounded-2xl px-3 py-2 max-w-[85%] text-xs"
                    >
                      <p
                        className="font-semibold mb-0.5 text-[10px] uppercase"
                        style={{
                          color: isAdmin
                            ? COLORS.rust
                            : "rgba(245,243,236,0.6)",
                        }}
                      >
                        {isAdmin
                          ? t("SokoMkononi Support", "SokoMkononi Support")
                          : t("Wewe", "You")}
                      </p>
                      <p className="leading-relaxed break-words">
                        {msg.text}
                      </p>
                      <p
                        className="text-[10px] mt-1"
                        style={{
                          color: isAdmin
                            ? "var(--text-muted)"
                            : "rgba(245,243,236,0.5)",
                        }}
                      >
                        {timeAgo(msg.at, lang)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Composer */}
          {ticket.status !== "closed" && (
            <div className="flex items-center gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !sending && handleSendReply()
                }
                placeholder={t("Andika jibu...", "Type a reply...")}
                disabled={sending}
                style={{ borderColor: COLORS.sandLine }}
                className="flex-1 rounded-full border px-3 py-2 text-xs outline-none bg-white disabled:opacity-50"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || sending}
                style={{
                  background:
                    replyText.trim() && !sending
                      ? COLORS.gold
                      : COLORS.sandLine,
                  color:
                    replyText.trim() && !sending
                      ? COLORS.night
                      : "var(--text-muted)",
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          )}

          {ticket.status === "closed" && (
            <p className="text-[11px] text-muted text-center">
              {t(
                "Ticket hii imefungwa. Ikiwa unahitaji msaada zaidi, wasiliana nasi kwa barua pepe.",
                "This ticket is closed. If you need more help, contact us by email."
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SafetySupportSection() {
  const { lang } = useLanguage();
  const tickets = useTickets();

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] = useState("listing");
  const [reportSubject, setReportSubject] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleReportSubmit = async () => {
    if (!reportDetails.trim()) {
      setReportError(
        t("Tafadhali eleza tatizo.", "Please describe the issue.")
      );
      return;
    }

    setSendingReport(true);
    setReportError("");

    try {
      await api.post("/tickets/", {
        subject:
          reportSubject.trim() ||
          (reportType === "listing"
            ? t("Ripoti ya tangazo", "Listing report")
            : t("Ripoti ya mtumiaji", "User report")),
        description: reportDetails.trim(),
        category:
          reportType === "listing" ? "LISTING" : "DISPUTE",
        priority: "HIGH",
      });

      // Refresh tickets
      await hydrateTicketsFromApi();

      setReportSent(true);
      setReportSubject("");
      setReportDetails("");
      setTimeout(() => {
        setReportSent(false);
        setShowReportForm(false);
      }, 3000);
    } catch (err) {
      setReportError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kutuma ripoti.", "Failed to submit report.")
      );
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <div
      style={{ background: COLORS.sand, minHeight: "100%" }}
      className="w-full p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto">
        {/* HEADER */}
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

        {/* SAFETY TIPS */}
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
            {[
              {
                sw: "Thibitisha akaunti ya muuzaji kabla ya kuendelea.",
                en: "Verify the seller's account before proceeding.",
              },
              {
                sw: "Kutana sehemu za wazi, wakati wa mchana.",
                en: "Meet in public places, during daylight.",
              },
              {
                sw: "Usilipe kabla ya kuona mali na hati zake.",
                en: "Never pay before viewing the property and its documents.",
              },
              {
                sw: "Tumia Deal Room yetu — mazungumzo yote yanahifadhiwa.",
                en: "Use our Deal Room — all conversations are recorded.",
              },
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-left">
                <CheckCircle
                  size={14}
                  className="text-green-600 shrink-0 mt-0.5"
                />
                <span>{lang === "sw" ? tip.sw : tip.en}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* REPORT FORM */}
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
              {reportError && (
                <div
                  style={{
                    background: "rgba(193,80,46,0.1)",
                    color: COLORS.rust,
                  }}
                  className="text-xs font-semibold px-3 py-2 rounded-lg"
                >
                  {reportError}
                </div>
              )}

              {/* Type */}
              <div className="flex gap-2">
                {[
                  { key: "listing", label: t("Tangazo", "Listing") },
                  { key: "user", label: t("Mtumiaji", "User") },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setReportType(opt.key)}
                    style={{
                      background:
                        reportType === opt.key
                          ? COLORS.night
                          : "transparent",
                      color:
                        reportType === opt.key
                          ? COLORS.sand
                          : COLORS.night,
                      borderColor: COLORS.sandLine,
                    }}
                    className="flex-1 text-btn font-semibold px-3 py-2 rounded-lg border"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Subject */}
              <input
                value={reportSubject}
                onChange={(e) => setReportSubject(e.target.value)}
                placeholder={t("Kichwa (hiari)...", "Subject (optional)...")}
                style={{ borderColor: COLORS.sandLine }}
                className="border rounded-lg px-3 py-2 text-sm outline-none bg-white"
              />

              {/* Details */}
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder={t(
                  "Eleza tatizo kwa ufupi (lazima)...",
                  "Describe the issue briefly (required)..."
                )}
                rows={4}
                style={{ borderColor: COLORS.sandLine }}
                className="border rounded-lg px-3 py-2 text-sm outline-none resize-none bg-white"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowReportForm(false);
                    setReportDetails("");
                    setReportSubject("");
                    setReportError("");
                  }}
                  disabled={sendingReport}
                  style={{ borderColor: COLORS.sandLine }}
                  className="text-btn font-semibold px-3 py-2 rounded-lg border text-secondary disabled:opacity-50"
                >
                  {t("Ghairi", "Cancel")}
                </button>
                <button
                  onClick={handleReportSubmit}
                  disabled={!reportDetails.trim() || sendingReport}
                  style={{
                    background:
                      reportDetails.trim() && !sendingReport
                        ? COLORS.rust
                        : COLORS.sandLine,
                    color:
                      reportDetails.trim() && !sendingReport
                        ? "white"
                        : "rgba(16,26,46,0.4)",
                  }}
                  className="flex-1 flex items-center justify-center gap-2 text-btn font-semibold px-3 py-2 rounded-lg disabled:cursor-not-allowed"
                >
                  {sendingReport && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {t("Tuma Ripoti", "Submit Report")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MY TICKETS */}
        {tickets.length > 0 && (
          <div
            style={{ borderColor: COLORS.sandLine, background: "white" }}
            className="rounded-2xl border p-4 sm:p-5 mb-4"
          >
            <div className="flex flex-col items-center text-center gap-2 mb-4">
              <div
                style={{ background: `${COLORS.night}10` }}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              >
                <Inbox size={18} color={COLORS.night} />
              </div>
              <div>
                <p className="text-primary h-card">
                  {t("Ripoti Zangu", "My Reports")}
                </p>
                <p className="text-secondary text-body-sm mt-0.5 max-w-md mx-auto">
                  {t(
                    "Fuatilia majibu ya timu yetu kwa ripoti zako.",
                    "Track our team's replies to your reports."
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {tickets.map((ticket) => (
                <MyTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
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
                {t(
                  "Maswali Yanayoulizwa Sana",
                  "Frequently Asked Questions"
                )}
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

        {/* CONTACT */}
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
              href="tel:+255743895038"
              className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Phone size={16} className="text-muted" />
              <span className="text-body-sm text-secondary">
                +255 743 895 038
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
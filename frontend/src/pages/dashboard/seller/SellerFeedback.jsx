// ============================================================
// SellerFeedback.jsx — Seller can submit feedback, report a
// problem, suggest an improvement, or rate the experience.
// All submissions land in Admin → Customer Care → Feedback tab.
// ============================================================
import React, { useState } from "react";
import {
  MessageSquare, AlertTriangle, Lightbulb, Star, Send,
  Loader2, CheckCircle, Inbox,
} from "lucide-react";
import { COLORS, timeAgo } from "../components/shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { useToast } from "../../../components/Toast.jsx";
import {
  FEEDBACK_TYPES, submitFeedbackAsync, useMyFeedback,
} from "../../../config/feedbackStore.js";

const ICONS = { MessageSquare, AlertTriangle, Lightbulb, Star };

export default function SellerFeedback({ side = "seller" }) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const mine = useMyFeedback(user?.email);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [type, setType] = useState("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setSubject("");
    setMessage("");
    setRating(5);
    setType("feedback");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!subject.trim() || !message.trim()) {
      setError(t("Jaza kichwa na ujumbe.", "Fill in subject and message."));
      return;
    }
    setBusy(true);
    setError("");
    const res = await submitFeedbackAsync({
      type,
      subject: subject.trim(),
      message: message.trim(),
      rating: type === "rating" ? Number(rating) : null,
      authorSide: side,
    });
    setBusy(false);
    if (res.ok) {
      toast.success(t("Asante! Maoni yako yametumwa.", "Thanks! Your feedback was sent."));
      reset();
    } else {
      setError(res.error?.message || t("Imeshindwa kutuma.", "Failed to send."));
    }
  };

  return (
    <div style={{ background: COLORS.sand, minHeight: "100%" }} className="w-full p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="h-title">{side === "buyer" ? t("Maoni ya Mnunuzi", "Buyer Feedback") : t("Maoni ya Muuzaji", "Seller Feedback")}</h1>
          <p className="text-body-sm text-secondary mt-2 max-w-xl mx-auto">
            {t(
              "Toa maoni, ripoti changamoto, pendekeza maboresho, au kadiria uzoefu wako.",
              "Give feedback, report problems, suggest improvements, or rate your experience."
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-4 sm:p-5 mb-6"
              style={{ borderColor: COLORS.sandLine }}>
          {/* Type picker */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-secondary uppercase mb-2">
              {t("Aina ya Maoni", "Feedback Type")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FEEDBACK_TYPES.map((ft) => {
                const Icon = ICONS[ft.icon] || MessageSquare;
                const active = type === ft.key;
                return (
                  <button
                    key={ft.key}
                    type="button"
                    onClick={() => setType(ft.key)}
                    style={{
                      borderColor: active ? COLORS.gold : COLORS.sandLine,
                      background: active ? `${COLORS.gold}15` : "white",
                      color: active ? "#8A5A16" : "var(--text-primary)",
                    }}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center"
                  >
                    <Icon size={16} />
                    <span className="text-[11px] font-semibold">
                      {ft.label?.[lang] || ft.label?.sw}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {type === "rating" && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-secondary uppercase mb-2">
                {t("Kadiria Uzoefu", "Rate Your Experience")}
              </p>
              <div className="flex items-center gap-1.5 justify-center">
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-1"
                    aria-label={`${n} stars`}
                  >
                    <Star
                      size={26}
                      fill={n <= rating ? COLORS.gold : "none"}
                      color={n <= rating ? COLORS.gold : "#D1D5DB"}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-semibold text-primary">
                  {rating}/5
                </span>
              </div>
            </div>
          )}

          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("Kichwa", "Subject")}
            disabled={busy}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D] mb-3"
            style={{ borderColor: COLORS.sandLine }}
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder={t("Eleza maoni/tatizo/pendekezo lako...", "Describe your feedback/problem/suggestion...")}
            disabled={busy}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none focus:border-[#E8A33D]"
            style={{ borderColor: COLORS.sandLine }}
          />

          {error && (
            <div className="text-xs font-semibold px-3 py-2 rounded-lg mt-3"
                 style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="mt-4 w-full sm:w-auto flex items-center justify-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {t("Tuma Maoni", "Submit Feedback")}
          </button>
        </form>

        {/* My previous feedback */}
        <div className="bg-white rounded-2xl border p-4 sm:p-5" style={{ borderColor: COLORS.sandLine }}>
          <h2 className="h-card mb-4">{t("Maoni Yangu ya Nyuma", "My Previous Feedback")}</h2>
          {mine.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: COLORS.sandLine }}>
              <Inbox size={28} className="mx-auto text-muted mb-2" />
              <p className="text-sm text-muted">
                {t("Hakuna maoni bado.", "No feedback yet.")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {mine.map((f) => {
                const ft = FEEDBACK_TYPES.find((x) => x.key === f.type);
                const Icon = ICONS[ft?.icon] || MessageSquare;
                return (
                  <div key={f.id} className="rounded-xl border p-3" style={{ borderColor: COLORS.sandLine }}>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                           style={{ background: `${COLORS.night}0D` }}>
                        <Icon size={13} color={COLORS.night} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${COLORS.gold}20`, color: "#8A5A16" }}>
                        {ft?.label?.[lang] || ft?.label?.sw}
                      </span>
                      {f.status === "answered" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{ background: `${COLORS.green}15`, color: COLORS.green }}>
                          <CheckCircle size={10} /> {t("Imejibiwa", "Answered")}
                        </span>
                      )}
                      <span className="text-[10px] text-muted ml-auto">
                        {timeAgo(f.createdAt, lang)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-primary">{f.subject}</p>
                    <p className="text-xs text-secondary mt-1 whitespace-pre-wrap break-words">{f.message}</p>
                    {f.rating != null && (
                      <div className="mt-2 flex items-center gap-0.5">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} size={12}
                                fill={n <= f.rating ? COLORS.gold : "none"}
                                color={n <= f.rating ? COLORS.gold : "#D1D5DB"} />
                        ))}
                      </div>
                    )}
                    {f.adminReply && (
                      <div className="mt-2 rounded-lg px-3 py-2"
                           style={{ background: "rgba(47,109,79,0.08)", color: COLORS.green }}>
                        <p className="text-[10px] font-bold uppercase mb-0.5">
                          {t("Jibu la SokoMkononi", "SokoMkononi Reply")}
                        </p>
                        <p className="text-xs">{f.adminReply}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

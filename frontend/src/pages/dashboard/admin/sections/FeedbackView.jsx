import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useFeedback,
  respondToFeedbackAsync,
  removeFeedbackAsync,
  FEEDBACK_TYPES,
} from "../../../../config/feedbackStore.js";

export default function FeedbackView() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const items = useFeedback();
  const [busy, setBusy] = useState({});
  const [reply, setReply] = useState({});
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? items : items.filter((f) => f.type === filter);

  const handleReply = async (id) => {
    const text = (reply[id] || "").trim();
    if (!text) return;
    setBusy((b) => ({ ...b, [id]: "reply" }));
    const res = await respondToFeedbackAsync(id, text);
    setBusy((b) => { const n = { ...b }; delete n[id]; return n; });
    if (res.ok) setReply((r) => ({ ...r, [id]: "" }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("Futa maoni haya?", "Delete this feedback?"))) return;
    setBusy((b) => ({ ...b, [id]: "delete" }));
    await removeFeedbackAsync(id);
    setBusy((b) => { const n = { ...b }; delete n[id]; return n; });
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      <div className="flex justify-center gap-2 mb-2 flex-wrap">
        <button onClick={() => setFilter("all")}
          style={{ background: filter === "all" ? COLORS.gold : "white", color: COLORS.night, borderColor: COLORS.sandLine }}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border">
          {t("Zote", "All")} ({items.length})
        </button>
        {FEEDBACK_TYPES.map((ft) => (
          <button key={ft.key} onClick={() => setFilter(ft.key)}
            style={{ background: filter === ft.key ? COLORS.gold : "white", color: COLORS.night, borderColor: COLORS.sandLine }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border">
            {ft.label?.[lang] || ft.label?.sw} ({items.filter((f) => f.type === ft.key).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-8 text-center bg-white" style={{ borderColor: COLORS.sandLine }}>
          <p className="text-sm text-muted">{t("Hakuna maoni.", "No feedback.")}</p>
        </div>
      ) : (
        filtered.map((f) => {
          const ft = FEEDBACK_TYPES.find((x) => x.key === f.type);
          return (
            <div key={f.id} className="rounded-xl border p-4 bg-white" style={{ borderColor: COLORS.sandLine }}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${COLORS.gold}20`, color: "#8A5A16" }}>
                  {ft?.label?.[lang] || ft?.label?.sw}
                </span>
                <span className="text-[11px] text-secondary">{f.userName} · {f.userEmail}</span>
                <span className="text-[10px] text-muted ml-auto">{timeAgo(f.createdAt, lang)}</span>
              </div>
              <p className="text-sm font-semibold text-primary">{f.subject}</p>
              <p className="text-xs text-secondary mt-1 whitespace-pre-wrap break-words">{f.message}</p>
              {f.rating != null && (
                <p className="text-xs mt-1" style={{ color: COLORS.gold }}>
                  {"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}
                </p>
              )}
              {f.adminReply ? (
                <div className="mt-2 rounded-lg px-3 py-2" style={{ background: "rgba(47,109,79,0.08)", color: COLORS.green }}>
                  <p className="text-[10px] font-bold uppercase mb-0.5">{t("Jibu lako", "Your reply")}</p>
                  <p className="text-xs">{f.adminReply}</p>
                </div>
              ) : (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <input value={reply[f.id] || ""} onChange={(e) => setReply({ ...reply, [f.id]: e.target.value })}
                    placeholder={t("Andika jibu...", "Write a reply...")}
                    className="flex-1 border rounded-lg px-3 py-2 text-xs outline-none"
                    style={{ borderColor: COLORS.sandLine }} />
                  <button onClick={() => handleReply(f.id)} disabled={!!busy[f.id]}
                    style={{ background: COLORS.green, color: "white" }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50">
                    {busy[f.id] === "reply" ? <Loader2 size={12} className="animate-spin" /> : t("Jibu", "Reply")}
                  </button>
                  <button onClick={() => handleDelete(f.id)} disabled={!!busy[f.id]}
                    className="text-xs font-semibold px-3 py-2 rounded-lg text-muted hover:text-rust">
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

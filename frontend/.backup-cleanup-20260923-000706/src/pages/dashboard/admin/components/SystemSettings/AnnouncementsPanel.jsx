// ============================================================
// AnnouncementsPanel.jsx
// System/Marketplace announcements — Admin.
// Bilingual + mobile-responsive + Async actions na rollback.
// ============================================================

import React, { useState } from "react";
import { Megaphone, Plus, Trash2, Loader2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
// ⬇️ MABADILIKO: tumia async variants
import {
  useAnnouncements,
  addAnnouncementAsync,
  removeAnnouncementAsync,
  ANNOUNCEMENT_TYPES,
} from "../../../../../config/announcementsStore.js";

export default function AnnouncementsPanel() {
  const { lang } = useLanguage();
  const announcements = useAnnouncements();
  const [form, setForm] = useState({
    typeId: "fee_change",
    title: "",
    titleEn: "",
    message: "",
    messageEn: "",
    scheduledFor: "",
  });
  const [expanded, setExpanded] = useState(false);
  // ⬇️ MPYA: busy + error
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // TYPE LABEL
  // ============================================================
  const getTypeLabel = (id) => {
    const ty = ANNOUNCEMENT_TYPES.find((x) => x.id === id);
    if (!ty) return id;
    if (typeof ty.label === "string") return ty.label;
    return ty.label?.[lang] || ty.label?.sw || id;
  };

  const getTitle = (a) => {
    if (lang === "en" && a.titleEn) return a.titleEn;
    return a.title;
  };
  const getMessage = (a) => {
    if (lang === "en" && a.messageEn) return a.messageEn;
    return a.message;
  };

  const formatScheduled = (iso) => {
    if (!iso) return "";
    return iso.replace("T", " ");
  };

  // ============================================================
  // HANDLERS — async + rollback
  // ============================================================
  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim() || busy.sending) return;

    setBusy((b) => ({ ...b, sending: true }));
    setError("");

    const res = await addAnnouncementAsync({
      ...form,
      sent: !form.scheduledFor,
    });

    setBusy((b) => {
      const next = { ...b };
      delete next.sending;
      return next;
    });

    if (res.ok) {
      setForm({
        typeId: "fee_change",
        title: "",
        titleEn: "",
        message: "",
        messageEn: "",
        scheduledFor: "",
      });
      setExpanded(false);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kutuma tangazo.", "Failed to send announcement.")
      );
    }
  };

  const handleRemove = async (id) => {
    if (busy[id]) return;

    setBusy((b) => ({ ...b, [id]: true }));
    setError("");

    const res = await removeAnnouncementAsync(id);

    setBusy((b) => {
      const next = { ...b };
      delete next[id];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa tangazo.", "Failed to remove announcement.")
      );
    }
  };

  const canSend = form.title.trim() && form.message.trim() && !busy.sending;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex flex-col gap-4 lg:col-span-3 min-w-0">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            style={{ background: `${COLORS.night}0D` }}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          >
            <Megaphone size={16} color={COLORS.night} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">
              {lang === "sw"
                ? "Matangazo ya Mfumo / Marketplace"
                : "System / Marketplace Announcements"}
            </p>
            <p className="text-xs text-secondary">
              {lang === "sw"
                ? "Matangazo ya jumla — fee changes, categories mpya, maintenance"
                : "General announcements — fee changes, new categories, maintenance"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          disabled={busy.sending}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 shrink-0 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={13} />
          <span className="hidden sm:inline">
            {lang === "sw" ? "Tangazo Jipya" : "New Announcement"}
          </span>
          <span className="sm:hidden">
            {lang === "sw" ? "Jipya" : "New"}
          </span>
        </button>
      </div>

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

      {/* Form */}
      {expanded && (
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="border rounded-xl p-3 sm:p-4 flex flex-col gap-3"
        >
          {/* Type */}
          <div>
            <p className="text-[10px] font-semibold text-secondary uppercase mb-1.5">
              {lang === "sw" ? "Aina ya Tangazo" : "Announcement Type"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ANNOUNCEMENT_TYPES.map((ty) => {
                const isActive = form.typeId === ty.id;
                return (
                  <button
                    key={ty.id}
                    type="button"
                    onClick={() => setForm({ ...form, typeId: ty.id })}
                    disabled={busy.sending}
                    style={{
                      background: isActive ? COLORS.night : "white",
                      color: isActive ? COLORS.sand : "var(--text-primary)",
                      borderColor: COLORS.sandLine,
                    }}
                    className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors disabled:opacity-50"
                  >
                    {typeof ty.label === "string"
                      ? ty.label
                      : ty.label?.[lang] || ty.label?.sw}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title SW */}
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={lang === "sw" ? "Kichwa cha tangazo (SW)" : "Announcement title (SW)"}
            disabled={busy.sending}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />

          {/* Title EN */}
          <input
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            placeholder={lang === "sw"
              ? "Kichwa cha tangazo (EN) — hiari"
              : "Announcement title (EN) — optional"}
            disabled={busy.sending}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
          />

          {/* Message SW */}
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder={lang === "sw" ? "Ujumbe kamili (SW)..." : "Full message (SW)..."}
            rows={3}
            disabled={busy.sending}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none resize-none focus:border-[#E8A33D] disabled:opacity-50"
          />

          {/* Message EN */}
          <textarea
            value={form.messageEn}
            onChange={(e) => setForm({ ...form, messageEn: e.target.value })}
            placeholder={lang === "sw"
              ? "Ujumbe kamili (EN) — hiari"
              : "Full message (EN) — optional"}
            rows={3}
            disabled={busy.sending}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none resize-none focus:border-[#E8A33D] disabled:opacity-50"
          />

          {/* Schedule */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs text-secondary shrink-0">
              {lang === "sw" ? "Ratiba (hiari):" : "Schedule (optional):"}
            </label>
            <input
              type="datetime-local"
              value={form.scheduledFor}
              onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
              disabled={busy.sending}
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none flex-1 min-w-0 focus:border-[#E8A33D] disabled:opacity-50"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              background: canSend ? COLORS.green : COLORS.sandLine,
              color: canSend ? "white" : "var(--text-muted)",
            }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 w-full sm:w-auto sm:self-start transition-colors disabled:cursor-not-allowed"
          >
            {busy.sending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Megaphone size={13} />
            )}
            {form.scheduledFor
              ? lang === "sw"
                ? "Panga Tangazo"
                : "Schedule Announcement"
              : lang === "sw"
                ? "Tuma Sasa kwa Wote"
                : "Send Now to All"}
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2">
        {announcements.map((a) => {
          const isRemoving = !!busy[a.id];
          return (
            <div
              key={a.id}
              style={{ borderColor: COLORS.sandLine }}
              className="flex items-start justify-between gap-3 border rounded-lg px-3 sm:px-4 py-3 min-w-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    style={{
                      background: `${COLORS.gold}15`,
                      color: COLORS.gold,
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                  >
                    {getTypeLabel(a.typeId)}
                  </span>
                  {!a.sent && (
                    <span
                      style={{
                        background: `${COLORS.green}15`,
                        color: COLORS.green,
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    >
                      {lang === "sw" ? "Imepangwa:" : "Scheduled:"}{" "}
                      {formatScheduled(a.scheduledFor)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-primary break-words">
                  {getTitle(a)}
                </p>
                <p className="text-xs text-secondary mt-0.5 break-words">
                  {getMessage(a)}
                </p>
                {lang === "en" && a.titleEn && (
                  <p className="text-[10px] text-muted mt-1 italic">
                    SW: {a.title}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleRemove(a.id)}
                disabled={isRemoving}
                className="text-muted hover:text-[#C1502E] shrink-0 p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={lang === "sw" ? "Ondoa" : "Remove"}
              >
                {isRemoving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          );
        })}
        {announcements.length === 0 && (
          <p className="text-xs text-muted py-1">
            {lang === "sw" ? "Hakuna tangazo bado" : "No announcements yet"}
          </p>
        )}
      </div>
    </div>
  );
}

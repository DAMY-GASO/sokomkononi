// ============================================================
// AnnouncementsPanel.jsx
// Bilingual + mobile-responsive + Async actions na rollback.
//
// Marekebisho:
//  - Hali: tabs Zote / Zilizopangwa / Zilizotumwa (na idadi)
//  - Zilizopangwa: "Tuma Sasa", "Badilisha Ratiba", muda uliobaki
//  - Ratiba lazima iwe wakati ujao (min + ukaguzi)
//  - Ratiba inaonyeshwa kwa saa za kivinjari; inatumwa kama UTC
//  - Kufuta kunauliza uthibitisho (tangazo lililotumwa linatoweka kwa watumiaji)
//  - Orodha inajisasisha kila dakika kukiwa na tangazo lililopangwa
// ============================================================

import React, { useState, useMemo, useEffect } from "react";
import { Megaphone, Plus, Trash2, Loader2, Send, Pencil, Check, X } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import {
  useAnnouncements,
  addAnnouncementAsync,
  removeAnnouncementAsync,
  sendAnnouncementNowAsync,
  rescheduleAnnouncementAsync,
  hydrateAnnouncementsFromApi,
  isoToLocalInput,
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
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const scheduledList = useMemo(
    () =>
      announcements
        .filter((a) => !a.sent)
        .sort((x, y) => new Date(x.scheduledFor) - new Date(y.scheduledFor)),
    [announcements]
  );
  const sentList = useMemo(
    () => announcements.filter((a) => a.sent),
    [announcements]
  );
  const visible =
    filter === "scheduled"
      ? scheduledList
      : filter === "sent"
        ? sentList
        : [...scheduledList, ...sentList];

  // Tangazo likiwa limepangwa, sasisha orodha kila dakika ili muda ukifika
  // lionekane "Imetumwa" bila kurefresh ukurasa.
  const hasScheduled = scheduledList.length > 0;
  useEffect(() => {
    if (!hasScheduled) return undefined;
    const id = setInterval(() => {
      (hydrateAnnouncementsFromApi.forceRefresh || hydrateAnnouncementsFromApi)();
    }, 60000);
    return () => clearInterval(id);
  }, [hasScheduled]);

  // Dakika ya sasa kwa `min` ya datetime-local
  const minLocal = isoToLocalInput(new Date(Date.now() + 60000).toISOString());

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
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(lang === "sw" ? "sw-TZ" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const timeUntil = (iso) => {
    const ms = new Date(iso).getTime() - Date.now();
    if (!(ms > 0)) return t("sasa hivi", "any moment now");
    const m = Math.round(ms / 60000);
    if (m < 60) return t(`baada ya dakika ${m}`, `in ${m} min`);
    const h = Math.round(m / 60);
    if (h < 48) return t(`baada ya saa ${h}`, `in ${h} h`);
    return t(`baada ya siku ${Math.round(h / 24)}`, `in ${Math.round(h / 24)} days`);
  };

  // ============================================================
  // HANDLERS — async + rollback
  // ============================================================
  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim() || busy.sending) return;

    if (form.scheduledFor && new Date(form.scheduledFor).getTime() <= Date.now()) {
      setError(
        t("Ratiba lazima iwe wakati ujao.", "The schedule must be in the future.")
      );
      return;
    }

    setBusy((b) => ({ ...b, sending: true }));
    setError("");

    // `sent` haitumwi — server inaamua kutokana na ratiba
    const res = await addAnnouncementAsync(form);

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

    const target = announcements.find((a) => a.id === id);
    const msg = target?.sent
      ? t(
          "Futa tangazo hili? Litatoweka kwa watumiaji wote, pamoja na arifa zake, na hatua hii haiwezi kurudishwa.",
          "Delete this announcement? It will disappear for all users, including its notifications, and this cannot be undone."
        )
      : t(
          "Ghairi na ufute tangazo hili lililopangwa?",
          "Cancel and delete this scheduled announcement?"
        );
    if (!window.confirm(msg)) return;

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

  const handleSendNow = async (id) => {
    if (busy[id]) return;
    if (
      !window.confirm(
        t(
          "Tuma tangazo hili sasa hivi kwa wote? Watapata arifa kwenye app, push na email (kulingana na mipangilio yao).",
          "Send this announcement to everyone right now? They will get an in-app notification, push and email (per their settings)."
        )
      )
    )
      return;
    setBusy((b) => ({ ...b, [id]: true }));
    setError("");
    const res = await sendAnnouncementNowAsync(id);
    setBusy((b) => {
      const next = { ...b };
      delete next[id];
      return next;
    });
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kutuma tangazo.", "Failed to send announcement.")
      );
    }
  };

  const startReschedule = (a) => {
    setEditingId(a.id);
    setEditValue(isoToLocalInput(a.scheduledFor));
    setError("");
  };

  const handleReschedule = async (id) => {
    if (busy[id] || !editValue) return;
    if (new Date(editValue).getTime() <= Date.now()) {
      setError(
        t("Ratiba lazima iwe wakati ujao.", "The schedule must be in the future.")
      );
      return;
    }
    setBusy((b) => ({ ...b, [id]: true }));
    setError("");
    const res = await rescheduleAnnouncementAsync(id, editValue);
    setBusy((b) => {
      const next = { ...b };
      delete next[id];
      return next;
    });
    if (res.ok) {
      setEditingId(null);
      setEditValue("");
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kubadilisha ratiba.", "Failed to change schedule.")
      );
    }
  };

  const canSend = form.title.trim() && form.message.trim() && !busy.sending;

  return (
    <div className="bg-card rounded-xl border border-hairline p-4 sm:p-5 flex flex-col gap-4 w-full min-w-0">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            style={{ background: "rgb(var(--c-ink) / 0.08)" }}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          >
            <Megaphone size={16} style={{ color: COLORS.ink }} />
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
          <Plus size={14} />
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
            color: COLORS.dangerText,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* Form */}
      {expanded && (
        <div
          className="border border-hairline rounded-xl p-3 sm:p-4 flex flex-col gap-3"
        >
          {/* Type */}
          <div>
            <p className="text-xs font-semibold text-secondary uppercase mb-1.5">
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
                    className={`text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-full border border-hairline whitespace-nowrap transition-colors disabled:opacity-50 ${
                      isActive ? "chip-active" : "bg-card text-primary"
                    }`}
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
            placeholder={
              lang === "sw"
                ? "Kichwa cha tangazo (SW)"
                : "Announcement title (SW)"
            }
            disabled={busy.sending}
            className="input"
          />

          {/* Title EN */}
          <input
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            placeholder={
              lang === "sw"
                ? "Kichwa cha tangazo (EN) — hiari"
                : "Announcement title (EN) — optional"
            }
            disabled={busy.sending}
            className="input"
          />

          {/* Message SW */}
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder={
              lang === "sw" ? "Ujumbe kamili (SW)..." : "Full message (SW)..."
            }
            rows={3}
            disabled={busy.sending}
            className="textarea resize-none"
          />

          {/* Message EN */}
          <textarea
            value={form.messageEn}
            onChange={(e) => setForm({ ...form, messageEn: e.target.value })}
            placeholder={
              lang === "sw"
                ? "Ujumbe kamili (EN) — hiari"
                : "Full message (EN) — optional"
            }
            rows={3}
            disabled={busy.sending}
            className="textarea resize-none"
          />

          {/* Schedule — calendar moja tu: ya browser (inafunguka kwa kubonyeza popote kwenye field) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label
              htmlFor="announcement-schedule"
              className="text-xs text-secondary shrink-0"
            >
              {lang === "sw" ? "Ratiba (hiari):" : "Schedule (optional):"}
            </label>
            <input
              id="announcement-schedule"
              type="datetime-local"
              value={form.scheduledFor}
              min={minLocal}
              onChange={(e) =>
                setForm({ ...form, scheduledFor: e.target.value })
              }
              onClick={(e) => {
                try { e.currentTarget.showPicker?.(); } catch { /* noop */ }
              }}
              disabled={busy.sending}
              className="input flex-1 min-w-0 cursor-pointer"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              background: canSend ? COLORS.green : "rgb(var(--c-hairline))",
              color: canSend ? "white" : "var(--text-muted)",
            }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 w-full sm:w-auto sm:self-start transition-colors disabled:cursor-not-allowed"
          >
            {busy.sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Megaphone size={14} />
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

      {/* Filter tabs */}
      {announcements.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto">
          {[
            ["all", t("Zote", "All"), announcements.length],
            ["scheduled", t("Zilizopangwa", "Scheduled"), scheduledList.length],
            ["sent", t("Zilizotumwa", "Sent"), sentList.length],
          ].map(([key, label, n]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border border-hairline whitespace-nowrap shrink-0 ${
                filter === key ? "chip-active" : "bg-card text-primary"
              }`}
            >
              {label} ({n})
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2">
        {visible.map((a) => {
          const isBusy = !!busy[a.id];
          const isEditing = editingId === a.id;
          return (
            <div
              key={a.id}
              className="border border-hairline rounded-lg px-3 sm:px-4 py-3 min-w-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      style={{
                        background: `${COLORS.gold}15`,
                        color: COLORS.goldText,
                      }}
                      className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                    >
                      {getTypeLabel(a.typeId)}
                    </span>
                    {!a.sent && a.scheduledFor && (
                      <span
                        style={{
                          background: `${COLORS.green}15`,
                          color: COLORS.successText,
                        }}
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                      >
                        {t("Imepangwa:", "Scheduled:")} {formatScheduled(a.scheduledFor)}
                        {" · "}
                        {timeUntil(a.scheduledFor)}
                      </span>
                    )}
                    {a.sent && (
                      <span
                        style={{
                          background: "rgb(var(--c-ink) / 0.08)",
                          color: COLORS.ink,
                        }}
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                      >
                        {t("Imetumwa", "Sent")}{" "}
                        {formatScheduled(a.scheduledFor || a.createdAt)}
                      </span>
                    )}
                    {a.sent && (() => {
                      // Arifa za bell: "zinatumwa" ni kwa matangazo ya saa 24 zilizopita tu
                      const ref = new Date(a.scheduledFor || a.createdAt).getTime();
                      const recent = Date.now() - ref < 24 * 3600 * 1000;
                      if (a.dispatchedAt) {
                        return (
                          <span className="text-xs text-muted">
                            {t("Arifa zimetumwa kwa watumiaji", "Users notified")}
                          </span>
                        );
                      }
                      return recent ? (
                        <span className="text-xs text-muted">
                          {t("Arifa zinatumwa...", "Notifying users...")}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <p className="text-sm font-semibold text-primary break-words">
                    {getTitle(a)}
                  </p>
                  <p className="text-xs text-secondary mt-0.5 break-words">
                    {getMessage(a)}
                  </p>
                  {lang === "en" && a.titleEn && (
                    <p className="text-xs text-muted mt-1 italic">
                      SW: {a.title}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!a.sent && (
                    <>
                      <button
                        onClick={() => handleSendNow(a.id)}
                        disabled={isBusy}
                        title={t("Tuma sasa", "Send now")}
                        aria-label={t("Tuma sasa", "Send now")}
                        style={{ color: COLORS.successText }}
                        className="p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={14} />
                      </button>
                      <button
                        onClick={() => (isEditing ? setEditingId(null) : startReschedule(a))}
                        disabled={isBusy}
                        title={t("Badilisha ratiba", "Change schedule")}
                        aria-label={t("Badilisha ratiba", "Change schedule")}
                        className="text-muted hover:text-primary p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Pencil size={14} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleRemove(a.id)}
                    disabled={isBusy}
                    className="text-muted hover:text-danger p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t("Ondoa", "Remove")}
                  >
                    {isBusy ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="datetime-local"
                    value={editValue}
                    min={minLocal}
                    onChange={(e) => setEditValue(e.target.value)}
                    onClick={(e) => {
                      try { e.currentTarget.showPicker?.(); } catch { /* noop */ }
                    }}
                    disabled={isBusy}
                    className="input flex-1 min-w-0 cursor-pointer"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleReschedule(a.id)}
                      disabled={isBusy || !editValue}
                      style={{ background: COLORS.green, color: "white" }}
                      className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-2 disabled:opacity-50"
                    >
                      {isBusy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      {t("Hifadhi", "Save")}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={isBusy}
                      className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-2 border border-hairline disabled:opacity-50"
                    >
                      <X size={12} />
                      {t("Ghairi", "Cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="text-xs text-muted py-1">
            {announcements.length === 0
              ? t("Hakuna tangazo bado", "No announcements yet")
              : t("Hakuna matangazo katika kundi hili", "No announcements in this group")}
          </p>
        )}
      </div>
    </div>
  );
}

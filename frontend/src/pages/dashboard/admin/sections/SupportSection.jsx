// ============================================================
// SupportSection.jsx
// Admin — Customer Care (tickets + feedback).
// Bilingual + mobile-responsive + Async actions na rollback.
//
// SASISHO:
//   - Tabs mbili: "Tickets" na "Feedback"
//   - Attachments upload + preview kwenye tickets
//   - SLA badge (⏰ SLA IMEPITA) kwa tickets zilizopita muda
//   - Feedback tab inaonyesha feedback zote za users
//   - Admin anaweza kujibu feedback na kuona wastani wa rating
// ============================================================

import React, { useState, useMemo, useRef } from "react";
import {
  Search,
  Trash2,
  Clock,
  User,
  Send,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Headphones,
  Inbox,
  UserCheck,
  Loader2,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Star,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useTickets,
  addTicketMessageAsync,
  updateTicketStatusAsync,
  updateTicketPriorityAsync,
  removeTicketAsync,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../../../../config/ticketsStore.js";
import {
  useFeedback,
  respondToFeedbackAsync,
  removeFeedbackAsync,
  FEEDBACK_TYPES,
} from "../../../../config/feedbackStore.js";

// ============================================================
// COLOR MAPS
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
// FEEDBACK ICONS
// ============================================================
const FEEDBACK_ICONS = { MessageSquare, AlertTriangle, Lightbulb, Star };

// ============================================================
// FEEDBACK STATUS MAP
// ============================================================
const FEEDBACK_STATUS_META = {
  new: {
    label: { sw: "Mpya", en: "New" },
    bg: "rgba(193,80,46,0.12)",
    fg: COLORS.rust,
  },
  read: {
    label: { sw: "Imesomwa", en: "Read" },
    bg: "rgba(232,163,61,0.16)",
    fg: "#8A5A16",
  },
  answered: {
    label: { sw: "Imejibiwa", en: "Answered" },
    bg: "rgba(47,109,79,0.12)",
    fg: COLORS.green,
  },
  archived: {
    label: { sw: "Imewekwa kwenye kumbukumbu", en: "Archived" },
    bg: "rgba(16,26,46,0.08)",
    fg: COLORS.night,
  },
};

// ============================================================
// ATTACHMENT PREVIEW
// ============================================================
function AttachmentPreview({ att, lang }) {
  if (!att?.url) return null;
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 text-xs text-primary bg-white rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors w-full min-w-0"
    >
      {att.isImage ? (
        <img
          src={att.url}
          alt={att.name}
          className="w-9 h-9 rounded object-cover shrink-0"
        />
      ) : (
        <Paperclip size={12} className="text-muted shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-[11px]">{att.name}</p>
        {att.uploadedByName && (
          <p className="text-[10px] text-muted truncate">
            {att.uploadedByName}
          </p>
        )}
      </div>
    </a>
  );
}

// ============================================================
// TICKET CARD
// ============================================================
function TicketCard({ ticket, lang }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const category = TICKET_CATEGORIES.find((c) => c.key === ticket.category);
  const priority = TICKET_PRIORITIES.find((p) => p.key === ticket.priority);
  const status = TICKET_STATUSES.find((s) => s.key === ticket.status);

  const catColors = COLOR_MAP[category?.color] || COLOR_MAP.night;
  const priColors = COLOR_MAP[priority?.color] || COLOR_MAP.gold;
  const statusColors = COLOR_MAP[status?.color] || COLOR_MAP.rust;

  const isBusy = (key) => !!busy[key];

  const handleSendReply = async () => {
    const hasText = replyText.trim().length > 0;
    const hasFiles = replyFiles.length > 0;
    if ((!hasText && !hasFiles) || isBusy("reply")) return;
    setBusy((b) => ({ ...b, reply: true }));
    setError("");

    const res = await addTicketMessageAsync(ticket.id, {
      text: replyText.trim(),
      files: replyFiles.map((f) => f.file || f),
    });

    setBusy((b) => {
      const next = { ...b };
      delete next.reply;
      return next;
    });

    if (res.ok) {
      setReplyText("");
      setReplyFiles([]);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kutuma jibu.", "Failed to send reply.")
      );
    }
  };

  const handleFilesPicked = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";

    const wrapped = await Promise.all(
      picked.map(async (f) => {
        let preview = null;
        if (f.type?.startsWith("image/")) {
          preview = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(f);
          });
        }
        return { file: f, name: f.name, type: f.type, preview };
      }),
    );

    setReplyFiles((prev) => [...prev, ...wrapped].slice(0, 5));
  };

  const removeReplyFile = (i) => {
    setReplyFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleStatusChange = async (newStatus) => {
    if (isBusy(`status-${newStatus}`)) return;
    setBusy((b) => ({ ...b, [`status-${newStatus}`]: true }));
    setError("");
    const res = await updateTicketStatusAsync(ticket.id, newStatus);
    setBusy((b) => {
      const next = { ...b };
      delete next[`status-${newStatus}`];
      return next;
    });
    if (!res.ok)
      setError(
        res.error?.message ||
          t("Imeshindwa kubadilisha hali.", "Failed to change status.")
      );
  };

  const handlePriorityChange = async (newPriority) => {
    if (isBusy("priority")) return;
    setBusy((b) => ({ ...b, priority: true }));
    setError("");
    const res = await updateTicketPriorityAsync(ticket.id, newPriority);
    setBusy((b) => {
      const next = { ...b };
      delete next.priority;
      return next;
    });
    if (!res.ok)
      setError(
        res.error?.message ||
          t("Imeshindwa kubadilisha kipaumbele.", "Failed to change priority.")
      );
  };

  const handleRemove = async () => {
    if (!window.confirm(t("Ondoa ticket hii?", "Remove this ticket?"))) return;
    if (isBusy("remove")) return;
    setBusy((b) => ({ ...b, remove: true }));
    setError("");
    const res = await removeTicketAsync(ticket.id);
    setBusy((b) => {
      const next = { ...b };
      delete next.remove;
      return next;
    });
    if (!res.ok)
      setError(
        res.error?.message || t("Imeshindwa kuondoa.", "Failed to remove.")
      );
  };

  const handleResolve = () => handleStatusChange("resolved");
  const handleClose = () => handleStatusChange("closed");
  const handleReopen = () => handleStatusChange("open");

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border overflow-hidden w-full max-w-full min-w-0"
    >
      <div className="p-3 sm:p-4 w-full min-w-0">
        <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
          <div
            style={{ background: catColors?.bg || "#F5F3EC" }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <Headphones size={16} color={catColors.fg} />
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-[10px] font-bold text-muted shrink-0 whitespace-nowrap">
                {ticket.code || ticket.id}
              </span>
              <span
                style={{ background: catColors?.bg, color: catColors?.fg }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {category?.label?.[lang] || ticket.category}
              </span>
              <span
                style={{ background: priColors?.bg, color: priColors?.fg }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {priority?.label?.[lang] || ticket.priority}
              </span>
              <span
                style={{ background: statusColors?.bg, color: statusColors?.fg }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {status?.label?.[lang] || ticket.status}
              </span>
              {ticket.slaOverdue && (
                <span
                  style={{ background: "rgba(193,80,46,0.2)", color: COLORS.rust }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                >
                  ⏰ SLA IMEPITA
                </span>
              )}
            </div>

            <p className="text-sm font-semibold truncate w-full">
              {ticket.subject}
            </p>

            <div className="flex items-center gap-2 mt-1 text-xs text-secondary flex-wrap">
              <span className="flex items-center gap-1 min-w-0">
                <User size={11} className="shrink-0" />
                <span className="truncate">{ticket.userName}</span>
              </span>
              <span className="text-muted shrink-0">•</span>
              <span className="flex items-center gap-1 shrink-0">
                <Clock size={11} />
                {timeAgo(ticket.createdAt, lang)}
              </span>
              {ticket.assignedToName && (
                <>
                  <span className="text-muted shrink-0">•</span>
                  <span className="flex items-center gap-1 min-w-0">
                    <UserCheck size={11} className="shrink-0" />
                    <span className="truncate">{ticket.assignedToName}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-muted hover:text-secondary shrink-0"
            aria-label={expanded ? "Funga" : "Fungua"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="border-t p-3 sm:p-4 flex flex-col gap-3 w-full max-w-full min-w-0 overflow-hidden"
        >
          {error && (
            <div
              style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
            >
              {error}
            </div>
          )}

          {/* Conversation */}
          <div className="min-w-0 w-full">
            <p className="text-[10px] font-semibold text-secondary uppercase mb-2">
              {t("Mazungumzo", "Conversation")}
            </p>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {ticket.messages?.map((msg) => {
                const isAdmin = msg.from === "admin";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      style={{
                        background: isAdmin ? COLORS.night : "white",
                        color: isAdmin ? COLORS.sand : "var(--text-primary)",
                        borderColor: COLORS.sandLine,
                      }}
                      className="border rounded-2xl px-3 py-2 max-w-[85%] text-xs min-w-0"
                    >
                      <p
                        className="font-semibold mb-0.5 text-[10px] uppercase"
                        style={{
                          color: isAdmin
                            ? "rgba(245,243,236,0.6)"
                            : "var(--text-muted)",
                        }}
                      >
                        {msg.senderName}
                      </p>
                      {msg.text && msg.text !== "[attachment]" && (
                        <p
                          className="leading-relaxed break-words"
                          style={{ color: "inherit" }}
                        >
                          {msg.text}
                        </p>
                      )}
                      {msg.attachments?.length > 0 && (
                        <div className="mt-1.5 flex flex-col gap-1">
                          {msg.attachments.map((att) => (
                            <AttachmentPreview key={att.id} att={att} lang={lang} />
                          ))}
                        </div>
                      )}
                      <p
                        className="text-[10px] mt-1"
                        style={{
                          color: isAdmin
                            ? "rgba(245,243,236,0.5)"
                            : "var(--text-muted)",
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

          {/* Actions (open / in_progress / resolved) */}
          {ticket.status !== "closed" && (
            <>
              {/* Reply input + file picker */}
              <div className="flex items-center gap-2 min-w-0 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFilesPicked}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy("reply")}
                  title={t("Ambatisha faili", "Attach files")}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-muted hover:text-secondary border"
                  style={{ borderColor: COLORS.sandLine, background: "white" }}
                >
                  <Paperclip size={14} />
                </button>
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  placeholder={t("Andika jibu...", "Type a reply...")}
                  disabled={isBusy("reply")}
                  style={{ borderColor: COLORS.sandLine }}
                  className="flex-1 min-w-0 rounded-full border px-3 py-2 text-xs outline-none bg-white disabled:opacity-50"
                />
                <button
                  onClick={handleSendReply}
                  disabled={
                    (!replyText.trim() && replyFiles.length === 0) ||
                    isBusy("reply")
                  }
                  style={{
                    background:
                      (replyText.trim() || replyFiles.length > 0) &&
                      !isBusy("reply")
                        ? COLORS.gold
                        : COLORS.sandLine,
                    color:
                      (replyText.trim() || replyFiles.length > 0) &&
                      !isBusy("reply")
                        ? COLORS.night
                        : "var(--text-muted)",
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:cursor-not-allowed"
                  aria-label={t("Tuma", "Send")}
                >
                  {isBusy("reply") ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>

              {/* Reply file previews */}
              {replyFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {replyFiles.map((f, i) => (
                    <div
                      key={i}
                      className="relative flex items-center gap-1.5 text-xs bg-white border rounded-lg px-2 py-1.5"
                      style={{ borderColor: COLORS.sandLine }}
                    >
                      {f.preview ? (
                        <img
                          src={f.preview}
                          alt={f.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <Paperclip size={12} className="text-muted" />
                      )}
                      <span className="truncate max-w-[100px]">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeReplyFile(i)}
                        className="text-muted hover:text-[#C1502E]"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Status buttons */}
              <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
                {ticket.status === "open" && (
                  <button
                    onClick={() => handleStatusChange("in_progress")}
                    disabled={isBusy("status-in_progress")}
                    style={{ background: COLORS.gold, color: COLORS.night }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBusy("status-in_progress") && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    {t("Anza Kushughulikia", "Start Working")}
                  </button>
                )}

                {ticket.status !== "resolved" && (
                  <button
                    onClick={handleResolve}
                    disabled={isBusy("status-resolved")}
                    style={{ background: COLORS.green, color: "white" }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBusy("status-resolved") ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CheckCircle size={12} />
                    )}
                    {t("Tatua", "Resolve")}
                  </button>
                )}

                {ticket.status === "resolved" && (
                  <button
                    onClick={handleClose}
                    disabled={isBusy("status-closed")}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      color: "var(--text-primary)",
                      borderColor: COLORS.sandLine,
                    }}
                  >
                    {isBusy("status-closed") && (
                      <Loader2 size={12} className="animate-spin" />
                    )}
                    {t("Funga", "Close")}
                  </button>
                )}

                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  disabled={isBusy("priority")}
                  style={{ borderColor: COLORS.sandLine }}
                  className="text-xs font-semibold px-2 py-2 rounded-lg border bg-white outline-none w-full sm:w-auto sm:ml-auto disabled:opacity-50"
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label?.[lang] || p.label?.sw}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleRemove}
                  disabled={isBusy("remove")}
                  className="p-2 text-muted hover:text-[#C1502E] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t("Ondoa", "Remove")}
                >
                  {isBusy("remove") ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </>
          )}

          {/* Closed ticket — reopen only */}
          {ticket.status === "closed" && (
            <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
              <button
                onClick={handleReopen}
                disabled={isBusy("status-open")}
                style={{ background: COLORS.gold, color: COLORS.night }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBusy("status-open") && (
                  <Loader2 size={12} className="animate-spin" />
                )}
                {t("Fungua Tena", "Reopen")}
              </button>
              <button
                onClick={handleRemove}
                disabled={isBusy("remove")}
                className="ml-auto p-2 text-muted hover:text-[#C1502E] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t("Ondoa", "Remove")}
              >
                {isBusy("remove") ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// FEEDBACK CARD
// ============================================================
function FeedbackCard({ item, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(false);

  const ft = FEEDBACK_TYPES.find((x) => x.key === item.type) || FEEDBACK_TYPES[0];
  const Icon = FEEDBACK_ICONS[ft.icon] || MessageSquare;
  const status = FEEDBACK_STATUS_META[item.status] || FEEDBACK_STATUS_META.new;

  const handleSendReply = async () => {
    if (!replyText.trim() || busy) return;
    setBusy(true);
    setError("");
    const res = await respondToFeedbackAsync(item.id, replyText.trim());
    setBusy(false);
    if (res.ok) setReplyText("");
    else
      setError(
        res.error?.message ||
          t("Imeshindwa kutuma jibu.", "Failed to send reply.")
      );
  };

  const handleRemove = async () => {
    if (
      !window.confirm(t("Ondoa feedback hii?", "Remove this feedback?"))
    )
      return;
    setRemoving(true);
    setError("");
    const res = await removeFeedbackAsync(item.id);
    setRemoving(false);
    if (!res.ok)
      setError(
        res.error?.message || t("Imeshindwa kuondoa.", "Failed to remove.")
      );
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border overflow-hidden w-full max-w-full min-w-0"
    >
      <div className="p-3 sm:p-4 w-full min-w-0">
        <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
          <div
            style={{ background: `${COLORS.night}0D` }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <Icon size={16} color={COLORS.night} />
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                style={{ background: `${COLORS.gold}20`, color: "#8A5A16" }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {ft.label?.[lang] || ft.label?.sw}
              </span>
              <span
                style={{ background: status.bg, color: status.fg }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {status.label?.[lang] || status.label?.sw}
              </span>
              {item.rating != null && (
                <span className="flex items-center gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={11}
                      fill={n <= item.rating ? COLORS.gold : "none"}
                      color={n <= item.rating ? COLORS.gold : "#D1D5DB"}
                    />
                  ))}
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-primary truncate w-full">
              {item.subject}
            </p>

            <div className="flex items-center gap-2 mt-1 text-xs text-secondary flex-wrap">
              <span className="flex items-center gap-1 min-w-0">
                <User size={11} className="shrink-0" />
                <span className="truncate">{item.userName || "—"}</span>
              </span>
              {item.userEmail && (
                <>
                  <span className="text-muted shrink-0">•</span>
                  <span className="truncate">{item.userEmail}</span>
                </>
              )}
              <span className="text-muted shrink-0">•</span>
              <span className="flex items-center gap-1 shrink-0">
                <Clock size={11} />
                {timeAgo(item.createdAt, lang)}
              </span>
              {item.authorSide && (
                <>
                  <span className="text-muted shrink-0">•</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                    style={{
                      background:
                        item.authorSide === "buyer"
                          ? "rgba(47,109,79,0.12)"
                          : "rgba(232,163,61,0.16)",
                      color:
                        item.authorSide === "buyer" ? COLORS.green : "#8A5A16",
                    }}
                  >
                    {item.authorSide === "buyer"
                      ? t("Mnunuzi", "Buyer")
                      : t("Muuzaji", "Seller")}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-muted hover:text-secondary shrink-0"
            aria-label={expanded ? "Funga" : "Fungua"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="border-t p-3 sm:p-4 flex flex-col gap-3 w-full max-w-full min-w-0 overflow-hidden"
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

          <div className="min-w-0 w-full">
            <p className="text-[10px] font-semibold text-secondary uppercase mb-1">
              {t("Ujumbe", "Message")}
            </p>
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-lg border px-3 py-2.5 text-xs text-primary leading-relaxed whitespace-pre-wrap break-words w-full min-w-0"
            >
              {item.message || "—"}
            </div>
          </div>

          {item.adminReply && (
            <div className="min-w-0 w-full">
              <p className="text-[10px] font-semibold text-secondary uppercase mb-1">
                {t("Jibu la Admin", "Admin Reply")}
                {item.repliedAt && (
                  <span className="text-muted font-normal ml-2">
                    · {timeAgo(item.repliedAt, lang)}
                  </span>
                )}
              </p>
              <div
                style={{
                  background: "rgba(47,109,79,0.08)",
                  color: COLORS.green,
                }}
                className="rounded-lg px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap break-words w-full min-w-0"
              >
                {item.adminReply}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 min-w-0 w-full">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !busy && handleSendReply()
              }
              placeholder={t("Andika jibu lako...", "Type your reply...")}
              disabled={busy}
              style={{ borderColor: COLORS.sandLine }}
              className="flex-1 min-w-0 rounded-full border px-3 py-2 text-xs outline-none bg-white disabled:opacity-50"
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim() || busy}
              style={{
                background:
                  replyText.trim() && !busy ? COLORS.gold : COLORS.sandLine,
                color:
                  replyText.trim() && !busy
                    ? COLORS.night
                    : "var(--text-muted)",
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:cursor-not-allowed"
              aria-label={t("Tuma", "Send")}
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
            <button
              onClick={handleRemove}
              disabled={removing}
              className="p-2 text-muted hover:text-[#C1502E] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t("Ondoa", "Remove")}
            >
              {removing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN SECTION
// ============================================================
export default function SupportSection() {
  const { lang } = useLanguage();
  const tickets = useTickets();
  const feedback = useFeedback();

  // Tab: "tickets" | "feedback"
  const [tab, setTab] = useState("tickets");

  // Ticket filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ticketQuery, setTicketQuery] = useState("");

  // Feedback filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState("all");
  const [feedbackQuery, setFeedbackQuery] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ── Ticket counts ──
  const ticketCounts = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    const closed = tickets.filter((t) => t.status === "closed").length;
    const overdue = tickets.filter((t) => t.slaOverdue).length;
    return { total, open, inProgress, resolved, closed, overdue };
  }, [tickets]);

  const ticketCategoryCounts = useMemo(() => {
    const counts = { all: tickets.length };
    TICKET_CATEGORIES.forEach((c) => {
      counts[c.key] = tickets.filter((t) => t.category === c.key).length;
    });
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let result = [...tickets];
    if (statusFilter !== "all")
      result = result.filter((t) => t.status === statusFilter);
    if (categoryFilter !== "all")
      result = result.filter((t) => t.category === categoryFilter);
    if (ticketQuery.trim()) {
      const q = ticketQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject?.toLowerCase().includes(q) ||
          t.userName?.toLowerCase().includes(q) ||
          t.userEmail?.toLowerCase().includes(q) ||
          t.code?.toLowerCase().includes(q) ||
          String(t.id).includes(q)
      );
    }
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    result.sort((a, b) => {
      // SLA overdue kwanza
      if (a.slaOverdue && !b.slaOverdue) return -1;
      if (!a.slaOverdue && b.slaOverdue) return 1;
      const aPrio = priorityOrder[a.priority] ?? 99;
      const bPrio = priorityOrder[b.priority] ?? 99;
      if (aPrio !== bPrio) return aPrio - bPrio;
      return (
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt)
      );
    });
    return result;
  }, [tickets, statusFilter, categoryFilter, ticketQuery]);

  // ── Feedback counts ──
  const feedbackCounts = useMemo(() => {
    const total = feedback.length;
    const byType = {};
    FEEDBACK_TYPES.forEach((ft) => {
      byType[ft.key] = feedback.filter((f) => f.type === ft.key).length;
    });
    const byStatus = {
      new: feedback.filter((f) => f.status === "new").length,
      answered: feedback.filter((f) => f.status === "answered").length,
    };
    return { total, byType, byStatus };
  }, [feedback]);

  const filteredFeedback = useMemo(() => {
    let result = [...feedback];
    if (typeFilter !== "all") result = result.filter((f) => f.type === typeFilter);
    if (feedbackStatusFilter !== "all")
      result = result.filter((f) => f.status === feedbackStatusFilter);
    if (feedbackQuery.trim()) {
      const q = feedbackQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.subject?.toLowerCase().includes(q) ||
          f.message?.toLowerCase().includes(q) ||
          f.userName?.toLowerCase().includes(q) ||
          f.userEmail?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (a.status === "new" && b.status !== "new") return -1;
      if (a.status !== "new" && b.status === "new") return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return result;
  }, [feedback, typeFilter, feedbackStatusFilter, feedbackQuery]);

  // ── Average rating ──
  const avgRating = useMemo(() => {
    const rated = feedback.filter((f) => f.rating != null);
    if (!rated.length) return "—";
    const avg = rated.reduce((s, f) => s + f.rating, 0) / rated.length;
    return avg.toFixed(1);
  }, [feedback]);

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Huduma kwa Wateja", "Customer Care")}
        subtitle={t(
          "Simamia tickets, malalamiko, maoni, na ujumbe wa watumiaji.",
          "Manage tickets, complaints, feedback, and user messages."
        )}
      />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TABS — Tickets | Feedback                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex justify-center mb-5 w-full min-w-0">
        <div
          style={{ background: "white", borderColor: COLORS.sandLine }}
          className="flex rounded-full border p-1 w-full sm:w-auto"
        >
          <button
            onClick={() => setTab("tickets")}
            style={{
              background: tab === "tickets" ? COLORS.night : "transparent",
              color: tab === "tickets" ? COLORS.sand : "var(--text-primary)",
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <Headphones size={13} />
            {t("Tickets", "Tickets")}
            {ticketCounts.total > 0 && (
              <span
                style={{
                  background:
                    tab === "tickets"
                      ? "rgba(245,243,236,0.18)"
                      : COLORS.sandLine,
                  color:
                    tab === "tickets" ? COLORS.sand : "var(--text-primary)",
                }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1"
              >
                {ticketCounts.total}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("feedback")}
            style={{
              background: tab === "feedback" ? COLORS.night : "transparent",
              color: tab === "feedback" ? COLORS.sand : "var(--text-primary)",
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <MessageSquare size={13} />
            {t("Maoni", "Feedback")}
            {feedbackCounts.total > 0 && (
              <span
                style={{
                  background:
                    tab === "feedback"
                      ? "rgba(245,243,236,0.18)"
                      : COLORS.sandLine,
                  color:
                    tab === "feedback" ? COLORS.sand : "var(--text-primary)",
                }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1"
              >
                {feedbackCounts.total}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB: TICKETS                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      {tab === "tickets" && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-5 w-full">
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full"
            >
              <p className="text-[10px] font-semibold text-secondary uppercase truncate">
                {t("Zote", "Total")}
              </p>
              <p
                style={{ color: "var(--text-primary)" }}
                className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
              >
                {ticketCounts.total}
              </p>
            </div>
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full"
            >
              <p className="text-[10px] font-semibold text-secondary uppercase truncate">
                {t("Wazi", "Open")}
              </p>
              <p
                className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
                style={{ color: COLORS.rust }}
              >
                {ticketCounts.open}
              </p>
            </div>
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full"
            >
              <p className="text-[10px] font-semibold text-secondary uppercase truncate">
                {t("Inaendelea", "In Progress")}
              </p>
              <p
                className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
                style={{ color: "#8A5A16" }}
              >
                {ticketCounts.inProgress}
              </p>
            </div>
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full"
            >
              <p className="text-[10px] font-semibold text-secondary uppercase truncate">
                {t("Zimetatuliwa", "Resolved")}
              </p>
              <p
                className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
                style={{ color: COLORS.green }}
              >
                {ticketCounts.resolved}
              </p>
            </div>
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full col-span-2 sm:col-span-1"
            >
              <p className="text-[10px] font-semibold text-secondary uppercase truncate">
                {t("SLA Imepita", "SLA Overdue")}
              </p>
              <p
                className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
                style={{ color: ticketCounts.overdue > 0 ? COLORS.rust : COLORS.green }}
              >
                {ticketCounts.overdue}
              </p>
            </div>
          </div>

          {/* Status Tabs */}
          {tickets.length > 0 && (
            <div className="flex justify-center gap-2 mb-3 overflow-x-auto pb-2 w-full min-w-0">
              <button
                onClick={() => setStatusFilter("all")}
                style={{
                  background: statusFilter === "all" ? COLORS.night : "white",
                  color:
                    statusFilter === "all"
                      ? COLORS.sand
                      : "var(--text-primary)",
                  borderColor: COLORS.sandLine,
                }}
                className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
              >
                {t("Zote", "All")} ({ticketCounts.total})
              </button>
              {TICKET_STATUSES.map((s) => {
                const countKey =
                  s.key === "open"
                    ? "open"
                    : s.key === "in_progress"
                    ? "inProgress"
                    : s.key === "closed"
                    ? "closed"
                    : s.key;
                const count = ticketCounts[countKey] || 0;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    style={{
                      background:
                        statusFilter === s.key ? COLORS.night : "white",
                      color:
                        statusFilter === s.key
                          ? COLORS.sand
                          : "var(--text-primary)",
                      borderColor: COLORS.sandLine,
                    }}
                    className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
                  >
                    {s.label?.[lang] || s.label?.sw} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Category + Search */}
          {tickets.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full min-w-0">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ borderColor: COLORS.sandLine }}
                className="text-xs font-semibold px-3 py-2 rounded-lg border bg-white outline-none shrink-0 w-full sm:w-auto"
              >
                <option value="all">
                  {t("Kategoria Zote", "All Categories")} (
                  {ticketCategoryCounts.all})
                </option>
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label?.[lang] || c.label?.sw} (
                    {ticketCategoryCounts[c.key]})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-0">
                <Search size={14} className="text-muted shrink-0" />
                <input
                  value={ticketQuery}
                  onChange={(e) => setTicketQuery(e.target.value)}
                  placeholder={t(
                    "Tafuta kwa ID, mada, mtumiaji...",
                    "Search by ID, subject, user..."
                  )}
                  className="outline-none text-xs flex-1 min-w-0"
                />
              </div>
            </div>
          )}

          {/* List */}
          {filteredTickets.length === 0 ? (
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
            >
              <Inbox size={40} className="mx-auto text-muted mb-3" />
              <h3
                style={{ color: "var(--text-primary)" }}
                className="font-semibold mb-1"
              >
                {ticketQuery ||
                statusFilter !== "all" ||
                categoryFilter !== "all"
                  ? t("Hakuna matokeo", "No results")
                  : t("Hakuna tickets", "No tickets")}
              </h3>
              <p className="text-sm text-secondary">
                {ticketQuery ||
                statusFilter !== "all" ||
                categoryFilter !== "all"
                  ? t(
                      "Jaribu kubadilisha vichujio au utafutaji wako.",
                      "Try changing your filters or search."
                    )
                  : t(
                      "Tickets za watumiaji zitaonekana hapa.",
                      "User tickets will appear here."
                    )}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full min-w-0">
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} lang={lang} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TAB: FEEDBACK                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {tab === "feedback" && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 w-full">
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full"
            >
              <p className="text-[10px] font-semibold text-secondary uppercase truncate">
                {t("Zote", "Total")}
              </p>
              <p
                style={{ color: "var(--text-primary)" }}
                className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
              >
                {feedbackCounts.total}
              </p>
            </div>
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full"
            >
              <p className="text-[10px] font-semibold text-secondary uppercase truncate">
                {t("Mpya", "New")}
              </p>
              <p
                className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
                style={{ color: COLORS.rust }}
              >
                {feedbackCounts.byStatus.new}
              </p>
            </div>
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full"
            >
              <p className="text-[10px] font-semibold text-secondary uppercase truncate">
                {t("Zimejibiwa", "Answered")}
              </p>
              <p
                className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
                style={{ color: COLORS.green }}
              >
                {feedbackCounts.byStatus.answered}
              </p>
            </div>
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full"
            >
              <p className="text-[10px] font-semibold text-secondary uppercase truncate">
                {t("Wastani wa Rating", "Avg Rating")}
              </p>
              <p
                className="text-sm sm:text-base lg:text-lg font-bold mt-0.5 break-words"
                style={{ color: COLORS.gold }}
              >
                {avgRating}
              </p>
            </div>
          </div>

          {/* Type Tabs */}
          {feedback.length > 0 && (
            <div className="flex justify-center gap-2 mb-3 overflow-x-auto pb-2 w-full min-w-0">
              <button
                onClick={() => setTypeFilter("all")}
                style={{
                  background: typeFilter === "all" ? COLORS.night : "white",
                  color:
                    typeFilter === "all"
                      ? COLORS.sand
                      : "var(--text-primary)",
                  borderColor: COLORS.sandLine,
                }}
                className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
              >
                {t("Zote", "All")} ({feedbackCounts.total})
              </button>
              {FEEDBACK_TYPES.map((ft) => (
                <button
                  key={ft.key}
                  onClick={() => setTypeFilter(ft.key)}
                  style={{
                    background: typeFilter === ft.key ? COLORS.night : "white",
                    color:
                      typeFilter === ft.key
                        ? COLORS.sand
                        : "var(--text-primary)",
                    borderColor: COLORS.sandLine,
                  }}
                  className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
                >
                  {ft.label?.[lang] || ft.label?.sw} (
                  {feedbackCounts.byType[ft.key] || 0})
                </button>
              ))}
            </div>
          )}

          {/* Status + Search */}
          {feedback.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full min-w-0">
              <select
                value={feedbackStatusFilter}
                onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                style={{ borderColor: COLORS.sandLine }}
                className="text-xs font-semibold px-3 py-2 rounded-lg border bg-white outline-none shrink-0 w-full sm:w-auto"
              >
                <option value="all">{t("Hali Zote", "All Statuses")}</option>
                <option value="new">
                  {t("Mpya", "New")} ({feedbackCounts.byStatus.new})
                </option>
                <option value="answered">
                  {t("Zimejibiwa", "Answered")} (
                  {feedbackCounts.byStatus.answered})
                </option>
              </select>

              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-0">
                <Search size={14} className="text-muted shrink-0" />
                <input
                  value={feedbackQuery}
                  onChange={(e) => setFeedbackQuery(e.target.value)}
                  placeholder={t(
                    "Tafuta kwa kichwa, ujumbe, mtumiaji...",
                    "Search by subject, message, user..."
                  )}
                  className="outline-none text-xs flex-1 min-w-0"
                />
              </div>
            </div>
          )}

          {/* List */}
          {filteredFeedback.length === 0 ? (
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
            >
              <Inbox size={40} className="mx-auto text-muted mb-3" />
              <h3
                style={{ color: "var(--text-primary)" }}
                className="font-semibold mb-1"
              >
                {feedbackQuery ||
                typeFilter !== "all" ||
                feedbackStatusFilter !== "all"
                  ? t("Hakuna matokeo", "No results")
                  : t("Hakuna maoni bado", "No feedback yet")}
              </h3>
              <p className="text-sm text-secondary">
                {feedbackQuery ||
                typeFilter !== "all" ||
                feedbackStatusFilter !== "all"
                  ? t(
                      "Jaribu kubadilisha vichujio au utafutaji wako.",
                      "Try changing your filters or search."
                    )
                  : t(
                      "Maoni ya watumiaji yataonekana hapa.",
                      "User feedback will appear here."
                    )}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full min-w-0">
              {filteredFeedback.map((item) => (
                <FeedbackCard key={item.id} item={item} lang={lang} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
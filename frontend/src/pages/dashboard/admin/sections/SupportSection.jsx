// ============================================================
// SupportSection.jsx
// Admin — Customer Care (tickets, complaints).
// Bilingual + mobile-responsive.
// ============================================================

import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  Search,
  Trash2,
  Clock,
  User,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Headphones,
  Inbox,
  MessageCircle,
  UserCheck,
} from "lucide-react";
import { COLORS, FONTS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useTickets,
  addTicketMessage,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  removeTicket,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../../../../config/ticketsStore.js";

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
// TICKET CARD
// ============================================================
function TicketCard({ ticket, lang }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const category = TICKET_CATEGORIES.find((c) => c.key === ticket.category);
  const priority = TICKET_PRIORITIES.find((p) => p.key === ticket.priority);
  const status = TICKET_STATUSES.find((s) => s.key === ticket.status);

  const catColors = COLOR_MAP[category?.color] || COLOR_MAP.night;
  const priColors = COLOR_MAP[priority?.color] || COLOR_MAP.gold;
  const statusColors = COLOR_MAP[status?.color] || COLOR_MAP.rust;

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    addTicketMessage(ticket.id, {
      from: "admin",
      senderName: "Admin",
      text: replyText.trim(),
    });
    setReplyText("");
  };

  const handleResolve = () => {
    updateTicketStatus(ticket.id, "resolved");
  };

  const handleClose = () => {
    updateTicketStatus(ticket.id, "closed");
  };

  const handleReopen = () => {
    updateTicketStatus(ticket.id, "open");
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border overflow-hidden"
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            style={{ background: catColors.bg }}
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <Headphones size={18} color={catColors.fg} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold text-gray-400">
                {ticket.id}
              </span>
              <span
                style={{ background: catColors.bg, color: catColors.fg }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {category?.label?.[lang] || category?.label?.sw || ticket.category}
              </span>
              <span
                style={{ background: priColors.bg, color: priColors.fg }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {priority?.label?.[lang] || priority?.label?.sw}
              </span>
              <span
                style={{ background: statusColors.bg, color: statusColors.fg }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {status?.label?.[lang] || status?.label?.sw}
              </span>
            </div>

            <p
              style={{ color: COLORS.night }}
              className="text-sm font-semibold truncate"
            >
              {ticket.subject}
            </p>

            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <User size={11} />
                {ticket.userName}
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {timeAgo(ticket.createdAt, lang)}
              </span>
              {ticket.assignedTo && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1">
                    <UserCheck size={11} />
                    {ticket.assignedTo}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-gray-400 hover:text-gray-600"
            aria-label={expanded ? "Funga" : "Fungua"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="border-t p-4 flex flex-col gap-3"
        >
          {/* Messages thread */}
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">
              {t("Mazungumzo", "Conversation")}
            </p>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
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
                        color: isAdmin ? COLORS.sand : COLORS.night,
                        borderColor: COLORS.sandLine,
                      }}
                      className="border rounded-2xl px-3 py-2 max-w-[85%] text-xs"
                    >
                      <p
                        className="font-semibold mb-0.5 text-[10px] uppercase"
                        style={{
                          color: isAdmin ? "rgba(245,243,236,0.6)" : "rgba(16,26,46,0.5)",
                        }}
                      >
                        {msg.senderName}
                      </p>
                      <p className="leading-relaxed break-words">{msg.text}</p>
                      <p
                        className="text-[10px] mt-1"
                        style={{
                          color: isAdmin
                            ? "rgba(245,243,236,0.5)"
                            : "rgba(16,26,46,0.4)",
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

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                {t("Viambatisho", "Attachments")}
              </p>
              <div className="flex flex-col gap-1.5">
                {ticket.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-gray-700 bg-white rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Paperclip size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{att.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {ticket.status !== "closed" && (
            <>
              {/* Reply composer */}
              <div className="flex items-center gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  placeholder={t("Andika jibu...", "Type a reply...")}
                  style={{ borderColor: COLORS.sandLine }}
                  className="flex-1 rounded-full border px-3 py-2 text-xs outline-none bg-white"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  style={{
                    background: replyText.trim() ? COLORS.gold : COLORS.sandLine,
                    color: replyText.trim() ? COLORS.night : "rgba(16,26,46,0.4)",
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  aria-label={t("Tuma", "Send")}
                >
                  <Send size={14} />
                </button>
              </div>

              {/* Status actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {ticket.status === "open" && (
                  <button
                    onClick={() => updateTicketStatus(ticket.id, "in_progress")}
                    style={{ background: COLORS.gold, color: COLORS.night }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                  >
                    {t("Anza Kushughulikia", "Start Working")}
                  </button>
                )}

                {ticket.status !== "resolved" && (
                  <button
                    onClick={handleResolve}
                    style={{ background: COLORS.green, color: "white" }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                  >
                    <CheckCircle size={12} />
                    {t("Tatua", "Resolve")}
                  </button>
                )}

                <button
                  onClick={handleClose}
                  style={{ color: COLORS.night }}
                  className="text-xs font-semibold px-3 py-2 rounded-lg border"
                >
                  {t("Funga", "Close")}
                </button>

                {/* Priority */}
                <select
                  value={ticket.priority}
                  onChange={(e) => updateTicketPriority(ticket.id, e.target.value)}
                  style={{ borderColor: COLORS.sandLine }}
                  className="text-xs font-semibold px-2 py-2 rounded-lg border bg-white outline-none ml-auto"
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label?.[lang] || p.label?.sw}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        t("Ondoa ticket hii?", "Remove this ticket?")
                      )
                    ) {
                      removeTicket(ticket.id);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-[#C1502E] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </>
          )}

          {/* Closed — reopen */}
          {ticket.status === "closed" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReopen}
                style={{ background: COLORS.gold, color: COLORS.night }}
                className="text-xs font-semibold px-3 py-2 rounded-lg"
              >
                {t("Fungua Tena", "Reopen")}
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      t("Ondoa ticket hii?", "Remove this ticket?")
                    )
                  ) {
                    removeTicket(ticket.id);
                  }
                }}
                className="ml-auto p-2 text-gray-400 hover:text-[#C1502E] transition-colors"
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
// MAIN SECTION
// ============================================================
export default function SupportSection() {
  const { lang } = useLanguage();
  const tickets = useTickets();
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // Counts
  const counts = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    const closed = tickets.filter((t) => t.status === "closed").length;
    return { total, open, inProgress, resolved, closed };
  }, [tickets]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: tickets.length };
    TICKET_CATEGORIES.forEach((c) => {
      counts[c.key] = tickets.filter((t) => t.category === c.key).length;
    });
    return counts;
  }, [tickets]);

  // Filtered
  const filtered = useMemo(() => {
    let result = [...tickets];

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((t) => t.category === categoryFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject?.toLowerCase().includes(q) ||
          t.userName?.toLowerCase().includes(q) ||
          t.userEmail?.toLowerCase().includes(q) ||
          t.id?.toLowerCase().includes(q)
      );
    }

    // Sort: urgent/high kwanza, kisha kwa tarehe
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    result.sort((a, b) => {
      const aPrio = priorityOrder[a.priority] ?? 99;
      const bPrio = priorityOrder[b.priority] ?? 99;
      if (aPrio !== bPrio) return aPrio - bPrio;
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    return result;
  }, [tickets, statusFilter, categoryFilter, query]);

  return (
    <>
      <SectionHeader
        title={t("Huduma kwa Wateja", "Customer Care")}
        subtitle={t(
          "Simamia tickets, malalamiko, na ujumbe wa watumiaji.",
          "Manage tickets, complaints, and user messages."
        )}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3"
        >
          <p className="text-[10px] font-semibold text-gray-500 uppercase">
            {t("Zote", "Total")}
          </p>
          <p style={{ color: COLORS.night }} className="text-lg font-bold mt-0.5">
            {counts.total}
          </p>
        </div>
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3"
        >
          <p className="text-[10px] font-semibold text-gray-500 uppercase">
            {t("Wazi", "Open")}
          </p>
          <p className="text-lg font-bold mt-0.5" style={{ color: COLORS.rust }}>
            {counts.open}
          </p>
        </div>
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3"
        >
          <p className="text-[10px] font-semibold text-gray-500 uppercase">
            {t("Inaendelea", "In Progress")}
          </p>
          <p className="text-lg font-bold mt-0.5" style={{ color: "#8A5A16" }}>
            {counts.inProgress}
          </p>
        </div>
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3"
        >
          <p className="text-[10px] font-semibold text-gray-500 uppercase">
            {t("Zimetatuliwa", "Resolved")}
          </p>
          <p
            className="text-lg font-bold mt-0.5"
            style={{ color: COLORS.green }}
          >
            {counts.resolved}
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      {tickets.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter("all")}
            style={{
              background: statusFilter === "all" ? COLORS.night : "white",
              color: statusFilter === "all" ? COLORS.sand : COLORS.night,
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap shrink-0"
          >
            {t("Zote", "All")} ({counts.total})
          </button>
          {TICKET_STATUSES.map((s) => {
            const countKey =
              s.key === "open"
                ? "open"
                : s.key === "in_progress"
                  ? "inProgress"
                  : s.key;
            const count = counts[countKey] || 0;
            return (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                style={{
                  background: statusFilter === s.key ? COLORS.night : "white",
                  color: statusFilter === s.key ? COLORS.sand : COLORS.night,
                  borderColor: COLORS.sandLine,
                }}
                className="text-xs font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap shrink-0"
              >
                {s.label?.[lang] || s.label?.sw} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Category Filter + Search */}
      {tickets.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ borderColor: COLORS.sandLine }}
            className="text-xs font-semibold px-3 py-2 rounded-lg border bg-white outline-none shrink-0"
          >
            <option value="all">
              {t("Kategoria Zote", "All Categories")} ({categoryCounts.all})
            </option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label?.[lang] || c.label?.sw} ({categoryCounts[c.key]})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
      {filtered.length === 0 ? (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border-2 border-dashed p-10 text-center"
        >
          <Inbox size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 style={{ color: COLORS.night }} className="font-semibold mb-1">
            {query || statusFilter !== "all" || categoryFilter !== "all"
              ? t("Hakuna matokeo", "No results")
              : t("Hakuna tickets", "No tickets")}
          </h3>
          <p className="text-sm text-gray-500">
            {query || statusFilter !== "all" || categoryFilter !== "all"
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
        <div className="flex flex-col gap-3">
          {filtered.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} lang={lang} />
          ))}
        </div>
      )}
    </>
  );
}

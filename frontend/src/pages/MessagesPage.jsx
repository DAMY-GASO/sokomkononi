// ============================================================
// MessagesPage.jsx — full-height 2-pane messaging UI
//
// Layout:
//   ┌──────────────────────────────────────────────┐
//   │ header: title + unread + search              │
//   ├───────────────┬──────────────────────────────┤
//   │ conversation  │  chat header                 │
//   │ list          │  ──────────────────────────  │
//   │ (scrollable)  │  messages (scrollable)       │
//   │               │  ──────────────────────────  │
//   │               │  composer                    │
//   └───────────────┴──────────────────────────────┘
//
// SASISHO:
// - Fetch conversation detail kila selectedId inabadilika
//   (ConversationListSerializer haina `messages`).
// - Message yako (isMe): white text kabisa + gold border.
// - Composer: text-white kwa button.
// - Loading state kwa messages.
// - `fetchConversationDetailAsync` inaitwa.
// ============================================================
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MessageSquare, Search, Send, ArrowLeft, Phone, MoreVertical,
  Check, CheckCheck, Loader2, AlertCircle,
} from "lucide-react";
import { COLORS, timeAgo } from "./dashboard/components/shared";
import {
  useConversations,
  sendMessageAsync,
  markConversationReadAsync,
  fetchConversationDetailAsync,        // ⬅️ MPYA
} from "../config/messagesStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../config/authStore.js";

function t(lang, sw, en) {
  return lang === "sw" ? sw : en;
}

function getCounterparty(convo, currentUserId) {
  if (!convo?.participants || !currentUserId) {
    return { name: convo?.name || "—", avatar: convo?.avatar || "?" };
  }
  const other = convo.participants.find((p) => String(p.id) !== String(currentUserId));
  if (!other) {
    return { name: convo.name || "—", avatar: convo.avatar || "?" };
  }
  return {
    name: other.name || other.username || "—",
    avatar: other.avatar || (other.name ? other.name[0].toUpperCase() : "?"),
  };
}

function dayLabel(dateStr, lang) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return lang === "sw" ? "Leo" : "Today";
  if (sameDay(d, yesterday)) return lang === "sw" ? "Jana" : "Yesterday";
  return d.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-US", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function groupMessages(messages, lang) {
  const groups = [];
  let currentDay = null;

  for (const m of messages) {
    const day = dayLabel(m.at, lang);
    if (day !== currentDay) {
      groups.push({ type: "day", label: day, key: `day-${m.id}-${day}` });
      currentDay = day;
    }
    groups.push({ type: "msg", msg: m, key: `msg-${m.id}` });
  }
  return groups;
}

// ── Conversation list item ───────────────────────────────
function ConversationListItem({ convo, currentUserId, active, onSelect, lang }) {
  const { name, avatar } = getCounterparty(convo, currentUserId);
  const lastMessage = convo.lastMessage || "";
  const unread = convo.unreadCount || 0;

  return (
    <button
      onClick={() => onSelect(convo.id)}
      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
        active
          ? "bg-white border"
          : "hover:bg-white/60 border border-transparent"
      }`}
      style={{ borderColor: active ? COLORS.sandLine : "transparent" }}
    >
      <div className="relative flex-shrink-0">
        <div
          style={{ background: COLORS.night, color: "#FFFFFF" }}
          className="w-11 h-11 rounded-full flex items-center justify-center font-semibold"
        >
          {avatar}
        </div>
        {convo.online && (
          <span
            style={{ background: COLORS.green, borderColor: "white" }}
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            aria-label={t(lang, "Yupo mtandaoni", "Online")}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            style={{ color: "var(--text-primary)" }}
            className="text-sm font-semibold truncate"
          >
            {name}
          </p>
          <span
            style={{ color: "var(--text-muted)" }}
            className="text-[10px] shrink-0"
          >
            {convo.lastAt ? timeAgo(convo.lastAt, lang) : ""}
          </span>
        </div>
        <p className="text-xs text-secondary truncate mt-0.5">
          {convo.listingTitle}
        </p>
        <p
          style={{
            color: unread ? "var(--text-primary)" : "var(--text-muted)",
          }}
          className={`text-xs truncate mt-0.5 ${unread ? "font-medium" : ""}`}
        >
          {lastMessage}
        </p>
      </div>
      {unread > 0 && (
        <span
          style={{ background: COLORS.rust, color: "white" }}
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 self-center"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}

// ── Chat view ────────────────────────────────────────────
function ChatView({ convo, currentUserId, onBack, onSend, lang, loading }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { name, avatar } = getCounterparty(convo, currentUserId);
  const scrollRef = useRef(null);
  const endRef = useRef(null);

  const grouped = useMemo(
    () => groupMessages(convo.messages || [], lang),
    [convo.messages, lang]
  );

  // Auto-scroll on new message
  useEffect(() => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [grouped.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    const res = await onSend(convo.id, trimmed);
    setSending(false);

    if (res?.ok) {
      setText("");
    } else {
      alert(
        res?.error?.message ||
          t(lang, "Imeshindwa kutuma ujumbe. Jaribu tena.", "Failed to send message. Try again.")
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="flex items-center gap-3 border-b px-3 sm:px-4 py-3 shrink-0"
      >
        <button
          onClick={onBack}
          className="md:hidden shrink-0 -ml-1 p-1 rounded-lg hover:bg-gray-100"
          aria-label={t(lang, "Rudi", "Back")}
        >
          <ArrowLeft size={18} color={COLORS.night} />
        </button>
        <div className="relative flex-shrink-0">
          <div
            style={{ background: COLORS.night, color: "#FFFFFF" }}
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
          >
            {avatar}
          </div>
          {convo.online && (
            <span
              style={{ background: COLORS.green, borderColor: "white" }}
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            style={{ color: "var(--text-primary)" }}
            className="text-sm font-semibold truncate"
          >
            {name}
          </p>
          <p
            style={{
              color: convo.online ? COLORS.green : "var(--text-muted)",
            }}
            className="text-[11px] truncate"
          >
            {convo.listingTitle}
            {convo.online ? ` · ${t(lang, "mtandaoni", "online")}` : ""}
          </p>
        </div>
        <button
          className="p-2 text-muted hover:text-secondary rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          aria-label={t(lang, "Piga simu", "Call")}
        >
          <Phone size={18} />
        </button>
        <button
          className="p-2 text-muted hover:text-secondary rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          aria-label={t(lang, "Zaidi", "More")}
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{ background: COLORS.sand }}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4"
      >
        {loading && grouped.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin" color={COLORS.gold} />
              <p
                style={{ color: "var(--text-muted)" }}
                className="text-sm"
              >
                {t(lang, "Inapakia ujumbe...", "Loading messages...")}
              </p>
            </div>
          </div>
        ) : grouped.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p
              style={{ color: "var(--text-muted)" }}
              className="text-sm text-center max-w-xs"
            >
              {t(
                lang,
                "Hakuna ujumbe bado. Anza mazungumzo hapa chini.",
                "No messages yet. Start the conversation below."
              )}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-w-3xl mx-auto">
            {grouped.map((item) => {
              if (item.type === "day") {
                return (
                  <div key={item.key} className="flex justify-center my-3">
                    <span
                      style={{
                        background: "rgba(16,26,46,0.06)",
                        color: "var(--text-secondary)",
                      }}
                      className="text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide"
                    >
                      {item.label}
                    </span>
                  </div>
                );
              }
              const m = item.msg;
              const isMe = String(m.senderId) === String(currentUserId);
              const isPending = m.pending;
              return (
                <div
                  key={item.key}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    style={{
                      background: isMe ? COLORS.night : "white",
                      // ⬇️ SASISHO: white kabisa kwa text ya message yako
                      color: isMe ? "#FFFFFF" : "var(--text-primary)",
                      // ⬇️ SASISHO: gold border kwa message yako
                      borderColor: isMe
                        ? `${COLORS.gold}55`
                        : COLORS.sandLine,
                      opacity: isPending ? 0.6 : 1,
                    }}
                    className="border rounded-2xl px-3.5 py-2 max-w-[78%] sm:max-w-[70%]"
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-snug">
                      {m.text}
                    </p>
                    <div
                      className="flex items-center gap-1 justify-end mt-1"
                      style={{
                        // ⬇️ SASISHO: white 65% kwa timestamp
                        color: isMe
                          ? "rgba(255,255,255,0.65)"
                          : "var(--text-muted)",
                      }}
                    >
                      <span className="text-[10px]">
                        {isPending
                          ? t(lang, "Inatuma...", "Sending...")
                          : new Date(m.at).toLocaleTimeString(
                              lang === "sw" ? "sw-TZ" : "en-US",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                      </span>
                      {isMe && !isPending &&
                        (m.read ? <CheckCheck size={12} /> : <Check size={12} />)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="flex items-center gap-2 p-2.5 sm:p-3 border-t shrink-0"
      >
        <input
          style={{
            background: COLORS.sand,
            borderColor: COLORS.sandLine,
            color: "var(--text-primary)",
          }}
          className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none"
          placeholder={t(lang, "Andika ujumbe...", "Type a message...")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
          disabled={sending}
          aria-label={t(lang, "Andika ujumbe", "Type a message")}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            background: text.trim() && !sending ? COLORS.gold : COLORS.sandLine,
            // ⬇️ SASISHO: night kwa text ili iwe clear kwenye gold
            color: text.trim() && !sending ? COLORS.night : "var(--text-muted)",
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:cursor-not-allowed"
          aria-label={t(lang, "Tuma", "Send")}
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

// ── Empty chat pane ─────────────────────────────────────
function EmptyChat({ lang }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="text-center">
        <MessageSquare size={56} className="text-muted mx-auto mb-3" />
        <p
          style={{ color: "var(--text-primary)" }}
          className="text-sm font-semibold"
        >
          {t(lang, "Chagua mazungumzo", "Select a conversation")}
        </p>
        <p
          style={{ color: "var(--text-muted)" }}
          className="text-xs mt-1 max-w-xs mx-auto"
        >
          {t(
            lang,
            "Chagua mazungumzo kwenye orodha kuanza kuwasiliana.",
            "Pick a conversation from the list to start chatting."
          )}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function MessagesPage({ initialConversationId = null }) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const currentUserId = user?.id || null;

  const { conversations = [], isLoading = false, error = null } =
    useConversations(currentUserId) || {};

  const [selectedId, setSelectedId] = useState(initialConversationId || null);
  const [mobileShowChat, setMobileShowChat] = useState(!!initialConversationId);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!selectedId && conversations.length > 0 && !mobileShowChat) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId, mobileShowChat]);

  useEffect(() => {
    if (initialConversationId) {
      setSelectedId(initialConversationId);
      setMobileShowChat(true);
    }
  }, [initialConversationId]);

  // ⬇️ Fetch detail + mark read kila selectedId inabadilika
  useEffect(() => {
    if (!selectedId || !currentUserId) return;

    setLoadingDetail(true);

    // 1. Fetch conversation detail (messages kamili)
    fetchConversationDetailAsync(selectedId, currentUserId)
      .then((res) => {
        if (!res.ok) {
          console.warn("[MessagesPage] fetchDetail failed:", res.error);
        }
      })
      .finally(() => {
        setLoadingDetail(false);
      });

    // 2. Mark as read
    markConversationReadAsync(selectedId).then((res) => {
      if (!res.ok) console.warn("[MessagesPage] markRead failed:", res.error);
    });
  }, [selectedId, currentUserId]);

  const selectedConvo = conversations.find((c) => c.id === selectedId);
  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0
  );

  const filteredConvos = conversations.filter((c) => {
    const { name } = getCounterparty(c, currentUserId);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelect = (id) => {
    setSelectedId(id);
    setMobileShowChat(true);
  };

  const handleSend = async (id, text) => {
    if (!currentUserId) return { ok: false, error: new Error("No user") };
    return sendMessageAsync(id, text, currentUserId);
  };

  return (
    <div
      className="w-full flex flex-col"
      style={{
        background: COLORS.sand,
        height: "min(760px, calc(100vh - 120px))",
        minHeight: 520,
      }}
    >
      {/* ── Header bar ───────────────────────────────────── */}
      <div
        style={{ background: "white", borderColor: COLORS.sandLine }}
        className="border-b px-3 sm:px-5 py-3 flex items-center gap-3 shrink-0"
      >
        <h1
          style={{ color: "var(--text-primary)" }}
          className="text-base sm:text-lg font-semibold shrink-0"
        >
          {t(lang, "Ujumbe", "Messages")}
        </h1>
        {totalUnread > 0 && (
          <span
            style={{ background: COLORS.rust, color: "white" }}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
          >
            {totalUnread}
          </span>
        )}
        <div className="relative flex-1 max-w-md ml-auto">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(lang, "Tafuta...", "Search...")}
            style={{
              background: COLORS.sand,
              borderColor: COLORS.sandLine,
              color: "var(--text-primary)",
            }}
            className="w-full rounded-lg border pl-10 pr-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      {/* ── Two-pane body ────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* List pane — full width on mobile until a chat is open */}
        <div
          style={{ borderColor: COLORS.sandLine }}
          className={`${
            mobileShowChat ? "hidden" : "flex"
          } md:flex flex-col w-full md:w-72 lg:w-80 shrink-0 border-r`}
        >
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={28} className="animate-spin mb-3" color={COLORS.gold} />
                <p
                  style={{ color: "var(--text-secondary)" }}
                  className="text-sm"
                >
                  {t(lang, "Inapakia mazungumzo...", "Loading conversations...")}
                </p>
              </div>
            )}

            {!isLoading && error && (
              <div
                style={{
                  borderColor: COLORS.rust,
                  background: "rgba(193,80,46,0.06)",
                }}
                className="rounded-xl border p-4 flex flex-col items-center text-center gap-2 m-2"
              >
                <AlertCircle size={18} color={COLORS.rust} />
                <p
                  style={{ color: COLORS.rust }}
                  className="text-sm font-semibold"
                >
                  {t(lang, "Hitilafu", "Error")}
                </p>
                <p
                  style={{ color: "var(--text-secondary)" }}
                  className="text-xs"
                >
                  {typeof error === "string"
                    ? error
                    : t(
                        lang,
                        "Imeshindwa kupakia mazungumzo.",
                        "Failed to load conversations."
                      )}
                </p>
              </div>
            )}

            {!isLoading && !error && filteredConvos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare size={40} className="text-muted mb-2" />
                <p
                  style={{ color: "var(--text-secondary)" }}
                  className="text-sm"
                >
                  {searchQuery
                    ? t(lang, "Hakuna matokeo", "No results")
                    : t(lang, "Hakuna mazungumzo", "No conversations")}
                </p>
              </div>
            )}

            {!isLoading &&
              !error &&
              filteredConvos.map((c) => (
                <ConversationListItem
                  key={c.id}
                  convo={c}
                  currentUserId={currentUserId}
                  active={c.id === selectedId}
                  onSelect={handleSelect}
                  lang={lang}
                />
              ))}
          </div>
        </div>

        {/* Chat pane — desktop always visible; mobile overlay */}
        <div
          className={`hidden md:flex flex-1 min-w-0 flex-col`}
        >
          {selectedConvo ? (
            <ChatView
              convo={selectedConvo}
              currentUserId={currentUserId}
              onBack={() => setMobileShowChat(false)}
              onSend={handleSend}
              lang={lang}
              loading={loadingDetail}
            />
          ) : (
            <EmptyChat lang={lang} />
          )}
        </div>
      </div>

      {/* Mobile overlay: full-screen chat when a conversation is open */}
      {mobileShowChat && selectedConvo && (
        <div
          className="md:hidden fixed inset-0 z-[9999] flex flex-col"
          style={{ background: "white" }}
        >
          <ChatView
            convo={selectedConvo}
            currentUserId={currentUserId}
            onBack={() => setMobileShowChat(false)}
            onSend={handleSend}
            lang={lang}
            loading={loadingDetail}
          />
        </div>
      )}
    </div>
  );
}
// ============================================================
// MessagesPage.jsx
// Mazungumzo ya wanunuzi na wauzaji.
// Bilingual kamili + KILA KITU CENTERED (header, search).
// ============================================================

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Send,
  ArrowLeft,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { COLORS, timeAgo } from "./dashboard/components/shared";
import {
  useConversations,
  // ⬇️ MABADILIKO: Tumia async variants
  // sendMessage,           ❌ ONDOA
  // markConversationRead,  ❌ ONDOA
  sendMessageAsync,
  markConversationReadAsync,
} from "../config/messagesStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";

// ⬇️ MABADILIKO: Tumia authStore
// import { useAuth } from "../context/AuthContext.jsx";  ❌ ONDOA
import { useAuth } from "../config/authStore.js";

// ============================================================
// HELPER — tafsiri fupi
// ============================================================
function t(lang, sw, en) {
  return lang === "sw" ? sw : en;
}

// ============================================================
// HELPER — pata jina la mwenzake na avatar kutoka convo
// ============================================================
function getCounterparty(convo, currentUserId) {
  if (!convo?.participants || !currentUserId) {
    return { name: convo?.name || "—", avatar: convo?.avatar || "?" };
  }
  const other = convo.participants.find((p) => p.id !== currentUserId);
  if (!other) {
    return { name: convo.name || "—", avatar: convo.avatar || "?" };
  }
  return {
    name: other.name || other.username || "—",
    avatar: other.avatar || (other.name ? other.name[0].toUpperCase() : "?"),
  };
}

// ============================================================
// ConversationListItem — kadi imeachwa kushoto (data nyingi)
// ============================================================
function ConversationListItem({
  convo,
  currentUserId,
  active,
  onSelect,
  lang,
}) {
  const { name, avatar } = getCounterparty(convo, currentUserId);
  const lastMessage = convo.lastMessage || "";
  const unread = convo.unreadCount || 0;

  return (
    <button
      onClick={() => onSelect(convo.id)}
      style={{
        background: active ? "white" : "transparent",
        borderColor: COLORS.sandLine,
      }}
      className="w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors"
    >
      <div className="relative flex-shrink-0">
        <div
          style={{ background: COLORS.night, color: COLORS.sand }}
          className="w-11 h-11 rounded-full flex items-center justify-center font-semibold"
        >
          {avatar}
        </div>
        {convo.online && (
          <span
            style={{ background: COLORS.green, borderColor: COLORS.sand }}
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
        <p
          style={{
            color: unread ? "var(--text-primary)" : "var(--text-secondary)",
          }}
          className={`text-xs truncate ${unread ? "font-medium" : ""}`}
        >
          {lastMessage}
        </p>
      </div>
      {unread > 0 && (
        <span
          style={{ background: COLORS.rust, color: "white" }}
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 self-center"
        >
          {unread}
        </span>
      )}
    </button>
  );
}

// ============================================================
// ChatView — messages bubbles zimeachwa (kushoto/kulia)
// ============================================================
function ChatView({ convo, currentUserId, onBack, onSend, lang }) {
  const [text, setText] = useState("");
  // ⬇️ MPYA: Sending state kuzuia double-send
  const [sending, setSending] = useState(false);
  const { name, avatar } = getCounterparty(convo, currentUserId);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    // ⬇️ MABADILIKO: onSend inarudisha { ok, error }
    const res = await onSend(convo.id, trimmed);
    setSending(false);

    if (res?.ok) {
      setText(""); // Safisha tu kama imefanikiwa
    } else {
      // TODO: badilisha na toast/notify yako
      console.warn("[ChatView] send failed:", res?.error);
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
        className="flex items-center gap-3 border-b p-3 sm:p-4"
      >
        <button
          onClick={onBack}
          className="md:hidden shrink-0"
          aria-label={t(lang, "Rudi", "Back")}
        >
          <ArrowLeft size={18} color={COLORS.night} />
        </button>
        <div className="relative flex-shrink-0">
          <div
            style={{ background: COLORS.night, color: COLORS.sand }}
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
            className="text-xs"
          >
            {convo.online
              ? t(lang, "Yupo mtandaoni", "Online")
              : t(lang, "Hayupo mtandaoni", "Offline")}
          </p>
        </div>
        <button
          className="p-2 text-muted hover:text-secondary rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={t(lang, "Piga simu", "Call")}
        >
          <Phone size={18} />
        </button>
        <button
          className="p-2 text-muted hover:text-secondary rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={t(lang, "Zaidi", "More")}
        >
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{ background: COLORS.sand }}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5"
      >
        {(convo.messages || []).length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p
              style={{ color: "var(--text-muted)" }}
              className="text-sm text-center"
            >
              {t(
                lang,
                "Hakuna ujumbe bado. Anza mazungumzo.",
                "No messages yet. Start the conversation."
              )}
            </p>
          </div>
        ) : (
          convo.messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            // ⬇️ MPYA: onyesha pending state kwa messages zinazosafiri
            const isPending = m.pending;
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  style={{
                    background: isMe ? COLORS.night : "white",
                    color: isMe ? COLORS.sand : "var(--text-primary)",
                    borderColor: COLORS.sandLine,
                    opacity: isPending ? 0.6 : 1,
                  }}
                  className="border rounded-2xl px-4 py-2.5 max-w-[75%]"
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {m.text}
                  </p>
                  <div
                    className="flex items-center gap-1 justify-end mt-1"
                    style={{
                      color: isMe
                        ? "rgba(245,243,236,0.6)"
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
          })
        )}
      </div>

      {/* Composer */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="flex items-center gap-2 p-3 border-t"
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
            color: text.trim() && !sending ? "var(--text-primary)" : "var(--text-muted)",
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

// ============================================================
// MessagesPage — MAIN
// ============================================================
export default function MessagesPage({ initialConversationId = null }) {
  const { lang } = useLanguage();
  // ⬇️ MABADILIKO: useAuth kutoka authStore
  const { user } = useAuth();
  const currentUserId = user?.id || null;

  // ⬇️ BUG FIX: Pitisha currentUserId kama argument!
  const {
    conversations = [],
    isLoading = false,
    error = null,
  } = useConversations(currentUserId) || {};

  const [selectedId, setSelectedId] = useState(
    initialConversationId || null
  );
  const [mobileShowChat, setMobileShowChat] = useState(
    !!initialConversationId
  );
  const [searchQuery, setSearchQuery] = useState("");

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

  // ⬇️ MABADILIKO: markConversationReadAsync
  useEffect(() => {
    if (selectedId) {
      markConversationReadAsync(selectedId).then((res) => {
        if (!res.ok) {
          console.warn("[MessagesPage] markRead failed:", res.error);
        }
      });
    }
  }, [selectedId]);

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

  // ⬇️ MABADILIKO: async handler inarudisha { ok, error }
  const handleSend = async (id, text) => {
    if (!currentUserId) return { ok: false, error: new Error("No user") };
    return sendMessageAsync(id, text, currentUserId);
  };

  return (
    <div
      style={{ background: COLORS.sand, height: "100%" }}
      className="w-full flex flex-col"
    >

      {/* ============================================================ */}
      {/* HEADER — CENTERED */}
      {/* ============================================================ */}
      <div className="p-4 sm:p-6 pb-2 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <h1
            style={{ color: "var(--text-primary)" }}
            className="text-2xl sm:text-3xl font-semibold"
          >
            {t(lang, "Ujumbe", "Messages")}
          </h1>
          {totalUnread > 0 && (
            <span
              style={{ background: COLORS.rust, color: "white" }}
              className="text-xs font-bold px-2.5 py-1 rounded-full"
            >
              {totalUnread}
            </span>
          )}
        </div>
        <p
          style={{ color: "var(--text-secondary)" }}
          className="text-sm mb-4 max-w-xl mx-auto"
        >
          {t(
            lang,
            "Mazungumzo yako na wanunuzi na wauzaji.",
            "Your conversations with buyers and sellers."
          )}
        </p>

        {/* Search — centered */}
        <div className="relative max-w-md mx-auto">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              lang,
              "Tafuta mazungumzo...",
              "Search conversations..."
            )}
            style={{
              background: "white",
              borderColor: COLORS.sandLine,
              color: "var(--text-primary)",
            }}
            className="w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0" style={{ height: "520px" }}>
        {/* List pane */}
        <div
          style={{ borderColor: COLORS.sandLine }}
          className={`${
            mobileShowChat ? "hidden" : "flex"
          } md:flex flex-col w-full md:w-80 shrink-0 border-r px-3 sm:px-4 pb-4 gap-2 overflow-y-auto`}
        >
          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2
                size={28}
                className="animate-spin mb-3"
                color={COLORS.gold}
              />
              <p style={{ color: "var(--text-secondary)" }} className="text-sm">
                {t(lang, "Inapakia mazungumzo...", "Loading conversations...")}
              </p>
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div
              style={{
                borderColor: COLORS.rust,
                background: "rgba(193,80,46,0.06)",
              }}
              className="rounded-2xl border p-4 flex flex-col items-center text-center gap-2"
            >
              <AlertCircle size={18} color={COLORS.rust} />
              <div>
                <p
                  style={{ color: COLORS.rust }}
                  className="text-sm font-semibold"
                >
                  {t(lang, "Hitilafu", "Error")}
                </p>
                <p
                  style={{ color: "var(--text-secondary)" }}
                  className="text-xs mt-0.5"
                >
                  {typeof error === "string"
                    ? error
                    : t(
                        lang,
                        "Imeshindwa kupakia mazungumzo. Jaribu tena.",
                        "Failed to load conversations. Try again."
                      )}
                </p>
              </div>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && filteredConvos.length === 0 && (
            <div
              style={{ borderColor: COLORS.sandLine }}
              className="rounded-2xl border-2 border-dashed p-8 text-center"
            >
              <MessageSquare size={40} className="mx-auto text-muted mb-2" />
              <p style={{ color: "var(--text-secondary)" }} className="text-sm">
                {searchQuery
                  ? t(lang, "Hakuna matokeo", "No results")
                  : t(lang, "Hakuna mazungumzo", "No conversations")}
              </p>
            </div>
          )}

          {/* List */}
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

        {/* Chat pane */}
        <div
          className={`${
            mobileShowChat ? "flex" : "hidden"
          } md:flex flex-1 min-w-0 flex-col`}
        >
          {selectedConvo ? (
            <ChatView
              convo={selectedConvo}
              currentUserId={currentUserId}
              onBack={() => setMobileShowChat(false)}
              onSend={handleSend}
              lang={lang}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={56} className="text-muted mx-auto mb-3" />
                <p
                  style={{ color: "var(--text-muted)" }}
                  className="text-sm"
                >
                  {t(
                    lang,
                    "Chagua mazungumzo kuanza.",
                    "Select a conversation to start."
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

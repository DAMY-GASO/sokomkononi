import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Send,
  ArrowLeft,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
} from "lucide-react";
import { COLORS, FONTS, formatTZS, timeAgo } from "./dashboard/components/shared";
import { useConversations, sendMessage, markConversationRead } from "../config/messagesStore.js";

function ConversationListItem({ convo, active, onSelect }) {
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
          {convo.avatar}
        </div>
        {convo.online && (
          <span
            style={{ background: COLORS.green, borderColor: COLORS.sand }}
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p style={{ color: COLORS.night }} className="text-sm font-semibold truncate">
            {convo.name}
          </p>
          <span style={{ color: "rgba(16,26,46,0.4)" }} className="text-[10px] shrink-0">
            {timeAgo(convo.lastAt)}
          </span>
        </div>
        <p
          style={{ color: convo.unread ? COLORS.night : "rgba(16,26,46,0.55)" }}
          className={`text-xs truncate ${convo.unread ? "font-medium" : ""}`}
        >
          {convo.lastMessage}
        </p>
      </div>
      {convo.unread > 0 && (
        <span
          style={{ background: COLORS.rust, color: "white" }}
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 self-center"
        >
          {convo.unread}
        </span>
      )}
    </button>
  );
}

function ChatView({ convo, onBack, onSend }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(convo.id, text.trim());
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="flex items-center gap-3 border-b p-3 sm:p-4"
      >
        <button onClick={onBack} className="md:hidden shrink-0" aria-label="Rudi">
          <ArrowLeft size={18} color={COLORS.night} />
        </button>
        <div className="relative flex-shrink-0">
          <div
            style={{ background: COLORS.night, color: COLORS.sand }}
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
          >
            {convo.avatar}
          </div>
          {convo.online && (
            <span
              style={{ background: COLORS.green, borderColor: "white" }}
              className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: COLORS.night }} className="text-sm font-semibold truncate">
            {convo.name}
          </p>
          <p style={{ color: convo.online ? COLORS.green : "rgba(16,26,46,0.5)" }} className="text-xs">
            {convo.online ? "Yupo mtandaoni" : "Hayupo mtandaoni"}
          </p>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <Phone size={18} />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{ background: COLORS.sand }}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5"
      >
        {convo.messages.map((m) => {
          const isMe = m.sender === "me";
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                style={{
                  background: isMe ? COLORS.night : "white",
                  color: isMe ? COLORS.sand : COLORS.night,
                  borderColor: COLORS.sandLine,
                }}
                className="border rounded-2xl px-4 py-2.5 max-w-[75%]"
              >
                <p className="text-sm">{m.text}</p>
                <div
                  className="flex items-center gap-1 justify-end mt-1"
                  style={{ color: isMe ? "rgba(245,243,236,0.6)" : "rgba(16,26,46,0.4)" }}
                >
                  <span className="text-[10px]">
                    {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isMe && (m.read ? <CheckCheck size={12} /> : <Check size={12} />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="flex items-center gap-2 p-3 border-t"
      >
        <input
          style={{ background: COLORS.sand, borderColor: COLORS.sandLine, color: COLORS.night }}
          className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none"
          placeholder="Andika ujumbe..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            background: text.trim() ? COLORS.gold : COLORS.sandLine,
            color: text.trim() ? COLORS.night : "rgba(16,26,46,0.4)",
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          aria-label="Tuma"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

export default function MessagesPage({ initialConversationId = null }) {
  const convos = useConversations();
  const [selectedId, setSelectedId] = useState(initialConversationId || convos[0]?.id || null);
  const [mobileShowChat, setMobileShowChat] = useState(!!initialConversationId);
  const [searchQuery, setSearchQuery] = useState("");

  // Notification ikielekeza kwenye mazungumzo maalum (?c=<id>), fungua
  // moja kwa moja hata kama page ilikuwa tayari imefunguliwa awali.
  useEffect(() => {
    if (initialConversationId) {
      setSelectedId(initialConversationId);
      setMobileShowChat(true);
    }
  }, [initialConversationId]);

  const selectedConvo = convos.find((c) => c.id === selectedId);
  const totalUnread = convos.reduce((sum, c) => sum + c.unread, 0);

  const filteredConvos = convos.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id) => {
    setSelectedId(id);
    setMobileShowChat(true);
    markConversationRead(id);
  };

  const handleSend = (id, text) => {
    sendMessage(id, text, "me");
  };

  return (
    <div style={{ background: COLORS.sand, fontFamily: FONTS.body, height: "100%" }} className="w-full flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="p-4 sm:p-6 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <h1 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl sm:text-3xl font-semibold">
            Ujumbe
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
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-4">
          Mazungumzo yako na wanunuzi na wauzaji.
        </p>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tafuta mazungumzo..."
            style={{ background: "white", borderColor: COLORS.sandLine, color: COLORS.night }}
            className="w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0" style={{ height: "520px" }}>
        {/* List pane */}
        <div
          style={{ borderColor: COLORS.sandLine }}
          className={`${mobileShowChat ? "hidden" : "flex"} md:flex flex-col w-full md:w-80 shrink-0 border-r px-3 sm:px-4 pb-4 gap-2 overflow-y-auto`}
        >
          {filteredConvos.length === 0 ? (
            <div
              style={{ borderColor: COLORS.sandLine }}
              className="rounded-2xl border-2 border-dashed p-8 text-center"
            >
              <MessageSquare size={40} className="mx-auto text-gray-300 mb-2" />
              <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-sm">
                Hakuna mazungumzo
              </p>
            </div>
          ) : (
            filteredConvos.map((c) => (
              <ConversationListItem
                key={c.id}
                convo={c}
                active={c.id === selectedId}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>

        {/* Chat pane */}
        <div className={`${mobileShowChat ? "flex" : "hidden"} md:flex flex-1 min-w-0 flex-col`}>
          {selectedConvo ? (
            <ChatView
              convo={selectedConvo}
              onBack={() => setMobileShowChat(false)}
              onSend={handleSend}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={56} className="text-gray-300 mx-auto mb-3" />
                <p style={{ color: "rgba(16,26,46,0.45)" }} className="text-sm">
                  Chagua mazungumzo kuanza.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

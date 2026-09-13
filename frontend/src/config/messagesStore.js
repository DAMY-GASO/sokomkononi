// ============================================================
// messagesStore.js
// CHANZO KIMOJA CHA UKWELI kwa mazungumzo/ujumbe (Messages).
//
// MABADILIKO MAKUU:
//   - SEED_CONVERSATIONS imeondolewa — hakuna data ya kubuni.
//   - sender: "me" | "them" -> senderId (halisi kutoka auth).
//   - name/avatar za convo zimeondolewa — sasa zinachukuliwa
//     kutoka participants[] (kila convo ina washiriki).
//   - simulateIncomingMessage imeondolewa — badala yake kuna
//     receiveMessage() inayotarajiwa kuitwa na websocket/polling.
//   - useConversations() inarudisha { conversations, isLoading, error }.
//
// BACKEND HALISI IKIWEPO:
//   Badilisha readFromStorage/saveAll ziite API (fetch/axios), na
//   incoming messages zije kupitia websocket (receiveMessage) badala
//   ya localStorage. UI ya MessagesPage.jsx haitagusa.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { notifyNewMessage } from "./notificationsStore.js";

const STORAGE_KEY = "sokomkononi_messages_v2";
const UPDATE_EVENT = "sokomkononi:messages-updated";

// ============================================================
// STORAGE LAYER
// ============================================================
// Badilisha hizi kuwa fetch()/axios ukiwa na backend.
// ============================================================

function readFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Soma conversations za sasa (snapshot moja, si reactive). */
export function getConversations() {
  return readFromStorage();
}

// ============================================================
// HOOK — useConversations
// ============================================================
/**
 * Hook ya React — hutumika kwenye MessagesPage.jsx.
 *
 * Inarudisha: { conversations, isLoading, error }
 *
 * Inajisasisha yenyewe papo hapo popote sendMessage()/
 * markConversationRead()/receiveMessage() zinapoitwa, hivyo bell ya
 * DashboardShell na badge ya "Ujumbe" hazihitaji reload.
 */
export function useConversations() {
  const [state, setState] = useState({
    conversations: [],
    isLoading: true,
    error: null,
  });

  const sync = useCallback(() => {
    try {
      const conversations = readFromStorage();
      setState({ conversations, isLoading: false, error: null });
    } catch (err) {
      setState({
        conversations: [],
        isLoading: false,
        error: err?.message || "Failed to load conversations",
      });
    }
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, [sync]);

  return state;
}

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Tuma ujumbe kwenye mazungumzo.
 *
 * @param {string} conversationId
 * @param {string} text
 * @param {string} senderId — ID ya mtumiaji anayetuma (kutoka AuthContext)
 *
 * Kama senderId si currentUserId, basi ni "them" — hii huzalisha
 * notification. Backend halisi: hii inaitwa na websocket/receiveMessage.
 */
export function sendMessage(conversationId, text, senderId) {
  const trimmed = (text || "").trim();
  if (!trimmed) return getConversations();

  const current = getConversations();
  const convo = current.find((c) => c.id === conversationId);
  if (!convo) return current;

  const at = new Date().toISOString();
  const newMessage = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    senderId,
    text: trimmed,
    at,
    read: false,
  };

  // Tambua kama ni "me" au "them" kwa kulinganisha na currentUserId.
  // currentUserId inapaswa kuwekwa kwenye convo wakati wa kuisoma
  // (mfano convo.currentUserId), au tunapitisha kama param ya nne.
  const isMine = senderId === convo.currentUserId;

  const next = current.map((c) =>
    c.id === conversationId
      ? {
          ...c,
          lastMessage: trimmed,
          lastAt: at,
          unreadCount: isMine ? c.unreadCount || 0 : (c.unreadCount || 0) + 1,
          messages: [...(c.messages || []), newMessage],
        }
      : c
  );
  saveAll(next);

  if (!isMine) {
    // Mwenzake ametuma — zalisha notification.
    const sender = (convo.participants || []).find((p) => p.id === senderId);
    notifyNewMessage({
      conversationId,
      senderName: sender?.name || "Mtumiaji",
      preview: trimmed,
    });
  }

  return next;
}

/**
 * Pokea ujumbe kutoka kwa mwenzake (backend halisi: websocket/polling).
 *
 * Tofauti na sendMessage, hii HAIHITAJI currentUserId — inachukua
 * moja kwa moja kutoka convo. Backend ikiwepo, hii inaitwa na
 * websocket listener.
 */
export function receiveMessage(conversationId, senderId, text) {
  const current = getConversations();
  const convo = current.find((c) => c.id === conversationId);
  if (!convo) return current;

  const at = new Date().toISOString();
  const newMessage = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    senderId,
    text: (text || "").trim(),
    at,
    read: false,
  };

  if (!newMessage.text) return current;

  const next = current.map((c) =>
    c.id === conversationId
      ? {
          ...c,
          lastMessage: newMessage.text,
          lastAt: at,
          unreadCount: (c.unreadCount || 0) + 1,
          messages: [...(c.messages || []), newMessage],
        }
      : c
  );
  saveAll(next);

  const sender = (convo.participants || []).find((p) => p.id === senderId);
  notifyNewMessage({
    conversationId,
    senderName: sender?.name || "Mtumiaji",
    preview: newMessage.text,
  });

  return next;
}

/** Weka mazungumzo fulani kama yamesomwa (unreadCount -> 0). */
export function markConversationRead(conversationId) {
  const next = getConversations().map((c) =>
    c.id === conversationId
      ? {
          ...c,
          unreadCount: 0,
          messages: (c.messages || []).map((m) => ({ ...m, read: true })),
        }
      : c
  );
  saveAll(next);
  return next;
}

// ============================================================
// BACKEND INTEGRATION — mifano ya kuunganisha na API halisi
// ============================================================
// Hizi ni stubs — zitumike badala ya readFromStorage/saveAll
// ukiwa na backend.
// ============================================================

/**
 * Mfano: pakia conversations kutoka API.
 *
 * export async function fetchConversations() {
 *   const res = await fetch("/api/conversations", {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 *   if (!res.ok) throw new Error("Failed to fetch conversations");
 *   return res.json();
 * }
 */

/**
 * Mfano: tuma ujumbe kwa API.
 *
 * export async function postMessage(conversationId, text) {
 *   const res = await fetch(`/api/conversations/${conversationId}/messages`, {
 *     method: "POST",
 *     headers: {
 *       "Content-Type": "application/json",
 *       Authorization: `Bearer ${token}`,
 *     },
 *     body: JSON.stringify({ text }),
 *   });
 *   if (!res.ok) throw new Error("Failed to send message");
 *   return res.json();
 * }
 */

/**
 * Mfano: websocket listener kwa incoming messages.
 *
 * export function subscribeToMessages(conversationId, onMessage) {
 *   const ws = new WebSocket(`wss://api.sokomkononi.com/ws`);
 *   ws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", conversationId }));
 *   ws.onmessage = (event) => {
 *     const data = JSON.parse(event.data);
 *     if (data.type === "message") {
 *       receiveMessage(conversationId, data.senderId, data.text);
 *       onMessage?.(data);
 *     }
 *   };
 *   return () => ws.close();
 * }
 */

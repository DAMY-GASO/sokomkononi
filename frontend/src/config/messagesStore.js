// ============================================================
// messagesStore.js — API-backed via /api/messaging/
// ============================================================
import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_messages_v2";
const UPDATE_EVENT = "sokomkononi:messages-updated";

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

function normalizeConversation(raw, currentUserId) {
  if (!raw) return null;
  const listing = raw.listing || {};
  const buyer = raw.buyer || {};
  const seller = raw.seller || {};
  const other = raw.other_party || (buyer.id === currentUserId ? seller : buyer);
  return {
    id: raw.id,
    listingId: listing.id,
    listingTitle: listing.title || "",
    currentUserId,
    counterpartyName: other?.name || "",
    participants: [
      { id: buyer.id, name: buyer.name },
      { id: seller.id, name: seller.name },
    ],
    lastMessage: raw.last_message || "",
    lastAt: raw.last_message_at || raw.updated_at,
    unreadCount: raw.unread_count || 0,
    messages: (raw.messages || []).map((m) => ({
      id: m.id,
      senderId: m.sender?.id ?? m.sender,
      text: m.text,
      at: m.created_at,
      read: !!m.is_read,
    })),
  };
}

export function getConversations() {
  return readFromStorage();
}

export async function hydrateConversationsFromApi(currentUserId) {
  try {
    const data = await api.get("/messaging/conversations/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list
      .map((c) => normalizeConversation(c, currentUserId))
      .filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[messagesStore] hydrate failed:", err);
    return { source: "error", count: getConversations().length };
  }
}

export function useConversations(currentUserId) {
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
    hydrateConversationsFromApi(currentUserId).then(sync);
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, [sync, currentUserId]);

  return state;
}

export function sendMessage(conversationId, text, senderId) {
  const trimmed = (text || "").trim();
  if (!trimmed) return getConversations();

  const current = getConversations();
  const convo = current.find((c) => c.id === conversationId);
  if (!convo) return current;

  const at = new Date().toISOString();
  const newMessage = {
    id: `m_${Date.now()}`,
    senderId,
    text: trimmed,
    at,
    read: false,
  };

  const next = current.map((c) =>
    c.id === conversationId
      ? {
          ...c,
          lastMessage: trimmed,
          lastAt: at,
          messages: [...(c.messages || []), newMessage],
        }
      : c
  );
  saveAll(next);

  if (typeof conversationId === "number") {
    api.post(`/messaging/conversations/${conversationId}/messages/`, {
      text: trimmed,
    }).catch(() => {});
  }

  return next;
}

export function receiveMessage(conversationId, senderId, text) {
  const current = getConversations();
  const convo = current.find((c) => c.id === conversationId);
  if (!convo) return current;
  const at = new Date().toISOString();
  const newMessage = {
    id: `m_${Date.now()}`,
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
  return next;
}

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
  if (typeof conversationId === "number") {
    api.post(`/messaging/conversations/${conversationId}/read/`, {}).catch(() => {});
  }
  return next;
}

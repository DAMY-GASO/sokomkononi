// ============================================================
// messagesStore.js — API-backed via /api/messaging/
// ============================================================
import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_messages_v2";
const UPDATE_EVENT = "sokomkononi:messages-updated";

// ============================================================
// STORAGE
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

// ============================================================
// NORMALIZER
// ============================================================
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

// ============================================================
// READS
// ============================================================
export function getConversations() {
  return readFromStorage();
}

export function getConversation(id) {
  return readFromStorage().find((c) => c.id === id) || null;
}

// ============================================================
// HYDRATE
// ============================================================
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

// ============================================================
// ASYNC ACTIONS — with rollback
// ============================================================
export async function sendMessageAsync(conversationId, text, senderId) {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return { ok: false, error: new Error("Ujumbe hauwezi kuwa tupu") };
  }

  const previous = getConversations();
  const convo = previous.find((c) => c.id === conversationId);
  if (!convo) return { ok: false, error: new Error("Mazungumzo hayapo") };

  const at = new Date().toISOString();
  const tempId = `m_${Date.now()}`;
  const newMessage = {
    id: tempId,
    senderId,
    text: trimmed,
    at,
    read: false,
    pending: true,
  };

  // Optimistic — ongeza ujumbe na pending flag
  saveAll(
    previous.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            lastMessage: trimmed,
            lastAt: at,
            messages: [...(c.messages || []), newMessage],
          }
        : c
    )
  );

  // Local-only conversation (haijasync bado)
  if (typeof conversationId !== "number") {
    const current = getConversations();
    saveAll(
      current.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: (c.messages || []).map((m) =>
                m.id === tempId ? { ...m, pending: false } : m
              ),
            }
          : c
      )
    );
    return { ok: true, localOnly: true };
  }

  try {
    const raw = await api.post(
      `/messaging/conversations/${conversationId}/messages/`,
      { text: trimmed }
    );

    // Badilisha temp na real message
    const current = getConversations();
    const realMessage = {
      id: raw?.id ?? tempId,
      senderId: raw?.sender?.id ?? senderId,
      text: raw?.text ?? trimmed,
      at: raw?.created_at ?? at,
      read: !!raw?.is_read,
    };
    saveAll(
      current.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: (c.messages || []).map((m) =>
                m.id === tempId ? realMessage : m
              ),
            }
          : c
      )
    );

    return { ok: true, message: realMessage };
  } catch (err) {
    saveAll(previous); // Rollback
    console.warn("[messagesStore] sendMessage failed:", err);
    return { ok: false, error: err };
  }
}

export async function markConversationReadAsync(conversationId) {
  const previous = getConversations();
  const convo = previous.find((c) => c.id === conversationId);
  if (!convo) return { ok: false, error: new Error("Mazungumzo hayapo") };

  // Optimistic
  saveAll(
    previous.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            unreadCount: 0,
            messages: (c.messages || []).map((m) => ({ ...m, read: true })),
          }
        : c
    )
  );

  if (typeof conversationId !== "number") return { ok: true };

  try {
    await api.post(`/messaging/conversations/${conversationId}/read/`, {});
    return { ok: true };
  } catch (err) {
    saveAll(previous); // Rollback
    console.warn("[messagesStore] markRead failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// RECEIVE (local only — WebSocket/polling inaita hii)
// ============================================================
export function receiveMessage(conversationId, senderId, text) {
  const current = getConversations();
  const convo = current.find((c) => c.id === conversationId);
  if (!convo) return current;

  const at = new Date().toISOString();
  const trimmed = (text || "").trim();
  if (!trimmed) return current;

  const newMessage = {
    id: `m_${Date.now()}`,
    senderId,
    text: trimmed,
    at,
    read: false,
  };

  saveAll(
    current.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            lastMessage: trimmed,
            lastAt: at,
            unreadCount: (c.unreadCount || 0) + 1,
            messages: [...(c.messages || []), newMessage],
          }
        : c
    )
  );

  return getConversations();
}

// ============================================================
// LEGACY SYNC (deprecated — backward compat)
// ============================================================
/** @deprecated Use sendMessageAsync */
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
    api
      .post(`/messaging/conversations/${conversationId}/messages/`, {
        text: trimmed,
      })
      .catch((err) => console.warn("[messagesStore] send silent fail:", err));
  }

  return next;
}

/** @deprecated Use markConversationReadAsync */
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
    api
      .post(`/messaging/conversations/${conversationId}/read/`, {})
      .catch((err) => console.warn("[messagesStore] markRead silent fail:", err));
  }
  return next;
}

// ============================================================
// HOOK — inahitaji currentUserId kwa normalizer
// ============================================================
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
    if (currentUserId) {
      hydrateConversationsFromApi(currentUserId).then(sync);
    } else {
      // Hakuna user — maliza loading
      setState((s) => ({ ...s, isLoading: false }));
    }
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, [sync, currentUserId]);

  return state;
}

export function useUnreadMessagesCount() {
  const convos = getConversations();
  return convos.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
}

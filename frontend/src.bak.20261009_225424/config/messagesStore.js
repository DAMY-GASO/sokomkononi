// ============================================================
// messagesStore.js — API-only via /api/messaging/
// Stubs zimeondolewa. Tumia Async versions pekee.
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_messages_v2";
const EV = "sokomkononi:messages-updated";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}
function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

function sameId(a, b) {
  return String(a) === String(b);
}

function norm(raw, currentUserId) {
  if (!raw) return null;
  const listing = raw.listing || {};
  const buyer = raw.buyer || {};
  const seller = raw.seller || {};
  const isBuyer = sameId(buyer.id, currentUserId);
  const other = isBuyer ? seller : buyer;
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
  return read();
}
export function getConversation(id) {
  return read().find((c) => sameId(c.id, id)) || null;
}

export async function hydrateConversationsFromApi(currentUserId) {
  try {
    const data = await api.get("/messaging/conversations/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const previous = read();
    const normalized = list
      .map((c) => {
        const n = norm(c, currentUserId);
        if (!n) return null;
        // Orodha haina `messages` — usifute zilizokwisha kupakuliwa.
        if (!n.messages.length) {
          const old = previous.find((p) => sameId(p.id, n.id));
          if (old?.messages?.length) return { ...n, messages: old.messages };
        }
        return n;
      })
      .filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// currentUserId is REQUIRED so we can stamp senderId correctly even if the
// backend's response shape changes.
export async function sendMessageAsync(conversationId, text, currentUserId = null) {
  const trimmed = (text || "").trim();
  if (!trimmed) return { ok: false, error: new Error("Message empty") };
  try {
    const raw = await api.post(
      `/messaging/conversations/${conversationId}/messages/`,
      { text: trimmed }
    );
    const current = getConversations();
    const msg = {
      id: raw?.id ?? `m_${Date.now()}`,
      // Prefer backend sender id; fall back to currentUserId; final fallback
      // to "me" so the bubble still lands on the correct side.
      senderId: raw?.sender?.id ?? raw?.sender ?? currentUserId ?? "me",
      text: raw?.text ?? trimmed,
      at: raw?.created_at ?? new Date().toISOString(),
      read: !!raw?.is_read,
    };
    write(
      current.map((c) =>
        sameId(c.id, conversationId)
          ? {
              ...c,
              lastMessage: msg.text,
              lastAt: msg.at,
              messages: [...(c.messages || []), msg],
            }
          : c
      )
    );
    return { ok: true, message: msg };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function markConversationReadAsync(conversationId) {
  try {
    await api.post(`/messaging/conversations/${conversationId}/read/`, {});
    const current = getConversations();
    write(
      current.map((c) =>
        sameId(c.id, conversationId)
          ? {
              ...c,
              unreadCount: 0,
              messages: (c.messages || []).map((m) => ({ ...m, read: true })),
            }
          : c
      )
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export function useConversations(currentUserId) {
  const [state, setState] = useState({
    conversations: [],
    isLoading: true,
    error: null,
  });
  useEffect(() => {
    let cancelled = false;
    if (!currentUserId) {
      setState({ conversations: [], isLoading: false, error: null });
      return;
    }
    (async () => {
      const res = await hydrateConversationsFromApi(currentUserId);
      if (cancelled) return;
      if (res.ok) {
        setState({ conversations: getConversations(), isLoading: false, error: null });
      } else {
        setState({
          conversations: [],
          isLoading: false,
          error: res.error?.message || "Failed to load",
        });
      }
    })();
    const sync = () => setState((s) => ({ ...s, conversations: getConversations() }));
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, [currentUserId]);
  return state;
}

// Reactive unread count.
export function useUnreadMessagesCount() {
  const [count, setCount] = useState(() =>
    read().reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  );
  useEffect(() => {
    const sync = () =>
      setCount(read().reduce((sum, c) => sum + (c.unreadCount || 0), 0));
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return count;
}

// ============================================================
// STUBS ZILIZOONDOLEWA
// Kama component yoyote inaita hizi, itapata ReferenceError.
// Badilisha kwenda Async versions.
// ============================================================
// export function sendMessage() { ... }              → sendMessageAsync()
// export function markConversationRead() { ... }     → markConversationReadAsync()
// export function receiveMessage() { ... }           → (WebSocket inahitajika)

export async function createConversationAsync({ listingId, initialMessage = "" }) {
  if (!listingId) return { ok: false, error: new Error("listingId is required") };
  try {
    const raw = await api.post("/messaging/conversations/", {
      listing: listingId,
      initial_message: initialMessage,
    });
    const data = Array.isArray(raw) ? raw[0] : raw;
    return { ok: true, conversation: data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// FETCH CONVERSATION DETAIL — inarudisha messages kamili
// ============================================================
export async function fetchConversationDetailAsync(conversationId, currentUserId) {
  if (!conversationId) {
    return { ok: false, error: new Error("conversationId is required") };
  }
  try {
    const raw = await api.get(`/messaging/conversations/${conversationId}/`);
    
    const normalized = norm(raw, currentUserId);
    if (normalized) {
      const current = getConversations();
      const exists = current.some((c) => sameId(c.id, conversationId));
      if (exists) {
        write(current.map((c) => (sameId(c.id, conversationId) ? normalized : c)));
      } else {
        write([normalized, ...current]);
      }
    }
    return { ok: true, conversation: normalized };
  } catch (err) {
    console.warn("[messagesStore] fetchConversationDetail failed:", err);
    return { ok: false, error: err };
  }
}
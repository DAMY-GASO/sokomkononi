// ============================================================
// messagesStore.js — API-only via /api/messaging/
// No localStorage source of truth. Cache is refreshed on mount.
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
  } catch { return []; }
}
function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

function norm(raw, currentUserId) {
  if (!raw) return null;
  const listing = raw.listing || {};
  const buyer = raw.buyer || {};
  const seller = raw.seller || {};
  const isBuyer = buyer.id === currentUserId;
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

export function getConversations() { return read(); }
export function getConversation(id) { return read().find((c) => c.id === id) || null; }

export async function hydrateConversationsFromApi(currentUserId) {
  try {
    const data = await api.get("/messaging/conversations/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map((c) => norm(c, currentUserId)).filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function sendMessageAsync(conversationId, text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return { ok: false, error: new Error("Message empty") };
  try {
    const raw = await api.post(`/messaging/conversations/${conversationId}/messages/`, { text: trimmed });
    // Refresh the whole list to stay consistent
    const { hydrateConversationsFromApi } = await import("./messagesStore.js");
    // no-op dynamic import — refresh via getter
    const current = getConversations();
    const msg = {
      id: raw?.id ?? `m_${Date.now()}`,
      senderId: raw?.sender?.id ?? raw?.sender,
      text: raw?.text ?? trimmed,
      at: raw?.created_at ?? new Date().toISOString(),
      read: !!raw?.is_read,
    };
    write(current.map((c) =>
      c.id === conversationId
        ? { ...c, lastMessage: msg.text, lastAt: msg.at, messages: [...(c.messages || []), msg] }
        : c
    ));
    return { ok: true, message: msg };
  } catch (err) { return { ok: false, error: err }; }
}

export async function markConversationReadAsync(conversationId) {
  try {
    await api.post(`/messaging/conversations/${conversationId}/read/`, {});
    const current = getConversations();
    write(current.map((c) =>
      c.id === conversationId
        ? { ...c, unreadCount: 0, messages: (c.messages || []).map((m) => ({ ...m, read: true })) }
        : c
    ));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function useConversations(currentUserId) {
  const [state, setState] = useState({ conversations: [], isLoading: true, error: null });
  useEffect(() => {
    let cancelled = false;
    if (!currentUserId) {
      setState({ conversations: [], isLoading: false, error: null });
      return;
    }
    (async () => {
      const res = await hydrateConversationsFromApi(currentUserId);
      if (cancelled) return;
      if (res.ok) setState({ conversations: getConversations(), isLoading: false, error: null });
      else setState({ conversations: [], isLoading: false, error: res.error?.message || "Failed to load" });
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

export function useUnreadMessagesCount() {
  return read().reduce((sum, c) => sum + (c.unreadCount || 0), 0);
}

// LEGACY (compat shims)
export function sendMessage() { return []; }
export function markConversationRead() { return []; }
export function receiveMessage() { return []; }

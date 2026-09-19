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

  // Optimistic
  saveAll(previous.map((c) =>
    c.id === conversationId
      ? {
          ...c,
          lastMessage: trimmed,
          lastAt: at,
          messages: [...(c.messages || []), newMessage],
        }
      : c
  ));

  // Local-only conversation (bado haijasync)
  if (typeof conversationId !== "number") {
    // Ondoa pending flag
    const current = getConversations();
    saveAll(current.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            messages: (c.messages || []).map((m) =>
              m.id === tempId ? { ...m, pending: false } : m
            ),
          }
        : c
    ));
    return { ok: true, localOnly: true };
  }

  try {
    const raw = await api.post(
      `/messaging/conversations/${conversationId}/messages/`,
      { text: trimmed }
    );

    // Badilisha temp na message halisi
    const current = getConversations();
    const realMessage = {
      id: raw?.id ?? tempId,
      senderId: raw?.sender?.id ?? senderId,
      text: raw?.text ?? trimmed,
      at: raw?.created_at ?? at,
      read: !!raw?.is_read,
    };
    saveAll(current.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            messages: (c.messages || []).map((m) =>
              m.id === tempId ? realMessage : m
            ),
          }
        : c
    ));

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
  saveAll(previous.map((c) =>
    c.id === conversationId
      ? {
          ...c,
          unreadCount: 0,
          messages: (c.messages || []).map((m) => ({ ...m, read: true })),
        }
      : c
  ));

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

// ---------- RECEIVE (local only — WebSocket/polling inaita hii) ----------
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

  saveAll(current.map((c) =>
    c.id === conversationId
      ? {
          ...c,
          lastMessage: trimmed,
          lastAt: at,
          unreadCount: (c.unreadCount || 0) + 1,
          messages: [...(c.messages || []), newMessage],
        }
      : c
  ));

  return getConversations();
}

// ---------- LEGACY (deprecated) ----------
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
    api.post(`/messaging/conversations/${conversationId}/messages/`, {
      text: trimmed,
    }).catch((err) => console.warn("[messagesStore] send silent fail:", err));
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
    api.post(`/messaging/conversations/${conversationId}/read/`, {})
      .catch((err) => console.warn("[messagesStore] markRead silent fail:", err));
  }
  return next;
}

// ============================================================
// HOOK — imeboreshwa
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

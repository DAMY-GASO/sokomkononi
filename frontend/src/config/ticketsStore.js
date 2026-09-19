// ============================================================
// ASYNC ACTIONS (preferred — with rollback)
// ============================================================

export async function addTicketAsync({
  subject, description = "", userId, userName, userEmail,
  category = "other", priority = "medium", attachments = [],
}) {
  const payload = {
    subject,
    description,
    category: KEY_TO_API[category] || "OTHER",
    priority: PRIORITY_TO_API[priority] || "MEDIUM",
  };

  const entry = {
    id: `local_${Date.now()}`,
    code: `TKT-${Date.now().toString().slice(-6)}`,
    subject, description, userId, userName, userEmail,
    category, priority, status: "open", attachments,
    messages: [{
      id: `msg_${Date.now()}`, from: "user",
      senderName: userName, text: description,
      at: new Date().toISOString(),
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const previous = getTickets();
  saveAll([entry, ...previous]);

  try {
    const raw = await api.post("/tickets/", payload);
    const created = normalizeFromApi(raw);
    if (created) {
      saveAll([created, ...getTickets().filter((t) => t.id !== entry.id)]);
      return { ok: true, ticket: created };
    }
    return { ok: true, ticket: entry };
  } catch (err) {
    saveAll(previous); // Rollback
    console.warn("[ticketsStore] addTicket failed:", err);
    return { ok: false, error: err };
  }
}

export async function addTicketMessageAsync(id, { from = "admin", senderName = "Admin", text }) {
  const previous = getTickets();
  const next = previous.map((t) =>
    t.id === id
      ? {
          ...t,
          messages: [...t.messages, {
            id: `msg_${Date.now()}`, from, senderName, text,
            at: new Date().toISOString(),
          }],
          updatedAt: new Date().toISOString(),
        }
      : t
  );
  saveAll(next);

  if (typeof id !== "number") return { ok: true };

  try {
    await api.post(`/tickets/${id}/messages/`, { text });
    return { ok: true };
  } catch (err) {
    saveAll(previous);
    console.warn("[ticketsStore] addMessage failed:", err);
    return { ok: false, error: err };
  }
}

export async function updateTicketStatusAsync(id, status) {
  const previous = getTickets();
  const next = previous.map((t) =>
    t.id === id
      ? {
          ...t, status, updatedAt: new Date().toISOString(),
          resolvedAt: status === "resolved" ? new Date().toISOString() : t.resolvedAt,
        }
      : t
  );
  saveAll(next);

  if (typeof id !== "number") return { ok: true };

  try {
    await api.post(`/tickets/${id}/status/`, { status: STATUS_TO_API[status] || "OPEN" });
    return { ok: true };
  } catch (err) {
    saveAll(previous);
    console.warn("[ticketsStore] updateStatus failed:", err);
    return { ok: false, error: err };
  }
}

export async function updateTicketPriorityAsync(id, priority) {
  const previous = getTickets();
  saveAll(previous.map((t) => (t.id === id ? { ...t, priority } : t)));

  if (typeof id !== "number") return { ok: true };

  try {
    await api.post(`/tickets/${id}/priority/`, { priority: PRIORITY_TO_API[priority] || "MEDIUM" });
    return { ok: true };
  } catch (err) {
    saveAll(previous);
    console.warn("[ticketsStore] updatePriority failed:", err);
    return { ok: false, error: err };
  }
}

export async function assignTicketAsync(id, staffName, staffId) {
  const previous = getTickets();
  saveAll(previous.map((t) => (t.id === id ? { ...t, assignedToName: staffName } : t)));

  if (typeof id !== "number" || !staffId) return { ok: true };

  try {
    await api.post(`/tickets/${id}/assign/`, { staff_id: staffId });
    return { ok: true };
  } catch (err) {
    saveAll(previous);
    console.warn("[ticketsStore] assign failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeTicketAsync(id) {
  const previous = getTickets();
  saveAll(previous.filter((t) => t.id !== id));

  if (typeof id !== "number") return { ok: true };

  try {
    await api.delete(`/tickets/${id}/`);
    return { ok: true };
  } catch (err) {
    saveAll(previous);
    console.warn("[ticketsStore] remove failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// LEGACY SYNC (deprecated)
// ============================================================
/** @deprecated Use addTicketAsync */
export function addTicket(payload) {
  // ...code ya zamani, lakini badilisha `.catch(() => {})` kuwa:
  api.post("/tickets/", payload)
    .then((raw) => {
      const created = normalizeFromApi(raw);
      saveAll([created, ...getTickets().filter((t) => t.id !== entry.id)]);
    })
    .catch((err) => console.warn("[ticketsStore] addTicket silent fail:", err));
  return entry;
}

/** @deprecated Use addTicketMessageAsync */
export function addTicketMessage(id, payload) {
  // ...bila kubadilika, lakini badilisha `.catch`:
  if (typeof id === "number") {
    api.post(`/tickets/${id}/messages/`, { text: payload.text })
      .catch((err) => console.warn("[ticketsStore] addMessage silent fail:", err));
  }
  return next;
}

/** @deprecated Use updateTicketStatusAsync */
export function updateTicketStatus(id, status) {
  // ...bila kubadilika
  if (typeof id === "number") {
    api.post(`/tickets/${id}/status/`, { status: STATUS_TO_API[status] || "OPEN" })
      .catch((err) => console.warn("[ticketsStore] updateStatus silent fail:", err));
  }
  return next;
}

/** @deprecated Use updateTicketPriorityAsync */
export function updateTicketPriority(id, priority) {
  // ...
  if (typeof id === "number") {
    api.post(`/tickets/${id}/priority/`, { priority: PRIORITY_TO_API[priority] || "MEDIUM" })
      .catch((err) => console.warn("[ticketsStore] updatePriority silent fail:", err));
  }
  return next;
}

/** @deprecated Use assignTicketAsync */
export function assignTicket(id, staffName, staffId) {
  // ...
  if (typeof id === "number" && staffId) {
    api.post(`/tickets/${id}/assign/`, { staff_id: staffId })
      .catch((err) => console.warn("[ticketsStore] assign silent fail:", err));
  }
  return next;
}

/** @deprecated Use removeTicketAsync */
export function removeTicket(id) {
  // ...
  if (typeof id === "number") {
    api.delete(`/tickets/${id}/`)
      .catch((err) => console.warn("[ticketsStore] remove silent fail:", err));
  }
  return next;
}

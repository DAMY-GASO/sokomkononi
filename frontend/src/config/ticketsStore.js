// ============================================================
// ticketsStore.js — API-backed via /api/tickets/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_tickets_v1";
const UPDATE_EVENT = "sokomkononi:tickets-updated";

export const TICKET_CATEGORIES = [
  { key: "payment", label: { sw: "Malipo", en: "Payment" }, color: "gold" },
  { key: "verification", label: { sw: "Uthibitisho", en: "Verification" }, color: "blue" },
  { key: "dispute", label: { sw: "Mgogoro", en: "Dispute" }, color: "rust" },
  { key: "listing", label: { sw: "Tangazo", en: "Listing" }, color: "green" },
  { key: "account", label: { sw: "Akaunti", en: "Account" }, color: "night" },
  { key: "other", label: { sw: "Nyingine", en: "Other" }, color: "night" },
];

export const TICKET_PRIORITIES = [
  { key: "low", label: { sw: "Chini", en: "Low" }, color: "gray" },
  { key: "medium", label: { sw: "Kati", en: "Medium" }, color: "gold" },
  { key: "high", label: { sw: "Juu", en: "High" }, color: "rust" },
  { key: "urgent", label: { sw: "Haraka", en: "Urgent" }, color: "rust" },
];

export const TICKET_STATUSES = [
  { key: "open", label: { sw: "Wazi", en: "Open" }, color: "rust" },
  { key: "in_progress", label: { sw: "Inaendelea", en: "In Progress" }, color: "gold" },
  { key: "resolved", label: { sw: "Imetatuliwa", en: "Resolved" }, color: "green" },
  { key: "closed", label: { sw: "Imefungwa", en: "Closed" }, color: "gray" },
];

const API_TO_KEY = {
  PAYMENT: "payment", VERIFICATION: "verification",
  DISPUTE: "dispute", LISTING: "listing", ACCOUNT: "account", OTHER: "other",
};
const KEY_TO_API = {
  payment: "PAYMENT", verification: "VERIFICATION",
  dispute: "DISPUTE", listing: "LISTING", account: "ACCOUNT", other: "OTHER",
};
const PRIORITY_FROM_API = { LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent" };
const PRIORITY_TO_API = { low: "LOW", medium: "MEDIUM", high: "HIGH", urgent: "URGENT" };
const STATUS_FROM_API = {
  OPEN: "open", IN_PROGRESS: "in_progress", RESOLVED: "resolved", CLOSED: "closed",
};
const STATUS_TO_API = {
  open: "OPEN", in_progress: "IN_PROGRESS", resolved: "RESOLVED", closed: "CLOSED",
};

export const SEED_TICKETS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_TICKETS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_TICKETS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_TICKETS;
  } catch {
    return SEED_TICKETS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function normalizeFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    code: raw.code,
    subject: raw.subject,
    description: raw.description,
    userId: raw.user,
    userName: raw.user_name,
    userEmail: raw.user_email,
    category: API_TO_KEY[raw.category] || raw.category,
    priority: PRIORITY_FROM_API[raw.priority] || raw.priority,
    status: STATUS_FROM_API[raw.status] || raw.status,
    assignedTo: raw.assigned_to,
    assignedToName: raw.assigned_to_name,
    messages: (raw.messages || []).map((m) => ({
      id: m.id,
      from: (m.sender || "USER").toLowerCase(),
      senderName: m.sender_name,
      text: m.text,
      at: m.created_at,
    })),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    resolvedAt: raw.resolved_at,
  };
}

export function getTickets() {
  return readFromStorage();
}

export function getTicket(id) {
  return getTickets().find((t) => t.id === id) || null;
}

export async function hydrateTicketsFromApi() {
  try {
    const data = await api.get("/tickets/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeFromApi).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[ticketsStore] hydrate failed:", err);
    return { source: "error", count: getTickets().length };
  }
}

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
    saveAll(previous);
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
export function addTicket({
  subject, description = "", userId, userName, userEmail,
  category = "other", priority = "medium", attachments = [],
}) {
  const payload = {
    subject, description,
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
  saveAll([entry, ...getTickets()]);

  api.post("/tickets/", payload)
    .then((raw) => {
      const created = normalizeFromApi(raw);
      if (created) saveAll([created, ...getTickets().filter((t) => t.id !== entry.id)]);
    })
    .catch((err) => console.warn("[ticketsStore] addTicket silent fail:", err));
  return entry;
}

/** @deprecated Use addTicketMessageAsync */
export function addTicketMessage(id, { from = "admin", senderName = "Admin", text }) {
  const next = getTickets().map((t) =>
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
  if (typeof id === "number") {
    api.post(`/tickets/${id}/messages/`, { text })
      .catch((err) => console.warn("[ticketsStore] addMessage silent fail:", err));
  }
  return next;
}

/** @deprecated Use updateTicketStatusAsync */
export function updateTicketStatus(id, status) {
  const next = getTickets().map((t) =>
    t.id === id
      ? { ...t, status, updatedAt: new Date().toISOString(),
          resolvedAt: status === "resolved" ? new Date().toISOString() : t.resolvedAt }
      : t
  );
  saveAll(next);
  if (typeof id === "number") {
    api.post(`/tickets/${id}/status/`, { status: STATUS_TO_API[status] || "OPEN" })
      .catch((err) => console.warn("[ticketsStore] updateStatus silent fail:", err));
  }
  return next;
}

/** @deprecated Use updateTicketPriorityAsync */
export function updateTicketPriority(id, priority) {
  const next = getTickets().map((t) => (t.id === id ? { ...t, priority } : t));
  saveAll(next);
  if (typeof id === "number") {
    api.post(`/tickets/${id}/priority/`, { priority: PRIORITY_TO_API[priority] || "MEDIUM" })
      .catch((err) => console.warn("[ticketsStore] updatePriority silent fail:", err));
  }
  return next;
}

/** @deprecated Use assignTicketAsync */
export function assignTicket(id, staffName, staffId) {
  const next = getTickets().map((t) => (t.id === id ? { ...t, assignedToName: staffName } : t));
  saveAll(next);
  if (typeof id === "number" && staffId) {
    api.post(`/tickets/${id}/assign/`, { staff_id: staffId })
      .catch((err) => console.warn("[ticketsStore] assign silent fail:", err));
  }
  return next;
}

/** @deprecated Use removeTicketAsync */
export function removeTicket(id) {
  const next = getTickets().filter((t) => t.id !== id);
  saveAll(next);
  if (typeof id === "number") {
    api.delete(`/tickets/${id}/`)
      .catch((err) => console.warn("[ticketsStore] remove silent fail:", err));
  }
  return next;
}

// ============================================================
// HOOKS
// ============================================================
export function useTickets() {
  const [tickets, setTickets] = useState(() => getTickets());
  useEffect(() => {
    hydrateTicketsFromApi();
    const sync = () => setTickets(getTickets());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return tickets;
}

export function useTicketsByStatus(status) {
  const tickets = useTickets();
  if (!status || status === "all") return tickets;
  return tickets.filter((t) => t.status === status);
}

export function useOpenTicketsCount() {
  return useTickets().filter((t) => t.status === "open" || t.status === "in_progress").length;
}

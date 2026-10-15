// ============================================================
// ticketsStore.js — API-only via /api/tickets/
// + Attachments support
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_tickets_v1";
const EV = "sokomkononi:tickets-updated";

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

const CAT_API_TO_KEY = { PAYMENT: "payment", VERIFICATION: "verification", DISPUTE: "dispute", LISTING: "listing", ACCOUNT: "account", OTHER: "other" };
const PRI_FROM = { LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent" };
const PRI_TO = { low: "LOW", medium: "MEDIUM", high: "HIGH", urgent: "URGENT" };
const ST_FROM = { OPEN: "open", IN_PROGRESS: "in_progress", RESOLVED: "resolved", COMPLETED: "closed", CLOSED: "closed" };
const ST_TO = { open: "OPEN", in_progress: "IN_PROGRESS", resolved: "RESOLVED", closed: "COMPLETED" };

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

function normAttachment(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || "attachment",
    url: raw.url,
    isImage: !!raw.is_image,
    uploadedByName: raw.uploaded_by_name || "",
    createdAt: raw.created_at,
  };
}

function norm(raw) {
  if (!raw) return null;
  const normMsg = (m) => ({
    id: m.id,
    from: (m.sender || "USER").toLowerCase(),
    senderName: m.sender_name,
    text: m.text,
    attachments: (m.attachments || []).map(normAttachment).filter(Boolean),
    at: m.created_at,
  });
  return {
    id: raw.id,
    code: raw.code,
    subject: raw.subject,
    description: raw.description,
    userId: raw.user,
    userName: raw.user_name,
    userEmail: raw.user_email,
    category: CAT_API_TO_KEY[raw.category] || "other",
    priority: PRI_FROM[raw.priority] || raw.priority,
    status: ST_FROM[raw.status] || raw.status,
    assignedTo: raw.assigned_to,
    assignedToName: raw.assigned_to_name,
    messages: (raw.messages || []).map(normMsg),
    attachments: (raw.attachments || []).map(normAttachment).filter(Boolean),
    slaDeadline: raw.sla_deadline,
    slaRemindedAt: raw.sla_reminded_at,
    slaOverdue: !!raw.sla_overdue,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    resolvedAt: raw.resolved_at,
  };
}

export function getTickets() { return read(); }
export function getTicket(id) { return read().find((t) => t.id === id) || null; }

export async function hydrateTicketsFromApi() {
  try {
    const d = await api.get("/tickets/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    write(list.map(norm).filter(Boolean));
    return { ok: true, count: list.length };
  } catch (err) { return { ok: false, error: err }; }
}

// ============================================================
// ADD MESSAGE (+ files, kama zipo)
// ============================================================
export async function addTicketMessageAsync(id, { text, files } = {}) {
  const cleanText = (text || "").trim();
  const fileList = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!cleanText && fileList.length === 0) {
    return { ok: false, error: new Error("text au files inahitajika") };
  }
  try {
    let raw;
    if (fileList.length > 0) {
      const fd = new FormData();
      fd.append("text", cleanText);
      for (const f of fileList) fd.append("attachments", f);
      raw = await api.upload(`/tickets/${id}/messages/`, fd);
    } else {
      raw = await api.post(`/tickets/${id}/messages/`, { text: cleanText });
    }
    const msg = raw && raw.id ? norm({
      id: raw.id,
      sender: raw.sender,
      sender_name: raw.sender_name,
      text: raw.text,
      attachments: raw.attachments,
      created_at: raw.created_at,
    })?.messages?.[0] : null;

    const finalMsg = msg || {
      id: `msg_${Date.now()}`,
      from: "user",
      senderName: "You",
      text: cleanText || "[attachment]",
      attachments: fileList.map((f, i) => ({
        id: `att_${Date.now()}_${i}`,
        name: f.name,
        url: URL.createObjectURL(f),
        isImage: f.type?.startsWith("image/"),
        uploadedByName: "You",
        createdAt: new Date().toISOString(),
      })),
      at: new Date().toISOString(),
    };

    const current = getTickets();
    write(current.map((t) =>
      t.id === id
        ? { ...t, messages: [...t.messages, finalMsg], updatedAt: new Date().toISOString() }
        : t
    ));
    return { ok: true, message: finalMsg };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function uploadTicketAttachmentsAsync(id, files) {
  const fileList = Array.isArray(files) ? files.filter(Boolean) : [];
  if (fileList.length === 0) {
    return { ok: false, error: new Error("files required") };
  }
  try {
    const fd = new FormData();
    for (const f of fileList) fd.append("attachments", f);
    const raw = await api.upload(`/tickets/${id}/attachments/`, fd);
    // Refresh kwa sababu attachments zina IDs za backend
    await hydrateTicketsFromApi();
    return { ok: true, count: raw?.count || fileList.length };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function updateTicketStatusAsync(id, status) {
  try {
    const raw = await api.post(`/tickets/${id}/status/`, { status: ST_TO[status] || "OPEN" });
    const updated = norm(raw);
    if (updated) write(getTickets().map((t) => (t.id === id ? updated : t)));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateTicketPriorityAsync(id, priority) {
  try {
    const raw = await api.post(`/tickets/${id}/priority/`, { priority: PRI_TO[priority] || "MEDIUM" });
    const updated = norm(raw);
    if (updated) write(getTickets().map((t) => (t.id === id ? updated : t)));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function assignTicketAsync(id, staffId) {
  if (!staffId) return { ok: false, error: new Error("staffId required") };
  try {
    const raw = await api.post(`/tickets/${id}/assign/`, { staff_id: staffId });
    const updated = norm(raw);
    if (updated) write(getTickets().map((t) => (t.id === id ? updated : t)));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeTicketAsync(id) {
  try {
    await api.delete(`/tickets/${id}/`);
    write(getTickets().filter((t) => t.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

let _ticketsHydratePromise = null;
function _dedupedTicketsHydrate() {
  if (_ticketsHydratePromise) return _ticketsHydratePromise;
  _ticketsHydratePromise = hydrateTicketsFromApi().finally(() => {
    _ticketsHydratePromise = null;
  });
  return _ticketsHydratePromise;
}

export function useTickets() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    _dedupedTicketsHydrate();
    const sync = () => setList(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return list;
}
export function useOpenTicketsCount() {
  return useTickets().filter((t) => t.status === "open" || t.status === "in_progress").length;
}
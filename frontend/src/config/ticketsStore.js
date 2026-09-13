// ============================================================
// ticketsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Support Tickets (Customer Care).
//
// Tickets zinatoka kwa:
//   - Buyer (matatizo ya ununuzi, refunds, n.k.)
//   - Seller (matatizo ya listings, payments, n.k.)
//   - Admin (anaunda ticket kwa niaba ya user)
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useTickets) hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_tickets_v1";
const UPDATE_EVENT = "sokomkononi:tickets-updated";

// ============================================================
// CATEGORIES
// ============================================================
export const TICKET_CATEGORIES = [
  { key: "payment", label: { sw: "Malipo", en: "Payment" }, color: "gold" },
  { key: "verification", label: { sw: "Uthibitisho", en: "Verification" }, color: "blue" },
  { key: "dispute", label: { sw: "Mgogoro", en: "Dispute" }, color: "rust" },
  { key: "listing", label: { sw: "Tangazo", en: "Listing" }, color: "green" },
  { key: "account", label: { sw: "Akaunti", en: "Account" }, color: "night" },
  { key: "other", label: { sw: "Nyingine", en: "Other" }, color: "night" },
];

// ============================================================
// PRIORITIES
// ============================================================
export const TICKET_PRIORITIES = [
  { key: "low", label: { sw: "Chini", en: "Low" }, color: "gray" },
  { key: "medium", label: { sw: "Kati", en: "Medium" }, color: "gold" },
  { key: "high", label: { sw: "Juu", en: "High" }, color: "rust" },
  { key: "urgent", label: { sw: "Haraka", en: "Urgent" }, color: "rust" },
];

// ============================================================
// STATUSES
// ============================================================
export const TICKET_STATUSES = [
  { key: "open", label: { sw: "Wazi", en: "Open" }, color: "rust" },
  { key: "in_progress", label: { sw: "Inaendelea", en: "In Progress" }, color: "gold" },
  { key: "resolved", label: { sw: "Imetatuliwa", en: "Resolved" }, color: "green" },
  { key: "closed", label: { sw: "Imefungwa", en: "Closed" }, color: "gray" },
];

// ============================================================
// SEED — tupu
// ============================================================
export const SEED_TICKETS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_TICKETS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_TICKETS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_TICKETS;
    return parsed;
  } catch {
    return SEED_TICKETS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// HELPERS
// ============================================================

/** Soma tickets zote. */
export function getTickets() {
  return readFromStorage();
}

/** Pata ticket moja kwa id. */
export function getTicket(id) {
  return getTickets().find((t) => t.id === id) || null;
}

/** Unda ticket mpya. */
export function addTicket({
  subject,
  description = "",
  userId,
  userName,
  userEmail,
  category = "other",
  priority = "medium",
  attachments = [],
}) {
  const entry = {
    id: `TKT-${Date.now().toString().slice(-6)}`,
    subject,
    description,
    userId,
    userName,
    userEmail,
    category,
    priority,
    status: "open",
    attachments,
    assignedTo: null,
    messages: [
      {
        id: `msg_${Date.now()}`,
        from: "user",
        senderName: userName,
        text: description,
        at: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
  };
  const next = [entry, ...getTickets()];
  saveAll(next);
  return entry;
}

/** Ongeza ujumbe kwenye ticket (admin reply au user reply). */
export function addTicketMessage(id, { from = "admin", senderName = "Admin", text }) {
  const current = getTickets();
  const next = current.map((t) =>
    t.id === id
      ? {
          ...t,
          messages: [
            ...t.messages,
            {
              id: `msg_${Date.now()}`,
              from,
              senderName,
              text,
              at: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        }
      : t
  );
  saveAll(next);
  return next;
}

/** Badilisha status ya ticket. */
export function updateTicketStatus(id, status) {
  const current = getTickets();
  const next = current.map((t) =>
    t.id === id
      ? {
          ...t,
          status,
          updatedAt: new Date().toISOString(),
          resolvedAt: status === "resolved" ? new Date().toISOString() : t.resolvedAt,
        }
      : t
  );
  saveAll(next);
  return next;
}

/** Badilisha priority ya ticket. */
export function updateTicketPriority(id, priority) {
  const current = getTickets();
  const next = current.map((t) =>
    t.id === id ? { ...t, priority, updatedAt: new Date().toISOString() } : t
  );
  saveAll(next);
  return next;
}

/** Kaimu ticket kwa staff. */
export function assignTicket(id, staffName) {
  const current = getTickets();
  const next = current.map((t) =>
    t.id === id
      ? { ...t, assignedTo: staffName, updatedAt: new Date().toISOString() }
      : t
  );
  saveAll(next);
  return next;
}

/** Ondoa ticket. */
export function removeTicket(id) {
  const next = getTickets().filter((t) => t.id !== id);
  saveAll(next);
  return next;
}

// ============================================================
// HOOKS
// ============================================================

/** Hook: tickets zote. */
export function useTickets() {
  const [tickets, setTickets] = useState(() => getTickets());

  useEffect(() => {
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

/** Hook: tickets kwa status. */
export function useTicketsByStatus(status) {
  const tickets = useTickets();
  if (!status || status === "all") return tickets;
  return tickets.filter((t) => t.status === status);
}

/** Idadi ya tickets wazi (kwa badge). */
export function useOpenTicketsCount() {
  const tickets = useTickets();
  return tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
}

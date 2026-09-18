// ============================================================
// leadsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Leads (maulizio ya wanunuzi).
//
// Lead = buyer anaulizia listing ya seller. Inatoka kwenye:
//   - Messages (buyer anatuma ujumbe wa kwanza)
//   - Deal Rooms (buyer anaonyesha nia)
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useLeads) hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";
import { notifyNewLead } from "./notificationsStore.js";

const STORAGE_KEY = "sokomkononi_leads_v1";
const UPDATE_EVENT = "sokomkononi:leads-updated";

// ============================================================
// SEED_LEADS — tupu. Data itakuja kutoka backend baadaye.
// ============================================================
export const SEED_LEADS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_LEADS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LEADS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_LEADS;
    return parsed;
  } catch {
    return SEED_LEADS;
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

/** Soma leads zote za sasa (snapshot moja, si reactive). */
export function getLeads() {
  return readFromStorage();
}

/** Ongeza lead mpya (buyer anaulizia listing). */
export function addLead({ listingId, listingTitle, buyerName, message, source = "message" }) {
  const current = getLeads();

  // Kama lead ya buyer huyu kwa listing hii ipo tayari, sasisha tu
  const existing = current.find(
    (l) => l.listingId === listingId && l.buyerName === buyerName && l.status === "new"
  );

  if (existing) {
    const next = current.map((l) =>
      l.id === existing.id
        ? {
            ...l,
            message,
            lastMessageAt: new Date().toISOString(),
            messageCount: (l.messageCount || 1) + 1,
          }
        : l
    );
    saveAll(next);
    return next;
  }

  const lead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    listingId,
    listingTitle,
    buyerName,
    message,
    source,
    status: "new", // new | responded | converted | ignored
    createdAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
    messageCount: 1,
  };
  const next = [lead, ...current];
  saveAll(next);
  notifyNewLead({ listingId, listingTitle, buyerName });
  return next;
}

/** Weka lead kama "responded" (seller amejibu). */
export function markLeadResponded(id) {
  const next = getLeads().map((l) =>
    l.id === id ? { ...l, status: "responded", respondedAt: new Date().toISOString() } : l
  );
  saveAll(next);
  return next;
}

/** Weka lead kama "converted" (imgeuka deal). */
export function markLeadConverted(id) {
  const next = getLeads().map((l) =>
    l.id === id ? { ...l, status: "converted", convertedAt: new Date().toISOString() } : l
  );
  saveAll(next);
  return next;
}

/** Ondoa lead. */
export function removeLead(id) {
  const next = getLeads().filter((l) => l.id !== id);
  saveAll(next);
  return next;
}

// ============================================================
// HOOKS
// ============================================================

/** Hook: leads zote. */
export function useLeads() {
  const [leads, setLeads] = useState(() => getLeads());

  useEffect(() => {
    const sync = () => setLeads(getLeads());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return leads;
}

/** Hook: leads mpya tu (status = "new"). */
export function useNewLeads() {
  const leads = useLeads();
  return leads.filter((l) => l.status === "new");
}

/** Hook: leads kwa listing moja. */
export function useLeadsForListing(listingId) {
  const leads = useLeads();
  return leads.filter((l) => l.listingId === listingId);
}

/** Idadi ya leads mpya (kwa badge). */
export function useNewLeadsCount() {
  const leads = useLeads();
  return leads.filter((l) => l.status === "new").length;
}

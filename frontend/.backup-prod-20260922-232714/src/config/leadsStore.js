// ============================================================
// leadsStore.js — API-backed via /api/leads/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_leads_v1";
const UPDATE_EVENT = "sokomkononi:leads-updated";

export const SEED_LEADS = [];

// ---------- STORAGE ----------
function readFromStorage() {
  if (typeof window === "undefined") return SEED_LEADS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LEADS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_LEADS;
  } catch {
    return SEED_LEADS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ---------- NORMALIZER ----------
function normalizeFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    listingId: raw.listing?.id ?? null,
    listingTitle: raw.listing?.title || "",
    buyerName: raw.buyer_name || "",
    message: raw.message || "",
    source: (raw.source || "DEAL").toLowerCase(),
    status: (raw.status || "NEW").toLowerCase(),
    messageCount: raw.message_count || 1,
    dealRoomId: raw.deal_room,
    createdAt: raw.created_at,
    lastMessageAt: raw.updated_at,
    respondedAt: raw.responded_at,
    convertedAt: raw.converted_at,
  };
}

// ---------- READS ----------
export function getLeads() {
  return readFromStorage();
}

export function getLead(id) {
  return getLeads().find((l) => l.id === id) || null;
}

export function getLeadsForListing(listingId) {
  return getLeads().filter((l) => l.listingId === listingId);
}

// ---------- HYDRATE ----------
export async function hydrateLeadsFromApi() {
  try {
    const data = await api.get("/leads/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeFromApi).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[leadsStore] hydrate failed:", err);
    return { source: "error", count: getLeads().length };
  }
}

// ============================================================
// ASYNC ACTIONS (preferred)
// ============================================================
export async function markLeadRespondedAsync(id) {
  const previous = getLeads();
  const lead = previous.find((l) => l.id === id);
  if (!lead) return { ok: false, error: new Error("Lead not found") };

  // Optimistic
  saveAll(previous.map((l) =>
    l.id === id ? { ...l, status: "responded", respondedAt: new Date().toISOString() } : l
  ));

  if (typeof id !== "number") return { ok: true }; // local-only

  try {
    await api.post(`/leads/${id}/respond/`, {});
    return { ok: true };
  } catch (err) {
    saveAll(previous); // Rollback
    console.warn("[leadsStore] respond failed:", err);
    return { ok: false, error: err };
  }
}

export async function markLeadConvertedAsync(id) {
  const previous = getLeads();
  const lead = previous.find((l) => l.id === id);
  if (!lead) return { ok: false, error: new Error("Lead not found") };

  saveAll(previous.map((l) =>
    l.id === id ? { ...l, status: "converted", convertedAt: new Date().toISOString() } : l
  ));

  if (typeof id !== "number") return { ok: true };

  try {
    await api.post(`/leads/${id}/convert/`, {});
    return { ok: true };
  } catch (err) {
    saveAll(previous);
    console.warn("[leadsStore] convert failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeLeadAsync(id) {
  const previous = getLeads();
  saveAll(previous.filter((l) => l.id !== id));

  if (typeof id !== "number") return { ok: true };

  try {
    await api.delete(`/leads/${id}/`);
    return { ok: true };
  } catch (err) {
    saveAll(previous);
    console.warn("[leadsStore] remove failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// LEGACY SYNC (deprecated — kept for backward compat)
// ============================================================
/** @deprecated Use markLeadRespondedAsync */
export function markLeadResponded(id) {
  const next = getLeads().map((l) =>
    l.id === id ? { ...l, status: "responded", respondedAt: new Date().toISOString() } : l
  );
  saveAll(next);
  if (typeof id === "number") {
    api.post(`/leads/${id}/respond/`, {}).catch((err) => {
      console.warn("[leadsStore] respond failed (silent):", err);
    });
  }
  return next;
}

/** @deprecated Use markLeadConvertedAsync */
export function markLeadConverted(id) {
  const next = getLeads().map((l) =>
    l.id === id ? { ...l, status: "converted", convertedAt: new Date().toISOString() } : l
  );
  saveAll(next);
  if (typeof id === "number") {
    api.post(`/leads/${id}/convert/`, {}).catch((err) => {
      console.warn("[leadsStore] convert failed (silent):", err);
    });
  }
  return next;
}

/** @deprecated Use removeLeadAsync */
export function removeLead(id) {
  const next = getLeads().filter((l) => l.id !== id);
  saveAll(next);
  if (typeof id === "number") {
    api.delete(`/leads/${id}/`).catch((err) => {
      console.warn("[leadsStore] remove failed (silent):", err);
    });
  }
  return next;
}

export function addLead() {
  // No-op — backend creates leads automatically from buyer actions
}

// ============================================================
// HOOKS
// ============================================================
export function useLeads() {
  const [leads, setLeads] = useState(() => getLeads());
  useEffect(() => {
    hydrateLeadsFromApi();
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

export function useNewLeads() {
  return useLeads().filter((l) => l.status === "new");
}

export function useLeadsForListing(listingId) {
  const leads = useLeads();
  if (!listingId) return [];
  return leads.filter((l) => l.listingId === listingId);
}

export function useNewLeadsCount() {
  return useLeads().filter((l) => l.status === "new").length;
}

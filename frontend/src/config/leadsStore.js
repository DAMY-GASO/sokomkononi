// ============================================================
// leadsStore.js — API-backed via /api/leads/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_leads_v1";
const UPDATE_EVENT = "sokomkononi:leads-updated";

export const SEED_LEADS = [];

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

export function getLeads() {
  return readFromStorage();
}

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

export function addLead() {}

export function markLeadResponded(id) {
  const next = getLeads().map((l) =>
    l.id === id ? { ...l, status: "responded" } : l
  );
  saveAll(next);
  if (typeof id === "number") {
    api.post(`/leads/${id}/respond/`, {}).catch(() => {});
  }
  return next;
}

export function markLeadConverted(id) {
  const next = getLeads().map((l) =>
    l.id === id ? { ...l, status: "converted" } : l
  );
  saveAll(next);
  if (typeof id === "number") {
    api.post(`/leads/${id}/convert/`, {}).catch(() => {});
  }
  return next;
}

export function removeLead(id) {
  const next = getLeads().filter((l) => l.id !== id);
  saveAll(next);
  if (typeof id === "number") {
    api.delete(`/leads/${id}/`).catch(() => {});
  }
  return next;
}

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
  return useLeads().filter((l) => l.listingId === listingId);
}

export function useNewLeadsCount() {
  return useLeads().filter((l) => l.status === "new").length;
}

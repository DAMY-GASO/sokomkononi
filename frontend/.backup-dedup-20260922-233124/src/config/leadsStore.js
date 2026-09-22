// ============================================================
// leadsStore.js — API-only via /api/leads/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_leads_v1";
const EV = "sokomkononi:leads-updated";

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
function norm(raw) {
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

export function getLeads() { return read(); }
export function getLead(id) { return read().find((l) => l.id === id) || null; }
export function getLeadsForListing(listingId) { return read().filter((l) => l.listingId === listingId); }

export async function hydrateLeadsFromApi() {
  try {
    const d = await api.get("/leads/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    const normalized = list.map(norm).filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function markLeadRespondedAsync(id) {
  try {
    const raw = await api.post(`/leads/${id}/respond/`, {});
    const updated = norm(raw) || { ...getLead(id), status: "responded", respondedAt: new Date().toISOString() };
    write(read().map((l) => (l.id === id ? updated : l)));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function markLeadConvertedAsync(id) {
  try {
    const raw = await api.post(`/leads/${id}/convert/`, {});
    const updated = norm(raw) || { ...getLead(id), status: "converted", convertedAt: new Date().toISOString() };
    write(read().map((l) => (l.id === id ? updated : l)));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeLeadAsync(id) {
  try {
    await api.delete(`/leads/${id}/`);
    write(read().filter((l) => l.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function addLead() { /* no-op */ }

export function useLeads() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateLeadsFromApi();
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
export function useNewLeads() { return useLeads().filter((l) => l.status === "new"); }
export function useNewLeadsCount() { return useLeads().filter((l) => l.status === "new").length; }
export function useLeadsForListing(listingId) {
  const list = useLeads();
  return listingId ? list.filter((l) => l.listingId === listingId) : [];
}

// LEGACY
export const SEED_LEADS = [];

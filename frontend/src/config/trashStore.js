// ============================================================
// trashStore.js — API-only via /api/trash/
// ============================================================
import { useEffect, useState } from "react";
import { trashApi } from "../api/trash.js";
import { api } from "../api/client.js";

const OVERVIEW_KEY = "sokomkononi_trash_overview_v1";
const ITEMS_KEY = "sokomkononi_trash_items_v1";
const EV = "sokomkononi:trash-updated";

export const TRASH_TYPES = [
  { key: "listings",      label: { sw: "Mali (Listings)", en: "Listings" },      iconKey: "Home",       color: "#E8A33D" },
  { key: "users",         label: { sw: "Watumiaji", en: "Users" },                iconKey: "Users",      color: "#2563EB" },
  { key: "verifications", label: { sw: "Uthibitisho", en: "Verifications" },      iconKey: "ShieldCheck", color: "#2F6D4F" },
  { key: "tickets",       label: { sw: "Tiketi", en: "Tickets" },                iconKey: "Headphones", color: "#C1502E" },
  { key: "banners",       label: { sw: "Banner", en: "Banners" },                iconKey: "Image",      color: "#D97706" },
  { key: "announcements", label: { sw: "Matangazo", en: "Announcements" },       iconKey: "Megaphone",  color: "#7C3AED" },
  { key: "deals",         label: { sw: "Deals", en: "Deals" },                   iconKey: "Handshake",  color: "#059669" },
];

const EMPTY_OVERVIEW = {
  listings: 0, users: 0, verifications: 0, tickets: 0,
  banners: 0, announcements: 0, deals: 0, total: 0, lastUpdated: null,
};

function readOverview() {
  if (typeof window === "undefined") return EMPTY_OVERVIEW;
  try {
    const raw = window.localStorage.getItem(OVERVIEW_KEY);
    if (!raw) return EMPTY_OVERVIEW;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? { ...EMPTY_OVERVIEW, ...p } : EMPTY_OVERVIEW;
  } catch { return EMPTY_OVERVIEW; }
}
function writeOverview(o) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OVERVIEW_KEY, JSON.stringify(o));
  window.dispatchEvent(new Event(EV));
}
function readItems() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ITEMS_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? p : {};
  } catch { return {}; }
}
function writeItems(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EV));
}

function normOverview(raw) {
  if (!raw || typeof raw !== "object") return EMPTY_OVERVIEW;
  const src = raw.counts && typeof raw.counts === "object" ? raw.counts : raw;
  const o = {
    listings: Number(src.listings) || 0,
    users: Number(src.users) || 0,
    verifications: Number(src.verifications) || 0,
    tickets: Number(src.tickets) || 0,
    banners: Number(src.banners) || 0,
    announcements: Number(src.announcements) || 0,
    deals: Number(src.deals) || 0,
    lastUpdated: new Date().toISOString(),
  };
  o.total = Number(src.total) || o.listings + o.users + o.verifications + o.tickets + o.banners + o.announcements + o.deals;
  return o;
}
function normItem(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    type: raw.type,
    name: raw.name || raw.title || raw.subject || `#${raw.id}`,
    subtitle: raw.subtitle || raw.description || "",
    deletedAt: raw.deleted_at || raw.created_at,
    deletedBy: raw.deleted_by || raw.deleted_by_name || "—",
    details: raw.details || "",
    thumbnail: raw.thumbnail || raw.image_url || null,
  };
}

// ── Reads ────────────────────────────────────────────────
export function getTrashOverview() { return readOverview(); }
export function getTrashTotal() { return readOverview().total; }
export function hasTrashItems() { return readOverview().total > 0; }
export function getTrashCountByType(type) { return Number(readOverview()[type]) || 0; }
export function getTrashBreakdown() {
  const o = readOverview();
  return TRASH_TYPES.map((t) => ({ key: t.key, label: t.label, iconKey: t.iconKey, color: t.color, count: Number(o[t.key]) || 0 }));
}
export function getTrashItemsByType(type) {
  const all = readItems();
  return Array.isArray(all[type]) ? all[type] : [];
}
export function getTrashItem(type, id) { return getTrashItemsByType(type).find((i) => i.id === id) || null; }
function setTrashItemsByType(type, list) {
  writeItems({ ...readItems(), [type]: list });
}

// ── Hydrate ──────────────────────────────────────────────
export async function hydrateTrashOverviewFromApi() {
  try {
    const data = await trashApi.overview();
    const o = normOverview(data);
    writeOverview(o);
    return { ok: true, overview: o };
  } catch (err) { return { ok: false, error: err }; }
}

export async function fetchTrashItemsAsync(type) {
  try {
    const data = await api.get(`/trash/${type}/`);
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normItem).filter(Boolean);
    setTrashItemsByType(type, normalized);
    return { ok: true, items: normalized };
  } catch (err) { return { ok: false, error: err, items: [] }; }
}

// ── Mutations ────────────────────────────────────────────
export async function restoreTrashItemAsync(type, id) {
  try {
    await api.post(`/trash/${type}/${id}/restore/`, {});
    setTrashItemsByType(type, getTrashItemsByType(type).filter((i) => i.id !== id));
    const o = readOverview();
    writeOverview({ ...o, [type]: Math.max(0, (o[type] || 0) - 1), total: Math.max(0, o.total - 1), lastUpdated: new Date().toISOString() });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function permanentDeleteTrashItemAsync(type, id) {
  try {
    await api.delete(`/trash/${type}/${id}/`);
    setTrashItemsByType(type, getTrashItemsByType(type).filter((i) => i.id !== id));
    const o = readOverview();
    writeOverview({ ...o, [type]: Math.max(0, (o[type] || 0) - 1), total: Math.max(0, o.total - 1), lastUpdated: new Date().toISOString() });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function emptyTrashByTypeAsync(type) {
  try {
    await api.post(`/trash/${type}/empty/`, { confirm: true });
    setTrashItemsByType(type, []);
    const o = readOverview();
    writeOverview({ ...o, [type]: 0, total: Math.max(0, o.total - (o[type] || 0)), lastUpdated: new Date().toISOString() });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function emptyTrashAsync() {
  try {
    await api.post("/trash/empty/", { confirm: true });
    writeItems({});
    writeOverview({ ...EMPTY_OVERVIEW, lastUpdated: new Date().toISOString() });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ── Hooks ────────────────────────────────────────────────
export function useTrashOverview() {
  const [o, setO] = useState(() => readOverview());
  useEffect(() => {
    hydrateTrashOverviewFromApi();
    const sync = () => setO(readOverview());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return o;
}
export function useHasTrash() { return useTrashOverview().total > 0; }
export function useTrashItems(type) {
  const [items, setItems] = useState(() => type ? getTrashItemsByType(type) : []);
  useEffect(() => {
    if (!type) { setItems([]); return; }
    fetchTrashItemsAsync(type).then((r) => { if (r.ok) setItems(r.items); });
    const sync = () => setItems(getTrashItemsByType(type));
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, [type]);
  return items;
}

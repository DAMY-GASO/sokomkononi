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

// Backend inatuma aina kama "app_label.ModelName" (mf. "verifications.VerificationRequest").
// Hii inalinganisha jina la model na funguo za TRASH_TYPES.
const TYPE_ALIASES = {
  listing: "listings", listings: "listings",
  user: "users", users: "users",
  verification: "verifications", verifications: "verifications",
  verificationrequest: "verifications",
  ticket: "tickets", tickets: "tickets", supportticket: "tickets",
  banner: "banners", banners: "banners",
  announcement: "announcements", announcements: "announcements",
  deal: "deals", deals: "deals",
};
function canonicalType(k) {
  if (!k) return null;
  const model = String(k).split(".").pop().toLowerCase().replace(/[\s_-]/g, "");
  return TYPE_ALIASES[model] || null;
}
function prettyName(n) {
  return String(n || "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

const EMPTY_OVERVIEW = {
  listings: 0, users: 0, verifications: 0, tickets: 0,
  banners: 0, announcements: 0, deals: 0, total: 0, lastUpdated: null,
  others: [],        // aina nyingine zenye SoftDeleteModel: [{ key, name, count }]
  backendTypes: {},  // key ya frontend -> "app.Model" ya backend
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

  // New backend shape: { totals: [{ type, count, protected }, ...] }
  if (Array.isArray(raw.totals)) {
    const o = {
      ...EMPTY_OVERVIEW,
      others: [],
      backendTypes: {},
      lastUpdated: new Date().toISOString(),
    };
    for (const t of raw.totals) {
      const type = t?.type;
      if (!type) continue;
      const count = Number(t.count) || 0;
      o.total += count;
      const key = canonicalType(type);
      if (key && !o.backendTypes[key]) {
        o[key] = count;
        o.backendTypes[key] = type;
      } else if (count > 0) {
        o.others.push({
          key: type,
          name: prettyName(t.model || String(type).split(".").pop()),
          count,
        });
      }
    }
    return o;
  }

  // Legacy shapes (counts | flat)
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
  o.total = Number(src.total) ||
    o.listings + o.users + o.verifications + o.tickets + o.banners + o.announcements + o.deals;
  return o;
}
function normItem(raw, fallbackType) {
  if (!raw) return null;
  return {
    id: raw.id,
    type: canonicalType(raw.type) || fallbackType,
    name: raw.name || raw.title || raw.subject || raw.repr || `#${raw.id}`,
    subtitle: raw.subtitle || raw.description || "",
    deletedAt: raw.deleted_at || raw.created_at,
    deletedBy: raw.deleted_by_name || "—",
    details: raw.details || raw.reason || "",
    thumbnail: raw.thumbnail || raw.image_url || null,
  };
}

// ── Helpers ──────────────────────────────────────────────
function apiType(key) {
  const bt = readOverview().backendTypes;
  return encodeURIComponent((bt && bt[key]) || key);
}
function adjustCount(o, type, delta) {
  const next = { ...o, others: (o.others || []).map((x) => ({ ...x })) };
  let removed = 0;
  if (TRASH_TYPES.some((t) => t.key === type)) {
    const cur = Number(next[type]) || 0;
    removed = delta === "all" ? cur : Math.min(cur, -delta);
    next[type] = cur - removed;
  } else {
    const row = next.others.find((x) => x.key === type);
    if (row) {
      removed = delta === "all" ? row.count : Math.min(row.count, -delta);
      row.count -= removed;
    }
  }
  next.total = Math.max(0, (Number(next.total) || 0) - removed);
  next.lastUpdated = new Date().toISOString();
  return next;
}
export function getAllTrashTypes(o = readOverview()) {
  const base = TRASH_TYPES.map((t) => ({ ...t, count: Number(o[t.key]) || 0 }));
  const extra = (o.others || []).map((x) => ({
    key: x.key,
    label: { sw: x.name, en: x.name },
    iconKey: "File",
    color: "#6B7280",
    count: Number(x.count) || 0,
  }));
  return [...base, ...extra];
}
export function getTrashTypeConfig(key) {
  return (
    getAllTrashTypes().find((t) => t.key === key) || {
      key, label: { sw: key, en: key }, iconKey: "File", color: "#6B7280", count: 0,
    }
  );
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
    const data = await api.get(`/trash/${apiType(type)}/`);
    const list = Array.isArray(data) ? data : data?.results || data?.items || [];
    const normalized = list.map((r) => normItem(r, type)).filter(Boolean);
    setTrashItemsByType(type, normalized);
    return { ok: true, items: normalized };
  } catch (err) { return { ok: false, error: err, items: [] }; }
}

// ── Mutations ────────────────────────────────────────────
export async function restoreTrashItemAsync(type, id) {
  try {
    await api.post(`/trash/${apiType(type)}/${id}/restore/`, {});
    setTrashItemsByType(type, getTrashItemsByType(type).filter((i) => i.id !== id));
    writeOverview(adjustCount(readOverview(), type, -1));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function permanentDeleteTrashItemAsync(type, id) {
  try {
    await api.delete(`/trash/${apiType(type)}/${id}/`);
    setTrashItemsByType(type, getTrashItemsByType(type).filter((i) => i.id !== id));
    writeOverview(adjustCount(readOverview(), type, -1));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function emptyTrashByTypeAsync(type) {
  try {
    const data = await api.post(`/trash/${apiType(type)}/empty/`, { confirm: "DELETE ALL" });
    setTrashItemsByType(type, []);
    writeOverview(adjustCount(readOverview(), type, "all"));
    // Baadhi zinaweza kurukwa (zinatumika mahali pengine) — rekebisha kutoka server.
    if (data?.skipped) {
      fetchTrashItemsAsync(type);
      hydrateTrashOverviewFromApi();
    }
    return { ok: true, data };
  } catch (err) { return { ok: false, error: err }; }
}

export async function emptyTrashAsync() {
  try {
    const data = await api.post("/trash/empty/", { confirm: "DELETE ALL" });
    writeItems({});
    writeOverview({
      ...EMPTY_OVERVIEW,
      others: [],
      backendTypes: readOverview().backendTypes || {},
      lastUpdated: new Date().toISOString(),
    });
    // Aina zinazolindwa au zilizorukwa zinabaki — rekebisha kutoka server.
    hydrateTrashOverviewFromApi();
    return { ok: true, data };
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
export function useTrashItemsState(type) {
  const [items, setItems] = useState(() => (type ? getTrashItemsByType(type) : []));
  const [loading, setLoading] = useState(!!type);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!type) {
      setItems([]);
      setLoading(false);
      setError(null);
      return undefined;
    }
    let alive = true;
    setItems(getTrashItemsByType(type));
    setLoading(true);
    setError(null);
    fetchTrashItemsAsync(type).then((r) => {
      if (!alive) return;
      if (r.ok) setItems(r.items);
      else setError(r.error || new Error("Failed"));
      setLoading(false);
    });
    const sync = () => setItems(getTrashItemsByType(type));
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      alive = false;
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, [type, tick]);

  const reload = () => setTick((n) => n + 1);
  return { items, loading, error, reload };
}
export function useTrashItems(type) { return useTrashItemsState(type).items; }
// ============================================================
// RECYCLE BIN — action history (recycled / restored / permanent)
// ============================================================
const HISTORY_KEY = "sokomkononi_recycle_history_v1";
const HISTORY_EV = "sokomkononi:recycle-history-updated";

function _readHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const p = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

function _writeHistory(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 500)));
  window.dispatchEvent(new Event(HISTORY_EV));
}

export function getRecycleHistory() {
  return _readHistory();
}

export function recordRecycleAction({ type, id, name, action, actor }) {
  const entry = {
    id: `rh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type, itemId: id, name,
    action,                 // "recycled" | "restored" | "permanent" | "emptied"
    actor: actor || "Admin",
    at: new Date().toISOString(),
  };
  _writeHistory([entry, ..._readHistory()]);
  return entry;
}

export function clearRecycleHistory() {
  _writeHistory([]);
}

// Patch mutations to record history
const _origRestore = restoreTrashItemAsync;
export async function restoreTrashItemAsyncWithHistory(type, id) {
  const item = getTrashItem(type, id);
  const res = await _origRestore(type, id);
  if (res.ok) recordRecycleAction({ type, id, name: item?.name, action: "restored" });
  return res;
}

// ============================================================
// trashStore.js — API-backed via /api/trash/
//
// BACKEND HALI YA SASA:
//   GET /api/trash/overview/         → muhtasari wa trash ✅
//
// ENDPOINTS ZINAZOTARAJIWA (TODO — Developer A):
//   GET    /api/trash/{type}/                 → list items by type
//   POST   /api/trash/{type}/{id}/restore/    → restore
//   DELETE /api/trash/{type}/{id}/            → permanent delete
//   POST   /api/trash/empty/                  → empty all
//   POST   /api/trash/{type}/empty/           → empty by type
//
// Store ina graceful fallback — kama endpoint haipo (404),
// actions zinakuwa local-only bila error.
// ============================================================

import { useEffect, useState } from "react";
import { trashApi } from "../api/trash.js";
import { api } from "../api/client.js";

const OVERVIEW_KEY = "sokomkononi_trash_overview_v1";
const ITEMS_KEY = "sokomkononi_trash_items_v1";
const UPDATE_EVENT = "sokomkononi:trash-updated";

// ============================================================
// TRASH TYPES — config
// ============================================================
export const TRASH_TYPES = [
  { key: "listings",      label: { sw: "Mali (Listings)", en: "Listings" },      iconKey: "Home",       color: "#E8A33D" },
  { key: "users",         label: { sw: "Watumiaji", en: "Users" },                iconKey: "Users",      color: "#2563EB" },
  { key: "verifications", label: { sw: "Uthibitisho", en: "Verifications" },      iconKey: "ShieldCheck", color: "#2F6D4F" },
  { key: "tickets",       label: { sw: "Tiketi", en: "Tickets" },                iconKey: "Headphones", color: "#C1502E" },
  { key: "banners",       label: { sw: "Banner", en: "Banners" },                iconKey: "Image",      color: "#D97706" },
  { key: "announcements", label: { sw: "Matangazo", en: "Announcements" },       iconKey: "Megaphone",  color: "#7C3AED" },
  { key: "deals",         label: { sw: "Deals", en: "Deals" },                   iconKey: "Handshake",  color: "#059669" },
];

// ============================================================
// SEED
// ============================================================
export const SEED_OVERVIEW = {
  listings: 0,
  users: 0,
  verifications: 0,
  tickets: 0,
  banners: 0,
  announcements: 0,
  deals: 0,
  total: 0,
  lastUpdated: null,
};

export const SEED_ITEMS = {}; // { [type]: [] }

// ============================================================
// STORAGE — Overview
// ============================================================
function readOverview() {
  if (typeof window === "undefined") return SEED_OVERVIEW;
  try {
    const raw = window.localStorage.getItem(OVERVIEW_KEY);
    if (!raw) return SEED_OVERVIEW;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return SEED_OVERVIEW;
    return { ...SEED_OVERVIEW, ...parsed };
  } catch {
    return SEED_OVERVIEW;
  }
}

function saveOverview(overview) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OVERVIEW_KEY, JSON.stringify(overview));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// STORAGE — Items cache
// ============================================================
function readItems() {
  if (typeof window === "undefined") return SEED_ITEMS;
  try {
    const raw = window.localStorage.getItem(ITEMS_KEY);
    if (!raw) return SEED_ITEMS;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return SEED_ITEMS;
    return parsed;
  } catch {
    return SEED_ITEMS;
  }
}

function saveItems(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// NORMALIZERS
// ============================================================
function normalizeOverviewFromApi(raw) {
  if (!raw || typeof raw !== "object") return SEED_OVERVIEW;

  const source =
    raw.counts && typeof raw.counts === "object" ? raw.counts : raw;

  const normalized = {
    listings: Number(source.listings) || 0,
    users: Number(source.users) || 0,
    verifications: Number(source.verifications) || 0,
    tickets: Number(source.tickets) || 0,
    banners: Number(source.banners) || 0,
    announcements: Number(source.announcements) || 0,
    deals: Number(source.deals) || 0,
    lastUpdated: new Date().toISOString(),
  };

  normalized.total =
    Number(source.total) ||
    normalized.listings +
      normalized.users +
      normalized.verifications +
      normalized.tickets +
      normalized.banners +
      normalized.announcements +
      normalized.deals;

  return normalized;
}

function normalizeItemFromApi(raw) {
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

// ============================================================
// GRACEFUL API HELPER
// ============================================================
async function tryApi(apiCall, { onSuccess, onFail } = {}) {
  try {
    const raw = await apiCall();
    onSuccess?.(raw);
    return { ok: true, data: raw };
  } catch (err) {
    if (err?.status === 404 || err?.status === 501) {
      console.warn("[trashStore] backend haipo — local-only:", err.status);
      return { ok: true, warning: "local_only" };
    }
    onFail?.(err);
    return { ok: false, error: err };
  }
}

// ============================================================
// READS — Overview
// ============================================================
export function getTrashOverview() {
  return readOverview();
}

export function getTrashTotal() {
  return readOverview().total;
}

export function hasTrashItems() {
  return readOverview().total > 0;
}

export function getTrashCountByType(type) {
  const overview = readOverview();
  return Number(overview[type]) || 0;
}

export function getTrashBreakdown() {
  const o = readOverview();
  return TRASH_TYPES.map((t) => ({
    key: t.key,
    label: t.label,
    iconKey: t.iconKey,
    color: t.color,
    count: Number(o[t.key]) || 0,
  }));
}

// ============================================================
// READS — Items
// ============================================================
export function getTrashItemsByType(type) {
  const all = readItems();
  return Array.isArray(all[type]) ? all[type] : [];
}

export function getTrashItem(type, id) {
  return getTrashItemsByType(type).find((i) => i.id === id) || null;
}

function setTrashItemsByType(type, list) {
  const all = readItems();
  saveItems({ ...all, [type]: list });
}

// ============================================================
// HYDRATE — Overview
// ============================================================
export async function hydrateTrashOverviewFromApi() {
  try {
    const data = await trashApi.overview();
    const normalized = normalizeOverviewFromApi(data);
    saveOverview(normalized);
    return { ok: true, source: "api", overview: normalized };
  } catch (err) {
    console.warn("[trashStore] hydrate overview failed:", err);
    return { ok: false, source: "error", overview: getTrashOverview() };
  }
}

// ============================================================
// FETCH — Items by type
// ============================================================
export async function fetchTrashItemsAsync(type) {
  if (!type) return { ok: false, error: new Error("type inahitajika") };

  try {
    const data = await api.get(`/trash/${type}/`);
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeItemFromApi).filter(Boolean);
    setTrashItemsByType(type, normalized);
    return { ok: true, items: normalized };
  } catch (err) {
    if (err?.status === 404 || err?.status === 501) {
      // Backend haipo — rudisha local
      const local = getTrashItemsByType(type);
      return { ok: true, items: local, warning: "local_only" };
    }
    console.warn("[trashStore] fetch items failed:", err);
    return { ok: false, error: err, items: [] };
  }
}

// ============================================================
// RESTORE — item
// ============================================================
export async function restoreTrashItemAsync(type, id) {
  if (!type || id == null) {
    return { ok: false, error: new Error("type na id zinahitajika") };
  }

  const previousItems = getTrashItemsByType(type);
  const previousOverview = getTrashOverview();
  const target = previousItems.find((i) => i.id === id);
  if (!target) return { ok: false, error: new Error("Item haipo") };

  // Optimistic — ondoa kutoka list
  setTrashItemsByType(type, previousItems.filter((i) => i.id !== id));

  // Optimistic — punguza count
  const newOverview = {
    ...previousOverview,
    [type]: Math.max(0, (Number(previousOverview[type]) || 0) - 1),
    total: Math.max(0, (Number(previousOverview.total) || 0) - 1),
    lastUpdated: new Date().toISOString(),
  };
  saveOverview(newOverview);

  return tryApi(
    () => api.post(`/trash/${type}/${id}/restore/`, {}),
    {
      onFail: () => {
        // Rollback
        setTrashItemsByType(type, previousItems);
        saveOverview(previousOverview);
      },
    }
  );
}

// ============================================================
// PERMANENT DELETE — item
// ============================================================
export async function permanentDeleteTrashItemAsync(type, id) {
  if (!type || id == null) {
    return { ok: false, error: new Error("type na id zinahitajika") };
  }

  const previousItems = getTrashItemsByType(type);
  const previousOverview = getTrashOverview();
  const target = previousItems.find((i) => i.id === id);
  if (!target) return { ok: false, error: new Error("Item haipo") };

  // Optimistic — ondoa kutoka list
  setTrashItemsByType(type, previousItems.filter((i) => i.id !== id));

  // Optimistic — punguza count
  const newOverview = {
    ...previousOverview,
    [type]: Math.max(0, (Number(previousOverview[type]) || 0) - 1),
    total: Math.max(0, (Number(previousOverview.total) || 0) - 1),
    lastUpdated: new Date().toISOString(),
  };
  saveOverview(newOverview);

  return tryApi(
    () => api.delete(`/trash/${type}/${id}/`),
    {
      onFail: () => {
        setTrashItemsByType(type, previousItems);
        saveOverview(previousOverview);
      },
    }
  );
}

// ============================================================
// EMPTY — by type
// ============================================================
export async function emptyTrashByTypeAsync(type) {
  if (!type) return { ok: false, error: new Error("type inahitajika") };

  const previousItems = getTrashItemsByType(type);
  const previousOverview = getTrashOverview();

  // Optimistic
  setTrashItemsByType(type, []);
  const newOverview = {
    ...previousOverview,
    [type]: 0,
    total: Math.max(
      0,
      (Number(previousOverview.total) || 0) -
        (Number(previousOverview[type]) || 0)
    ),
    lastUpdated: new Date().toISOString(),
  };
  saveOverview(newOverview);

  return tryApi(
    () => api.post(`/trash/${type}/empty/`, { confirm: true }),
    {
      onFail: () => {
        setTrashItemsByType(type, previousItems);
        saveOverview(previousOverview);
      },
    }
  );
}

// ============================================================
// EMPTY — all
// ============================================================
export async function emptyTrashAsync() {
  const previousItems = readItems();
  const previousOverview = getTrashOverview();

  // Optimistic
  saveItems({});
  saveOverview({
    ...SEED_OVERVIEW,
    lastUpdated: new Date().toISOString(),
  });

  return tryApi(
    () => api.post("/trash/empty/", { confirm: true }),
    {
      onFail: () => {
        saveItems(previousItems);
        saveOverview(previousOverview);
      },
    }
  );
}

// ============================================================
// HOOKS — Overview
// ============================================================
export function useTrashOverview() {
  const [overview, setOverview] = useState(() => getTrashOverview());

  useEffect(() => {
    hydrateTrashOverviewFromApi();
    const sync = () => setOverview(getTrashOverview());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return overview;
}

export function useTrashTotal() {
  const overview = useTrashOverview();
  return overview.total;
}

export function useTrashBreakdown() {
  const overview = useTrashOverview();
  return TRASH_TYPES.map((t) => ({
    key: t.key,
    label: t.label,
    iconKey: t.iconKey,
    color: t.color,
    count: Number(overview[t.key]) || 0,
  }));
}

export function useHasTrash() {
  const overview = useTrashOverview();
  return overview.total > 0;
}

// ============================================================
// HOOKS — Items
// ============================================================
export function useTrashItems(type) {
  const [items, setItems] = useState(() =>
    type ? getTrashItemsByType(type) : []
  );

  useEffect(() => {
    if (!type) {
      setItems([]);
      return;
    }

    // Fetch from API (with fallback)
    fetchTrashItemsAsync(type).then((res) => {
      if (res.ok) setItems(res.items);
    });

    const sync = () => setItems(getTrashItemsByType(type));
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, [type]);

  return items;
}

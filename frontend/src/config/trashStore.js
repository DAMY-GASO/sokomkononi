// ============================================================
// trashStore.js — API-backed via /api/trash/
//
// BACKEND HALI YA SASA (kulingana na trashApi.js):
//   GET /api/trash/overview/         → muhtasari wa trash
//
// ENDPOINTS ZINAZOKOSEKANA (TODO):
//   GET    /api/trash/{type}/        → list items by type
//   POST   /api/trash/{type}/{id}/restore/  → restore
//   DELETE /api/trash/{type}/{id}/   → permanent delete
//   POST   /api/trash/empty/         → empty all
//
// Store hii inafanya kazi na `overview` pekee. Ukiongeza
// endpoints, ongeza functions za restore/delete hapa chini.
// ============================================================

import { useEffect, useState, useMemo } from "react";
import { trashApi } from "../api/trash.js";

const STORAGE_KEY = "sokomkononi_trash_overview_v1";
const UPDATE_EVENT = "sokomkononi:trash-updated";

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

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return SEED_OVERVIEW;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_OVERVIEW;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return SEED_OVERVIEW;
    return { ...SEED_OVERVIEW, ...parsed };
  } catch {
    return SEED_OVERVIEW;
  }
}

function saveAll(overview) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overview));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// NORMALIZER
// ============================================================
function normalizeFromApi(raw) {
  if (!raw || typeof raw !== "object") return SEED_OVERVIEW;

  // Backend inaweza kurudisha muundo tofauti. Tunajaribu kawaida:
  //   { listings: N, users: N, ... }  au  { counts: { listings: N, ... } }
  const source = raw.counts && typeof raw.counts === "object" ? raw.counts : raw;

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

  // Total: hesabu kama backend haitoi
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

// ============================================================
// READS
// ============================================================
export function getTrashOverview() {
  return readFromStorage();
}

export function getTrashTotal() {
  return readFromStorage().total;
}

export function hasTrashItems() {
  return readFromStorage().total > 0;
}

export function getTrashBreakdown() {
  const o = readFromStorage();
  return [
    { key: "listings", label: { sw: "Listing", en: "Listings" }, count: o.listings },
    { key: "users", label: { sw: "Watumiaji", en: "Users" }, count: o.users },
    { key: "verifications", label: { sw: "Uthibitisho", en: "Verifications" }, count: o.verifications },
    { key: "tickets", label: { sw: "Tiketi", en: "Tickets" }, count: o.tickets },
    { key: "banners", label: { sw: "Banner", en: "Banners" }, count: o.banners },
    { key: "announcements", label: { sw: "Matangazo", en: "Announcements" }, count: o.announcements },
    { key: "deals", label: { sw: "Deals", en: "Deals" }, count: o.deals },
  ].filter((item) => item.count > 0);
}

// ============================================================
// HYDRATE
// ============================================================
export async function hydrateTrashOverviewFromApi() {
  try {
    const data = await trashApi.overview();
    const normalized = normalizeFromApi(data);
    saveAll(normalized);
    return { source: "api", overview: normalized };
  } catch (err) {
    console.warn("[trashStore] hydrate failed:", err);
    return { source: "error", overview: getTrashOverview() };
  }
}

// ============================================================
// TODO — ENDPOINTS ZINAZOKOSEKANA
// Fungua hizi backend ikiwa, kisha jaza hapa chini:
// ============================================================
//
// export async function fetchTrashItemsAsync(type) {
//   // TODO: GET /api/trash/{type}/
//   try {
//     const data = await api.get(`/trash/${type}/`);
//     const list = Array.isArray(data) ? data : data?.results || [];
//     return { ok: true, items: list };
//   } catch (err) {
//     return { ok: false, error: err, items: [] };
//   }
// }
//
// export async function restoreTrashItemAsync(type, id) {
//   // TODO: POST /api/trash/{type}/{id}/restore/
//   const res = await api.post(`/trash/${type}/${id}/restore/`, {});
//   // Refresh overview
//   await hydrateTrashOverviewFromApi();
//   return { ok: true, data: res };
// }
//
// export async function permanentDeleteTrashItemAsync(type, id) {
//   // TODO: DELETE /api/trash/{type}/{id}/
//   await api.delete(`/trash/${type}/${id}/`);
//   await hydrateTrashOverviewFromApi();
//   return { ok: true };
// }
//
// export async function emptyTrashAsync() {
//   // TODO: POST /api/trash/empty/
//   await api.post("/trash/empty/", { confirm: true });
//   saveAll(SEED_OVERVIEW);
//   return { ok: true };
// }

// ============================================================
// HOOKS
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
  return useMemo(() => {
    return [
      { key: "listings", label: { sw: "Listing", en: "Listings" }, count: overview.listings },
      { key: "users", label: { sw: "Watumiaji", en: "Users" }, count: overview.users },
      { key: "verifications", label: { sw: "Uthibitisho", en: "Verifications" }, count: overview.verifications },
      { key: "tickets", label: { sw: "Tiketi", en: "Tickets" }, count: overview.tickets },
      { key: "banners", label: { sw: "Banner", en: "Banners" }, count: overview.banners },
      { key: "announcements", label: { sw: "Matangazo", en: "Announcements" }, count: overview.announcements },
      { key: "deals", label: { sw: "Deals", en: "Deals" }, count: overview.deals },
    ].filter((item) => item.count > 0);
  }, [overview]);
}

export function useHasTrash() {
  const overview = useTrashOverview();
  return overview.total > 0;
}

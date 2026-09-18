// ============================================================
// announcementsStore.js — API-backed via /api/announcements/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_announcements_v1";
const UPDATE_EVENT = "sokomkononi:announcements-updated";

export const ANNOUNCEMENT_TYPES = [
  { id: "fee_change", label: { sw: "Mabadiliko ya Ada", en: "Fee Change" } },
  { id: "new_category", label: { sw: "Category Mpya", en: "New Category" } },
  { id: "maintenance", label: { sw: "Matengenezo ya Mfumo", en: "System Maintenance" } },
  { id: "promotion", label: { sw: "Kampeni/Promotion", en: "Campaign/Promotion" } },
];

export const SEED_ANNOUNCEMENTS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_ANNOUNCEMENTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_ANNOUNCEMENTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_ANNOUNCEMENTS;
    return parsed;
  } catch {
    return SEED_ANNOUNCEMENTS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function normalizeFromApi(raw) {
  if (!raw) return null;
  const typeMap = {
    FEE_CHANGE: "fee_change", NEW_CATEGORY: "new_category",
    MAINTENANCE: "maintenance", PROMOTION: "promotion",
  };
  return {
    id: raw.id,
    typeId: typeMap[raw.type] || raw.typeId || raw.type,
    title: raw.title,
    titleEn: raw.title_en,
    message: raw.message,
    messageEn: raw.message_en,
    scheduledFor: raw.scheduled_for,
    sent: raw.sent,
    createdAt: raw.created_at,
  };
}

export function getAnnouncements() {
  return readFromStorage();
}

export function saveAnnouncements(list) {
  saveAll(list);
}

export async function hydrateAnnouncementsFromApi() {
  try {
    const data = await api.get("/announcements/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeFromApi).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[announcementsStore] hydrate failed:", err);
    return { source: "error", count: getAnnouncements().length };
  }
}

export function addAnnouncement(announcement) {
  const typeMap = {
    fee_change: "FEE_CHANGE", new_category: "NEW_CATEGORY",
    maintenance: "MAINTENANCE", promotion: "PROMOTION",
  };
  const payload = {
    typeId: typeMap[announcement.typeId] || "MAINTENANCE",
    title: announcement.title,
    titleEn: announcement.titleEn || "",
    message: announcement.message,
    messageEn: announcement.messageEn || "",
    scheduledFor: announcement.scheduledFor || null,
    sent: announcement.sent !== false,
  };
  const entry = { id: `local_${Date.now()}`, ...announcement };
  saveAll([entry, ...getAnnouncements()]);

  api.post("/announcements/", payload).then((raw) => {
    const created = normalizeFromApi(raw);
    saveAll([created, ...getAnnouncements().filter((a) => a.id !== entry.id)]);
  }).catch(() => {});

  return entry;
}

export function removeAnnouncement(id) {
  const next = getAnnouncements().filter((a) => a.id !== id);
  saveAll(next);
  if (typeof id === "number") {
    api.delete(`/announcements/${id}/`).catch(() => {});
  }
  return next;
}

export function useAnnouncements() {
  const [list, setList] = useState(() => getAnnouncements());
  useEffect(() => {
    hydrateAnnouncementsFromApi();
    const sync = () => setList(getAnnouncements());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return list;
}

export function useSentAnnouncements() {
  return useAnnouncements().filter((a) => a.sent);
}

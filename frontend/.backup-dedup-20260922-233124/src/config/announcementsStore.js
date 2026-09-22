// ============================================================
// announcementsStore.js — API-only via /api/announcements/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_announcements_v1";
const EV = "sokomkononi:announcements-updated";

export const ANNOUNCEMENT_TYPES = [
  { id: "fee_change", api: "FEE_CHANGE", label: { sw: "Mabadiliko ya Ada", en: "Fee Change" } },
  { id: "new_category", api: "NEW_CATEGORY", label: { sw: "Category Mpya", en: "New Category" } },
  { id: "maintenance", api: "MAINTENANCE", label: { sw: "Matengenezo ya Mfumo", en: "System Maintenance" } },
  { id: "promotion", api: "PROMOTION", label: { sw: "Kampeni/Promotion", en: "Campaign/Promotion" } },
];

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

const API_TO_KEY = { FEE_CHANGE: "fee_change", NEW_CATEGORY: "new_category", MAINTENANCE: "maintenance", PROMOTION: "promotion" };
const KEY_TO_API = { fee_change: "FEE_CHANGE", new_category: "NEW_CATEGORY", maintenance: "MAINTENANCE", promotion: "PROMOTION" };

function norm(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    typeId: API_TO_KEY[raw.type] || raw.type,
    title: raw.title,
    titleEn: raw.title_en,
    message: raw.message,
    messageEn: raw.message_en,
    scheduledFor: raw.scheduled_for,
    sent: raw.sent,
    createdAt: raw.created_at,
  };
}

export function getAnnouncements() { return read(); }

export async function hydrateAnnouncementsFromApi() {
  try {
    const d = await api.get("/announcements/?page_size=100");
    const list = Array.isArray(d) ? d : d?.results || [];
    write(list.map(norm).filter(Boolean));
    return { ok: true, count: list.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function addAnnouncementAsync(form) {
  if (!form?.title?.trim() || !form?.message?.trim()) {
    return { ok: false, error: new Error("title + message required") };
  }
  try {
    const raw = await api.post("/announcements/", {
      type: KEY_TO_API[form.typeId] || "MAINTENANCE",
      title: form.title,
      title_en: form.titleEn || "",
      message: form.message,
      message_en: form.messageEn || "",
      scheduled_for: form.scheduledFor || null,
      sent: form.sent !== false,
    });
    const created = norm(raw);
    write([created, ...read()]);
    return { ok: true, announcement: created };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeAnnouncementAsync(id) {
  try {
    await api.delete(`/announcements/${id}/`);
    write(read().filter((a) => a.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function useAnnouncements() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateAnnouncementsFromApi();
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
export function useSentAnnouncements() { return useAnnouncements().filter((a) => a.sent); }

// LEGACY
export const SEED_ANNOUNCEMENTS = [];
export function saveAnnouncements() {}
export function addAnnouncement() { return null; }
export function removeAnnouncement() {}

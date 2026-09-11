// ============================================================
// announcementsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Matangazo ya Mfumo (System Settings >
// Announcements upande wa Admin, na TICKER inayoonekana kwa
// watumiaji kwenye DashboardShell).
//
// Kabla ya hii, DashboardShell.jsx ilikuwa na ANNOUNCEMENTS ya string
// tatu zilizowekwa kwa mkono, hazikuwa na uhusiano wowote na
// System Settings > Announcements upande wa Admin — ukiandika
// tangazo jipya Admin, halionekani kamwe kwa mtumiaji. Sasa zote
// mbili zinasoma/kuandika hapa.
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; useAnnouncements() haitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_announcements_v1";
const UPDATE_EVENT = "sokomkononi:announcements-updated";

export const ANNOUNCEMENT_TYPES = [
  { id: "fee_change", label: "Mabadiliko ya Fee" },
  { id: "new_category", label: "Category Mpya" },
  { id: "maintenance", label: "Matengenezo ya Mfumo" },
  { id: "promotion", label: "Kampeni/Promotion" },
];

export const SEED_ANNOUNCEMENTS = [
  {
    id: 1,
    typeId: "maintenance",
    title: "Matengenezo ya Mfumo — Jumamosi Usiku",
    message: "Mfumo utakuwa chini kwa dakika 30 kuanzia saa 2:00 usiku kwa matengenezo ya database.",
    scheduledFor: "2026-09-13T23:00",
    sent: true,
  },
  {
    id: 2,
    typeId: "fee_change",
    title: "Boosting Fee Imepungua",
    message: "Kuanzia wiki hii, Boosting Fee imepungua kutoka TZS 15,000 hadi TZS 12,000 kwa wiki.",
    scheduledFor: "2026-09-08T09:00",
    sent: true,
  },
];

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

/** Soma matangazo ya sasa (snapshot moja, si reactive). */
export function getAnnouncements() {
  return readFromStorage();
}

/** Andika orodha mpya kamili ya matangazo. */
export function saveAnnouncements(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Tuma/panga tangazo jipya (Admin pekee anaita hii). */
export function addAnnouncement(announcement) {
  const current = getAnnouncements();
  const next = [announcement, ...current];
  saveAnnouncements(next);
  return next;
}

/** Futa tangazo. */
export function removeAnnouncement(id) {
  const current = getAnnouncements();
  const next = current.filter((a) => a.id !== id);
  saveAnnouncements(next);
  return next;
}

/**
 * Hook ya React inayosoma matangazo na kujisasisha yenyewe — kwenye
 * AdminDashboard (System Settings) na DashboardShell (ticker ya
 * mtumiaji) papo hapo, bila reload.
 */
export function useAnnouncements() {
  const [list, setList] = useState(() => getAnnouncements());

  useEffect(() => {
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

/** Matangazo ambayo yametumwa (sent=true), tayari kuonekana kwa
 * watumiaji kwenye ticker — yaliyopangwa (scheduled, sent=false)
 * hayaonekani bado. */
export function useSentAnnouncements() {
  const list = useAnnouncements();
  return list.filter((a) => a.sent);
}

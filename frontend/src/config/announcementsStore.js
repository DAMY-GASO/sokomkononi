// ============================================================
// announcementsStore.js — API-only via /api/announcements/
//
// Marekebisho:
//  - `sent` sasa = `is_published` ya server (ratiba imefika) — si flag ghafi
//  - scheduled_for inatumwa kama ISO (UTC) — si string ya datetime-local
//  - sendAnnouncementNowAsync / rescheduleAnnouncementAsync
//  - useSentAnnouncements() inaficha zenye ratiba ya wakati ujao
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { guarded } from "./hydrateGuard.js";

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

// "YYYY-MM-DDTHH:mm" (datetime-local, saa za kivinjari) → ISO UTC
export function localInputToIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
// ISO → "YYYY-MM-DDTHH:mm" kwa <input type="datetime-local">
export function isoToLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

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
    // Server inahesabu: ratiba ikifika = imetumwa (hata flag ikiwa bado false)
    sent: raw.is_published ?? raw.sent,
    status: raw.status || (raw.sent ? "SENT" : raw.scheduled_for ? "SCHEDULED" : "DRAFT"),
    createdAt: raw.created_at,
  };
}

export function getAnnouncements() { return read(); }

async function _hydrateAnnouncementsFromApi_impl() {
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
  let scheduledIso = null;
  if (form.scheduledFor) {
    scheduledIso = localInputToIso(form.scheduledFor);
    if (!scheduledIso) return { ok: false, error: new Error("Ratiba si sahihi") };
  }
  try {
    // `sent` haitumwi — server inaamua kutokana na scheduled_for
    const raw = await api.post("/announcements/", {
      type: KEY_TO_API[form.typeId] || "MAINTENANCE",
      title: form.title,
      title_en: form.titleEn || "",
      message: form.message,
      message_en: form.messageEn || "",
      scheduled_for: scheduledIso,
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

function replaceInCache(updated) {
  if (!updated) return;
  write(read().map((a) => (a.id === updated.id ? updated : a)));
}

/** Tuma tangazo lililopangwa sasa hivi. */
export async function sendAnnouncementNowAsync(id) {
  try {
    const raw = await api.post(`/announcements/${id}/send-now/`);
    const updated = norm(raw);
    replaceInCache(updated);
    return { ok: true, announcement: updated };
  } catch (err) { return { ok: false, error: err }; }
}

/** Badilisha ratiba ya tangazo ambalo halijatumwa. `localValue` = datetime-local. */
export async function rescheduleAnnouncementAsync(id, localValue) {
  const iso = localInputToIso(localValue);
  if (!iso) return { ok: false, error: new Error("Ratiba si sahihi") };
  try {
    const raw = await api.patch(`/announcements/${id}/`, { scheduled_for: iso });
    const updated = norm(raw);
    replaceInCache(updated);
    return { ok: true, announcement: updated };
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
export function useSentAnnouncements() {
  const now = Date.now();
  return useAnnouncements().filter(
    (a) => a.sent && (!a.scheduledFor || new Date(a.scheduledFor).getTime() <= now)
  );
}

export const hydrateAnnouncementsFromApi = guarded(_hydrateAnnouncementsFromApi_impl, { key: "hydrateAnnouncementsFromApi" });

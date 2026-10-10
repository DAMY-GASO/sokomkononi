// ============================================================
// feedbackStore.js — Seller Feedback
// Endpoints (assumed; degrade gracefully if missing):
//   POST /api/feedback/                 → submit feedback
//   GET  /api/feedback/mine/            → my submissions
//   GET  /api/feedback/                 → admin: all
//   POST /api/feedback/{id}/respond/    → admin: reply
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_feedback_v1";
const EV  = "sokomkononi:feedback-updated";

export const FEEDBACK_TYPES = [
  { key: "feedback",  label: { sw: "Maoni",           en: "Feedback" },      icon: "MessageSquare" },
  { key: "problem",   label: { sw: "Tatizo",          en: "Report a Problem" }, icon: "AlertTriangle" },
  { key: "suggestion", label: { sw: "Pendekezo",       en: "Suggestion" },    icon: "Lightbulb" },
  { key: "rating",    label: { sw: "Kadiria Uzoefu",   en: "Rate Experience" }, icon: "Star" },
];

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const p = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}
function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 500)));
  window.dispatchEvent(new Event(EV));
}
function norm(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    type: raw.type || "feedback",
    subject: raw.subject || "",
    message: raw.message || "",
    rating: raw.rating != null ? Number(raw.rating) : null,
    listingId: raw.listing_id ?? raw.listingId ?? null,
    userName: raw.user_name || raw.userName || "",
    userEmail: raw.user_email || raw.userEmail || "",
    status: (raw.status || "NEW").toLowerCase(),
    adminReply: raw.admin_reply || raw.adminReply || "",
    createdAt: raw.created_at || raw.createdAt,
    repliedAt: raw.replied_at || raw.repliedAt || null,
    authorSide: raw.author_side || raw.authorSide || "seller", // seller|buyer
  };
}

export function getFeedback() { return read(); }
export function getFeedbackForUser(email) {
  if (!email) return [];
  return read().filter((f) => f.userEmail === email);
}

export async function hydrateFeedbackFromApi() {
  try {
    const d = await api.get("/feedback/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    write(list.map(norm).filter(Boolean));
    return { ok: true, count: list.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function hydrateMyFeedbackFromApi() {
  try {
    const d = await api.get("/feedback/mine/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    const mine = list.map(norm).filter(Boolean);
    // merge with any admin-visible items we already cached
    const current = read();
    const byId = new Map(current.map((x) => [x.id, x]));
    mine.forEach((x) => byId.set(x.id, x));
    write(Array.from(byId.values()));
    return { ok: true, count: mine.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function submitFeedbackAsync(payload) {
  const body = {
    type: payload.type || "feedback",
    subject: (payload.subject || "").trim(),
    message: (payload.message || "").trim(),
    rating: payload.rating ?? null,
    listing_id: payload.listingId ?? null,
    author_side: payload.authorSide || "seller",
  };
  if (!body.subject || !body.message) {
    return { ok: false, error: new Error("subject+message required") };
  }
  try {
    const raw = await api.post("/feedback/", body);
    const created = norm(raw);
    if (created) write([created, ...read()]);
    return { ok: true, feedback: created };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function respondToFeedbackAsync(id, reply) {
  const clean = (reply || "").trim();
  if (!clean) return { ok: false, error: new Error("reply required") };
  try {
    const raw = await api.post(`/feedback/${id}/respond/`, { admin_reply: clean });
    const updated = norm(raw) || { ...getFeedback().find((f) => f.id === id), adminReply: clean, status: "answered", repliedAt: new Date().toISOString() };
    write(read().map((f) => (f.id === id ? updated : f)));
    return { ok: true, feedback: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeFeedbackAsync(id) {
  try {
    await api.delete(`/feedback/${id}/`);
    write(read().filter((f) => f.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ── Hooks ────────────────────────────────────────────────────
export function useFeedback() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateFeedbackFromApi();
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

export function useMyFeedback(userEmail) {
  const [list, setList] = useState(() => getFeedbackForUser(userEmail));
  useEffect(() => {
    hydrateMyFeedbackFromApi();
    const sync = () => setList(getFeedbackForUser(userEmail));
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, [userEmail]);
  return list;
}

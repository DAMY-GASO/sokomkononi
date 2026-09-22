// ============================================================
// verificationsStore.js — API-only via /api/verifications/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_verifications_v1";
const EV = "sokomkononi:verifications-updated";

export const VERIFICATION_TYPES = [
  { key: "seller", label: { sw: "Wauzaji", en: "Sellers" } },
  { key: "buyer", label: { sw: "Wanunuzi", en: "Buyers" } },
  { key: "property", label: { sw: "Mali", en: "Properties" } },
  { key: "vehicle", label: { sw: "Magari", en: "Vehicles" } },
  { key: "business", label: { sw: "Biashara", en: "Businesses" } },
];
export const VERIFICATION_STATUSES = [
  { key: "pending", label: { sw: "Zinasubiri", en: "Pending" } },
  { key: "approved", label: { sw: "Zimeidhinishwa", en: "Approved" } },
  { key: "rejected", label: { sw: "Zimekataliwa", en: "Rejected" } },
];

const API_TO_KEY = { SELLER: "seller", BUYER: "buyer", PROPERTY: "property", VEHICLE: "vehicle", BUSINESS: "business" };
const KEY_TO_API = { seller: "SELLER", buyer: "BUYER", property: "PROPERTY", vehicle: "VEHICLE", business: "BUSINESS" };

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
    type: API_TO_KEY[raw.type] || raw.type,
    userId: raw.user,
    userName: raw.user_name,
    userEmail: raw.user_email,
    subject: raw.subject,
    subjectId: raw.subject_id,
    notes: raw.notes,
    documents: raw.documents || [],
    status: (raw.status || "pending").toLowerCase(),
    submittedAt: raw.created_at,
    reviewedAt: raw.reviewed_at,
    reviewedBy: raw.reviewed_by,
    rejectionReason: raw.rejection_reason,
  };
}

export function getVerifications() { return read(); }
export function getVerification(id) { return read().find((v) => v.id === id) || null; }

export async function hydrateVerificationsFromApi() {
  try {
    const d = await api.get("/verifications/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    write(list.map(norm).filter(Boolean));
    return { ok: true, count: list.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function addVerificationAsync({ type, subject, subjectId, notes = "" }) {
  if (!type || !subject) return { ok: false, error: new Error("type + subject required") };
  try {
    const raw = await api.post("/verifications/", {
      type: KEY_TO_API[type] || type,
      subject,
      subject_id: subjectId,
      notes,
    });
    const created = norm(raw);
    write([created, ...read()]);
    return { ok: true, verification: created };
  } catch (err) { return { ok: false, error: err }; }
}

export async function approveVerificationAsync(id) {
  try {
    const raw = await api.post(`/verifications/${id}/approve/`, {});
    const updated = norm(raw) || { ...getVerification(id), status: "approved", reviewedAt: new Date().toISOString() };
    write(read().map((v) => (v.id === id ? updated : v)));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function rejectVerificationAsync(id, reason = "") {
  try {
    const raw = await api.post(`/verifications/${id}/reject/`, { rejection_reason: reason });
    const updated = norm(raw) || { ...getVerification(id), status: "rejected", rejectionReason: reason, reviewedAt: new Date().toISOString() };
    write(read().map((v) => (v.id === id ? updated : v)));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeVerificationAsync(id) {
  try {
    await api.delete(`/verifications/${id}/`);
    write(read().filter((v) => v.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function useVerifications() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateVerificationsFromApi();
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
export function usePendingVerificationsCount() { return useVerifications().filter((v) => v.status === "pending").length; }

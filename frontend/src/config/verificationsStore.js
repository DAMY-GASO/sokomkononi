// ============================================================
// verificationsStore.js — API-backed via /api/verifications/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_verifications_v1";
const UPDATE_EVENT = "sokomkononi:verifications-updated";

export const VERIFICATION_TYPES = [
  { key: "seller", label: { sw: "Wauzaji", en: "Sellers" }, iconKey: "Users" },
  { key: "buyer", label: { sw: "Wanunuzi", en: "Buyers" }, iconKey: "UserCheck" },
  { key: "property", label: { sw: "Mali", en: "Properties" }, iconKey: "Home" },
  { key: "vehicle", label: { sw: "Magari", en: "Vehicles" }, iconKey: "Car" },
  { key: "business", label: { sw: "Biashara", en: "Businesses" }, iconKey: "Briefcase" },
];

export const VERIFICATION_STATUSES = [
  { key: "pending", label: { sw: "Zinasubiri", en: "Pending" } },
  { key: "approved", label: { sw: "Zimeidhinishwa", en: "Approved" } },
  { key: "rejected", label: { sw: "Zimekataliwa", en: "Rejected" } },
];

const API_TO_KEY = {
  SELLER: "seller", BUYER: "buyer", PROPERTY: "property",
  VEHICLE: "vehicle", BUSINESS: "business",
};
const KEY_TO_API = {
  seller: "SELLER", buyer: "BUYER", property: "PROPERTY",
  vehicle: "VEHICLE", business: "BUSINESS",
};

export const SEED_VERIFICATIONS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_VERIFICATIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_VERIFICATIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_VERIFICATIONS;
  } catch {
    return SEED_VERIFICATIONS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function normalizeFromApi(raw) {
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

export function getVerifications() {
  return readFromStorage();
}

export async function hydrateVerificationsFromApi() {
  try {
    const data = await api.get("/verifications/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeFromApi).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[verificationsStore] hydrate failed:", err);
    return { source: "error", count: getVerifications().length };
  }
}

export function addVerification({
  type, userId, userName, userEmail, subject, subjectId, documents = [], notes = "",
}) {
  const payload = {
    type: KEY_TO_API[type] || type,
    subject,
    subject_id: subjectId,
    notes,
  };
  const entry = {
    id: `local_${Date.now()}`,
    type, userId, userName, userEmail, subject, subjectId,
    documents, notes, status: "pending",
    submittedAt: new Date().toISOString(),
  };
  saveAll([entry, ...getVerifications()]);

  api.post("/verifications/", payload).then((raw) => {
    const created = normalizeFromApi(raw);
    saveAll([created, ...getVerifications().filter((v) => v.id !== entry.id)]);
  }).catch(() => {});

  return entry;
}

export function approveVerification(id) {
  const next = getVerifications().map((v) =>
    v.id === id ? { ...v, status: "approved", reviewedAt: new Date().toISOString() } : v
  );
  saveAll(next);
  if (typeof id === "number") {
    api.post(`/verifications/${id}/approve/`, {}).catch(() => {});
  }
  return next;
}

export function rejectVerification(id, reason = "") {
  const next = getVerifications().map((v) =>
    v.id === id
      ? { ...v, status: "rejected", rejectionReason: reason, reviewedAt: new Date().toISOString() }
      : v
  );
  saveAll(next);
  if (typeof id === "number") {
    api.post(`/verifications/${id}/reject/`, { rejection_reason: reason }).catch(() => {});
  }
  return next;
}

export function removeVerification(id) {
  const next = getVerifications().filter((v) => v.id !== id);
  saveAll(next);
  if (typeof id === "number") {
    api.delete(`/verifications/${id}/`).catch(() => {});
  }
  return next;
}

export function useVerifications() {
  const [requests, setRequests] = useState(() => getVerifications());
  useEffect(() => {
    hydrateVerificationsFromApi();
    const sync = () => setRequests(getVerifications());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return requests;
}

export function useVerificationsByType(type) {
  const requests = useVerifications();
  if (!type || type === "all") return requests;
  return requests.filter((v) => v.type === type);
}

export function useVerificationsByStatus(status) {
  const requests = useVerifications();
  if (!status || status === "all") return requests;
  return requests.filter((v) => v.status === status);
}

export function usePendingVerificationsCount() {
  return useVerifications().filter((v) => v.status === "pending").length;
}

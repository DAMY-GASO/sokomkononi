// ============================================================
// verificationsStore.js — API-only via /api/verifications/
// User verification (SELLER, BUYER) pekee.
// Chaguo B: Both inahesabiwa automatically kutoka listings + deals.
// Events zinatumwa: auth-updated, users-updated, verifications-updated
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_verifications_v1";
const EV = "sokomkononi:verifications-updated";

export const VERIFICATION_TYPES = [
  { key: "seller", label: { sw: "Wauzaji", en: "Sellers" } },
  { key: "buyer", label: { sw: "Wanunuzi", en: "Buyers" } },
];

export const VERIFICATION_STATUSES = [
  { key: "pending", label: { sw: "Zinasubiri", en: "Pending" } },
  { key: "approved", label: { sw: "Zimeidhinishwa", en: "Approved" } },
  { key: "rejected", label: { sw: "Zimekataliwa", en: "Rejected" } },
];

const API_TO_KEY = { SELLER: "seller", BUYER: "buyer" };
const KEY_TO_API = { seller: "SELLER", buyer: "BUYER" };

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
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
    reviewedByName: raw.reviewed_by_name,
    rejectionReason: raw.rejection_reason,
    documentsRequestedAt: raw.documents_requested_at,
    documentsRequestMessage: raw.documents_request_message,
    isBothRoles: !!(raw.is_both_roles ?? raw.isBothRoles),
    currentRole: raw.current_role || raw.currentRole || "neither",
  };
}

export function getVerifications() {
  return read();
}
export function getVerification(id) {
  return read().find((v) => v.id === id) || null;
}

export async function hydrateVerificationsFromApi() {
  try {
    const d = await api.get("/verifications/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    write(list.map(norm).filter(Boolean));
    return { ok: true, count: list.length };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// CREATE — SELLER au BUYER pekee
// ============================================================
export const VERIFICATION_CREATE_TYPES = [
  { key: "seller", label: { sw: "Muuzaji", en: "Seller" } },
  { key: "buyer", label: { sw: "Mnunuzi", en: "Buyer" } },
];

const _CREATABLE = new Set(VERIFICATION_CREATE_TYPES.map((v) => v.key));

export async function addVerificationAsync({
  type,
  subject,
  subjectId,
  notes = "",
}) {
  if (!type || !subject)
    return { ok: false, error: new Error("type + subject required") };
  if (!_CREATABLE.has(type)) {
    return {
      ok: false,
      error: new Error(
        `Verification type "${type}" is not supported. ` +
          `Allowed: ${Array.from(_CREATABLE).join(", ")}.`
      ),
    };
  }
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
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// APPROVE
// ============================================================
export async function approveVerificationAsync(id) {
  try {
    const raw = await api.post(`/verifications/${id}/approve/`, {});
    const updated =
      norm(raw) || {
        ...getVerification(id),
        status: "approved",
        reviewedAt: new Date().toISOString(),
      };
    write(read().map((v) => (v.id === id ? updated : v)));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("sokomkononi:auth-updated"));
      window.dispatchEvent(new Event("sokomkononi:users-updated"));
      window.dispatchEvent(new Event(EV));
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// REJECT
// ============================================================
export async function rejectVerificationAsync(id, reason = "") {
  try {
    const raw = await api.post(`/verifications/${id}/reject/`, {
      rejection_reason: reason,
    });
    const updated =
      norm(raw) || {
        ...getVerification(id),
        status: "rejected",
        rejectionReason: reason,
        reviewedAt: new Date().toISOString(),
      };
    write(read().map((v) => (v.id === id ? updated : v)));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("sokomkononi:auth-updated"));
      window.dispatchEvent(new Event("sokomkononi:users-updated"));
      window.dispatchEvent(new Event(EV));
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// REMOVE — soft delete (inaweka is_deleted = True)
// ============================================================
export async function removeVerificationAsync(id) {
  try {
    await api.delete(`/verifications/${id}/`);
    write(read().filter((v) => v.id !== id));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("sokomkononi:auth-updated"));
      window.dispatchEvent(new Event("sokomkononi:users-updated"));
      window.dispatchEvent(new Event(EV));
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// DELETE — hard delete (inafuta kabisa kutoka database)
// Admin pekee anaweza kufuta maombi ya uthibitisho.
// ============================================================
export async function deleteVerificationAsync(id) {
  try {
    await api.delete(`/verifications/${id}/`);
    write(read().filter((v) => v.id !== id));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("sokomkononi:auth-updated"));
      window.dispatchEvent(new Event("sokomkononi:users-updated"));
      window.dispatchEvent(new Event(EV));
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// ADMIN: Omba documents zaidi
// ============================================================
export async function requestDocumentsAsync(id, message) {
  const clean = (message || "").trim();
  if (!clean) return { ok: false, error: new Error("Message required") };
  try {
    const raw = await api.post(`/verifications/${id}/request-documents/`, {
      message: clean,
    });
    const updated =
      norm(raw) || {
        ...getVerification(id),
        documentsRequestedAt: new Date().toISOString(),
        documentsRequestMessage: clean,
      };
    write(read().map((v) => (v.id === id ? updated : v)));
    return { ok: true, verification: updated };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// UPLOAD document — MTUMIAJI MWENYEWE (sio admin)
// ============================================================
export async function uploadVerificationDocumentAsync(id, file) {
  if (!file) return { ok: false, error: new Error("File required") };
  try {
    const fd = new FormData();
    fd.append("file", file);
    const raw = await api.upload(`/verifications/${id}/documents/`, fd);
    await hydrateVerificationsFromApi();
    return { ok: true, document: raw };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// REFRESH DOCUMENT URL — signed URL inaisha, fetch mpya kila mara
// ============================================================
export async function fetchDocumentUrlAsync(verificationId, documentId) {
  if (!verificationId || !documentId) {
    return {
      ok: false,
      error: new Error("verificationId + documentId required"),
    };
  }
  try {
    const raw = await api.get(
      `/verifications/${verificationId}/documents/${documentId}/`
    );
    return { ok: true, document: raw };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// HOOKS
// ============================================================
let _verificationsHydratePromise = null;
function _dedupedVerificationsHydrate() {
  if (_verificationsHydratePromise) return _verificationsHydratePromise;
  _verificationsHydratePromise = hydrateVerificationsFromApi().finally(() => {
    _verificationsHydratePromise = null;
  });
  return _verificationsHydratePromise;
}

export function useVerifications() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    _dedupedVerificationsHydrate();
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

export function usePendingVerificationsCount() {
  return useVerifications().filter((v) => v.status === "pending").length;
}
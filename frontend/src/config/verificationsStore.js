// ============================================================
// verificationsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Verification Requests.
//
// Aina 5 za verification:
//   - seller    (muuzaji)
//   - buyer     (mnunuzi)
//   - property  (mali — hati, title deed)
//   - vehicle   (gari — documents, insurance)
//   - business  (biashara — leseni, TIN)
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useVerifications) hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";
import { pushNotification } from "./notificationsStore.js";

const STORAGE_KEY = "sokomkononi_verifications_v1";
const UPDATE_EVENT = "sokomkononi:verifications-updated";

// ============================================================
// TYPES — aina za verification
// ============================================================
export const VERIFICATION_TYPES = [
  { key: "seller", label: { sw: "Wauzaji", en: "Sellers" }, iconKey: "Users" },
  { key: "buyer", label: { sw: "Wanunuzi", en: "Buyers" }, iconKey: "UserCheck" },
  { key: "property", label: { sw: "Mali", en: "Properties" }, iconKey: "Home" },
  { key: "vehicle", label: { sw: "Magari", en: "Vehicles" }, iconKey: "Car" },
  { key: "business", label: { sw: "Biashara", en: "Businesses" }, iconKey: "Briefcase" },
];

// ============================================================
// STATUSES — hali za verification
// ============================================================
export const VERIFICATION_STATUSES = [
  { key: "pending", label: { sw: "Zinasubiri", en: "Pending" } },
  { key: "approved", label: { sw: "Zimeidhinishwa", en: "Approved" } },
  { key: "rejected", label: { sw: "Zimekataliwa", en: "Rejected" } },
];

// ============================================================
// SEED — tupu
// ============================================================
export const SEED_VERIFICATIONS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_VERIFICATIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_VERIFICATIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_VERIFICATIONS;
    return parsed;
  } catch {
    return SEED_VERIFICATIONS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// HELPERS
// ============================================================

/** Soma requests zote. */
export function getVerifications() {
  return readFromStorage();
}

/** Ongeza request mpya. */
export function addVerification({
  type,
  userId,
  userName,
  userEmail,
  subject,       // jina la mali/gari/biashara
  subjectId,     // id ya mali/gari/biashara (kama ipo)
  documents = [], // array ya { name, url }
  notes = "",
}) {
  const entry = {
    id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,          // "seller" | "buyer" | "property" | "vehicle" | "business"
    userId,
    userName,
    userEmail,
    subject,
    subjectId,
    documents,
    notes,
    status: "pending",
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  };
  const next = [entry, ...getVerifications()];
  saveAll(next);
  return entry;
}

/** Idhinisha request. */
export function approveVerification(id, adminName = "Admin") {
  const current = getVerifications();
  const request = current.find((v) => v.id === id);
  if (!request) return current;

  const next = current.map((v) =>
    v.id === id
      ? {
          ...v,
          status: "approved",
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminName,
        }
      : v
  );
  saveAll(next);

  // Notification kwa mtumiaji
  pushNotification({
    audience: "user",
    type: "verified",
    title: {
      sw: `Uthibitisho wako umekubaliwa`,
      en: `Your verification was approved`,
    },
    body: {
      sw: `"${request.subject}" imethibitishwa. Sasa inaonekana na badge ya "Verified".`,
      en: `"${request.subject}" has been verified. It now shows with a "Verified" badge.`,
    },
    link: "/dashboard",
    meta: { verificationId: id, type: request.type },
  });

  return next;
}

/** Kataa request. */
export function rejectVerification(id, reason = "", adminName = "Admin") {
  const current = getVerifications();
  const request = current.find((v) => v.id === id);
  if (!request) return current;

  const next = current.map((v) =>
    v.id === id
      ? {
          ...v,
          status: "rejected",
          rejectionReason: reason,
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminName,
        }
      : v
  );
  saveAll(next);

  // Notification kwa mtumiaji
  pushNotification({
    audience: "user",
    type: "rejected",
    title: {
      sw: `Uthibitisho wako umekataliwa`,
      en: `Your verification was rejected`,
    },
    body: {
      sw: reason
        ? `"${request.subject}" imekataliwa. Sababu: ${reason}`
        : `"${request.subject}" imekataliwa. Tafadhali wasilisha nyaraka sahihi.`,
      en: reason
        ? `"${request.subject}" was rejected. Reason: ${reason}`
        : `"${request.subject}" was rejected. Please submit valid documents.`,
    },
    link: "/dashboard",
    meta: { verificationId: id, type: request.type },
  });

  return next;
}

/** Ondoa request. */
export function removeVerification(id) {
  const next = getVerifications().filter((v) => v.id !== id);
  saveAll(next);
  return next;
}

// ============================================================
// HOOKS
// ============================================================

/** Hook: requests zote. */
export function useVerifications() {
  const [requests, setRequests] = useState(() => getVerifications());

  useEffect(() => {
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

/** Hook: requests kwa type. */
export function useVerificationsByType(type) {
  const requests = useVerifications();
  if (!type || type === "all") return requests;
  return requests.filter((v) => v.type === type);
}

/** Hook: requests kwa status. */
export function useVerificationsByStatus(status) {
  const requests = useVerifications();
  if (!status || status === "all") return requests;
  return requests.filter((v) => v.status === status);
}

/** Idadi ya requests pending (kwa badge). */
export function usePendingVerificationsCount() {
  const requests = useVerifications();
  return requests.filter((v) => v.status === "pending").length;
}

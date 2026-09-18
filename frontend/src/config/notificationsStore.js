// ============================================================
// notificationsStore.js
// Backend: /api/notifications/
//   GET    /api/notifications/
//   GET    /api/notifications/{id}/
//   DELETE /api/notifications/{id}/
//   POST   /api/notifications/{id}/read/
//   POST   /api/notifications/read-all/
//   GET    /api/notifications/unread/
//   GET    /api/notifications/unread-count/
//   GET    /api/notifications/priority/{priority}/
//
// Local emit functions (pushNotification / notify*) are kept for
// backward compatibility but are NO-OPs against the backend — the
// backend emits notifications automatically on real events.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { notificationsApi } from "../api/notifications.js";

const STORAGE_KEY = "sokomkononi_notifications_v1";
const UPDATE_EVENT = "sokomkononi:notifications-updated";

const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

function fmtTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

export const NOTIFICATION_EVENTS = {
  LISTING_APPROVED: "listing.approved",
  LISTING_REJECTED: "listing.rejected",
  LISTING_RELEASED: "listing.released",
  LISTING_EXPIRED: "listing.expired",
  LISTING_FEE_PAID: "listing_fee.paid",
  BOOST_PURCHASED: "boost.purchased",
  LEADING_PURCHASED: "leading.purchased",
  ADVERTISEMENT_PURCHASED: "advertisement.purchased",
  MESSAGE_RECEIVED: "message.received",
  RESERVATION_CREATED: "reservation.created",
  RESERVATION_EXPIRING: "reservation.expiring",
  PAYMENT_PROOF_SUBMITTED: "payment.proof_submitted",
  PAYMENT_CONFIRMED: "payment.confirmed",
  INSPECTION_DECISION_MADE: "inspection.decision_made",
  DISPUTE_RESOLVED: "dispute.resolved",
  BUNDLE_PURCHASED: "bundle.purchased",
  PRICE_DROP: "listing.price_drop",
  LISTING_EXPIRING_SOON: "listing.expiring_soon",
  NEW_LEAD: "lead.new",
  SEARCH_MATCH: "search.match",
  NEGOTIATION_UPDATE: "deal.negotiation_update",
  DEAL_COMPLETED: "deal.completed",
  ACCOUNT_SUSPENDED: "account.suspended",
  ACCOUNT_REACTIVATED: "account.reactivated",
  VERIFICATION_SUBMITTED: "verification.submitted",
  TICKET_CREATED: "ticket.created",
  TICKET_REPLIED: "ticket.replied",
  TICKET_RESOLVED: "ticket.resolved",
  LISTING_PENDING: "admin.listing_pending",
  DISPUTE_FILED: "admin.dispute_filed",
  PAYMENT_ISSUE: "admin.payment_issue",
  FRAUD_FLAG: "admin.fraud_flag",
};

export const SEED_NOTIFICATIONS = [];

// ------------------------------------------------------------
// STORAGE
// ------------------------------------------------------------
function readAll() {
  if (typeof window === "undefined") return SEED_NOTIFICATIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_NOTIFICATIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_NOTIFICATIONS;
    return parsed;
  } catch {
    return SEED_NOTIFICATIONS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function sortByNewest(list) {
  return [...list].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

// ------------------------------------------------------------
// NORMALIZER — backend → frontend
// ------------------------------------------------------------
function normalizeNotification(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    audience: raw.recipient_is_staff ? "admin" : "user",
    type: raw.notification_type,
    title: raw.title,
    body: raw.message,
    at: raw.created_at,
    read: !!raw.is_read,
    readAt: raw.read_at,
    link: raw.action_url,
    target: null,
    meta: {
      related_object_type: raw.related_object_type,
      related_object_id: raw.related_object_id,
    },
    priority: raw.priority,
  };
}

// ------------------------------------------------------------
// HYDRATE FROM API
// ------------------------------------------------------------
export async function hydrateNotificationsFromApi() {
  try {
    const data = await notificationsApi.list({ page_size: 100 });
    const rawList = Array.isArray(data) ? data : data?.results || [];
    const normalized = rawList.map(normalizeNotification).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[notificationsStore] hydrate failed:", err);
    return { source: "error", count: readAll().length };
  }
}

export async function fetchUnreadCountAsync() {
  try {
    const data = await notificationsApi.unreadCount();
    return data.unread_count ?? 0;
  } catch {
    return 0;
  }
}

// ------------------------------------------------------------
// PUBLIC API (backward compatible)
// ------------------------------------------------------------
export function getNotifications(audience) {
  const list = readAll().filter((n) => n.audience === audience);
  return sortByNewest(list);
}

export function getUnreadCount(audience) {
  return getNotifications(audience).filter((n) => !n.read).length;
}

/**
 * pushNotification — retained for backward compatibility.
 * Backend now owns notification creation; this writes only to
 * localStorage so the UI stays consistent between refreshes.
 */
export function pushNotification({
  audience,
  type,
  title,
  body = "",
  link = null,
  target = null,
  meta = undefined,
}) {
  const entry = {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    audience,
    type,
    title,
    body,
    at: new Date().toISOString(),
    read: false,
    link,
    target,
    meta,
  };
  saveAll([entry, ...readAll()]);
  return entry;
}

export function markNotificationRead(id) {
  const next = readAll().map((n) => (n.id === id ? { ...n, read: true } : n));
  saveAll(next);
  // Fire-and-forget to backend
  notificationsApi.markRead(id).catch(() => {});
  return next;
}

export function markAllNotificationsRead(audience) {
  const next = readAll().map((n) =>
    n.audience === audience ? { ...n, read: true } : n
  );
  saveAll(next);
  notificationsApi.markAllRead().catch(() => {});
  return next;
}

export function removeNotification(id) {
  const next = readAll().filter((n) => n.id !== id);
  saveAll(next);
  notificationsApi.remove(id).catch(() => {});
  return next;
}

export function clearNotifications(audience) {
  const next = readAll().filter((n) => n.audience !== audience);
  saveAll(next);
  return next;
}

/**
 * Hook — inarudisha notifications kwa `audience`.
 */
export function useNotifications(audience) {
  const [all, setAll] = useState(() => readAll());

  useEffect(() => {
    hydrateNotificationsFromApi();

    const sync = () => setAll(readAll());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  const notifications = useMemo(
    () => sortByNewest(all.filter((n) => n.audience === audience)),
    [all, audience]
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markRead: markNotificationRead,
    markAllRead: () => markAllNotificationsRead(audience),
    remove: removeNotification,
    clearAll: () => clearNotifications(audience),
  };
}

// ============================================================
// HELPER — kuchagua lugha sahihi kwa title/body
// ============================================================
export function getLocalizedField(field, lang = "sw") {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field?.[lang] || field?.sw || "";
}

// ============================================================
// EMITTERS — local-only (backend emits real notifications)
// Kept so existing page code that calls these functions doesn't break.
// ============================================================
export function notifyBoostPurchased(d) {
  pushNotification({
    audience: "user",
    type: "boost",
    title: { sw: "Boost Imewekwa", en: "Boost Applied" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyLeadingPurchased(d) {
  pushNotification({
    audience: "user",
    type: "leading",
    title: { sw: "Leading Fee Imewekwa", en: "Leading Fee Applied" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyAdvertisementPurchased(d) {
  pushNotification({
    audience: "user",
    type: "advertisement",
    title: { sw: "Tangazo Limewekwa", en: "Advertisement Applied" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyListingFeePaid(d) {
  pushNotification({
    audience: "user",
    type: "listing_fee",
    title: { sw: "Malipo ya Listing Fee", en: "Listing Fee Paid" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyAdmin(d) {
  return pushNotification({ audience: "admin", ...d });
}
export function notifyNewMessage(d) {
  return pushNotification({
    audience: "user",
    type: "message",
    title: { sw: `Ujumbe kutoka ${d?.senderName || ""}`, en: `Message from ${d?.senderName || ""}` },
    body: d?.preview || "",
  });
}
export function notifyReservationExpiringSoon(d) {
  return pushNotification({
    audience: "user",
    type: "reminder",
    title: { sw: "Reservation Inakaribia Kuisha", en: "Reservation Expiring" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyListingReleased(d) {
  return pushNotification({
    audience: "user",
    type: "listing_released",
    title: { sw: "Mali Ipatikana", en: "Listing Available" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyDisputeResolved(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.DISPUTE_RESOLVED,
    title: { sw: "Mgogoro Umetatuliwa", en: "Dispute Resolved" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyPaymentProofSubmitted(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.PAYMENT_PROOF_SUBMITTED,
    title: { sw: "Uthibitisho Umetumwa", en: "Proof Submitted" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyBundlePurchased(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.BUNDLE_PURCHASED,
    title: { sw: "Kifurushi Kinenunuliwa", en: "Bundle Purchased" },
    body: "",
  });
}
export function notifyListingApproved(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.LISTING_APPROVED,
    title: { sw: "Tangazo Limeidhinishwa", en: "Listing Approved" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyListingRejected(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.LISTING_REJECTED,
    title: { sw: "Tangazo Halijaidhinishwa", en: "Listing Rejected" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyListingSubmittedForReview(d) {
  return pushNotification({
    audience: "admin",
    type: NOTIFICATION_EVENTS.LISTING_PENDING,
    title: { sw: "Tangazo Jipya", en: "New Listing" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyListingExpiringSoon(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.LISTING_EXPIRING_SOON,
    title: { sw: "Tangazo Linakaribia Kuisha", en: "Listing Expiring Soon" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyListingExpired(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.LISTING_EXPIRED,
    title: { sw: "Tangazo Limeisha", en: "Listing Expired" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyPriceDrop(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.PRICE_DROP,
    title: { sw: "Bei Imeshuka", en: "Price Dropped" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyNewLead(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.NEW_LEAD,
    title: { sw: "Mnunuzi Ameonyesha Nia", en: "Buyer Interest" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifySearchMatch(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.SEARCH_MATCH,
    title: { sw: "Match Mpya", en: "New Match" },
    body: `${d?.searchName || ""}`,
  });
}
export function notifyReservationCreated(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.RESERVATION_CREATED,
    title: { sw: "Reservation Imewekwa", en: "Reservation Created" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyOfferAccepted(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.NEGOTIATION_UPDATE,
    title: { sw: "Ofa Imekubaliwa", en: "Offer Accepted" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyDealCompleted(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.DEAL_COMPLETED,
    title: { sw: "Deal Imekamilika", en: "Deal Completed" },
    body: `${d?.listingTitle || ""}`,
  });
}
export function notifyAccountSuspended(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.ACCOUNT_SUSPENDED,
    title: { sw: "Akaunti Imesimamishwa", en: "Account Suspended" },
    body: "",
  });
}
export function notifyAccountReactivated(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.ACCOUNT_REACTIVATED,
    title: { sw: "Akaunti Imewashwa", en: "Account Reactivated" },
    body: "",
  });
}
export function notifyVerificationSubmitted(d) {
  return pushNotification({
    audience: "admin",
    type: NOTIFICATION_EVENTS.VERIFICATION_SUBMITTED,
    title: { sw: "Ombi Jipya la Uthibitisho", en: "New Verification" },
    body: "",
  });
}
export function notifyTicketCreated(d) {
  return pushNotification({
    audience: "admin",
    type: NOTIFICATION_EVENTS.TICKET_CREATED,
    title: { sw: "Ticket Mpya", en: "New Ticket" },
    body: `${d?.subject || ""}`,
  });
}
export function notifyTicketReplied(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.TICKET_REPLIED,
    title: { sw: "Msaada Umejibu", en: "Support Replied" },
    body: `${d?.subject || ""}`,
  });
}
export function notifyTicketResolved(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.TICKET_RESOLVED,
    title: { sw: "Ticket Imetatuliwa", en: "Ticket Resolved" },
    body: `${d?.subject || ""}`,
  });
}
export function notifyPaymentConfirmed(d) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.PAYMENT_CONFIRMED,
    title: { sw: "Malipo Yamethibitishwa", en: "Payment Confirmed" },
    body: `${d?.listingTitle || ""}`,
  });
}
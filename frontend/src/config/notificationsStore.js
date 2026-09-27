// ============================================================
// notificationsStore.js — API-only via /api/notifications/
// The backend emits notifications for events. Frontend only
// reads and marks read. `pushNotification` is kept as a no-op
// for backward compatibility with legacy callers.
// ============================================================
import { useEffect, useState } from "react";
import { notificationsApi } from "../api/notifications.js";

const KEY = "sokomkononi_notifications_v1";
const EV = "sokomkononi:notifications-updated";

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
  DISPUTE_RESOLVED: "dispute.resolved",
  BUNDLE_PURCHASED: "bundle.purchased",
};

// ============================================================
// NOTIFICATION TYPES — ambazo zinahusiana na ADMIN
// (Kama backend inatuma type hizi, ziwe "admin" audience)
// ============================================================
const ADMIN_NOTIFICATION_TYPES = new Set([
  "LISTING_CREATED",
  "LISTING_DELETED",
  "ACCOUNT_DELETED",
  "ACCOUNT_RESTORED",
  "DISPUTE_OPENED",
  "REPORT_RECEIVED",
  "TICKET_CREATED",
  "NEW_TICKET",
  "VERIFICATION_SUBMITTED",
  "NEW_VERIFICATION",
]);

// ============================================================
// AUDIENCE DETECTION
// Inatumia data zilizopo (kutoka backend) kuamua audience:
// 1. Kama `raw.audience` ipo — itumie moja kwa moja
// 2. Kama `raw.recipient_is_staff` ipo — itumie
// 3. Kama `raw.notification_type` ni ya admin — "admin"
// 4. Kama `raw.user` au `raw.recipient` ipo — "user"
// 5. Default: "user"
// ============================================================
function getNotificationAudience(raw) {
  if (!raw) return "user";

  // 1. Explicit audience field (kama backend inatuma)
  if (raw.audience === "admin" || raw.audience === "user") {
    return raw.audience;
  }

  // 2. recipient_is_staff (kama backend itaongeza baadaye)
  if (typeof raw.recipient_is_staff === "boolean") {
    return raw.recipient_is_staff ? "admin" : "user";
  }

  // 3. Notification type inayohusiana na admin
  if (raw.notification_type && ADMIN_NOTIFICATION_TYPES.has(raw.notification_type)) {
    return "admin";
  }

  // 4. Kama notification haihusiani na user maalum (broadcast kwa admin)
  if (!raw.user && !raw.recipient && raw.related_object_type === "system") {
    return "admin";
  }

  // 5. Default
  return "user";
}

// ============================================================
// STORAGE HELPERS
// ============================================================
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

function sortNewest(list) {
  return [...list].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

// ============================================================
// NORMALIZER
// ============================================================
function norm(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    audience: getNotificationAudience(raw),
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
    userId: raw.user ?? raw.recipient ?? null,
  };
}

// ============================================================
// HYDRATE FROM API
// ============================================================
export async function hydrateNotificationsFromApi() {
  try {
    const data = await notificationsApi.list({ page_size: 100 });
    const rawList = Array.isArray(data) ? data : data?.results || [];
    const normalized = rawList.map(norm).filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// READS
// ============================================================
export function getNotifications(audience) {
  return sortNewest(read().filter((n) => n.audience === audience));
}

export function getUnreadCount(audience) {
  return getNotifications(audience).filter((n) => !n.read).length;
}

// ============================================================
// MUTATIONS
// ============================================================
export async function markNotificationReadAsync(id) {
  try {
    await notificationsApi.markRead(id);
    write(
      read().map((n) =>
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
      )
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function markAllNotificationsReadAsync(audience) {
  try {
    await notificationsApi.markAllRead();
    write(
      read().map((n) =>
        n.audience === audience
          ? { ...n, read: true, readAt: new Date().toISOString() }
          : n
      )
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function removeNotificationAsync(id) {
  try {
    await notificationsApi.remove(id);
    write(read().filter((n) => n.id !== id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export function clearNotifications(audience) {
  write(read().filter((n) => n.audience !== audience));
  return read();
}

/** @deprecated Notifications are backend-emitted. */
export function pushNotification() {
  /* no-op */
}

// ============================================================
// HOOKS
// ============================================================
export function useNotifications(audience) {
  const [all, setAll] = useState(() => read());

  useEffect(() => {
    hydrateNotificationsFromApi();
    const sync = () => setAll(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);

  const notifications = sortNewest(all.filter((n) => n.audience === audience));
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markRead: markNotificationReadAsync,
    markAllRead: () => markAllNotificationsReadAsync(audience),
    remove: removeNotificationAsync,
    clearAll: () => clearNotifications(audience),
  };
}

// ============================================================
// LOCALIZATION HELPER
// ============================================================
export function getLocalizedField(field, lang = "sw") {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field?.[lang] || field?.sw || "";
}

// ============================================================
// LEGACY SHIMS — all no-ops now. Backend owns emission.
// ============================================================
export function notifyBoostPurchased() {}
export function notifyLeadingPurchased() {}
export function notifyAdvertisementPurchased() {}
export function notifyListingFeePaid() {}
export function notifyAdmin() {}
export function notifyNewMessage() {}
export function notifyReservationExpiringSoon() {}
export function notifyListingReleased() {}
export function notifyDisputeResolved() {}
export function notifyPaymentProofSubmitted() {}
export function notifyBundlePurchased() {}
export function notifyListingApproved() {}
export function notifyListingRejected() {}
export function notifyListingSubmittedForReview() {}
export function notifyListingExpiringSoon() {}
export function notifyListingExpired() {}
export function notifyPriceDrop() {}
export function notifyNewLead() {}
export function notifySearchMatch() {}
export function notifyReservationCreated() {}
export function notifyOfferAccepted() {}
export function notifyDealCompleted() {}
export function notifyAccountSuspended() {}
export function notifyAccountReactivated() {}
export function notifyVerificationSubmitted() {}
export function notifyTicketCreated() {}
export function notifyTicketReplied() {}
export function notifyTicketResolved() {}
export function notifyPaymentConfirmed() {}
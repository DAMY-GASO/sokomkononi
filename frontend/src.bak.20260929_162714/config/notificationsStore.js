// ============================================================
// notificationsStore.js — API-only via /api/notifications/
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

// Map backend notification_type → admin section key (used by
// AdminDashboard.openNotification to navigate somewhere sensible).
const TYPE_TO_TARGET = {
  LISTING_CREATED: "moderation",
  LISTING_APPROVED: "moderation",
  LISTING_REJECTED: "moderation",
  LISTING_DELETED: "trash",
  LISTING_RESTORED: "moderation",
  LISTING_RELEASED: "moderation",
  LISTING_EXPIRED: "moderation",
  LISTING_FEE_PAID: "revenue",
  ACCOUNT_DELETED: "users",
  ACCOUNT_RESTORED: "users",
  NEW_OFFER: "deals",
  OFFER_COUNTERED: "deals",
  OFFER_ACCEPTED: "deals",
  TRANSACTION_CREATED: "deals",
  RESERVATION_CREATED: "deals",
  RESERVATION_PAID: "deals",
  RESERVATION_EXPIRING: "deals",
  RESERVATION_EXPIRED: "deals",
  INSPECTION_STARTED: "deals",
  INSPECTION_COMPLETED: "deals",
  BUYER_DECISION: "deals",
  PAYMENT_PROOF_UPLOADED: "deals",
  PAYMENT_CONFIRMED: "deals",
  TRANSACTION_COMPLETED: "deals",
  TRANSACTION_CANCELLED: "deals",
  WAITING_LIST_JOINED: "deals",
  WAITING_LIST_AVAILABLE: "deals",
  BOOST_ACTIVATED: "promotions",
  BOOST_PURCHASED: "promotions",
  LEADING_PURCHASED: "promotions",
  ADVERTISEMENT_PURCHASED: "promotions",
  MESSAGE_RECEIVED: "support",
  BUNDLE_PURCHASED: "revenue",
  DISPUTE_RESOLVED: "deals",
};

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
  return [...list].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
function norm(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    audience: "user",
    type: raw.notification_type,
    title: raw.title,
    body: raw.message,
    at: raw.created_at,
    read: !!raw.is_read,
    readAt: raw.read_at,
    link: raw.action_url,
    target: TYPE_TO_TARGET[raw.notification_type] || null,
    meta: {
      related_object_type: raw.related_object_type,
      related_object_id: raw.related_object_id,
    },
    priority: raw.priority,
  };
}

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

export function getNotifications(audience) {
  const all = sortNewest(read());
  if (!audience || audience === "user") return all;
  if (audience === "admin") return [];
  return all;
}
export function getUnreadCount(audience) {
  return getNotifications(audience).filter((n) => !n.read).length;
}

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
        !audience || audience === "user" || n.audience === audience
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
  const notifications = sortNewest(
    audience && audience !== "user"
      ? []
      : all.filter((n) => n.audience === "user" || !audience)
  );
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

// ✅ FIXED — was `field?.[lang] || field?.sw || ""`, which returned "" when
// lang="sw" and only `en` was present (and vice versa).
export function getLocalizedField(field, lang = "sw") {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field?.[lang] || field?.sw || field?.en || "";
}

// ── Deprecated shims (backend emits notifications) ──────────
export function pushNotification() {}
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

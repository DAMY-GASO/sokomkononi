// ============================================================
// notificationsStore.js — API-only via /api/notifications/
// + Local notifications za admin (USER_DELETED, n.k.)
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
  // ⬇️ MPYA — Local admin notifications
  USER_DELETED: "user.deleted",
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
  // ⬇️ MPYA — Local admin notifications
  USER_DELETED: "trash",
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
// Notifications whose audience is "admin" by default (platform activity)
const ADMIN_BY_DEFAULT = new Set([
  "LISTING_CREATED", "LISTING_DELETED", "LISTING_RESTORED",
  "ACCOUNT_DELETED", "ACCOUNT_RESTORED", "USER_DELETED",
  "NEW_OFFER", "DISPUTE_RESOLVED",
]);

function inferAudience(raw) {
  if (raw && typeof raw.audience === "string") return raw.audience;
  const t = String(raw?.notification_type || "").toUpperCase();
  return ADMIN_BY_DEFAULT.has(t) ? "admin" : "user";
}

function norm(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    audience: inferAudience(raw),
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

    // ⬇️ MUHIMU: usifute local admin notifications wakati wa hydrate.
    // Tunachukua zote zilizopo (local + api), kisha tunaunganisha.
    const existing = read();
    const localAdminNotifs = existing.filter(
      (n) => n.audience === "admin" || n._local === true
    );

    // Dedupe: API notifs + local admin notifs
    const apiIds = new Set(normalized.map((n) => String(n.id)));
    const merged = [
      ...normalized,
      ...localAdminNotifs.filter((n) => !apiIds.has(String(n.id))),
    ];

    write(merged);
    return { ok: true, count: merged.length };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export function getNotifications(audience) {
  const all = sortNewest(read());
  if (audience === "admin") {
    return all.filter((n) => n.audience === "admin");
  }
  if (!audience || audience === "user") {
    return all.filter((n) => n.audience === "user" || !n.audience);
  }
  return all;
}
export function getUnreadCount(audience) {
  return getNotifications(audience).filter((n) => !n.read).length;
}

export async function markNotificationReadAsync(id) {
  try {
    // Kama ni local notification, usiite API
    const target = read().find((n) => n.id === id);
    if (!target?._local) {
      await notificationsApi.markRead(id);
    }
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
    // Kama audience ni "admin", usiite API (local pekee)
    if (audience !== "admin") {
      await notificationsApi.markAllRead();
    }
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
    // Kama ni local, usiite API
    const target = read().find((n) => n.id === id);
    if (!target?._local) {
      await notificationsApi.remove(id);
    }
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

  // Chuja kwa audience
  let notifications;
  if (audience === "admin") {
    notifications = sortNewest(all.filter((n) => n.audience === "admin"));
  } else if (audience === "user") {
    notifications = sortNewest(
      all.filter((n) => n.audience === "user" || !n.audience)
    );
  } else {
    notifications = sortNewest(all);
  }

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

// ============================================================
// LOCAL ADMIN NOTIFICATIONS
// Hutumika wakati mtumiaji anafuta kitu. Backend inaweza pia
// kutuma notification kwa admins (kupitia signal), lakini hii
// inahakikisha admin anaona haraka bila kusubiri refresh.
// ============================================================

/**
 * Tuma notification kwa admin.
 */
export function notifyAdmin({
  type = "USER_DELETED",
  title,
  message,
  meta = {},
  itemType,
  itemId,
  itemTitle,
  userId,
  userName,
} = {}) {
  if (typeof window === "undefined") return null;

  try {
    const all = read();
    const adminNotification = {
      id: `adm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      audience: "admin",
      type,
      title: title || "Mtumiaji amefuta",
      body: message || "",
      at: new Date().toISOString(),
      read: false,
      readAt: null,
      link: null,
      target: "trash",
      meta: {
        ...meta,
        userId,
        userName,
        itemType,
        itemId,
        itemTitle,
        source: "user_delete",
      },
      priority: "HIGH",
      _local: true,
    };

    write([adminNotification, ...all]);
    return adminNotification;
  } catch (err) {
    console.warn("[notificationsStore] notifyAdmin failed:", err);
    return null;
  }
}

/**
 * Helper rahisi kwa kufuta kwa mtumiaji.
 */
export function notifyAdminAboutDeletion({
  itemType,
  itemId,
  itemTitle,
  user,
  reason = "",
}) {
  const userName = user?.name || user?.email || "Mtumiaji";
  const typeLabel =
    {
      listing: { sw: "tangazo", en: "listing" },
      message: { sw: "ujumbe", en: "message" },
      deal: { sw: "deal", en: "deal" },
      verification: { sw: "uthibitisho", en: "verification" },
    }[itemType] || { sw: "kitu", en: "item" };

  return notifyAdmin({
    type: "USER_DELETED",
    title: `${userName} amefuta ${typeLabel.sw}`,
    message: reason
      ? `${userName} amefuta ${typeLabel.sw}: "${itemTitle}". Sababu: ${reason}`
      : `${userName} amefuta ${typeLabel.sw}: "${itemTitle}".`,
    meta: {
      actionUrl: `/smk-control-9x7k/trash`,
    },
    itemType,
    itemId,
    itemTitle,
    userId: user?.id,
    userName,
  });
}

// ── Deprecated shims (backend emits notifications) ──────────
export function pushNotification() {}
export function notifyBoostPurchased() {}
export function notifyLeadingPurchased() {}
export function notifyAdvertisementPurchased() {}
export function notifyListingFeePaid() {}
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

// ============================================================
// NOTIFICATION ROUTE RESOLVER
// ============================================================
export function resolveNotificationRoute(notif, side = "seller") {
  if (!notif) return "/dashboard/notifications";

  const explicit = typeof notif.link === "string" ? notif.link.trim() : "";
  if (explicit && explicit.startsWith("/")) return explicit;
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit;

  const prefix = side === "buyer" ? "/dashboard/buyer" : "/dashboard";
  const rawType = String(notif.type || "").toUpperCase();
  const type = rawType.replace(/\./g, "_");
  const meta = notif.meta || {};
  const relatedId = meta.related_object_id;

  const withQuery = (base, key) =>
    relatedId != null && relatedId !== ""
      ? `${base}?${key}=${encodeURIComponent(relatedId)}`
      : base;

  switch (type) {
    case "MESSAGE_RECEIVED":
    case "MESSAGE":
    case "NEW_MESSAGE":
      return withQuery(`${prefix}/messages`, "c");

    case "DEAL_ROOM_CREATED":
    case "DEAL_ROOM":
    case "NEW_DEAL_ROOM":
    case "DEAL_CREATED":
    case "NEW_OFFER":
    case "OFFER_COUNTERED":
    case "OFFER_ACCEPTED":
    case "RESERVATION_CREATED":
    case "RESERVATION_PAID":
    case "RESERVATION_EXPIRING":
    case "RESERVATION_EXPIRED":
    case "INSPECTION_STARTED":
    case "INSPECTION_COMPLETED":
    case "BUYER_DECISION":
    case "PAYMENT_PROOF_UPLOADED":
    case "PAYMENT_PROOF_SUBMITTED":
    case "PAYMENT_CONFIRMED":
    case "TRANSACTION_CREATED":
    case "TRANSACTION_COMPLETED":
    case "TRANSACTION_CANCELLED":
    case "DISPUTE_RESOLVED":
      return withQuery(`${prefix}/deals`, "deal");

    case "LISTING_CREATED":
    case "LISTING_APPROVED":
    case "LISTING_REJECTED":
    case "LISTING_RELEASED":
    case "LISTING_EXPIRED":
    case "LISTING_DELETED":
    case "LISTING_RESTORED":
    case "LISTING_SUBMITTED":
      return `${prefix}/listings`;

    case "LISTING_FEE_PAID":
    case "SUCCESS_FEE_PAID":
      return `${prefix}/transactions`;

    case "BOOST_PURCHASED":
    case "BOOST_ACTIVATED":
      return `${prefix}/boost`;

    case "LEADING_PURCHASED":
      return `${prefix}/leading`;

    case "ADVERTISEMENT_PURCHASED":
      return `${prefix}/advertise`;

    case "BUNDLE_PURCHASED":
      return `${prefix}/bundles`;

    case "WAITING_LIST_JOINED":
    case "WAITING_LIST_AVAILABLE":
      return "/dashboard/buyer/waiting";

    default:
      return `${prefix}/notifications`;
  }
}

export function notificationCtaKey(notif) {
  const rawType = String(notif?.type || "").toUpperCase();
  const type = rawType.replace(/\./g, "_");
  switch (type) {
    case "MESSAGE_RECEIVED":
    case "MESSAGE":
    case "NEW_MESSAGE":
      return "reply";
    case "DEAL_ROOM_CREATED":
    case "DEAL_ROOM":
    case "NEW_DEAL_ROOM":
    case "DEAL_CREATED":
      return "open";
    case "LISTING_APPROVED":
    case "LISTING_RELEASED":
      return "view_listing";
    default:
      return "view";
  }
}
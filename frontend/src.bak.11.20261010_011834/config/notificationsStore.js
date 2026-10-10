// ============================================================
// notificationsStore.js — API-only via /api/notifications/
// Backend ni single source of truth. Hakuna local simulations.
// ============================================================
import { useEffect, useState } from "react";
import { notificationsApi } from "../api/notifications.js";
import { ADMIN_PATH } from "./adminPath.js";

const KEY = "sokomkononi_notifications_v1";
const EV = "sokomkononi:notifications-updated";

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
  VERIFICATION_REQUEST: "verification",
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
  return [...list].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

function norm(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    audience: raw.audience || "user",
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
    write(sortNewest(normalized));
    return { ok: true, count: normalized.length };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export function getNotifications(audience) {
  const all = sortNewest(read());
  if (audience === "admin") {
    return all.filter((n) => n.audience === "admin");
  }
  if (audience === "user") {
    return all.filter((n) => n.audience === "user" || !n.audience);
  }
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
    await notificationsApi.hardRemove(id);
    write(read().filter((n) => n.id !== id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function clearNotificationsAsync(audience) {
  const target = audience || "user";
  try {
    await notificationsApi.hardRemoveAll({ audience: target });
    const remaining = read().filter((n) => {
      if (target === "user") {
        return n.audience === "admin";
      }
      if (target === "admin") {
        return n.audience !== "admin";
      }
      return n.audience !== target;
    });
    write(remaining);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function notifyAdminAboutDeletion(listing) {
  try {
    const deleter =
      listing?.deleted_by?.name ||
      listing?.deleted_by?.username ||
      listing?.deleted_by?.email ||
      null;

    const baseMessage =
      listing?.title ||
      listing?.name ||
      `Listing #${listing?.id ?? "unknown"} has been deleted.`;

    const payload = {
      notification_type: "LISTING_DELETED",
      audience: "admin",
      title: "Listing deleted by seller",
      message: deleter
        ? `${baseMessage} — deleted by ${deleter}`
        : baseMessage,
      related_object_type: "listing",
      related_object_id: listing?.id ?? null,
      action_url: listing?.id
        ? `${ADMIN_PATH}/trash?listing=${listing.id}`
        : `${ADMIN_PATH}/trash`,
      priority: "normal",
    };

    const res = await notificationsApi.notifyAdmin(payload);
    await hydrateNotificationsFromApi();
    return { ok: true, data: res };
  } catch (err) {
    console.error("[notifyAdminAboutDeletion] failed:", err);
    return { ok: false, error: err };
  }
}

let _notificationsHydratePromise = null;
function _dedupedHydrate() {
  if (_notificationsHydratePromise) return _notificationsHydratePromise;
  _notificationsHydratePromise = hydrateNotificationsFromApi().finally(() => {
    _notificationsHydratePromise = null;
  });
  return _notificationsHydratePromise;
}

export function useNotifications(audience, enabled = true) {
  const [all, setAll] = useState(() => read());

  useEffect(() => {
    if (!enabled) return undefined;
    _dedupedHydrate();
    const sync = () => setAll(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, [enabled]);

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
    clearAll: () => clearNotificationsAsync(audience),
  };
}

export function getLocalizedField(field, lang = "sw") {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field?.[lang] || field?.sw || field?.en || "";
}

export function resolveNotificationRoute(notif, side = "seller") {
  if (!notif) return "/dashboard/notifications";

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
      // Buyer side has no listings page — fall back to their notifications.
      return side === "buyer"
        ? `${prefix}/notifications`
        : `${prefix}/listings`;

    case "LISTING_FEE_PAID":
    case "SUCCESS_FEE_PAID":
      return `${prefix}/transactions`;

    case "BOOST_PURCHASED":
    case "BOOST_ACTIVATED":
      return side === "buyer" ? `${prefix}/notifications` : `${prefix}/boost`;

    case "LEADING_PURCHASED":
      return side === "buyer" ? `${prefix}/notifications` : `${prefix}/leading`;

    case "ADVERTISEMENT_PURCHASED":
      return side === "buyer" ? `${prefix}/notifications` : `${prefix}/advertise`;

    case "BUNDLE_PURCHASED":
      return `${prefix}/bundles`;

    case "WAITING_LIST_JOINED":
    case "WAITING_LIST_AVAILABLE":
      return "/dashboard/buyer/waiting";

    case "VERIFICATION_REQUEST":
    case "ACCOUNT_VERIFIED":
    case "ACCOUNT_REJECTED":
      return `${prefix}/verification`;

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
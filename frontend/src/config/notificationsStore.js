// ============================================================
// notificationsStore.js — API-only via /api/notifications/
// Backend ni single source of truth. Hakuna local simulations.
//
// Marekebisho:
//  - resolveNotificationRoute: inashughulikia admin (audience === "admin")
//    kwa kutumia `notif.link` (action_url) moja kwa moja.
//  - SASISHO: Ongeza handling ya NotificationType ZOTE kutoka
//    apps/notifications/models.py — hakuna type inayoanguka kwenye
//    default isivyo sahihi.
//  - Fallback smart kwa types zisizojulikana.
// ============================================================
import { useEffect, useState } from "react";
import { notificationsApi } from "../api/notifications.js";
import { ADMIN_PATH } from "./adminPath.js";

const KEY = "sokomkononi_notifications_v1";
const DELETED_KEY = "sokomkononi_notifications_deleted_v1";
const EV = "sokomkononi:notifications-updated";

function readDeletedSet() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_KEY);
    if (!raw) return new Set();
    const p = JSON.parse(raw);
    return new Set(Array.isArray(p) ? p.map(String) : []);
  } catch { return new Set(); }
}

function writeDeletedSet(set) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DELETED_KEY,
      JSON.stringify(Array.from(set).slice(-500))
    );
  } catch { /* noop */ }
}

function markDeleted(id) {
  if (id == null) return;
  const s = readDeletedSet();
  s.add(String(id));
  writeDeletedSet(s);
}

function unmarkDeleted(id) {
  const s = readDeletedSet();
  s.delete(String(id));
  writeDeletedSet(s);
}

export function clearDeletedNotifications() {
  writeDeletedSet(new Set());
}

// ============================================================
// MAP NOTIFICATION TYPE → UI TYPE (icon + color)
// Inashughulikia NotificationType ZOTE kutoka backend.
// ============================================================
function mapNotificationType(rawType) {
  const t = String(rawType || "").toUpperCase();
  if (!t) return "system";

  // ── Messages ──
  if (t.includes("MESSAGE")) return "message";

  // ── Deals / Transactions / Inspection / Reservation / Offers ──
  if (
    t.includes("OFFER") ||
    t.includes("TRANSACTION") ||
    t.includes("RESERVATION") ||
    t.includes("INSPECTION") ||
    t.includes("BUYER_DECISION") ||
    t.includes("DEAL") ||
    t === "PAYMENT_CONFIRMED"
  )
    return "deal";

  // ── Payment proof (inaonekana kama receipt) ──
  if (t.includes("PAYMENT_PROOF")) return "payment";

  // ── Promotions ──
  if (t === "BOOST_ACTIVATED" || t === "BOOST_PURCHASED") return "boost";
  if (t === "LEADING_PURCHASED") return "leading";
  if (t === "ADVERTISEMENT_PURCHASED") return "advertisement";

  // ── Listings / Fees ──
  if (t === "LISTING_FEE_PAID" || t === "SUCCESS_FEE_PAID") return "listing_fee";
  if (t === "LISTING_PAYMENT_REQUESTED") return "listing_fee";
  if (
    t.startsWith("LISTING_") ||
    t === "PRICE_DROP" ||
    t === "SEARCH_ALERT"
  )
    return "listing_released";

  // ── Verification / Account ──
  if (
    t.includes("VERIFICATION") ||
    t.includes("ACCOUNT_") ||
    t === "ACCOUNT_VERIFIED" ||
    t === "ACCOUNT_DELETED" ||
    t === "ACCOUNT_RESTORED"
  )
    return "verified";

  // ── Waiting list ──
  if (t.includes("WAITING_LIST")) return "reminder";

  // ── Dispute / Report / Ticket / Support (MPYA) ──
  if (
    t.includes("DISPUTE") ||
    t.includes("REPORT") ||
    t.includes("TICKET") ||
    t.includes("SUPPORT")
  )
    return "dispute.resolved";

  // ── Feedback (MPYA) ──
  if (t.includes("FEEDBACK")) return "feedback";

  // ── System (GENERAL, n.k.) ──
  return "system";
}

// ============================================================
// TYPE_TO_TARGET — used for admin
// ============================================================
const TYPE_TO_TARGET = {
  LISTING_CREATED: "moderation",
  LISTING_APPROVED: "moderation",
  LISTING_REJECTED: "moderation",
  LISTING_DELETED: "trash",
  LISTING_RESTORED: "moderation",
  LISTING_RELEASED: "moderation",
  LISTING_EXPIRED: "moderation",
  LISTING_NEEDS_EDIT: "moderation",
  LISTING_PAYMENT_REQUESTED: "moderation",
  LISTING_FINAL_APPROVED: "moderation",
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
  ACCOUNT_VERIFIED: "verification",
  PRICE_DROP: "listings",
  SEARCH_ALERT: "listings",
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
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("[store] localStorage write failed (quota?):", e);
    if (Array.isArray(list) && list.length > 100) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
      } catch { /* give up */ }
    }
  }
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
    audience: String(raw.audience || "user").toLowerCase() === "admin" ? "admin" : "user",
    type: mapNotificationType(raw.notification_type),
    rawType: raw.notification_type,
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
    const deleted = readDeletedSet();
    const normalized = rawList
      .map(norm)
      .filter(Boolean)
      .filter((n) => !deleted.has(String(n.id)));
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
  markDeleted(id);
  try {
    await notificationsApi.hardRemove(id);
    write(read().filter((n) => n.id !== id));
    return { ok: true };
  } catch (err) {
    write(read().filter((n) => n.id !== id));
    return { ok: false, error: err, soft: true };
  }
}

export async function clearNotificationsAsync(audience) {
  const target = audience || "user";
  read()
    .filter((n) =>
      target === "user" ? n.audience !== "admin" : n.audience === target
    )
    .forEach((n) => markDeleted(n.id));

  try {
    await notificationsApi.hardRemoveAll({ audience: target });
  } catch (err) {
  }

  const remaining = read().filter((n) => {
    if (target === "user") return n.audience === "admin";
    if (target === "admin") return n.audience !== "admin";
    return n.audience !== target;
  });
  write(remaining);
  return { ok: true };
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

// ============================================================
// RESOLVE NOTIFICATION ROUTE
// Inashughulikia NotificationType ZOTE kutoka backend.
// ============================================================
export function resolveNotificationRoute(notif, side = "seller") {
  if (!notif) return "/dashboard/notifications";

  // ── ADMIN — tumia `link` (action_url) moja kwa moja ──
  if (side === "admin" || notif.audience === "admin") {
    if (notif.link) return notif.link;
    return `${ADMIN_PATH}/notifications`;
  }

  const prefix = side === "buyer" ? "/dashboard/buyer" : "/dashboard";

  const rawType = String(notif.rawType || notif.type || "").toUpperCase();
  const type = rawType.replace(/\./g, "_");
  const meta = notif.meta || {};
  const relatedId = meta.related_object_id;
  const relatedType = String(meta.related_object_type || "").toLowerCase();

  const withQuery = (base, key) =>
    relatedId != null && relatedId !== ""
      ? `${base}?${key}=${encodeURIComponent(relatedId)}`
      : base;

  switch (type) {
    // ── Listing-specific ──
    case "PRICE_DROP":
    case "SEARCH_ALERT":
      return relatedId != null
        ? `/mali/${relatedId}`
        : `${prefix}/notifications`;

    case "LISTING_CREATED":
    case "LISTING_APPROVED":
    case "LISTING_REJECTED":
    case "LISTING_RELEASED":
    case "LISTING_EXPIRED":
    case "LISTING_DELETED":
    case "LISTING_RESTORED":
    case "LISTING_SUBMITTED":
    case "LISTING_NEEDS_EDIT":
    case "LISTING_FINAL_APPROVED":
      if (side === "buyer") return `${prefix}/notifications`;
      if (relatedId != null) return `/mali/${relatedId}`;
      return `${prefix}/listings`;

    case "LISTING_PAYMENT_REQUESTED":
      return `${prefix}/pay-listing`;

    case "LISTING_FEE_PAID":
    case "SUCCESS_FEE_PAID":
      return `${prefix}/listings`;

    // ── Messages ──
    case "MESSAGE_RECEIVED":
    case "MESSAGE":
    case "NEW_MESSAGE":
      return relatedType.includes("deal")
        ? withQuery(`${prefix}/deals`, "deal")
        : `${prefix}/deals`;

    // ── Deals / Transactions ──
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
    case "INSPECTION_REMINDER":
    case "INSPECTION_EXPIRING":
    case "BUYER_DECISION":
    case "PAYMENT_PROOF_UPLOADED":
    case "PAYMENT_PROOF_SUBMITTED":
    case "PAYMENT_PROOF_READY":
    case "PAYMENT_CONFIRMED":
    case "TRANSACTION_CREATED":
    case "TRANSACTION_COMPLETED":
    case "TRANSACTION_CANCELLED":
    case "DISPUTE_RESOLVED":
    case "FINAL_PAYMENT_UPLOADED":
    case "FINAL_PAYMENT_READY":
    case "SELLER_CONFIRMED":
      return withQuery(`${prefix}/deals`, "deal");

    // ── Payments / Bundles ──
    case "BUNDLE_PURCHASED":
      return `${prefix}/transactions`;

    // ── Promotions ──
    case "BOOST_PURCHASED":
    case "BOOST_ACTIVATED":
      return side === "buyer" ? `${prefix}/notifications` : `${prefix}/boost`;

    case "LEADING_PURCHASED":
      return side === "buyer" ? `${prefix}/notifications` : `${prefix}/leading`;

    case "ADVERTISEMENT_PURCHASED":
      return side === "buyer" ? `${prefix}/notifications` : `${prefix}/advertise`;

    // ── Waiting list ──
    case "WAITING_LIST_JOINED":
    case "WAITING_LIST_AVAILABLE":
      return side === "buyer"
        ? "/dashboard/buyer/waiting"
        : `${prefix}/notifications`;

    // ── Verification / Account ──
    case "VERIFICATION_REQUEST":
    case "ACCOUNT_VERIFIED":
    case "ACCOUNT_REJECTED":
    case "ACCOUNT_RESTORED":
      return `${prefix}/verification`;

    case "ACCOUNT_DELETED":
      return `${prefix}/notifications`; // Hakuna sehemu maalum

    // ── Reports / Tickets / Support (MPYA) ──
    case "DEAL_REPORT":
    case "REPORT_CREATED":
    case "REPORT_RESOLVED":
    case "REPORT_REPLIED":
    case "TICKET_CREATED":
    case "TICKET_RESOLVED":
    case "TICKET_REPLIED":
    case "TICKET_CLOSED":
    case "TICKET_UPDATED":
    case "SUPPORT_REPLIED":
      return `${prefix}/safety`;

    // ── Feedback (MPYA) ──
    case "FEEDBACK_RECEIVED":
    case "FEEDBACK_REPLIED":
    case "FEEDBACK_RESOLVED":
      return `${prefix}/feedback`;

    // ── GENERAL — hakuna sehemu maalum ──
    case "GENERAL":
      return `${prefix}/notifications`;

    // ── FALLBACK SMART kwa types zisizojulikana ──
    default:
      if (
        type.includes("REPORT") ||
        type.includes("TICKET") ||
        type.includes("SUPPORT") ||
        type.includes("SAFETY")
      ) {
        return `${prefix}/safety`;
      }
      if (type.includes("FEEDBACK")) {
        return `${prefix}/feedback`;
      }
      if (
        type.includes("INSPECTION") ||
        type.includes("PAYMENT") ||
        type.includes("DEAL") ||
        type.includes("RESERVATION") ||
        type.includes("TRANSACTION")
      ) {
        return withQuery(`${prefix}/deals`, "deal");
      }
      if (type.includes("VERIFICATION") || type.includes("ACCOUNT")) {
        return `${prefix}/verification`;
      }
      if (type.includes("WAITING")) {
        return side === "buyer"
          ? "/dashboard/buyer/waiting"
          : `${prefix}/notifications`;
      }
      if (type.includes("LISTING")) {
        return side === "buyer"
          ? `${prefix}/notifications`
          : `${prefix}/listings`;
      }
      return `${prefix}/notifications`;
  }
}

// ============================================================
// CTA KEY — kwa button label
// ============================================================
export function notificationCtaKey(notif) {
  const rawType = String(notif?.rawType || notif?.type || "").toUpperCase();
  const type = rawType.replace(/\./g, "_");
  const meta = notif?.meta || {};
  const relatedId = meta.related_object_id;

  switch (type) {
    case "PRICE_DROP":
    case "SEARCH_ALERT":
      return relatedId != null ? `/mali/${relatedId}` : "view";

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

    // ── MPYA ──
    case "DEAL_REPORT":
    case "REPORT_CREATED":
    case "REPORT_RESOLVED":
    case "TICKET_CREATED":
    case "TICKET_RESOLVED":
    case "TICKET_REPLIED":
    case "SUPPORT_REPLIED":
      return "view";

    case "FEEDBACK_RECEIVED":
    case "FEEDBACK_REPLIED":
      return "view";

    case "INSPECTION_REMINDER":
    case "FINAL_PAYMENT_UPLOADED":
    case "SELLER_CONFIRMED":
      return "open";

    default:
      return "view";
  }
}
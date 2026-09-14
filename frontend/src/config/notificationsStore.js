// ============================================================
// notificationsStore.js
// CHANZO KIMOJA CHA UKWELI kwa taarifa (notifications) za mfumo mzima —
// zote mbili: taarifa za mtumiaji (NotificationsPage.jsx, bell ya
// DashboardShell.jsx) NA taarifa za admin (bell ya AdminDashboard.jsx),
// zikiwa kwenye orodha MOJA, zikitofautishwa na `audience`.
//
// BILINGUAL: kila notification ina `title` na `body` kama { sw, en }.
// UI inachagua lugha sahihi kwa kutumia `lang` prop.
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useNotifications) hazitahitaji kubadilika.
//
// MWISHO WA MABADILIKO:
//   - notifyBundlePurchased() imeongezwa (Revenue Bundles)
// ============================================================

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "sokomkononi_notifications_v1";
const UPDATE_EVENT = "sokomkononi:notifications-updated";

// ---- Muda halisi (siyo maandishi tuli) — UI inatumia timeAgo(). ----
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

function fmtTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

// ============================================================
// CANONICAL EVENTS (Muongozo §8.4)
// ============================================================
export const NOTIFICATION_EVENTS = {
  // --- User-side (buyer + seller) ---
  LISTING_APPROVED:         "listing.approved",
  LISTING_REJECTED:         "listing.rejected",
  LISTING_RELEASED:         "listing.released",
  LISTING_EXPIRED:          "listing.expired",
  LISTING_FEE_PAID:         "listing_fee.paid",
  BOOST_PURCHASED:          "boost.purchased",
  LEADING_PURCHASED:        "leading.purchased",
  ADVERTISEMENT_PURCHASED:  "advertisement.purchased",
  MESSAGE_RECEIVED:         "message.received",
  RESERVATION_CREATED:      "reservation.created",
  RESERVATION_EXPIRING:     "reservation.expiring",
  PAYMENT_PROOF_SUBMITTED:  "payment.proof_submitted",
  PAYMENT_CONFIRMED:        "payment.confirmed",
  INSPECTION_DECISION_MADE: "inspection.decision_made",
  DISPUTE_RESOLVED:         "dispute.resolved",
  BUNDLE_PURCHASED:         "bundle.purchased",     // ← MPYA
  BUNDLE_SALE_ADMIN:        "admin.bundle_sale",     // ← MPYA
  // --- Admin-side ---
  LISTING_PENDING:          "admin.listing_pending",
  DISPUTE_FILED:            "admin.dispute_filed",
  PAYMENT_ISSUE:            "admin.payment_issue",
  FRAUD_FLAG:               "admin.fraud_flag",
};

// ============================================================
// SEED_NOTIFICATIONS — tupu. Data itakuja kutoka backend baadaye.
// ============================================================
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
// USIMAMIZI WA JUMLA
// ------------------------------------------------------------
export function getNotifications(audience) {
  const list = readAll().filter((n) => n.audience === audience);
  return sortByNewest(list);
}

export function getUnreadCount(audience) {
  return getNotifications(audience).filter((n) => !n.read).length;
}

export function pushNotification({
  audience,
  type,
  title,        // ← sasa inaweza kuwa string au { sw, en }
  body = "",    // ← sasa inaweza kuwa string au { sw, en }
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
  return next;
}

export function markAllNotificationsRead(audience) {
  const next = readAll().map((n) => (n.audience === audience ? { ...n, read: true } : n));
  saveAll(next);
  return next;
}

export function removeNotification(id) {
  const next = readAll().filter((n) => n.id !== id);
  saveAll(next);
  return next;
}

export function clearNotifications(audience) {
  const next = readAll().filter((n) => n.audience !== audience);
  saveAll(next);
  return next;
}

/**
 * Hook — inarudisha notifications kwa `audience`.
 * `title` na `body` zinaweza kuwa string au { sw, en }.
 */
export function useNotifications(audience) {
  const [all, setAll] = useState(() => readAll());

  useEffect(() => {
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
// EMITTERS — kila moja ina title/body kwa { sw, en }
// ============================================================

// 1) BOOST
export function notifyBoostPurchased({ listingId, listingTitle, packageLabel, expiresAt, amount }) {
  const untilText = expiresAt
    ? new Date(expiresAt).toLocaleDateString("sw-TZ", { day: "numeric", month: "long" })
    : "";

  pushNotification({
    audience: "user",
    type: "boost",
    title: { sw: "Boost Imewekwa", en: "Boost Applied" },
    body: {
      sw: `"${listingTitle}" sasa ina ${packageLabel} na itaonekana zaidi kwa wanunuzi${untilText ? ` hadi ${untilText}` : ""}.`,
      en: `"${listingTitle}" now has ${packageLabel} and will be more visible to buyers${untilText ? ` until ${untilText}` : ""}.`,
    },
    link: "/dashboard/boost",
    meta: { listingId, amount },
  });
  pushNotification({
    audience: "admin",
    type: "boost",
    title: {
      sw: `Malipo ya Boost yamepokelewa — "${listingTitle}" (${fmtTZS(amount)})`,
      en: `Boost payment received — "${listingTitle}" (${fmtTZS(amount)})`,
    },
    body: { sw: `Package: ${packageLabel}`, en: `Package: ${packageLabel}` },
    target: "revenue",
    meta: { listingId, amount },
  });
}

// 2) LEADING FEE
export function notifyLeadingPurchased({ listingId, listingTitle, expiresAt, amount }) {
  const untilText = expiresAt
    ? new Date(expiresAt).toLocaleDateString("sw-TZ", { day: "numeric", month: "long" })
    : "";

  pushNotification({
    audience: "user",
    type: "leading",
    title: { sw: "Leading Fee Imewekwa", en: "Leading Fee Applied" },
    body: {
      sw: `"${listingTitle}" sasa ina kipaumbele maalum kwenye matokeo ya utafutaji${untilText ? ` hadi ${untilText}` : ""}.`,
      en: `"${listingTitle}" now has priority in search results${untilText ? ` until ${untilText}` : ""}.`,
    },
    link: "/dashboard/leading",
    meta: { listingId, amount },
  });
  pushNotification({
    audience: "admin",
    type: "leading",
    title: {
      sw: `Malipo ya Leading Fee yamepokelewa — "${listingTitle}" (${fmtTZS(amount)})`,
      en: `Leading Fee payment received — "${listingTitle}" (${fmtTZS(amount)})`,
    },
    body: "",
    target: "revenue",
    meta: { listingId, amount },
  });
}

// 3) ADVERTISEMENT
export function notifyAdvertisementPurchased({ listingId, listingTitle, placement, amount, expiresAt }) {
  const untilText = expiresAt
    ? new Date(expiresAt).toLocaleDateString("sw-TZ", { day: "numeric", month: "long" })
    : "";

  pushNotification({
    audience: "user",
    type: "advertisement",
    title: { sw: "Tangazo (Banner) Limewekwa", en: "Advertisement (Banner) Applied" },
    body: {
      sw: `Banner ya "${listingTitle}"${placement ? ` kwenye ${placement}` : ""} sasa inaonekana${untilText ? ` hadi ${untilText}` : ""}.`,
      en: `Banner for "${listingTitle}"${placement ? ` on ${placement}` : ""} is now visible${untilText ? ` until ${untilText}` : ""}.`,
    },
    link: "/dashboard/advertise",
    meta: { listingId, amount, placement },
  });
  pushNotification({
    audience: "admin",
    type: "ads",
    title: {
      sw: `Malipo ya Advertisement yamepokelewa — "${listingTitle}" (${fmtTZS(amount)})`,
      en: `Advertisement payment received — "${listingTitle}" (${fmtTZS(amount)})`,
    },
    body: placement
      ? { sw: `Placement: ${placement}`, en: `Placement: ${placement}` }
      : "",
    target: "revenue",
    meta: { listingId, amount, placement },
  });
}

// 4) LISTING FEE
export function notifyListingFeePaid({ listingId, listingTitle, amount }) {
  pushNotification({
    audience: "user",
    type: "listing_fee",
    title: {
      sw: "Malipo ya Listing Fee Yamethibitishwa",
      en: "Listing Fee Payment Confirmed",
    },
    body: {
      sw: `"${listingTitle}" sasa ni Live na inaonekana kwa wanunuzi.`,
      en: `"${listingTitle}" is now Live and visible to buyers.`,
    },
    link: "/dashboard/listings",
    meta: { listingId, amount },
  });
  pushNotification({
    audience: "admin",
    type: "listing_fee",
    title: {
      sw: `Listing Fee imelipwa — "${listingTitle}" (${fmtTZS(amount)})`,
      en: `Listing Fee paid — "${listingTitle}" (${fmtTZS(amount)})`,
    },
    body: { sw: "Tangazo sasa ni Live.", en: "Listing is now Live." },
    target: "revenue",
    meta: { listingId, amount },
  });
}

// 5) ADMIN (generic)
export function notifyAdmin({ type, title, body = "", target = null, meta }) {
  return pushNotification({ audience: "admin", type, title, body, target, meta });
}

// 6) MESSAGE
export function notifyNewMessage({ conversationId, senderName, preview }) {
  return pushNotification({
    audience: "user",
    type: "message",
    title: {
      sw: `Ujumbe mpya kutoka ${senderName}`,
      en: `New message from ${senderName}`,
    },
    body: preview || "",
    link: conversationId ? `/dashboard/messages?c=${conversationId}` : "/dashboard/messages",
    meta: { conversationId },
  });
}

// 7) RESERVATION EXPIRING SOON
export function notifyReservationExpiringSoon({ dealId, listingTitle, hoursLeft }) {
  return pushNotification({
    audience: "user",
    type: "reminder",
    title: {
      sw: "Reservation Inakaribia Kuisha",
      en: "Reservation Expiring Soon",
    },
    body: {
      sw: `"${listingTitle}" — muda wa reservation unabaki chini ya saa ${hoursLeft}. Kamilisha malipo/hatua zinazofuata kabla haijaisha, la sivyo deal itaghairika kiotomatiki.`,
      en: `"${listingTitle}" — less than ${hoursLeft} hour(s) remain on the reservation. Complete payment/next steps before it expires, otherwise the deal will be auto-cancelled.`,
    },
    link: "/dashboard/deals",
    meta: { dealId },
  });
}

// 8) LISTING RELEASED (WAITLIST)
export function notifyListingReleased({ listingId, listingTitle }) {
  return pushNotification({
    audience: "user",
    type: "listing_released",
    title: {
      sw: "Mali Uliyokuwa Ukiisubiri Sasa Iko Huru",
      en: "The Listing You Were Waiting For Is Now Available",
    },
    body: {
      sw: `"${listingTitle}" haipo tena reserved/sold — sasa unaweza kuwasiliana na muuzaji au kufanya ofa.`,
      en: `"${listingTitle}" is no longer reserved/sold — you can now contact the seller or make an offer.`,
    },
    link: "/dashboard/waiting-list",
    meta: { listingId },
  });
}

// 9) DISPUTE RESOLVED
export function notifyDisputeResolved({ dealId, listingTitle, action, adminNote }) {
  const actionText = {
    refund: {
      sw: "Malipo yamerejeshwa kwa mnunuzi.",
      en: "Payment has been refunded to the buyer.",
    },
    continue: {
      sw: "Deal inaendelea (negotiation upya).",
      en: "Deal is continuing (negotiation restarted).",
    },
    cancel: {
      sw: "Deal imeghairiwa bila kurejesha fedha.",
      en: "Deal was cancelled without a refund.",
    },
  }[action] || {
    sw: "Uamuzi umetolewa.",
    en: "A decision has been made.",
  };

  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.DISPUTE_RESOLVED,
    title: {
      sw: `Mgogoro wa "${listingTitle}" umetatuliwa`,
      en: `Dispute for "${listingTitle}" has been resolved`,
    },
    body: {
      sw: `${actionText.sw}${adminNote ? ` Maelezo: ${adminNote}` : ""}`,
      en: `${actionText.en}${adminNote ? ` Note: ${adminNote}` : ""}`,
    },
    link: "/dashboard/deals",
    meta: { dealId, action },
  });
}

// 10) PAYMENT PROOF SUBMITTED
export function notifyPaymentProofSubmitted({ dealId, listingTitle, amount }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.PAYMENT_PROOF_SUBMITTED,
    title: {
      sw: "Uthibitisho wa malipo umetumwa",
      en: "Payment proof submitted",
    },
    body: {
      sw: `"${listingTitle}" — mnunuzi amepakia uthibitisho wa ${fmtTZS(amount)}. Thibitisha "Nimepokea Malipo" kukamilisha muamala.`,
      en: `"${listingTitle}" — the buyer uploaded proof for ${fmtTZS(amount)}. Confirm "Payment Received" to complete the transaction.`,
    },
    link: "/dashboard/deals",
    meta: { dealId },
  });
}

// ============================================================
// 11) BUNDLE PURCHASED (Revenue Bundles) — MPYA
// ============================================================
/**
 * notifyBundlePurchased — taarifa kwa user + admin bundle inapolipwa.
 *
 * @param {object} params
 * @param {string} params.bundleId       — ID ya bundle
 * @param {object|string} params.bundleName — jina la bundle { sw, en } au string
 * @param {number} params.amount         — kiasi kilicholipwa (TZS)
 * @param {object|number} params.credits — credits zilizoongezwa { listing: 10, boost: 3 } au namba
 * @param {string} params.expiresAt      — ISO date ya expiry
 */
export function notifyBundlePurchased({
  bundleId,
  bundleName,
  amount,
  credits,
  expiresAt,
}) {
  // Credits text — inaweza kuwa object au namba
  const creditsText =
    credits && typeof credits === "object"
      ? Object.entries(credits)
          .map(([k, v]) => `${k}:${v}`)
          .join(", ")
      : String(credits || "");

  const expiresText = expiresAt
    ? new Date(expiresAt).toLocaleDateString("sw-TZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // Bundle name — inaweza kuwa { sw, en } au string
  const nameSw =
    typeof bundleName === "object" ? bundleName?.sw : bundleName;
  const nameEn =
    typeof bundleName === "object" ? bundleName?.en || bundleName?.sw : bundleName;

  // Taarifa kwa USER
  pushNotification({
    audience: "user",
    type: "bundle",
    title: {
      sw: "Bundle Imenunuliwa!",
      en: "Bundle Purchased!",
    },
    body: {
      sw: `Umefanikiwa kununua "${nameSw}" kwa ${fmtTZS(amount)}. Credits zako zimeongezwa${expiresText ? ` na zinaisha ${expiresText}` : ""}.`,
      en: `You successfully purchased "${nameEn}" for ${fmtTZS(amount)}. Your credits have been added${expiresText ? ` and will expire on ${expiresText}` : ""}.`,
    },
    link: "/dashboard/bundles",
    meta: {
      bundleId,
      amount,
      credits: creditsText,
      expiresAt: expiresAt || null,
    },
  });

  // Taarifa kwa ADMIN
  pushNotification({
    audience: "admin",
    type: "bundle_sale",
    title: {
      sw: `Bundle Sale — "${nameSw}" (${fmtTZS(amount)})`,
      en: `Bundle Sale — "${nameEn}" (${fmtTZS(amount)})`,
    },
    body: {
      sw: `Credits: ${creditsText}${expiresText ? ` · Inaisha: ${expiresText}` : ""}`,
      en: `Credits: ${creditsText}${expiresText ? ` · Expires: ${expiresText}` : ""}`,
    },
    target: "revenue",
    meta: {
      bundleId,
      amount,
      credits: creditsText,
      expiresAt: expiresAt || null,
    },
  });
}
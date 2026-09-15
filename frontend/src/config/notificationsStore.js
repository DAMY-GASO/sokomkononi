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
  BUNDLE_PURCHASED:         "bundle.purchased",
  PRICE_DROP:               "listing.price_drop",
  LISTING_EXPIRING_SOON:    "listing.expiring_soon",
  NEW_LEAD:                 "lead.new",
  SEARCH_MATCH:             "search.match",
  NEGOTIATION_UPDATE:       "deal.negotiation_update",
  DEAL_COMPLETED:           "deal.completed",
  ACCOUNT_SUSPENDED:        "account.suspended",
  ACCOUNT_REACTIVATED:      "account.reactivated",
  VERIFICATION_SUBMITTED:   "verification.submitted",
  TICKET_CREATED:           "ticket.created",
  TICKET_REPLIED:           "ticket.replied",
  TICKET_RESOLVED:          "ticket.resolved",
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
/**
 * getLocalizedField(field, lang) — inarudisha string kwa lugha
 * sahihi. Inashughulikia:
 *   - string (neutral) → inarudi kama ilivyo
 *   - { sw, en } → inarudisha lugha sahihi
 */
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
// EMITTERS — kundi la pili (Muongozo wa Notification Messages)
// Kila moja inafuata "Value First" (§5.1): result kwanza, siyo fee.
// ============================================================

// 11) BUNDLE PURCHASED
export function notifyBundlePurchased({ bundleId, bundleName, amount, credits, expiresAt }) {
  const nameSw = getLocalizedField(bundleName, "sw");
  const nameEn = getLocalizedField(bundleName, "en") || nameSw;
  const untilText = expiresAt
    ? new Date(expiresAt).toLocaleDateString("sw-TZ", { day: "numeric", month: "long" })
    : "";

  pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.BUNDLE_PURCHASED,
    title: { sw: "Kifurushi Kimenunuliwa", en: "Bundle Purchased" },
    body: {
      sw: `Umenunua "${nameSw}" kwa ${fmtTZS(amount)}. Sasa una huduma nyingi kwa bei bora${untilText ? `, zinatumika hadi ${untilText}` : ""}.`,
      en: `You purchased "${nameEn}" for ${fmtTZS(amount)}. You now have multiple services at a better price${untilText ? `, valid until ${untilText}` : ""}.`,
    },
    link: "/dashboard/bundles",
    meta: { bundleId, amount, credits, expiresAt },
  });

  pushNotification({
    audience: "admin",
    type: NOTIFICATION_EVENTS.BUNDLE_PURCHASED,
    title: {
      sw: `Kifurushi kimenunuliwa — "${nameSw}" (${fmtTZS(amount)})`,
      en: `Bundle purchased — "${nameEn}" (${fmtTZS(amount)})`,
    },
    body: "",
    target: "revenue",
    meta: { bundleId, amount },
  });
}

// 12) LISTING APPROVED
export function notifyListingApproved({ listingId, listingTitle }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.LISTING_APPROVED,
    title: { sw: "Tangazo Limeidhinishwa", en: "Listing Approved" },
    body: {
      sw: `"${listingTitle}" limeidhinishwa na sasa ni Live — linaonekana kwa wanunuzi.`,
      en: `"${listingTitle}" has been approved and is now Live — visible to buyers.`,
    },
    link: "/dashboard/listings",
    meta: { listingId },
  });
}

// 13) LISTING REJECTED
export function notifyListingRejected({ listingId, listingTitle, reason = "" }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.LISTING_REJECTED,
    title: { sw: "Tangazo Halijaidhinishwa", en: "Listing Not Approved" },
    body: {
      sw: `"${listingTitle}" halikuidhinishwa.${reason ? ` Sababu: ${reason}` : " Kagua taarifa na uwasilishe tena."}`,
      en: `"${listingTitle}" was not approved.${reason ? ` Reason: ${reason}` : " Review the details and resubmit."}`,
    },
    link: "/dashboard/listings",
    meta: { listingId, reason },
  });
}

// 14) NEW LISTING SUBMITTED (admin — awaiting approval)
export function notifyListingSubmittedForReview({ listingId, listingTitle }) {
  return pushNotification({
    audience: "admin",
    type: NOTIFICATION_EVENTS.LISTING_PENDING,
    title: {
      sw: `Tangazo jipya linasubiri idhini — "${listingTitle}"`,
      en: `New listing awaiting approval — "${listingTitle}"`,
    },
    body: "",
    target: "moderation",
    meta: { listingId },
  });
}

// 15) LISTING EXPIRING SOON (loss aversion — kabla haijaisha)
export function notifyListingExpiringSoon({ listingId, listingTitle, daysLeft }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.LISTING_EXPIRING_SOON,
    title: { sw: "Tangazo Linakaribia Kuisha", en: "Listing Expiring Soon" },
    body: {
      sw: `"${listingTitle}" litaisha muda baada ya siku ${daysLeft}. Renew ili usipoteze visibility.`,
      en: `"${listingTitle}" expires in ${daysLeft} day(s). Renew it so you don't lose visibility.`,
    },
    link: "/dashboard/listings",
    meta: { listingId, daysLeft },
  });
}

// 16) LISTING EXPIRED
export function notifyListingExpired({ listingId, listingTitle }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.LISTING_EXPIRED,
    title: { sw: "Tangazo Limeisha Muda", en: "Listing Expired" },
    body: {
      sw: `"${listingTitle}" limeisha muda na halionekani tena kwa wanunuzi. Renew ili liendelee kuonekana.`,
      en: `"${listingTitle}" has expired and is no longer visible to buyers. Renew it to keep it live.`,
    },
    link: "/dashboard/listings",
    meta: { listingId },
  });
}

// 17) PRICE DROP (buyer-facing)
export function notifyPriceDrop({ listingId, listingTitle, oldPrice, newPrice }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.PRICE_DROP,
    title: { sw: "Bei Imeshuka", en: "Price Drop" },
    body: {
      sw: `Bei ya "${listingTitle}" imeshuka kutoka ${fmtTZS(oldPrice)} hadi ${fmtTZS(newPrice)}.`,
      en: `The price of "${listingTitle}" dropped from ${fmtTZS(oldPrice)} to ${fmtTZS(newPrice)}.`,
    },
    link: "/dashboard/listings",
    meta: { listingId, oldPrice, newPrice },
  });
}

// 18) NEW LEAD / BUYER INTEREST (seller-facing, social proof)
export function notifyNewLead({ listingId, listingTitle, buyerName }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.NEW_LEAD,
    title: { sw: "Mnunuzi Ameonyesha Nia", en: "Buyer Interest" },
    body: {
      sw: `${buyerName || "Mnunuzi"} ameonyesha nia kwenye "${listingTitle}". Mjibu haraka kuongeza nafasi ya kuuza.`,
      en: `${buyerName || "A buyer"} showed interest in "${listingTitle}". Respond quickly to improve your chances of selling.`,
    },
    link: "/dashboard/leads",
    meta: { listingId, buyerName },
  });
}

// 19) SAVED SEARCH MATCH (buyer-facing, personalization)
export function notifySearchMatch({ searchId, searchName, matchCount }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.SEARCH_MATCH,
    title: { sw: "Umepata Match Mpya", en: "New Match Found" },
    body: {
      sw: `Tumepata listing${matchCount > 1 ? "s" : ""} ${matchCount} zinazolingana na search yako "${searchName}".`,
      en: `We found ${matchCount} listing(s) matching your saved search "${searchName}".`,
    },
    link: "/dashboard/saved-searches",
    meta: { searchId, matchCount },
  });
}

// 20) RESERVATION CREATED
export function notifyReservationCreated({ dealId, listingTitle, hours, amount }) {
  pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.RESERVATION_CREATED,
    title: { sw: "Reservation Imewekwa", en: "Reservation Confirmed" },
    body: {
      sw: `"${listingTitle}" imewekwa reserved kwa saa ${hours}. Tumia muda huu kufanya inspection na kukamilisha taratibu.`,
      en: `"${listingTitle}" has been reserved for ${hours} hour(s). Use this time to complete inspection and next steps.`,
    },
    link: "/dashboard/deals",
    meta: { dealId, hours },
  });
  pushNotification({
    audience: "admin",
    type: NOTIFICATION_EVENTS.RESERVATION_CREATED,
    title: {
      sw: `Reservation mpya imewekwa — "${listingTitle}"`,
      en: `New reservation created — "${listingTitle}"`,
    },
    body: "",
    target: "deals",
    meta: { dealId, amount },
  });
}

// 21) NEGOTIATION UPDATE (offer accepted)
export function notifyOfferAccepted({ dealId, listingTitle, offerAmount }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.NEGOTIATION_UPDATE,
    title: { sw: "Ofa Imekubaliwa", en: "Offer Accepted" },
    body: {
      sw: `Muuzaji amekubali ofa yako ya ${fmtTZS(offerAmount)} kwa "${listingTitle}".`,
      en: `The seller accepted your offer of ${fmtTZS(offerAmount)} for "${listingTitle}".`,
    },
    link: "/dashboard/deals",
    meta: { dealId, offerAmount },
  });
}

// 22) DEAL COMPLETED (positive completion — buyer + seller + admin)
export function notifyDealCompleted({ dealId, listingTitle, amount }) {
  pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.DEAL_COMPLETED,
    title: { sw: "Hongera! Deal Imekamilika", en: "Congratulations! Deal Completed" },
    body: {
      sw: `"${listingTitle}" — deal imekamilika kupitia SokoMkononi.`,
      en: `"${listingTitle}" — the deal has been completed through SokoMkononi.`,
    },
    link: "/dashboard/deals",
    meta: { dealId },
  });
  pushNotification({
    audience: "admin",
    type: NOTIFICATION_EVENTS.DEAL_COMPLETED,
    title: {
      sw: `Deal imekamilika — "${listingTitle}" (${fmtTZS(amount)})`,
      en: `Deal completed — "${listingTitle}" (${fmtTZS(amount)})`,
    },
    body: { sw: "Success Fee inasubiriwa.", en: "Success Fee pending." },
    target: "revenue",
    meta: { dealId, amount },
  });
}

// ============================================================
// EMITTERS — kundi la tatu (Accounts, Verification, Tickets, Payments)
// ============================================================

// 23) ACCOUNT SUSPENDED / REACTIVATED (admin action → user)
export function notifyAccountSuspended({ userId, userName, reason = "" }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.ACCOUNT_SUSPENDED,
    title: { sw: "Akaunti Yako Imesimamishwa", en: "Your Account Has Been Suspended" },
    body: {
      sw: `Akaunti yako imesimamishwa na Admin.${reason ? ` Sababu: ${reason}` : " Wasiliana na Msaada kwa maelezo zaidi."}`,
      en: `Your account has been suspended by an Admin.${reason ? ` Reason: ${reason}` : " Contact Support for more details."}`,
    },
    link: "/dashboard/safety",
    meta: { userId, reason },
  });
}

export function notifyAccountReactivated({ userId, userName }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.ACCOUNT_REACTIVATED,
    title: { sw: "Akaunti Yako Imewashwa Tena", en: "Your Account Has Been Reactivated" },
    body: {
      sw: "Akaunti yako sasa inafanya kazi tena kikamilifu.",
      en: "Your account is now fully active again.",
    },
    link: "/dashboard",
    meta: { userId },
  });
}

// 24) VERIFICATION SUBMITTED (admin — request mpya inasubiri)
export function notifyVerificationSubmitted({ verificationId, type, subject }) {
  return pushNotification({
    audience: "admin",
    type: NOTIFICATION_EVENTS.VERIFICATION_SUBMITTED,
    title: {
      sw: `Ombi jipya la uthibitisho — "${subject}"`,
      en: `New verification request — "${subject}"`,
    },
    body: "",
    target: "verification",
    meta: { verificationId, type },
  });
}

// 25) TICKET CREATED (admin — support ticket mpya)
export function notifyTicketCreated({ ticketId, subject, priority }) {
  return pushNotification({
    audience: "admin",
    type: NOTIFICATION_EVENTS.TICKET_CREATED,
    title: {
      sw: `Ticket mpya ya msaada — "${subject}"`,
      en: `New support ticket — "${subject}"`,
    },
    body: priority === "urgent" || priority === "high"
      ? { sw: `Kipaumbele: ${priority === "urgent" ? "Haraka" : "Juu"}`, en: `Priority: ${priority}` }
      : "",
    target: "support",
    meta: { ticketId, priority },
  });
}

// 26) TICKET REPLIED (admin amejibu → user)
export function notifyTicketReplied({ ticketId, subject }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.TICKET_REPLIED,
    title: { sw: "Timu ya Msaada Imejibu", en: "Support Replied" },
    body: {
      sw: `Umepata jibu jipya kwenye ticket yako "${subject}".`,
      en: `You have a new reply on your ticket "${subject}".`,
    },
    link: "/dashboard/safety",
    meta: { ticketId },
  });
}

// 27) TICKET RESOLVED
export function notifyTicketResolved({ ticketId, subject }) {
  return pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.TICKET_RESOLVED,
    title: { sw: "Ticket Yako Imetatuliwa", en: "Your Ticket Has Been Resolved" },
    body: {
      sw: `"${subject}" imetatuliwa. Kama tatizo halijaisha, unaweza kufungua tena.`,
      en: `"${subject}" has been resolved. If the issue isn't fixed, you can reopen it.`,
    },
    link: "/dashboard/safety",
    meta: { ticketId },
  });
}

// 28) PAYMENT CONFIRMED (malipo ya mwisho ya deal — sale/purchase)
export function notifyPaymentConfirmed({ dealId, listingTitle, amount, role }) {
  pushNotification({
    audience: "user",
    type: NOTIFICATION_EVENTS.PAYMENT_CONFIRMED,
    title: { sw: "Malipo Yamethibitishwa", en: "Payment Confirmed" },
    body: {
      sw: `Malipo ya ${fmtTZS(amount)} kwa "${listingTitle}" yamethibitishwa.`,
      en: `Payment of ${fmtTZS(amount)} for "${listingTitle}" has been confirmed.`,
    },
    link: "/dashboard/transactions",
    meta: { dealId, amount, role },
  });
  pushNotification({
    audience: "admin",
    type: NOTIFICATION_EVENTS.PAYMENT_CONFIRMED,
    title: {
      sw: `Malipo yamethibitishwa — "${listingTitle}" (${fmtTZS(amount)})`,
      en: `Payment confirmed — "${listingTitle}" (${fmtTZS(amount)})`,
    },
    body: "",
    target: "revenue",
    meta: { dealId, amount },
  });
}

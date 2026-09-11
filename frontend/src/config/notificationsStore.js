// ============================================================
// notificationsStore.js
// CHANZO KIMOJA CHA UKWELI kwa taarifa (notifications) za mfumo mzima —
// zote mbili: taarifa za mtumiaji (NotificationsPage.jsx, bell ya
// DashboardShell.jsx) NA taarifa za admin (bell ya AdminDashboard.jsx),
// zikiwa kwenye orodha MOJA, zikitofautishwa na `audience`.
//
// Kabla ya hii, NotificationsPage.jsx ilitumia SEED_NOTIFICATIONS + useState
// ya ndani (ikipotea kila refresh), na AdminDashboard.jsx ilitumia
// INITIAL_ADMIN_NOTIFICATIONS + useState yake ya ndani vilevile. Sasa
// zinahifadhiwa hapa, kama systemSettingsStore.js/listingsStore.js/
// dealsStore.js — ukurasa wowote unaweza `useNotifications("user")` au
// `useNotifications("admin")` na kupata data ileile, inayosasishwa papo
// hapo (real-time) mahali popote inapoundwa.
//
// MATUKIO HALISI (Awamu 7): Boost, Leading Fee, Advertisement, na
// Listing Fee kila moja ina "emitter" yake hapa chini
// (notifyBoostPurchased / notifyLeadingPurchased /
// notifyAdvertisementPurchased / notifyListingFeePaid) inayotengeneza
// taarifa MBILI kwa wakati mmoja: moja kwa mtumiaji aliyefanya malipo,
// na nyingine kwa admin (bell ya AdminDashboard, ikielekeza moja kwa
// moja kwenye "revenue" section). Kila component inayosababisha
// tukio (mf. BoostSasa.jsx baada ya malipo kufanikiwa) inaita emitter
// husika badala ya kuandika taarifa ya mkono kila mahali — backend
// halisi ikiwepo, badilisha tu ndani ya emitter hizi bila kugusa UI.
// ============================================================

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "sokomkononi_notifications_v1";
const UPDATE_EVENT = "sokomkononi:notifications-updated";

// ---- Muda halisi (siyo maandishi tuli "Dakika 5 zilizopita") — UI
// inatumia timeAgo() (shared.js) kuyageuza kuwa maandishi ya papo hapo. ----
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

function fmtTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

// ------------------------------------------------------------
// SEED — taarifa za mtumiaji (zilizokuwa SEED_NOTIFICATIONS kwenye
// NotificationsPage.jsx) + taarifa za admin (zilizokuwa
// INITIAL_ADMIN_NOTIFICATIONS kwenye AdminDashboard.jsx), sasa kwenye
// orodha moja, kila moja ikiwa na `audience`.
// ------------------------------------------------------------
export const SEED_NOTIFICATIONS = [
  // ---- Mtumiaji (seller/buyer) ----
  {
    id: "n1",
    audience: "user",
    type: "message",
    title: "Ujumbe mpya kutoka Fatma Juma",
    body: "Habari, nyumba bado ipo? Ninavutiwa sana.",
    at: hoursAgo(2),
    read: false,
    link: "/dashboard/messages",
    target: null,
  },
  {
    id: "n2",
    audience: "user",
    type: "deal",
    title: "Ofa mpya ya TZS 78,000,000",
    body: "Fatma Juma amewasilisha ofa kwa nyumba yako Mbezi Beach.",
    at: hoursAgo(2),
    read: false,
    link: "/dashboard/deals",
    target: null,
  },
  {
    id: "n3",
    audience: "user",
    type: "boost",
    title: "Boost yako inaisha kesho",
    body: "Featured Boost ya 'Toyota Harrier 2016' inaisha kesho. Ongeza muda ili uendelee kuonekana.",
    at: hoursAgo(20),
    read: false,
    link: "/dashboard/boost",
    target: null,
  },
  {
    id: "n4",
    audience: "user",
    type: "verified",
    title: "Tangazo lako limethibitishwa",
    body: "'Kiwanja Ubungo — Hati Miliki' sasa ni Live na imethibitishwa.",
    at: daysAgo(1),
    read: true,
    link: "/dashboard/listings",
    target: null,
  },
  {
    id: "n5",
    audience: "user",
    type: "reminder",
    title: "Kumbusho la Inspection",
    body: "Inspection ya 'Nyumba ya Ghorofa Mbezi Beach' imepangwa kesho saa 2:00 usiku.",
    at: daysAgo(2),
    read: true,
    link: "/dashboard/deals",
    target: null,
  },
  {
    id: "n6",
    audience: "user",
    type: "system",
    title: "Karibu SokoMkononi",
    body: "Asante kwa kujiunga. Anza kuweka mali yako ya kwanza leo.",
    at: daysAgo(10),
    read: true,
    link: "/dashboard/post",
    target: null,
  },

  // ---- Admin (bell ya AdminDashboard.jsx) ----
  {
    id: "a1",
    audience: "admin",
    type: "listing_pending",
    title: 'Listing mpya inasubiri approval: "Nyumba ya Ghorofa Mbezi Beach"',
    body: "",
    at: minutesAgo(5),
    read: false,
    link: null,
    target: "moderation",
  },
  {
    id: "a2",
    audience: "admin",
    type: "dispute",
    title: "Malalamiko mapya yamewasilishwa kwenye deal ya Toyota Harrier 2016",
    body: "",
    at: hoursAgo(1),
    read: false,
    link: null,
    target: "deals",
  },
  {
    id: "a3",
    audience: "admin",
    type: "payment_issue",
    title: "Malipo ya Reservation Fee yamekwama (pending) kwa siku 2",
    body: "",
    at: hoursAgo(3),
    read: false,
    link: null,
    target: "revenue",
  },
  {
    id: "a4",
    audience: "admin",
    type: "fraud_flag",
    title: 'Mtumiaji "Peter Lema" amepokea ripoti 4 kutoka kwa watumiaji tofauti',
    body: "",
    at: daysAgo(1),
    read: true,
    link: null,
    target: "users",
  },
];

// ------------------------------------------------------------
// STORAGE (localStorage + custom event, mtindo uleule wa
// systemSettingsStore.js)
// ------------------------------------------------------------
function readAll() {
  if (typeof window === "undefined") return SEED_NOTIFICATIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_NOTIFICATIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_NOTIFICATIONS;
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
// USIMAMIZI WA JUMLA (audience-agnostic — hutumika ndani ya emitters
// na hooks hapa chini)
// ------------------------------------------------------------
export function getNotifications(audience) {
  const list = readAll().filter((n) => n.audience === audience);
  return sortByNewest(list);
}

export function getUnreadCount(audience) {
  return getNotifications(audience).filter((n) => !n.read).length;
}

// Huongeza taarifa mpya. Inarudisha rekodi iliyoundwa.
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

// React hook — hutumika kwenye NotificationsPage.jsx ("user") na
// AdminDashboard.jsx ("admin"). Inasasika papo hapo kila
// pushNotification/markRead/n.k inapoitwa mahali popote kwenye app.
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
// EMITTERS — matukio halisi ya biashara. Kila moja huunda taarifa
// kwa mtumiaji NA kwa admin kwa wakati mmoja. Components za malipo
// (BoostSasa.jsx, LeadingSasa.jsx, AdvertiseSasa.jsx) na mzunguko wa
// Listing Fee (DashboardShell.jsx: markListingPaid) huita hizi mara
// tu malipo yanapofanikiwa — hakuna sehemu nyingine ya kuandika
// taarifa ya "boost"/"leading"/"advertisement"/"listing_fee" kwa mkono.
// ============================================================

// 1) BOOST — BoostSasa.jsx: handlePaymentSuccess()
export function notifyBoostPurchased({ listingId, listingTitle, packageLabel, expiresAt, amount }) {
  const untilText = expiresAt
    ? new Date(expiresAt).toLocaleDateString("sw-TZ", { day: "numeric", month: "long" })
    : "";
  pushNotification({
    audience: "user",
    type: "boost",
    title: "Boost Imewekwa",
    body: `"${listingTitle}" sasa ina ${packageLabel} na itaonekana zaidi kwa wanunuzi${untilText ? ` hadi ${untilText}` : ""}.`,
    link: "/dashboard/boost",
    meta: { listingId, amount },
  });
  pushNotification({
    audience: "admin",
    type: "boost",
    title: `Malipo ya Boost yamepokelewa — "${listingTitle}" (${fmtTZS(amount)})`,
    body: `Package: ${packageLabel}`,
    target: "revenue",
    meta: { listingId, amount },
  });
}

// 2) LEADING FEE — LeadingSasa.jsx: baada ya malipo (mfano wa applyLeading)
export function notifyLeadingPurchased({ listingId, listingTitle, expiresAt, amount }) {
  const untilText = expiresAt
    ? new Date(expiresAt).toLocaleDateString("sw-TZ", { day: "numeric", month: "long" })
    : "";
  pushNotification({
    audience: "user",
    type: "leading",
    title: "Leading Fee Imewekwa",
    body: `"${listingTitle}" sasa ina kipaumbele maalum kwenye matokeo ya utafutaji${untilText ? ` hadi ${untilText}` : ""}.`,
    link: "/dashboard/leading",
    meta: { listingId, amount },
  });
  pushNotification({
    audience: "admin",
    type: "leading",
    title: `Malipo ya Leading Fee yamepokelewa — "${listingTitle}" (${fmtTZS(amount)})`,
    body: "",
    target: "revenue",
    meta: { listingId, amount },
  });
}

// 3) ADVERTISEMENT — AdvertiseSasa.jsx: baada ya banner kulipiwa
export function notifyAdvertisementPurchased({ listingId, listingTitle, placement, amount, expiresAt }) {
  const untilText = expiresAt
    ? new Date(expiresAt).toLocaleDateString("sw-TZ", { day: "numeric", month: "long" })
    : "";
  pushNotification({
    audience: "user",
    type: "advertisement",
    title: "Tangazo (Banner) Limewekwa",
    body: `Banner ya "${listingTitle}"${placement ? ` kwenye ${placement}` : ""} sasa inaonekana${untilText ? ` hadi ${untilText}` : ""}.`,
    link: "/dashboard/advertise",
    meta: { listingId, amount, placement },
  });
  pushNotification({
    audience: "admin",
    type: "ads",
    title: `Malipo ya Advertisement yamepokelewa — "${listingTitle}" (${fmtTZS(amount)})`,
    body: placement ? `Placement: ${placement}` : "",
    target: "revenue",
    meta: { listingId, amount, placement },
  });
}

// 4) LISTING FEE — DashboardShell.jsx: markListingPaid()
export function notifyListingFeePaid({ listingId, listingTitle, amount }) {
  pushNotification({
    audience: "user",
    type: "listing_fee",
    title: "Malipo ya Listing Fee Yamethibitishwa",
    body: `"${listingTitle}" sasa ni Live na inaonekana kwa wanunuzi.`,
    link: "/dashboard/listings",
    meta: { listingId, amount },
  });
  pushNotification({
    audience: "admin",
    type: "listing_fee",
    title: `Listing Fee imelipwa — "${listingTitle}" (${fmtTZS(amount)})`,
    body: "Tangazo sasa ni Live.",
    target: "revenue",
    meta: { listingId, amount },
  });
}

// Emitter ya jumla kwa matukio mengine ya admin (dispute/fraud/n.k) —
// tayari kwa awamu zijazo bila kuhitaji kubadilisha muundo wa store.
export function notifyAdmin({ type, title, body = "", target = null, meta }) {
  return pushNotification({ audience: "admin", type, title, body, target, meta });
}

// 5) MESSAGE — messagesStore.js: sendMessage() inapoongeza ujumbe wa "them"
// (yaani mwenzake ndiye ametuma, siyo mtumiaji mwenyewe).
export function notifyNewMessage({ conversationId, senderName, preview }) {
  return pushNotification({
    audience: "user",
    type: "message",
    title: `Ujumbe mpya kutoka ${senderName}`,
    body: preview || "",
    link: conversationId ? `/dashboard/messages?c=${conversationId}` : "/dashboard/messages",
    meta: { conversationId },
  });
}

// 6) RESERVATION EXPIRING SOON — dealsStore.js: checkReservationReminders()
// huita hii mara moja tu kwa kila deal, kabla reservationExpiresAt
// haijafika, ili mnunuzi/muuzaji wasishtukizwe na kuisha kwa deposit.
export function notifyReservationExpiringSoon({ dealId, listingTitle, hoursLeft }) {
  return pushNotification({
    audience: "user",
    type: "reminder",
    title: "Reservation Inakaribia Kuisha",
    body: `"${listingTitle}" — muda wa reservation unabaki chini ya saa ${hoursLeft}. Kamilisha malipo/hatua zinazofuata kabla haijaisha, la sivyo deal itaghairika kiotomatiki.`,
    link: "/dashboard/deals",
    meta: { dealId },
  });
}

// 7) LISTING RELEASED (WAITLIST) — inatolewa mtu anaposhindwa/kughairi
// reservation ya mali fulani, kwa kila mtu aliyekuwa kwenye Waiting List
// ya mali hiyo, ili wajue sasa mali iko huru tena.
export function notifyListingReleased({ listingId, listingTitle }) {
  return pushNotification({
    audience: "user",
    type: "listing_released",
    title: "Mali Uliyokuwa Ukiisubiri Sasa Iko Huru",
    body: `"${listingTitle}" haipo tena reserved/sold — sasa unaweza kuwasiliana na muuzaji au kufanya ofa.`,
    link: "/dashboard/waiting-list",
    meta: { listingId },
  });
}

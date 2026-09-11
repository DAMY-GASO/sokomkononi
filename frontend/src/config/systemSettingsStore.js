// ============================================================
// systemSettingsStore.js
// CHANZO KIMOJA CHA UKWELI kwa mipangilio ya ndani ya mfumo:
// Webhooks, Sub-Admins, na App Store Links (Admin > System Settings).
//
// Kabla ya hii, WebhooksPanel/SubAdminsPanel/AppStoreLinksPanel
// zilitumia useState za ndani tu — kila mara ukurasa ukifunguliwa upya
// (refresh) mabadiliko yote yalipotea. Sasa yanahifadhiwa hapa, kama
// dealsStore.js/feePolicy.js/listingsStore.js/usersStore.js.
//
// Hazina sehemu nyingine ya mfumo inayosoma data hizi kwa sasa (ni za
// Admin peke yake), lakini zimewekwa kwenye muundo huu ili siku
// backend halisi ikiwepo, badilisha tu functions hizi ziite API —
// hooks (useWebhooks, useSubAdmins, useAppStoreLinks) hazitahitaji
// kubadilika.
// ============================================================

import { useEffect, useState } from "react";

function makeSlice(storageKey, updateEvent, seed) {
  function read() {
    if (typeof window === "undefined") return seed;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return seed;
      const parsed = JSON.parse(raw);
      if (parsed == null) return seed;
      if (Array.isArray(seed) && (!Array.isArray(parsed) || parsed.length === 0)) return seed;
      return parsed;
    } catch {
      return seed;
    }
  }

  function save(value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(value));
    window.dispatchEvent(new Event(updateEvent));
  }

  function useSlice() {
    const [value, setValue] = useState(() => read());
    useEffect(() => {
      const sync = () => setValue(read());
      window.addEventListener("storage", sync);
      window.addEventListener(updateEvent, sync);
      return () => {
        window.removeEventListener("storage", sync);
        window.removeEventListener(updateEvent, sync);
      };
    }, []);
    return [value, save];
  }

  return { read, save, useSlice };
}

// ------------------------------------------------------------
// WEBHOOKS
// ------------------------------------------------------------
export const SEED_WEBHOOKS = [
  { id: 1, event: "Payment Success", url: "https://api.sokomkononi.co.tz/webhooks/payment", active: true },
  { id: 2, event: "SMS Notification", url: "https://api.sokomkononi.co.tz/webhooks/sms", active: true },
];

const webhooksSlice = makeSlice(
  "sokomkononi_webhooks_v1",
  "sokomkononi:webhooks-updated",
  SEED_WEBHOOKS
);

export function getWebhooks() { return webhooksSlice.read(); }
export function saveWebhooks(list) { webhooksSlice.save(list); }
export function addWebhook(webhook) {
  const next = [...getWebhooks(), webhook];
  saveWebhooks(next);
  return next;
}
export function removeWebhook(id) {
  const next = getWebhooks().filter((w) => w.id !== id);
  saveWebhooks(next);
  return next;
}
export function toggleWebhook(id) {
  const next = getWebhooks().map((w) => (w.id === id ? { ...w, active: !w.active } : w));
  saveWebhooks(next);
  return next;
}
export function useWebhooks() { return webhooksSlice.useSlice(); }

// ------------------------------------------------------------
// SUB-ADMINS
// ------------------------------------------------------------
export const PERMISSION_OPTIONS = ["Users", "Moderation", "Deals", "Revenue", "System"];

export const SEED_SUBADMINS = [
  { id: 1, name: "Amina Rashid", email: "amina@sokomkononi.co.tz", permissions: ["Moderation", "Deals"] },
];

const subAdminsSlice = makeSlice(
  "sokomkononi_subadmins_v1",
  "sokomkononi:subadmins-updated",
  SEED_SUBADMINS
);

export function getSubAdmins() { return subAdminsSlice.read(); }
export function saveSubAdmins(list) { subAdminsSlice.save(list); }
export function addSubAdmin(subAdmin) {
  const next = [...getSubAdmins(), subAdmin];
  saveSubAdmins(next);
  return next;
}
export function removeSubAdmin(id) {
  const next = getSubAdmins().filter((s) => s.id !== id);
  saveSubAdmins(next);
  return next;
}
export function useSubAdmins() { return subAdminsSlice.useSlice(); }

// ------------------------------------------------------------
// APP STORE LINKS
// ------------------------------------------------------------
export const SEED_APP_STORE_LINKS = { play: "", appstore: "" };

const appStoreLinksSlice = makeSlice(
  "sokomkononi_app_store_links_v1",
  "sokomkononi:app-store-links-updated",
  SEED_APP_STORE_LINKS
);

export function getAppStoreLinks() { return appStoreLinksSlice.read(); }
export function saveAppStoreLinks(links) { appStoreLinksSlice.save(links); }
export function useAppStoreLinks() { return appStoreLinksSlice.useSlice(); }

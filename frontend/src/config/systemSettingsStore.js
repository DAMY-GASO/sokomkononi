// ============================================================
// systemSettingsStore.js
// CHANZO KIMOJA CHA UKWELI kwa mipangilio ya ndani ya mfumo:
//   - Webhooks          (Admin > System Settings)
//   - Sub-Admins        (Admin > System Settings)
//   - App Store Links   (Admin > System Settings)
//   - Platform Policy   (Admin > System Settings — muda wa maisha
//                        ya listing, n.k.)
//
// Kabla ya hii, WebhooksPanel/SubAdminsPanel/AppStoreLinksPanel
// zilitumia useState za ndani tu — kila mara ukurasa ukifunguliwa upya
// (refresh) mabadiliko yote yalipotea. Sasa yanahifadhiwa hapa, kama
// dealsStore.js/feePolicy.js/listingsStore.js/usersStore.js.
//
// Platform Policy ni tofauti na "fee" — haina bei, ina "kanuni":
// muda wa listing kuishi, na kadhalika. listingsStore.js inasoma
// listingLifetimeDays kutoka hapa kila listing mpya inapoundwa,
// hivyo Admin anaweza kuongeza/kupunguza muda bila kugusa code.
//
// Hazina sehemu nyingine nyingi za mfumo zinazosoma data hizi kwa
// sasa (ni za Admin pekee, isipokuwa Platform Policy ambayo
// listingsStore.js inaisoma), lakini zimewekwa kwenye muundo huu
// ili siku backend halisi ikiwepo, badilisha tu functions hizi ziite
// API — hooks (useWebhooks, useSubAdmins, useAppStoreLinks,
// usePlatformPolicy) hazitahitaji kubadilika.
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
      // Kwa slices za array: kama parsed ni tupu, rudi kwenye seed.
      // Kwa slices za object (kama Platform Policy), tunaruhusu
      // object tupu kama ilivyo — hakuna special-case.
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

// ============================================================
// WEBHOOK EVENTS — bilingual
// Kila event ina `label: { sw, en }` — consistent na categoriesStore.
// `id` inabaki Kiingereza ili kuendana na seed data + backend baadaye.
// ============================================================
export const WEBHOOK_EVENTS = [
  {
    id: "Payment Success",
    label: { sw: "Malipo Yamefanikiwa", en: "Payment Success" },
  },
  {
    id: "Payment Failed",
    label: { sw: "Malipo Yameshindikana", en: "Payment Failed" },
  },
  {
    id: "SMS Notification",
    label: { sw: "Taarifa ya SMS", en: "SMS Notification" },
  },
  {
    id: "New Listing",
    label: { sw: "Listing Mpya", en: "New Listing" },
  },
];

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

// ------------------------------------------------------------
// PLATFORM POLICY
// ------------------------------------------------------------
// Kanuni za jumla za mfumo (bila bei) — Admin anaweza kubadilisha
// kwenye System Settings > Platform Policy. listingsStore.js inasoma
// `listingLifetimeDays` kila listing mpya inapoundwa.
//
// MUHIMU: Mabadiliko ya policy hayaathiri listings zilizokwisha
// chapishwa — zinaendelea na expiresAt zao za awali. Ni listings
// mpya pekee zinazopata muda mpya. (Backend inaweza kuamua
// retro-apply kama mteja atahitaji — frontend haifanyi hivyo.)
export const SEED_PLATFORM_POLICY = {
  // Siku 60 kwa default — Admin anaweza kupunguza hadi 1 au kuongeza
  // hadi 365 kupitia UI (guard kwenye PlatformPolicyPanel).
  listingLifetimeDays: 60,
  // Nafasi ya policies nyingine zijazo: gracePeriodHours kwa
  // reservation kukaribia kuisha, maxPhotosPerListing, n.k.
};

const platformPolicySlice = makeSlice(
  "sokomkononi_platform_policy_v1",
  "sokomkononi:platform-policy-updated",
  SEED_PLATFORM_POLICY
);

export function getPlatformPolicy() { return platformPolicySlice.read(); }
export function savePlatformPolicy(policy) { platformPolicySlice.save(policy); }
export function updatePlatformPolicy(patch) {
  const current = getPlatformPolicy();
  const next = { ...current, ...patch };
  savePlatformPolicy(next);
  return next;
}
export function usePlatformPolicy() { return platformPolicySlice.useSlice(); }

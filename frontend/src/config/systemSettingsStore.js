// ============================================================
// systemSettingsStore.js — API-backed via /api/system-settings/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

export const WEBHOOK_EVENTS = [
  { id: "Payment Success", label: { sw: "Malipo Yamefanikiwa", en: "Payment Success" } },
  { id: "Payment Failed", label: { sw: "Malipo Yameshindikana", en: "Payment Failed" } },
  { id: "SMS Notification", label: { sw: "Taarifa ya SMS", en: "SMS Notification" } },
  { id: "New Listing", label: { sw: "Listing Mpya", en: "New Listing" } },
];

export const PERMISSION_OPTIONS = ["Users", "Moderation", "Deals", "Revenue", "System"];

export const SEED_WEBHOOKS = [];
export const SEED_SUBADMINS = [];
export const SEED_APP_STORE_LINKS = { play: "", appstore: "" };
export const SEED_PLATFORM_POLICY = { listingLifetimeDays: 60 };

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

const webhooksSlice = makeSlice("sokomkononi_webhooks_v1", "sokomkononi:webhooks-updated", SEED_WEBHOOKS);

export function getWebhooks() { return webhooksSlice.read(); }
export function saveWebhooks(list) { webhooksSlice.save(list); }
export function addWebhook(webhook) {
  const next = [...getWebhooks(), webhook];
  saveWebhooks(next);
  api.post("/system-settings/webhooks/", {
    event: webhook.event, url: webhook.url, active: webhook.active !== false,
  }).catch(() => {});
  return next;
}
export function removeWebhook(id) {
  const next = getWebhooks().filter((w) => w.id !== id);
  saveWebhooks(next);
  if (typeof id === "number") api.delete(`/system-settings/webhooks/${id}/`).catch(() => {});
  return next;
}
export function toggleWebhook(id) {
  const next = getWebhooks().map((w) => (w.id === id ? { ...w, active: !w.active } : w));
  saveWebhooks(next);
  if (typeof id === "number") api.post(`/system-settings/webhooks/${id}/toggle/`, {}).catch(() => {});
  return next;
}
export function useWebhooks() { return webhooksSlice.useSlice(); }

export async function hydrateWebhooksFromApi() {
  try {
    const data = await api.get("/system-settings/webhooks/");
    const list = Array.isArray(data) ? data : [];
    saveWebhooks(list);
    return { source: "api", count: list.length };
  } catch (err) {
    console.warn("[systemSettingsStore.webhooks] hydrate failed:", err);
    return { source: "error" };
  }
}

const subAdminsSlice = makeSlice("sokomkononi_subadmins_v1", "sokomkononi:subadmins-updated", SEED_SUBADMINS);
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

const appStoreLinksSlice = makeSlice("sokomkononi_app_store_links_v1", "sokomkononi:app-store-links-updated", SEED_APP_STORE_LINKS);

export function getAppStoreLinks() { return appStoreLinksSlice.read(); }
export function saveAppStoreLinks(links) {
  appStoreLinksSlice.save(links);
  api.post("/system-settings/app-store-links/", {
    play: links.play || "", appstore: links.appstore || "",
  }).catch(() => {});
}
export function useAppStoreLinks() { return appStoreLinksSlice.useSlice(); }

export async function hydrateAppStoreLinksFromApi() {
  try {
    const data = await api.get("/system-settings/app-store-links/");
    if (data && typeof data === "object") {
      saveAppStoreLinks({ play: data.play || "", appstore: data.appstore || "" });
    }
  } catch (err) {
    console.warn("[systemSettingsStore.appStoreLinks] hydrate failed:", err);
  }
}

const platformPolicySlice = makeSlice("sokomkononi_platform_policy_v1", "sokomkononi:platform-policy-updated", SEED_PLATFORM_POLICY);

export function getPlatformPolicy() { return platformPolicySlice.read(); }
export function savePlatformPolicy(policy) {
  platformPolicySlice.save(policy);
  api.post("/system-settings/platform-policy/", {
    listing_lifetime_days: policy.listingLifetimeDays,
  }).catch(() => {});
}
export function updatePlatformPolicy(patch) {
  const current = getPlatformPolicy();
  const next = { ...current, ...patch };
  savePlatformPolicy(next);
  return next;
}
export function usePlatformPolicy() { return platformPolicySlice.useSlice(); }

export async function hydratePlatformPolicyFromApi() {
  try {
    const data = await api.get("/system-settings/platform-policy/");
    if (data && typeof data === "object") {
      savePlatformPolicy({
        listingLifetimeDays: data.listing_lifetime_days ?? 60,
      });
    }
  } catch (err) {
    console.warn("[systemSettingsStore.platformPolicy] hydrate failed:", err);
  }
}

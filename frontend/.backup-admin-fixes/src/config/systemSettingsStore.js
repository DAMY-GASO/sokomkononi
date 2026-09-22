// ============================================================
// systemSettingsStore.js — API-backed via /api/system-settings/
// FIXED: useSubAdmins() now hydrates from API on mount.
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

// ============================================================
// CONSTANTS
// ============================================================
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

// ============================================================
// STORAGE FACTORY
// ============================================================
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

  function useSlice(onMount) {
    const [value, setValue] = useState(() => read());
    useEffect(() => {
      if (typeof onMount === "function") onMount();
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

// ============================================================
// 1. WEBHOOKS
// ============================================================
const webhooksSlice = makeSlice(
  "sokomkononi_webhooks_v1",
  "sokomkononi:webhooks-updated",
  SEED_WEBHOOKS
);

export function getWebhooks() {
  return webhooksSlice.read();
}

export function saveWebhooks(list) {
  webhooksSlice.save(list);
}

export function getWebhook(id) {
  return getWebhooks().find((w) => w.id === id) || null;
}

export async function addWebhookAsync(webhook) {
  if (!webhook?.event || !webhook?.url) {
    return { ok: false, error: new Error("event na url zinahitajika") };
  }

  const previous = getWebhooks();
  const optimistic = {
    id: `local_${Date.now()}`,
    active: true,
    ...webhook,
  };
  webhooksSlice.save([...previous, optimistic]);

  try {
    const raw = await api.post("/system-settings/webhooks/", {
      event: webhook.event,
      url: webhook.url,
      active: webhook.active !== false,
    });
    if (raw && raw.id) {
      const current = getWebhooks();
      webhooksSlice.save(current.map((w) => (w.id === optimistic.id ? raw : w)));
      return { ok: true, webhook: raw };
    }
    return { ok: true, webhook: optimistic };
  } catch (err) {
    webhooksSlice.save(previous);
    console.warn("[systemSettings.webhooks] add failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeWebhookAsync(id) {
  const previous = getWebhooks();
  webhooksSlice.save(previous.filter((w) => w.id !== id));

  if (typeof id !== "number") return { ok: true };

  try {
    await api.delete(`/system-settings/webhooks/${id}/`);
    return { ok: true };
  } catch (err) {
    webhooksSlice.save(previous);
    console.warn("[systemSettings.webhooks] remove failed:", err);
    return { ok: false, error: err };
  }
}

export async function toggleWebhookAsync(id) {
  const previous = getWebhooks();
  const target = previous.find((w) => w.id === id);
  if (!target) return { ok: false, error: new Error("Webhook haipo") };

  const newActive = !target.active;
  webhooksSlice.save(previous.map((w) => (w.id === id ? { ...w, active: newActive } : w)));

  if (typeof id !== "number") return { ok: true, active: newActive };

  try {
    await api.post(`/system-settings/webhooks/${id}/toggle/`, {});
    return { ok: true, active: newActive };
  } catch (err) {
    webhooksSlice.save(previous);
    console.warn("[systemSettings.webhooks] toggle failed:", err);
    return { ok: false, error: err };
  }
}

export async function hydrateWebhooksFromApi() {
  try {
    const data = await api.get("/system-settings/webhooks/");
    const list = Array.isArray(data) ? data : data?.results || [];
    webhooksSlice.save(list);
    return { source: "api", count: list.length };
  } catch (err) {
    console.warn("[systemSettingsStore.webhooks] hydrate failed:", err);
    return { source: "error", count: getWebhooks().length };
  }
}

/** @deprecated Use addWebhookAsync */
export function addWebhook(webhook) {
  const next = [...getWebhooks(), webhook];
  webhooksSlice.save(next);
  api
    .post("/system-settings/webhooks/", {
      event: webhook.event,
      url: webhook.url,
      active: webhook.active !== false,
    })
    .catch((err) => console.warn("[systemSettings.webhooks] add silent fail:", err));
  return next;
}

/** @deprecated Use removeWebhookAsync */
export function removeWebhook(id) {
  const next = getWebhooks().filter((w) => w.id !== id);
  webhooksSlice.save(next);
  if (typeof id === "number") {
    api
      .delete(`/system-settings/webhooks/${id}/`)
      .catch((err) => console.warn("[systemSettings.webhooks] remove silent fail:", err));
  }
  return next;
}

/** @deprecated Use toggleWebhookAsync */
export function toggleWebhook(id) {
  const next = getWebhooks().map((w) => (w.id === id ? { ...w, active: !w.active } : w));
  webhooksSlice.save(next);
  if (typeof id === "number") {
    api
      .post(`/system-settings/webhooks/${id}/toggle/`, {})
      .catch((err) => console.warn("[systemSettings.webhooks] toggle silent fail:", err));
  }
  return next;
}

export function useWebhooks() {
  return webhooksSlice.useSlice(hydrateWebhooksFromApi);
}

// ============================================================
// 2. SUB-ADMINS
// ============================================================
const subAdminsSlice = makeSlice(
  "sokomkononi_subadmins_v1",
  "sokomkononi:subadmins-updated",
  SEED_SUBADMINS
);

export function getSubAdmins() {
  return subAdminsSlice.read();
}

export function saveSubAdmins(list) {
  subAdminsSlice.save(list);
}

export async function addSubAdminAsync(subAdmin) {
  if (!subAdmin?.email) {
    return { ok: false, error: new Error("email inahitajika") };
  }

  const previous = getSubAdmins();
  const optimistic = { id: `local_${Date.now()}`, ...subAdmin };
  subAdminsSlice.save([...previous, optimistic]);

  try {
    const raw = await api.post("/system-settings/sub-admins/", subAdmin);
    if (raw?.id) {
      const current = getSubAdmins();
      subAdminsSlice.save(current.map((s) => (s.id === optimistic.id ? raw : s)));
      return { ok: true, subAdmin: raw };
    }
    return { ok: true, subAdmin: optimistic };
  } catch (err) {
    subAdminsSlice.save(previous);
    console.warn("[systemSettings.subAdmins] add failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeSubAdminAsync(id) {
  const previous = getSubAdmins();
  subAdminsSlice.save(previous.filter((s) => s.id !== id));

  if (typeof id !== "number") return { ok: true };

  try {
    await api.delete(`/system-settings/sub-admins/${id}/`);
    return { ok: true };
  } catch (err) {
    subAdminsSlice.save(previous);
    console.warn("[systemSettings.subAdmins] remove failed:", err);
    return { ok: false, error: err };
  }
}

// ⬇️ FIX: hydrate sub-admins from API on mount
export async function hydrateSubAdminsFromApi() {
  try {
    const data = await api.get("/system-settings/sub-admins/");
    const list = Array.isArray(data) ? data : data?.results || [];
    subAdminsSlice.save(list);
    return { source: "api", count: list.length };
  } catch (err) {
    console.warn("[systemSettings.subAdmins] hydrate failed:", err);
    return { source: "error", count: getSubAdmins().length };
  }
}

/** @deprecated Use addSubAdminAsync */
export function addSubAdmin(subAdmin) {
  const next = [...getSubAdmins(), subAdmin];
  subAdminsSlice.save(next);
  return next;
}

/** @deprecated Use removeSubAdminAsync */
export function removeSubAdmin(id) {
  const next = getSubAdmins().filter((s) => s.id !== id);
  subAdminsSlice.save(next);
  if (typeof id === "number") {
    api
      .delete(`/system-settings/sub-admins/${id}/`)
      .catch((err) => console.warn("[systemSettings.subAdmins] remove silent fail:", err));
  }
  return next;
}

export function useSubAdmins() {
  return subAdminsSlice.useSlice(hydrateSubAdminsFromApi);
}

// ============================================================
// 3. APP STORE LINKS
// ============================================================
const appStoreLinksSlice = makeSlice(
  "sokomkononi_app_store_links_v1",
  "sokomkononi:app-store-links-updated",
  SEED_APP_STORE_LINKS
);

export function getAppStoreLinks() {
  return appStoreLinksSlice.read();
}

export function saveAppStoreLinks(links) {
  appStoreLinksSlice.save(links);
}

export async function saveAppStoreLinksAsync(links) {
  const previous = getAppStoreLinks();
  const next = {
    play: links.play || "",
    appstore: links.appstore || "",
  };

  appStoreLinksSlice.save(next);

  try {
    await api.post("/system-settings/app-store-links/", next);
    return { ok: true, links: next };
  } catch (err) {
    appStoreLinksSlice.save(previous);
    console.warn("[systemSettings.appStoreLinks] save failed:", err);
    return { ok: false, error: err };
  }
}

export async function hydrateAppStoreLinksFromApi() {
  try {
    const data = await api.get("/system-settings/app-store-links/");
    if (data && typeof data === "object") {
      appStoreLinksSlice.save({
        play: data.play || "",
        appstore: data.appstore || "",
      });
    }
    return { source: "api" };
  } catch (err) {
    console.warn("[systemSettingsStore.appStoreLinks] hydrate failed:", err);
    return { source: "error" };
  }
}

export function useAppStoreLinks() {
  return appStoreLinksSlice.useSlice(hydrateAppStoreLinksFromApi);
}

// ============================================================
// 4. PLATFORM POLICY
// ============================================================
const platformPolicySlice = makeSlice(
  "sokomkononi_platform_policy_v1",
  "sokomkononi:platform-policy-updated",
  SEED_PLATFORM_POLICY
);

export function getPlatformPolicy() {
  return platformPolicySlice.read();
}

export function savePlatformPolicy(policy) {
  platformPolicySlice.save(policy);
}

export async function savePlatformPolicyAsync(policy) {
  const previous = getPlatformPolicy();
  const next = { ...previous, ...policy };

  platformPolicySlice.save(next);

  try {
    await api.post("/system-settings/platform-policy/", {
      listing_lifetime_days: next.listingLifetimeDays,
    });
    return { ok: true, policy: next };
  } catch (err) {
    platformPolicySlice.save(previous);
    console.warn("[systemSettings.platformPolicy] save failed:", err);
    return { ok: false, error: err };
  }
}

export async function updatePlatformPolicyAsync(patch) {
  const previous = getPlatformPolicy();
  const next = { ...previous, ...patch };
  platformPolicySlice.save(next);

  const payload = {};
  if (patch.listingLifetimeDays != null) {
    payload.listing_lifetime_days = Number(patch.listingLifetimeDays);
  }

  try {
    await api.post("/system-settings/platform-policy/", payload);
    return { ok: true, policy: next };
  } catch (err) {
    platformPolicySlice.save(previous);
    console.warn("[systemSettings.platformPolicy] update failed:", err);
    return { ok: false, error: err };
  }
}

/** @deprecated Use savePlatformPolicyAsync or updatePlatformPolicyAsync */
export function updatePlatformPolicy(patch) {
  const current = getPlatformPolicy();
  const next = { ...current, ...patch };
  savePlatformPolicy(next);
  return next;
}

export async function hydratePlatformPolicyFromApi() {
  try {
    const data = await api.get("/system-settings/platform-policy/");
    if (data && typeof data === "object") {
      platformPolicySlice.save({
        listingLifetimeDays: data.listing_lifetime_days ?? 60,
      });
    }
    return { source: "api" };
  } catch (err) {
    console.warn("[systemSettingsStore.platformPolicy] hydrate failed:", err);
    return { source: "error" };
  }
}

export function usePlatformPolicy() {
  return platformPolicySlice.useSlice(hydratePlatformPolicyFromApi);
}

// ============================================================
// 5. BULK — load settings zote kwa wakati mmoja
// ============================================================
export async function hydrateAllSystemSettings() {
  const [webhooks, appStore, policy, subAdmins] = await Promise.all([
    hydrateWebhooksFromApi(),
    hydrateAppStoreLinksFromApi(),
    hydratePlatformPolicyFromApi(),
    hydrateSubAdminsFromApi(),
  ]);

  return {
    webhooks,
    appStore,
    policy,
    subAdmins,
    allOk:
      webhooks.source === "api" &&
      appStore.source === "api" &&
      policy.source === "api",
  };
}

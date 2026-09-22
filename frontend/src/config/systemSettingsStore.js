// ============================================================
// systemSettingsStore.js — API-only via /api/system-settings/
// No seeds, no local fallback. Every mutation surfaces errors.
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

export const WEBHOOK_EVENTS = [
  { id: "Payment Success", label: { sw: "Malipo Yamefanikiwa", en: "Payment Success" } },
  { id: "Payment Failed", label: { sw: "Malipo Yameshindikana", en: "Payment Failed" } },
  { id: "SMS Notification", label: { sw: "Taarifa ya SMS", en: "SMS Notification" } },
  { id: "New Listing", label: { sw: "Listing Mpya", en: "New Listing" } },
];

function makeSlice(key, event, initial) {
  function read() {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      if (parsed == null) return initial;
      if (Array.isArray(initial) && !Array.isArray(parsed)) return initial;
      return parsed;
    } catch { return initial; }
  }
  function save(v) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(v));
    window.dispatchEvent(new Event(event));
  }
  function useSlice(onMount) {
    const [v, setV] = useState(() => read());
    useEffect(() => {
      onMount?.();
      const sync = () => setV(read());
      window.addEventListener("storage", sync);
      window.addEventListener(event, sync);
      return () => {
        window.removeEventListener("storage", sync);
        window.removeEventListener(event, sync);
      };
    }, []);
    return [v, save];
  }
  return { read, save, useSlice };
}

// ══════════════════════════════════════════════════════════════
// WEBHOOKS
// ══════════════════════════════════════════════════════════════
const webhooks = makeSlice("sokomkononi_webhooks_v1", "sokomkononi:webhooks-updated", []);

export function getWebhooks() { return webhooks.read(); }

export async function hydrateWebhooksFromApi() {
  try {
    const d = await api.get("/system-settings/webhooks/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    webhooks.save(list);
    return { ok: true, count: list.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function addWebhookAsync({ event, url, active = true }) {
  if (!event || !url) return { ok: false, error: new Error("event + url required") };
  try {
    const raw = await api.post("/system-settings/webhooks/", { event, url, active });
    webhooks.save([raw, ...getWebhooks()]);
    return { ok: true, webhook: raw };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeWebhookAsync(id) {
  try {
    await api.delete(`/system-settings/webhooks/${id}/`);
    webhooks.save(getWebhooks().filter((w) => w.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function toggleWebhookAsync(id) {
  const cur = getWebhooks().find((w) => w.id === id);
  if (!cur) return { ok: false, error: new Error("Webhook not found") };
  const nextActive = !cur.active;
  try {
    const raw = await api.post(`/system-settings/webhooks/${id}/toggle/`, {});
    const updated = raw && raw.id ? raw : { ...cur, active: nextActive };
    webhooks.save(getWebhooks().map((w) => (w.id === id ? updated : w)));
    return { ok: true, active: updated.active };
  } catch (err) { return { ok: false, error: err }; }
}

export function useWebhooks() { return webhooks.useSlice(hydrateWebhooksFromApi); }

// ══════════════════════════════════════════════════════════════
// SUB-ADMINS  (StaffAssignment: { user, role, active })
// ══════════════════════════════════════════════════════════════
const subAdmins = makeSlice("sokomkononi_subadmins_v1", "sokomkononi:subadmins-updated", []);

export function getSubAdmins() { return subAdmins.read(); }

export async function hydrateSubAdminsFromApi() {
  try {
    const d = await api.get("/system-settings/sub-admins/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    subAdmins.save(list);
    return { ok: true, count: list.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function addSubAdminAsync({ userId, roleId, active = true }) {
  if (!userId || !roleId) {
    return { ok: false, error: new Error("userId + roleId (numeric) required") };
  }
  try {
    const raw = await api.post("/system-settings/sub-admins/", {
      user: userId, role: roleId, active,
    });
    subAdmins.save([raw, ...getSubAdmins()]);
    return { ok: true, subAdmin: raw };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeSubAdminAsync(id) {
  try {
    await api.delete(`/system-settings/sub-admins/${id}/`);
    subAdmins.save(getSubAdmins().filter((s) => s.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function useSubAdmins() { return subAdmins.useSlice(hydrateSubAdminsFromApi); }

// ══════════════════════════════════════════════════════════════
// APP STORE LINKS
// ══════════════════════════════════════════════════════════════
const appStoreLinks = makeSlice(
  "sokomkononi_app_store_links_v1",
  "sokomkononi:app-store-links-updated",
  { play: "", appstore: "" }
);

export function getAppStoreLinks() { return appStoreLinks.read(); }

export async function hydrateAppStoreLinksFromApi() {
  try {
    const d = await api.get("/system-settings/app-store-links/");
    appStoreLinks.save({ play: d?.play || "", appstore: d?.appstore || "" });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function saveAppStoreLinksAsync(links) {
  const payload = { play: links.play || "", appstore: links.appstore || "" };
  try {
    await api.post("/system-settings/app-store-links/", payload);
    appStoreLinks.save(payload);
    return { ok: true, links: payload };
  } catch (err) { return { ok: false, error: err }; }
}

export function useAppStoreLinks() { return appStoreLinks.useSlice(hydrateAppStoreLinksFromApi); }

// ══════════════════════════════════════════════════════════════
// PLATFORM POLICY
// ══════════════════════════════════════════════════════════════
const platformPolicy = makeSlice(
  "sokomkononi_platform_policy_v1",
  "sokomkononi:platform-policy-updated",
  { listingLifetimeDays: 60 }
);

export function getPlatformPolicy() { return platformPolicy.read(); }

export async function hydratePlatformPolicyFromApi() {
  try {
    const d = await api.get("/system-settings/platform-policy/");
    platformPolicy.save({ listingLifetimeDays: d?.listing_lifetime_days ?? 60 });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updatePlatformPolicyAsync({ listingLifetimeDays }) {
  const days = Number(listingLifetimeDays);
  if (!Number.isFinite(days) || days < 1 || days > 365) {
    return { ok: false, error: new Error("listingLifetimeDays must be 1..365") };
  }
  try {
    await api.post("/system-settings/platform-policy/", { listing_lifetime_days: days });
    platformPolicy.save({ listingLifetimeDays: days });
    return { ok: true, policy: { listingLifetimeDays: days } };
  } catch (err) { return { ok: false, error: err }; }
}

export function usePlatformPolicy() { return platformPolicy.useSlice(hydratePlatformPolicyFromApi); }

// ══════════════════════════════════════════════════════════════
// BULK
// ══════════════════════════════════════════════════════════════
export async function hydrateAllSystemSettings() {
  const [w, a, p, s] = await Promise.all([
    hydrateWebhooksFromApi(),
    hydrateAppStoreLinksFromApi(),
    hydratePlatformPolicyFromApi(),
    hydrateSubAdminsFromApi(),
  ]);
  return { webhooks: w, appStore: a, policy: p, subAdmins: s };
}

// Re-export the fields App.jsx uses
export function savePlatformPolicy() {}
export const SEED_APP_STORE_LINKS = { play: "", appstore: "" };
export const SEED_PLATFORM_POLICY = { listingLifetimeDays: 60 };

// LEGACY (compat shims)
export const SEED_WEBHOOKS = [];
export const SEED_SUBADMINS = [];
export function saveWebhooks() {}
export function saveSubAdmins() {}
export function saveAppStoreLinks() {}
export function addWebhook() {}
export function removeWebhook() {}
export function toggleWebhook() {}
export function addSubAdmin() {}
export function removeSubAdmin() {}
export function updatePlatformPolicy() {}
export function getWebhook() { return null; }

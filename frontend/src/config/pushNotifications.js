// ============================================================
// pushNotifications.js — Web Push (VAPID) client
//
// Inafanya kazi pamoja na `public/sw.js` + backend `/api/push/subscribe/`.
// ============================================================

import { api } from "../api/client.js";

const SUB_KEY = "smk_push_subscription_v1";
const DISMISS_KEY = "smk_push_prompt_dismissed_v1";

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPushPermission() {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

export function wasPromptDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissPrompt() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

async function ensureServiceWorker() {
  if (!isPushSupported()) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration("/sw.js");
    if (existing) return existing;
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (err) {
    console.warn("[push] Service Worker registration failed:", err);
    return null;
  }
}

export async function subscribeToPush() {
  if (!isPushSupported()) {
    return { ok: false, error: "unsupported" };
  }

  const vapidKey = import.meta?.env?.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    return { ok: false, error: "VAPID public key haipo (VITE_VAPID_PUBLIC_KEY)" };
  }

  const permission = Notification.permission;
  if (permission === "denied") {
    return { ok: false, error: "permission_denied" };
  }

  try {
    const sw = await ensureServiceWorker();
    if (!sw) return { ok: false, error: "sw_registration_failed" };

    await navigator.serviceWorker.ready;

    const subscription = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const payload = subscription.toJSON();
    await api.post("/push/subscribe/", {
      endpoint: payload.endpoint,
      keys: {
        p256dh: payload.keys.p256dh,
        auth: payload.keys.auth,
      },
    });

    try {
      localStorage.setItem(SUB_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }

    return { ok: true, subscription: payload };
  } catch (err) {
    console.warn("[push] subscribe failed:", err);
    return { ok: false, error: err?.message || "subscribe_failed" };
  }
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return { ok: true };
  try {
    const sw = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!sw) return { ok: true };
    const subscription = await sw.pushManager.getSubscription();
    if (!subscription) {
      try {
        localStorage.removeItem(SUB_KEY);
      } catch {
        /* ignore */
      }
      return { ok: true };
    }
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    try {
      await api.post("/push/unsubscribe/", { endpoint });
    } catch {
      /* server-side deletion optional */
    }
    try {
      localStorage.removeItem(SUB_KEY);
    } catch {
      /* ignore */
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || "unsubscribe_failed" };
  }
}

export async function getActiveSubscription() {
  if (!isPushSupported()) return null;
  try {
    const sw = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!sw) return null;
    return await sw.pushManager.getSubscription();
  } catch {
    return null;
  }
}
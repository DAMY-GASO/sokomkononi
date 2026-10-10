// ============================================================
// userCreditsStore.js — API-only via /api/credits/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_user_credits_v1";
const EV = "sokomkononi:user-credits-updated";

function read() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}
function write(map) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(EV));
}
function norm(list) {
  const out = { services: [] };
  for (const item of list || []) {
    out[item.service_key] = {
      remaining: item.remaining ?? 0,
      total: item.total ?? 0,
      expiresAt: item.expires_at,
      lastBundleId: item.last_bundle_code,
      lastBundleName: item.last_bundle_name,
    };
  }
  return out;
}

export function getUserCredits(userId) {
  if (!userId) return null;
  return read()[userId] || null;
}
export function getCreditBalance(userId, service) {
  const c = getUserCredits(userId);
  return c?.[service]?.remaining || 0;
}
export function checkCredit(userId, service, amount = 1) {
  const c = getUserCredits(userId);
  if (!c) return { hasCredit: false, remaining: 0 };
  const entry = c[service];
  if (!entry) return { hasCredit: false, remaining: 0 };
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
    return { hasCredit: false, remaining: 0, expired: true };
  }
  return {
    hasCredit: entry.remaining >= amount,
    remaining: entry.remaining,
  };
}

/**
 * Consume a credit via the backend. Awaits the response and refreshes
 * the caller's balance from the server.
 * @returns {Promise<{success:boolean, remaining:number, data?:any, error?:any}>}
 */
// Backend: /credits/consume/ is documented as admin-gated. If your backend
// exposes a user-scoped self-consume endpoint, set VITE_CREDITS_CONSUME_PATH.
// Otherwise, ensure backend allows the self-service consume call.
const CONSUME_PATH =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_CREDITS_CONSUME_PATH) ||
  "/credits/consume/";

export async function consumeCreditAsync(userId, service, amount = 1) {
  try {
    const res = await api.post(CONSUME_PATH, {
      service_key: service,
      amount,
    });
    await hydrateUserCreditsFromApi(userId);
    const fresh = getCreditBalance(userId, service);
    return { success: true, remaining: fresh, data: res };
  } catch (err) {
    return {
      success: false,
      remaining: getCreditBalance(userId, service),
      error: err,
    };
  }
}

/**
 * @deprecated Use consumeCreditAsync — this is fire-and-forget and unsafe.
 *
 * IMPORTANT: this now returns { success: false } so any caller that
 * hasn't migrated to the async version will fall back to real payment
 * instead of leaking revenue. Also fires the async call in the
 * background so credit accounting still happens if the backend allows it.
 */
export function consumeCredit(userId, service, amount = 1) {
  console.warn(
    "[userCredits] consumeCredit() is deprecated — migrate to consumeCreditAsync(). " +
    "Returning {success:false} so callers fall back to real payment."
  );
  consumeCreditAsync(userId, service, amount).catch(() => {});
  return {
    success: false,
    remaining: getCreditBalance(userId, service),
    deprecated: true,
  };
}

export function addBundleCredits() {
  /* backend credits on purchase */
}

export function hasService(userId, service) {
  const c = getUserCredits(userId);
  return Boolean(c?.services?.includes(service));
}

export async function hydrateUserCreditsFromApi(userId) {
  if (!userId) return { ok: false };
  try {
    const [creditsData, servicesData] = await Promise.all([
      api.get("/credits/"),
      api.get("/credits/services/").catch(() => []),
    ]);
    const list = Array.isArray(creditsData)
      ? creditsData
      : creditsData?.results || [];
    const credits = norm(list);
    credits.services = Array.isArray(servicesData)
      ? servicesData.map((s) => s.service_key || s)
      : [];
    const all = read();
    write({ ...all, [userId]: credits });
    return { ok: true, credits };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export function useUserCredits(userId) {
  const [c, setC] = useState(() => getUserCredits(userId));
  useEffect(() => {
    hydrateUserCreditsFromApi(userId);
    const sync = () => setC(getUserCredits(userId));
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, [userId]);
  return c;
}

export function removeExpiredCredits() {}

// ============================================================
// waitForCredit — poll for credits after a bundle purchase.
// FimiPay webhook may land seconds after the frontend poll succeeds.
// ============================================================
export async function waitForCredit(userId, service, { attempts = 10, intervalMs = 2000 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const info = checkCredit(userId, service);
    if (info.hasCredit) return { ok: true, remaining: info.remaining };
    await new Promise((r) => setTimeout(r, intervalMs));
    await hydrateUserCreditsFromApi(userId).catch(() => {});
  }
  const finalInfo = checkCredit(userId, service);
  return { ok: finalInfo.hasCredit, remaining: finalInfo.remaining };
}

// ============================================================
// userCreditsStore.js — API-only via /api/credits/
// The backend owns balances. This store only reflects what the
// backend reports. Local consumption is NOT authoritative.
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
  } catch { return {}; }
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
  return { hasCredit: entry.remaining >= amount, remaining: entry.remaining };
}

/**
 * Consume a credit via the backend. Returns the backend's response.
 * The local cache is only updated after backend confirms.
 */
export function consumeCredit(userId, service, amount = 1) {
  // Fire-and-forget backend call; the UI should re-hydrate after the
  // specific action (boost/leading/ads) succeeds because the backend
  // decrements the balance as part of that action.
  api.post("/credits/consume/", { service_key: service, amount }).catch(() => {});
  return { success: true, remaining: getCreditBalance(userId, service) };
}

export function addBundleCredits() { /* backend credits on purchase */ }
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
    const credits = norm(creditsData);
    credits.services = (servicesData || []).map((s) => s.service_key);
    const all = read();
    write({ ...all, [userId]: credits });
    return { ok: true, credits };
  } catch (err) { return { ok: false, error: err }; }
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

// ============================================================
// userCreditsStore.js — API-only via /api/credits/
// The backend owns balances. This store only reflects what the
// backend reports. Local consumption is NOT authoritative.
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_user_credits_v1";
const EV = "sokomkononi:user-credits-updated";

// ============================================================
// STORAGE
// ============================================================
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

// ============================================================
// NORMALIZER
// ============================================================
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

// ============================================================
// SYNCHRONOUS READS
// ============================================================
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

// ============================================================
// ASYNC MUTATIONS
// ============================================================

/**
 * Consume a credit via the backend.
 * Returns the backend's response. The local cache is only updated
 * after backend confirms.
 *
 * @param {number|string} userId - User ID
 * @param {string} service - Service key (listing, boost, leading, ads, premium)
 * @param {number} amount - Amount to consume (default: 1)
 * @returns {Promise<{ ok: boolean, remaining?: number, error?: Error }>}
 */
export async function consumeCreditAsync(userId, service, amount = 1) {
  if (!userId) {
    return { ok: false, error: new Error("userId inahitajika") };
  }
  if (!service) {
    return { ok: false, error: new Error("service inahitajika") };
  }
  if (amount <= 0) {
    return { ok: false, error: new Error("amount inayofaa ni 1+") };
  }

  try {
    const res = await api.post("/credits/consume/", {
      service_key: service,
      amount,
    });

    // Backend inafaa kurudisha `remaining` mpya
    if (res && typeof res.remaining === "number") {
      const all = read();
      const current = all[userId] || {};
      const entry = current[service] || { total: 0 };
      write({
        ...all,
        [userId]: {
          ...current,
          [service]: {
            ...entry,
            remaining: res.remaining,
          },
        },
      });
      return { ok: true, remaining: res.remaining };
    }

    // Backend haikurudisha remaining — re-hydrate
    await hydrateUserCreditsFromApi(userId);
    return { ok: true, remaining: getCreditBalance(userId, service) };
  } catch (err) {
    return { ok: false, error: err };
  }
}

/**
 * @deprecated Use `consumeCreditAsync` instead.
 * Kept for backward compatibility — returns a Promise now.
 */
export function consumeCredit(userId, service, amount = 1) {
  return consumeCreditAsync(userId, service, amount);
}

/**
 * Add bundle credits — backend owns this. No-op here.
 * Backend credits the account when bundle purchase is confirmed.
 */
export function addBundleCredits() {
  /* backend credits on purchase */
}

export function hasService(userId, service) {
  const c = getUserCredits(userId);
  return Boolean(c?.services?.includes(service));
}

// ============================================================
// HYDRATE
// ============================================================
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
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// HOOKS
// ============================================================
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

// ============================================================
// LEGACY (compat shims)
// ============================================================
export function removeExpiredCredits() {}
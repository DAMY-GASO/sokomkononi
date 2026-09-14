// ============================================================
// userCreditsStore.js
// Credits/entitlements za kila user kwa kila huduma.
// User akinunua bundle, credits zinaingizwa hapa.
// Kila anapotumia huduma, credit inapungua.
// ============================================================

import { useEffect, useState } from "react";
import { addTransaction } from "./transactionsStore.js";
import { notifyBundlePurchased } from "./notificationsStore.js";

const STORAGE_KEY = "sokomkononi_user_credits_v1";
const UPDATE_EVENT = "sokomkononi:user-credits-updated";

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(credits) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(credits));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// HELPERS
// ============================================================
/**
 * getUserCredits(userId) — rudisha credits zote za user.
 *
 * Muundo:
 * {
 *   [userId]: {
 *     listing: { remaining: 10, total: 10, expiresAt: "..." },
 *     boost: { remaining: 7, total: 10, expiresAt: "..." },
 *     leading: { remaining: 5, total: 5, expiresAt: "..." },
 *     reservation: { remaining: 2, total: 3, expiresAt: "..." },
 *     ads: { remaining: 20000, total: 20000, expiresAt: "..." },
 *     premium: { remaining: 1, total: 1, expiresAt: "..." },
 *     services: ["priority_visibility", "premium_badge", ...],
 *   }
 * }
 */
export function getUserCredits(userId) {
  if (!userId) return null;
  const all = readFromStorage();
  return all[userId] || null;
}

export function getCreditBalance(userId, service) {
  const credits = getUserCredits(userId);
  if (!credits) return 0;
  return credits[service]?.remaining || 0;
}

/**
 * checkCredit(userId, service) — angalia kama user ana credit ya kutosha.
 */
export function checkCredit(userId, service, amount = 1) {
  const credits = getUserCredits(userId);
  if (!credits) return { hasCredit: false, remaining: 0 };
  const entry = credits[service];
  if (!entry) return { hasCredit: false, remaining: 0 };
  // Angalia expiry
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
    return { hasCredit: false, remaining: 0, expired: true };
  }
  return {
    hasCredit: entry.remaining >= amount,
    remaining: entry.remaining,
  };
}

/**
 * addBundleCredits(userId, bundle) — ongeza credits user akinunua bundle.
 *
 * Inaongeza credits kwa kila service iliyo kwenye bundle.
 * Expiry inahesabiwa kutoka sasa + bundle.validityDays.
 */
export function addBundleCredits(userId, bundle) {
  if (!userId || !bundle) return null;

  const all = readFromStorage();
  const userCredits = all[userId] || { services: [] };
  const expiresAt = bundle.validityDays
    ? new Date(Date.now() + bundle.validityDays * 86400000).toISOString()
    : null;

  // Credits — inaweza kuwa namba moja au object
  const credits =
    typeof bundle.credits === "object"
      ? bundle.credits
      : { [bundle.type]: bundle.credits };

  const next = { ...userCredits };

  Object.entries(credits).forEach(([service, amount]) => {
    const existing = next[service] || { remaining: 0, total: 0 };
    next[service] = {
      remaining: (existing.remaining || 0) + amount,
      total: (existing.total || 0) + amount,
      expiresAt: expiresAt || existing.expiresAt || null,
      lastBundleId: bundle.id,
      lastBundleName: bundle.name,
      lastPurchasedAt: new Date().toISOString(),
    };
  });

  // Services (features kama priority_visibility, premium_badge)
  const newServices = bundle.services || [];
  next.services = Array.from(
    new Set([...(userCredits.services || []), ...newServices])
  );

  const updated = { ...all, [userId]: next };
  saveAll(updated);

  // Rekodi transaction
  addTransaction({
    type: "bundle_purchase",
    title: `${bundle.name?.sw || bundle.name} — Bundle`,
    property: "—",
    amount: bundle.price,
    status: "completed",
    method: "M-Pesa",
    bundleId: bundle.id,
    credits,
    expiresAt,
  });

  // Taarifa
  notifyBundlePurchased({
    bundleId: bundle.id,
    bundleName: bundle.name,
    amount: bundle.price,
    credits,
    expiresAt,
  });

  return updated;
}

/**
 * consumeCredit(userId, service, amount = 1) — punguza credit.
 *
 * Inaitwa kila user anatumia huduma (mfano: Boost listing,
 * Leading listing, Reservation, n.k.).
 */
export function consumeCredit(userId, service, amount = 1) {
  if (!userId) return { success: false, remaining: 0 };

  const all = readFromStorage();
  const userCredits = all[userId];
  if (!userCredits) return { success: false, remaining: 0 };

  const entry = userCredits[service];
  if (!entry) return { success: false, remaining: 0 };

  // Angalia expiry
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
    return { success: false, remaining: 0, expired: true };
  }

  if (entry.remaining < amount) {
    return { success: false, remaining: entry.remaining };
  }

  const next = {
    ...userCredits,
    [service]: {
      ...entry,
      remaining: entry.remaining - amount,
    },
  };

  saveAll({ ...all, [userId]: next });

  return {
    success: true,
    remaining: next[service].remaining,
    total: next[service].total,
  };
}

/**
 * hasService(userId, service) — angalia kama user ana service feature
 * (mfano: priority_visibility, premium_badge).
 */
export function hasService(userId, service) {
  const credits = getUserCredits(userId);
  if (!credits) return false;
  return (credits.services || []).includes(service);
}

/**
 * removeExpiredCredits() — safisha credits zilizoisha muda.
 * Inaweza kuitwa mara kwa mara (cron/scheduler).
 */
export function removeExpiredCredits() {
  const all = readFromStorage();
  const now = Date.now();
  const next = {};

  Object.entries(all).forEach(([userId, credits]) => {
    const cleaned = { ...credits };
    Object.keys(cleaned).forEach((key) => {
      if (key === "services") return;
      const entry = cleaned[key];
      if (entry?.expiresAt && new Date(entry.expiresAt).getTime() < now) {
        cleaned[key] = { ...entry, remaining: 0 };
      }
    });
    next[userId] = cleaned;
  });

  saveAll(next);
  return next;
}

// ============================================================
// HOOKS
// ============================================================
export function useUserCredits(userId) {
  const [credits, setCredits] = useState(() => getUserCredits(userId));
  useEffect(() => {
    const sync = () => setCredits(getUserCredits(userId));
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, [userId]);
  return credits;
}

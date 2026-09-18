// ============================================================
// userCreditsStore.js — API-backed via /api/credits/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_user_credits_v1";
const UPDATE_EVENT = "sokomkononi:user-credits-updated";

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

function normalizeCreditsFromApi(list) {
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
  const all = readFromStorage();
  return all[userId] || null;
}

export function getCreditBalance(userId, service) {
  const credits = getUserCredits(userId);
  if (!credits) return 0;
  return credits[service]?.remaining || 0;
}

export function checkCredit(userId, service, amount = 1) {
  const credits = getUserCredits(userId);
  if (!credits) return { hasCredit: false, remaining: 0 };
  const entry = credits[service];
  if (!entry) return { hasCredit: false, remaining: 0 };
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
    return { hasCredit: false, remaining: 0, expired: true };
  }
  return {
    hasCredit: entry.remaining >= amount,
    remaining: entry.remaining,
  };
}

export function addBundleCredits(userId, bundle) {
  if (!userId || !bundle) return null;
  const all = readFromStorage();
  const userCredits = all[userId] || { services: [] };
  const expiresAt = bundle.validityDays
    ? new Date(Date.now() + bundle.validityDays * 86400000).toISOString()
    : null;
  const credits = typeof bundle.credits === "object"
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
  next.services = Array.from(new Set([...(userCredits.services || []), ...(bundle.services || [])]));
  saveAll({ ...all, [userId]: next });
  return { ...all, [userId]: next };
}

export function consumeCredit(userId, service, amount = 1) {
  const all = readFromStorage();
  const userCredits = all[userId];
  if (!userCredits) return { success: false, remaining: 0 };
  const entry = userCredits[service];
  if (!entry) return { success: false, remaining: 0 };
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) {
    return { success: false, remaining: 0, expired: true };
  }
  if (entry.remaining < amount) return { success: false, remaining: entry.remaining };
  const next = {
    ...userCredits,
    [service]: { ...entry, remaining: entry.remaining - amount },
  };
  saveAll({ ...all, [userId]: next });
  api.post("/credits/consume/", { service_key: service, amount }).catch(() => {});
  return {
    success: true,
    remaining: next[service].remaining,
    total: next[service].total,
  };
}

export function hasService(userId, service) {
  const credits = getUserCredits(userId);
  if (!credits) return false;
  return (credits.services || []).includes(service);
}

export function removeExpiredCredits() {}

export async function hydrateUserCreditsFromApi(userId) {
  if (!userId) return null;
  try {
    const [creditsData, servicesData] = await Promise.all([
      api.get("/credits/").catch(() => []),
      api.get("/credits/services/").catch(() => []),
    ]);
    const credits = normalizeCreditsFromApi(creditsData);
    credits.services = (servicesData || []).map((s) => s.service_key);
    const all = readFromStorage();
    saveAll({ ...all, [userId]: credits });
    return credits;
  } catch (err) {
    console.warn("[userCreditsStore] hydrate failed:", err);
    return getUserCredits(userId);
  }
}

export function useUserCredits(userId) {
  const [credits, setCredits] = useState(() => getUserCredits(userId));
  useEffect(() => {
    hydrateUserCreditsFromApi(userId);
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

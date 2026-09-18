// ============================================================
// leadingFeeStore.js — API-backed via /api/leading-fees/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_leading_fee_config_v1";
const UPDATE_EVENT = "sokomkononi:leading-fee-config-updated";

export const SEED_LEADING_FEE_CONFIG = {
  price: 10000,
  days: 7,
  label: { sw: "Ada ya Kipaumbele", en: "Leading Fee" },
  desc: {
    sw: "Bidhaa yako inapanda juu ya matokeo ya utafutaji kwa siku 7",
    en: "Your listing appears at the top of search results for 7 days",
  },
};

function readFromStorage() {
  if (typeof window === "undefined") return SEED_LEADING_FEE_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LEADING_FEE_CONFIG;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.price !== "number") return SEED_LEADING_FEE_CONFIG;
    return { ...SEED_LEADING_FEE_CONFIG, ...parsed };
  } catch {
    return SEED_LEADING_FEE_CONFIG;
  }
}

function saveLocal(config) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function normalizeFromApi(raw) {
  if (!raw) return SEED_LEADING_FEE_CONFIG;
  return {
    price: Number(raw.price) || SEED_LEADING_FEE_CONFIG.price,
    days: Number(raw.days) || SEED_LEADING_FEE_CONFIG.days,
    label: raw.label || SEED_LEADING_FEE_CONFIG.label,
    desc: raw.desc || SEED_LEADING_FEE_CONFIG.desc,
  };
}

export function getLeadingFeeConfig() {
  return readFromStorage();
}

export function saveLeadingFeeConfig(config) {
  saveLocal(config);
}

export function updateLeadingFeePrice(price) {
  const current = getLeadingFeeConfig();
  const next = { ...current, price: Number(price) };
  saveLocal(next);
  api.patch("/leading-fees/", { price: next.price }).catch(() => {});
  return next;
}

export async function hydrateLeadingFeeFromApi() {
  try {
    const data = await api.get("/leading-fees/");
    const normalized = normalizeFromApi(data);
    saveLocal(normalized);
    return normalized;
  } catch (err) {
    console.warn("[leadingFeeStore] hydrate failed:", err);
    return getLeadingFeeConfig();
  }
}

export function useLeadingFeeConfig() {
  const [config, setConfig] = useState(() => getLeadingFeeConfig());

  useEffect(() => {
    hydrateLeadingFeeFromApi();
    const sync = () => setConfig(getLeadingFeeConfig());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return config;
}

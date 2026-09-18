// ============================================================
// advertisementFeeStore.js — API-backed via /api/advertisement-fees/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_advertisement_fee_config_v1";
const UPDATE_EVENT = "sokomkononi:advertisement-fee-config-updated";

export const SEED_ADVERTISEMENT_FEE_CONFIG = {
  price: 25000,
  days: 7,
  label: { sw: "Ada ya Matangazo", en: "Advertisement Fee" },
  desc: {
    sw: "Banner inayozunguka kwenye Dashboard (5s rotation) kwa siku 7",
    en: "Rotating banner on the Dashboard (5s rotation) for 7 days",
  },
};

function readFromStorage() {
  if (typeof window === "undefined") return SEED_ADVERTISEMENT_FEE_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_ADVERTISEMENT_FEE_CONFIG;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.price !== "number") return SEED_ADVERTISEMENT_FEE_CONFIG;
    return { ...SEED_ADVERTISEMENT_FEE_CONFIG, ...parsed };
  } catch {
    return SEED_ADVERTISEMENT_FEE_CONFIG;
  }
}

function saveLocal(config) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function normalizeFromApi(raw) {
  if (!raw) return SEED_ADVERTISEMENT_FEE_CONFIG;
  return {
    price: Number(raw.price) || SEED_ADVERTISEMENT_FEE_CONFIG.price,
    days: Number(raw.days) || SEED_ADVERTISEMENT_FEE_CONFIG.days,
    label: raw.label || SEED_ADVERTISEMENT_FEE_CONFIG.label,
    desc: raw.desc || SEED_ADVERTISEMENT_FEE_CONFIG.desc,
  };
}

export function getAdvertisementFeeConfig() {
  return readFromStorage();
}

export function saveAdvertisementFeeConfig(config) {
  saveLocal(config);
}

export function updateAdvertisementFeePrice(price) {
  const current = getAdvertisementFeeConfig();
  const next = { ...current, price: Number(price) };
  saveLocal(next);
  api.patch("/advertisement-fees/", { price: next.price }).catch(() => {});
  return next;
}

export async function hydrateAdvertisementFeeFromApi() {
  try {
    const data = await api.get("/advertisement-fees/");
    const normalized = normalizeFromApi(data);
    saveLocal(normalized);
    return normalized;
  } catch (err) {
    console.warn("[advertisementFeeStore] hydrate failed:", err);
    return getAdvertisementFeeConfig();
  }
}

export function useAdvertisementFeeConfig() {
  const [config, setConfig] = useState(() => getAdvertisementFeeConfig());

  useEffect(() => {
    hydrateAdvertisementFeeFromApi();
    const sync = () => setConfig(getAdvertisementFeeConfig());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return config;
}

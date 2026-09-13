// ============================================================
// advertisementFeeStore.js
// CHANZO KIMOJA CHA UKWELI kwa Advertisement Fee — muuzaji analipia
// "banner slot" inayozunguka (rotate) kwenye Dashboard (buyer na
// seller side zote mbili), ikitangaza listing yake maalum, kwa muda
// fulani (default: wiki 1 / siku 7).
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; useAdvertisementFeeConfig() na getAdvertisementFeeConfig()
// hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_advertisement_fee_config_v1";
const UPDATE_EVENT = "sokomkononi:advertisement-fee-config-updated";

// ============================================================
// SEED_ADVERTISEMENT_FEE_CONFIG — bilingual
// `label` na `desc` zina { sw, en }.
// ============================================================
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

/** Soma config ya sasa (snapshot moja, si reactive). */
export function getAdvertisementFeeConfig() {
  return readFromStorage();
}

/** Andika config mpya kamili (Admin pekee anapaswa kuita hii). */
export function saveAdvertisementFeeConfig(config) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Badilisha bei pekee. */
export function updateAdvertisementFeePrice(price) {
  const current = getAdvertisementFeeConfig();
  const next = { ...current, price: Number(price) };
  saveAdvertisementFeeConfig(next);
  return next;
}

/**
 * Hook ya React inayosoma config na kujisasisha yenyewe.
 */
export function useAdvertisementFeeConfig() {
  const [config, setConfig] = useState(() => getAdvertisementFeeConfig());

  useEffect(() => {
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

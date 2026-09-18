// ============================================================
// leadingFeeStore.js
// CHANZO KIMOJA CHA UKWELI kwa Leading Fee — muuzaji analipia
// bidhaa yake "ipande juu" kwenye matokeo ya utafutaji (search
// priority) kwa muda fulani (default: wiki 1 / siku 7).
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; useLeadingFeeConfig() na getLeadingFeeConfig()
// hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_leading_fee_config_v1";
const UPDATE_EVENT = "sokomkononi:leading-fee-config-updated";

// ============================================================
// SEED_LEADING_FEE_CONFIG — bilingual
// `label` na `desc` zina { sw, en }.
// ============================================================
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

/** Soma config ya sasa (snapshot moja, si reactive). */
export function getLeadingFeeConfig() {
  return readFromStorage();
}

/** Andika config mpya kamili (Admin pekee anapaswa kuita hii). */
export function saveLeadingFeeConfig(config) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Badilisha bei pekee. */
export function updateLeadingFeePrice(price) {
  const current = getLeadingFeeConfig();
  const next = { ...current, price: Number(price) };
  saveLeadingFeeConfig(next);
  return next;
}

/**
 * Hook ya React inayosoma config na kujisasisha yenyewe.
 */
export function useLeadingFeeConfig() {
  const [config, setConfig] = useState(() => getLeadingFeeConfig());

  useEffect(() => {
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

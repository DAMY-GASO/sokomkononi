// ============================================================
// listingFeeStore.js
// CHANZO KIMOJA CHA UKWELI kwa Listing Fee (rate% + min/max kwa kila
// category) — hii ndiyo namba HALISI zinazotozwa muuzaji wakati
// akiweka mali (calculateListingFee() kwenye shared.js).
//
// MUHIMU — UNGANISHO NA categoriesStore.js:
//   Categories zinatoka categoriesStore.js (chanzo kimoja cha ukweli,
//   Admin anaongeza/kufuta kupitia System Settings > Categories).
//   Fee configs hapa zinatakiwa kuwa na key MOJA kwa MOJA kwa kila
//   category hai. Kama category hai lakini haina fee config,
//   calculateListingFee() inarudi { error: "NO_FEE_CONFIG" } — UI
//   inamuelekeza Admin kwenye Revenue > Categories Bila Fee Config.
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; useListingFeeConfigs() na getListingFeeConfig()
// hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_listing_fee_config_v1";
const UPDATE_EVENT = "sokomkononi:listing-fee-config-updated";

export const SEED_LISTING_FEE_CONFIG = [
  { key: "nyumba", label: "Nyumba & Majengo", rate: 0.010, min: 20000, max: 300000 },
  { key: "viwanja", label: "Viwanja & Mashamba", rate: 0.008, min: 15000, max: 250000 },
  { key: "magari", label: "Magari", rate: 0.015, min: 10000, max: 150000 },
  { key: "biashara", label: "Biashara Zinazouzwa", rate: 0.012, min: 20000, max: 200000 },
  { key: "mashine", label: "Mashine / Heavy Equipment", rate: 0.010, min: 15000, max: 180000 },
];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_LISTING_FEE_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LISTING_FEE_CONFIG;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_LISTING_FEE_CONFIG;
    return parsed;
  } catch {
    return SEED_LISTING_FEE_CONFIG;
  }
}

/** Soma configs za sasa (snapshot moja, si reactive) — hutumika na
 * shared.js (calculateListingFee) ambayo si component ya React. */
export function getListingFeeConfigs() {
  return readFromStorage();
}

/** Pata config ya category moja kwa key yake. Inarudi undefined kama
 *  haipo — calculateListingFee() inashughulikia hilo kwa NO_FEE_CONFIG. */
export function getListingFeeConfig(categoryKey) {
  return getListingFeeConfigs().find((c) => c.key === categoryKey);
}

/** Andika seti mpya kamili ya configs (Admin pekee anapaswa kuita hii). */
export function saveListingFeeConfigs(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Badilisha (merge patch) config ya category moja — mfano
 * updateListingFeeConfig("magari", { rate: 0.02 }) au { min, max }. */
export function updateListingFeeConfig(categoryKey, patch) {
  const current = getListingFeeConfigs();
  const next = current.map((c) => (c.key === categoryKey ? { ...c, ...patch } : c));
  saveListingFeeConfigs(next);
  return next;
}

// ============================================================
// FEE CONFIG MANAGEMENT kwa categories mpya
// ============================================================

/**
 * Je, category hii ina fee config? Hutumika na RevenueSection
 * kuonyesha categories zilizo hai lakini hazina fee bado.
 */
export function hasFeeConfig(categoryKey) {
  return getListingFeeConfigs().some((c) => c.key === categoryKey);
}

/**
 * Ongeza fee config ya category mpya kwa default rate/min/max.
 * Admin anaweza kuhariri baadaye kwa EditablePercent/EditableAmount.
 *
 * @param {string} categoryKey - key ya category (mf. "pikipiki")
 * @param {string} label - label ya kuonyesha (mf. "Pikipiki")
 */
export function addFeeConfig(categoryKey, label) {
  const current = getListingFeeConfigs();
  if (current.some((c) => c.key === categoryKey)) {
    throw new Error(`Fee config ya "${categoryKey}" ipo tayari.`);
  }
  const next = [
    ...current,
    {
      key: categoryKey,
      label: label || categoryKey,
      rate: 0.01,      // 1%
      min: 10000,      // TZS 10,000
      max: 100000,     // TZS 100,000
    },
  ];
  saveListingFeeConfigs(next);
  return next;
}

/**
 * Ondoa fee config. Kwa kawaida haihitajiki kwa sababu kufuta
 * category kunazuia kama kuna listings — lakini hii inasaidia Admin
 * kama anataka kufuta config pekee (mf. aliyekuwa ameongeza config
 * ya category isiyotumika).
 */
export function removeFeeConfig(categoryKey) {
  const next = getListingFeeConfigs().filter((c) => c.key !== categoryKey);
  saveListingFeeConfigs(next);
  return next;
}

/**
 * Hook ya React inayosoma configs na kujisasisha yenyewe — kwenye
 * AdminDashboard (Revenue > Listing Fee) papo hapo, bila reload.
 */
export function useListingFeeConfigs() {
  const [configs, setConfigs] = useState(() => getListingFeeConfigs());

  useEffect(() => {
    const sync = () => setConfigs(getListingFeeConfigs());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return configs;
}

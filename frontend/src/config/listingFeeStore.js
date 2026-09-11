// ============================================================
// listingFeeStore.js
// CHANZO KIMOJA CHA UKWELI kwa Listing Fee (rate% + min/max kwa kila
// category) — hii ndiyo namba HALISI zinazotozwa muuzaji wakati
// akiweka mali (calculateListingFee() kwenye shared.js).
//
// Kabla ya hii, Admin > Revenue > Listing Fee ilikuwa na
// INITIAL_LISTING_TIERS yake — tiers za bei-ya-mali (mfano "TZS 0 –
// 10,000,000 → fee TZS 20,000") zisizo na uhusiano wowote na fomula
// halisi iliyotumika kuunda listing (CATEGORIES[].fee = {rate, min,
// max} kwenye shared.js, kwa kila category — nyumba, magari, n.k.).
// Admin akibadilisha "Listing Fee" kwenye Revenue, PostPropertyForm
// haikujua kabisa. Sasa zote mbili zinasoma/kuandika hapa.
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

/** Pata config ya category moja kwa key yake. */
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

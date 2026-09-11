// ============================================================
// advertisementFeeStore.js
// CHANZO KIMOJA CHA UKWELI kwa Advertisement Fee — muuzaji analipia
// "banner slot" inayozunguka (rotate) kwenye Dashboard (buyer na
// seller side zote mbili), ikitangaza listing yake maalum, kwa muda
// fulani (default: wiki 1 / siku 7).
//
// Kabla ya hii, "Advertisement Fee" kwenye Admin > Revenue ilikuwa
// namba tuli (INITIAL_FLAT_FEES.ads, TZS 25,000/wiki) isiyounganishwa
// na bidhaa yoyote — hakuna banner iliyowahi kuonekana popote. Sasa:
// AdvertiseSasa.jsx (ukurasa wa muuzaji) inasoma bei kutoka hapa, na
// baada ya malipo huunda rekodi ya banner kwenye bannerAdsStore.js
// (chanzo cha rekodi za banner zenyewe). DashboardShell.jsx husoma
// banner hai (active) kutoka bannerAdsStore na kuzizungusha kila
// sekunde 5. Admin > Revenue > Advertisement Fee sasa inasoma/
// kuandika bei hapa hapa.
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; useAdvertisementFeeConfig() na getAdvertisementFeeConfig()
// hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_advertisement_fee_config_v1";
const UPDATE_EVENT = "sokomkononi:advertisement-fee-config-updated";

export const SEED_ADVERTISEMENT_FEE_CONFIG = {
  price: 25000,
  days: 7,
  label: "Advertisement Fee",
  desc: "Banner inayozunguka kwenye Dashboard (5s rotation) kwa siku 7",
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

/** Badilisha bei pekee — hii ndiyo inayoitwa na EditableAmount
 * kwenye Admin > Revenue > Advertisement Fee. */
export function updateAdvertisementFeePrice(price) {
  const current = getAdvertisementFeeConfig();
  const next = { ...current, price: Number(price) };
  saveAdvertisementFeeConfig(next);
  return next;
}

/**
 * Hook ya React inayosoma config na kujisasisha yenyewe — kwenye
 * AdvertiseSasa (muuzaji) na AdminDashboard (Revenue) papo hapo,
 * bila reload.
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

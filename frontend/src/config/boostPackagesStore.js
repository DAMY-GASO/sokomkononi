// ============================================================
// boostPackagesStore.js
// CHANZO KIMOJA CHA UKWELI kwa bei za Boost Packages (Basic/Featured/
// Premium) zinazotumika kwenye BoostSasa.jsx.
//
// Kabla ya hii, BOOST_PACKAGES ilikuwa imewekwa moja kwa moja (hardcoded)
// kwenye shared.js — Admin > Revenue & Financial Settings ilikuwa na
// "Boosting Fee" yake tofauti kabisa (TZS 15,000/wiki) isiyo na uhusiano
// wowote na bei halisi zinazotozwa kwenye BoostSasa (Basic/Featured/
// Premium kwa siku). Admin akibadilisha "Boosting Fee", BoostSasa
// haikujua kabisa. Sasa zote mbili zinasoma/kuandika hapa.
//
// Kama stores nyingine — demo ya front-end pekee, localStorage + custom
// event. Backend halisi ikiwepo, badilisha functions hizi ziite API;
// useBoostPackages() na getBoostPackage() hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_boost_packages_v1";
const UPDATE_EVENT = "sokomkononi:boost-packages-updated";

export const SEED_BOOST_PACKAGES = [
  {
    key: "basic",
    label: "Basic Boost",
    days: 3,
    price: 5000,
    benefits: ["Inapanda juu ya matokeo ya utafutaji", "Badge ya 'Boosted' kwenye tangazo"],
  },
  {
    key: "featured",
    label: "Featured Boost",
    days: 7,
    price: 12000,
    benefits: [
      "Kila kitu cha Basic Boost",
      "Inaonekana kwenye sehemu ya 'Featured' ukurasa wa mwanzo",
      "Kipaumbele kwenye matokeo ya category yako",
    ],
  },
  {
    key: "premium",
    label: "Premium Boost",
    days: 14,
    price: 20000,
    benefits: [
      "Kila kitu cha Featured Boost",
      "Inaonekana kwenye 'Featured' kwa muda mrefu zaidi",
      "Ripoti ya views/inquiries ya kina baada ya kila wiki",
    ],
  },
];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_BOOST_PACKAGES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_BOOST_PACKAGES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_BOOST_PACKAGES;
    return parsed;
  } catch {
    return SEED_BOOST_PACKAGES;
  }
}

/** Soma packages za sasa (snapshot moja, si reactive) — hutumika na
 * shared.js (applyBoost) ambayo si component ya React. */
export function getBoostPackages() {
  return readFromStorage();
}

/** Andika seti mpya kamili ya packages (Admin pekee anapaswa kuita hii). */
export function saveBoostPackages(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Pata package moja kwa key yake — hutumika na applyBoost(). */
export function getBoostPackage(key) {
  return getBoostPackages().find((p) => p.key === key);
}

/** Badilisha bei ya package moja tu — hii ndiyo inayoitwa na
 * EditableAmount kwenye Admin > Revenue > Boost Packages. */
export function updateBoostPackagePrice(key, price) {
  const current = getBoostPackages();
  const next = current.map((p) => (p.key === key ? { ...p, price: Number(price) } : p));
  saveBoostPackages(next);
  return next;
}

/**
 * Hook ya React inayosoma packages na kujisasisha yenyewe — kwenye
 * BoostSasa (muuzaji) na AdminDashboard (Revenue) papo hapo, bila
 * reload.
 */
export function useBoostPackages() {
  const [packages, setPackages] = useState(() => getBoostPackages());

  useEffect(() => {
    const sync = () => setPackages(getBoostPackages());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return packages;
}

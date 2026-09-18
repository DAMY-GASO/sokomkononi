// ============================================================
// boostPackagesStore.js
// CHANZO KIMOJA CHA UKWELI kwa bei za Boost Packages (Basic/Featured/
// Premium) zinazotumika kwenye BoostSasa.jsx.
//
// Kama stores nyingine — demo ya front-end pekee, localStorage + custom
// event. Backend halisi ikiwepo, badilisha functions hizi ziite API;
// useBoostPackages() na getBoostPackage() hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_boost_packages_v1";
const UPDATE_EVENT = "sokomkononi:boost-packages-updated";

// ============================================================
// SEED_BOOST_PACKAGES — bilingual
// `label` na `benefits` zina { sw, en }.
// ============================================================
export const SEED_BOOST_PACKAGES = [
  {
    key: "basic",
    label: { sw: "Basic Boost", en: "Basic Boost" },
    days: 3,
    price: 5000,
    benefits: {
      sw: [
        "Inapanda juu ya matokeo ya utafutaji",
        "Badge ya 'Boosted' kwenye tangazo",
      ],
      en: [
        "Appears above search results",
        "'Boosted' badge on the listing",
      ],
    },
  },
  {
    key: "featured",
    label: { sw: "Featured Boost", en: "Featured Boost" },
    days: 7,
    price: 12000,
    benefits: {
      sw: [
        "Kila kitu cha Basic Boost",
        "Inaonekana kwenye sehemu ya 'Featured' ukurasa wa mwanzo",
        "Kipaumbele kwenye matokeo ya category yako",
      ],
      en: [
        "Everything in Basic Boost",
        "Appears in the 'Featured' section of the homepage",
        "Priority in your category's search results",
      ],
    },
  },
  {
    key: "premium",
    label: { sw: "Premium Boost", en: "Premium Boost" },
    days: 14,
    price: 20000,
    benefits: {
      sw: [
        "Kila kitu cha Featured Boost",
        "Inaonekana kwenye 'Featured' kwa muda mrefu zaidi",
        "Ripoti ya views/inquiries ya kina baada ya kila wiki",
      ],
      en: [
        "Everything in Featured Boost",
        "Appears in 'Featured' for longer",
        "Detailed views/inquiries report every week",
      ],
    },
  },
];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_BOOST_PACKAGES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_BOOST_PACKAGES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_BOOST_PACKAGES;
    return parsed;
  } catch {
    return SEED_BOOST_PACKAGES;
  }
}

/** Soma packages za sasa (snapshot moja, si reactive). */
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

/** Badilisha bei ya package moja tu. */
export function updateBoostPackagePrice(key, price) {
  const current = getBoostPackages();
  const next = current.map((p) =>
    p.key === key ? { ...p, price: Number(price) } : p
  );
  saveBoostPackages(next);
  return next;
}

/**
 * Hook ya React inayosoma packages na kujisasisha yenyewe.
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
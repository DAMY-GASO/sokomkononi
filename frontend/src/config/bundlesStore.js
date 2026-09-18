// ============================================================
// bundlesStore.js
// Bundles/vifurushi vya huduma vya SokoMkononi.
// Admin anaweza kuongeza/kubadilisha bila developer.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_bundles_v1";
const UPDATE_EVENT = "sokomkononi:bundles-updated";

// ============================================================
// SEED_BUNDLES — default (Admin anaweza kubadilisha)
// ============================================================
export const SEED_BUNDLES = [
  // ============ LISTING FEE ============
  {
    id: "b_listing_starter",
    type: "listing",
    name: { sw: "Listing Starter", en: "Listing Starter" },
    description: {
      sw: "Listings 5 — bora kwa muuzaji anayeanza",
      en: "5 Listings — great for new sellers",
    },
    price: 10000,
    credits: 5,
    validityDays: 90,
    services: ["listing"],
    discountPercent: 0,
    active: true,
    featured: false,
    icon: "ListChecks",
    color: "green",
  },
  {
    id: "b_listing_business",
    type: "listing",
    name: { sw: "Listing Business", en: "Listing Business" },
    description: {
      sw: "Listings 15 — kwa muuzaji wa kati",
      en: "15 Listings — for mid-level sellers",
    },
    price: 25000,
    credits: 15,
    validityDays: 90,
    services: ["listing"],
    discountPercent: 17,
    active: true,
    featured: true,
    icon: "ListChecks",
    color: "green",
  },
  {
    id: "b_listing_pro",
    type: "listing",
    name: { sw: "Listing Pro", en: "Listing Pro" },
    description: {
      sw: "Listings 30 — kwa muuzaji mkubwa",
      en: "30 Listings — for large sellers",
    },
    price: 45000,
    credits: 30,
    validityDays: 180,
    services: ["listing"],
    discountPercent: 25,
    active: true,
    featured: false,
    icon: "ListChecks",
    color: "green",
  },

  // ============ LEADING FEE ============
  {
    id: "b_leading_starter",
    type: "leading",
    name: { sw: "Leading Starter", en: "Leading Starter" },
    description: {
      sw: "Leading 5 — pandisha mali 5 juu",
      en: "5 Leading — push 5 listings to top",
    },
    price: 10000,
    credits: 5,
    validityDays: 90,
    services: ["leading"],
    discountPercent: 0,
    active: true,
    featured: false,
    icon: "TrendingUp",
    color: "blue",
  },
  {
    id: "b_leading_business",
    type: "leading",
    name: { sw: "Leading Business", en: "Leading Business" },
    description: {
      sw: "Leading 15",
      en: "15 Leading",
    },
    price: 25000,
    credits: 15,
    validityDays: 90,
    services: ["leading"],
    discountPercent: 17,
    active: true,
    featured: true,
    icon: "TrendingUp",
    color: "blue",
  },
  {
    id: "b_leading_pro",
    type: "leading",
    name: { sw: "Leading Pro", en: "Leading Pro" },
    description: {
      sw: "Leading 30",
      en: "30 Leading",
    },
    price: 45000,
    credits: 30,
    validityDays: 180,
    services: ["leading"],
    discountPercent: 25,
    active: true,
    featured: false,
    icon: "TrendingUp",
    color: "blue",
  },

  // ============ BOOSTING FEE ============
  {
    id: "b_boost_starter",
    type: "boost",
    name: { sw: "Boost Starter", en: "Boost Starter" },
    description: {
      sw: "Boost listings 3",
      en: "Boost 3 listings",
    },
    price: 10000,
    credits: 3,
    validityDays: 90,
    services: ["boost"],
    discountPercent: 0,
    active: true,
    featured: false,
    icon: "Rocket",
    color: "gold",
  },
  {
    id: "b_boost_business",
    type: "boost",
    name: { sw: "Boost Business", en: "Boost Business" },
    description: {
      sw: "Boost listings 10",
      en: "Boost 10 listings",
    },
    price: 25000,
    credits: 10,
    validityDays: 90,
    services: ["boost"],
    discountPercent: 17,
    active: true,
    featured: true,
    icon: "Rocket",
    color: "gold",
  },
  {
    id: "b_boost_pro",
    type: "boost",
    name: { sw: "Boost Pro", en: "Boost Pro" },
    description: {
      sw: "Boost listings 20",
      en: "Boost 20 listings",
    },
    price: 40000,
    credits: 20,
    validityDays: 180,
    services: ["boost"],
    discountPercent: 33,
    active: true,
    featured: false,
    icon: "Rocket",
    color: "gold",
  },

  // ============ RESERVATION FEE ============
  {
    id: "b_reservation_starter",
    type: "reservation",
    name: { sw: "Reservation Starter", en: "Reservation Starter" },
    description: {
      sw: "Reservations 3",
      en: "3 Reservations",
    },
    price: 7500,
    credits: 3,
    validityDays: 90,
    services: ["reservation"],
    discountPercent: 0,
    active: true,
    featured: false,
    icon: "Clock3",
    color: "rust",
  },
  {
    id: "b_reservation_business",
    type: "reservation",
    name: { sw: "Reservation Business", en: "Reservation Business" },
    description: {
      sw: "Reservations 10",
      en: "10 Reservations",
    },
    price: 20000,
    credits: 10,
    validityDays: 90,
    services: ["reservation"],
    discountPercent: 20,
    active: true,
    featured: true,
    icon: "Clock3",
    color: "rust",
  },
  {
    id: "b_reservation_pro",
    type: "reservation",
    name: { sw: "Reservation Pro", en: "Reservation Pro" },
    description: {
      sw: "Reservations 25",
      en: "25 Reservations",
    },
    price: 40000,
    credits: 25,
    validityDays: 180,
    services: ["reservation"],
    discountPercent: 36,
    active: true,
    featured: false,
    icon: "Clock3",
    color: "rust",
  },

  // ============ ADS BUNDLES ============
  {
    id: "b_ads_starter",
    type: "ads",
    name: { sw: "Ads Starter", en: "Ads Starter" },
    description: {
      sw: "Ads credit ya kuanzia",
      en: "Starter ads credit",
    },
    price: 20000,
    credits: 20000, // TZS credits
    validityDays: 90,
    services: ["ads"],
    discountPercent: 0,
    active: true,
    featured: false,
    icon: "Megaphone",
    color: "gold",
  },
  {
    id: "b_ads_business",
    type: "ads",
    name: { sw: "Ads Business", en: "Ads Business" },
    description: {
      sw: "Ads credit ya kati",
      en: "Mid-level ads credit",
    },
    price: 50000,
    credits: 50000,
    validityDays: 180,
    services: ["ads"],
    discountPercent: 17,
    active: true,
    featured: true,
    icon: "Megaphone",
    color: "gold",
  },
  {
    id: "b_ads_pro",
    type: "ads",
    name: { sw: "Ads Pro", en: "Ads Pro" },
    description: {
      sw: "Ads credit kubwa",
      en: "Large ads credit",
    },
    price: 100000,
    credits: 100000,
    validityDays: 365,
    services: ["ads"],
    discountPercent: 33,
    active: true,
    featured: false,
    icon: "Megaphone",
    color: "gold",
  },

  // ============ PREMIUM BUNDLES ============
  {
    id: "b_premium_starter",
    type: "premium",
    name: { sw: "Premium Starter", en: "Premium Starter" },
    description: {
      sw: "Priority visibility + Premium badge",
      en: "Priority visibility + Premium badge",
    },
    price: 15000,
    credits: 1,
    validityDays: 30,
    services: ["premium", "priority_visibility", "premium_badge"],
    discountPercent: 0,
    active: true,
    featured: false,
    icon: "Star",
    color: "gold",
  },
  {
    id: "b_premium_business",
    type: "premium",
    name: { sw: "Premium Business", en: "Premium Business" },
    description: {
      sw: "Priority visibility + Premium badge + Profile enhancement",
      en: "Priority visibility + Premium badge + Profile enhancement",
    },
    price: 35000,
    credits: 1,
    validityDays: 90,
    services: [
      "premium",
      "priority_visibility",
      "premium_badge",
      "profile_enhancement",
    ],
    discountPercent: 17,
    active: true,
    featured: true,
    icon: "Star",
    color: "gold",
  },
  {
    id: "b_premium_pro",
    type: "premium",
    name: { sw: "Premium Pro", en: "Premium Pro" },
    description: {
      sw: "Priority visibility + Premium badge + Profile enhancement + Benefits",
      en: "Priority visibility + Premium badge + Profile enhancement + Benefits",
    },
    price: 75000,
    credits: 1,
    validityDays: 365,
    services: [
      "premium",
      "priority_visibility",
      "premium_badge",
      "profile_enhancement",
      "premium_support",
    ],
    discountPercent: 25,
    active: true,
    featured: false,
    icon: "Star",
    color: "gold",
  },

  // ============ ALL-IN-ONE PACKAGES ============
  {
    id: "b_package_starter",
    type: "package",
    name: { sw: "Starter Package", en: "Starter Package" },
    description: {
      sw: "Listings 10 + Leading 5 + Boost 3 + Reservations 2 + Premium visibility",
      en: "10 Listings + 5 Leading + 3 Boost + 2 Reservations + Premium visibility",
    },
    price: 25000,
    credits: {
      listing: 10,
      leading: 5,
      boost: 3,
      reservation: 2,
    },
    validityDays: 90,
    services: [
      "listing",
      "leading",
      "boost",
      "reservation",
      "priority_visibility",
    ],
    discountPercent: 30,
    active: true,
    featured: false,
    icon: "Package",
    color: "night",
  },
  {
    id: "b_package_business",
    type: "package",
    name: { sw: "Business Package", en: "Business Package" },
    description: {
      sw: "Listings 30 + Leading 15 + Boost 10 + Reservations 5 + Ads credit + Premium visibility",
      en: "30 Listings + 15 Leading + 10 Boost + 5 Reservations + Ads credit + Premium visibility",
    },
    price: 60000,
    credits: {
      listing: 30,
      leading: 15,
      boost: 10,
      reservation: 5,
      ads: 20000,
    },
    validityDays: 180,
    services: [
      "listing",
      "leading",
      "boost",
      "reservation",
      "ads",
      "priority_visibility",
    ],
    discountPercent: 40,
    active: true,
    featured: true,
    icon: "Package",
    color: "night",
  },
  {
    id: "b_package_pro",
    type: "package",
    name: { sw: "Pro Package", en: "Pro Package" },
    description: {
      sw: "Listings 60 + Leading 30 + Boost 20 + Reservations 10 + Ads credit + Premium account + Priority visibility",
      en: "60 Listings + 30 Leading + 20 Boost + 10 Reservations + Ads credit + Premium account + Priority visibility",
    },
    price: 120000,
    credits: {
      listing: 60,
      leading: 30,
      boost: 20,
      reservation: 10,
      ads: 40000,
    },
    validityDays: 365,
    services: [
      "listing",
      "leading",
      "boost",
      "reservation",
      "ads",
      "premium",
      "priority_visibility",
    ],
    discountPercent: 50,
    active: true,
    featured: false,
    icon: "Package",
    color: "night",
  },
  {
    id: "b_package_agency",
    type: "package",
    name: { sw: "Agency Package", en: "Agency Package" },
    description: {
      sw: "Listings 150 + Leading 75 + Boost 50 + Reservations 25 + Ads credit + Premium account + Priority placement + Agency badge + Priority support",
      en: "150 Listings + 75 Leading + 50 Boost + 25 Reservations + Ads credit + Premium account + Priority placement + Agency badge + Priority support",
    },
    price: 250000,
    credits: {
      listing: 150,
      leading: 75,
      boost: 50,
      reservation: 25,
      ads: 100000,
    },
    validityDays: 365,
    services: [
      "listing",
      "leading",
      "boost",
      "reservation",
      "ads",
      "premium",
      "priority_placement",
      "agency_badge",
      "priority_support",
    ],
    discountPercent: 55,
    active: true,
    featured: false,
    icon: "Building2",
    color: "night",
  },
];

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return SEED_BUNDLES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_BUNDLES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_BUNDLES;
  } catch {
    return SEED_BUNDLES;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// HELPERS
// ============================================================
export function getBundles() {
  return readFromStorage();
}

export function getActiveBundles() {
  return getBundles().filter((b) => b.active !== false);
}

export function getBundle(id) {
  return getBundles().find((b) => b.id === id) || null;
}

export function getBundlesByType(type) {
  return getActiveBundles().filter((b) => b.type === type);
}

/**
 * initializeBundles() — weka seed MARA MOJA TU kama bado hazipo.
 */
export function initializeBundles(list) {
  if (!Array.isArray(list) || list.length === 0) return getBundles();
  const current = getBundles();
  if (current.length > 0) return current;
  saveAll(list);
  return list;
}

/**
 * resetBundles() — Admin pekee. Futa zote na weka upya.
 */
export function resetBundles(list = SEED_BUNDLES) {
  saveAll(list);
  return list;
}

// ============================================================
// MUTATIONS (Admin)
// ============================================================
export function addBundle(bundle) {
  const current = getBundles();
  const exists = current.some((b) => b.id === bundle.id);
  if (exists) throw new Error(`Bundle "${bundle.id}" already exists`);
  const newBundle = {
    active: true,
    featured: false,
    ...bundle,
  };
  const next = [...current, newBundle];
  saveAll(next);
  return next;
}

export function updateBundle(id, patch) {
  const current = getBundles();
  const next = current.map((b) => (b.id === id ? { ...b, ...patch } : b));
  saveAll(next);
  return next;
}

export function toggleBundleActive(id) {
  const current = getBundles();
  const next = current.map((b) =>
    b.id === id ? { ...b, active: b.active === false ? true : false } : b
  );
  saveAll(next);
  return next;
}

export function removeBundle(id) {
  const current = getBundles();
  const next = current.filter((b) => b.id !== id);
  saveAll(next);
  return next;
}

// ============================================================
// HOOKS
// ============================================================
export function useBundles() {
  const [list, setList] = useState(() => getBundles());
  useEffect(() => {
    const sync = () => setList(getBundles());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return list;
}

export function useActiveBundles() {
  const list = useBundles();
  return list.filter((b) => b.active !== false);
}

export function useBundlesByType(type) {
  const list = useBundles();
  return list.filter((b) => b.active !== false && b.type === type);
}

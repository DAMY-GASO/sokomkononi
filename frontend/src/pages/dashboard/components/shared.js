import { Home, Trees, Car, Briefcase, Wrench } from "lucide-react";
import { getBoostPackage as getBoostPackageFromStore } from "../../../config/boostPackagesStore.js";
import { getListingFeeConfig } from "../../../config/listingFeeStore.js";
import { getLeadingFeeConfig } from "../../../config/leadingFeeStore.js";
import { getPlatformPolicy } from "../../../config/systemSettingsStore.js"; 

// ---- Brand tokens (SokoMkononi) ----
export const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  nightSoft: "#1B2740",
  sandLine: "#E6E2D6",
};

export const FONTS = {
  display: "'Fraunces', serif",
  body: "'Manrope', sans-serif",
};

// ---- Categories (icon + label + category-specific fields) ----
export const CATEGORIES = [
  {
    key: "nyumba",
    label: "Nyumba & Majengo",
    icon: Home,
    extra: [
      { key: "vyumba", label: "Vyumba vya kulala", type: "number", placeholder: "mfano: 3" },
      { key: "bafu", label: "Bafu", type: "number", placeholder: "mfano: 2" },
      { key: "ukubwa", label: "Ukubwa (sqm)", type: "text", placeholder: "mfano: 250 sqm" },
      {
        key: "title",
        label: "Hati (Title Status)",
        type: "select",
        options: ["Hati Miliki", "Hati ya Kimila", "Inasubiri Hati", "Hakuna Hati"],
      },
    ],
  },
  {
    key: "viwanja",
    label: "Viwanja & Mashamba",
    icon: Trees,
    extra: [
      { key: "ukubwa", label: "Ukubwa wa Eneo", type: "text", placeholder: "mfano: nusu ekari" },
      {
        key: "title",
        label: "Hati / Title Status",
        type: "select",
        options: ["Hati Miliki", "Hati ya Kimila", "Inasubiri Hati", "Hakuna Hati"],
      },
      {
        key: "matumizi",
        label: "Matumizi ya Ardhi",
        type: "select",
        options: ["Makazi", "Kilimo", "Biashara", "Viwanda"],
      },
    ],
  },
  {
    key: "magari",
    label: "Magari",
    icon: Car,
    extra: [
      { key: "make_model", label: "Make / Model / Mwaka", type: "text", placeholder: "mfano: Toyota Harrier 2016" },
      { key: "mileage", label: "Mileage (km)", type: "number", placeholder: "mfano: 85000" },
      { key: "transmission", label: "Transmission", type: "select", options: ["Automatic", "Manual"] },
      {
        key: "mafuta",
        label: "Aina ya Mafuta",
        type: "select",
        options: ["Petrol", "Diesel", "Hybrid", "Umeme (EV)"],
      },
    ],
  },
  {
    key: "biashara",
    label: "Biashara Zinazouzwa",
    icon: Briefcase,
    extra: [
      { key: "aina", label: "Aina ya Biashara", type: "text", placeholder: "mfano: Duka la vifaa vya ujenzi" },
      { key: "mapato", label: "Mapato ya Wastani (kwa mwezi)", type: "text", placeholder: "TZS ..." },
      { key: "muda", label: "Muda Biashara Ikiwepo", type: "text", placeholder: "mfano: miaka 4" },
    ],
  },
  {
    key: "mashine",
    label: "Mashine / Heavy Equipment",
    icon: Wrench,
    extra: [
      { key: "aina", label: "Aina ya Mashine", type: "text", placeholder: "mfano: Excavator" },
      { key: "hours", label: "Saa za Matumizi", type: "number", placeholder: "mfano: 3200" },
      {
        key: "hali",
        label: "Hali",
        type: "select",
        options: ["Mpya", "Nzuri Sana", "Nzuri", "Inahitaji Matengenezo"],
      },
    ],
  },
];

export function getCategory(key) {
  return CATEGORIES.find((c) => c.key === key);
}

// ---- Money helpers ----
export function parsePrice(value) {
  if (!value) return 0;
  const digitsOnly = String(value).replace(/[^0-9]/g, "");
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

export function formatTZS(amount) {
  return "TZS " + Math.round(amount).toLocaleString("en-US");
}

// Calculates the listing fee for a given category + price.
// Returns { price, rate, rawFee, fee, capped: "min" | "max" | null }
export function calculateListingFee(categoryKey, priceInput) {
  const config = getListingFeeConfig(categoryKey);
  const price = parsePrice(priceInput);

  if (!config || !price) {
    return { price, rate: config?.rate ?? 0, rawFee: 0, fee: 0, capped: null };
  }

  const rawFee = price * config.rate;
  let fee = rawFee;
  let capped = null;

  if (rawFee < config.min) {
    fee = config.min;
    capped = "min";
  } else if (rawFee > config.max) {
    fee = config.max;
    capped = "max";
  }

  fee = Math.round(fee / 500) * 500; // round to nearest 500 TZS

  return { price, rate: config.rate, rawFee, fee, capped };
}

// ---- Listing status metadata ----
export const STATUS = {
  live: { label: "Live", bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
  reserved: { label: "Ina Reservation", bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
  sold: { label: "Imeuzwa", bg: "rgba(16,26,46,0.08)", fg: COLORS.night },
  pending_payment: { label: "Inasubiri Malipo", bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
  in_review: { label: "Inakaguliwa", bg: "rgba(16,26,46,0.08)", fg: COLORS.night },
  expired: { label: "Imeisha Muda", bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
  rejected: { label: "Imekataliwa", bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
};

export function timeAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return "Leo";
  if (days === 1) return "Jana";
  if (days < 30) return `Siku ${days} zilizopita`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Mwezi 1 uliopita" : `Miezi ${months} iliyopita`;
}

// ---- Payment methods ----
export const PAYMENT_METHODS = [
  { key: "mpesa", label: "M-Pesa", type: "mobile" },
  { key: "tigopesa", label: "Tigo Pesa", type: "mobile" },
  { key: "airtelmoney", label: "Airtel Money", type: "mobile" },
  { key: "halopesa", label: "HaloPesa", type: "mobile" },
  { key: "card", label: "Kadi ya Benki (Visa/Mastercard)", type: "card" },
];

export function getPaymentMethod(key) {
  return PAYMENT_METHODS.find((m) => m.key === key);
}

// ---- Boost packages ----
export function getBoostPackage(key) {
  return getBoostPackageFromStore(key);
}

export function isBoostActive(listing) {
  return Boolean(listing.boostExpiresAt && new Date(listing.boostExpiresAt).getTime() > Date.now());
}

export function boostDaysRemaining(listing) {
  if (!isBoostActive(listing)) return 0;
  const ms = new Date(listing.boostExpiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 86400000));
}

export function applyBoost(listing, packageKey) {
  const pkg = getBoostPackage(packageKey);
  if (!pkg) return {};
  const base = isBoostActive(listing) ? new Date(listing.boostExpiresAt).getTime() : Date.now();
  const boostExpiresAt = new Date(base + pkg.days * 86400000).toISOString();
  return { boostTier: pkg.key, boostExpiresAt };
}

// ---- Leading Fee ----
export function isLeadingActive(listing) {
  return Boolean(listing.leadingExpiresAt && new Date(listing.leadingExpiresAt).getTime() > Date.now());
}

export function leadingDaysRemaining(listing) {
  if (!isLeadingActive(listing)) return 0;
  const ms = new Date(listing.leadingExpiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 86400000));
}

export function applyLeading(listing) {
  const config = getLeadingFeeConfig();
  if (!config) return {};
  const base = isLeadingActive(listing) ? new Date(listing.leadingExpiresAt).getTime() : Date.now();
  const leadingExpiresAt = new Date(base + config.days * 86400000).toISOString();
  return { leadingExpiresAt };
}

// ============================================================
// === IMEBADILISHWA ===
// buildListingFromSubmission — sasa ina-hoist fields muhimu kutoka
// `extra` kwenda top-level, ili listing mpya ifanane kabisa na
// SEED_LISTINGS (PropertyDetail, CategoryPage, BrowseProperties zote
// zinaweza kuisoma kwa uthabiti bila kujua `extra`).
//
// Pia inaweka `expiresAt` kutoka platform policy (Admin > System
// Settings > Platform Policy) — siku 60 kwa default, inaweza
// kubadilishwa na Admin bila kugusa code.
// ============================================================
export function buildListingFromSubmission({ categoryKey, base, extra, photoCount }) {
  const feeInfo = calculateListingFee(categoryKey, base.price);

  // Hoist helpers — kila field inaongezwa kama ipo, ili listing isiwe
  // na keys tupu (undefined). Hii inafanya listing mpya ifanane na
  // muundo wa SEED_LISTINGS.
  const hoisted = {};

  // Common (nyumba, viwanja)
  if (extra?.title) hoisted.titleStatus = extra.title;
  if (extra?.ukubwa) hoisted.area = extra.ukubwa;
  if (extra?.vyumba) hoisted.bedrooms = Number(extra.vyumba);
  if (extra?.bafu) hoisted.bathrooms = Number(extra.bafu);

  // Magari
  if (extra?.make_model) {
    const parts = String(extra.make_model).trim().split(/\s+/);
    hoisted.make = parts[0];
    hoisted.model = parts.slice(1).join(" ");
  }
  if (extra?.mileage) hoisted.mileage = `${extra.mileage} km`;

  // Biashara & Mashine
  if (extra?.aina) hoisted.type = extra.aina;
  if (extra?.hours) hoisted.hours = `${extra.hours} hrs`;

  // Muda wa listing kuishi — kutoka platform policy (siku 60 default).
  const lifetimeDays = Number(getPlatformPolicy()?.listingLifetimeDays) || 60;

  return {
    id: `l_${Date.now()}`,
    title: base.title,
    category: categoryKey,
    price: feeInfo.price,
    location: base.location,
    description: base.description,
    seller_name: base.seller_name,
    contact_pref: base.contact_pref,
    extra,
    ...hoisted, // <-- fields zilizo-hoist zinaingia top-level
    photoCount,
    status: "pending_payment",
    postedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + lifetimeDays * 86400000).toISOString(),
    listingFee: feeInfo.fee,
    views: 0,
    inquiries: 0,
  };
}

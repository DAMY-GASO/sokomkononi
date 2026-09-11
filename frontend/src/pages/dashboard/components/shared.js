// ============================================================
// shared.js
// Helper functions na brand tokens za SokoMkononi.
//
// MWISHO WA MABADILIKO:
//   - CATEGORIES array IMEONDOLEWA — sasa zinatoka
//     ../../../config/categoriesStore.js
//   - getCategory() inarudisha category object kutoka store
//   - getCategoryIconByKey() inarudisha lucide-react component
//   - getCategoryLabel() shortcut ya label moja kwa moja
//   - getActiveCategories re-export kwa urahisi
//   - calculateListingFee() inarudi error state kama category haina
//     fee config (category mpya iliyoongezwa na Admin bila fee)
// ============================================================

import { getBoostPackage as getBoostPackageFromStore } from "../../../config/boostPackagesStore.js";
import { getListingFeeConfig } from "../../../config/listingFeeStore.js";
import { getLeadingFeeConfig } from "../../../config/leadingFeeStore.js";
import { getPlatformPolicy } from "../../../config/systemSettingsStore.js";
import {
  getCategory as getCategoryFromStore,
  getActiveCategories,
  getCategoryIcon,
} from "../../../config/categoriesStore.js";

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

// ============================================================
// CATEGORIES — sasa zinatoka categoriesStore.js
// ============================================================
// Muundo wa category: { key, label: {sw,en}, description: {sw,en},
//                       iconKey, isPopular, active, extra[] }
// ============================================================

/**
 * getCategory(key) — rudisha category object kutoka store.
 */
export function getCategory(key) {
  return getCategoryFromStore(key);
}

/**
 * getCategoryIconByKey(iconKey) — rudisha lucide-react component.
 */
export function getCategoryIconByKey(iconKey) {
  return getCategoryIcon(iconKey);
}

/**
 * getCategoryLabel(key, lang) — shortcut ya label moja kwa moja.
 */
export function getCategoryLabel(key, lang = "sw") {
  const cat = getCategory(key);
  if (!cat) return key;
  return cat.label?.[lang] || cat.label?.sw || key;
}

/**
 * Re-export ya getActiveCategories kutoka store.
 */
export { getActiveCategories };

// ---- Money helpers ----
export function parsePrice(value) {
  if (!value) return 0;
  const digitsOnly = String(value).replace(/[^0-9]/g, "");
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

export function formatTZS(amount) {
  return "TZS " + Math.round(amount).toLocaleString("en-US");
}

/**
 * calculateListingFee(categoryKey, priceInput)
 *
 * Inarudi:
 *   { price, rate, rawFee, fee, capped: "min" | "max" | null }
 *
 * Kama category haina fee config (category mpya iliyoongezwa na Admin
 * bila kuweka fee), inarudi:
 *   { price, rate: 0, rawFee: 0, fee: null, capped: null,
 *     error: "NO_FEE_CONFIG", message: "..." }
 *
 * UI LAZIMA kuangalia `feeInfo.error === "NO_FEE_CONFIG"` kabla ya
 * kuruhusu submit.
 */
export function calculateListingFee(categoryKey, priceInput) {
  const config = getListingFeeConfig(categoryKey);
  const price = parsePrice(priceInput);

  // Category haina fee config — Admin hajaongeza bado.
  if (!config) {
    return {
      price,
      rate: 0,
      rawFee: 0,
      fee: null,
      capped: null,
      error: "NO_FEE_CONFIG",
      message:
        "Category hii haina Listing Fee config bado. Wasiliana na Admin ili kuweka ada kabla ya kuweka listing.",
    };
  }

  // Price bado haijawekwa — rudisha fee 0 bila error.
  if (!price) {
    return { price, rate: config.rate, rawFee: 0, fee: 0, capped: null };
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

export function timeAgo(dateStr, lang = "sw") {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return lang === "sw" ? "Leo" : "Today";
  if (days === 1) return lang === "sw" ? "Jana" : "Yesterday";
  if (days < 30) return lang === "sw" ? `Siku ${days} zilizopita` : `${days} days ago`;
  const months = Math.floor(days / 30);
  if (lang === "sw") return months === 1 ? "Mwezi 1 uliopita" : `Miezi ${months} iliyopita`;
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

// ---- Payment methods ----
export const PAYMENT_METHODS = [
  { key: "mpesa", label: "M-Pesa", type: "mobile" },
  { key: "tigopesa", label: "Mixx by Yas", type: "mobile" },
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
// buildListingFromSubmission
// ============================================================
export function buildListingFromSubmission({ categoryKey, base, extra, photoCount }) {
  const feeInfo = calculateListingFee(categoryKey, base.price);

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
    ...hoisted,
    photoCount,
    status: "pending_payment",
    postedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + lifetimeDays * 86400000).toISOString(),
    listingFee: feeInfo.fee,
    views: 0,
    inquiries: 0,
  };
}

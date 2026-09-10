
import { Home, Trees, Car, Briefcase, Wrench } from "lucide-react";

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

// ---- Categories (icon + label + category-specific fields + fee config) ----
export const CATEGORIES = [
  {
    key: "nyumba",
    label: "Nyumba & Majengo",
    icon: Home,
    fee: { rate: 0.010, min: 20000, max: 300000 },
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
    fee: { rate: 0.008, min: 15000, max: 250000 },
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
    fee: { rate: 0.015, min: 10000, max: 150000 },
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
    fee: { rate: 0.012, min: 20000, max: 200000 },
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
    fee: { rate: 0.010, min: 15000, max: 180000 },
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
  const category = getCategory(categoryKey);
  const config = category?.fee;
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

// ---- Listing status metadata (shared between My Listings and the post flow) ----
export const STATUS = {
  live: { label: "Live", bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
  pending_payment: { label: "Inasubiri Malipo", bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
  in_review: { label: "Inakaguliwa", bg: "rgba(16,26,46,0.08)", fg: COLORS.night },
  sold: { label: "Imeuzwa", bg: "rgba(16,26,46,0.06)", fg: "rgba(16,26,46,0.5)" },
  expired: { label: "Imeisha Muda", bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
};

export function timeAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return "Leo";
  if (days === 1) return "Jana";
  if (days < 30) return `Siku ${days} zilizopita`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Mwezi 1 uliopita" : `Miezi ${months} iliyopita`;
}

// ---- Payment methods (mobile money + card) ----
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

// ---- Boost packages (paid visibility boost for a live listing) ----
export const BOOST_PACKAGES = [
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

export function getBoostPackage(key) {
  return BOOST_PACKAGES.find((p) => p.key === key);
}

export function isBoostActive(listing) {
  return Boolean(listing.boostExpiresAt && new Date(listing.boostExpiresAt).getTime() > Date.now());
}

export function boostDaysRemaining(listing) {
  if (!isBoostActive(listing)) return 0;
  const ms = new Date(listing.boostExpiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 86400000));
}

// Applies a purchased boost package to a listing, returning the patch to merge in.
export function applyBoost(listing, packageKey) {
  const pkg = getBoostPackage(packageKey);
  if (!pkg) return {};
  // If already boosted and still active, extend from the current expiry; otherwise start from now.
  const base = isBoostActive(listing) ? new Date(listing.boostExpiresAt).getTime() : Date.now();
  const boostExpiresAt = new Date(base + pkg.days * 86400000).toISOString();
  return { boostTier: pkg.key, boostExpiresAt };
}

// Creates a new listing record from a submitted post-form payload.
export function buildListingFromSubmission({ categoryKey, base, extra, photoCount }) {
  const feeInfo = calculateListingFee(categoryKey, base.price);
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
    photoCount,
    status: "pending_payment",
    postedAt: new Date().toISOString(),
    listingFee: feeInfo.fee,
    views: 0,
    inquiries: 0,
  };
}

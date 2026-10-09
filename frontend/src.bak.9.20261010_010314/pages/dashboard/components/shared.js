import { getBoostPackage as getBoostPackageFromStore } from "../../../config/boostPackagesStore.js";
import { getListingFeeConfig } from "../../../config/listingFeeStore.js";
import { getLeadingFeeConfig } from "../../../config/leadingFeeStore.js";
import { getPlatformPolicy } from "../../../config/systemSettingsStore.js";
import {
  getCategory as getCategoryFromStore,
  getActiveCategories,
  getCategoryIcon,
} from "../../../config/categoriesStore.js";

// ============================================================
// BRAND TOKENS (SokoMkononi)
// ============================================================
export const COLORS = {
  // Brand — zimetolewa kwenye logo ya SokoMkononi
  night: "#011957",
  nightDeep: "#010F3A",
  nightSoft: "#042475",
  royal: "#0062FD",
  royalLight: "#3D8BFF",
  royalDark: "#0050D0",
  gold: "#FEA406",
  goldLight: "#FFC857",
  goldInk: "#A35F00", // gold kwa maandishi kwenye mandhari nyeupe (5:1)
  flame: "#FD8706",
  sand: "#F4F7FC",
  sandLine: "#DCE4F2",

  // Semantic (hazitokani na logo kwa makusudi)
  green: "#2F6D4F",
  rust: "#C1502E",

  // Text — typography system
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
};

export const FONTS = {
  display: "'Inter', system-ui, -apple-system, sans-serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
};

// ============================================================
// IMAGE URL RESOLVER
// ============================================================
const INTERNAL_HOST_PATTERNS = [
  /^https?:\/\/[^/]*rcnbg2[^/]*/i,
  /^https?:\/\/[^/]*\.internal[^/]*/i,
  /^https?:\/\/localhost(?::\d+)?/i,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?/i,
  /^https?:\/\/10\.\d+\.\d+\.\d+(?::\d+)?/i,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(?::\d+)?/i,
  /^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?/i,
  /^https?:\/\/[a-z0-9_-]+(?::8000)(?![a-z\.])/i,
];

function stripInternalHost(url) {
  if (typeof url !== "string") return url;
  for (const pattern of INTERNAL_HOST_PATTERNS) {
    if (pattern.test(url)) {
      try {
        const u = new URL(url);
        return u.pathname + u.search;
      } catch {
        return url.replace(/^https?:\/\/[^/]+/i, "");
      }
    }
  }
  return url;
}

export function pickImageUrl(entity) {
  if (!entity) return null;
  if (typeof entity === "string") return stripInternalHost(entity);

  const candidates = [
    entity.imageUrl,
    entity.image_url,
    entity.primary_image_url,
    entity.primary_image,
    entity.image,
    entity.thumbnail,
    entity.thumbnail_url,
    entity.cover_image,
    entity.photo,
    entity.photo_url,
    entity.url,
    entity.src,
  ];
  for (const c of candidates) {
    const v =
      typeof c === "object" && c !== null
        ? c.url || c.image_url || c.image
        : c;
    if (v && typeof v === "string") return stripInternalHost(v);
  }
  const arr = entity.photos || entity.images || entity.gallery;
  if (Array.isArray(arr) && arr.length > 0) {
    const first = arr[0];
    const v =
      typeof first === "string"
        ? first
        : first?.url || first?.image_url || first?.image || first?.src;
    if (v) return stripInternalHost(v);
  }
  return null;
}

export function resolveImageUrl(value) {
  const url = pickImageUrl(value);
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

// ============================================================
// CATEGORIES
// ============================================================
export function getCategory(key) {
  return getCategoryFromStore(key);
}

export function getCategoryIconByKey(iconKey) {
  return getCategoryIcon(iconKey);
}

export function getCategoryLabel(key, lang = "sw") {
  const cat = getCategory(key);
  if (!cat) return key;
  return cat.label?.[lang] || cat.label?.sw || key;
}

export { getActiveCategories };

// ============================================================
// MONEY HELPERS
// ============================================================
export function parsePrice(value) {
  if (!value) return 0;
  const digitsOnly = String(value).replace(/[^0-9]/g, "");
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

export function formatTZS(amount) {
  const n = Number(amount);
  return (
    "TZS " +
    (Number.isFinite(n) ? Math.round(n) : 0).toLocaleString("en-US")
  );
}

// ============================================================
// INPUT FORMATTING HELPERS
// ============================================================
export function formatNumberInput(value) {
  if (value === "" || value === null || value === undefined) return "";
  const digits = String(value).replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

export function cleanNumberInput(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

export function formatPhoneDisplay(value) {
  const digits = String(value).replace(/[^0-9]/g, "").slice(0, 10);
  if (!digits) return "";
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

export function formatCardDisplay(value) {
  const digits = String(value).replace(/[^0-9]/g, "").slice(0, 16);
  if (!digits) return "";
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

// ============================================================
// calculateListingFee
// ============================================================
export function calculateListingFee(categoryKey, priceInput) {
  const config = getListingFeeConfig(categoryKey);
  const price = parsePrice(priceInput);

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

  // Fee mode determines the formula. FLAT ignores price entirely —
  // PERCENTAGE computes `price × rate` and applies min/max caps.
  const isFlat = String(config.feeMode || "PERCENTAGE").toUpperCase() === "FLAT";
  const flatFee = Number(config.flatFee) || 0;

  if (isFlat) {
    const fee = flatFee > 0 ? Math.round(flatFee / 500) * 500 : 0;
    return { price, rate: 0, rawFee: fee, fee, capped: null, mode: "FLAT" };
  }

  if (!price) {
    return {
      price,
      rate: config.rate,
      rawFee: 0,
      fee: 0,
      capped: null,
      mode: "PERCENTAGE",
    };
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

  fee = Math.round(fee / 500) * 500;

  return { price, rate: config.rate, rawFee, fee, capped, mode: "PERCENTAGE" };
}

// ============================================================
// Listing status metadata
// ============================================================
export const STATUS = {
  live: { label: "Live", bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
  reserved: {
    label: "Ina Reservation",
    bg: "rgba(254,164,6,0.16)",
    fg: COLORS.goldInk,
  },
  sold: { label: "Imeuzwa", bg: "rgba(1,25,87,0.08)", fg: COLORS.night },
  pending_payment: {
    label: "Inasubiri Malipo",
    bg: "rgba(254,164,6,0.16)",
    fg: COLORS.goldInk,
  },
  in_review: {
    label: "Inakaguliwa",
    bg: "rgba(1,25,87,0.08)",
    fg: COLORS.night,
  },
  expired: {
    label: "Imeisha Muda",
    bg: "rgba(193,80,46,0.12)",
    fg: COLORS.rust,
  },
  rejected: {
    label: "Imekataliwa",
    bg: "rgba(193,80,46,0.12)",
    fg: COLORS.rust,
  },
};

export function timeAgo(dateStr, lang = "sw") {
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86400000
  );
  if (days <= 0) return lang === "sw" ? "Leo" : "Today";
  if (days === 1) return lang === "sw" ? "Jana" : "Yesterday";
  if (days < 30)
    return lang === "sw" ? `Siku ${days} zilizopita` : `${days} days ago`;
  const months = Math.floor(days / 30);
  if (lang === "sw")
    return months === 1 ? "Mwezi 1 uliopita" : `Miezi ${months} iliyopita`;
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

// ============================================================
// Payment methods
// ============================================================
export const PAYMENT_METHODS = [
  { key: "mpesa", label: "M-Pesa", type: "mobile" },
  { key: "tigopesa", label: "Mixx by Yas", type: "mobile" },
  { key: "airtelmoney", label: "Airtel Money", type: "mobile" },
  { key: "halopesa", label: "HaloPesa", type: "mobile" },
  {
    key: "card",
    label: "Kadi ya Benki (Visa/Mastercard)",
    type: "card",
  },
];

export function getPaymentMethod(key) {
  return PAYMENT_METHODS.find((m) => m.key === key);
}

// ============================================================
// Boost packages
// ============================================================
export function getBoostPackage(key) {
  return getBoostPackageFromStore(key);
}

export function isBoostActive(listing) {
  return Boolean(
    listing.boostExpiresAt &&
      new Date(listing.boostExpiresAt).getTime() > Date.now()
  );
}

export function boostDaysRemaining(listing) {
  if (!isBoostActive(listing)) return 0;
  const ms = new Date(listing.boostExpiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 86400000));
}

export function applyBoost(listing, packageKey) {
  const pkg = getBoostPackage(packageKey);
  if (!pkg) return {};
  const base = isBoostActive(listing)
    ? new Date(listing.boostExpiresAt).getTime()
    : Date.now();
  const boostExpiresAt = new Date(
    base + pkg.days * 86400000
  ).toISOString();
  return { boostTier: pkg.key, boostExpiresAt };
}

// ============================================================
// Leading Fee
// ============================================================
export function isLeadingActive(listing) {
  return Boolean(
    listing.leadingExpiresAt &&
      new Date(listing.leadingExpiresAt).getTime() > Date.now()
  );
}

export function leadingDaysRemaining(listing) {
  if (!isLeadingActive(listing)) return 0;
  const ms = new Date(listing.leadingExpiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 86400000));
}

export function applyLeading(listing) {
  const config = getLeadingFeeConfig();
  if (!config) return {};
  const base = isLeadingActive(listing)
    ? new Date(listing.leadingExpiresAt).getTime()
    : Date.now();
  const leadingExpiresAt = new Date(
    base + config.days * 86400000
  ).toISOString();
  return { leadingExpiresAt };
}

// ============================================================
// buildListingFromSubmission
// ============================================================
export function buildListingFromSubmission({
  categoryKey,
  base,
  extra,
  photoCount,
}) {
  const feeInfo = calculateListingFee(categoryKey, base.price);

  const hoisted = {};

  if (extra?.title) hoisted.titleStatus = extra.title;
  if (extra?.ukubwa) hoisted.area = extra.ukubwa;
  if (extra?.vyumba) hoisted.bedrooms = Number(extra.vyumba);
  if (extra?.bafu) hoisted.bathrooms = Number(extra.bafu);

  if (extra?.make_model) {
    const parts = String(extra.make_model).trim().split(/\s+/);
    hoisted.make = parts[0];
    hoisted.model = parts.slice(1).join(" ");
  }
  if (extra?.mileage) hoisted.mileage = `${extra.mileage} km`;

  if (extra?.aina) hoisted.type = extra.aina;
  if (extra?.hours) hoisted.hours = `${extra.hours} hrs`;

  const lifetimeDays =
    Number(getPlatformPolicy()?.listingLifetimeDays) || 60;

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
    expiresAt: new Date(
      Date.now() + lifetimeDays * 86400000
    ).toISOString(),
    listingFee: feeInfo.fee,
    views: 0,
    inquiries: 0,
  };
}

// ============================================================
// RESOLVE SENDER
// Inashughulikia aina zote za sender:
//   - "admin" / "buyer" / "seller" → rudisha moja kwa moja
//   - "me" / "them" → hutumika kwenye deal room chat
//   - ID (namba au string) → linganisha na buyerId/sellerId
//   - Fallback → "buyer" (kama haijulikani kabisa)
// ============================================================
export function resolveSender(sender, deal) {
  // 1. String za moja kwa moja
  if (sender === "admin") return "admin";
  if (sender === "buyer") return "buyer";
  if (sender === "seller") return "seller";

  // 2. "me" / "them" — kwa mtazamo wa mtumiaji aliyeingia
  if (sender === "me" || sender === "them") {
    // Kama deal ina counterpartyName (mtumiaji aliyeingia ni buyer/seller)
    if (deal?.counterpartyName) {
      const themIsBuyer = deal.counterpartyName === deal.buyerName;
      if (sender === "them") return themIsBuyer ? "buyer" : "seller";
      if (sender === "me") return themIsBuyer ? "seller" : "buyer";
    }
    // Fallback kwa admin au mtumiaji bila counterpartyName
    return sender === "them" ? "buyer" : "seller";
  }

  // 3. ID (namba au string) — linganisha na buyerId/sellerId
  if (sender != null) {
    const senderId = String(sender);
    if (deal?.buyerId != null && String(deal.buyerId) === senderId) {
      return "buyer";
    }
    if (deal?.sellerId != null && String(deal.sellerId) === senderId) {
      return "seller";
    }
  }

  // 4. Fallback — haijulikani
  return "buyer";
}
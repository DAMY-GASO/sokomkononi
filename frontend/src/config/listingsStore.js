// ============================================================
// listingsStore.js
// Backend: /api/listings/
// Local cache (localStorage) + API hydration.
//
// STATUS VOCABULARY (frontend) -> DB:
//   live              -> active / AVAILABLE
//   paused            -> paused
//   reserved          -> reserved / RESERVED
//   sold              -> sold / SOLD
//   expired           -> expired
//   in_review         -> pending_review / PENDING_APPROVAL
//   pending_payment   -> draft / DRAFT
//   rejected          -> rejected / REJECTED
// ============================================================

import { useEffect, useState } from "react";
import { getPlatformPolicy } from "./systemSettingsStore.js";
import { listingsApi } from "../api/listings.js";
import { authApi } from "../api/auth.js";

const STORAGE_KEY = "sokomkononi_listings_v1";
const UPDATE_EVENT = "sokomkononi:listings-updated";

export const LISTING_LIFETIME_DAYS_FALLBACK = 60;

function getListingLifetimeDays() {
  try {
    const policy = getPlatformPolicy();
    const days = Number(policy?.listingLifetimeDays);
    if (Number.isFinite(days) && days >= 1) return days;
  } catch {
    // fallback below
  }
  return LISTING_LIFETIME_DAYS_FALLBACK;
}

function computeExpiresAt() {
  return new Date(
    Date.now() + getListingLifetimeDays() * 86400000
  ).toISOString();
}

export const SEED_LISTINGS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_LISTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LISTINGS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_LISTINGS;
    return parsed;
  } catch {
    return SEED_LISTINGS;
  }
}

export function getListings() {
  return readFromStorage();
}

export function saveListings(listings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function addListing(listing) {
  const withExpiry = listing.expiresAt
    ? listing
    : { ...listing, expiresAt: computeExpiresAt() };
  const next = [withExpiry, ...getListings()];
  saveListings(next);
  return next;
}

export function removeListing(id) {
  const next = getListings().filter((l) => l.id !== id);
  saveListings(next);
  return next;
}

export function updateListing(id, patch) {
  const current = getListings();
  const next = current.map((l) => (l.id === id ? { ...l, ...patch } : l));
  saveListings(next);
  return next;
}

export function decideListing(id, status, reason = "") {
  const listing = getListings().find((l) => l.id === id);
  const patch = { status };
  if (status === "live" && listing && !listing.expiresAt) {
    patch.expiresAt = computeExpiresAt();
  }
  return updateListing(id, patch);
}

export function findListingByTitle(title) {
  if (!title) return null;
  return getListings().find((l) => l.title === title) || null;
}

export function updateListingByTitle(title, patch) {
  const listing = findListingByTitle(title);
  if (!listing) return getListings();
  return updateListing(listing.id, patch);
}

export function checkListingExpiry() {
  return getListings();
}

export function checkListingExpiringSoon() {
  return getListings();
}

export function pauseListing(id) {
  return updateListing(id, {
    status: "paused",
    pausedAt: new Date().toISOString(),
  });
}

export function unpauseListing(id) {
  return updateListing(id, { status: "live", pausedAt: null });
}

export function markAsSold(id) {
  return updateListing(id, {
    status: "sold",
    soldAt: new Date().toISOString(),
  });
}

export function useListings() {
  const [listings, setListings] = useState(() => getListings());

  useEffect(() => {
    const sync = () => setListings(getListings());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return listings;
}

export function usePublicListings() {
  const listings = useListings();
  return listings.filter(
    (l) =>
      l.status === "live" ||
      l.status === "reserved" ||
      l.status === "sold"
  );
}

export function useLiveListings() {
  const listings = useListings();
  return listings.filter((l) => l.status === "live");
}

export const LISTING_STATUS_MAP = {
  live: "active",
  paused: "paused",
  reserved: "reserved",
  sold: "sold",
  expired: "expired",
  in_review: "pending_review",
  pending_payment: "draft",
  rejected: "rejected",
};

// ============================================================
// API NORMALIZATION
// ============================================================
const API_TO_FRONTEND_STATUS = {
  active: "live",
  AVAILABLE: "live",
  paused: "paused",
  reserved: "reserved",
  RESERVED: "reserved",
  sold: "sold",
  SOLD: "sold",
  expired: "expired",
  pending_review: "in_review",
  PENDING_APPROVAL: "in_review",
  draft: "pending_payment",
  DRAFT: "pending_payment",
  rejected: "rejected",
  REJECTED: "rejected",
};

export function normalizeListingFromApi(raw) {
  if (!raw) return null;

  let photos = [];
  if (Array.isArray(raw.photos)) photos = raw.photos;
  else if (Array.isArray(raw.images)) {
    photos = raw.images
      .map((img) => (typeof img === "string" ? img : img?.image_url || img?.image))
      .filter(Boolean);
  } else if (raw.image) {
    photos = [raw.image];
  }

  const categoryObj = raw.category;
  const category =
    categoryObj?.slug ||
    categoryObj?.key ||
    raw.category_slug ||
    (typeof categoryObj === "string" ? categoryObj : null) ||
    null;

  const status = API_TO_FRONTEND_STATUS[raw.status] || raw.status || "live";

  const sellerName =
    raw.seller_name ||
    raw.seller?.name ||
    (typeof raw.seller === "string" ? raw.seller : "");

  return {
    ...raw,
    id: raw.id ?? raw.pk,
    title: raw.title || raw.name || "",
    description: raw.description || "",
    price: Number(raw.price) || 0,
    category,
    categoryId: categoryObj?.id ?? raw.category_id ?? null,
    location: raw.location || raw.region || raw.address || "",
    region: raw.region || raw.location || "",
    status,
    views: Number(raw.views_count ?? raw.views) || 0,
    inquiries: Number(raw.inquiries) || 0,
    verified: Boolean(raw.verified ?? raw.is_verified),
    isFeatured: Boolean(raw.is_featured),
    isBoosted: Boolean(raw.is_boosted),
    boostedUntil: raw.boosted_until,
    photos,
    imageUrl: photos[0] || raw.imageUrl || null,
    seller: sellerName || raw.seller,
    seller_name: sellerName,
    sellerId: raw.seller?.id ?? raw.seller_id ?? null,
    postedAt: raw.created_at || raw.postedAt || new Date().toISOString(),
    expiresAt: raw.expires_at || raw.expiresAt || null,
    listingFee: Number(raw.listing_fee) || 0,
    rejectionReason: raw.rejection_reason || "",
    approvedAt: raw.approved_at || null,
    rejectedAt: raw.rejected_at || null,
  };
}

// ============================================================
// HYDRATE PUBLIC LISTINGS
// ============================================================
export async function hydrateListingsFromApi() {
  try {
    const data = await listingsApi.list({ page_size: 100 });
    const rawList = Array.isArray(data) ? data : data?.results || [];

    if (!rawList.length) {
      return { source: "empty", count: getListings().length };
    }

    const normalized = rawList.map(normalizeListingFromApi).filter(Boolean);
    saveListings(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[listingsStore] hydrate failed:", err);
    return { source: "error", count: getListings().length };
  }
}

// ============================================================
// FETCH MY LISTINGS (SELF-SUFFICIENT — no userId required)
//
// Steps:
//   1. Get current user from /api/auth/me/
//   2. Fetch /api/listings/?seller=<me.id>
//
// This means DashboardShell.jsx can call `fetchMyListingsFromApi()`
// without arguments, exactly as it does today.
// ============================================================
export async function fetchMyListingsFromApi() {
  try {
    // 1. Resolve current user id from token
    const me = await authApi.me();
    if (!me?.id) return { source: "empty", count: 0 };

    // 2. Fetch only this seller's listings
    const data = await listingsApi.mine(me.id, { page_size: 100 });
    const rawList = Array.isArray(data) ? data : data?.results || [];

    if (!rawList.length) {
      saveListings([]);
      return { source: "empty", count: 0 };
    }

    const normalized = rawList.map(normalizeListingFromApi).filter(Boolean);
    saveListings(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[listingsStore] fetchMyListings failed:", err);
    return { source: "error", count: getListings().length };
  }
}

// ============================================================
// ASYNC ACTIONS — local optimistic + API
// ============================================================

/**
 * Create a listing. The backend derives seller from the JWT.
 * `payload.category_id` must be the integer category ID.
 */
export async function createListingAsync(payload) {
  const tempId = `temp_${Date.now()}`;
  const optimistic = {
    ...payload,
    id: tempId,
    status: "pending_payment",
    postedAt: new Date().toISOString(),
  };
  addListing(optimistic);

  try {
    const created = await listingsApi.create(payload);
    const normalized = normalizeListingFromApi(created);
    const current = getListings();
    const next = current.map((l) => (l.id === tempId ? normalized : l));
    saveListings(next);
    return { ok: true, listing: normalized };
  } catch (err) {
    console.warn("[listingsStore] createListing failed:", err);
    removeListing(tempId);
    return { ok: false, error: err, listing: null };
  }
}

export async function updateListingAsync(id, patch) {
  updateListing(id, patch);
  try {
    await listingsApi.update(id, patch);
    return { ok: true };
  } catch (err) {
    console.warn("[listingsStore] updateListing failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeListingAsync(id) {
  removeListing(id);
  try {
    await listingsApi.remove(id);
    return { ok: true };
  } catch (err) {
    console.warn("[listingsStore] removeListing failed:", err);
    return { ok: false, error: err };
  }
}

export async function pauseListingAsync(id) {
  return updateListingAsync(id, {
    status: "paused",
    pausedAt: new Date().toISOString(),
  });
}

export async function unpauseListingAsync(id) {
  return updateListingAsync(id, { status: "live", pausedAt: null });
}

export async function markSoldAsync(id) {
  return updateListingAsync(id, {
    status: "sold",
    soldAt: new Date().toISOString(),
  });
}

/**
 * Pay the listing fee. Backend moves DRAFT → PENDING_APPROVAL.
 */
export async function payListingFeeAsync(id, payload) {
  try {
    const data = await listingsApi.payFee(id, payload);
    updateListing(id, {
      status: "in_review",
      paidAt: new Date().toISOString(),
    });
    return { ok: true, data };
  } catch (err) {
    console.warn("[listingsStore] payFee failed:", err);
    return { ok: false, error: err };
  }
}
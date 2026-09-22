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
  return new Date(Date.now() + getListingLifetimeDays() * 86400000).toISOString();
}

export const SEED_LISTINGS = [];

// ============================================================
// STORAGE
// ============================================================
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

// ============================================================
// SYNC HELPERS (used by legacy code + optimistic updates)
// ============================================================
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
  if (status === "rejected" && reason) patch.rejectionReason = reason;
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

export function getListing(id) {
  return getListings().find((l) => l.id === id) || null;
}

export function checkListingExpiry() {
  return getListings();
}

export function checkListingExpiringSoon() {
  return getListings();
}

export function pauseListing(id) {
  return updateListing(id, { status: "paused", pausedAt: new Date().toISOString() });
}

export function unpauseListing(id) {
  return updateListing(id, { status: "live", pausedAt: null });
}

export function markAsSold(id) {
  return updateListing(id, { status: "sold", soldAt: new Date().toISOString() });
}

// ============================================================
// HOOKS
// ============================================================
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
    (l) => l.status === "live" || l.status === "reserved" || l.status === "sold"
  );
}

export function useLiveListings() {
  const listings = useListings();
  return listings.filter((l) => l.status === "live");
}

export function useListing(id) {
  const listings = useListings();
  if (!id) return null;
  return listings.find((l) => String(l.id) === String(id)) || null;
}

// ============================================================
// STATUS MAP
// ============================================================
export const LISTING_STATUS_MAP = {
  live: "AVAILABLE",
  paused: "ARCHIVED",
  reserved: "RESERVED",
  sold: "SOLD",
  expired: "ARCHIVED",
  in_review: "PENDING_APPROVAL",
  pending_payment: "DRAFT",
  rejected: "REJECTED",
};

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

// ============================================================
// NORMALIZER
// ============================================================
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
// FETCH MY LISTINGS
// ============================================================
export async function fetchMyListingsFromApi() {
  try {
    const me = await authApi.me();
    if (!me?.id) return { source: "empty", count: 0 };

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
// FETCH FEATURED / BY CATEGORY
// ============================================================
export async function fetchFeaturedFromApi(params = {}) {
  try {
    const data = await listingsApi.featured({ page_size: 20, ...params });
    const rawList = Array.isArray(data) ? data : data?.results || [];
    return { ok: true, listings: rawList.map(normalizeListingFromApi).filter(Boolean) };
  } catch (err) {
    console.warn("[listingsStore] fetchFeatured failed:", err);
    return { ok: false, error: err, listings: [] };
  }
}

export async function fetchByCategoryFromApi(categoryId, params = {}) {
  try {
    const data = await listingsApi.byCategory(categoryId, { page_size: 20, ...params });
    const rawList = Array.isArray(data) ? data : data?.results || [];
    return { ok: true, listings: rawList.map(normalizeListingFromApi).filter(Boolean) };
  } catch (err) {
    console.warn("[listingsStore] fetchByCategory failed:", err);
    return { ok: false, error: err, listings: [] };
  }
}

// ============================================================
// FETCH PENDING (admin only)
// ============================================================
export async function fetchPendingListingsAsync() {
  try {
    const data = await listingsApi.pending();
    const rawList = Array.isArray(data) ? data : data?.results || [];
    const listings = rawList.map(normalizeListingFromApi).filter(Boolean);
    return { ok: true, listings };
  } catch (err) {
    console.warn("[listingsStore] fetchPending failed:", err);
    return { ok: false, error: err, listings: [] };
  }
}

// ============================================================
// ASYNC ACTIONS — with optimistic update + rollback
// ============================================================

/**
 * Create listing. Backend derives seller from JWT.
 */
export async function createListingAsync(payload) {
  const tempId = `temp_${Date.now()}`;
  const optimistic = {
    ...payload,
    id: tempId,
    status: "pending_payment",
    postedAt: new Date().toISOString(),
  };
  const previous = getListings();
  saveListings([optimistic, ...previous]);

  try {
    const created = await listingsApi.create(payload);

    // ⚠️ Backend contract: POST /listings/ returns ListingWrite (no `id`).
    // Resolve the real id by fetching the user's newest listings.
    let resolved = created;
    const hasId =
      created && (created.id ?? created.pk ?? created.listing_id ?? created.listingId);
    if (!hasId) {
      try {
        const me = await authApi.me();
        const mine = await listingsApi.mine(me.id, {
          ordering: "-created_at",
          page_size: 10,
        });
        const list = Array.isArray(mine) ? mine : mine?.results || [];
        const match = list.find((l) => l.title === payload.title);
        if (match?.id) {
          resolved = { ...created, ...match, id: match.id };
        }
      } catch (lookupErr) {
        console.warn("[listingsStore] id lookup failed:", lookupErr);
      }
    }

    const normalized = normalizeListingFromApi(resolved);
    if (!normalized || !normalized.id) {
      throw new Error("Backend haikurudisha listing id (createListingAsync)");
    }
    saveListings([normalized, ...getListings().filter((l) => l.id !== tempId)]);
    return { ok: true, listing: normalized };
  } catch (err) {
    saveListings(previous); // Rollback
    console.warn("[listingsStore] createListing failed:", err);
    return { ok: false, error: err, listing: null };
  }
}

export async function updateListingAsync(id, patch) {
  const previous = getListings();
  updateListing(id, patch);
  try {
    await listingsApi.update(id, patch);
    return { ok: true };
  } catch (err) {
    saveListings(previous); // Rollback
    console.warn("[listingsStore] updateListing failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeListingAsync(id) {
  const previous = getListings();
  removeListing(id);
  try {
    await listingsApi.remove(id);
    return { ok: true };
  } catch (err) {
    saveListings(previous); // Rollback
    console.warn("[listingsStore] removeListing failed:", err);
    return { ok: false, error: err };
  }
}

export async function pauseListingAsync(id) {
  // Backend enum: DRAFT | PENDING_APPROVAL | AVAILABLE | RESERVED | SOLD | REJECTED | ARCHIVED
  // No "PAUSED" — use ARCHIVED (closest semantics: hidden from buyers).
  return updateListingAsync(id, {
    status: "ARCHIVED",
    pausedAt: new Date().toISOString(),
  });
}

export async function unpauseListingAsync(id) {
  return updateListingAsync(id, { status: "AVAILABLE", pausedAt: null });
}

export async function markSoldAsync(id) {
  return updateListingAsync(id, {
    status: "SOLD",
    soldAt: new Date().toISOString(),
  });
}

/**
 * Pay listing fee. Backend moves DRAFT → PENDING_APPROVAL.
 */
export async function payListingFeeAsync(id, payload) {
  const previous = getListings();
  updateListing(id, {
    status: "in_review",
    paidAt: new Date().toISOString(),
  });
  try {
    const data = await listingsApi.payFee(id, payload);
    return { ok: true, data };
  } catch (err) {
    saveListings(previous); // Rollback
    console.warn("[listingsStore] payFee failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// ADMIN — Approve / Reject (uses listingsApi + moderationApi)
// ============================================================
export async function approveListingAsync(id) {
  const previous = getListings();
  updateListing(id, {
    status: "live",
    approvedAt: new Date().toISOString(),
    rejectionReason: "",
    expiresAt: computeExpiresAt(),
  });
  try {
    const data = await listingsApi.approve(id);
    // Refresh with server response if provided
    if (data) {
      const normalized = normalizeListingFromApi(data);
      if (normalized) {
        const current = getListings();
        saveListings(current.map((l) => (l.id === id ? normalized : l)));
      }
    }
    return { ok: true, data };
  } catch (err) {
    saveListings(previous); // Rollback
    console.warn("[listingsStore] approve failed:", err);
    return { ok: false, error: err };
  }
}

export async function rejectListingAsync(id, rejectionReason) {
  const previous = getListings();
  updateListing(id, {
    status: "rejected",
    rejectionReason: rejectionReason || "",
    rejectedAt: new Date().toISOString(),
  });
  try {
    const data = await listingsApi.reject(id, rejectionReason);
    return { ok: true, data };
  } catch (err) {
    saveListings(previous); // Rollback
    console.warn("[listingsStore] reject failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// IMAGE MANAGEMENT
// ============================================================
export async function fetchListingImagesAsync(listingId) {
  try {
    const data = await listingsApi.listImages(listingId);
    const images = Array.isArray(data) ? data : data?.results || [];
    return { ok: true, images };
  } catch (err) {
    console.warn("[listingsStore] fetchImages failed:", err);
    return { ok: false, error: err, images: [] };
  }
}

export async function uploadListingImageAsync(listingId, formData) {
  try {
    const data = await listingsApi.uploadImage(listingId, formData);
    return { ok: true, image: data };
  } catch (err) {
    console.warn("[listingsStore] uploadImage failed:", err);
    return { ok: false, error: err };
  }
}

export async function updateListingImageAsync(listingId, imageId, payload) {
  try {
    const data = await listingsApi.updateImage(listingId, imageId, payload);
    return { ok: true, image: data };
  } catch (err) {
    console.warn("[listingsStore] updateImage failed:", err);
    return { ok: false, error: err };
  }
}

export async function deleteListingImageAsync(listingId, imageId) {
  try {
    await listingsApi.deleteImage(listingId, imageId);
    return { ok: true };
  } catch (err) {
    console.warn("[listingsStore] deleteImage failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// DETAIL FETCH
// ============================================================
export async function fetchListingDetailAsync(id) {
  try {
    const data = await listingsApi.detail(id);
    const normalized = normalizeListingFromApi(data);
    if (normalized) {
      const current = getListings();
      const exists = current.some((l) => l.id === id);
      const next = exists
        ? current.map((l) => (l.id === id ? normalized : l))
        : [normalized, ...current];
      saveListings(next);
    }
    return { ok: true, listing: normalized };
  } catch (err) {
    console.warn("[listingsStore] detail failed:", err);
    return { ok: false, error: err, listing: null };
  }
}

// ============================================================
// CATEGORY-SPECIFIC DETAIL CREATORS (async wrappers)
// ============================================================
export async function createPropertyDetailsAsync(id, payload) {
  try {
    const data = await listingsApi.createPropertyDetails(id, payload);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function createLandDetailsAsync(id, payload) {
  try {
    const data = await listingsApi.createLandDetails(id, payload);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function createVehicleDetailsAsync(id, payload) {
  try {
    const data = await listingsApi.createVehicleDetails(id, payload);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function createBusinessDetailsAsync(id, payload) {
  try {
    const data = await listingsApi.createBusinessDetails(id, payload);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function createEquipmentDetailsAsync(id, payload) {
  try {
    const data = await listingsApi.createEquipmentDetails(id, payload);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

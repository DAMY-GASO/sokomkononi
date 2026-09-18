// ============================================================
// listingsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Listings (mali/matangazo).
//
// STATUS VOCABULARY (frontend) -> DB (per Muongozo §6):
//   live              -> active
//   paused            -> paused
//   reserved          -> reserved
//   sold              -> sold
//   expired           -> expired
//   in_review         -> pending_review
//   pending_payment   -> draft
//   rejected          -> rejected
// ============================================================

import { useEffect, useState } from "react";
import { getPlatformPolicy } from "./systemSettingsStore.js";
import {
  notifyListingApproved,
  notifyListingRejected,
  notifyListingSubmittedForReview,
  notifyListingExpiringSoon,
  notifyListingExpired,
  notifyPriceDrop,
} from "./notificationsStore.js";
import { checkNewListingMatches } from "./searchesStore.js";
import { listingsApi } from "../api/listings.js";

const STORAGE_KEY = "sokomkononi_listings_v1";
const UPDATE_EVENT = "sokomkononi:listings-updated";

export const LISTING_LIFETIME_DAYS_FALLBACK = 60;

function getListingLifetimeDays() {
  try {
    const policy = getPlatformPolicy();
    const days = Number(policy?.listingLifetimeDays);
    if (Number.isFinite(days) && days >= 1) return days;
  } catch {
    // endelea na fallback
  }
  return LISTING_LIFETIME_DAYS_FALLBACK;
}

function computeExpiresAt() {
  return new Date(
    Date.now() + getListingLifetimeDays() * 86400000
  ).toISOString();
}

// ============================================================
// SEED_LISTINGS — tupu. Data itakuja kutoka backend.
// ============================================================
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

  if (
    withExpiry.status === "in_review" ||
    withExpiry.status === "pending_review"
  ) {
    notifyListingSubmittedForReview({
      listingId: withExpiry.id,
      listingTitle: withExpiry.title,
    });
  }

  return next;
}

export function removeListing(id) {
  const next = getListings().filter((l) => l.id !== id);
  saveListings(next);
  return next;
}

export function updateListing(id, patch) {
  const current = getListings();
  const before = current.find((l) => l.id === id);
  const next = current.map((l) => (l.id === id ? { ...l, ...patch } : l));
  saveListings(next);

  if (
    before &&
    typeof patch.price === "number" &&
    typeof before.price === "number" &&
    patch.price < before.price
  ) {
    notifyPriceDrop({
      listingId: id,
      listingTitle: before.title,
      oldPrice: before.price,
      newPrice: patch.price,
    });
  }

  return next;
}

export function decideListing(id, status, reason = "") {
  const listing = getListings().find((l) => l.id === id);
  const patch = { status };
  if (status === "live") {
    if (listing && !listing.expiresAt) {
      patch.expiresAt = computeExpiresAt();
    }
  }
  const next = updateListing(id, patch);

  if (listing) {
    if (status === "live") {
      notifyListingApproved({ listingId: id, listingTitle: listing.title });
      checkNewListingMatches({ ...listing, ...patch });
    } else if (status === "rejected") {
      notifyListingRejected({
        listingId: id,
        listingTitle: listing.title,
        reason,
      });
    }
  }

  return next;
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
  const now = Date.now();
  const current = getListings();
  let changed = false;
  const next = current.map((l) => {
    if (l.status !== "live") return l;
    if (!l.expiresAt) return l;
    if (new Date(l.expiresAt).getTime() > now) return l;
    changed = true;
    notifyListingExpired({ listingId: l.id, listingTitle: l.title });
    return { ...l, status: "expired" };
  });
  if (changed) saveListings(next);
  return next;
}

const EXPIRY_REMINDER_DAYS = 3;

export function checkListingExpiringSoon() {
  const now = Date.now();
  const current = getListings();
  let changed = false;
  const next = current.map((l) => {
    if (l.status !== "live") return l;
    if (!l.expiresAt || l.expiryReminderSent) return l;
    const daysLeft = (new Date(l.expiresAt).getTime() - now) / 86400000;
    if (daysLeft <= 0 || daysLeft > EXPIRY_REMINDER_DAYS) return l;
    notifyListingExpiringSoon({
      listingId: l.id,
      listingTitle: l.title,
      daysLeft: Math.max(1, Math.ceil(daysLeft)),
    });
    changed = true;
    return { ...l, expiryReminderSent: true };
  });
  if (changed) saveListings(next);
  return next;
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
  paused: "paused",
  reserved: "reserved",
  sold: "sold",
  expired: "expired",
  pending_review: "in_review",
  draft: "pending_payment",
  rejected: "rejected",
};

export function normalizeListingFromApi(raw) {
  if (!raw) return null;

  let photos = [];
  if (Array.isArray(raw.photos)) photos = raw.photos;
  else if (Array.isArray(raw.images)) photos = raw.images;
  else if (raw.image) photos = [raw.image];

  photos = photos
    .map((p) => (typeof p === "string" ? p : p?.url || p?.image || null))
    .filter(Boolean);

  const category =
    raw.category?.key ||
    raw.category?.slug ||
    raw.category_slug ||
    (typeof raw.category === "string" ? raw.category : null) ||
    raw.category_id ||
    null;

  const status = API_TO_FRONTEND_STATUS[raw.status] || raw.status || "live";

  return {
    ...raw,
    id: raw.id ?? raw.pk,
    title: raw.title || raw.name || "",
    price: Number(raw.price) || 0,
    category,
    location: raw.location || raw.region || raw.address || "",
    region: raw.region || raw.location || "",
    status,
    views: Number(raw.views) || 0,
    verified: Boolean(raw.verified ?? raw.is_verified),
    photos,
    imageUrl: photos[0] || raw.imageUrl || null,
    postedAt: raw.postedAt || raw.created_at || raw.created || null,
  };
}

// ============================================================
// HYDRATE FROM API
// ============================================================
export async function hydrateListingsFromApi() {
  try {
    const data = await listingsApi.list({ page_size: 100 });
    const rawList = Array.isArray(data) ? data : data?.results || [];

    if (!rawList.length) {
      return { source: "seed", count: getListings().length };
    }

    const normalized = rawList.map(normalizeListingFromApi).filter(Boolean);
    saveListings(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[listingsStore] API hydrate imeshindwa:", err);
    return { source: "error", count: getListings().length };
  }
}

// ============================================================
// ASYNC ACTIONS — local + API (background sync)
// ============================================================
export async function fetchMyListingsFromApi() {
  try {
    const data = await listingsApi.list({ mine: true, page_size: 100 });
    const rawList = Array.isArray(data) ? data : data?.results || [];
    if (!rawList.length) return { source: "empty", count: 0 };
    const normalized = rawList.map(normalizeListingFromApi).filter(Boolean);
    saveListings(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[listingsStore] fetchMyListings failed:", err);
    return { source: "error", count: getListings().length };
  }
}

export async function createListingAsync(payload) {
  const tempId = `temp_${Date.now()}`;
  const optimistic = {
    ...payload,
    id: tempId,
    status: payload.status || "draft",
  };
  addListing(optimistic);

  try {
    const created = await listingsApi.create(payload);
    const current = getListings();
    const next = current.map((l) =>
      l.id === tempId ? normalizeListingFromApi(created) : l
    );
    saveListings(next);
    return { ok: true, listing: normalizeListingFromApi(created) };
  } catch (err) {
    console.warn("[listingsStore] createListing API failed:", err);
    return { ok: false, error: err, listing: optimistic };
  }
}

export async function updateListingAsync(id, patch) {
  updateListing(id, patch);
  try {
    await listingsApi.update(id, patch);
    return { ok: true };
  } catch (err) {
    console.warn("[listingsStore] updateListing API failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeListingAsync(id) {
  removeListing(id);
  try {
    await listingsApi.remove(id);
    return { ok: true };
  } catch (err) {
    console.warn("[listingsStore] removeListing API failed:", err);
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

export async function payListingFeeAsync(id, payload) {
  try {
    const data = await listingsApi.payFee(id, payload);
    updateListing(id, { status: "live", paidAt: new Date().toISOString() });
    return { ok: true, data };
  } catch (err) {
    console.warn("[listingsStore] payFee API failed:", err);
    return { ok: false, error: err };
  }
}

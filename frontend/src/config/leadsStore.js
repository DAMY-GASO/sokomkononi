// ============================================================
// listingsStore.js
// Backend: /api/listings/
//
// MABADILIKO MAKUU (v2):
//  - Caches mbili zilizotenganishwa: PUBLIC (Home/Browse) na MINE (seller).
//    Hazifutani tena.
//  - Local store INAANDIKA frontend vocab tu; API inapokea backend vocab
//    (tafsiri inafanyika kwenye toApiPatch / toFrontendPatch).
//  - ARCHIVED sasa inaeleweka ("paused"); fallback ya status si "live" tena.
//  - Rollback inarudisha caches zote mbili (snapshot / restore).
//  - Freshness: useMyListingsSync() kwa dashboard ya seller.
//  - Admin: fetchListingsByStatusAsync() (haiandiki kwenye cache yoyote).
//
// STATUS VOCABULARY (frontend) -> DB:
//   live              -> AVAILABLE
//   paused            -> ARCHIVED
//   reserved          -> RESERVED
//   sold              -> SOLD
//   expired           -> ARCHIVED
//   in_review         -> PENDING_APPROVAL
//   pending_payment   -> DRAFT
//   rejected          -> REJECTED
// ============================================================

import { useEffect, useState } from "react";
import { getPlatformPolicy } from "./systemSettingsStore.js";
import { listingsApi } from "../api/listings.js";
import { authApi } from "../api/auth.js";

const PUBLIC_KEY = "sokomkononi_listings_public_v1";
const MINE_KEY = "sokomkononi_listings_mine_v1";
const LEGACY_KEY = "sokomkononi_listings_v1"; // ya zamani — inafutwa
const UPDATE_EVENT = "sokomkononi:listings-updated";

export const LISTING_LIFETIME_DAYS_FALLBACK = 60;

// ============================================================
// STATUS MAPS
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
  // frontend vocab (identity) — ili status iliyokwisha kuwa frontend isipotee
  live: "live",
  paused: "paused",
  reserved: "reserved",
  sold: "sold",
  expired: "expired",
  in_review: "in_review",
  pending_payment: "pending_payment",
  rejected: "rejected",
  // backend vocab
  active: "live",
  AVAILABLE: "live",
  RESERVED: "reserved",
  SOLD: "sold",
  pending_review: "in_review",
  PENDING_APPROVAL: "in_review",
  draft: "pending_payment",
  DRAFT: "pending_payment",
  REJECTED: "rejected",
  ARCHIVED: "paused",
  archived: "paused",
};

function toApiPatch(patch) {
  if (!patch || !patch.status) return patch;
  return { ...patch, status: LISTING_STATUS_MAP[patch.status] || patch.status };
}

function toFrontendPatch(patch) {
  if (!patch || !patch.status) return patch;
  return { ...patch, status: API_TO_FRONTEND_STATUS[patch.status] || patch.status };
}

// ============================================================
// EXPIRY
// ============================================================
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
// LOW-LEVEL STORAGE (mbili: public + mine)
// ============================================================
function readKey(key) {
  if (typeof window === "undefined") return SEED_LISTINGS;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return SEED_LISTINGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_LISTINGS;
  } catch {
    return SEED_LISTINGS;
  }
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function writeKey(key, list, silent = false) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.warn("[listingsStore] storage write failed:", err);
  }
  if (!silent) emit();
}

// Futa key ya zamani (mchanganyiko wa data za aina zote)
if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
}

function snapshot() {
  return { pub: readKey(PUBLIC_KEY), mine: readKey(MINE_KEY) };
}

function restore(snap) {
  writeKey(PUBLIC_KEY, snap.pub, true);
  writeKey(MINE_KEY, snap.mine, true);
  emit();
}

function mutateBoth(fn) {
  writeKey(PUBLIC_KEY, fn(readKey(PUBLIC_KEY)), true);
  writeKey(MINE_KEY, fn(readKey(MINE_KEY)), true);
  emit();
}

// ============================================================
// PUBLIC API YA STORAGE
// ============================================================
export function getPublicListings() {
  return readKey(PUBLIC_KEY);
}

export function getMyListings() {
  return readKey(MINE_KEY);
}

export function savePublicListings(listings) {
  writeKey(PUBLIC_KEY, listings);
}

export function saveMyListings(listings) {
  writeKey(MINE_KEY, listings);
}

/**
 * Legacy: orodha iliyounganishwa (mine inashinda public kwa id ileile).
 */
export function getListings() {
  const map = new Map();
  readKey(PUBLIC_KEY).forEach((l) => map.set(String(l.id), l));
  readKey(MINE_KEY).forEach((l) => map.set(String(l.id), l));
  return Array.from(map.values());
}

/**
 * Legacy: inaandika kwenye cache ya MINE. Tumia savePublicListings /
 * saveMyListings moja kwa moja kwa code mpya.
 */
export function saveListings(listings) {
  saveMyListings(listings);
}

// ============================================================
// SYNC HELPERS (optimistic updates)
// ============================================================
export function addListing(listing) {
  const withExpiry = listing.expiresAt
    ? listing
    : { ...listing, expiresAt: computeExpiresAt() };
  saveMyListings([withExpiry, ...readKey(MINE_KEY)]);
  return getListings();
}

export function removeListing(id) {
  mutateBoth((list) => list.filter((l) => l.id !== id));
  return getListings();
}

export function updateListing(id, patch) {
  mutateBoth((list) => list.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  return getListings();
}

export function decideListing(id, status, reason = "") {
  const listing = getListing(id);
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
function useStoreValue(getter) {
  const [value, setValue] = useState(() => getter());

  useEffect(() => {
    const sync = () => setValue(getter());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}

/** Legacy: public + mine zimeunganishwa. */
export function useListings() {
  return useStoreValue(getListings);
}

/** Za seller mwenyewe (zote status: draft, in_review, rejected, live...). */
export function useMyListings() {
  return useStoreValue(getMyListings);
}

/** Za public tu (Home / Browse). Hazichanganyiki na za seller. */
export function usePublicListings() {
  const listings = useStoreValue(getPublicListings);
  return listings.filter(
    (l) => l.status === "live" || l.status === "reserved" || l.status === "sold"
  );
}

export function useLiveListings() {
  const listings = useStoreValue(getPublicListings);
  return listings.filter((l) => l.status === "live");
}

export function useListing(id) {
  const listings = useStoreValue(getListings);
  if (!id) return null;
  return listings.find((l) => String(l.id) === String(id)) || null;
}

/**
 * Weka kwenye dashboard ya seller. Inafanya:
 *  - fetch mara moja ukifungua
 *  - fetch tena tab inapokuwa visible
 *  - polling (default dakika 1) ikiwa kuna listing ya "in_review"
 */
export function useMyListingsSync({ pollMs = 60000 } = {}) {
  useEffect(() => {
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      fetchMyListingsFromApi();
    };

    refresh();

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    const timer = setInterval(() => {
      const hasPending = readKey(MINE_KEY).some((l) => l.status === "in_review");
      if (hasPending) refresh();
    }, pollMs);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [pollMs]);
}

/** Weka kwenye Home / Browse ili public list iwe fresh. */
export function useHydratePublicListings() {
  useEffect(() => {
    hydrateListingsFromApi();
  }, []);
}

// ============================================================
// NORMALIZER
// ============================================================
/**
 * @param raw            response ya API
 * @param fallbackStatus status ya kutumia ikiwa response haina status
 *                       inayoeleweka (mfano ListingWrite). Default: "in_review"
 *                       — kamwe si "live" kimya kimya.
 */
export function normalizeListingFromApi(raw, fallbackStatus) {
  if (!raw) return null;

  // `.map(normalizeListingFromApi)` inapitisha index kama hoja ya pili.
  // Kubali string halali tu; vinginevyo tumia "in_review".
  const safeFallback =
    typeof fallbackStatus === "string" && API_TO_FRONTEND_STATUS[fallbackStatus]
      ? API_TO_FRONTEND_STATUS[fallbackStatus]
      : "in_review";

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

  const status = API_TO_FRONTEND_STATUS[raw.status] || safeFallback;

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
    rejectionReason: raw.rejection_reason || raw.rejectionReason || "",
    approvedAt: raw.approved_at || null,
    rejectedAt: raw.rejected_at || null,
  };
}

function extractList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

// ============================================================
// HYDRATE PUBLIC LISTINGS  ->  PUBLIC cache tu
// ============================================================
export async function hydrateListingsFromApi() {
  try {
    const data = await listingsApi.list({ page_size: 100 });
    const normalized = extractList(data).map((r) => normalizeListingFromApi(r)).filter(Boolean);

    // Hata ikiwa tupu: andika tupu ili zilizofutwa/kuisha zisiendelee kuonekana.
    savePublicListings(normalized);
    return { source: normalized.length ? "api" : "empty", count: normalized.length };
  } catch (err) {
    console.warn("[listingsStore] hydrate failed:", err);
    return { source: "error", count: getPublicListings().length };
  }
}

// ============================================================
// FETCH MY LISTINGS  ->  MINE cache tu
// ============================================================
export async function fetchMyListingsFromApi() {
  try {
    const me = await authApi.me();
    if (!me?.id) return { source: "empty", count: 0 };

    const data = await listingsApi.mine(me.id, { page_size: 100 });
    const normalized = extractList(data).map((r) => normalizeListingFromApi(r)).filter(Boolean);

    // Usifute optimistic entries zinazoendelea kuundwa (temp_...)
    const temps = readKey(MINE_KEY).filter((l) => String(l.id).startsWith("temp_"));
    saveMyListings([...temps, ...normalized]);
    return { source: normalized.length ? "api" : "empty", count: normalized.length };
  } catch (err) {
    console.warn("[listingsStore] fetchMyListings failed:", err);
    return { source: "error", count: getMyListings().length };
  }
}

// ============================================================
// FETCH FEATURED / BY CATEGORY (haziandiki cache)
// ============================================================
export async function fetchFeaturedFromApi(params = {}) {
  try {
    const data = await listingsApi.featured({ page_size: 20, ...params });
    return {
      ok: true,
      listings: extractList(data).map((r) => normalizeListingFromApi(r)).filter(Boolean),
    };
  } catch (err) {
    console.warn("[listingsStore] fetchFeatured failed:", err);
    return { ok: false, error: err, listings: [] };
  }
}

export async function fetchByCategoryFromApi(categoryId, params = {}) {
  try {
    const data = await listingsApi.byCategory(categoryId, { page_size: 20, ...params });
    return {
      ok: true,
      listings: extractList(data).map((r) => normalizeListingFromApi(r)).filter(Boolean),
    };
  } catch (err) {
    console.warn("[listingsStore] fetchByCategory failed:", err);
    return { ok: false, error: err, listings: [] };
  }
}

// ============================================================
// ADMIN FETCH (haziandiki cache yoyote — admin ana state yake)
// ============================================================
export async function fetchPendingListingsAsync() {
  try {
    const data = await listingsApi.pending();
    const listings = extractList(data)
      .map((r) => normalizeListingFromApi(r, "in_review"))
      .filter(Boolean);
    return { ok: true, listings };
  } catch (err) {
    console.warn("[listingsStore] fetchPending failed:", err);
    return { ok: false, error: err, listings: [] };
  }
}

/**
 * Admin: leta listings kwa status moja (frontend vocab: "live", "rejected"...).
 * ⚠️ Inadhania listingsApi.list inakubali `status` kama query param.
 */
export async function fetchListingsByStatusAsync(frontendStatus, params = {}) {
  try {
    const apiStatus = LISTING_STATUS_MAP[frontendStatus] || frontendStatus;
    const data = await listingsApi.list({ status: apiStatus, page_size: 100, ...params });
    const listings = extractList(data)
      .map((r) => normalizeListingFromApi(r, frontendStatus))
      .filter(Boolean);
    return { ok: true, listings };
  } catch (err) {
    console.warn("[listingsStore] fetchByStatus failed:", err);
    return { ok: false, error: err, listings: [] };
  }
}

// ============================================================
// ASYNC ACTIONS — optimistic update + rollback
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
  const snap = snapshot();
  saveMyListings([optimistic, ...snap.mine]);

  try {
    const created = await listingsApi.create(payload);

    // ⚠️ Backend contract: POST /listings/ returns ListingWrite (no `id`).
    // Tafuta id halisi kupitia listing mpya za user.
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
        const list = extractList(mine);
        const knownIds = new Set(snap.mine.map((l) => String(l.id)));
        // Ya kwanza ni mpya zaidi (ordering -created_at); ruka zilizokuwepo tayari.
        const match = list.find(
          (l) => l.title === payload.title && !knownIds.has(String(l.id))
        );
        if (match?.id) {
          resolved = { ...created, ...match, id: match.id };
        }
      } catch (lookupErr) {
        console.warn("[listingsStore] id lookup failed:", lookupErr);
      }
    }

    // Response ya create haina status ya kuaminika -> DRAFT (pending_payment)
    const normalized = normalizeListingFromApi(resolved, "pending_payment");
    if (!normalized || !normalized.id) {
      throw new Error("Backend haikurudisha listing id (createListingAsync)");
    }
    saveMyListings([normalized, ...readKey(MINE_KEY).filter((l) => l.id !== tempId)]);
    return { ok: true, listing: normalized };
  } catch (err) {
    restore(snap);
    console.warn("[listingsStore] createListing failed:", err);
    return { ok: false, error: err, listing: null };
  }
}

/**
 * `patch` inaweza kuwa frontend vocab ("live") au backend ("AVAILABLE").
 * Local inapata frontend vocab; API inapata backend vocab.
 */
export async function updateListingAsync(id, patch) {
  const snap = snapshot();
  updateListing(id, toFrontendPatch(patch));
  try {
    await listingsApi.update(id, toApiPatch(patch));
    return { ok: true };
  } catch (err) {
    restore(snap);
    console.warn("[listingsStore] updateListing failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeListingAsync(id) {
  const snap = snapshot();
  removeListing(id);
  try {
    await listingsApi.remove(id);
    return { ok: true };
  } catch (err) {
    restore(snap);
    console.warn("[listingsStore] removeListing failed:", err);
    return { ok: false, error: err };
  }
}

export async function pauseListingAsync(id) {
  // frontend "paused" -> backend ARCHIVED (kupitia toApiPatch)
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
 * Pay listing fee. Backend moves DRAFT → PENDING_APPROVAL.
 */
export async function payListingFeeAsync(id, payload) {
  const snap = snapshot();
  updateListing(id, {
    status: "in_review",
    paidAt: new Date().toISOString(),
  });
  try {
    const data = await listingsApi.payFee(id, payload);
    return { ok: true, data };
  } catch (err) {
    restore(snap);
    console.warn("[listingsStore] payFee failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// ADMIN — Approve / Reject
// ============================================================
function applyServerListing(id, data, fallbackStatus) {
  // Tumia response ya server tu ikiwa ni listing kamili (ina id + title),
  // ili response ya sehemu isifute data.
  if (!data || !data.id || !data.title) return;
  const normalized = normalizeListingFromApi(data, fallbackStatus);
  if (normalized) mutateBoth((list) => list.map((l) => (l.id === id ? normalized : l)));
}

export async function approveListingAsync(id) {
  const snap = snapshot();
  updateListing(id, {
    status: "live",
    approvedAt: new Date().toISOString(),
    rejectionReason: "",
    expiresAt: computeExpiresAt(),
  });
  try {
    const data = await listingsApi.approve(id);
    applyServerListing(id, data, "live");
    return { ok: true, data };
  } catch (err) {
    restore(snap);
    console.warn("[listingsStore] approve failed:", err);
    return { ok: false, error: err };
  }
}

export async function rejectListingAsync(id, rejectionReason) {
  const snap = snapshot();
  updateListing(id, {
    status: "rejected",
    rejectionReason: rejectionReason || "",
    rejectedAt: new Date().toISOString(),
  });
  try {
    const data = await listingsApi.reject(id, rejectionReason);
    applyServerListing(id, data, "rejected");
    return { ok: true, data };
  } catch (err) {
    restore(snap);
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
    return { ok: true, images: extractList(data) };
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
      // Sasisha popote ilipo; ikiwa haipo popote, ongeza kwenye PUBLIC
      // tu ikiwa ni ya public (live/reserved/sold).
      const inPub = readKey(PUBLIC_KEY).some((l) => l.id === id);
      const inMine = readKey(MINE_KEY).some((l) => l.id === id);
      if (inPub) {
        savePublicListings(readKey(PUBLIC_KEY).map((l) => (l.id === id ? normalized : l)));
      }
      if (inMine) {
        saveMyListings(readKey(MINE_KEY).map((l) => (l.id === id ? normalized : l)));
      }
      if (!inPub && !inMine && ["live", "reserved", "sold"].includes(normalized.status)) {
        savePublicListings([normalized, ...readKey(PUBLIC_KEY)]);
      }
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

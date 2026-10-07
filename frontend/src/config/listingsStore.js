// ============================================================
// listingsStore.js
// FIX: normalizer maps boosted_until → boostExpiresAt so the
//      dashboard's isBoostActive() actually fires for API data.
// NEW: checkDuplicateListing + checkDuplicateListingAsync — zuia
//      seller kuweka listing inayofanana na iliyopo.
// NEW: attributes (JSONField) inasomwa kutoka API na kuhifadhiwa.
// NEW: restoreListingAsync — rejesha listing iliyofutwa (undo).
// ============================================================
import { useEffect, useState } from "react";
import { getPlatformPolicy } from "./systemSettingsStore.js";
import { listingsApi } from "../api/listings.js";
import { authApi } from "../api/auth.js";
import { api } from "../api/client.js";
import { getSeedKeyFromSlug } from "./categoriesStore.js";
import { pickImageUrl, resolveImageUrl } from "../pages/dashboard/components/shared.js";

const PUBLIC_KEY = "sokomkononi_listings_public_v1";
const MINE_KEY = "sokomkononi_listings_mine_v1";
const LEGACY_KEY = "sokomkononi_listings_v1";
const UPDATE_EVENT = "sokomkononi:listings-updated";

export const LISTING_LIFETIME_DAYS_FALLBACK = 60;

export const LISTING_STATUS_MAP = {
  live: "LIVE",
  paused: "PAUSED",
  reserved: "RESERVED",
  sold: "SOLD",
  expired: "ARCHIVED",
  in_review: "PENDING_APPROVAL",
  pending_payment: "DRAFT",
  rejected: "REJECTED",
};

const API_TO_FRONTEND_STATUS = {
  live: "live",
  paused: "paused",
  reserved: "reserved",
  sold: "sold",
  expired: "expired",
  in_review: "in_review",
  pending_payment: "pending_payment",
  rejected: "rejected",
  active: "live",
  archived: "paused",
  draft: "pending_payment",
  pending_review: "in_review",
  LIVE: "live",
  PAUSED: "paused",
  RESERVED: "reserved",
  SOLD: "sold",
  EXPIRED: "expired",
  IN_REVIEW: "in_review",
  PENDING_PAYMENT: "pending_payment",
  REJECTED: "rejected",
  AVAILABLE: "live",
  ARCHIVED: "paused",
  DRAFT: "pending_payment",
  PENDING_APPROVAL: "in_review",
  REJECT: "rejected",
};

function toApiPatch(patch) {
  if (!patch || !patch.status) return patch;
  return { ...patch, status: LISTING_STATUS_MAP[patch.status] || patch.status };
}

function toFrontendPatch(patch) {
  if (!patch || !patch.status) return patch;
  return { ...patch, status: API_TO_FRONTEND_STATUS[patch.status] || patch.status };
}

function getListingLifetimeDays() {
  try {
    const policy = getPlatformPolicy();
    const days = Number(policy?.listingLifetimeDays);
    if (Number.isFinite(days) && days >= 1) return days;
  } catch { /* noop */ }
  return LISTING_LIFETIME_DAYS_FALLBACK;
}

function computeExpiresAt() {
  return new Date(Date.now() + getListingLifetimeDays() * 86400000).toISOString();
}

export const SEED_LISTINGS = [];

function readKey(key) {
  if (typeof window === "undefined") return SEED_LISTINGS;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return SEED_LISTINGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_LISTINGS;
  } catch { return SEED_LISTINGS; }
}
function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UPDATE_EVENT));
}
function writeKey(key, list, silent = false) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key, JSON.stringify(list)); }
  catch (err) { console.warn("[listingsStore] storage write failed:", err); }
  if (!silent) emit();
}

if (typeof window !== "undefined") {
  try { window.localStorage.removeItem(LEGACY_KEY); } catch { /* noop */ }
}

function snapshot() { return { pub: readKey(PUBLIC_KEY), mine: readKey(MINE_KEY) }; }
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

export function getPublicListings() { return readKey(PUBLIC_KEY); }
export function getMyListings() { return readKey(MINE_KEY); }
export function savePublicListings(listings) { writeKey(PUBLIC_KEY, listings); }
export function saveMyListings(listings) { writeKey(MINE_KEY, listings); }

export function getListings() {
  const map = new Map();
  readKey(PUBLIC_KEY).forEach((l) => map.set(String(l.id), l));
  readKey(MINE_KEY).forEach((l) => map.set(String(l.id), l));
  return Array.from(map.values());
}
export function saveListings(listings) { saveMyListings(listings); }

export function addListing(listing) {
  const withExpiry = listing.expiresAt ? listing : { ...listing, expiresAt: computeExpiresAt() };
  saveMyListings([withExpiry, ...readKey(MINE_KEY)]);
  return getListings();
}
export function removeListing(id) {
  mutateBoth((list) => list.filter((l) => String(l.id) !== String(id)));
  return getListings();
}
export function updateListing(id, patch) {
  mutateBoth((list) => list.map((l) => (String(l.id) === String(id) ? { ...l, ...patch } : l)));
  return getListings();
}
export function decideListing(id, status, reason = "") {
  const listing = getListing(id);
  const patch = { status };
  if (status === "live" && listing && !listing.expiresAt) patch.expiresAt = computeExpiresAt();
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
  return getListings().find((l) => String(l.id) === String(id)) || null;
}
export function checkListingExpiry() { return getListings(); }
export function checkListingExpiringSoon() { return getListings(); }
export function pauseListing(id) {
  return updateListing(id, { status: "paused", pausedAt: new Date().toISOString() });
}
export function unpauseListing(id) { return updateListing(id, { status: "live", pausedAt: null }); }
export function markAsSold(id) {
  return updateListing(id, { status: "sold", soldAt: new Date().toISOString() });
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================
function normalizeForCompare(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, "");
}

/**
 * Angalia kama listing ni duplicate ya listing nyingine ya seller huyu.
 * Returns { isDuplicate: bool, existing: listing | null }
 */
export function checkDuplicateListing({
  title,
  price,
  location,
  category,
  sellerId,
  windowDays = 30,
}) {
  if (!title || !sellerId) return { isDuplicate: false, existing: null };

  const all = getListings();
  const normalizedTitle = normalizeForCompare(title);
  const normalizedLocation = normalizeForCompare(location);
  const priceNum = Number(price) || 0;

  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;

  for (const listing of all) {
    if (String(listing.sellerId) !== String(sellerId)) continue;
    if (listing.postedAt && new Date(listing.postedAt).getTime() < cutoff) continue;
    if (listing.status === "deleted" || listing.status === "rejected") continue;

    const sameTitle = normalizeForCompare(listing.title) === normalizedTitle;
    const sameLocation =
      normalizeForCompare(listing.location) === normalizedLocation;
    const sameCategory = String(listing.category) === String(category);
    const samePrice = Math.abs((Number(listing.price) || 0) - priceNum) < 1;

    if (sameTitle && sameLocation && sameCategory && samePrice) {
      return { isDuplicate: true, existing: listing };
    }
  }

  return { isDuplicate: false, existing: null };
}

/**
 * Angalia kama listing ni duplicate kupitia backend.
 */
export async function checkDuplicateListingAsync({
  title,
  price,
  location,
  category,
  windowDays = 30,
}) {
  try {
    const res = await api.post("/listings/check-duplicate/", {
      title,
      price,
      location,
      category,
      window_days: windowDays,
    });
    return {
      ok: true,
      isDuplicate: !!res?.is_duplicate,
      existing: res?.existing || null,
      source: "backend",
    };
  } catch (err) {
    if (err?.status === 404 || err?.status === 405) {
      console.warn(
        "[listingsStore] /listings/check-duplicate/ haipo — tumia local check"
      );
      try {
        const me = await authApi.me();
        const sellerId = me?.id;
        if (!sellerId) return { ok: true, isDuplicate: false, existing: null, source: "local" };

        const local = checkDuplicateListing({
          title,
          price,
          location,
          category,
          sellerId,
          windowDays,
        });
        return { ok: true, ...local, source: "local" };
      } catch (authErr) {
        return { ok: false, error: authErr };
      }
    }
    return { ok: false, error: err };
  }
}

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

export function useListings() { return useStoreValue(getListings); }
export function useMyListings() { return useStoreValue(getMyListings); }
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

export function useMyListingsSync({ pollMs = 60000 } = {}) {
  useEffect(() => {
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      fetchMyListingsFromApi();
    };
    refresh();
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
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

export function useHydratePublicListings() {
  useEffect(() => { hydrateListingsFromApi(); }, []);
}

// Drop temp_ listings that never got a real backend id, older than 24h.
if (typeof window !== "undefined") {
  try {
    const now = Date.now();
    const mine = readKey(MINE_KEY);
    const cleaned = mine.filter((l) => {
      if (!String(l.id || "").startsWith("temp_")) return true;
      const age = now - new Date(l.postedAt || 0).getTime();
      return age < 24 * 60 * 60 * 1000;
    });
    if (cleaned.length !== mine.length) {
      writeKey(MINE_KEY, cleaned, true);
      emit();
    }
  } catch { /* noop */ }
}

export function normalizeListingFromApi(raw, fallbackStatus = "in_review") {
  if (!raw) return null;

  let photos = [];
  if (Array.isArray(raw.photos)) photos = raw.photos;
  else if (Array.isArray(raw.images)) photos = raw.images;
  else if (Array.isArray(raw.gallery)) photos = raw.gallery;

  photos = photos
    .map((img) => {
      if (typeof img === "string") return img;
      return img?.image_url || img?.url || img?.image || img?.src || null;
    })
    .filter(Boolean);

  const singleImage = pickImageUrl(raw);
  if (singleImage && !photos.includes(singleImage)) {
    photos.unshift(singleImage);
  }

  const categoryObj = raw.category;
  const rawCategorySlug =
    categoryObj?.slug ||
    categoryObj?.key ||
    raw.category_slug ||
    (typeof categoryObj === "string" ? categoryObj : null) ||
    null;
  const category = getSeedKeyFromSlug(rawCategorySlug);

  const rawStatus = raw.status ? String(raw.status).toUpperCase() : "";
  const status =
    API_TO_FRONTEND_STATUS[raw.status] ||
    API_TO_FRONTEND_STATUS[rawStatus] ||
    fallbackStatus;

  const sellerName =
    raw.seller_name ||
    raw.seller?.name ||
    (typeof raw.seller === "string" ? raw.seller : "");

  const boostedUntil = raw.boosted_until || raw.boostedUntil || null;
  const boostExpiresAt =
    raw.boostExpiresAt ||
    (raw.is_boosted && !boostedUntil ? new Date(Date.now() + 86400000).toISOString() : boostedUntil);
  const leadingExpiresAt =
    raw.leading_expires_at || raw.leadingExpiresAt || null;

  const primaryPhoto = resolveImageUrl(photos[0] || null);
  const normalizedPhotos = photos.map((u) => resolveImageUrl(u)).filter(Boolean);

  return {
    ...raw,
    id: raw.id ?? raw.pk,
    title: raw.title || raw.name || "",
    description: raw.description || "",
    price: Number(raw.price) || 0,
    category,
    categoryId: categoryObj?.id ?? raw.category_id ?? null,
    location: raw.location || raw.region || raw.address || "",
    attributes: raw.attributes || {},
    region: raw.region || raw.location || "",
    status,
    views: Number(raw.views_count ?? raw.views) || 0,
    inquiries: Number(raw.inquiries) || 0,
    verified: Boolean(raw.verified ?? raw.is_verified),
    isFeatured: Boolean(raw.is_featured),
    isBoosted: Boolean(raw.is_boosted),
    boostedUntil,
    boostExpiresAt,
    leadingExpiresAt,
    photos: normalizedPhotos,
    imageUrl: primaryPhoto,
    seller: sellerName || raw.seller,
    seller_name: sellerName,
    // `seller` inaweza kuwa object ({id,...}), au namba (id) tu kutoka DRF.
    sellerId:
      raw.seller?.id ??
      raw.seller_id ??
      (typeof raw.seller === "number" ? raw.seller : null),
    postedAt: raw.created_at || raw.postedAt || new Date().toISOString(),
    expiresAt: raw.expires_at || raw.expiresAt || null,
    // ── Payment / status labels (new backend fields) ────────
    statusLabel: raw.status_label || raw.statusLabel || "",
    paymentStatus:
      raw.payment_status ||
      raw.paymentStatus ||
      (raw.listing_fee?.payment_status) ||
      "PENDING",
    paymentLabel:
      raw.payment_label ||
      raw.paymentLabel ||
      (raw.payment_status === "PAID" ? "Imelipwa" : "Haijalipwa"),
    feeAmount: Number(
      raw.fee_amount ??
      raw.feeAmount ??
      raw.listing_fee?.amount ??
      0
    ),
    isPaid: Boolean(
      raw.is_paid ??
      raw.isPaid ??
      (raw.payment_status === "PAID" ||
       raw.listing_fee?.payment_status === "PAID")
    ),
    listingFee: Number(raw.listing_fee) || 0,
    rejectionReason: raw.rejection_reason || raw.rejectionReason || "",
    approvedAt: raw.approved_at || null,
    rejectedAt: raw.rejected_at || null,
  };
}

function extractList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

export async function hydrateListingsFromApi() {
  try {
    const data = await listingsApi.list({ page_size: 200 });
    const normalized = extractList(data).map((r) => normalizeListingFromApi(r)).filter(Boolean);
    savePublicListings(normalized);
    return { source: normalized.length ? "api" : "empty", count: normalized.length };
  } catch (err) {
    console.warn("[listingsStore] hydrate failed:", err);
    return { source: "error", count: getPublicListings().length };
  }
}

let _myListingsUserId = null;

export async function fetchMyListingsFromApi({ refreshUser = false } = {}) {
  try {
    if (refreshUser || _myListingsUserId == null) {
      const me = await authApi.me();
      _myListingsUserId = me?.id ?? null;
    }
    if (!_myListingsUserId) return { source: "empty", count: 0 };
    const data = await listingsApi.mine(_myListingsUserId, { page_size: 200 });
    const normalized = extractList(data).map((r) => normalizeListingFromApi(r)).filter(Boolean);
    const temps = readKey(MINE_KEY).filter((l) => String(l.id).startsWith("temp_"));
    saveMyListings([...temps, ...normalized]);
    return { source: normalized.length ? "api" : "empty", count: normalized.length };
  } catch (err) {
    console.warn("[listingsStore] fetchMyListings failed:", err);
    return { source: "error", count: getMyListings().length };
  }
}

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

const API_STATUS_FOR_FILTER = {
  live: ["LIVE"],
  rejected: ["REJECTED"],
  in_review: ["PENDING_APPROVAL", "IN_REVIEW"],
  pending_payment: ["PENDING_PAYMENT", "DRAFT"],
  paused: ["PAUSED", "ARCHIVED"],
  sold: ["SOLD"],
  reserved: ["RESERVED"],
  expired: ["EXPIRED"],
};

async function tryOneStatus(apiStatus, frontendStatus, params) {
  const data = await listingsApi.list({
    status: apiStatus, page_size: 200, ...params,
  });
  return extractList(data)
    .map((r) => normalizeListingFromApi(r, frontendStatus))
    .filter(Boolean);
}

export async function fetchListingsByStatusAsync(frontendStatus, params = {}) {
  const candidates =
    API_STATUS_FOR_FILTER[frontendStatus] ||
    [LISTING_STATUS_MAP[frontendStatus] || frontendStatus];

  let lastErr = null;
  for (const apiStatus of candidates) {
    try {
      const listings = await tryOneStatus(apiStatus, frontendStatus, params);
      if (listings.length > 0) {
        return { ok: true, listings, statusUsed: apiStatus };
      }
      lastErr = null;
    } catch (err) {
      lastErr = err;
      if ([400, 404, 405].includes(err?.status)) continue;
      break;
    }
  }

  const local = getListings().filter((l) => l.status === frontendStatus);
  if (local.length > 0) return { ok: true, listings: local, source: "cache" };

  return {
    ok: false,
    error: lastErr || new Error("Empty result"),
    listings: [],
  };
}

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

    let resolved = created;
    const hasId =
      created && (created.id ?? created.pk ?? created.listing_id ?? created.listingId);
    if (!hasId) {
      try {
        const me = await authApi.me();
        const mine = await listingsApi.mine(me.id, { ordering: "-created_at", page_size: 10 });
        const list = extractList(mine);
        const knownIds = new Set(snap.mine.map((l) => String(l.id)));
        const match = list.find(
          (l) => l.title === payload.title && !knownIds.has(String(l.id))
        );
        if (match?.id) resolved = { ...created, ...match, id: match.id };
      } catch (lookupErr) {
        console.warn("[listingsStore] id lookup failed:", lookupErr);
      }
    }

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

// ============================================================
// RESTORE — rejesha listing iliyofutwa (soft delete undo)
// ============================================================
export async function restoreListingAsync(id) {
  const snap = snapshot();
  try {
    // Endpoint ya restore (backend)
    await listingsApi.restore(id);
    // Sasisha local cache — ondoa `is_deleted`, rudisha status
    mutateBoth((list) =>
      list.map((l) =>
        String(l.id) === String(id)
          ? { ...l, is_deleted: false, status: "live" }
          : l
      )
    );
    return { ok: true };
  } catch (err) {
    // Fallback: PATCH kwa listing kurudisha status (kama /restore/ haipo)
    if (err?.status === 404 || err?.status === 405) {
      console.warn(
        "[listingsStore] /restore/ haipo — tumia PATCH /listings/{id}/"
      );
      try {
        await listingsApi.update(id, { status: "AVAILABLE" });
        restore(snap);
        return { ok: true };
      } catch (patchErr) {
        restore(snap);
        return { ok: false, error: patchErr };
      }
    }
    restore(snap);
    return { ok: false, error: err };
  }
}

export async function pauseListingAsync(id) {
  return updateListingAsync(id, { status: "paused", pausedAt: new Date().toISOString() });
}
export async function unpauseListingAsync(id) {
  return updateListingAsync(id, { status: "live", pausedAt: null });
}
export async function markSoldAsync(id) {
  return updateListingAsync(id, { status: "sold", soldAt: new Date().toISOString() });
}

export function resetMyListingsUserCache() {
  _myListingsUserId = null;
}

export async function payListingFeeAsync(id, payload) {
  if (String(id).startsWith("temp_")) {
    return {
      ok: false,
      error: new Error(
        "Listing bado haijathibitishwa na backend (temp id). Subiri sync au jaribu tena."
      ),
    };
  }
  const snap = snapshot();
  updateListing(id, { status: "in_review", paidAt: new Date().toISOString() });
  try {
    const data = await listingsApi.payFee(id, payload);
    return { ok: true, data };
  } catch (err) {
    restore(snap);
    console.warn("[listingsStore] payFee failed:", err);
    return { ok: false, error: err };
  }
}

function applyServerListing(id, data, fallbackStatus) {
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
    const nowLive = getListing(id);
    if (nowLive && nowLive.status === "live") {
      const pub = readKey(PUBLIC_KEY);
      if (!pub.some((l) => String(l.id) === String(id))) {
        writeKey(PUBLIC_KEY, [nowLive, ...pub]);
      }
    }
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
    writeKey(
      PUBLIC_KEY,
      readKey(PUBLIC_KEY).filter((l) => String(l.id) !== String(id))
    );
    return { ok: true, data };
  } catch (err) {
    restore(snap);
    console.warn("[listingsStore] reject failed:", err);
    return { ok: false, error: err };
  }
}

export async function fetchListingImagesAsync(listingId) {
  try {
    const data = await listingsApi.listImages(listingId);
    return { ok: true, images: extractList(data) };
  } catch (err) {
    return { ok: false, error: err, images: [] };
  }
}
export async function uploadListingImageAsync(listingId, formData) {
  try {
    const data = await listingsApi.uploadImage(listingId, formData);
    return { ok: true, image: data };
  } catch (err) { return { ok: false, error: err }; }
}
export async function updateListingImageAsync(listingId, imageId, payload) {
  try {
    const data = await listingsApi.updateImage(listingId, imageId, payload);
    return { ok: true, image: data };
  } catch (err) { return { ok: false, error: err }; }
}
export async function deleteListingImageAsync(listingId, imageId) {
  try {
    await listingsApi.deleteImage(listingId, imageId);
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function fetchListingDetailAsync(id) {
  try {
    const data = await listingsApi.detail(id);
    const normalized = normalizeListingFromApi(data);
    if (normalized) {
      const inPub = readKey(PUBLIC_KEY).some((l) => String(l.id) === String(id));
      const inMine = readKey(MINE_KEY).some((l) => String(l.id) === String(id));
      if (inPub) {
        savePublicListings(
          readKey(PUBLIC_KEY).map((l) =>
            String(l.id) === String(id) ? normalized : l
          )
        );
      }
      if (inMine) {
        saveMyListings(
          readKey(MINE_KEY).map((l) =>
            String(l.id) === String(id) ? normalized : l
          )
        );
      }
      if (
        !inPub &&
        !inMine &&
        ["live", "reserved", "sold"].includes(normalized.status)
      ) {
        savePublicListings([normalized, ...readKey(PUBLIC_KEY)]);
      }
    }
    return { ok: true, listing: normalized, raw: data };
  } catch (err) {
    console.warn("[listingsStore] fetchListingDetail failed:", err);
    return { ok: false, error: err, listing: null };
  }
}

export async function createPropertyDetailsAsync(id, payload) {
  try { const data = await listingsApi.createPropertyDetails(id, payload); return { ok: true, data }; }
  catch (err) { return { ok: false, error: err }; }
}
export async function createLandDetailsAsync(id, payload) {
  try { const data = await listingsApi.createLandDetails(id, payload); return { ok: true, data }; }
  catch (err) { return { ok: false, error: err }; }
}
export async function createVehicleDetailsAsync(id, payload) {
  try { const data = await listingsApi.createVehicleDetails(id, payload); return { ok: true, data }; }
  catch (err) { return { ok: false, error: err }; }
}
export async function createBusinessDetailsAsync(id, payload) {
  try { const data = await listingsApi.createBusinessDetails(id, payload); return { ok: true, data }; }
  catch (err) { return { ok: false, error: err }; }
}
export async function createEquipmentDetailsAsync(id, payload) {
  try { const data = await listingsApi.createEquipmentDetails(id, payload); return { ok: true, data }; }
  catch (err) { return { ok: false, error: err }; }
}

// ============================================================
// UNPAID LISTINGS — seller dashboard
// ============================================================
export function useUnpaidListings() {
  const mine = useMyListings();
  return mine.filter(
    (l) =>
      !l.isPaid &&
      (l.status === "pending_payment" ||
       l.status === "PENDING_PAYMENT" ||
       l.status === "draft" ||
       l.status === "DRAFT")
  );
}

export function useUnpaidListingsCount() {
  return useUnpaidListings().length;
}

export async function fetchMyUnpaidListingsAsync() {
  try {
    const data = await api.get("/listings/mine/unpaid/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    return {
      ok: true,
      count: Number(data?.count ?? list.length) || 0,
      listings: list.map((r) => normalizeListingFromApi(r)).filter(Boolean),
    };
  } catch (err) {
    console.warn("[listingsStore] fetchMyUnpaidListings failed:", err);
    return { ok: false, error: err, count: 0, listings: [] };
  }
}


// ============================================================
// Pay listing fee (FimiPay flow) — returns order_id for polling.
// ============================================================
export async function payListingFeeWithFimiPayAsync(
  id,
  { payment_method = "", phone = "" } = {}
) {
  if (String(id).startsWith("temp_")) {
    return {
      ok: false,
      error: new Error(
        "Listing bado haijathibitishwa na backend (temp id). Subiri sync."
      ),
    };
  }
  try {
    const res = await api.post(`/listings/${id}/fee/pay/`, {
      payment_method,
      phone,
    });
    const candidates = [
      res?.fimipay,
      res?.data?.fimipay,
      res?.data,
      res,
    ].filter(Boolean);
    const payload =
      candidates.find((c) => c && (c.order_id || c.payment_status)) || {};
    return {
      ok: true,
      orderId: payload.order_id || null,
      paymentStatus: (payload.payment_status || "").toUpperCase() || null,
      transid: payload.transid || null,
      gatewayUrl: payload.payment_gateway_url || null,
      simulated: !!payload.simulated,
      raw: payload,
    };
  } catch (err) {
    return { ok: false, error: err };
  }
}

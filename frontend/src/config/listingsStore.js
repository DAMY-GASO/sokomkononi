// ============================================================
// listingsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Listings (mali/matangazo).
//
// Awamu hii imeongezwa (kulingana na Muongozo wa Mfumo §3.5, §6):
//   - listing.expiresAt   (listing inaisha muda — status -> "expired")
//   - listing.reservedUntil (deal ikiwa "reserved", listing inaonyesha
//                            "Reservation ends in: ...")
//   - listing.reservedBy   (jina la mnunuzi aliyereserve — kwa DB: buyer_id)
//   - findListingByTitle() (mpito: deals za zamani zina listingTitle pekee)
//   - checkListingExpiry() (huita mara kwa mara — kama
//                           checkReservationReminders kwenye dealsStore)
//   - STATUS_SYNC: ramani ya jinsi dealsStore inavyo-update listing.
//
// STATUS VOCABULARY (frontend) -> DB (per Muongozo §6):
//   live              -> active
//   reserved          -> reserved
//   sold              -> sold
//   expired           -> expired
//   in_review         -> pending_review
//   pending_payment   -> draft
//   rejected          -> rejected
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_listings_v1";
const UPDATE_EVENT = "sokomkononi:listings-updated";

// Siku 30 kwa default, kabla listing "live" kuisha muda.
export const LISTING_LIFETIME_DAYS = 30;

export const SEED_LISTINGS = [
  // ... (kama ilivyo — nakala kamili itaandikwa kwenye patched file)
];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_LISTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LISTINGS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_LISTINGS;
    return parsed;
  } catch {
    return SEED_LISTINGS;
  }
}

export function getListings() { return readFromStorage(); }

export function saveListings(listings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function addListing(listing) {
  // Ongeza expiresAt ikiwa haipo — inatumika kwenye checkListingExpiry.
  const withExpiry = listing.expiresAt
    ? listing
    : {
        ...listing,
        expiresAt: new Date(Date.now() + LISTING_LIFETIME_DAYS * 86400000).toISOString(),
      };
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
  const next = getListings().map((l) => (l.id === id ? { ...l, ...patch } : l));
  saveListings(next);
  return next;
}

export function decideListing(id, status) {
  // Listing inapoanza kuwa live kwa mara ya kwanza, weka expiresAt.
  const patch = { status };
  if (status === "live") {
    const listing = getListings().find((l) => l.id === id);
    if (listing && !listing.expiresAt) {
      patch.expiresAt = new Date(Date.now() + LISTING_LIFETIME_DAYS * 86400000).toISOString();
    }
  }
  return updateListing(id, patch);
}

/** Msaidizi kwa deals za zamani ambazo zina `listingTitle` pekee —
 *  hutumika hadi zote zihamishwe kwa `listingId`. */
export function findListingByTitle(title) {
  if (!title) return null;
  return getListings().find((l) => l.title === title) || null;
}

/** Badilisha listing moja moja kwa title (kwa deals za zamani). */
export function updateListingByTitle(title, patch) {
  const listing = findListingByTitle(title);
  if (!listing) return getListings();
  return updateListing(listing.id, patch);
}

/**
 * Angalia listings zenye `expiresAt` zilizopita. Zinazokuwa "expired"
 * haziwi "live" tena. Hii inaitwa na DashboardShell kila dakika.
 */
export function checkListingExpiry() {
  const now = Date.now();
  const current = getListings();
  let changed = false;
  const next = current.map((l) => {
    if (l.status !== "live") return l;
    if (!l.expiresAt) return l;
    if (new Date(l.expiresAt).getTime() > now) return l;
    changed = true;
    return { ...l, status: "expired" };
  });
  if (changed) saveListings(next);
  return next;
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

/**
 * Listing zinazoonekana hadharani kwa wanunuzi (Browse, Category, Home):
 *   - "live"     -> zinaonekana kawaida
 *   - "reserved" -> ZINAONEKANA pia, lakini zina badge ya RESERVED na
 *                   kitufe "Join Waiting List" badala ya "Nunua Hii".
 *   - "sold"     -> zinaonekana kwa historia (badge SOLD)
 *
 * Doc §3.3 inasema buyer anaona: AVAILABLE / RESERVED / SOLD. Kwa hivyo
 * filters hizi tatu lazima zipite.
 */
export function usePublicListings() {
  const listings = useListings();
  return listings.filter(
    (l) => l.status === "live" || l.status === "reserved" || l.status === "sold"
  );
}

/** Rudi kwa backward-compat — bado inatumika kwenye sehemu zilizoandikwa
 *  kabla ya "reserved" kuwa public. Itaondolewa baada ya kuunganisha
 *  BrowseProperties + CategoryPage + HomePage kwa usePublicListings(). */
export function useLiveListings() {
  const listings = useListings();
  return listings.filter((l) => l.status === "live");
}

// ---- STATUS SYNC (ramani rasmi kwa Developer A) ----
export const LISTING_STATUS_MAP = {
  live: "active",
  reserved: "reserved",
  sold: "sold",
  expired: "expired",
  in_review: "pending_review",
  pending_payment: "draft",
  rejected: "rejected",
};
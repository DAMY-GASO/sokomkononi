// ============================================================
// listingsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Listings (mali/matangazo).
//
// Awamu hii imeongezwa (kulingana na Muongozo wa Mfumo §3.5, §6):
//   - listing.expiresAt     (listing inaisha muda — status -> "expired")
//   - listing.reservedUntil (deal ikiwa "reserved", listing inaonyesha
//                            "Reservation ends in: ...")
//   - listing.reservedBy    (jina la mnunuzi aliyereserve — kwa DB: buyer_id)
//   - findListingByTitle()  (mpito: deals za zamani zina listingTitle pekee)
//   - checkListingExpiry()  (huitwa na DashboardShell kila dakika 5 — kama
//                            checkReservationReminders kwenye dealsStore)
//   - LISTING_STATUS_MAP    (ramani ya frontend -> DB kwa Developer A)
//
// STATUS VOCABULARY (frontend) -> DB (per Muongozo §6):
//   live              -> active
//   reserved          -> reserved
//   sold              -> sold
//   expired           -> expired
//   in_review         -> pending_review
//   pending_payment   -> draft
//   rejected          -> rejected
//
// MUDA WA MAISHA YA LISTING: siku 60 kwa default, lakini
// inasomwa kutoka platform policy (Admin > System Settings >
// Platform Policy) kila listing mpya inapoundwa — hivyo Admin
// anaweza kuongeza/kupunguza bila kugusa code.
// ============================================================

import { useEffect, useState } from "react";
import { getPlatformPolicy } from "./systemSettingsStore.js";

const STORAGE_KEY = "sokomkononi_listings_v1";
const UPDATE_EVENT = "sokomkononi:listings-updated";

// Fallback ikiwa policy haijasomwa kwa sababu yoyote (SSR, error,
// n.k.). Thamani hii sasa ni 60 — ila chanzo cha ukweli ni
// getPlatformPolicy().listingLifetimeDays.
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

// SEED_LISTINGS inabaki kama ilivyo — nakala kamili kutoka faili
// yako ya awali (l1–l12). Sijaandika upya ili usiingize makosa;
// bandika orodha ileile hapa.
export const SEED_LISTINGS = [
  // ... (bandika SEED_LISTINGS yako ya awali hapa — haijabadilika)
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

/** Soma listings za sasa (snapshot moja, si reactive). */
export function getListings() {
  return readFromStorage();
}

/** Andika orodha mpya kamili ya listings. */
export function saveListings(listings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Ongeza tangazo jipya (mf. kutoka PostPropertyForm). */
export function addListing(listing) {
  // Weka expiresAt kwa kutumia policy ya sasa — isipokuwa listing
  // imeletwa na expiresAt yake (mf. import/seed/testing).
  const withExpiry = listing.expiresAt
    ? listing
    : { ...listing, expiresAt: computeExpiresAt() };
  const next = [withExpiry, ...getListings()];
  saveListings(next);
  return next;
}

/** Ondoa tangazo (mf. muuzaji akifuta). */
export function removeListing(id) {
  const next = getListings().filter((l) => l.id !== id);
  saveListings(next);
  return next;
}

/** Badilisha (merge patch) tangazo moja tu kwa id yake. */
export function updateListing(id, patch) {
  const next = getListings().map((l) => (l.id === id ? { ...l, ...patch } : l));
  saveListings(next);
  return next;
}

/**
 * Uamuzi wa Admin kwenye Moderation (Idhinisha / Kataa).
 * status: "live" | "rejected"
 * Listing inapoidhinishwa kwa mara ya kwanza, tunaiwekea expiresAt
 * kutoka policy ya sasa.
 */
export function decideListing(id, status) {
  const patch = { status };
  if (status === "live") {
    const listing = getListings().find((l) => l.id === id);
    if (listing && !listing.expiresAt) {
      patch.expiresAt = computeExpiresAt();
    }
  }
  return updateListing(id, patch);
}

/**
 * Msaidizi kwa deals za zamani ambazo zina `listingTitle` pekee —
 * hutumika hadi zote zihamishwe kwa `listingId` (Pass 2 inahamisha
 * DealRooms; seeds zote zimekwisha hamishwa).
 */
export function findListingByTitle(title) {
  if (!title) return null;
  return getListings().find((l) => l.title === title) || null;
}

/** Badilisha listing moja kwa title (kwa deals za zamani). */
export function updateListingByTitle(title, patch) {
  const listing = findListingByTitle(title);
  if (!listing) return getListings();
  return updateListing(listing.id, patch);
}

/**
 * Angalia listings zenye `expiresAt` zilizopita. Zilizokuwa "live"
 * zinakuwa "expired". Hii inaitwa na DashboardShell mara moja
 * kwenye mount, kisha kila dakika 5 (pamoja na
 * checkReservationReminders).
 *
 * "reserved" haigusi — listing iliyo kwenye deal bado iko hai
 * kwa mfumo, hata kama expiresAt yake imepita. Inaisha kuwa "expired"
 * tu baada ya deal kuisha/kughairi (kurudi "live") na muda kupita.
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

/**
 * Hook ya React inayosoma listings na kujisasisha yenyewe — kwenye
 * DashboardShell (My Listings), AdminDashboard (Moderation), na
 * BrowseProperties (feed ya mnunuzi) papo hapo, bila reload.
 */
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
 * Doc §3.3: buyer anaona AVAILABLE / RESERVED / SOLD — hivyo tatu
 * hizi lazima zipite.
 */
export function usePublicListings() {
  const listings = useListings();
  return listings.filter(
    (l) => l.status === "live" || l.status === "reserved" || l.status === "sold"
  );
}

/**
 * @deprecated Tumia usePublicListings() badala yake.
 *
 * Hii inarudi listings "live" pekee (bila reserved/sold) — mtindo wa
 * awali kabla ya reservation kuwa public. Inabaki kwa backward-compat
 * kwa sehemu yoyote isiyojulikana, ILA sehemu zote za UI
 * (BrowseProperties, CategoryPage, HomePage, PropertyDetailPage)
 * zimehamishwa kwa usePublicListings() kwenye Pass 2.
 */
export function useLiveListings() {
  const listings = useListings();
  return listings.filter((l) => l.status === "live");
}

// ---- STATUS SYNC (ramani rasmi kwa Developer A) ----
// Backend mapping: frontend status -> DB enum value.
export const LISTING_STATUS_MAP = {
  live: "active",
  reserved: "reserved",
  sold: "sold",
  expired: "expired",
  in_review: "pending_review",
  pending_payment: "draft",
  rejected: "rejected",
};

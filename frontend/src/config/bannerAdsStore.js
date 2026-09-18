// ============================================================
// bannerAdsStore.js
// Rekodi HALISI za banner za dashboard alizonunua muuzaji kupitia
// AdvertiseSasa.jsx (baada ya kulipa Advertisement Fee — bei yake
// inatoka ../../config/advertisementFeeStore.js).
//
// Kila rekodi inaunganisha moja kwa moja na listing halisi ya
// muuzaji (listingsStore.js) — banner haina maudhui yake tofauti,
// ni "dirisha" tu la kuipa listing hiyo mwonekano wa ziada kwenye
// Dashboard (buyer na seller side) kwa muda wa `expiresAt`.
//
// DashboardShell.jsx inatumia useActiveBannerAds() kupata banner
// ambazo bado hazijaisha muda, na kuzizungusha (rotate) kila
// sekunde 5 — kama ilivyoainishwa kwenye Admin > Revenue >
// Advertisement Fee ("5s rotation").
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; useActiveBannerAds() na useBannerAds() hazitahitaji
// kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_banner_ads_v1";
const UPDATE_EVENT = "sokomkononi:banner-ads-updated";

// Hakuna banner za mfano kwa default — zinaonekana tu baada ya
// muuzaji kununua Advertisement Fee kupitia AdvertiseSasa.jsx.
export const SEED_BANNER_ADS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_BANNER_ADS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_BANNER_ADS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_BANNER_ADS;
    return parsed;
  } catch {
    return SEED_BANNER_ADS;
  }
}

function writeToStorage(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Je, banner hii bado ina muda (haijaisha)? */
export function isBannerActive(banner) {
  return Boolean(banner.expiresAt && new Date(banner.expiresAt).getTime() > Date.now());
}

/** Soma banner ZOTE (hai na zilizoisha) — snapshot moja. */
export function getBannerAds() {
  return readFromStorage();
}

/** Soma banner ZINAZOTUMIKA sasa hivi tu (hazijaisha muda). */
export function getActiveBannerAds() {
  return getBannerAds().filter(isBannerActive);
}

/**
 * Unda banner mpya kutoka listing halisi, kwa idadi ya siku
 * iliyotolewa (kutoka advertisementFeeStore.getAdvertisementFeeConfig().days).
 * Inaitwa na AdvertiseSasa.jsx mara malipo yanapofanikiwa.
 */
export function addBannerAd(listing, days) {
  const banner = {
    id: `ad_${Date.now()}`,
    listingId: listing.id,
    listingTitle: listing.title,
    category: listing.category,
    location: listing.location,
    price: listing.price,
    sellerName: listing.seller_name,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
  };
  const next = [banner, ...getBannerAds()];
  writeToStorage(next);
  return banner;
}

/** Ondoa banner moja (mfano Admin akitaka kuiondoa kabla ya muda). */
export function removeBannerAd(id) {
  const next = getBannerAds().filter((b) => b.id !== id);
  writeToStorage(next);
  return next;
}

/** Siku ngapi zimebaki kabla banner haijaisha. */
export function bannerDaysRemaining(banner) {
  if (!isBannerActive(banner)) return 0;
  const ms = new Date(banner.expiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 86400000));
}

/** Hook: banner ZOTE, inajisasisha yenyewe (Admin/moderation baadaye). */
export function useBannerAds() {
  const [banners, setBanners] = useState(() => getBannerAds());

  useEffect(() => {
    const sync = () => setBanners(getBannerAds());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return banners;
}

/**
 * Hook: banner ZINAZOTUMIKA tu — hii ndiyo inayotumika na
 * PromotedBannerStrip.jsx kwenye DashboardShell. Inajisasisha yenyewe
 * pale banner mpya inaponunuliwa (custom event) na pia kila dakika
 * moja ili banner iliyoisha muda iondoke bila reload.
 */
export function useActiveBannerAds() {
  const [banners, setBanners] = useState(() => getActiveBannerAds());

  useEffect(() => {
    const sync = () => setBanners(getActiveBannerAds());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    const expiryCheck = setInterval(sync, 60000);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
      clearInterval(expiryCheck);
    };
  }, []);

  return banners;
}

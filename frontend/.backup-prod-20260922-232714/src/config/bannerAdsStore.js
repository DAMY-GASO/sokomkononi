// ============================================================
// bannerAdsStore.js — API-backed via /api/banners/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_banner_ads_v1";
const UPDATE_EVENT = "sokomkononi:banner-ads-updated";

export const SEED_BANNER_ADS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_BANNER_ADS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_BANNER_ADS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_BANNER_ADS;
  } catch {
    return SEED_BANNER_ADS;
  }
}

function writeToStorage(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function isBannerActive(banner) {
  return Boolean(banner.expiresAt && new Date(banner.expiresAt).getTime() > Date.now());
}

export function getBannerAds() { return readFromStorage(); }
export function getActiveBannerAds() { return getBannerAds().filter(isBannerActive); }

function normalizeFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    listingId: raw.listingId ?? raw.listing_id,
    listingTitle: raw.listingTitle ?? raw.listing_title ?? "",
    category: raw.category || "",
    location: raw.location || "",
    price: Number(raw.price) || 0,
    sellerName: raw.sellerName ?? raw.seller_name ?? "",
    createdAt: raw.created_at,
    expiresAt: raw.expires_at,
    active: !!raw.active,
  };
}

export async function hydrateBannerAdsFromApi() {
  try {
    const data = await api.get("/banners/");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeFromApi).filter(Boolean);
    writeToStorage(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[bannerAdsStore] hydrate failed:", err);
    return { source: "error", count: getBannerAds().length };
  }
}

export async function createBannerAdAsync(listingId, payment_reference = "") {
  const raw = await api.post("/banners/", {
    listing: listingId, payment_reference,
  });
  const banner = normalizeFromApi(raw);
  writeToStorage([banner, ...getBannerAds()]);
  return banner;
}

export function addBannerAd(listing, days) {
  const banner = {
    id: `local_${Date.now()}`,
    listingId: listing.id,
    listingTitle: listing.title,
    category: listing.category,
    location: listing.location,
    price: listing.price,
    sellerName: listing.seller_name,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + (days || 7) * 86400000).toISOString(),
    active: true,
  };
  writeToStorage([banner, ...getBannerAds()]);
  if (listing.id) createBannerAdAsync(listing.id).catch(() => {});
  return banner;
}

export function removeBannerAd(id) {
  const next = getBannerAds().filter((b) => b.id !== id);
  writeToStorage(next);
  if (typeof id === "number") api.delete(`/banners/${id}/`).catch(() => {});
  return next;
}

export function bannerDaysRemaining(banner) {
  if (!isBannerActive(banner)) return 0;
  const ms = new Date(banner.expiresAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 86400000));
}

export function useBannerAds() {
  const [banners, setBanners] = useState(() => getBannerAds());
  useEffect(() => {
    hydrateBannerAdsFromApi();
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

export function useActiveBannerAds() {
  const [banners, setBanners] = useState(() => getActiveBannerAds());
  useEffect(() => {
    hydrateBannerAdsFromApi();
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

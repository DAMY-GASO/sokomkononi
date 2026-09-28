// ============================================================
// bannerAdsStore.js — API-only via /api/banners/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_banner_ads_v1";
const EV = "sokomkononi:banner-ads-updated";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}
function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}
export function isBannerActive(b) {
  return Boolean(b.expiresAt && new Date(b.expiresAt).getTime() > Date.now());
}
export function getBannerAds() { return read(); }
export function getActiveBannerAds() { return read().filter(isBannerActive); }
export function bannerDaysRemaining(b) {
  if (!isBannerActive(b)) return 0;
  return Math.max(1, Math.ceil((new Date(b.expiresAt).getTime() - Date.now()) / 86400000));
}
function norm(raw) {
  if (!raw) return null;
  const nestedListing = raw.listing && typeof raw.listing === "object" ? raw.listing : null;
  return {
    id: raw.id,
    listingId:
      nestedListing?.id ??
      raw.listingId ??
      raw.listing_id ??
      (typeof raw.listing === "number" || typeof raw.listing === "string" ? raw.listing : null),
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
    const d = await api.get("/banners/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    write(list.map(norm).filter(Boolean));
    return { ok: true, count: list.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function createBannerAdAsync(listingId, payment_reference = "") {
  try {
    const raw = await api.post("/banners/", { listing: listingId });
    const b = norm(raw);
    write([b, ...getBannerAds()]);
    return { ok: true, banner: b };
  } catch (err) { return { ok: false, error: err }; }
}

// ============================================================
// Pay + activate a banner. Backend flow:
//   POST /api/banners/{id}/pay/ { payment_reference } → activates
// ============================================================
export async function payBannerAdAsync(bannerId, payment_reference = "") {
  if (!bannerId) return { ok: false, error: new Error("bannerId required") };
  try {
    const raw = await api.post(`/banners/${bannerId}/pay/`, {
      payment_reference: payment_reference || `BAN-${Date.now()}`,
    });
    const updated = norm(raw) || null;
    if (updated) {
      write(getBannerAds().map((b) => (b.id === bannerId ? updated : b)));
    }
    return { ok: true, banner: updated };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function removeBannerAdAsync(id) {
  try {
    await api.delete(`/banners/${id}/`);
    write(getBannerAds().filter((b) => b.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function useBannerAds() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateBannerAdsFromApi();
    const sync = () => setList(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return list;
}
export function useActiveBannerAds() {
  const [list, setList] = useState(() => getActiveBannerAds());
  useEffect(() => {
    hydrateBannerAdsFromApi();
    const sync = () => setList(getActiveBannerAds());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    const t = setInterval(sync, 60000);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
      clearInterval(t);
    };
  }, []);
  return list;
}

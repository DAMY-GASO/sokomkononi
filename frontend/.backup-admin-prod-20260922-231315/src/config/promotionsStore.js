// ============================================================
// promotionsStore.js
// CHANZO KIKUU: /api/promotions/
// Fallback: local computation kutoka stores nyingine.
// ============================================================

import { useEffect, useState, useMemo } from "react";
import { promotionsApi } from "../api/promotions.js";
import { useListings } from "./listingsStore.js";
import { useActiveBannerAds, getBannerAds } from "./bannerAdsStore.js";
import { useTransactions } from "./transactionsStore.js";
import {
  isBoostActive,
  isLeadingActive,
  boostDaysRemaining,
  leadingDaysRemaining,
} from "../pages/dashboard/components/shared";

const ANALYTICS_KEY = "sokomkononi_promotions_analytics_v1";
const CAMPAIGNS_KEY = "sokomkononi_promotions_campaigns_v1";
const ANALYTICS_EVENT = "sokomkononi:promotions-analytics-updated";
const CAMPAIGNS_EVENT = "sokomkononi:campaigns-updated";

export const SEED_CAMPAIGNS = [];

// ============================================================
// STORAGE HELPERS
// ============================================================
function readJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed == null) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function saveJSON(key, event, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(event));
}

// ============================================================
// LOCAL FALLBACK — hesabu kutoka stores nyingine
// ============================================================
function computeLocalAnalytics(listings, banners, transactions, campaigns) {
  const boostedListings = listings
    .filter((l) => isBoostActive(l))
    .map((l) => ({
      ...l,
      promotionType: "boost",
      daysRemaining: boostDaysRemaining(l),
      expiresAt: l.boostExpiresAt,
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const leadingListings = listings
    .filter((l) => isLeadingActive(l))
    .map((l) => ({
      ...l,
      promotionType: "leading",
      daysRemaining: leadingDaysRemaining(l),
      expiresAt: l.leadingExpiresAt,
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const advertisedListings = banners
    .map((banner) => {
      const listing = listings.find((l) => l.id === banner.listingId);
      if (!listing) return null;
      const daysRemaining = banner.expiresAt
        ? Math.max(0, Math.ceil((new Date(banner.expiresAt).getTime() - Date.now()) / 86400000))
        : 0;
      return { ...listing, promotionType: "advertise", banner, daysRemaining, expiresAt: banner.expiresAt };
    })
    .filter(Boolean)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const FEE_TYPES = {
    boost: transactions.filter((t) => t.status === "completed" && t.type === "boost"),
    leading: transactions.filter((t) => t.status === "completed" && t.type === "leading"),
    advertise: transactions.filter((t) => t.status === "completed" && t.type === "advertisement"),
  };

  const revenueByType = {
    boost: FEE_TYPES.boost.reduce((s, t) => s + (t.amount || 0), 0),
    leading: FEE_TYPES.leading.reduce((s, t) => s + (t.amount || 0), 0),
    advertise: FEE_TYPES.advertise.reduce((s, t) => s + (t.amount || 0), 0),
  };

  const totalPromotionRevenue =
    revenueByType.boost + revenueByType.leading + revenueByType.advertise;

  const counts = {
    boosted: boostedListings.length,
    leading: leadingListings.length,
    advertised: advertisedListings.length,
    campaigns: campaigns.length,
    totalActive:
      boostedListings.length + leadingListings.length + advertisedListings.length,
  };

  const sellerPromotions = {};
  [...boostedListings, ...leadingListings, ...advertisedListings].forEach((l) => {
    const seller = l.seller_name || l.seller || "Unknown";
    if (!sellerPromotions[seller]) {
      sellerPromotions[seller] = { name: seller, boosts: 0, leads: 0, ads: 0, total: 0 };
    }
    sellerPromotions[seller].total += 1;
    if (l.promotionType === "boost") sellerPromotions[seller].boosts += 1;
    if (l.promotionType === "leading") sellerPromotions[seller].leads += 1;
    if (l.promotionType === "advertise") sellerPromotions[seller].ads += 1;
  });

  const topPromotedSellers = Object.values(sellerPromotions)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    boostedListings,
    leadingListings,
    advertisedListings,
    counts,
    revenueByType,
    totalPromotionRevenue,
    topPromotedSellers,
    source: "local",
  };
}

// ============================================================
// NORMALIZER — API → frontend shape
// ============================================================
function normalizeAnalyticsFromApi(raw, listings) {
  if (!raw || typeof raw !== "object") return null;

  const enrich = (arr) =>
    (arr || []).map((item) => {
      const listing = listings.find((l) => l.id === item.listingId);
      return { ...(listing || {}), ...item };
    });

  return {
    boostedListings: enrich(raw.boostedListings),
    leadingListings: enrich(raw.leadingListings),
    advertisedListings: enrich(raw.advertisedListings),
    counts: raw.counts || {
      boosted: 0, leading: 0, advertised: 0, campaigns: 0, totalActive: 0,
    },
    revenueByType: raw.revenueByType || { boost: 0, leading: 0, advertise: 0 },
    totalPromotionRevenue: Number(raw.totalPromotionRevenue) || 0,
    topPromotedSellers: raw.topPromotedSellers || [],
    source: "api",
  };
}

// ============================================================
// HYDRATE ANALYTICS
// ============================================================
export async function hydratePromotionsAnalyticsFromApi() {
  try {
    const data = await promotionsApi.analytics();
    saveJSON(ANALYTICS_KEY, ANALYTICS_EVENT, data);
    return { ok: true, source: "api", data };
  } catch (err) {
    console.warn("[promotionsStore] analytics hydrate failed:", err);
    return { ok: false, source: "error", error: err };
  }
}

export function getPromotionsAnalyticsCache() {
  return readJSON(ANALYTICS_KEY, null);
}

// ============================================================
// CAMPAIGNS — API-backed + fallback
// ============================================================
export function getCampaigns() {
  return readJSON(CAMPAIGNS_KEY, SEED_CAMPAIGNS);
}

function saveCampaigns(list) {
  saveJSON(CAMPAIGNS_KEY, CAMPAIGNS_EVENT, list);
}

function normalizeCampaignFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || { sw: "", en: "" },
    description: raw.description || { sw: "", en: "" },
    discountPercent: Number(raw.discountPercent ?? raw.discount_percent) || 0,
    startDate: raw.startDate || raw.start_date,
    endDate: raw.endDate || raw.end_date,
    active: raw.active !== false,
    createdAt: raw.createdAt || raw.created_at,
  };
}

export async function hydrateCampaignsFromApi() {
  try {
    const data = await promotionsApi.campaigns.list();
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeCampaignFromApi).filter(Boolean);
    saveCampaigns(normalized);
    return { ok: true, source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[promotionsStore] campaigns hydrate failed:", err);
    return { ok: false, source: "error", error: err };
  }
}

export async function addCampaignAsync(campaign) {
  if (!campaign?.name) {
    return { ok: false, error: new Error("name inahitajika") };
  }

  const previous = getCampaigns();
  const optimistic = {
    id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: { sw: "", en: "" },
    description: { sw: "", en: "" },
    discountPercent: 0,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    active: true,
    ...campaign,
  };
  saveCampaigns([optimistic, ...previous]);

  try {
    const raw = await promotionsApi.campaigns.create({
      name: optimistic.name,
      description: optimistic.description,
      discount_percent: optimistic.discountPercent,
      start_date: optimistic.startDate,
      end_date: optimistic.endDate,
      active: optimistic.active,
    });
    const created = normalizeCampaignFromApi(raw);
    if (created) {
      saveCampaigns(getCampaigns().map((c) => (c.id === optimistic.id ? created : c)));
      return { ok: true, campaign: created };
    }
    return { ok: true, campaign: optimistic };
  } catch (err) {
    saveCampaigns(previous); // Rollback
    console.warn("[promotionsStore] addCampaign failed:", err);
    return { ok: false, error: err };
  }
}

export async function updateCampaignAsync(id, patch) {
  const previous = getCampaigns();
  const target = previous.find((c) => c.id === id);
  if (!target) return { ok: false, error: new Error("Campaign haipo") };

  saveCampaigns(previous.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  if (typeof id !== "number") return { ok: true, campaign: { ...target, ...patch } };

  try {
    const raw = await promotionsApi.campaigns.update(id, {
      ...(patch.name != null ? { name: patch.name } : {}),
      ...(patch.description != null ? { description: patch.description } : {}),
      ...(patch.discountPercent != null ? { discount_percent: patch.discountPercent } : {}),
      ...(patch.startDate != null ? { start_date: patch.startDate } : {}),
      ...(patch.endDate != null ? { end_date: patch.endDate } : {}),
      ...(patch.active != null ? { active: patch.active } : {}),
    });
    const updated = normalizeCampaignFromApi(raw);
    if (updated) {
      saveCampaigns(getCampaigns().map((c) => (c.id === id ? updated : c)));
    }
    return { ok: true };
  } catch (err) {
    saveCampaigns(previous); // Rollback
    console.warn("[promotionsStore] updateCampaign failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeCampaignAsync(id) {
  const previous = getCampaigns();
  saveCampaigns(previous.filter((c) => c.id !== id));

  if (typeof id !== "number") return { ok: true };

  try {
    await promotionsApi.campaigns.remove(id);
    return { ok: true };
  } catch (err) {
    saveCampaigns(previous); // Rollback
    console.warn("[promotionsStore] removeCampaign failed:", err);
    return { ok: false, error: err };
  }
}

// ---------- LEGACY (deprecated) ----------
/** @deprecated Use addCampaignAsync */
export function addCampaign(campaign) {
  const entry = {
    id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: { sw: "", en: "" },
    description: { sw: "", en: "" },
    discountPercent: 0,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    active: true,
    ...campaign,
  };
  saveCampaigns([entry, ...getCampaigns()]);
  promotionsApi.campaigns.create(entry).catch((err) =>
    console.warn("[promotionsStore] addCampaign silent fail:", err)
  );
  return entry;
}

/** @deprecated Use updateCampaignAsync */
export function updateCampaign(id, patch) {
  const next = getCampaigns().map((c) => (c.id === id ? { ...c, ...patch } : c));
  saveCampaigns(next);
  return next;
}

/** @deprecated Use removeCampaignAsync */
export function removeCampaign(id) {
  const next = getCampaigns().filter((c) => c.id !== id);
  saveCampaigns(next);
  return next;
}

// ============================================================
// MAIN HOOK — inapendelea API, fallback ni local
// ============================================================
export function usePromotions(lang = "sw") {
  const listings = useListings();
  const banners = useActiveBannerAds();
  const allBanners = getBannerAds();
  const transactions = useTransactions();
  const campaigns = useCampaigns();

  const [apiAnalytics, setApiAnalytics] = useState(() => getPromotionsAnalyticsCache());
  const [apiSource, setApiSource] = useState(apiAnalytics ? "api" : "pending");

  // Hydrate mara moja
  useEffect(() => {
    let cancelled = false;
    hydratePromotionsAnalyticsFromApi().then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setApiAnalytics(res.data);
        setApiSource("api");
      } else {
        setApiSource("local");
      }
    });
    return () => { cancelled = true; };
  }, []);

  return useMemo(() => {
    // Kama API ipo — tumia hiyo
    if (apiSource === "api" && apiAnalytics) {
      const normalized = normalizeAnalyticsFromApi(apiAnalytics, listings);
      if (normalized) {
        return {
          ...normalized,
          campaigns,
          allBanners,
        };
      }
    }

    // Fallback: local computation
    const local = computeLocalAnalytics(listings, banners, transactions, campaigns);
    return {
      ...local,
      campaigns,
      allBanners,
    };
  }, [apiAnalytics, apiSource, listings, banners, transactions, campaigns, allBanners, lang]);
}

// ============================================================
// CAMPAIGNS HOOK
// ============================================================
export function useCampaigns() {
  const [campaigns, setCampaigns] = useState(() => getCampaigns());

  useEffect(() => {
    hydrateCampaignsFromApi();
    const sync = () => setCampaigns(getCampaigns());
    window.addEventListener("storage", sync);
    window.addEventListener(CAMPAIGNS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CAMPAIGNS_EVENT, sync);
    };
  }, []);

  return campaigns;
}

export function useActiveCampaigns() {
  const campaigns = useCampaigns();
  const now = Date.now();
  return campaigns.filter((c) => {
    if (!c.active) return false;
    if (c.startDate && new Date(c.startDate).getTime() > now) return false;
    if (c.endDate && new Date(c.endDate).getTime() < now) return false;
    return true;
  });
}

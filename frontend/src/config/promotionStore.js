// ============================================================
// promotionsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Promotions Analytics.
//
// Inachukua data kutoka:
//   - listingsStore (boostExpiresAt, leadingExpiresAt)
//   - bannerAdsStore (banners)
//   - transactionsStore (boost, leading, advertisement fees)
//   - promotionsCampaignsStore (campaigns — itaundwa)
//
// Kama stores nyingine — demo ya front-end pekee. Backend halisi
// ikiwepo, badilisha functions hizi ziite API; hooks (usePromotions)
// hazitahitaji kubadilika.
// ============================================================

import { useMemo, useEffect, useState } from "react";
import { useListings } from "./listingsStore.js";
import { useActiveBannerAds, getBannerAds } from "./bannerAdsStore.js";
import { useTransactions } from "./transactionsStore.js";
import { isBoostActive, isLeadingActive, boostDaysRemaining, leadingDaysRemaining } from "../pages/dashboard/components/shared";

// ============================================================
// CAMPAIGNS STORE (ndani ya promotions)
// ============================================================
const CAMPAIGNS_KEY = "sokomkononi_promotions_campaigns_v1";
const CAMPAIGNS_EVENT = "sokomkononi:campaigns-updated";

export const SEED_CAMPAIGNS = [];

function readCampaigns() {
  if (typeof window === "undefined") return SEED_CAMPAIGNS;
  try {
    const raw = window.localStorage.getItem(CAMPAIGNS_KEY);
    if (!raw) return SEED_CAMPAIGNS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_CAMPAIGNS;
    return parsed;
  } catch {
    return SEED_CAMPAIGNS;
  }
}

function saveCampaigns(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CAMPAIGNS_EVENT));
}

export function getCampaigns() {
  return readCampaigns();
}

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
  const next = [entry, ...readCampaigns()];
  saveCampaigns(next);
  return entry;
}

export function updateCampaign(id, patch) {
  const next = readCampaigns().map((c) =>
    c.id === id ? { ...c, ...patch } : c
  );
  saveCampaigns(next);
  return next;
}

export function removeCampaign(id) {
  const next = readCampaigns().filter((c) => c.id !== id);
  saveCampaigns(next);
  return next;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState(() => readCampaigns());

  useEffect(() => {
    const sync = () => setCampaigns(readCampaigns());
    window.addEventListener("storage", sync);
    window.addEventListener(CAMPAIGNS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CAMPAIGNS_EVENT, sync);
    };
  }, []);

  return campaigns;
}

// ============================================================
// MAIN HOOK — inahesabu promotions analytics
// ============================================================
export function usePromotions(lang = "sw") {
  const listings = useListings();
  const banners = useActiveBannerAds();
  const allBanners = getBannerAds();
  const transactions = useTransactions();
  const campaigns = useCampaigns();

  return useMemo(() => {
    // ============================================================
    // 1. BOOSTED LISTINGS
    // ============================================================
    const boostedListings = listings
      .filter((l) => isBoostActive(l))
      .map((l) => ({
        ...l,
        promotionType: "boost",
        daysRemaining: boostDaysRemaining(l),
        expiresAt: l.boostExpiresAt,
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    // ============================================================
    // 2. LEADING LISTINGS
    // ============================================================
    const leadingListings = listings
      .filter((l) => isLeadingActive(l))
      .map((l) => ({
        ...l,
        promotionType: "leading",
        daysRemaining: leadingDaysRemaining(l),
        expiresAt: l.leadingExpiresAt,
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    // ============================================================
    // 3. ADVERTISED LISTINGS (active banners)
    // ============================================================
    const advertisedListings = banners
      .map((banner) => {
        const listing = listings.find((l) => l.id === banner.listingId);
        if (!listing) return null;
        const daysRemaining = banner.expiresAt
          ? Math.max(
              0,
              Math.ceil(
                (new Date(banner.expiresAt).getTime() - Date.now()) / 86400000
              )
            )
          : 0;
        return {
          ...listing,
          promotionType: "advertise",
          banner,
          daysRemaining,
          expiresAt: banner.expiresAt,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    // ============================================================
    // 4. REVENUE PER TYPE
    // ============================================================
    const FEE_TYPES = {
      boost: transactions.filter(
        (t) => t.status === "completed" && t.type === "boost"
      ),
      leading: transactions.filter(
        (t) => t.status === "completed" && t.type === "leading"
      ),
      advertise: transactions.filter(
        (t) => t.status === "completed" && t.type === "advertisement"
      ),
    };

    const revenueByType = {
      boost: FEE_TYPES.boost.reduce((s, t) => s + (t.amount || 0), 0),
      leading: FEE_TYPES.leading.reduce((s, t) => s + (t.amount || 0), 0),
      advertise: FEE_TYPES.advertise.reduce((s, t) => s + (t.amount || 0), 0),
    };

    const totalPromotionRevenue =
      revenueByType.boost + revenueByType.leading + revenueByType.advertise;

    // ============================================================
    // 5. COUNTS
    // ============================================================
    const counts = {
      boosted: boostedListings.length,
      leading: leadingListings.length,
      advertised: advertisedListings.length,
      campaigns: campaigns.length,
      totalActive:
        boostedListings.length +
        leadingListings.length +
        advertisedListings.length,
    };

    // ============================================================
    // 6. MOST PROMOTED SELLERS
    // ============================================================
    const sellerPromotions = {};
    [...boostedListings, ...leadingListings, ...advertisedListings].forEach(
      (l) => {
        const seller = l.seller_name || l.seller || "Unknown";
        if (!sellerPromotions[seller]) {
          sellerPromotions[seller] = {
            name: seller,
            boosts: 0,
            leads: 0,
            ads: 0,
            total: 0,
          };
        }
        sellerPromotions[seller].total += 1;
        if (l.promotionType === "boost") sellerPromotions[seller].boosts += 1;
        if (l.promotionType === "leading") sellerPromotions[seller].leads += 1;
        if (l.promotionType === "advertise") sellerPromotions[seller].ads += 1;
      }
    );

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
      campaigns,
      allBanners,
    };
  }, [listings, banners, transactions, campaigns, lang]);
}

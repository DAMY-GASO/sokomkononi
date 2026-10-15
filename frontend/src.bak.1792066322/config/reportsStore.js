// ============================================================
// reportsStore.js
// Backend: GET /api/finance/reports/   (Admin)
// Inarudisha camelCase: totalUsers, totalSellers, usersGrowth, n.k.
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const KEY = "sokomkononi_reports_cache_v2";
const EV = "sokomkononi:reports-updated";

const EMPTY = {
  totalUsers: 0,
  totalSellers: 0,
  totalBuyers: 0,
  totalListings: 0,
  liveListings: 0,
  soldListings: 0,
  totalDeals: 0,
  completedDeals: 0,
  disputedDeals: 0,
  totalRevenue: 0,
  conversionRate: 0,
  usersGrowth: [],
  listingsGrowth: [],
  revenueByMonth: [],
  dealsByStatus: {
    negotiating: 0,
    accepted: 0,
    reserved: 0,
    completed: 0,
    disputed: 0,
    cancelled: 0,
  },
  topSellers: [],
  mostViewedListings: [],
  topCategories: [],
  topLocations: [],
  source: "empty",
};

function read() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function write(d) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(d));
  window.dispatchEvent(new Event(EV));
}

// ── Tolerant helpers ────────────────────────────────────────
function pickNum(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] != null) return Number(obj[k]) || 0;
  }
  return 0;
}
function pickArr(obj, ...keys) {
  for (const k of keys) {
    if (obj && Array.isArray(obj[k])) return obj[k];
  }
  return [];
}

// ── Normalize camelCase kutoka backend ──────────────────────
function buildFromApi(raw) {
  const src = raw || {};
  const overview = src.overview || src.summary || src;

  return {
    totalUsers: pickNum(overview, "totalUsers", "total_users", "users"),
    totalSellers: pickNum(overview, "totalSellers", "total_sellers", "sellers"),
    totalBuyers: pickNum(overview, "totalBuyers", "total_buyers", "buyers"),
    totalListings: pickNum(overview, "totalListings", "total_listings", "listings"),
    liveListings: pickNum(overview, "liveListings", "live_listings"),
    soldListings: pickNum(overview, "soldListings", "sold_listings"),
    totalDeals: pickNum(overview, "totalDeals", "total_deals", "deals"),
    completedDeals: pickNum(overview, "completedDeals", "completed_deals"),
    disputedDeals: pickNum(overview, "disputedDeals", "disputed_deals"),
    totalRevenue: pickNum(overview, "totalRevenue", "total_revenue", "revenue"),
    conversionRate: pickNum(overview, "conversionRate", "conversion_rate"),

    usersGrowth: pickArr(src, "usersGrowth", "users_growth").map((d) => ({
      date: d.date || d.day || d.label,
      label: d.label || d.date || d.day || "",
      count: Number(d.count) || 0,
      cumulative: Number(d.cumulative ?? d.total ?? 0) || 0,
    })),

    listingsGrowth: pickArr(src, "listingsGrowth", "listings_growth").map((d) => ({
      date: d.date || d.day || d.label,
      label: d.label || d.date || d.day || "",
      count: Number(d.count) || 0,
    })),

    revenueByMonth: pickArr(src, "revenueByMonth", "revenue_by_month").map((d) => ({
      date: d.date || d.month || d.label,
      label: d.label || d.month || "",
      total: Number(d.total ?? d.revenue) || 0,
    })),

    dealsByStatus: {
      negotiating: pickNum(
        src.dealsByStatus || src.deals_by_status,
        "negotiating"
      ),
      accepted: pickNum(src.dealsByStatus || src.deals_by_status, "accepted"),
      reserved: pickNum(src.dealsByStatus || src.deals_by_status, "reserved"),
      completed: pickNum(src.dealsByStatus || src.deals_by_status, "completed"),
      disputed: pickNum(src.dealsByStatus || src.deals_by_status, "disputed"),
      cancelled: pickNum(src.dealsByStatus || src.deals_by_status, "cancelled"),
    },

    topSellers: pickArr(src, "topSellers", "top_sellers").map((s) => ({
      name: s.name || s.seller_name || "—",
      listings: Number(s.listings) || 0,
      views: Number(s.views) || 0,
    })),

    mostViewedListings: pickArr(
      src,
      "mostViewedListings",
      "most_viewed_listings"
    ).map((l) => ({
      id: l.id,
      title: l.title || "—",
      views: Number(l.views) || 0,
      price: Number(l.price) || 0,
    })),

    topCategories: pickArr(src, "topCategories", "top_categories").map((c) => ({
      key: c.key || c.category__slug || "—",
      name: c.name || c.category__name || "—",
      count: Number(c.count) || 0,
      views: Number(c.views) || 0,
    })),

    topLocations: pickArr(src, "topLocations", "top_locations").map((l) => ({
      name: l.name || l.location || "—",
      count: Number(l.count) || 0,
      views: Number(l.views) || 0,
    })),

    source: "api",
  };
}

export async function hydrateReportsFromApi() {
  try {
    const raw = await api.get("/finance/reports/");
    console.info("[reportsStore] /finance/reports/ keys:", Object.keys(raw || {}), raw);
    const data = buildFromApi(raw);
    write(data);
    return { ok: true, data };
  } catch (err) {
    console.warn(
      "[reportsStore] /finance/reports/ failed:",
      err?.status,
      err?.message
    );
    return { ok: false, error: err };
  }
}

export function getReportsCache() {
  return read();
}
export function clearReportsCache() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EV));
}

export function useReports() {
  const [data, setData] = useState(() => read() || EMPTY);
  useEffect(() => {
    hydrateReportsFromApi().then((r) => {
      if (r.ok && r.data) setData(r.data);
      else setData(read() || EMPTY);
    });
    const sync = () => setData(read() || EMPTY);
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return data;
}

export async function refreshReports() {
  return hydrateReportsFromApi();
}
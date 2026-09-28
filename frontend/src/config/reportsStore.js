// ============================================================
// reportsStore.js
// Backend reality: the only reports endpoint is
//   GET /api/finance/reports/   (Staff)
// The old /admin/reports/* endpoints don't exist — they 404'd.
// This version fetches the one endpoint and maps whatever fields
// come back into the shape ReportsSection expects. Missing fields
// default to 0 / empty arrays, so the UI shows "no data yet"
// instead of crashing.
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const KEY = "sokomkononi_reports_cache_v1";
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

// Tolerant normalizer — reads any of the common field names.
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

function buildFromApi(raw) {
  const src = raw || {};
  const overview = src.overview || src.summary || src || {};

  return {
    totalUsers: pickNum(overview, "total_users", "totalUsers", "users"),
    totalSellers: pickNum(overview, "total_sellers", "totalSellers", "sellers"),
    totalBuyers: pickNum(overview, "total_buyers", "totalBuyers", "buyers"),
    totalListings: pickNum(overview, "total_listings", "totalListings", "listings"),
    liveListings: pickNum(overview, "live_listings", "liveListings"),
    soldListings: pickNum(overview, "sold_listings", "soldListings"),
    totalDeals: pickNum(overview, "total_deals", "totalDeals", "deals"),
    completedDeals: pickNum(overview, "completed_deals", "completedDeals"),
    disputedDeals: pickNum(overview, "disputed_deals", "disputedDeals"),
    totalRevenue: pickNum(overview, "total_revenue", "totalRevenue", "revenue"),
    conversionRate: pickNum(overview, "conversion_rate", "conversionRate"),

    usersGrowth: pickArr(src, "users_growth", "usersGrowth").map((d) => ({
      date: d.date || d.day,
      label: d.label || d.date || d.day || "",
      count: d.count ?? 0,
      cumulative: d.cumulative ?? d.total ?? 0,
    })),
    listingsGrowth: pickArr(src, "listings_growth", "listingsGrowth").map((d) => ({
      date: d.date || d.day,
      label: d.label || d.date || d.day || "",
      count: d.count ?? 0,
    })),
    revenueByMonth: pickArr(src, "revenue_by_month", "revenueByMonth").map((d) => ({
      date: d.date || d.month,
      label: d.label || d.month || "",
      total: Number(d.total ?? d.revenue) || 0,
    })),
    dealsByStatus: {
      negotiating: pickNum(src.deals_by_status || src.dealsByStatus, "negotiating"),
      accepted: pickNum(src.deals_by_status || src.dealsByStatus, "accepted"),
      reserved: pickNum(src.deals_by_status || src.dealsByStatus, "reserved"),
      completed: pickNum(src.deals_by_status || src.dealsByStatus, "completed"),
      disputed: pickNum(src.deals_by_status || src.dealsByStatus, "disputed"),
      cancelled: pickNum(src.deals_by_status || src.dealsByStatus, "cancelled"),
    },
    topSellers: pickArr(src, "top_sellers", "topSellers"),
    mostViewedListings: pickArr(src, "most_viewed_listings", "mostViewedListings"),
    topCategories: pickArr(src, "top_categories", "topCategories"),
    topLocations: pickArr(src, "top_locations", "topLocations"),
    source: "api",
  };
}

export async function hydrateReportsFromApi() {
  try {
    const raw = await api.get("/finance/reports/");
    const data = buildFromApi(raw);
    write(data);
    return { ok: true, data };
  } catch (err) {
    console.warn("[reportsStore] /finance/reports/ failed:", err?.status, err?.message);
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

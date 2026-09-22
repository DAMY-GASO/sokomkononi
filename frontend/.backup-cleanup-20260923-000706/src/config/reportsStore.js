// ============================================================
// reportsStore.js — API-only via /api/admin/reports/
// No local computation fallback. If backend fails, we show empty.
// ============================================================
import { useEffect, useState } from "react";
import { reportsApi } from "../api/reports.js";

const KEY = "sokomkononi_reports_cache_v1";
const EV = "sokomkononi:reports-updated";

const EMPTY = {
  totalUsers: 0, totalSellers: 0, totalBuyers: 0,
  totalListings: 0, liveListings: 0, soldListings: 0,
  totalDeals: 0, completedDeals: 0, disputedDeals: 0,
  totalRevenue: 0, conversionRate: 0,
  usersGrowth: [], listingsGrowth: [], revenueByMonth: [],
  dealsByStatus: { negotiating: 0, accepted: 0, reserved: 0, completed: 0, disputed: 0, cancelled: 0 },
  topSellers: [], mostViewedListings: [], topCategories: [], topLocations: [],
  source: "empty",
};

function read() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function write(d) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(d));
  window.dispatchEvent(new Event(EV));
}

function buildFromApi({ overview, usersGrowth, listingsGrowth, revenueByMonth, dealsStatus, topSellers, mostViewedListings, topCategories, topLocations, conversionRate }) {
  return {
    totalUsers: overview?.totalUsers ?? overview?.total_users ?? 0,
    totalSellers: overview?.totalSellers ?? overview?.total_sellers ?? 0,
    totalBuyers: overview?.totalBuyers ?? overview?.total_buyers ?? 0,
    totalListings: overview?.totalListings ?? overview?.total_listings ?? 0,
    liveListings: overview?.liveListings ?? overview?.live_listings ?? 0,
    soldListings: overview?.soldListings ?? overview?.sold_listings ?? 0,
    totalDeals: overview?.totalDeals ?? overview?.total_deals ?? 0,
    completedDeals: overview?.completedDeals ?? overview?.completed_deals ?? 0,
    disputedDeals: overview?.disputedDeals ?? overview?.disputed_deals ?? 0,
    totalRevenue: Number(overview?.totalRevenue ?? overview?.total_revenue) || 0,
    conversionRate: Number(conversionRate?.rate ?? overview?.conversionRate) || 0,
    usersGrowth: (usersGrowth?.data || usersGrowth?.results || usersGrowth || []).map((d) => ({
      date: d.date, label: d.label || d.date, count: d.count ?? 0, cumulative: d.cumulative ?? d.total ?? 0,
    })),
    listingsGrowth: (listingsGrowth?.data || listingsGrowth?.results || listingsGrowth || []).map((d) => ({
      date: d.date, label: d.label || d.date, count: d.count ?? 0,
    })),
    revenueByMonth: (revenueByMonth?.data || revenueByMonth?.results || revenueByMonth || []).map((d) => ({
      date: d.date || d.month, label: d.label || d.month, total: Number(d.total ?? d.revenue) || 0,
    })),
    dealsByStatus: dealsStatus || EMPTY.dealsByStatus,
    topSellers: topSellers?.data || topSellers?.results || topSellers || [],
    mostViewedListings: mostViewedListings?.data || mostViewedListings?.results || mostViewedListings || [],
    topCategories: topCategories?.data || topCategories?.results || topCategories || [],
    topLocations: topLocations?.data || topLocations?.results || topLocations || [],
    source: "api",
  };
}

export async function hydrateReportsFromApi() {
  try {
    const [overview, ug, lg, rm, ds, ts, mvl, tc, tl, cr] = await Promise.all([
      reportsApi.overview().catch(() => null),
      reportsApi.usersGrowth(30).catch(() => null),
      reportsApi.listingsGrowth(30).catch(() => null),
      reportsApi.revenueByMonth(6).catch(() => null),
      reportsApi.dealsStatus().catch(() => null),
      reportsApi.topSellers(5).catch(() => null),
      reportsApi.mostViewedListings(5).catch(() => null),
      reportsApi.topCategories(5).catch(() => null),
      reportsApi.topLocations(5).catch(() => null),
      reportsApi.conversionRate().catch(() => null),
    ]);
    if (!overview) return { ok: false, error: new Error("overview unavailable") };
    const data = buildFromApi({
      overview, usersGrowth: ug, listingsGrowth: lg, revenueByMonth: rm,
      dealsStatus: ds, topSellers: ts, mostViewedListings: mvl,
      topCategories: tc, topLocations: tl, conversionRate: cr,
    });
    write(data);
    return { ok: true, data };
  } catch (err) { return { ok: false, error: err }; }
}

export function getReportsCache() { return read(); }
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

export async function refreshReports() { return hydrateReportsFromApi(); }

// ============================================================
// reportsStore.js
// CHANZO KIKUU: /api/admin/reports/
// Fallback: local computation kutoka stores nyingine.
// ============================================================

import { useEffect, useState, useMemo } from "react";
import { reportsApi } from "../api/reports.js";
import { useListings } from "./listingsStore.js";
import { useUsers } from "./usersStore.js";
import { useDeals } from "./dealsStore.js";
import { useTransactions } from "./transactionsStore.js";

const STORAGE_KEY = "sokomkononi_reports_cache_v1";
const UPDATE_EVENT = "sokomkononi:reports-updated";

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(UPDATE_EVENT));
  } catch {
    // ignore quota errors
  }
}

// ============================================================
// DATE HELPERS (kwa fallback)
// ============================================================
function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatDayLabel(date, lang) {
  const d = new Date(date);
  const monthsSw = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ago", "Sep", "Okt", "Nov", "Des"];
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const months = lang === "sw" ? monthsSw : monthsEn;
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// ============================================================
// LOCAL FALLBACK COMPUTATION
// ============================================================
function computeLocalReports(listings, users, deals, transactions, lang = "sw") {
  const totalUsers = users.length;
  const totalSellers = users.filter((u) => u.role?.toLowerCase() === "seller").length;
  const totalBuyers = users.filter((u) => u.role?.toLowerCase() === "buyer").length;

  const totalListings = listings.length;
  const liveListings = listings.filter((l) => l.status === "live").length;
  const soldListings = listings.filter((l) => l.status === "sold").length;

  const totalDeals = deals.length;
  const completedDeals = deals.filter((d) => d.status === "completed").length;
  const disputedDeals = deals.filter((d) => d.status === "disputed").length;

  const FEE_TYPES = ["listing_fee", "reservation", "boost", "leading", "advertisement"];
  const totalRevenue = transactions
    .filter((t) => t.status === "completed" && FEE_TYPES.includes(t.type))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const days30 = getLastNDays(30);

  const usersGrowth = days30.map((day) => {
    const key = dayKey(day);
    const count = users.filter((u) => u.joined && u.joined.startsWith(key)).length;
    return { date: day, label: formatDayLabel(day, lang), count };
  });
  let cumulative = 0;
  const usersCumulative = usersGrowth.map((d) => {
    cumulative += d.count;
    return { ...d, cumulative };
  });

  const listingsGrowth = days30.map((day) => {
    const key = dayKey(day);
    const count = listings.filter((l) => l.postedAt && l.postedAt.startsWith(key)).length;
    return { date: day, label: formatDayLabel(day, lang), count };
  });

  const months6 = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    months6.push(d);
  }

  const revenueByMonth = months6.map((month) => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const total = transactions
      .filter((t) => {
        if (t.status !== "completed" || !FEE_TYPES.includes(t.type)) return false;
        const tDate = new Date(t.at);
        return tDate.getFullYear() === year && tDate.getMonth() === m;
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { date: month, label: formatDayLabel(month, lang), total };
  });

  const dealsByStatus = {
    negotiating: deals.filter((d) => d.status === "negotiating").length,
    accepted: deals.filter((d) => d.status === "accepted").length,
    reserved: deals.filter((d) => d.status === "reserved").length,
    completed: completedDeals,
    disputed: disputedDeals,
    cancelled: deals.filter((d) => d.status === "cancelled").length,
  };

  const sellerStats = {};
  listings.forEach((l) => {
    const sellerName = l.seller_name || l.seller || "Unknown";
    if (!sellerStats[sellerName]) {
      sellerStats[sellerName] = { name: sellerName, listings: 0, views: 0, inquiries: 0 };
    }
    sellerStats[sellerName].listings += 1;
    sellerStats[sellerName].views += l.views || 0;
    sellerStats[sellerName].inquiries += l.inquiries || 0;
  });
  const topSellers = Object.values(sellerStats).sort((a, b) => b.views - a.views).slice(0, 5);

  const mostViewedListings = [...listings]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const categoryStats = {};
  listings.forEach((l) => {
    const cat = l.category || "other";
    if (!categoryStats[cat]) categoryStats[cat] = { key: cat, count: 0, views: 0 };
    categoryStats[cat].count += 1;
    categoryStats[cat].views += l.views || 0;
  });
  const topCategories = Object.values(categoryStats).sort((a, b) => b.views - a.views).slice(0, 5);

  const locationStats = {};
  listings.forEach((l) => {
    const loc = l.region || l.location || "Unknown";
    if (!locationStats[loc]) locationStats[loc] = { name: loc, count: 0, views: 0 };
    locationStats[loc].count += 1;
    locationStats[loc].views += l.views || 0;
  });
  const topLocations = Object.values(locationStats).sort((a, b) => b.views - a.views).slice(0, 5);

  const conversionRate = totalListings > 0 ? (soldListings / totalListings) * 100 : 0;

  return {
    totalUsers,
    totalSellers,
    totalBuyers,
    totalListings,
    liveListings,
    soldListings,
    totalDeals,
    completedDeals,
    disputedDeals,
    totalRevenue,
    conversionRate,
    usersGrowth: usersCumulative,
    listingsGrowth,
    revenueByMonth,
    dealsByStatus,
    topSellers,
    mostViewedListings,
    topCategories,
    topLocations,
    source: "local",
  };
}

// ============================================================
// API NORMALIZER
// ============================================================
function buildFromApiResponses({
  overview,
  usersGrowth,
  listingsGrowth,
  revenueByMonth,
  dealsStatus,
  topSellers,
  mostViewedListings,
  topCategories,
  topLocations,
  conversionRate,
}) {
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
    totalRevenue: overview?.totalRevenue ?? overview?.total_revenue ?? 0,
    conversionRate: conversionRate?.rate ?? overview?.conversionRate ?? 0,

    usersGrowth: (usersGrowth?.data || usersGrowth || []).map((d) => ({
      date: d.date,
      label: d.label || d.date,
      count: d.count ?? 0,
      cumulative: d.cumulative ?? d.total ?? 0,
    })),

    listingsGrowth: (listingsGrowth?.data || listingsGrowth || []).map((d) => ({
      date: d.date,
      label: d.label || d.date,
      count: d.count ?? 0,
    })),

    revenueByMonth: (revenueByMonth?.data || revenueByMonth || []).map((d) => ({
      date: d.date || d.month,
      label: d.label || d.month,
      total: d.total ?? d.revenue ?? 0,
    })),

    dealsByStatus: dealsStatus || {
      negotiating: 0, accepted: 0, reserved: 0, completed: 0, disputed: 0, cancelled: 0,
    },

    topSellers: topSellers?.data || topSellers || [],
    mostViewedListings: mostViewedListings?.data || mostViewedListings || [],
    topCategories: topCategories?.data || topCategories || [],
    topLocations: topLocations?.data || topLocations || [],
    source: "api",
  };
}

// ============================================================
// HYDRATE (fetch zote kwa pamoja)
// ============================================================
export async function hydrateReportsFromApi() {
  try {
    // Ruka kama hakuna auth token
    const token = typeof window !== "undefined" ? window.localStorage.getItem("sokomkononi_access") : null;
    if (!token) {
      return { ok: false, source: "no-auth", error: new Error("Hakuna token") };
    }

    const [
      overview,
      usersGrowth,
      listingsGrowth,
      revenueByMonth,
      dealsStatus,
      topSellers,
      mostViewedListings,
      topCategories,
      topLocations,
      conversionRate,
    ] = await Promise.all([
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

    // Kama overview pekee ndiyo iliyofanikiwa — tumia fallback
    if (!overview) {
      return { ok: false, source: "partial", error: new Error("Overview haipatikani") };
    }

    const data = buildFromApiResponses({
      overview, usersGrowth, listingsGrowth, revenueByMonth, dealsStatus,
      topSellers, mostViewedListings, topCategories, topLocations, conversionRate,
    });

    saveToStorage(data);
    return { ok: true, source: "api", data };
  } catch (err) {
    console.warn("[reportsStore] hydrate failed:", err);
    return { ok: false, source: "error", error: err };
  }
}

export function getReportsCache() {
  return readFromStorage();
}

export function clearReportsCache() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// MAIN HOOK
// ============================================================
export function useReports(lang = "sw") {
  const listings = useListings();
  const users = useUsers();
  const deals = useDeals();
  const transactions = useTransactions();

  const [apiData, setApiData] = useState(() => getReportsCache());
  const [source, setSource] = useState(apiData ? "api" : "pending");

  useEffect(() => {
    let cancelled = false;
    hydrateReportsFromApi().then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setApiData(res.data);
        setSource("api");
      } else {
        setSource("local");
      }
    });
    return () => { cancelled = true; };
  }, []);

  return useMemo(() => {
    if (source === "api" && apiData) {
      return apiData;
    }
    return computeLocalReports(listings, users, deals, transactions, lang);
  }, [apiData, source, listings, users, deals, transactions, lang]);
}

// ============================================================
// MANUAL REFRESH
// ============================================================
export async function refreshReports() {
  const res = await hydrateReportsFromApi();
  return res;
}

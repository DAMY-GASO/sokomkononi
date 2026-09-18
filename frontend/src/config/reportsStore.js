// ============================================================
// reportsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Reports & Analytics.
//
// Inahesabu aggregates kutoka:
//   - listingsStore (listings, views, categories)
//   - usersStore (users, sellers, buyers)
//   - dealsStore (deals, completed, disputed)
//   - transactionsStore (revenue)
//
// Kama stores nyingine — demo ya front-end pekee. Backend halisi
// ikiwepo, badilisha functions hizi ziite API; hooks (useReports)
// hazitahitaji kubadilika.
// ============================================================

import { useMemo } from "react";
import { useListings } from "./listingsStore.js";
import { useUsers } from "./usersStore.js";
import { useDeals } from "./dealsStore.js";
import { useTransactions } from "./transactionsStore.js";

// ============================================================
// DATE HELPERS
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
// MAIN HOOK — inahesabu kila kitu
// ============================================================
export function useReports(lang = "sw") {
  const listings = useListings();
  const users = useUsers();
  const deals = useDeals();
  const transactions = useTransactions();

  return useMemo(() => {
    // ============================================================
    // 1. STATS OVERVIEW
    // ============================================================
    const totalUsers = users.length;
    const totalSellers = users.filter(
      (u) => u.role?.toLowerCase() === "seller"
    ).length;
    const totalBuyers = users.filter(
      (u) => u.role?.toLowerCase() === "buyer"
    ).length;

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

    // ============================================================
    // 2. USERS GROWTH (siku 30 zilizopita)
    // ============================================================
    const days30 = getLastNDays(30);
    const usersGrowth = days30.map((day) => {
      const key = dayKey(day);
      const count = users.filter((u) => u.joined && u.joined.startsWith(key)).length;
      return {
        date: day,
        label: formatDayLabel(day, lang),
        count,
      };
    });

    // Cumulative users growth
    let cumulative = 0;
    const usersCumulative = usersGrowth.map((d) => {
      cumulative += d.count;
      return { ...d, cumulative };
    });

    // ============================================================
    // 3. LISTINGS GROWTH (siku 30 zilizopita)
    // ============================================================
    const listingsGrowth = days30.map((day) => {
      const key = dayKey(day);
      const count = listings.filter(
        (l) => l.postedAt && l.postedAt.startsWith(key)
      ).length;
      return {
        date: day,
        label: formatDayLabel(day, lang),
        count,
      };
    });

    // ============================================================
    // 4. REVENUE BY MONTH (miezi 6 iliyopita)
    // ============================================================
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
      return {
        date: month,
        label: formatDayLabel(month, lang),
        total,
      };
    });

    // ============================================================
    // 5. DEALS STATUS BREAKDOWN
    // ============================================================
    const dealsByStatus = {
      negotiating: deals.filter((d) => d.status === "negotiating").length,
      accepted: deals.filter((d) => d.status === "accepted").length,
      reserved: deals.filter((d) => d.status === "reserved").length,
      completed: completedDeals,
      disputed: disputedDeals,
      cancelled: deals.filter((d) => d.status === "cancelled").length,
    };

    // ============================================================
    // 6. TOP SELLERS (kwa listings + views)
    // ============================================================
    const sellerStats = {};
    listings.forEach((l) => {
      const sellerName = l.seller_name || l.seller || "Unknown";
      if (!sellerStats[sellerName]) {
        sellerStats[sellerName] = {
          name: sellerName,
          listings: 0,
          views: 0,
          inquiries: 0,
        };
      }
      sellerStats[sellerName].listings += 1;
      sellerStats[sellerName].views += l.views || 0;
      sellerStats[sellerName].inquiries += l.inquiries || 0;
    });

    const topSellers = Object.values(sellerStats)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // ============================================================
    // 7. MOST VIEWED LISTINGS
    // ============================================================
    const mostViewedListings = [...listings]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    // ============================================================
    // 8. MOST SEARCHED CATEGORIES (by listing count)
    // ============================================================
    const categoryStats = {};
    listings.forEach((l) => {
      const cat = l.category || "other";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { key: cat, count: 0, views: 0 };
      }
      categoryStats[cat].count += 1;
      categoryStats[cat].views += l.views || 0;
    });

    const topCategories = Object.values(categoryStats)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // ============================================================
    // 9. MOST ACTIVE LOCATIONS (by listing count)
    // ============================================================
    const locationStats = {};
    listings.forEach((l) => {
      const loc = l.region || l.location || "Unknown";
      if (!locationStats[loc]) {
        locationStats[loc] = { name: loc, count: 0, views: 0 };
      }
      locationStats[loc].count += 1;
      locationStats[loc].views += l.views || 0;
    });

    const topLocations = Object.values(locationStats)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // ============================================================
    // 10. CONVERSION RATE
    // ============================================================
    const conversionRate =
      totalListings > 0 ? (soldListings / totalListings) * 100 : 0;

    return {
      // Stats
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

      // Growth
      usersGrowth: usersCumulative,
      listingsGrowth,
      revenueByMonth,
      dealsByStatus,

      // Top lists
      topSellers,
      mostViewedListings,
      topCategories,
      topLocations,
    };
  }, [listings, users, deals, transactions, lang]);
}

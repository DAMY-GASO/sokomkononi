// ============================================================
// OverviewSection.jsx
// Muhtasari wa mfumo — stats + live transactions.
// Total Revenue kadi kubwa — span 5 columns kwenye desktop,
// full width kwenye simu.
// Rangi: maandishi yote yanaonekana kwenye dark background.
// ============================================================
import React, { useMemo, useEffect, useState } from "react";
import {
  Users,
  Home,
  ShoppingBag,
  Wallet,
  Clock,
  ArrowRight,
  UserCheck,
  Store,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { COLORS } from "../shared/constants.js";
import StatCard from "../shared/StatCard.jsx";
import SectionHeader from "../shared/SectionHeader.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useUsers } from "../../../../config/usersStore.js";
import {
  useListings,
  fetchPendingListingsAsync,
} from "../../../../config/listingsStore.js";
import { useDeals } from "../../../../config/dealsStore.js";
import { useTransactions } from "../../../../config/transactionsStore.js";
import { financeApi } from "../../../../api/finance.js";

// ⬇️ Ongeza "success_fee" kwenye orodha
const PLATFORM_FEE_TYPES = [
  "listing_fee",
  "reservation",
  "boost",
  "leading",
  "advertisement",
  "success_fee",
];
const NEW_REGISTRATION_WINDOW_DAYS = 7;

export default function OverviewSection({ onNavigate }) {
  const { lang } = useLanguage();
  const users = useUsers();
  const listings = useListings();
  const deals = useDeals();
  const transactions = useTransactions();

  const [platformRevenue, setPlatformRevenue] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    financeApi
      .dashboard("all")
      .then((data) => {
        if (cancelled) return;
        const rev =
          data?.total_revenue ??
          data?.revenue?.total ??
          data?.totalRevenue ??
          null;
        if (rev != null) setPlatformRevenue(Number(rev) || 0);
      })
      .catch(() => {
        /* fallback to local sum below */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetchPendingListingsAsync().then((res) => {
      if (res.ok) setPendingCount((res.listings || []).length);
    });
  }, []);

  const totalUsers = users.length;
  const activeBuyers = useMemo(
    () =>
      users.filter((u) => u.role === "Buyer" && u.status !== "suspended").length,
    [users]
  );
  const activeSellers = useMemo(
    () =>
      users.filter((u) => u.role === "Seller" && u.status !== "suspended").length,
    [users]
  );

  const newRegistrations = useMemo(() => {
    const cutoff = Date.now() - NEW_REGISTRATION_WINDOW_DAYS * 86400000;
    return users.filter((u) => {
      const t = new Date(u.joined).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    }).length;
  }, [users]);

  const totalListings = listings.length;

  const localRevenue = useMemo(
    () =>
      transactions
        .filter(
          (t) =>
            t.status === "completed" && PLATFORM_FEE_TYPES.includes(t.type)
        )
        .reduce((s, t) => s + (t.amount || 0), 0),
    [transactions]
  );
  const revenueIsPlatformWide = platformRevenue != null;
  const totalRevenue = revenueIsPlatformWide ? platformRevenue : localRevenue;

  const pendingPayments = useMemo(
    () => transactions.filter((t) => t.status === "pending").length,
    [transactions]
  );

  const activeDeals = useMemo(
    () =>
      deals.filter((d) =>
        [
          "negotiating",
          "offer_sent",
          "accepted",
          "reserved",
          "awaiting_final_payment",
          "payment_proof_submitted",
          "disputed",
        ].includes(d.status)
      ),
    [deals]
  );
  const completedDeals = useMemo(
    () => deals.filter((d) => d.status === "completed").length,
    [deals]
  );
  const disputes = useMemo(
    () => deals.filter((d) => d.status === "disputed").length,
    [deals]
  );

  const formatTZS = (amount) =>
    "TZS " + Math.round(amount || 0).toLocaleString("en-US");

  const revenueByDay = useMemo(() => {
    const days = [];
    for (let i = NEW_REGISTRATION_WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-US", {
          weekday: "short",
        }),
        total: 0,
      });
    }
    const byKey = Object.fromEntries(days.map((d) => [d.key, d]));
    transactions.forEach((t) => {
      if (t.status !== "completed" || !PLATFORM_FEE_TYPES.includes(t.type)) return;
      const tDate = new Date(t.at);
      if (Number.isNaN(tDate.getTime())) return;
      const key = tDate.toISOString().slice(0, 10);
      if (byKey[key]) byKey[key].total += t.amount || 0;
    });
    return days;
  }, [transactions, lang]);

  const maxDayRevenue = Math.max(...revenueByDay.map((d) => d.total), 1);

  const stats = [
    {
      id: "users",
      label: lang === "sw" ? "Watumiaji Wote" : "Total Users",
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: COLORS.gold,
    },
    {
      id: "activeBuyers",
      label: lang === "sw" ? "Wanunuzi Hai" : "Active Buyers",
      value: activeBuyers.toLocaleString(),
      icon: UserCheck,
      color: COLORS.green,
    },
    {
      id: "activeSellers",
      label: lang === "sw" ? "Wauzaji Hai" : "Active Sellers",
      value: activeSellers.toLocaleString(),
      icon: Store,
      color: "#2563EB",
    },
    {
      id: "listings",
      label: lang === "sw" ? "Mali Zote" : "Total Listings",
      value: totalListings.toLocaleString(),
      icon: Home,
      color: COLORS.green,
    },
    {
      id: "pendingListings",
      label: lang === "sw" ? "Mali Zinazosubiri" : "Pending Listings",
      value: pendingCount.toLocaleString(),
      icon: ClipboardList,
      color: "#D97706",
    },
    {
      id: "activeDeals",
      label: lang === "sw" ? "Deals Hai" : "Active Deals",
      value: activeDeals.length.toLocaleString(),
      icon: ShoppingBag,
      color: "#2563EB",
    },
    {
      id: "completedDeals",
      label: lang === "sw" ? "Deals Zilizokamilika" : "Completed Deals",
      value: completedDeals.toLocaleString(),
      icon: CheckCircle2,
      color: COLORS.green,
    },
    {
      id: "pendingPayments",
      label: lang === "sw" ? "Malipo Yanayosubiri" : "Pending Payments",
      value: pendingPayments.toLocaleString(),
      icon: CreditCard,
      color: "#D97706",
    },
    {
      id: "disputes",
      label: lang === "sw" ? "Migogoro" : "Disputes",
      value: disputes.toLocaleString(),
      icon: AlertTriangle,
      color: "#DC2626",
    },
    {
      id: "newRegistrations",
      label:
        lang === "sw"
          ? `Usajili Mpya (Siku ${NEW_REGISTRATION_WINDOW_DAYS})`
          : `New Registrations (${NEW_REGISTRATION_WINDOW_DAYS}d)`,
      value: newRegistrations.toLocaleString(),
      icon: UserPlus,
      color: COLORS.gold,
    },
  ];

  return (
    <>
      <SectionHeader
        title={
          lang === "sw" ? "Muhtasari & Uchanganuzi" : "Overview & Analytics"
        }
        subtitle={
          lang === "sw"
            ? "Muhtasari wa mfumo mzima wa SokoMkononi"
            : "Overview of the entire SokoMkononi system"
        }
      />

      {/* Grid ya stats za kawaida */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* Total Revenue — kadi kubwa chini ya grid */}
      <div
        className="rounded-2xl p-5 sm:p-7 lg:p-8 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-8"
        style={{
          background: `linear-gradient(135deg, ${COLORS.night} 0%, #1a2842 100%)`,
          color: "#FFFFFF",
        }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(232,163,61,0.25)" }}
          >
            <Wallet size={28} color={COLORS.gold} />
          </div>
          <div className="min-w-0">
            <p
              className="text-xs sm:text-sm font-semibold uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {lang === "sw" ? "Mapato ya Jumla" : "Total Revenue"}
            </p>
            <p
              className="text-[clamp(1.75rem,6vw,3rem)] font-bold mt-1 break-words leading-tight tabular-nums"
              style={{ color: "#FFFFFF" }}
            >
              {formatTZS(totalRevenue)}
            </p>
            {revenueIsPlatformWide ? (
              <p
                className="text-xs sm:text-sm mt-2"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {lang === "sw"
                  ? "Mapato yote ya jukwaa kutoka vyanzo vyote"
                  : "All platform revenue from every source"}
              </p>
            ) : (
              <p
                className="text-[11px] sm:text-xs mt-2 inline-block px-2 py-0.5 rounded"
                style={{
                  background: "rgba(232,163,61,0.25)",
                  color: "#E8A33D",
                }}
              >
                {lang === "sw"
                  ? "⚠️ Kikokotoo cha jumla hakijapatikana — inaonyesha miamala yako pekee"
                  : "⚠️ Platform total unavailable — showing your transactions only"}
              </p>
            )}
          </div>
        </div>

        {/* Breakdown ya mapato kwa aina — sasa na Success Fee */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 w-full lg:w-auto shrink-0">
          <RevenueBreakdown
            label={lang === "sw" ? "Listing Fee" : "Listing Fee"}
            value={transactions
              .filter((t) => t.type === "listing_fee" && t.status === "completed")
              .reduce((s, t) => s + (t.amount || 0), 0)}
            color={COLORS.gold}
          />
          <RevenueBreakdown
            label={lang === "sw" ? "Reservation" : "Reservation"}
            value={transactions
              .filter(
                (t) => t.type === "reservation" && t.status === "completed"
              )
              .reduce((s, t) => s + (t.amount || 0), 0)}
            color={COLORS.green}
          />
          <RevenueBreakdown
            label={lang === "sw" ? "Boost" : "Boost"}
            value={transactions
              .filter((t) => t.type === "boost" && t.status === "completed")
              .reduce((s, t) => s + (t.amount || 0), 0)}
            color="#2563EB"
          />
          <RevenueBreakdown
            label={lang === "sw" ? "Leading" : "Leading"}
            value={transactions
              .filter((t) => t.type === "leading" && t.status === "completed")
              .reduce((s, t) => s + (t.amount || 0), 0)}
            color="#7C3AED"
          />
          <RevenueBreakdown
            label={lang === "sw" ? "Ads" : "Ads"}
            value={transactions
              .filter(
                (t) => t.type === "advertisement" && t.status === "completed"
              )
              .reduce((s, t) => s + (t.amount || 0), 0)}
            color={COLORS.rust}
          />
          <RevenueBreakdown
            label={lang === "sw" ? "Success Fee" : "Success Fee"}
            value={transactions
              .filter(
                (t) => t.type === "success_fee" && t.status === "completed"
              )
              .reduce((s, t) => s + (t.amount || 0), 0)}
            color="#0891B2"
          />
        </div>
      </div>

      {/* Chart ya mapato ya siku 7 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
        <h3 className="font-semibold text-primary flex items-center gap-2 text-sm sm:text-base mb-4">
          <TrendingUp size={16} color={COLORS.gold} className="shrink-0" />
          {lang === "sw"
            ? "Mapato ya SokoMkononi — Siku 7 Zilizopita"
            : "SokoMkononi Revenue — Last 7 Days"}
        </h3>
        <div className="flex items-end gap-2 sm:gap-3 h-36 sm:h-44">
          {revenueByDay.map((d) => {
            const heightPct = Math.max((d.total / maxDayRevenue) * 100, 2);
            return (
              <div
                key={d.key}
                className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full"
              >
                <span className="text-[9px] sm:text-[10px] text-muted truncate max-w-full">
                  {d.total > 0 ? formatTZS(d.total) : ""}
                </span>
                <div
                  title={formatTZS(d.total)}
                  style={{ height: `${heightPct}%`, background: COLORS.gold }}
                  className="w-full rounded-t-md min-h-[2px]"
                />
                <span className="text-[10px] sm:text-xs text-secondary">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Transactions */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h3 className="font-semibold text-primary flex items-center gap-2 text-sm sm:text-base">
            <Clock size={16} color={COLORS.gold} className="shrink-0" />
            {lang === "sw"
              ? "Live Transactions Zinazoendelea"
              : "Live Transactions in Progress"}
          </h3>
          <button
            onClick={() => onNavigate("deals")}
            className="text-xs font-semibold hover:underline flex items-center gap-1 shrink-0"
            style={{ color: COLORS.gold }}
          >
            {lang === "sw" ? "Nenda Deal Rooms" : "Go to Deal Rooms"}
            <ArrowRight size={12} />
          </button>
        </div>
        {activeDeals.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            {lang === "sw"
              ? "Hakuna deals zinazoendelea kwa sasa."
              : "No active deals right now."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {activeDeals.slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="border rounded-lg px-3 py-3"
                style={{ borderColor: COLORS.sandLine }}
              >
                <div className="sm:hidden">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-semibold text-primary min-w-0 flex-1 line-clamp-2">
                      {d.listingTitle}
                    </p>
                    <div className="shrink-0">
                      <StatusBadge status={d.status} lang={lang} />
                    </div>
                  </div>
                  <p className="text-xs text-secondary truncate mb-2">
                    {d.buyerName} ← → {d.sellerName}
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: COLORS.rust }}
                  >
                    {formatTZS(d.currentOffer ?? d.askingPrice)}
                  </p>
                </div>
                <div className="hidden sm:flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary truncate">
                      {d.listingTitle}
                    </p>
                    <p className="text-xs text-secondary truncate">
                      {d.buyerName} ← → {d.sellerName}
                    </p>
                  </div>
                  <span
                    className="text-sm font-bold shrink-0"
                    style={{ color: COLORS.rust }}
                  >
                    {formatTZS(d.currentOffer ?? d.askingPrice)}
                  </span>
                  <div className="shrink-0">
                    <StatusBadge status={d.status} lang={lang} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// HELPERS
// ============================================================
function RevenueBreakdown({ label, value, color }) {
  return (
    <div className="flex flex-col items-start gap-0.5 min-w-0">
      <span
        className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide"
        style={{ color: color, opacity: 0.85 }}
      >
        {label}
      </span>
      <span
        className="text-sm sm:text-base font-bold whitespace-nowrap tabular-nums"
        style={{ color: "#FFFFFF" }}
      >
        {"TZS " + Math.round(value || 0).toLocaleString("en-US")}
      </span>
    </div>
  );
}
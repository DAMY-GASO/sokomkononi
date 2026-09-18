// ============================================================
// OverviewSection.jsx
// Muhtasari wa mfumo — stats + live transactions.
// Bilingual (Kiswahili + English).
// Mobile-responsive.
// ============================================================

import React, { useMemo } from "react";
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
import { useListings } from "../../../../config/listingsStore.js";
import { useDeals } from "../../../../config/dealsStore.js";
import {
  useTransactions,
  useMyTransactionsAggregate,
} from "../../../../config/transactionsStore.js";

// Fee types zinazohesabika kama "Mapato ya SokoMkononi" (platform revenue),
// kulingana na useMyTransactionsAggregate() kwenye transactionsStore.js —
// tunatumia ufafanuzi uleule hapa kwa graph ili takwimu zilingane.
const PLATFORM_FEE_TYPES = [
  "listing_fee",
  "reservation",
  "boost",
  "leading",
  "advertisement",
];

// Siku ngapi nyuma tuite mtumiaji "new registration".
const NEW_REGISTRATION_WINDOW_DAYS = 7;

export default function OverviewSection({ onNavigate }) {
  const { lang } = useLanguage();
  const users = useUsers();
  const listings = useListings();
  const deals = useDeals();
  const transactions = useTransactions();
  const aggregate = useMyTransactionsAggregate();

  const totalUsers = users.length;

  // Active = si "suspended". Watumiaji wasio na status ya wazi
  // wanahesabiwa kama active (default salama).
  const activeBuyers = useMemo(
    () =>
      users.filter(
        (u) => u.role === "Buyer" && u.status !== "suspended"
      ).length,
    [users]
  );
  const activeSellers = useMemo(
    () =>
      users.filter(
        (u) => u.role === "Seller" && u.status !== "suspended"
      ).length,
    [users]
  );

  // New registrations — kwa kutumia u.joined. Field hii inaonekana
  // UserManagementSection.jsx kama tarehe ya kujiunga, lakini format
  // yake halisi (ISO au maandishi tayari) haijulikani kwa hakika, hivyo
  // tunajaribu ku-parse kwa uangalifu (isNaN check) ili isivunje UI
  // kama format si Date-parseable.
  const newRegistrations = useMemo(() => {
    const cutoff = Date.now() - NEW_REGISTRATION_WINDOW_DAYS * 86400000;
    return users.filter((u) => {
      const t = new Date(u.joined).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    }).length;
  }, [users]);

  const totalListings = listings.length;
  const pendingListings = listings.filter((l) => l.status === "in_review").length;

  const totalRevenue = aggregate.revenue;

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

  // ============================================================
  // GRAPH — mapato ya siku 7 zilizopita (fee types tu, sio
  // mauzo ya seller, ili kulingana na "Mapato ya SokoMkononi").
  // ============================================================
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
      if (t.status !== "completed" || !PLATFORM_FEE_TYPES.includes(t.type)) {
        return;
      }
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
      change: "",
      icon: Users,
      color: COLORS.gold,
    },
    {
      id: "activeBuyers",
      label: lang === "sw" ? "Wanunuzi Hai" : "Active Buyers",
      value: activeBuyers.toLocaleString(),
      change: "",
      icon: UserCheck,
      color: COLORS.green,
    },
    {
      id: "activeSellers",
      label: lang === "sw" ? "Wauzaji Hai" : "Active Sellers",
      value: activeSellers.toLocaleString(),
      change: "",
      icon: Store,
      color: "#2563EB",
    },
    {
      id: "listings",
      label: lang === "sw" ? "Mali Zote" : "Total Listings",
      value: totalListings.toLocaleString(),
      change: "",
      icon: Home,
      color: COLORS.green,
    },
    {
      id: "pendingListings",
      label: lang === "sw" ? "Mali Zinazosubiri" : "Pending Listings",
      value: pendingListings.toLocaleString(),
      change: "",
      icon: ClipboardList,
      color: "#D97706",
    },
    {
      id: "activeDeals",
      label: lang === "sw" ? "Deals Hai" : "Active Deals",
      value: activeDeals.length.toLocaleString(),
      change: "",
      icon: ShoppingBag,
      color: "#2563EB",
    },
    {
      id: "completedDeals",
      label: lang === "sw" ? "Deals Zilizokamilika" : "Completed Deals",
      value: completedDeals.toLocaleString(),
      change: "",
      icon: CheckCircle2,
      color: COLORS.green,
    },
    {
      id: "revenue",
      label: lang === "sw" ? "Mapato ya SokoMkononi" : "SokoMkononi Revenue",
      value: formatTZS(totalRevenue),
      change: "",
      icon: Wallet,
      color: COLORS.rust,
    },
    {
      id: "pendingPayments",
      label: lang === "sw" ? "Malipo Yanayosubiri" : "Pending Payments",
      value: pendingPayments.toLocaleString(),
      change: "",
      icon: CreditCard,
      color: "#D97706",
    },
    {
      id: "disputes",
      label: lang === "sw" ? "Migogoro" : "Disputes",
      value: disputes.toLocaleString(),
      change: "",
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
      change: "",
      icon: UserPlus,
      color: COLORS.gold,
    },
  ];

  return (
    <>
      <SectionHeader
        title={lang === "sw" ? "Muhtasari & Uchanganuzi" : "Overview & Analytics"}
        subtitle={
          lang === "sw"
            ? "Muhtasari wa mfumo mzima wa SokoMkononi"
            : "Overview of the entire SokoMkononi system"
        }
      />

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* REVENUE GRAPH — siku 7 zilizopita */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base mb-4">
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
                <span className="text-[9px] sm:text-[10px] text-gray-400 truncate max-w-full">
                  {d.total > 0 ? formatTZS(d.total) : ""}
                </span>
                <div
                  title={formatTZS(d.total)}
                  style={{ height: `${heightPct}%`, background: COLORS.gold }}
                  className="w-full rounded-t-md min-h-[2px]"
                />
                <span className="text-[10px] sm:text-xs text-gray-500">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* LIVE TRANSACTIONS IN PROGRESS */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
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
          <p className="text-sm text-gray-400 text-center py-6">
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
                {/* ===== MOBILE LAYOUT (sm:hidden) ===== */}
                <div className="sm:hidden">
                  {/* Title + Status */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-semibold text-gray-800 min-w-0 flex-1 line-clamp-2">
                      {d.listingTitle}
                    </p>
                    <div className="shrink-0">
                      <StatusBadge status={d.status} lang={lang} />
                    </div>
                  </div>
                  {/* Buyer ↔ Seller */}
                  <p className="text-xs text-gray-500 truncate mb-2">
                    {d.buyerName} ← → {d.sellerName}
                  </p>
                  {/* Price */}
                  <p
                    className="text-sm font-bold"
                    style={{ color: COLORS.rust }}
                  >
                    {formatTZS(d.currentOffer ?? d.askingPrice)}
                  </p>
                </div>

                {/* ===== DESKTOP LAYOUT (hidden sm:flex) ===== */}
                <div className="hidden sm:flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {d.listingTitle}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
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

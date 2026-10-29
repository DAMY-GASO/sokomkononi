import React, { useMemo, useState, useEffect } from "react";
import {
  Users, Home, ShoppingBag, Wallet,
  UserCheck, Store, ClipboardList, CheckCircle2,
  UserPlus, CreditCard, User, ShieldCheck,
  Banknote, TrendingUp, Tag, Megaphone, Package, Sparkles,
} from "lucide-react";
import { COLORS, formatTZS } from "../shared/constants.js";
import StatCard from "../shared/StatCard.jsx";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useUsers } from "../../../../config/usersStore.js";
import {
  useListings,
  fetchPendingListingsAsync,
} from "../../../../config/listingsStore.js";
import { useDeals } from "../../../../config/dealsStore.js";
import { useTransactions } from "../../../../config/transactionsStore.js";
import { usePlatformRevenue } from "../shared/revenue.js";

const STREAM_META = {
  listing:     { icon: Tag,          color: "#0891B2", labelSw: "Listing Fee",   labelEn: "Listing Fee" },
  reservation: { icon: Store,        color: "#2F6D4F", labelSw: "Reservation",   labelEn: "Reservation" },
  boost:       { icon: Sparkles,     color: "#FEA406", labelSw: "Boost",         labelEn: "Boost" },
  leading:     { icon: TrendingUp,   color: "#7C3AED", labelSw: "Leading",       labelEn: "Leading" },
  advertise:   { icon: Megaphone,    color: "#C1502E", labelSw: "Advertise",     labelEn: "Advertise" },
  success:     { icon: CheckCircle2, color: "#2563EB", labelSw: "Success Fee",   labelEn: "Success Fee" },
  bundle:      { icon: Package,      color: "#DB2777", labelSw: "Bundle",        labelEn: "Bundle" },
};

export default function OverviewSection() {
  const { lang } = useLanguage();
  const users = useUsers();
  const listings = useListings();
  const deals = useDeals();
  const transactions = useTransactions();
  const revenue = usePlatformRevenue("all");

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPendingListingsAsync().then((res) => {
      if (res.ok) setPendingCount((res.listings || []).length);
    });
  }, []);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const userStats = useMemo(() => {
    let sellersOnly = 0, buyersOnly = 0, bothRoles = 0, neitherRole = 0, totalAdmins = 0;
    users.forEach((u) => {
      const role = u.role || "Neither";
      if (role === "Admin") totalAdmins++;
      else if (role === "Seller") sellersOnly++;
      else if (role === "Buyer") buyersOnly++;
      else if (role === "Both") bothRoles++;
      else neitherRole++;
    });
    return {
      totalUsers: sellersOnly + buyersOnly + bothRoles + neitherRole + totalAdmins,
      totalSellers: sellersOnly + bothRoles,
      totalBuyers: buyersOnly + bothRoles,
      sellersOnly,
      buyersOnly,
      bothRoles,
      neitherRole,
      totalAdmins,
    };
  }, [users]);

  const totalListings = listings.length;

  // Rasimu = mali ambazo muuzaji hajawasilisha (status pending_payment/DRAFT)
  const draftListings = useMemo(
    () => listings.filter((l) => l.status === "pending_payment").length,
    [listings]
  );

  const pendingPayments = useMemo(
    () => transactions.filter((tr) => tr.status === "pending").length,
    [transactions]
  );

  const activeDeals = useMemo(
    () => deals.filter((d) =>
      ["negotiating","offer_sent","accepted","reserved",
       "awaiting_final_payment","payment_proof_submitted","disputed"].includes(d.status)
    ),
    [deals]
  );

  const completedDeals = useMemo(
    () => deals.filter((d) => d.status === "completed").length,
    [deals]
  );

  const userStatsGrid = [
    { id: "users",       label: t("Watumiaji Wote", "Total Users"),  value: userStats.totalUsers.toLocaleString("en-US"),   icon: Users,       color: COLORS.gold },
    { id: "sellersOnly", label: t("Wauzaji Pekee", "Sellers Only"),  value: userStats.sellersOnly.toLocaleString("en-US"), icon: Store,      color: "#2563EB" },
    { id: "buyersOnly",  label: t("Wanunuzi Pekee", "Buyers Only"),  value: userStats.buyersOnly.toLocaleString("en-US"),  icon: UserCheck,  color: COLORS.green },
    { id: "bothRoles",   label: t("Wote Wawili", "Both Roles"),      value: userStats.bothRoles.toLocaleString("en-US"),   icon: User,       color: "#7C3AED" },
    { id: "neitherRole", label: t("Wapya", "Neither"),               value: userStats.neitherRole.toLocaleString("en-US"), icon: UserPlus,   color: "#D97706" },
    { id: "admins",      label: t("Admins", "Admins"),               value: userStats.totalAdmins.toLocaleString("en-US"), icon: ShieldCheck, color: "#DC2626" },
  ];

  const activityStats = [
    { id: "listings",        label: t("Mali Zote", "Total Listings"),             value: totalListings.toLocaleString("en-US"),   icon: Home,          color: COLORS.green },
    { id: "draftListings",   label: t("Rasimu (Haijawasilishwa)", "Drafts (Not submitted)"), value: draftListings.toLocaleString("en-US"), icon: Tag, color: "#9CA3AF" },
    { id: "pendingListings", label: t("Mali Zinazosubiri", "Pending Listings"),   value: pendingCount.toLocaleString("en-US"),    icon: ClipboardList, color: "#D97706" },
    { id: "activeDeals",     label: t("Deals Hai", "Active Deals"),               value: activeDeals.length.toLocaleString("en-US"), icon: ShoppingBag, color: "#2563EB" },
    { id: "completedDeals",  label: t("Deals Zilizokamilika", "Completed Deals"), value: completedDeals.toLocaleString("en-US"),  icon: CheckCircle2,  color: COLORS.green },
    { id: "pendingPayments", label: t("Malipo Yanayosubiri", "Pending Payments"), value: pendingPayments.toLocaleString("en-US"), icon: CreditCard,    color: "#D97706" },
  ];

  const revenueStreamCards = useMemo(() => {
    if (revenue.loading) return [];
    return revenue.streams
      .map((s) => {
        const meta = STREAM_META[s.key] || { icon: Banknote, color: "#9CA3AF", labelSw: s.label, labelEn: s.label };
        const amount = Number(revenue.byType[s.key]) || 0;
        return {
          id: `rev-${s.key}`,
          label: t(meta.labelSw, meta.labelEn),
          value: formatTZS(amount),
          icon: meta.icon,
          color: meta.color,
        };
      })
      .filter((c) => c);
  }, [revenue.loading, revenue.streams, revenue.byType, lang]);

  return (
    <>
      <SectionHeader
        title={t("Muhtasari", "Overview")}
        subtitle={t(
          "Muhtasari wa haraka wa mfumo — namba tu, uchanganuzi wa kina uko Ripoti.",
          "Quick system overview — plain numbers only, deep analytics in Reports."
        )}
      />

      {/* USERS */}
      <div className="mb-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Watumiaji", "Users")}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {userStatsGrid.map((s) => <StatCard key={s.id} {...s} />)}
        </div>
      </div>

      {/* ACTIVITY */}
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Shughuli", "Activity")}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {activityStats.map((s) => <StatCard key={s.id} {...s} />)}
        </div>
      </div>

      {/* REVENUE */}
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Mapato ya Jukwaa", "Platform Revenue")}
        </h3>

        {/* Hero — Jumla kubwa */}
        <div
          className="mb-3 rounded-2xl p-5 sm:p-7 lg:p-8"
          style={{
            background: "linear-gradient(135deg, #011957 0%, #1a2842 100%)",
            color: "#FFFFFF",
          }}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl sm:h-16 sm:w-16"
              style={{ background: "rgba(232,163,61,0.25)" }}
            >
              <Wallet size={28} color={COLORS.gold} />
            </div>
            <div className="min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-wider sm:text-sm"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {t("Jumla ya Mapato", "Total Revenue")}
              </p>
              <p
                className="mt-1 text-[clamp(1.75rem,6vw,3rem)] font-bold leading-tight tabular-nums"
                style={{ color: "#FFFFFF" }}
              >
                {revenue.loading ? "…" : revenue.error ? "—" : formatTZS(revenue.total)}
              </p>
            </div>
          </div>
        </div>

        {/* Per-stream stat cards */}
        {revenueStreamCards.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {revenueStreamCards.map((s) => (
              <StatCard key={s.id} {...s} />
            ))}
          </div>
        )}
      </div>

      {/* ✅ QUICK LINKS ZIMEONDOLEWA */}
    </>
  );
}
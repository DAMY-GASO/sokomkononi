import React, { useMemo, useState, useEffect } from "react";
import {
  Users, Home, ShoppingBag, Wallet,
  UserCheck, Store, ClipboardList, CheckCircle2,
  UserPlus, CreditCard, User, ShieldCheck,
  ArrowRight, BarChart3, Handshake, Banknote,
  TrendingUp, Tag, Megaphone, Package, Sparkles,
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

// ── Icons + colors kwa kila revenue stream ──────────────
const STREAM_META = {
  listing:     { icon: Tag,        color: "#0891B2", labelSw: "Listing Fee",   labelEn: "Listing Fee" },
  reservation: { icon: Store,      color: "#2F6D4F", labelSw: "Reservation",   labelEn: "Reservation" },
  boost:       { icon: Sparkles,   color: "#FEA406", labelSw: "Boost",         labelEn: "Boost" },
  leading:     { icon: TrendingUp, color: "#7C3AED", labelSw: "Leading",       labelEn: "Leading" },
  advertise:   { icon: Megaphone,  color: "#C1502E", labelSw: "Advertise",     labelEn: "Advertise" },
  success:     { icon: CheckCircle2, color: "#2563EB", labelSw: "Success Fee", labelEn: "Success Fee" },
  bundle:      { icon: Package,    color: "#DB2777", labelSw: "Bundle",        labelEn: "Bundle" },
};

const STREAM_COLORS = {
  listing:     "#0891B2",
  reservation: "#2F6D4F",
  boost:       "#FEA406",
  leading:     "#7C3AED",
  advertise:   "#C1502E",
  success:     "#2563EB",
  bundle:      "#DB2777",
};

export default function OverviewSection({ onNavigate }) {
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

  // ── User stats ───────────────────────────────────────────
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

  // ── User stat cards ──────────────────────────────────────
  const userStatsGrid = [
    { id: "users",       label: t("Watumiaji Wote", "Total Users"),  value: userStats.totalUsers.toLocaleString("en-US"),   icon: Users,       color: COLORS.gold },
    { id: "sellersOnly", label: t("Wauzaji Pekee", "Sellers Only"),  value: userStats.sellersOnly.toLocaleString("en-US"), icon: Store,      color: "#2563EB" },
    { id: "buyersOnly",  label: t("Wanunuzi Pekee", "Buyers Only"),  value: userStats.buyersOnly.toLocaleString("en-US"),  icon: UserCheck,  color: COLORS.green },
    { id: "bothRoles",   label: t("Wote Wawili", "Both Roles"),      value: userStats.bothRoles.toLocaleString("en-US"),   icon: User,       color: "#7C3AED" },
    { id: "neitherRole", label: t("Wapya", "Neither"),               value: userStats.neitherRole.toLocaleString("en-US"), icon: UserPlus,   color: "#D97706" },
    { id: "admins",      label: t("Admins", "Admins"),               value: userStats.totalAdmins.toLocaleString("en-US"), icon: ShieldCheck, color: "#DC2626" },
  ];

  // ── Activity stat cards ──────────────────────────────────
  const activityStats = [
    { id: "listings",        label: t("Mali Zote", "Total Listings"),             value: totalListings.toLocaleString("en-US"),   icon: Home,          color: COLORS.green },
    { id: "pendingListings", label: t("Mali Zinazosubiri", "Pending Listings"),   value: pendingCount.toLocaleString("en-US"),    icon: ClipboardList, color: "#D97706" },
    { id: "activeDeals",     label: t("Deals Hai", "Active Deals"),               value: activeDeals.length.toLocaleString("en-US"), icon: ShoppingBag, color: "#2563EB" },
    { id: "completedDeals",  label: t("Deals Zilizokamilika", "Completed Deals"), value: completedDeals.toLocaleString("en-US"),  icon: CheckCircle2,  color: COLORS.green },
    { id: "pendingPayments", label: t("Malipo Yanayosubiri", "Pending Payments"), value: pendingPayments.toLocaleString("en-US"), icon: CreditCard,    color: "#D97706" },
  ];

  // ── Revenue streams — kila moja kama stat card ───────────
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
      .filter((c) => c); // onyesha zote — hata zilizo 0, ili admin aone kila stream
  }, [revenue.loading, revenue.streams, revenue.byType, lang]);

  // ── Quick links ──────────────────────────────────────────
  const quickLinks = [
    {
      id: "reports",
      icon: BarChart3,
      color: COLORS.gold,
      title: t("Ripoti & Uchanganuzi", "Reports & Analytics"),
      desc: t("Graphs, trends na uchanganuzi wa kina", "Graphs, trends and deep analytics"),
    },
    {
      id: "deals",
      icon: Handshake,
      color: "#2563EB",
      title: t("Deal Rooms", "Deal Rooms"),
      desc: t("Deals hai na mazungumzo yanayoendelea", "Active deals and ongoing negotiations"),
    },
    {
      id: "moderation",   // ⬅️ FIX: moderation, sio listings
      icon: Home,
      color: COLORS.green,
      title: t("Uidhinishaji wa Mali", "Listing Moderation"),
      desc: t("Idhinisha, kataa au simamia mali", "Approve, reject or manage listings"),
    },
  ];

  return (
    <>
      <SectionHeader
        title={t("Muhtasari", "Overview")}
        subtitle={t(
          "Muhtasari wa haraka wa mfumo — namba tu, uchanganuzi wa kina uko Ripoti.",
          "Quick system overview — plain numbers only, deep analytics in Reports."
        )}
      />

      {/* ═══ USERS ═══════════════════════════════════════════ */}
      <div className="mb-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Watumiaji", "Users")}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {userStatsGrid.map((s) => <StatCard key={s.id} {...s} />)}
        </div>
      </div>

      {/* ═══ ACTIVITY ════════════════════════════════════════ */}
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Shughuli", "Activity")}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {activityStats.map((s) => <StatCard key={s.id} {...s} />)}
        </div>
      </div>

      {/* ═══ REVENUE — Hero + per-stream stat cards ══════════ */}
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

      {/* ═══ QUICK LINKS ═════════════════════════════════════ */}
      <div className="mb-2">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Nenda Haraka", "Quick Links")}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickLinks.map(({ id, icon: Icon, color, title, desc }) => (
            <button
              key={id}
              onClick={() => onNavigate?.(id)}
              className="group card p-4 sm:p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                  style={{ background: `${color}15`, color }}
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-primary truncate">
                      {title}
                    </p>
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                  <p className="mt-1 text-xs text-secondary leading-snug">
                    {desc}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
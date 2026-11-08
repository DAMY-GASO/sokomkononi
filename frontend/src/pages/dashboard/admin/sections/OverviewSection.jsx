import React, { useMemo, useState, useEffect, useCallback } from "react";
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
import { financeApi } from "../../../../api/finance.js";
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

// ─────────────────────────────────────────────────────────────
// HELPER: "…" wakati wa hydrating (flash-free UX)
// ─────────────────────────────────────────────────────────────
const LOADING = "…";

// Overview inasoma namba zote kutoka endpoint moja ya seva (hakuna cache ya
// localStorage), kwa hiyo admin haoni tena namba za zamani zikibadilika.
function useOverviewStats() {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const load = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    financeApi
      .overviewStats()
      .then((data) => !cancelled && setState({ loading: false, error: null, data }))
      .catch((error) => !cancelled && setState({ loading: false, error, data: null }));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => load(), [load]);
  return { ...state, retry: load };
}

export default function OverviewSection() {
  const { lang } = useLanguage();
  const revenue = usePlatformRevenue("all");
  const { loading, error, data, retry } = useOverviewStats();

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // loading => skeleton, error => "—", vinginevyo namba halisi
  const num = (v) =>
    loading ? LOADING : error || v == null ? "—" : Number(v).toLocaleString("en-US");

  const u = data?.users;
  const l = data?.listings;
  const d = data?.deals;

  const userStatsGrid = [
    { id: "users",       label: t("Watumiaji Wote", "Total Users"),  value: num(u?.totalUsers),   icon: Users,       color: COLORS.gold },
    { id: "sellersOnly", label: t("Wauzaji Pekee", "Sellers Only"),  value: num(u?.sellersOnly),  icon: Store,       color: "#2563EB" },
    { id: "buyersOnly",  label: t("Wanunuzi Pekee", "Buyers Only"),  value: num(u?.buyersOnly),   icon: UserCheck,   color: COLORS.green },
    { id: "bothRoles",   label: t("Wote Wawili", "Both Roles"),      value: num(u?.bothRoles),    icon: User,        color: "#7C3AED" },
    { id: "neitherRole", label: t("Wapya", "Neither"),               value: num(u?.neitherRole),  icon: UserPlus,    color: "#D97706" },
    { id: "admins",      label: t("Admins", "Admins"),               value: num(u?.totalAdmins),  icon: ShieldCheck, color: "#DC2626" },
  ];

  const activityStats = [
    { id: "listings",        label: t("Mali Zote", "Total Listings"),             value: num(l?.total),           icon: Home,          color: COLORS.green },
    { id: "draftListings",   label: t("Rasimu (Haijawasilishwa)", "Drafts (Not submitted)"), value: num(l?.drafts), icon: Tag,           color: "#9CA3AF" },
    { id: "pendingListings", label: t("Mali Zinazosubiri", "Pending Listings"),   value: num(l?.pending),         icon: ClipboardList, color: "#D97706" },
    { id: "activeDeals",     label: t("Deals Hai", "Active Deals"),               value: num(d?.active),          icon: ShoppingBag,   color: "#2563EB" },
    { id: "completedDeals",  label: t("Deals Zilizokamilika", "Completed Deals"), value: num(d?.completed),       icon: CheckCircle2,  color: COLORS.green },
    { id: "pendingPayments", label: t("Malipo Yanayosubiri", "Pending Payments"), value: num(data?.pendingPayments), icon: CreditCard, color: "#D97706" },
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

      {error && !loading && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card px-3.5 py-2.5 text-sm text-secondary">
          <span>{t("Imeshindwa kupakia takwimu.", "Failed to load stats.")}</span>
          <button onClick={retry} className="font-semibold text-primary underline">
            {t("Jaribu tena", "Retry")}
          </button>
        </div>
      )}

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
                {revenue.loading ? (
                  <span className="block h-10 w-48 animate-pulse rounded bg-white/20" />
                ) : revenue.error ? "—" : formatTZS(revenue.total)}
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
    </>
  );
}
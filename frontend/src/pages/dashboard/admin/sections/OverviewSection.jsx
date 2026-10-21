import React, { useMemo, useEffect, useState } from "react";
import {
  Users, Home, ShoppingBag, Wallet, Clock, ArrowRight,
  UserCheck, Store, ClipboardList, CheckCircle2,
  UserPlus, CreditCard, TrendingUp, User, BarChart3, Tag, MapPin, Eye,
} from "lucide-react";
import { COLORS, formatTZS, getCategory } from "../shared/constants.js";
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
import { useReports } from "../../../../config/reportsStore.js";
import {
  usePlatformRevenue,
  isRevenueTransaction,
  localDayKey,
} from "../shared/revenue.js";
import {
  DonutChart,
  HBarChart,
  VBarChart,
  LineChart,
  MiniRow,
} from "../shared/Charts.jsx";

const NEW_REGISTRATION_WINDOW_DAYS = 7;

const STREAM_COLORS = {
  listing:     "#0891B2",
  reservation: "#2F6D4F",
  boost:       "#FEA406",
  leading:     "#7C3AED",
  advertise:   "#C1502E",
  success:     "#2563EB",
  bundle:      "#DB2777",
};

const DEAL_STATUS_COLORS = {
  negotiating:            "#FEA406",
  offer_sent:             "#D97706",
  accepted:               "#2F6D4F",
  reserved:               "#0062FD",
  awaiting_final_payment: "#2563EB",
  payment_proof_submitted:"#7C3AED",
  completed:              "#059669",
  disputed:               "#C1502E",
  cancelled:              "#6B7280",
};

const LISTING_STATUS_COLORS = {
  live:            "#2F6D4F",
  reserved:        "#FEA406",
  sold:            "#7C3AED",
  pending_payment: "#D97706",
  in_review:       "#0062FD",
  rejected:        "#C1502E",
  paused:          "#6B7280",
  expired:         "#9CA3AF",
};

export default function OverviewSection({ onNavigate }) {
  const { lang } = useLanguage();
  const users = useUsers();
  const listings = useListings();
  const deals = useDeals();
  const transactions = useTransactions();
  const revenue = usePlatformRevenue("all");
  const reports = useReports(lang);

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

  const usersDonut = useMemo(() => [
    { label: t("Wauzaji Pekee", "Sellers Only"), value: userStats.sellersOnly, color: "#FEA406" },
    { label: t("Wanunuzi Pekee", "Buyers Only"), value: userStats.buyersOnly, color: "#2F6D4F" },
    { label: t("Wote Wawili", "Both"),          value: userStats.bothRoles,   color: "#7C3AED" },
    { label: t("Wapya", "Neither"),             value: userStats.neitherRole, color: "#9CA3AF" },
    { label: t("Admins", "Admins"),             value: userStats.totalAdmins, color: "#DC2626" },
  ].filter((d) => d.value > 0), [userStats, lang]);

  const listingsDonut = useMemo(() => {
    const statuses = ["live","reserved","sold","pending_payment","in_review","rejected","paused","expired"];
    const labels = {
      live: t("Hai","Live"), reserved: t("Imehifadhiwa","Reserved"),
      sold: t("Imeuzwa","Sold"), pending_payment: t("Haijalipwa","Unpaid"),
      in_review: t("Inakaguliwa","In Review"), rejected: t("Imekataliwa","Rejected"),
      paused: t("Imesimamishwa","Paused"), expired: t("Imeisha Muda","Expired"),
    };
    return statuses
      .map((s) => ({
        label: labels[s],
        value: listings.filter((l) => l.status === s).length,
        color: LISTING_STATUS_COLORS[s],
      }))
      .filter((d) => d.value > 0);
  }, [listings, lang]);

  const dealsDonut = useMemo(() => {
    const keys = Object.keys(DEAL_STATUS_COLORS);
    const labels = {
      negotiating: t("Inajadiliwa","Negotiating"),
      offer_sent: t("Ofa Imetumwa","Offer Sent"),
      accepted: t("Imekubaliwa","Accepted"),
      reserved: t("Imehifadhiwa","Reserved"),
      awaiting_final_payment: t("Malipo ya Mwisho","Final Payment"),
      payment_proof_submitted: t("Uthibitisho","Proof Sent"),
      completed: t("Imekamilika","Completed"),
      disputed: t("Mgogoro","Disputed"),
      cancelled: t("Imeghairiwa","Cancelled"),
    };
    return keys
      .map((k) => ({
        label: labels[k],
        value: deals.filter((d) => d.status === k).length,
        color: DEAL_STATUS_COLORS[k],
      }))
      .filter((d) => d.value > 0);
  }, [deals, lang]);

  const revenueDonut = useMemo(() => {
    const total = revenue.total || 1;
    return revenue.streams
      .map((s) => {
        const value = revenue.byType[s.key] || 0;
        const pct = (value / total) * 100;
        return {
          label: `${s.label} (${pct.toFixed(1)}%)`,
          value: value,
          color: STREAM_COLORS[s.key] || "#9CA3AF",
        };
      })
      .filter((d) => d.value > 0);
  }, [revenue]);

  const revenueByDay = useMemo(() => {
    const days = [];
    for (let i = NEW_REGISTRATION_WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({
        key: localDayKey(d),
        label: d.toLocaleDateString(lang === "sw" ? "sw-TZ" : "en-US", { weekday: "short" }),
        value: 0,
      });
    }
    const byKey = Object.fromEntries(days.map((d) => [d.key, d]));
    transactions.forEach((tr) => {
      if (!isRevenueTransaction(tr)) return;
      const dt = new Date(tr.at);
      if (Number.isNaN(dt.getTime())) return;
      const key = localDayKey(dt);
      if (byKey[key]) byKey[key].value += Number(tr.amount) || 0;
    });
    return days;
  }, [transactions, lang]);

  const monthlyRevenue = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = start.toLocaleDateString(
        lang === "sw" ? "sw-TZ" : "en-US",
        { month: "short" }
      );
      let total = 0;
      transactions.forEach((tr) => {
        if (!isRevenueTransaction(tr)) return;
        const dt = new Date(tr.at);
        if (dt >= start && dt <= end) total += Number(tr.amount) || 0;
      });
      out.push({ label, value: total });
    }
    return out;
  }, [transactions, lang]);

  const topCategories = reports.topCategories?.length
    ? reports.topCategories.slice(0, 5)
    : buildTopCategories(listings);

  const topLocations = reports.topLocations?.length
    ? reports.topLocations.slice(0, 5)
    : buildTopLocations(listings);

  const mostViewed = reports.mostViewedListings?.length
    ? reports.mostViewedListings.slice(0, 5)
    : listings
        .filter((l) => (l.views || 0) > 0)
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map((l) => ({ id: l.id, title: l.title, views: l.views, price: l.price }));

  const userStatsGrid = [
    { id: "users",       label: t("Watumiaji Wote", "Total Users"),  value: userStats.totalUsers.toLocaleString(),   icon: Users,      color: COLORS.gold },
    { id: "sellersOnly", label: t("Wauzaji Pekee", "Sellers Only"),  value: userStats.sellersOnly.toLocaleString(), icon: Store,     color: "#2563EB" },
    { id: "buyersOnly",  label: t("Wanunuzi Pekee", "Buyers Only"),  value: userStats.buyersOnly.toLocaleString(),  icon: UserCheck, color: COLORS.green },
    { id: "bothRoles",   label: t("Wote Wawili", "Both Roles"),      value: userStats.bothRoles.toLocaleString(),   icon: User,      color: "#7C3AED" },
    { id: "neitherRole", label: t("Wapya", "Neither"),               value: userStats.neitherRole.toLocaleString(), icon: UserPlus,  color: "#D97706" },
  ];

  const activityStats = [
    { id: "listings",        label: t("Mali Zote", "Total Listings"),             value: totalListings.toLocaleString(),        icon: Home,          color: COLORS.green },
    { id: "pendingListings", label: t("Mali Zinazosubiri", "Pending Listings"),   value: pendingCount.toLocaleString(),         icon: ClipboardList, color: "#D97706" },
    { id: "activeDeals",     label: t("Deals Hai", "Active Deals"),               value: activeDeals.length.toLocaleString(),   icon: ShoppingBag,   color: "#2563EB" },
    { id: "completedDeals",  label: t("Deals Zilizokamilika", "Completed Deals"), value: completedDeals.toLocaleString(),       icon: CheckCircle2,  color: COLORS.green },
    { id: "pendingPayments", label: t("Malipo Yanayosubiri", "Pending Payments"), value: pendingPayments.toLocaleString(),      icon: CreditCard,    color: "#D97706" },
  ];

  return (
    <>
      <SectionHeader
        title={t("Muhtasari & Uchanganuzi", "Overview & Analytics")}
        subtitle={t("Muhtasari wa mfumo mzima wa SokoMkononi", "Overview of the entire SokoMkononi system")}
      />

      <div className="mb-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Watumiaji", "Users")}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {userStatsGrid.map((s) => <StatCard key={s.id} {...s} />)}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Shughuli", "Activity")}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {activityStats.map((s) => <StatCard key={s.id} {...s} />)}
        </div>
      </div>

      <div
        className="mb-6 rounded-2xl p-5 sm:p-7 lg:p-8"
        style={{
          background: "linear-gradient(135deg, #011957 0%, #1a2842 100%)",
          color: "#FFFFFF",
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl sm:h-16 sm:w-16"
              style={{ background: "rgba(232,163,61,0.25)" }}
            >
              <Wallet size={28} color={COLORS.gold} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider sm:text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                {t("Mapato ya Jumla", "Total Revenue")}
              </p>
              <p className="mt-1 text-[clamp(1.75rem,6vw,3rem)] font-bold leading-tight tabular-nums" style={{ color: "#FFFFFF" }}>
                {revenue.loading ? "…" : revenue.error ? "—" : formatTZS(revenue.total)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-auto lg:grid-cols-4 lg:gap-5">
            {revenue.streams.map(({ key, label }) => (
              <div key={key} className="min-w-0">
                <div className="mb-0.5 truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs" style={{ color: STREAM_COLORS[key], opacity: 0.9 }}>
                  {label}
                </div>
                <div className="whitespace-nowrap text-sm font-bold tabular-nums sm:text-base" style={{ color: "#FFFFFF" }}>
                  {formatTZS(revenue.byType[key] || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ReportCard
          title={t("Mapato kwa Njia", "Revenue by Stream")}
          icon={Wallet}
          color={COLORS.gold}
          hint={t(`Jumla: ${formatTZS(revenue.total)}`, `Total: ${formatTZS(revenue.total)}`)}
        >
          {revenue.loading ? (
            <LoadingBlock />
          ) : (
            <DonutChart
              data={revenueDonut}
              size={180}
              thickness={26}
              centerLabel="100%"
              centerSub="TZS"
            />
          )}
        </ReportCard>

        <ReportCard
          title={t("Mgawanyo wa Watumiaji", "User Breakdown")}
          icon={Users}
          color="#2563EB"
          hint={t(`${userStats.totalUsers} watumiaji`, `${userStats.totalUsers} users`)}
        >
          <DonutChart
            data={usersDonut}
            size={180}
            thickness={26}
            centerLabel={userStats.totalUsers.toLocaleString()}
            centerSub={t("Watumiaji", "Users")}
          />
        </ReportCard>

        <ReportCard
          title={t("Mali kwa Hali", "Listings by Status")}
          icon={Home}
          color={COLORS.green}
          hint={t(`${totalListings} mali`, `${totalListings} listings`)}
        >
          <DonutChart
            data={listingsDonut}
            size={180}
            thickness={26}
            centerLabel={totalListings.toLocaleString()}
            centerSub={t("Mali", "Listings")}
          />
        </ReportCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ReportCard
          title={t("Mgawanyo wa Deals", "Deals Breakdown")}
          icon={ShoppingBag}
          color="#7C3AED"
          hint={t(`${deals.length} deals`, `${deals.length} deals`)}
        >
          {dealsDonut.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">
              {t("Hakuna deals bado", "No deals yet")}
            </p>
          ) : (
            <DonutChart
              data={dealsDonut}
              size={180}
              thickness={26}
              centerLabel={deals.length}
              centerSub={t("Deals", "Deals")}
            />
          )}
        </ReportCard>

        <ReportCard
          title={t("Mapato — Siku 7", "Revenue — Last 7 Days")}
          icon={TrendingUp}
          color={COLORS.gold}
          hint={t("Mwenendo wa kila siku", "Daily trend")}
        >
          <LineChart
            data={revenueByDay}
            color={COLORS.gold}
            valueFormat={formatTZS}
          />
        </ReportCard>

        <ReportCard
          title={t("Mapato — Miezi 6", "Revenue — Last 6 Months")}
          icon={BarChart3}
          color={COLORS.rust}
          hint={t("Kwa mwezi", "Per month")}
        >
          <VBarChart
            data={monthlyRevenue.map((m) => ({ ...m, color: COLORS.rust }))}
            height={180}
            valueFormat={(v) => (v >= 1_000_000 ? `${Math.round(v / 1_000_000)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
          />
        </ReportCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReportCard
          title={t("Kategoria Zinazoonekana Zaidi", "Top Categories")}
          icon={Tag}
          color="#0891B2"
        >
          {topCategories.length === 0 ? (
            <EmptyBlock label={t("Hakuna data bado", "No data yet")} />
          ) : (
            <HBarChart
              data={topCategories.map((c) => {
                const cat = getCategory(c.key || c.slug || c.name);
                return {
                  label: cat?.label?.[lang] || c.name || c.key,
                  value: c.count || 0,
                  color: "#0891B2",
                };
              })}
            />
          )}
        </ReportCard>

        <ReportCard
          title={t("Maeneo Yanayoonekana Zaidi", "Top Locations")}
          icon={MapPin}
          color={COLORS.rust}
        >
          {topLocations.length === 0 ? (
            <EmptyBlock label={t("Hakuna data bado", "No data yet")} />
          ) : (
            <HBarChart
              data={topLocations.map((loc) => ({
                label: loc.name || loc.location || "—",
                value: loc.count || 0,
                color: COLORS.rust,
              }))}
            />
          )}
        </ReportCard>

        <ReportCard
          title={t("Mali Zinazoonekana Zaidi", "Most Viewed Listings")}
          icon={Eye}
          color={COLORS.green}
        >
          {mostViewed.length === 0 ? (
            <EmptyBlock label={t("Hakuna data bado", "No data yet")} />
          ) : (
            <div>
              {mostViewed.slice(0, 5).map((l, i) => (
                <MiniRow
                  key={l.id || i}
                  rank={i + 1}
                  label={l.title}
                  sub={formatTZS(l.price)}
                  value={`${(l.views || 0).toLocaleString()}`}
                  color={COLORS.green}
                />
              ))}
            </div>
          )}
        </ReportCard>
      </div>

      <div className="card mb-6 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-primary sm:text-base">
            <Clock size={16} color={COLORS.gold} className="shrink-0" />
            {t("Live Transactions Zinazoendelea", "Live Transactions in Progress")}
          </h3>
          <button
            onClick={() => onNavigate("deals")}
            className="flex items-center gap-1 text-xs font-semibold hover:underline"
            style={{ color: COLORS.gold }}
          >
            {t("Nenda Deal Rooms", "Go to Deal Rooms")}
            <ArrowRight size={12} />
          </button>
        </div>
        {activeDeals.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {t("Hakuna deals zinazoendelea kwa sasa.", "No active deals right now.")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {activeDeals.slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="rounded-lg border border-[color:rgb(var(--c-hairline))] px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary">{d.listingTitle}</p>
                    <p className="truncate text-xs text-secondary">
                      {d.buyerName} ← → {d.sellerName}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: COLORS.rust }}>
                    {formatTZS(d.currentOffer ?? d.askingPrice)}
                  </span>
                  <StatusBadge status={d.status} lang={lang} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ReportCard({ title, icon: Icon, color, hint, children }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ background: `${color}18`, color }}
          >
            <Icon size={15} />
          </span>
          <h3 className="truncate text-sm font-semibold text-primary">{title}</h3>
        </div>
        {hint && (
          <span className="shrink-0 text-[10px] font-medium text-muted">
            {hint}
          </span>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="h-32 w-32 rounded-full skeleton" />
      <div className="h-3 w-24 rounded skeleton" />
    </div>
  );
}

function EmptyBlock({ label }) {
  return <p className="py-6 text-center text-xs text-muted">{label}</p>;
}

function buildTopCategories(listings) {
  const m = new Map();
  listings.forEach((l) => {
    const k = l.category;
    if (!k) return;
    const e = m.get(k) || { key: k, count: 0, views: 0 };
    e.count += 1;
    e.views += Number(l.views) || 0;
    m.set(k, e);
  });
  return Array.from(m.values())
    .sort((a, b) => b.views - a.views || b.count - a.count)
    .slice(0, 5);
}

function buildTopLocations(listings) {
  const m = new Map();
  listings.forEach((l) => {
    const k = String(l.location || l.region || "").trim();
    if (!k) return;
    const e = m.get(k) || { name: k, count: 0, views: 0 };
    e.count += 1;
    e.views += Number(l.views) || 0;
    m.set(k, e);
  });
  return Array.from(m.values())
    .sort((a, b) => b.views - a.views || b.count - a.count)
    .slice(0, 5);
}
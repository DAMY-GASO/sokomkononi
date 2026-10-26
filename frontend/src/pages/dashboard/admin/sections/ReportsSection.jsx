import React, { useMemo, useState } from "react";
import {
  Users, Home, Handshake, Wallet, TrendingUp, BarChart3, Eye,
  MapPin, Tag, Download, FileText, FileSpreadsheet, File, Loader2, Calendar, UserPlus
} from "lucide-react";
import { COLORS, formatTZS, getCategory } from "../shared/constants.js";
import { getCategoryIcon } from "../../../../config/categoriesStore.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useReports } from "../../../../config/reportsStore.js";
import { useUsers } from "../../../../config/usersStore.js"; 
import {
  useListings,
  useHydratePublicListings,
} from "../../../../config/listingsStore.js";
import { useDeals } from "../../../../config/dealsStore.js";
import { usePlatformRevenue, localDayKey } from "../shared/revenue.js";
import {
  DonutChart,
  HBarChart,
  VBarChart,
  LineChart,
  MiniRow,
} from "../shared/Charts.jsx";

// ✅ Timezone Fix
const formatDateTZ = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return new Intl.DateTimeFormat("sw-TZ", {
    timeZone: "Africa/Dar_es_Salaam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
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
  live: "#2F6D4F",
  reserved: "#FEA406",
  sold: "#7C3AED",
  pending_payment: "#D97706",
  approved_pending_payment: "#0891B2",
  pending_approval: "#0062FD",
  paid_pending_approval: "#2563EB",
  in_review: "#0062FD",
  needs_edit: "#B45309",
  draft: "#9CA3AF",
  rejected: "#C1502E",
  paused: "#6B7280",
  expired: "#9CA3AF",
};

async function downloadReport(format, { period, from, to }) {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "/api";
  const params = new URLSearchParams();
  params.set("format", format);
  if (period === "custom") {
    if (from) params.set("from", from);
    if (to) params.set("to", to);
  } else if (period) {
    params.set("period", period);
  }
  const path = `/finance/reports/export/?${params.toString()}`;
  const { getAccessToken } = await import("../../../../api/client.js");
  const token = getAccessToken?.();
  const res = await fetch(`${base}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Accept-Language": (typeof window !== "undefined" && window.__SMK_LANG__) || "sw",
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.error?.message || `Download failed (${res.status})`);
  }
  const data = await res.blob();
  const url = window.URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  const ext = format === "doc" ? "docx" : format;
  const suffix = period === "custom"
    ? `${from || "start"}_to_${to || "end"}`
    : period;
  a.download = `ripoti_${suffix}_${new Date().toISOString().slice(0, 10)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function DownloadPanel({ lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [period, setPeriod] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const periods = [
    { key: "today", label: t("Leo", "Today") },
    { key: "week", label: t("Wiki Hii", "This Week") },
    { key: "month", label: t("Mwezi Huu", "This Month") },
    { key: "year", label: t("Mwaka Huu", "This Year") },
    { key: "all", label: t("Zote", "All Time") },
    { key: "custom", label: t("Chagua Siku", "Custom Range") },
  ];

  const formats = [
    { key: "csv", label: "CSV", icon: FileSpreadsheet, color: COLORS.green },
    { key: "pdf", label: "PDF", icon: FileText, color: COLORS.rust },
    { key: "doc", label: "DOC", icon: File, color: "#2563EB" },
  ];

  const handleDownload = async (format) => {
    if (period === "custom" && (!from || !to)) {
      setError(t("Chagua tarehe ya kuanza na kumaliza.", "Select start and end date."));
      return;
    }
    setBusy(format);
    setError("");
    setSuccess("");
    try {
      await downloadReport(format, { period, from, to });
      setSuccess(t("Ripoti imepakuliwa", "Report downloaded"));
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err?.message || t("Imeshindwa kupakua.", "Download failed."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="rounded-xl border-2 p-4 sm:p-5 mb-5"
      style={{ borderColor: `${COLORS.gold}40`, background: `${COLORS.gold}05` }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          style={{ background: `${COLORS.gold}20` }}
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        >
          <Download size={18} color={COLORS.gold} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">
            {t("Pakua Ripoti", "Download Report")}
          </p>
          <p className="text-xs text-secondary mt-0.5">
            {t(
              "Chagua kipindi na muundo — ripoti itapakuliwa kwenye kifaa chako.",
              "Choose period and format — report will download to your device."
            )}
          </p>
        </div>
      </div>

      <p className="text-[11px] font-semibold text-secondary uppercase tracking-wide mb-1.5">
        {t("Kipindi", "Period")}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {periods.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            style={{
              background: period === p.key ? COLORS.night : "white",
              color: period === p.key ? COLORS.sand : "var(--text-primary)",
              borderColor: COLORS.sandLine,
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
              <Calendar size={11} /> {t("Kuanzia", "From")}
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none w-full focus:border-[#FEA406] cursor-pointer"
              style={{ colorScheme: "light dark" }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
              <Calendar size={11} /> {t("Mpaka", "To")}
            </span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none w-full focus:border-[#FEA406] cursor-pointer"
              style={{ colorScheme: "light dark" }}
            />
          </label>
        </div>
      )}

      <p className="text-[11px] font-semibold text-secondary uppercase tracking-wide mb-1.5">
        {t("Muundo", "Format")}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {formats.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleDownload(key)}
            disabled={!!busy}
            style={{
              background: "white",
              borderColor: `${color}40`,
              color,
            }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg border transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {busy === key ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Icon size={14} />
            )}
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p
          className="text-xs mt-3 px-3 py-2 rounded-lg"
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
        >
          {error}
        </p>
      )}
      {success && (
        <p
          className="text-xs mt-3 px-3 py-2 rounded-lg"
          style={{ background: "rgba(47,109,79,0.1)", color: COLORS.green }}
        >
          {success}
        </p>
      )}
    </div>
  );
}

function ChartCard({ title, icon: Icon, iconColor, hint, children }) {
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 min-w-0 w-full"
    >
      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={16} color={iconColor} className="shrink-0" />
          <h3 className="text-sm font-semibold text-primary truncate">{title}</h3>
        </div>
        {hint && (
          <span className="shrink-0 text-[10px] font-medium text-muted">
            {hint}
          </span>
        )}
      </div>
      {children}
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

export default function ReportsSection() {
  const { lang } = useLanguage();
  const apiReports = useReports(lang);
  const platformRevenue = usePlatformRevenue("all");
  useHydratePublicListings();
  const listings = useListings();
  const deals = useDeals();
  const localUsers = useUsers(); 

  const t = (sw, en) => (lang === "sw" ? sw : en);
  const locale = lang === "sw" ? "sw-TZ" : "en-US";

  // ── Users Breakdown ──
  const usersDonut = useMemo(() => {
    let sellersOnly = 0, buyersOnly = 0, bothRoles = 0, neitherRole = 0, totalAdmins = 0;
    const users = localUsers;
    users.forEach((u) => {
      const role = u.role || "Neither";
      if (role === "Admin") totalAdmins++;
      else if (role === "Seller") sellersOnly++;
      else if (role === "Buyer") buyersOnly++;
      else if (role === "Both") bothRoles++;
      else neitherRole++;
    });
    return [
      { label: t("Wauzaji Pekee", "Sellers Only"), value: sellersOnly, display: sellersOnly.toLocaleString("en-US"), color: "#FEA406" },
      { label: t("Wanunuzi Pekee", "Buyers Only"), value: buyersOnly, display: buyersOnly.toLocaleString("en-US"), color: "#2F6D4F" },
      { label: t("Wote Wawili", "Both"), value: bothRoles, display: bothRoles.toLocaleString("en-US"), color: "#7C3AED" },
      { label: t("Wapya", "Neither"), value: neitherRole, display: neitherRole.toLocaleString("en-US"), color: "#9CA3AF" },
      { label: t("Admins", "Admins"), value: totalAdmins, display: totalAdmins.toLocaleString("en-US"), color: "#DC2626" },
    ].filter((d) => d.value > 0);
  }, [localUsers, lang]);

  const usersTotal = localUsers.length || 0;

  // ✅ Users Growth Data (Cumulative)
  const usersGrowthData = useMemo(() => {
    const growth = apiReports?.usersGrowth || [];
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayColors = {
      Mon: "#2563EB", Tue: "#7C3AED", Wed: "#DB2777", Thu: "#EA580C", Fri: "#CA8A04", Sat: "#16A34A", Sun: "#DC2626",
    };

    const dayMap = {};
    daysOfWeek.forEach((day) => { dayMap[day] = 0; });

    const recent = growth.slice(-7);
    recent.forEach((d) => {
      if (d.date) {
        try {
          const dateObj = new Date(d.date);
          if (!isNaN(dateObj.getTime())) {
            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
            if (dayMap[dayName] !== undefined) {
              dayMap[dayName] = d.cumulative || 0; // ✅ Tumia Cumulative
            }
          }
        } catch (err) { /* Ignore */ }
      }
    });

    return daysOfWeek.map((day) => ({
      label: day,
      value: dayMap[day] || 0,
      display: (dayMap[day] || 0).toLocaleString("en-US"),
      color: dayColors[day],
    }));
  }, [apiReports]);

  // ── Listings Breakdown ──
  const listingsDonut = useMemo(() => {
    const statuses = [
      "live", "reserved", "sold", "pending_payment", "approved_pending_payment",
      "pending_approval", "paid_pending_approval", "in_review", "needs_edit", "draft",
      "rejected", "paused", "expired",
    ];
    const labels = {
      live: t("Hai", "Live"), reserved: t("Imehifadhiwa", "Reserved"), sold: t("Imeuzwa", "Sold"),
      pending_payment: t("Haijalipwa", "Unpaid"), approved_pending_payment: t("Inasubiri Malipo", "Awaiting Pay"),
      pending_approval: t("Inasubiri Admin", "Pending Review"), paid_pending_approval: t("Imelipwa", "Paid"),
      in_review: t("Inakaguliwa", "In Review"), needs_edit: t("Inahitaji Uhariri", "Needs Edit"),
      draft: t("Rasimu", "Draft"), rejected: t("Imekataliwa", "Rejected"),
      paused: t("Imesimamishwa", "Paused"), expired: t("Imeisha Muda", "Expired"),
    };
    return statuses
      .map((s) => {
        const count = listings.filter((l) => l.status === s).length;
        return {
          label: labels[s], value: count, display: count.toLocaleString("en-US"),
          color: LISTING_STATUS_COLORS[s] || "#9CA3AF",
        };
      })
      .filter((d) => d.value > 0);
  }, [listings, lang]);

  // ── Deals Breakdown ──
  const dealsDonut = useMemo(() => {
    const keys = Object.keys(DEAL_STATUS_COLORS);
    const labels = {
      negotiating: t("Inajadiliwa","Negotiating"), offer_sent: t("Ofa Imetumwa","Offer Sent"),
      accepted: t("Imekubaliwa","Accepted"), reserved: t("Imehifadhiwa","Reserved"),
      awaiting_final_payment: t("Malipo ya Mwisho","Final Payment"), payment_proof_submitted: t("Uthibitisho","Proof Sent"),
      completed: t("Imekamilika","Completed"), disputed: t("Mgogoro","Disputed"), cancelled: t("Imeghairiwa","Cancelled"),
    };
    return keys
      .map((k) => {
        const count = deals.filter((d) => d.status === k).length;
        return {
          label: labels[k], value: count, display: count.toLocaleString("en-US"),
          color: DEAL_STATUS_COLORS[k],
        };
      })
      .filter((d) => d.value > 0);
  }, [deals, lang]);

  // ── Revenue Donut ──
  const revenueDonut = useMemo(() => {
    const total = platformRevenue.total || 1;
    return platformRevenue.streams
      .map((s) => {
        const value = platformRevenue.byType[s.key] || 0;
        const pct = (value / total) * 100;
        return {
          label: `${s.label} (${pct.toFixed(1)}%)`,
          value: value, display: formatTZS(value),
          color: STREAM_COLORS[s.key] || "#9CA3AF",
        };
      })
      .filter((d) => d.value > 0);
  }, [platformRevenue]);

  // ✅ Revenue by Month - Tumia apiReports.revenueByMonth
  const revenueByMonth = useMemo(() => {
    const apiMonths = apiReports?.revenueByMonth;
    if (Array.isArray(apiMonths) && apiMonths.length > 0) {
      return apiMonths.map((m) => ({
        label: m.label || m.month || "—",
        value: Number(m.total) || 0,
      }));
    }
    return [];
  }, [apiReports]);

  // ✅ Revenue by Day - Tumia apiReports.revenueByDay
  const revenueByDay = useMemo(() => {
    const apiDays = apiReports?.revenueByDay;
    if (Array.isArray(apiDays) && apiDays.length > 0) {
      return apiDays.map((d) => ({
        label: d.label || d.date || "—",
        value: Number(d.total) || 0,
      }));
    }
    return [];
  }, [apiReports]);

  const hasRevenueByDay = revenueByDay.some((d) => d.value > 0);

  // ── Reports Data ──
  const reports = useMemo(() => {
    const num = (v) => Number(v) || 0;
    const apiHasLoaded = apiReports?.source === "api";
    const pick = (api, local) => {
      const n = Number(api);
      if (apiHasLoaded && Number.isFinite(n)) return n;
      return Number(local) || 0;
    };
    const pickList = (api, local) =>
      Array.isArray(api) && api.length > 0 ? api : local;

    const apiStatus = apiReports.dealsByStatus || {};
    const byStatus = (st) => deals.filter((d) => d.status === st).length;

    const dealsByStatus = Object.values(apiStatus).some((v) => num(v) > 0)
      ? apiStatus
      : {
          negotiating: byStatus("negotiating"), accepted: byStatus("accepted"),
          reserved: byStatus("reserved"), completed: byStatus("completed"), cancelled: byStatus("cancelled"),
        };
    const totalDeals = pick(apiReports.totalDeals, deals.length);
    const completedDeals = pick(apiReports.completedDeals, byStatus("completed"));

    const lsStatus = (st) => listings.filter((l) => l.status === st).length;
    const perDay = {};
    listings.forEach((l) => {
      const d = new Date(l.postedAt);
      if (Number.isNaN(d.getTime())) return;
      const k = localDayKey(d);
      perDay[k] = (perDay[k] || 0) + 1;
    });

    const group = (keyFn) => {
      const m = new Map();
      listings.forEach((l) => {
        const k = keyFn(l);
        if (!k) return;
        const e = m.get(k) || { key: k, count: 0, views: 0 };
        e.count += 1;
        e.views += num(l.views);
        m.set(k, e);
      });
      return Array.from(m.values()).sort((a, b) => b.views - a.views || b.count - a.count).slice(0, 5);
    };
    const topCategoriesLocal = group((l) => l.category).map((g) => ({ key: g.key, count: g.count, views: g.views }));
    const topLocationsLocal = group((l) => String(l.location || "").trim()).map((g) => ({ name: g.key, count: g.count, views: g.views }));
    const mostViewedLocal = listings
      .filter((l) => num(l.views) > 0)
      .sort((a, b) => num(b.views) - num(a.views))
      .slice(0, 5)
      .map((l) => ({ id: l.id, title: l.title, views: num(l.views), price: l.price }));

    return {
      ...apiReports,
      totalListings: pick(apiReports.totalListings, listings.length),
      liveListings: pick(apiReports.liveListings, lsStatus("live")),
      soldListings: pick(apiReports.soldListings, lsStatus("sold")),
      totalDeals, completedDeals,
      dealsByStatus,
      mostViewedListings: pickList(apiReports.mostViewedListings, mostViewedLocal),
      topCategories: pickList(apiReports.topCategories, topCategoriesLocal),
      topLocations: pickList(apiReports.topLocations, topLocationsLocal),
      topSellers: pickList(apiReports.topSellers, []),
    };
  }, [apiReports, listings, deals, locale]);

    // ✅ Deals Status as Percentages (Jumla yake = 100)
  const dealsStatusData = useMemo(() => {
    const keys = ["negotiating", "accepted", "reserved", "completed", "cancelled"];
    const labels = {
      negotiating: t("Inajadiliwa", "Negotiating"),
      accepted: t("Imekubaliwa", "Accepted"),
      reserved: t("Imehifadhiwa", "Reserved"),
      completed: t("Imekamilika", "Completed"),
      cancelled: t("Imeghairiwa", "Cancelled"),
    };

    // ✅ Hesabu jumla ya deals zilizopo kwenye makundi haya 5 pekee
    const totalInBuckets = keys.reduce(
      (sum, k) => sum + (reports.dealsByStatus?.[k] || 0),
      0
    );
    const total = totalInBuckets || 1; // Kama ni sifuri, tumia 1 kuepuka division by zero

    return keys.map((k) => {
      const count = reports.dealsByStatus?.[k] || 0;
      const pct = (count / total) * 100;
      return {
        label: labels[k],
        value: pct,
        display: `${pct.toFixed(0)}% (${count})`,
        color: DEAL_STATUS_COLORS[k] || COLORS.gold,
      };
    });
  }, [reports, lang]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <SectionHeader
        title={t("Ripoti & Uchanganuzi", "Reports & Analytics")}
        subtitle={t(
          "Uchanganuzi wa kina — graphs, trends, top lists na data zote za mfumo.",
          "Deep analytics — graphs, trends, top lists and all system data."
        )}
      />

      <DownloadPanel lang={lang} />

      {/* REVENUE ANALYTICS */}
      <div className="mb-2">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Mapato ya Jukwaa", "Platform Revenue")}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-5">
          <ChartCard
            title={t("Mapato kwa Njia", "Revenue by Stream")}
            icon={Wallet}
            iconColor={COLORS.gold}
            hint={t(`Jumla: ${formatTZS(platformRevenue.total)}`, `Total: ${formatTZS(platformRevenue.total)}`)}
          >
            {platformRevenue.loading ? (
              <LoadingBlock />
            ) : (
              <DonutChart
                data={revenueDonut}
                size={180}
                thickness={26}
                centerLabel="100%"
              />
            )}
          </ChartCard>

          <ChartCard
            title={t("Mapato — Siku 7", "Revenue — Last 7 Days")}
            icon={TrendingUp}
            iconColor={COLORS.gold}
            hint={t("Mwenendo wa kila siku", "Daily trend")}
          >
            {!hasRevenueByDay ? (
              <p className="py-6 text-center text-xs text-muted">
                {t("Hakuna mapato kwa siku 7 zilizopita", "No revenue in the last 7 days")}
              </p>
            ) : (
              <VBarChart
                data={revenueByDay.map((d) => ({ ...d, color: COLORS.gold }))}
                height={180}
                valueFormat={(v) =>
                  v >= 1_000_000 ? `${Math.round(v / 1_000_000)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : v
                }
              />
            )}
          </ChartCard>

          <ChartCard
            title={t("Mapato — Miezi 6", "Revenue — Last 6 Months")}
            icon={BarChart3}
            iconColor={COLORS.rust}
            hint={t("Kwa mwezi", "Per month")}
          >
            <VBarChart
              data={revenueByMonth.map((m) => ({ ...m, color: COLORS.rust }))}
              height={180}
              valueFormat={(v) =>
                v >= 1_000_000 ? `${Math.round(v / 1_000_000)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : v
              }
            />
          </ChartCard>
        </div>
      </div>

      {/* BREAKDOWNS */}
      <div className="mb-2">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Mgawanyo", "Breakdowns")}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-5">
          <ChartCard
            title={t("Mgawanyo wa Watumiaji", "User Breakdown")}
            icon={Users}
            iconColor="#2563EB"
            hint={t(`${usersTotal} watumiaji`, `${usersTotal} users`)}
          >
            <DonutChart
              data={usersDonut}
              size={180}
              thickness={26}
              centerLabel={usersTotal.toLocaleString("en-US")}
              centerSub={t("Watumiaji", "Users")}
            />
          </ChartCard>

          <ChartCard
            title={t("Ukuaji wa Watumiaji (Siku 7)", "Users Growth (7 Days)")}
            icon={UserPlus}
            iconColor={COLORS.royal}
            hint={t("Jumla ya watumiaji", "Total users")}
          >
            {usersGrowthData.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">
                {t("Hakuna data bado", "No data yet")}
              </p>
            ) : (
              <VBarChart
                data={usersGrowthData}
                height={180}
                valueFormat={(v) => v.toLocaleString("en-US")}
              />
            )}
          </ChartCard>

          <ChartCard
            title={t("Mali kwa Hali", "Listings by Status")}
            icon={Home}
            iconColor={COLORS.green}
            hint={t(`${listings.length} mali`, `${listings.length} listings`)}
          >
            <DonutChart
              data={listingsDonut}
              size={180}
              thickness={26}
              centerLabel={listings.length.toLocaleString("en-US")}
              centerSub={t("Mali", "Listings")}
            />
          </ChartCard>

          <ChartCard
            title={t("Mgawanyo wa Deals", "Deals Breakdown")}
            icon={Handshake}
            iconColor="#7C3AED"
            hint={t(`${reports.totalDeals} deals`, `${reports.totalDeals} deals`)}
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
                centerLabel={reports.totalDeals.toLocaleString("en-US")}
                centerSub={t("Deals", "Deals")}
              />
            )}
          </ChartCard>
        </div>
      </div>

      {/* GROWTH */}
      <div className="mb-2">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Ukuaji", "Growth")}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-5">
          <ChartCard
            title={t("Ukuaji wa Mali (Siku 30)", "Listings Growth (Last 30 Days)")}
            icon={BarChart3}
            iconColor={COLORS.green}
          >
            <VBarChart
              data={(reports.listingsGrowth || []).map((d) => ({ ...d, color: COLORS.green }))}
              height={180}
              valueFormat={(v) => v.toLocaleString("en-US")}
            />
          </ChartCard>

          {/* ✅ Deals Status - VBarChart inayojumlisha 100% */}
          <ChartCard
            title={t("Mgawanyo wa Deals kwa Hali", "Deals by Status")}
            icon={Handshake}
            iconColor="#2563EB"
          >
            <VBarChart
              data={dealsStatusData}
              height={180}
              maxValue={100} // ✅ Hii inafanya kiwango cha juu kiwe 100%
              valueFormat={(v) => `${v.toFixed(0)}%`}
            />
          </ChartCard>
        </div>
      </div>

      {/* TOP LISTS */}
      <div className="mb-2">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Orodha za Juu", "Top Lists")}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <ChartCard
            title={t("Kategoria Zinazoonekana Zaidi", "Top Categories")}
            icon={Tag}
            iconColor="#0891B2"
          >
            {reports.topCategories?.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">
                {t("Hakuna data bado", "No data yet")}
              </p>
            ) : (
              <HBarChart
                data={(reports.topCategories || []).map((c) => {
                  const cat = getCategory(c.key || c.slug || c.name);
                  return {
                    label: cat?.label?.[lang] || c.name || c.key,
                    value: c.count || 0,
                    color: "#0891B2",
                  };
                })}
                valueFormat={(v) => v.toLocaleString("en-US")}
              />
            )}
          </ChartCard>

          <ChartCard
            title={t("Maeneo Yanayoonekana Zaidi", "Top Locations")}
            icon={MapPin}
            iconColor={COLORS.rust}
          >
            {reports.topLocations?.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">
                {t("Hakuna data bado", "No data yet")}
              </p>
            ) : (
              <HBarChart
                data={(reports.topLocations || []).map((loc) => ({
                  label: loc.name || loc.location || "—",
                  value: loc.count || 0,
                  color: COLORS.rust,
                }))}
                valueFormat={(v) => v.toLocaleString("en-US")}
              />
            )}
          </ChartCard>

          <ChartCard
            title={t("Mali Zinazoonekana Zaidi", "Most Viewed Listings")}
            icon={Eye}
            iconColor={COLORS.green}
          >
            {reports.mostViewedListings?.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">
                {t("Hakuna data bado", "No data yet")}
              </p>
            ) : (
              <div>
                {(reports.mostViewedListings || []).slice(0, 5).map((l, i) => (
                  <MiniRow
                    key={l.id || i}
                    rank={i + 1}
                    label={l.title}
                    sub={formatTZS(l.price)}
                    value={`${(l.views || 0).toLocaleString("en-US")}`}
                    color={i === 0 ? COLORS.gold : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7F32" : COLORS.green}
                  />
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard
            title={t("Wauzaji Bora (kwa Views)", "Top Sellers (by Views)")}
            icon={Users}
            iconColor="#7C3AED"
          >
            {reports.topSellers?.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">
                {t("Hakuna data bado", "No data yet")}
              </p>
            ) : (
              <div>
                {(reports.topSellers || []).slice(0, 5).map((s, i) => (
                  <MiniRow
                    key={i}
                    rank={i + 1}
                    label={s.name || "—"}
                    sub={`${s.listings || 0} ${t("mali", "listings")}`}
                    value={`${(s.views || 0).toLocaleString("en-US")}`}
                    color={i === 0 ? COLORS.gold : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7F32" : "#7C3AED"}
                  />
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

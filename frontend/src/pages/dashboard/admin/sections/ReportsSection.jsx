// ============================================================
// ReportsSection.jsx
// Admin — Reports & Analytics (stats, graphs, top lists).
// Bilingual + mobile-responsive (imeboreshwa).
// ============================================================

import React, { useMemo } from "react";
import {
  Users,
  Home,
  Handshake,
  Wallet,
  TrendingUp,
  BarChart3,
  Award,
  Eye,
  MapPin,
  Tag,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { COLORS, formatTZS, getCategory } from "../shared/constants.js";
import { getCategoryIcon } from "../../../../config/categoriesStore.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useReports } from "../../../../config/reportsStore.js";
import { useUsers } from "../../../../config/usersStore.js";
import { useListings, useHydratePublicListings } from "../../../../config/listingsStore.js";
import { useDeals } from "../../../../config/dealsStore.js";
import { usePlatformRevenue, localDayKey } from "../shared/revenue.js";

// ============================================================
// STAT TILE — responsive
// ============================================================
function ReportTile({ label, value, icon: Icon, color, subtext }) {
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-2.5 sm:p-3 lg:p-4 min-w-0"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
        <div
          style={{ background: `${color}15` }}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0"
        >
          <Icon size={14} className="sm:hidden" color={color} />
          <Icon size={16} className="hidden sm:block" color={color} />
        </div>
      </div>
      <p className="text-sm sm:text-base lg:text-lg font-bold text-primary break-words leading-tight">
        {value}
      </p>
      <p className="text-[10px] sm:text-[11px] text-secondary leading-tight mt-0.5">
        {label}
      </p>
      {subtext && (
        <p className="text-[10px] text-muted mt-1 break-words leading-tight">
          {subtext}
        </p>
      )}
    </div>
  );
}

// ============================================================
// BAR CHART — responsive
// ============================================================
function BarChart({ data, maxValue, color, lang, emptyText, formatValue }) {
  if (!data || data.length === 0 || maxValue === 0) {
    return (
      <p className="text-xs text-muted text-center py-6 sm:py-8">{emptyText}</p>
    );
  }

  return (
    <div className="flex items-end justify-between gap-0.5 sm:gap-1 h-32 sm:h-40">
      {data.map((d, i) => {
        const height = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1 flex-1 min-w-0"
          >
            <div className="w-full flex items-end justify-center h-full">
              <div
                style={{
                  background: color,
                  height: `${Math.max(height, 2)}%`,
                  minHeight: height > 0 ? 4 : 2,
                }}
                className="w-full max-w-[16px] sm:max-w-[24px] rounded-t transition-all"
                title={`${d.label}: ${formatValue ? formatValue(d.value) : d.value}`}
              />
            </div>
            <span className="text-[8px] sm:text-[9px] text-muted truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// LINE CHART — responsive
// ============================================================
function LineChart({ data, color, maxValue, lang, emptyText }) {
  if (!data || data.length === 0 || maxValue === 0) {
    return (
      <p className="text-xs text-muted text-center py-6 sm:py-8">{emptyText}</p>
    );
  }

  const width = 600;
  const height = 120;
  const padding = 8;
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - (d.value / maxValue) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaData = `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-24 sm:h-32"
        preserveAspectRatio="none"
      >
        <path d={areaData} fill={`${color}20`} />
        <path
          d={pathData}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="white"
            stroke={color}
            strokeWidth={2}
          />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[9px] text-muted truncate">
          {data[0]?.label}
        </span>
        <span className="text-[9px] text-muted truncate">
          {data[data.length - 1]?.label}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// CHART CARD — responsive
// ============================================================
function ChartCard({ title, icon: Icon, iconColor, children }) {
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 min-w-0 w-full"
    >
      <div className="flex items-center gap-2 mb-2 sm:mb-3 min-w-0">
        <Icon size={16} color={iconColor} className="shrink-0" />
        <h3 className="text-sm font-semibold text-primary truncate">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ============================================================
// MAIN SECTION
// ============================================================
export default function ReportsSection() {
  const { lang } = useLanguage();
  const apiReports = useReports(lang);
  const platformRevenue = usePlatformRevenue("all");
  const users = useUsers();
  useHydratePublicListings();
  const listings = useListings();
  const deals = useDeals();

  const t = (sw, en) => (lang === "sw" ? sw : en);
  const locale = lang === "sw" ? "sw-TZ" : "en-US";

  // Mapato ya Jumla: chanzo sawa na Overview (finance/dashboard)
  const totalRevenueText = platformRevenue.loading
    ? "…"
    : platformRevenue.error
      ? "—"
      : formatTZS(platformRevenue.total);

  // Data ya API ikiwa na thamani hutumika; ikiwa 0/tupu tunatumia
  // hesabu halisi kutoka stores zile zile zinazotumiwa na Overview.
  const reports = useMemo(() => {
    const num = (v) => Number(v) || 0;
    const pick = (api, local) => (num(api) > 0 ? num(api) : local);
    const pickList = (api, local) => (Array.isArray(api) && api.length > 0 ? api : local);
    const dayLabel = (d) => d.toLocaleDateString(locale, { day: "numeric", month: "short" });
    const byRole = (role) => users.filter((u) => u.role === role).length;
    const byStatus = (st) => deals.filter((d) => d.status === st).length;
    const lsStatus = (st) => listings.filter((l) => l.status === st).length;

    // ---- Deals ----
    const apiStatus = apiReports.dealsByStatus || {};
    const dealsByStatus = Object.values(apiStatus).some((v) => num(v) > 0)
      ? apiStatus
      : {
          negotiating: byStatus("negotiating"),
          accepted: byStatus("accepted"),
          reserved: byStatus("reserved"),
          completed: byStatus("completed"),
          disputed: byStatus("disputed"),
          cancelled: byStatus("cancelled"),
        };
    const totalDeals = pick(apiReports.totalDeals, deals.length);
    const completedDeals = pick(apiReports.completedDeals, byStatus("completed"));
    // Conversion = deals zilizokamilika ÷ deals zote
    const conversionRate =
      num(apiReports.conversionRate) > 0
        ? num(apiReports.conversionRate)
        : totalDeals > 0
          ? (completedDeals / totalDeals) * 100
          : 0;

    // ---- Ukuaji wa watumiaji (siku 30) ----
    const usersGrowthLocal = [];
    if (users.length > 0) {
      for (let i = 29; i >= 0; i--) {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        end.setDate(end.getDate() - i);
        const cumulative = users.filter((u) => {
          const j = new Date(u.joined).getTime();
          return !Number.isNaN(j) && j <= end.getTime();
        }).length;
        usersGrowthLocal.push({ label: dayLabel(end), cumulative });
      }
    }

    // ---- Mali (listingsStore) ----
    const perDay = {};
    listings.forEach((l) => {
      const d = new Date(l.postedAt);
      if (Number.isNaN(d.getTime())) return;
      const k = localDayKey(d);
      perDay[k] = (perDay[k] || 0) + 1;
    });
    const listingsGrowthLocal = [];
    if (listings.length > 0) {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        listingsGrowthLocal.push({ label: dayLabel(d), count: perDay[localDayKey(d)] || 0 });
      }
    }

    const sellerOf = (l) =>
      (typeof l.seller_name === "string" && l.seller_name) ||
      (typeof l.seller === "string" ? l.seller : "");
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
      return Array.from(m.values())
        .sort((a, b) => b.views - a.views || b.count - a.count)
        .slice(0, 5);
    };
    const topSellersLocal = group(sellerOf).map((g) => ({
      name: g.key, listings: g.count, views: g.views,
    }));
    const topCategoriesLocal = group((l) => l.category).map((g) => ({
      key: g.key, count: g.count, views: g.views,
    }));
    const topLocationsLocal = group((l) => String(l.location || "").trim()).map((g) => ({
      name: g.key, count: g.count, views: g.views,
    }));
    const mostViewedLocal = listings
      .filter((l) => num(l.views) > 0)
      .sort((a, b) => num(b.views) - num(a.views))
      .slice(0, 5)
      .map((l) => ({ id: l.id, title: l.title, views: num(l.views), price: l.price }));

    return {
      ...apiReports,
      totalUsers: pick(apiReports.totalUsers, users.length),
      totalSellers: pick(apiReports.totalSellers, byRole("Seller")),
      totalBuyers: pick(apiReports.totalBuyers, byRole("Buyer")),
      totalListings: pick(apiReports.totalListings, listings.length),
      liveListings: pick(apiReports.liveListings, lsStatus("live")),
      soldListings: pick(apiReports.soldListings, lsStatus("sold")),
      totalDeals,
      completedDeals,
      disputedDeals: pick(apiReports.disputedDeals, byStatus("disputed")),
      conversionRate,
      dealsByStatus,
      usersGrowth: pickList(apiReports.usersGrowth, usersGrowthLocal),
      listingsGrowth: pickList(apiReports.listingsGrowth, listingsGrowthLocal),
      topSellers: pickList(apiReports.topSellers, topSellersLocal),
      mostViewedListings: pickList(apiReports.mostViewedListings, mostViewedLocal),
      topCategories: pickList(apiReports.topCategories, topCategoriesLocal),
      topLocations: pickList(apiReports.topLocations, topLocationsLocal),
    };
  }, [apiReports, users, listings, deals, locale]);

  // Compute max values for charts
  const usersMax = Math.max(
    ...(reports.usersGrowth?.map((d) => d.cumulative) || [0]),
    1
  );
  const listingsMax = Math.max(
    ...(reports.listingsGrowth?.map((d) => d.count) || [0]),
    1
  );
  const revenueMax = Math.max(
    ...(reports.revenueByMonth?.map((d) => d.total) || [0]),
    1
  );

  return (
    <div className="w-full max-w-7xl mx-auto">
      <SectionHeader
        title={t("Ripoti & Uchanganuzi", "Reports & Analytics")}
        subtitle={t(
          "Muhtasari wa data ya mfumo — users, listings, deals, revenue.",
          "Overview of system data — users, listings, deals, revenue."
        )}
      />

      {/* PRIMARY STATS — responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-5">
        <ReportTile
          label={t("Watumiaji Wote", "Total Users")}
          value={reports.totalUsers}
          icon={Users}
          color={COLORS.gold}
          subtext={t(
            `${reports.totalSellers} wauzaji · ${reports.totalBuyers} wanunuzi`,
            `${reports.totalSellers} sellers · ${reports.totalBuyers} buyers`
          )}
        />
        <ReportTile
          label={t("Mali Zote", "Total Listings")}
          value={reports.totalListings}
          icon={Home}
          color={COLORS.green}
          subtext={t(
            `${reports.liveListings} hai · ${reports.soldListings} zimeuzwa`,
            `${reports.liveListings} live · ${reports.soldListings} sold`
          )}
        />
        <ReportTile
          label={t("Deals", "Deals")}
          value={reports.totalDeals}
          icon={Handshake}
          color="#2563EB"
          subtext={t(
            `${reports.completedDeals} zimekamilika · ${reports.disputedDeals} migogoro`,
            `${reports.completedDeals} completed · ${reports.disputedDeals} disputes`
          )}
        />
        <ReportTile
          label={t("Mapato", "Revenue")}
          value={totalRevenueText}
          icon={Wallet}
          color={COLORS.rust}
          subtext={t(
            `Conversion: ${Number(reports.conversionRate || 0).toFixed(1)}%`,
            `Conversion: ${Number(reports.conversionRate || 0).toFixed(1)}%`
          )}
        />
      </div>

      {/* CHARTS — responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-5">
        {/* Users Growth */}
        <ChartCard
          title={t("Ukuaji wa Watumiaji (Siku 30)", "Users Growth (Last 30 Days)")}
          icon={TrendingUp}
          iconColor={COLORS.gold}
        >
          <LineChart
            data={(reports.usersGrowth || []).map((d) => ({
              label: d.label,
              value: d.cumulative,
            }))}
            color={COLORS.gold}
            maxValue={usersMax}
            lang={lang}
            emptyText={t("Hakuna data bado", "No data yet")}
          />
        </ChartCard>

        {/* Listings Growth */}
        <ChartCard
          title={t("Ukuaji wa Mali (Siku 30)", "Listings Growth (Last 30 Days)")}
          icon={Home}
          iconColor={COLORS.green}
        >
          <BarChart
            data={(reports.listingsGrowth || []).map((d) => ({
              label: d.label,
              value: d.count,
            }))}
            maxValue={listingsMax}
            color={COLORS.green}
            lang={lang}
            emptyText={t("Hakuna data bado", "No data yet")}
          />
        </ChartCard>

        {/* Revenue by Month */}
        <ChartCard
          title={t("Mapato kwa Mwezi (Miezi 6)", "Revenue by Month (Last 6 Months)")}
          icon={BarChart3}
          iconColor={COLORS.rust}
        >
          <BarChart
            data={(reports.revenueByMonth || []).map((d) => ({
              label: d.label,
              value: d.total,
            }))}
            maxValue={revenueMax}
            formatValue={formatTZS}
            color={COLORS.rust}
            lang={lang}
            emptyText={t("Hakuna data bado", "No data yet")}
          />
        </ChartCard>

        {/* Deals Breakdown */}
        <ChartCard
          title={t("Mgawanyo wa Deals", "Deals Breakdown")}
          icon={Handshake}
          iconColor="#2563EB"
        >
          <div className="flex flex-col gap-2">
            {[
              { key: "negotiating", label: t("Inajadiliwa", "Negotiating"), color: "#2563EB" },
              { key: "accepted", label: t("Imekubaliwa", "Accepted"), color: COLORS.green },
              { key: "reserved", label: t("Imehifadhiwa", "Reserved"), color: COLORS.gold },
              { key: "completed", label: t("Imekamilika", "Completed"), color: COLORS.green },
              { key: "disputed", label: t("Migogoro", "Disputed"), color: COLORS.rust },
              { key: "cancelled", label: t("Imeghairiwa", "Cancelled"), color: COLORS.night },
            ].map(({ key, label, color }) => {
              const count = reports.dealsByStatus?.[key] || 0;
              const total = reports.totalDeals || 1;
              const pct = (count / total) * 100;
              return (
                <div key={key} className="min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1 gap-2">
                    <span className="text-secondary truncate">{label}</span>
                    <span className="font-semibold text-primary shrink-0">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      style={{ background: color, width: `${pct}%` }}
                      className="h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* TOP LISTS — responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Top Sellers */}
        <ChartCard
          title={t("Wauzaji Bora (kwa Views)", "Top Sellers (by Views)")}
          icon={Award}
          iconColor={COLORS.gold}
        >
          {reports.topSellers?.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">
              {t("Hakuna data bado", "No data yet")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {(reports.topSellers || []).map((seller, i) => (
                <div
                  key={seller.name}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 min-w-0"
                >
                  <span
                    style={{
                      background:
                        i === 0
                          ? COLORS.gold
                          : i === 1
                            ? "#C0C0C0"
                            : i === 2
                              ? "#CD7F32"
                              : COLORS.sandLine,
                      color: i <= 2 ? COLORS.night : COLORS.night,
                    }}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0"
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">
                      {seller.name}
                    </p>
                    <p className="text-[11px] text-secondary truncate">
                      {seller.listings} {t("mali", "listings")} ·{" "}
                      {seller.views.toLocaleString()} {t("views", "views")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Most Viewed Listings */}
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
            <div className="flex flex-col gap-2">
              {(reports.mostViewedListings || []).map((l, i) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 min-w-0"
                >
                  <span className="text-xs font-bold text-muted w-5 shrink-0">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {l.title}
                    </p>
                    <p className="text-[11px] text-secondary truncate">
                      {l.views || 0} {t("views", "views")} ·{" "}
                      {formatTZS(l.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Top Categories */}
        <ChartCard
          title={t("Kategoria Zinazoonekana Zaidi", "Most Viewed Categories")}
          icon={Tag}
          iconColor="#2563EB"
        >
          {reports.topCategories?.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">
              {t("Hakuna data bado", "No data yet")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {(reports.topCategories || []).map((cat) => {
                const category = getCategory(cat.key);
                const CatIcon = getCategoryIcon(category?.iconKey);
                const catLabel =
                  category?.label?.[lang] || category?.label?.sw || cat.key;
                return (
                  <div
                    key={cat.key}
                    className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 min-w-0"
                  >
                    <div
                      style={{ background: `${COLORS.night}0D` }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
                    >
                      <CatIcon size={13} color={COLORS.night} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">
                        {catLabel}
                      </p>
                      <p className="text-[11px] text-secondary truncate">
                        {cat.count} {t("mali", "listings")} ·{" "}
                        {cat.views.toLocaleString()} {t("views", "views")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>

        {/* Top Locations */}
        <ChartCard
          title={t("Maeneo Yanayoonekana Zaidi", "Most Active Locations")}
          icon={MapPin}
          iconColor={COLORS.rust}
        >
          {reports.topLocations?.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">
              {t("Hakuna data bado", "No data yet")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {(reports.topLocations || []).map((loc) => (
                <div
                  key={loc.name}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 min-w-0"
                >
                  <div
                    style={{ background: `${COLORS.rust}15` }}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
                  >
                    <MapPin size={13} color={COLORS.rust} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {loc.name}
                    </p>
                    <p className="text-[11px] text-secondary truncate">
                      {loc.count} {t("mali", "listings")} ·{" "}
                      {loc.views.toLocaleString()} {t("views", "views")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
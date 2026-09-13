// ============================================================
// ReportsSection.jsx
// Admin — Reports & Analytics (stats, graphs, top lists).
// Bilingual + mobile-responsive.
// ============================================================

import React from "react";
import {
  Users,
  Home,
  Handshake,
  DollarSign,
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
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useReports } from "../../../../config/reportsStore.js";
import { getCategoryIcon } from "../../../../config/categoriesStore.js";

// ============================================================
// STAT TILE
// ============================================================
function ReportTile({ label, value, icon: Icon, color, subtext }) {
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-4 min-w-0"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          style={{ background: `${color}15` }}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        >
          <Icon size={16} color={color} />
        </div>
      </div>
      <p className="text-lg sm:text-xl font-bold text-gray-800 break-words">
        {value}
      </p>
      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{label}</p>
      {subtext && (
        <p className="text-[10px] text-gray-400 mt-1">{subtext}</p>
      )}
    </div>
  );
}

// ============================================================
// BAR CHART — CSS based
// ============================================================
function BarChart({ data, maxValue, color, lang, emptyText }) {
  if (!data || data.length === 0 || maxValue === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-8">{emptyText}</p>
    );
  }

  return (
    <div className="flex items-end justify-between gap-1 h-40">
      {data.map((d, i) => {
        const height = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="w-full flex items-end justify-center h-full">
              <div
                style={{
                  background: color,
                  height: `${Math.max(height, 2)}%`,
                  minHeight: height > 0 ? 4 : 2,
                }}
                className="w-full max-w-[24px] rounded-t transition-all"
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <span className="text-[9px] text-gray-400 truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// LINE CHART — SVG based
// ============================================================
function LineChart({ data, color, maxValue, lang, emptyText }) {
  if (!data || data.length === 0 || maxValue === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-8">{emptyText}</p>
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
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-32"
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
        <span className="text-[9px] text-gray-400">{data[0]?.label}</span>
        <span className="text-[9px] text-gray-400">
          {data[data.length - 1]?.label}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// SECTION WRAPPER
// ============================================================
function ChartCard({ title, icon: Icon, iconColor, children }) {
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-4 min-w-0"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} color={iconColor} />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
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
  const reports = useReports(lang);

  const t = (sw, en) => (lang === "sw" ? sw : en);

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
    <>
      <SectionHeader
        title={t("Ripoti & Uchanganuzi", "Reports & Analytics")}
        subtitle={t(
          "Muhtasari wa data ya mfumo — users, listings, deals, revenue.",
          "Overview of system data — users, listings, deals, revenue."
        )}
      />

      {/* PRIMARY STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
          value={formatTZS(reports.totalRevenue)}
          icon={DollarSign}
          color={COLORS.rust}
          subtext={t(
            `Conversion: ${reports.conversionRate.toFixed(1)}%`,
            `Conversion: ${reports.conversionRate.toFixed(1)}%`
          )}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-800">
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

      {/* TOP LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Sellers */}
        <ChartCard
          title={t("Wauzaji Bora (kwa Views)", "Top Sellers (by Views)")}
          icon={Award}
          iconColor={COLORS.gold}
        >
          {reports.topSellers?.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              {t("Hakuna data bado", "No data yet")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {reports.topSellers.map((seller, i) => (
                <div
                  key={seller.name}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
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
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {seller.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
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
            <p className="text-xs text-gray-400 text-center py-6">
              {t("Hakuna data bado", "No data yet")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {reports.mostViewedListings.map((l, i) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-xs font-bold text-gray-400 w-5 shrink-0">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {l.title}
                    </p>
                    <p className="text-[11px] text-gray-500">
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
            <p className="text-xs text-gray-400 text-center py-6">
              {t("Hakuna data bado", "No data yet")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {reports.topCategories.map((cat) => {
                const category = getCategory(cat.key);
                const CatIcon = getCategoryIcon(category?.iconKey);
                const catLabel =
                  category?.label?.[lang] || category?.label?.sw || cat.key;
                return (
                  <div
                    key={cat.key}
                    className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div
                      style={{ background: `${COLORS.night}0D` }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    >
                      <CatIcon size={14} color={COLORS.night} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {catLabel}
                      </p>
                      <p className="text-[11px] text-gray-500">
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
            <p className="text-xs text-gray-400 text-center py-6">
              {t("Hakuna data bado", "No data yet")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {reports.topLocations.map((loc) => (
                <div
                  key={loc.name}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                >
                  <div
                    style={{ background: `${COLORS.rust}15` }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  >
                    <MapPin size={14} color={COLORS.rust} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {loc.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
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
    </>
  );
}

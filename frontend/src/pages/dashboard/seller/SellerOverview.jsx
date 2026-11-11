// ============================================================
// SellerOverview.jsx
// Muhtasari wa muuzaji — stats, quick actions, recent activity.
// Bilingual kamili + mobile-responsive + KILA KITU CENTERED.
//
// Marekebisho (B.2 — FINAL):
//  ✅ Real-time stats kwa polling (listings + leads kila sekunde 60)
//  ✅ Chart ya "Views per Listing"
//  ✅ Maulizio Mapya sasa inatumia leadsStore (si sum ya inquiries)
//  ✅ Reservation Zinasubiri kutoka listings (si deals)
//  ✅ Deals Hai: chuja kwa side="seller"
//  ✅ Timestamp "Imesasishwa" + kitufe cha refresh
// ============================================================

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ListChecks, Eye, MessageSquare, MessagesSquare, Clock3, CheckCircle,
  Package, AlertCircle, PlusCircle, Inbox, ArrowRight, Shield,
  ShieldCheck, MessageSquarePlus, BookOpen, RefreshCw,
} from "lucide-react";
import { COLORS } from "../components/shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import {
  useMyListings,
  useUnpaidListings,
  fetchMyListingsFromApi,
} from "../../../config/listingsStore.js";
import { useDeals } from "../../../config/dealsStore.js";
import {
  useNewLeadsCount,
  hydrateLeadsFromApi,
} from "../../../config/leadsStore.js";
import StatTile from "./StatTile.jsx";
import RecentActivity from "../components/RecentActivity.jsx";
import ListingViewsChart from "../components/ListingViewsChart.jsx";
import { usePollingRefresh } from "../hooks/usePollingRefresh.js";

const POLL_INTERVAL_MS = 60_000;

function timeAgoShort(ts, lang) {
  if (!ts) return "";
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 30) return lang === "sw" ? "sasa hivi" : "just now";
  if (sec < 60) return lang === "sw" ? `sekunde ${sec}` : `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return lang === "sw" ? `dakika ${min}` : `${min}m ago`;
  const hr = Math.floor(min / 60);
  return lang === "sw" ? `saa ${hr}` : `${hr}h ago`;
}

export default function SellerOverview({ onNavigate }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const listings = useMyListings();
  const unpaidListings = useUnpaidListings();

  // ✅ Chuja deals za seller pekee
  const allDeals = useDeals(user?.id);
  const deals = useMemo(() => {
    return (allDeals || []).filter((d) => {
      const dSide = d.side || d.role || "";
      if (dSide) return dSide === "seller";
      const dSellerId = d.sellerId ?? d.seller_id ?? d.seller?.id ?? null;
      if (dSellerId != null && user?.id != null) {
        return String(dSellerId) === String(user.id);
      }
      return true;
    });
  }, [allDeals, user?.id]);

  const newLeadsCount = useNewLeadsCount();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ✅ Polling moja: listings + leads
  const pollFetcher = useCallback(async () => {
    await Promise.allSettled([
      fetchMyListingsFromApi(),
      hydrateLeadsFromApi(),
    ]);
  }, []);

  const { refresh, isRefreshing, lastRefreshedAt } = usePollingRefresh(
    pollFetcher,
    { intervalMs: POLL_INTERVAL_MS, enabled: Boolean(user?.id) }
  );

  // Timestamp ina-update kila sekunde 30
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const myListings = listings;
    const totalListings = myListings.length;
    const activeListings = myListings.filter((l) => l.status === "live").length;
    const awaitingPayment = myListings.filter(
      (l) => l.status === "approved_pending_payment"
    ).length;
    const awaitingReview = myListings.filter((l) =>
      ["pending_approval", "paid_pending_approval", "in_review"].includes(l.status)
    ).length;
    const soldListings = myListings.filter((l) => l.status === "sold").length;
    const totalViews = myListings.reduce((sum, l) => sum + (l.views || 0), 0);

    // Deals hai (seller pekee)
    const activeDeals = deals.filter((d) =>
      !["completed", "cancelled", "expired"].includes(d.status)
    ).length;

    // ✅ Reservation Zinasubiri — LISTINGS (doc inavyosema)
    const pendingReservations = myListings.filter(
      (l) => l.status === "reserved"
    ).length;

    return {
      totalListings,
      activeListings,
      pendingApproval: awaitingPayment + awaitingReview,
      awaitingPayment,
      awaitingReview,
      soldListings,
      totalViews,
      totalEnquiries: newLeadsCount,
      activeDeals,
      pendingReservations,
    };
  }, [listings, deals, newLeadsCount]);

  const quickActions = [
    { key: "post", label: t("Weka Mali", "Post Property"), icon: PlusCircle, color: COLORS.gold },
    { key: "leads", label: t("Maulizio", "Enquiries"), icon: Inbox, color: COLORS.green },
    { key: "deals", label: t("Vyumba vya Majadiliano", "Deal Rooms"), icon: MessagesSquare, color: COLORS.rust },
    { key: "verification", label: t("Uthibitisho Wangu", "My Verification"), icon: ShieldCheck, color: "#7C3AED" },
    { key: "safety", label: t("Msaada", "Support"), icon: Shield, color: "#2563EB" },
    { key: "feedback", label: t("Maoni", "Feedback"), icon: MessageSquarePlus, color: COLORS.green },
  ];

  return (
    <div className="p-4 sm:p-6">
      {/* GREETING + REFRESH */}
      <div className="mb-6 text-center">
        <h1 className="h-title">
          {t(`Karibu, ${user?.name?.split(" ")[0] || "Muuzaji"} 👋`,
             `Welcome, ${user?.name?.split(" ")[0] || "Seller"} 👋`)}
        </h1>
        <p className="text-body-sm text-secondary mt-2 max-w-xl mx-auto">
          {t("Hii ni muhtasari wa mali zako, maulizio, na makubaliano.",
             "Here's a summary of your listings, enquiries, and deals.")}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-[11px] text-muted">
            {t("Imesasishwa", "Updated")} {timeAgoShort(lastRefreshedAt, lang)}
          </span>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            aria-label={t("Sasisha", "Refresh")}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md border disabled:opacity-50"
            style={{ borderColor: COLORS.sandLine, color: COLORS.night, background: "white" }}
          >
            <RefreshCw size={11} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? t("Inasasisha...", "Refreshing...") : t("Sasisha", "Refresh")}
          </button>
        </div>
      </div>

      {/* KITUFE: Jinsi ya Kuuza */}
      <button
        type="button"
        onClick={() => navigate("/jinsi-ya-kununua#kuuza")}
        className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 mb-6 hover:border-gold hover:shadow-sm transition-all text-left"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(47,109,79,0.1)" }}>
          <BookOpen size={22} color={COLORS.green} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-primary text-sm">{t("Jinsi ya Kuuza", "How to Sell")}</p>
          <p className="text-body-sm text-secondary mt-0.5">
            {t("Bonyeza hapa kuelewa hatua zote za uuzaji", "Tap here to understand all steps of selling")}
          </p>
        </div>
        <ArrowRight size={18} className="text-muted shrink-0" />
      </button>

      {/* UNPAID BANNER */}
      {unpaidListings.length > 0 && (
        <div
          className="mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border px-4 py-3"
          style={{ background: "rgba(193,80,46,0.06)", borderColor: "rgba(193,80,46,0.3)" }}
        >
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <AlertCircle size={18} color={COLORS.rust} className="shrink-0 hidden sm:block" />
            <div>
              <p className="text-sm font-semibold" style={{ color: COLORS.rust }}>
                {t(`Una listing ${unpaidListings.length} zisizolipwa ada`,
                   `You have ${unpaidListings.length} unpaid listing${unpaidListings.length === 1 ? "" : "s"}`)}
              </p>
              <p className="text-[11px] text-secondary mt-0.5">
                {t("Lipa ada ili tangazo lako lionekane hewani.", "Pay the fee to get your listing live.")}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("listings")}
            style={{ background: COLORS.rust, color: "white" }}
            className="shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold"
          >
            {t("Zilipie Sasa", "Pay Now")}
          </button>
        </div>
      )}

      {/* PRIMARY STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatTile label={t("Mali Hai", "Active Listings")} value={stats.activeListings} icon={ListChecks} color={COLORS.green} />
        <StatTile label={t("Jumla ya Mionekano", "Total Views")} value={stats.totalViews.toLocaleString()} icon={Eye} color={COLORS.gold} />
        <StatTile label={t("Maulizio Mapya", "New Enquiries")} value={stats.totalEnquiries} icon={MessageSquare} color="#2563EB" />
        <StatTile label={t("Deals Hai", "Active Deals")} value={stats.activeDeals} icon={MessagesSquare} color={COLORS.rust} />
      </div>

      {/* SECONDARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatTile label={t("Jumla ya Mali", "Total Listings")} value={stats.totalListings} icon={Package} color={COLORS.night} size="sm" />
        <StatTile label={t("Zinasubiri Malipo", "Awaiting Payment")} value={stats.awaitingPayment} icon={Clock3} color={COLORS.rust} size="sm" />
        <StatTile label={t("Zimeuzwa", "Sold")} value={stats.soldListings} icon={CheckCircle} color={COLORS.green} size="sm" />
        <StatTile label={t("Reservation Zinasubiri", "Pending Reservations")} value={stats.pendingReservations} icon={AlertCircle} color={COLORS.rust} size="sm" />
      </div>

      {/* CHART */}
      <div className="mb-6">
        <ListingViewsChart listings={listings} />
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
        <h2 className="h-card mb-4 text-center">{t("Vitendo vya Haraka", "Quick Actions")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {quickActions.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div style={{ background: `${color}15` }} className="w-10 h-10 rounded-lg flex items-center justify-center">
                <Icon size={18} color={color} />
              </div>
              <span className="text-body-sm font-semibold text-secondary text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <RecentActivity onNavigate={onNavigate} side="seller" />
    </div>
  );
}
// ============================================================
// SellerOverview.jsx
// Muhtasari wa muuzaji — stats, quick actions, recent activity.
// Bilingual + mobile-responsive.
// ============================================================

import React, { useMemo } from "react";
import {
  ListChecks,
  Eye,
  MessageSquare,
  MessagesSquare,
  Clock3,
  CheckCircle,
  Package,
  AlertCircle,
  PlusCircle,
  Inbox,
} from "lucide-react";
import { COLORS, FONTS } from "../components/shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useListings } from "../../../config/listingsStore.js";
import { useDeals } from "../../../config/dealsStore.js";
import StatTile from "./StatTile.jsx";
import RecentActivity from "./RecentActivity.jsx";

export default function SellerOverview({ onNavigate }) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const listings = useListings();
  const deals = useDeals();

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const stats = useMemo(() => {
    const myListings = listings;

    const totalListings = myListings.length;
    const activeListings = myListings.filter((l) => l.status === "live").length;
    const pendingApproval = myListings.filter(
      (l) => l.status === "in_review" || l.status === "pending_payment"
    ).length;
    const soldListings = myListings.filter((l) => l.status === "sold").length;
    const totalViews = myListings.reduce((sum, l) => sum + (l.views || 0), 0);
    const totalEnquiries = myListings.reduce(
      (sum, l) => sum + (l.inquiries || 0),
      0
    );

    const activeDeals = deals.filter((d) =>
      ["negotiating", "offer_sent", "accepted"].includes(d.status)
    ).length;
    const pendingReservations = deals.filter((d) => d.status === "reserved")
      .length;

    return {
      totalListings,
      activeListings,
      pendingApproval,
      soldListings,
      totalViews,
      totalEnquiries,
      activeDeals,
      pendingReservations,
    };
  }, [listings, deals]);

  const quickActions = [
    {
      key: "post",
      label: t("Weka Mali", "Post Property"),
      icon: PlusCircle,
      color: COLORS.gold,
    },
    {
      key: "listings",
      label: t("Leads", "Leads"),
      icon: Inbox,
      color: COLORS.green,
    },
    {
      key: "messages",
      label: t("Ujumbe", "Messages"),
      icon: MessageSquare,
      color: "#2563EB",
    },
    {
      key: "deals",
      label: t("My Deals", "My Deals"),
      icon: MessagesSquare,
      color: COLORS.rust,
    },
  ];

  return (
    <div style={{ fontFamily: FONTS.body }} className="p-4 sm:p-6">
      {/* GREETING */}
      <div className="mb-6">
        <h1
          style={{ fontFamily: FONTS.display, color: COLORS.night }}
          className="text-2xl sm:text-3xl font-semibold"
        >
          {t(
            `Karibu, ${user?.name?.split(" ")[0] || "Seller"} 👋`,
            `Welcome, ${user?.name?.split(" ")[0] || "Seller"} 👋`
          )}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t(
            "Hii ni muhtasari wa mali zako, leads, na deals.",
            "Here's a summary of your listings, leads, and deals."
          )}
        </p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatTile
          label={t("Active Listings", "Active Listings")}
          value={stats.activeListings}
          icon={ListChecks}
          color={COLORS.green}
          onClick={() => onNavigate("listings")}
        />
        <StatTile
          label={t("Total Views", "Total Views")}
          value={stats.totalViews.toLocaleString()}
          icon={Eye}
          color={COLORS.gold}
        />
        <StatTile
          label={t("New Enquiries", "New Enquiries")}
          value={stats.totalEnquiries}
          icon={MessageSquare}
          color="#2563EB"
          onClick={() => onNavigate("listings")}
        />
        <StatTile
          label={t("Active Deals", "Active Deals")}
          value={stats.activeDeals}
          icon={MessagesSquare}
          color={COLORS.rust}
          onClick={() => onNavigate("deals")}
        />
      </div>

      {/* SECONDARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatTile
          label={t("Total Listings", "Total Listings")}
          value={stats.totalListings}
          icon={Package}
          color={COLORS.night}
          size="sm"
        />
        <StatTile
          label={t("Pending Approval", "Pending Approval")}
          value={stats.pendingApproval}
          icon={Clock3}
          color={COLORS.gold}
          size="sm"
        />
        <StatTile
          label={t("Sold", "Sold")}
          value={stats.soldListings}
          icon={CheckCircle}
          color={COLORS.green}
          size="sm"
        />
        <StatTile
          label={t("Pending Reservations", "Pending Reservations")}
          value={stats.pendingReservations}
          icon={AlertCircle}
          color={COLORS.rust}
          size="sm"
        />
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
        <h2
          style={{ color: COLORS.night }}
          className="text-sm font-semibold mb-3"
        >
          {t("Vitendo vya Haraka", "Quick Actions")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {quickActions.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div
                style={{ background: `${color}15` }}
                className="w-10 h-10 rounded-lg flex items-center justify-center"
              >
                <Icon size={18} color={color} />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <RecentActivity
        listings={listings}
        deals={deals}
        onNavigate={onNavigate}
        lang={lang}
      />
    </div>
  );
}
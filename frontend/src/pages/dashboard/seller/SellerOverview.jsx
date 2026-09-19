// ============================================================
// SellerOverview.jsx
// Muhtasari wa muuzaji — stats, quick actions, recent activity.
// Bilingual kamili + mobile-responsive + KILA KITU CENTERED.
// ============================================================

import React, { useMemo, useState } from "react";
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
  ArrowRight,
  X,
} from "lucide-react";
import { COLORS } from "../components/shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useListings } from "../../../config/listingsStore.js";
import { useDeals } from "../../../config/dealsStore.js";
import StatTile from "./StatTile.jsx";
import RecentActivity from "../components/RecentActivity.jsx";

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
    const pendingReservations = deals.filter(
      (d) => d.status === "reserved"
    ).length;

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

  // ============================================================
  // QUICK ACTIONS — bilingual kamili
  // ============================================================
  const quickActions = [
    {
      key: "post",
      label: t("Weka Mali", "Post Property"),
      icon: PlusCircle,
      color: COLORS.gold,
    },
    {
      key: "leads",
      label: t("Maulizio", "Leads"),
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
      label: t("Vyumba vya Majadiliano", "Deal Rooms"),
      icon: MessagesSquare,
      color: COLORS.rust,
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      {/* ============================================================ */}
      {/* GREETING — CENTERED */}
      {/* ============================================================ */}
      <div className="mb-6 text-center">
        <h1 className="h-title">
          {t(
            `Karibu, ${user?.name?.split(" ")[0] || "Muuzaji"} 👋`,
            `Welcome, ${user?.name?.split(" ")[0] || "Seller"} 👋`
          )}
        </h1>
        <p className="text-body-sm text-secondary mt-2 max-w-xl mx-auto">
          {t(
            "Hii ni muhtasari wa mali zako, maulizio, na deals.",
            "Here's a summary of your listings, enquiries, and deals."
          )}
        </p>
      </div>

      {/* ============================================================ */}
      {/* JINSI YA KUUZA — onboarding guide, inaonekana mara ya kwanza */}
      {/* ============================================================ */}
      <HowToSellGuide lang={lang} />

      {/* ============================================================ */}
      {/* STATS GRID */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatTile
          label={t("Mali Hai", "Active Listings")}
          value={stats.activeListings}
          icon={ListChecks}
          color={COLORS.green}
        />
        <StatTile
          label={t("Jumla ya Mionekano", "Total Views")}
          value={stats.totalViews.toLocaleString()}
          icon={Eye}
          color={COLORS.gold}
        />
        <StatTile
          label={t("Maulizio Mapya", "New Enquiries")}
          value={stats.totalEnquiries}
          icon={MessageSquare}
          color="#2563EB"
        />
        <StatTile
          label={t("Deals Hai", "Active Deals")}
          value={stats.activeDeals}
          icon={MessagesSquare}
          color={COLORS.rust}
        />
      </div>

      {/* ============================================================ */}
      {/* SECONDARY STATS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatTile
          label={t("Jumla ya Mali", "Total Listings")}
          value={stats.totalListings}
          icon={Package}
          color={COLORS.night}
          size="sm"
        />
        <StatTile
          label={t("Zinasubiri Idhini", "Pending Approval")}
          value={stats.pendingApproval}
          icon={Clock3}
          color={COLORS.gold}
          size="sm"
        />
        <StatTile
          label={t("Zimeuzwa", "Sold")}
          value={stats.soldListings}
          icon={CheckCircle}
          color={COLORS.green}
          size="sm"
        />
        <StatTile
          label={t("Reservation Zinasubiri", "Pending Reservations")}
          value={stats.pendingReservations}
          icon={AlertCircle}
          color={COLORS.rust}
          size="sm"
        />
      </div>

      {/* ============================================================ */}
      {/* QUICK ACTIONS — header centered */}
      {/* ============================================================ */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
        <h2 className="h-card mb-4 text-center">
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
              <span className="text-body-sm font-semibold text-secondary text-center">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================
          RECENT ACTIVITY — component yake ndani inaweza kuwa
          na headers zake. Kama unataka ziwe centered pia,
          niambie nirekebishe RecentActivity.jsx.
          ============================================================ */}
      <RecentActivity
        listings={listings}
        deals={deals}
        onNavigate={onNavigate}
        lang={lang}
      />
    </div>
  );
}

// ============================================================
// STEP FLOW — mfululizo wa hatua na mishale kati yake
// ============================================================
function StepFlow({ steps }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-3">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-1.5 bg-[#F5F3EC] rounded-full pl-1.5 pr-3 py-1.5">
            <span
              style={{ background: COLORS.night, color: "white" }}
              className="w-5 h-5 rounded-full text-body-sm font-bold flex items-center justify-center shrink-0"
            >
              {i + 1}
            </span>
            <span className="text-body-sm font-medium text-secondary whitespace-nowrap">
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight size={14} className="text-muted shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================
// JINSI YA KUUZA — onboarding guide kwa seller dashboard
// ============================================================
function HowToSellGuide({ lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const STORAGE_KEY = "sokomkononi_seller_guide_dismissed_v1";

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  };

  const steps = [
    t('Bonyeza "Uza Sasa"', 'Tap "Sell Now"'),
    t("Chagua Aina ya Mali", "Choose Property Type"),
    t("Weka Picha za Mali (1–8)", "Upload Property Photos (1–8)"),
    t("Jaza Taarifa Zote za Mali", "Fill In All Property Details"),
    t("Wasilisha Taarifa", "Submit Your Details"),
    t("Lipia Huduma ya Kuchapisha", "Pay the Publishing Fee"),
    t("Chagua Njia ya Malipo", "Choose a Payment Method"),
    t("Kamilisha Malipo", "Complete Payment"),
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="w-4" aria-hidden="true" />
        <h2 className="h-card text-center flex-1">
          {t("Jinsi ya Kuuza", "How to Sell")}
        </h2>
        <button
          onClick={handleDismiss}
          aria-label={t("Ficha", "Dismiss")}
          className="text-muted hover:text-secondary shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      <StepFlow steps={steps} />

      <div
        style={{ background: "rgba(47,109,79,0.08)", color: COLORS.green }}
        className="text-center text-body-sm font-medium rounded-lg px-4 py-3 mt-4 max-w-2xl mx-auto"
      >
        🎉{" "}
        {t(
          "Hongera! Mali yako sasa imechapishwa kwenye SokoMkononi na iko tayari kuonekana na wanunuzi.",
          "Congratulations! Your property has been published on SokoMkononi and is now visible to buyers."
        )}
      </div>
    </div>
  );
}

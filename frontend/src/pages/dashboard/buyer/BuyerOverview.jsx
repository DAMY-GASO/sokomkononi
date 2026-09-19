// ============================================================
// BuyerOverview.jsx
// Muhtasari wa mnunuzi — search, categories, listings, quick actions.
// Bilingual kamili + mobile-responsive + watcher.
// KILA KITU CENTERED.
// ============================================================

import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutGrid,
  Heart,
  MessagesSquare,
  MessageSquare,
  TrendingUp,
  Clock3,
  Eye,
  MapPin,
  Star,
  Bell,
  Shield,
  ArrowRight,
  Lock,
  X,
} from "lucide-react";
import { COLORS, formatTZS } from "../components/shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
// ⬇️ MABADILIKO: useAuth kutoka authStore
import { useAuth } from "../../../config/authStore.js";
import { usePublicListings } from "../../../config/listingsStore.js";
import { useSavedIds } from "../../../config/savedStore.js";
import { useRecentlyViewedIds } from "../../../config/recentlyViewedStore.js";
import { useSearches } from "../../../config/searchesStore.js";
import { checkSavedListingsChanges } from "../../../config/savedListingsWatcher.js";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../../../config/categoriesStore.js";
import StatTile from "../seller/StatTile.jsx";
import RecentActivity from "../components/RecentActivity.jsx";

export default function BuyerOverview({ onNavigate }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const listings = usePublicListings();
  const savedIds = useSavedIds();
  const recentlyViewedIds = useRecentlyViewedIds();
  const searches = useSearches();
  const categories = useActiveCategories();

  const [searchQuery, setSearchQuery] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // WATCHER
  // ============================================================
  useEffect(() => {
    checkSavedListingsChanges();

    const interval = setInterval(() => {
      checkSavedListingsChanges();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // STATS
  // ============================================================
  const stats = useMemo(() => {
    const totalAvailable = listings.filter((l) => l.status === "live").length;
    const savedCount = savedIds.length;
    const recentlyViewedCount = recentlyViewedIds.length;
    const activeSearches = searches.length;

    return {
      totalAvailable,
      savedCount,
      recentlyViewedCount,
      activeSearches,
    };
  }, [listings, savedIds, recentlyViewedIds, searches]);

  // ============================================================
  // RECOMMENDED
  // ============================================================
  const recommended = useMemo(() => {
    return listings
      .filter((l) => l.status === "live")
      .sort((a, b) => {
        const aScore =
          (a.boostExpiresAt ? 2 : 0) + (a.leadingExpiresAt ? 1 : 0);
        const bScore =
          (b.boostExpiresAt ? 2 : 0) + (b.leadingExpiresAt ? 1 : 0);
        if (aScore !== bScore) return bScore - aScore;
        return (b.views || 0) - (a.views || 0);
      })
      .slice(0, 4);
  }, [listings]);

  // ============================================================
  // NEW LISTINGS
  // ============================================================
  const newListings = useMemo(() => {
    return listings
      .filter((l) => l.status === "live")
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
      .slice(0, 4);
  }, [listings]);

  // ============================================================
  // RECENTLY VIEWED
  // ============================================================
  const recentlyViewedListings = useMemo(() => {
    return recentlyViewedIds
      .map((id) => listings.find((l) => l.id === id))
      .filter(Boolean)
      .slice(0, 4);
  }, [recentlyViewedIds, listings]);

  // ============================================================
  // NEARBY
  // ============================================================
  const nearby = useMemo(() => {
    const userRegion = "Dar es Salaam";
    return listings
      .filter((l) => l.status === "live" && l.region === userRegion)
      .slice(0, 4);
  }, [listings]);

  // ============================================================
  // QUICK ACTIONS
  // ============================================================
  const quickActions = [
    {
      key: "browse",
      label: t("Tafuta Mali", "Browse"),
      icon: LayoutGrid,
      color: COLORS.green,
    },
    {
      key: "saved",
      label: t("Zilizohifadhiwa", "Saved"),
      icon: Heart,
      color: COLORS.rust,
    },
    {
      key: "searches",
      label: t("Utafutaji Wangu", "My Searches"),
      icon: Bell,
      color: "#2563EB",
    },
    {
      key: "deals",
      label: t("Vyumba vya Majadiliano", "Deal Rooms"),
      icon: MessagesSquare,
      color: COLORS.gold,
    },
    {
      key: "messages",
      label: t("Ujumbe", "Messages"),
      icon: MessageSquare,
      color: COLORS.night,
    },
    {
      key: "safety",
      label: t("Usalama & Msaada", "Safety & Support"),
      icon: Shield,
      color: COLORS.rust,
    },
  ];

  // ============================================================
  // SEARCH
  // ============================================================
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tafuta?tafuta=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/tafuta");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* ============================================================ */}
      {/* WELCOME — CENTERED */}
      {/* ============================================================ */}
      <div className="mb-6 text-center">
        <h1 className="h-title">
          {t(
            `Karibu, ${user?.name?.split(" ")[0] || "Mnunuzi"} 👋`,
            `Welcome, ${user?.name?.split(" ")[0] || "Buyer"} 👋`
          )}
        </h1>
        <p className="text-body-sm text-secondary mt-2 max-w-xl mx-auto">
          {t(
            "Tafuta mali unayoitafuta, hifadhi, na fuatilia deals zako.",
            "Find the property you're looking for, save, and track your deals."
          )}
        </p>
      </div>

      {/* ============================================================ */}
      {/* JINSI YA KUNUNUA — onboarding guide, inaonekana mara ya kwanza */}
      {/* ============================================================ */}
      <HowToBuyGuide lang={lang} />

      {/* ============================================================ */}
      {/* SEARCH BAR — CENTERED */}
      {/* ============================================================ */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-2xl mx-auto">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Unatafuta nini?", "What are you looking for?")}
            className="w-full rounded-full border pl-12 pr-32 py-3.5 text-sm outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-all"
            style={{
              background: "white",
              borderColor: COLORS.sandLine,
              color: COLORS.night,
            }}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-full font-semibold text-btn hover:opacity-90 transition-opacity"
            style={{ background: COLORS.gold, color: COLORS.night }}
          >
            {t("Tafuta", "Search")}
          </button>
        </div>
      </form>

      {/* ============================================================ */}
      {/* QUICK STATS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatTile
          label={t("Mali Zinazopatikana", "Available Listings")}
          value={stats.totalAvailable}
          icon={LayoutGrid}
          color={COLORS.green}
          size="sm"
        />
        <StatTile
          label={t("Zilizohifadhiwa", "Saved")}
          value={stats.savedCount}
          icon={Heart}
          color={COLORS.rust}
          size="sm"
        />
        <StatTile
          label={t("Zilizoangaliwa", "Recently Viewed")}
          value={stats.recentlyViewedCount}
          icon={Eye}
          color={COLORS.gold}
          size="sm"
        />
        <StatTile
          label={t("Utafutaji Wangu", "My Searches")}
          value={stats.activeSearches}
          icon={Bell}
          color="#2563EB"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
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
              <span className="text-body-sm font-semibold text-secondary text-center leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CATEGORIES — header centered */}
      {/* ============================================================ */}
      <div className="mb-6">
        <div className="flex flex-col items-center gap-1 mb-4 text-center">
          <h2 className="h-card">
            {t("Kategoria", "Categories")}
          </h2>
          <button
            onClick={() => navigate("/kategoria")}
            className="text-body-sm font-semibold hover:underline"
            style={{ color: COLORS.gold }}
          >
            {t("Ona Zote →", "View All →")}
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {categories.slice(0, 6).map((cat) => {
            const Icon = getCategoryIcon(cat.iconKey);
            const hasPhoto = Boolean(cat.imageUrl);
            const catLabel = cat.label?.[lang] || cat.label?.sw || cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => navigate(`/kategoria/${cat.key}`)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
              >
                {hasPhoto ? (
                  <img
                    src={cat.imageUrl}
                    alt={catLabel}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    style={{ background: `${COLORS.night}0D` }}
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                  >
                    <Icon size={18} color={COLORS.night} />
                  </div>
                )}
                <span className="text-body-sm font-semibold text-secondary text-center line-clamp-2">
                  {catLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTIONS ZA LISTINGS */}
      {/* ============================================================ */}
      {recommended.length > 0 && (
        <ListingSection
          title={t("Zinazopendekezwa", "Recommended")}
          icon={Star}
          iconColor={COLORS.gold}
          listings={recommended}
          lang={lang}
          onViewAll={() => onNavigate("browse")}
          navigate={navigate}
        />
      )}

      {recentlyViewedListings.length > 0 && (
        <ListingSection
          title={t("Zilizoangaliwa Hivi Karibuni", "Recently Viewed")}
          icon={Eye}
          iconColor={COLORS.gold}
          listings={recentlyViewedListings}
          lang={lang}
          onViewAll={() => onNavigate("browse")}
          navigate={navigate}
        />
      )}

      {newListings.length > 0 && (
        <ListingSection
          title={t("Mali Mpya", "New Listings")}
          icon={TrendingUp}
          iconColor={COLORS.green}
          listings={newListings}
          lang={lang}
          onViewAll={() => onNavigate("browse")}
          navigate={navigate}
        />
      )}

      {nearby.length > 0 && (
        <ListingSection
          title={t("Karibu Nawe", "Near You")}
          icon={MapPin}
          iconColor={COLORS.rust}
          listings={nearby}
          lang={lang}
          onViewAll={() => onNavigate("browse")}
          navigate={navigate}
        />
      )}

      {/* ============================================================ */}
      {/* RECENT ACTIVITY */}
      {/* ============================================================ */}
      <RecentActivity onNavigate={onNavigate} side="buyer" />
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
// JINSI YA KUNUNUA — onboarding guide kwa buyer dashboard
// ============================================================
function HowToBuyGuide({ lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const STORAGE_KEY = "sokomkononi_buyer_guide_dismissed_v1";

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

  const stepsBeforeNote = [
    t('Bonyeza "Nunua Sasa"', 'Tap "Buy Now"'),
    t("Chagua Aina ya Mali", "Choose Property Type"),
    t(
      "Tafuta na Chagua Mali Unayoitaka",
      "Search and Select the Property You Want"
    ),
    t(
      "Wasiliana na Muuzaji kupitia Deal Room",
      "Contact the Seller via the Deal Room"
    ),
    t("Fanya Makubaliano ya Bei", "Negotiate the Price"),
    t("Muuzaji Akikubali", "Once the Seller Accepts"),
    t("Lipia Reservation", "Pay the Reservation Fee"),
  ];

  const stepsAfterNote = [
    t("Kamilisha Malipo", "Complete Payment"),
    t("Kamilisha Mchakato wa Ununuzi", "Complete the Purchase Process"),
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="w-4" aria-hidden="true" />
        <h2 className="h-card text-center flex-1">
          {t("Jinsi ya Kununua", "How to Buy")}
        </h2>
        <button
          onClick={handleDismiss}
          aria-label={t("Ficha", "Dismiss")}
          className="text-muted hover:text-secondary shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      <StepFlow steps={stepsBeforeNote} />

      <div
        style={{ background: "rgba(37,99,235,0.06)", color: "#1D4ED8" }}
        className="flex items-start gap-2 rounded-lg px-3 py-3 my-4 max-w-2xl mx-auto text-body-sm leading-relaxed"
      >
        <Lock size={14} className="shrink-0 mt-0.5" />
        <span>
          {t(
            "Reservation huweka mali kwenye hali ya kuhifadhiwa kwa muda maalum, huku ukikamilisha hatua muhimu kama ukaguzi wa mali, uthibitishaji wa nyaraka na maandalizi ya malipo.",
            "A Reservation holds the property for a set period while you complete key steps such as inspecting the property, verifying documents, and preparing payment."
          )}
        </span>
      </div>

      <StepFlow steps={stepsAfterNote} />

      <div
        style={{ background: "rgba(47,109,79,0.08)", color: COLORS.green }}
        className="text-center text-body-sm font-medium rounded-lg px-4 py-3 mt-4 max-w-2xl mx-auto"
      >
        🎉{" "}
        {t(
          "Hongera! Umefanikiwa kukamilisha ununuzi wa mali kupitia SokoMkononi.",
          "Congratulations! You've successfully completed a property purchase through SokoMkononi."
        )}
      </div>
    </div>
  );
}

// ============================================================
// LISTING SECTION — header centered
// ============================================================
function ListingSection({
  title,
  icon: Icon,
  iconColor,
  listings,
  lang,
  onViewAll,
  navigate,
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div className="mb-6">
      <div className="flex flex-col items-center gap-1 mb-4 text-center">
        <h2 className="h-card flex items-center gap-2">
          <Icon size={16} color={iconColor} />
          {title}
        </h2>
        <button
          onClick={onViewAll}
          className="text-body-sm font-semibold hover:underline"
          style={{ color: COLORS.gold }}
        >
          {t("Ona Zote →", "View All →")}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {listings.map((l) => (
          <button
            key={l.id}
            onClick={() => navigate(`/mali/${l.id}`)}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow text-left"
          >
            <div className="w-full h-28 sm:h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
              {l.imageUrl ? (
                <img
                  src={l.imageUrl}
                  alt={l.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <LayoutGrid size={24} className="text-muted" />
              )}
            </div>
            <div className="p-3">
              <p className="h-card truncate">
                {l.title}
              </p>
              <p className="text-body-sm text-secondary truncate mt-0.5 flex items-center gap-1">
                <MapPin size={10} />
                {l.location}
              </p>
              <p
                className="text-price mt-1.5"
                style={{ color: COLORS.rust }}
              >
                {formatTZS(l.price)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

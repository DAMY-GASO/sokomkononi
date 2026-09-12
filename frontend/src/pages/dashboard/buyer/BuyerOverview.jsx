// ============================================================
// BuyerOverview.jsx
// Muhtasari wa mnunuzi — search, categories, listings, quick actions.
// Bilingual + mobile-responsive.
// ============================================================

import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import { COLORS, FONTS, formatTZS, timeAgo } from "../components/shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { usePublicListings } from "../../../config/listingsStore.js";
import { useSavedIds } from "../../../config/savedStore.js";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../../../config/categoriesStore.js";
import StatTile from "../seller/StatTile.jsx";

export default function BuyerOverview({ onNavigate }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const listings = usePublicListings();
  const savedIds = useSavedIds();
  const categories = useActiveCategories();

  const [searchQuery, setSearchQuery] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // STATS — hesabu kutoka listings + saved
  // ============================================================
  const stats = useMemo(() => {
    const totalAvailable = listings.filter((l) => l.status === "live").length;
    const savedCount = savedIds.length;
    const recentlyViewedCount = 0; // itahesabiwa baadaye
    const activeDeals = 0; // itahesabiwa baadaye kutoka deals

    return {
      totalAvailable,
      savedCount,
      recentlyViewedCount,
      activeDeals,
    };
  }, [listings, savedIds]);

  // ============================================================
  // RECOMMENDED — listings zenye boost au leading
  // ============================================================
  const recommended = useMemo(() => {
    return listings
      .filter((l) => l.status === "live")
      .sort((a, b) => {
        const aScore = (a.boostExpiresAt ? 2 : 0) + (a.leadingExpiresAt ? 1 : 0);
        const bScore = (b.boostExpiresAt ? 2 : 0) + (b.leadingExpiresAt ? 1 : 0);
        if (aScore !== bScore) return bScore - aScore;
        return (b.views || 0) - (a.views || 0);
      })
      .slice(0, 4);
  }, [listings]);

  // ============================================================
  // NEW LISTINGS — zilizopost hivi karibuni
  // ============================================================
  const newListings = useMemo(() => {
    return listings
      .filter((l) => l.status === "live")
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
      .slice(0, 4);
  }, [listings]);

  // ============================================================
  // NEARBY — listings zenye region ya buyer (mock: Dar es Salaam)
  // ============================================================
  const nearby = useMemo(() => {
    // TODO: tumia user.location baadaye
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
      key: "deals",
      label: t("My Deals", "My Deals"),
      icon: MessagesSquare,
      color: COLORS.gold,
    },
    {
      key: "messages",
      label: t("Ujumbe", "Messages"),
      icon: MessageSquare,
      color: "#2563EB",
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
    <div style={{ fontFamily: FONTS.body }} className="p-4 sm:p-6">
      {/* GREETING */}
      <div className="mb-6">
        <h1
          style={{ fontFamily: FONTS.display, color: COLORS.night }}
          className="text-2xl sm:text-3xl font-semibold"
        >
          {t(
            `Karibu, ${user?.name?.split(" ")[0] || "Buyer"} 👋`,
            `Welcome, ${user?.name?.split(" ")[0] || "Buyer"} 👋`
          )}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t(
            "Tafuta mali unayoitafuta, hifadhi, na fuatilia deals zako.",
            "Find the property you're looking for, save, and track your deals."
          )}
        </p>
      </div>

      {/* SEARCH BAR */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-2xl">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
            style={{ background: COLORS.gold, color: COLORS.night }}
          >
            {t("Tafuta", "Search")}
          </button>
        </div>
      </form>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatTile
          label={t("Mali Zinazopatikana", "Available Listings")}
          value={stats.totalAvailable}
          icon={LayoutGrid}
          color={COLORS.green}
          size="sm"
          onClick={() => onNavigate("browse")}
        />
        <StatTile
          label={t("Zilizohifadhiwa", "Saved")}
          value={stats.savedCount}
          icon={Heart}
          color={COLORS.rust}
          size="sm"
          onClick={() => onNavigate("saved")}
        />
        <StatTile
          label={t("Zilizoangaliwa Hivi Karibuni", "Recently Viewed")}
          value={stats.recentlyViewedCount}
          icon={Eye}
          color={COLORS.gold}
          size="sm"
        />
        <StatTile
          label={t("Active Deals", "Active Deals")}
          value={stats.activeDeals}
          icon={MessagesSquare}
          color="#2563EB"
          size="sm"
          onClick={() => onNavigate("deals")}
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

      {/* CATEGORIES */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2
            style={{ color: COLORS.night }}
            className="text-sm font-semibold"
          >
            {t("Kategoria", "Categories")}
          </h2>
          <button
            onClick={() => onNavigate("browse")}
            className="text-xs font-semibold hover:underline"
            style={{ color: COLORS.gold }}
          >
            {t("Ona Zote →", "View All →")}
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
          {categories.slice(0, 6).map((cat) => {
            const Icon = getCategoryIcon(cat.iconKey);
            const hasPhoto = Boolean(cat.imageUrl);
            return (
              <button
                key={cat.key}
                onClick={() => navigate(`/kategoria/${cat.key}`)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
              >
                {hasPhoto ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.label?.sw}
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
                <span className="text-[10px] sm:text-xs font-semibold text-gray-700 text-center line-clamp-2">
                  {cat.label?.[lang] || cat.label?.sw}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RECOMMENDED */}
      {recommended.length > 0 && (
        <ListingSection
          title={t("Zinazopendekezwa", "Recommended")}
          icon={Star}
          iconColor={COLORS.gold}
          listings={recommended}
          lang={lang}
          onViewAll={() => onNavigate("browse")}
          savedIds={savedIds}
          navigate={navigate}
        />
      )}

      {/* NEW LISTINGS */}
      {newListings.length > 0 && (
        <ListingSection
          title={t("Mali Mpya", "New Listings")}
          icon={TrendingUp}
          iconColor={COLORS.green}
          listings={newListings}
          lang={lang}
          onViewAll={() => onNavigate("browse")}
          savedIds={savedIds}
          navigate={navigate}
        />
      )}

      {/* NEARBY */}
      {nearby.length > 0 && (
        <ListingSection
          title={t("Karibu Nawe", "Near You")}
          icon={MapPin}
          iconColor={COLORS.rust}
          listings={nearby}
          lang={lang}
          onViewAll={() => onNavigate("browse")}
          savedIds={savedIds}
          navigate={navigate}
        />
      )}
    </div>
  );
}

// ============================================================
// LISTING SECTION — kadi ya listings nne
// ============================================================
function ListingSection({
  title,
  icon: Icon,
  iconColor,
  listings,
  lang,
  onViewAll,
  savedIds,
  navigate,
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2
          style={{ color: COLORS.night }}
          className="text-sm font-semibold flex items-center gap-2"
        >
          <Icon size={16} color={iconColor} />
          {title}
        </h2>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold hover:underline"
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
                <LayoutGrid size={24} className="text-gray-300" />
              )}
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {l.title}
              </p>
              <p className="text-[11px] text-gray-500 truncate mt-0.5 flex items-center gap-1">
                <MapPin size={10} />
                {l.location}
              </p>
              <p
                className="text-sm font-bold mt-1.5"
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
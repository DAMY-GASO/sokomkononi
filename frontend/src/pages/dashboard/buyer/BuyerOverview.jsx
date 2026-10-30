// ============================================================
// BuyerOverview.jsx
// Muhtasari wa mnunuzi — search, categories, listings, quick actions.
// Bilingual kamili + mobile-responsive.
// KILA KITU CENTERED.
//
// Marekebisho:
//  - Ongeza "Uthibitisho Wangu" (My Verification) kwenye quick actions
//  - ⬅️ Chuja listings za seller mwenyewe (buyer haoni mali zake)
//  - ✅ Ondoa hatua za "Jinsi ya Kununua" — badala yake kitufe kikubwa
// ============================================================

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutGrid,
  Heart,
  MessagesSquare,
  TrendingUp,
  Clock3,
  Eye,
  MapPin,
  Star,
  Bell,
  Shield,
  ShieldCheck,
  ArrowRight,
  Lock,
  X,
  BookOpen,
} from "lucide-react";
import { COLORS, formatTZS } from "../components/shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { usePublicListings } from "../../../config/listingsStore.js";
import { useSavedIds } from "../../../config/savedStore.js";
import { useRecentlyViewedIds } from "../../../config/recentlyViewedStore.js";
import { useSearches } from "../../../config/searchesStore.js";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../../../config/categoriesStore.js";
import StatTile from "../seller/StatTile.jsx";
import RecentActivity from "../components/RecentActivity.jsx";
import ListingCard from "../../../components/ListingCard.jsx";
import CategoryTile from "../../../components/CategoryTile.jsx";

export default function BuyerOverview({ onNavigate }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const publicListings = usePublicListings();
  const savedIds = useSavedIds();
  const recentlyViewedIds = useRecentlyViewedIds();
  const searches = useSearches();
  const categories = useActiveCategories();

  const [searchQuery, setSearchQuery] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // ⬅️ Chuja listings za seller mwenyewe
  // ============================================================
  const listings = useMemo(() => {
    if (!user?.id) return publicListings;
    return publicListings.filter((l) => {
      const sellerId = l.sellerId ?? l.seller_id ?? l.seller?.id ?? null;
      return sellerId == null || String(sellerId) !== String(user.id);
    });
  }, [publicListings, user?.id]);

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
    const userRegion = user?.region || user?.location || "";
    return listings
      .filter((l) => l.status === "live" && l.region === userRegion)
      .slice(0, 4);
  }, [listings, user?.region, user?.location]);

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
      color: COLORS.royal,
    },
    {
      key: "deals",
      label: t("Vyumba vya Majadiliano", "Deal Rooms"),
      icon: MessagesSquare,
      color: COLORS.gold,
    },
    {
      key: "verification",
      label: t("Uthibitisho Wangu", "My Verification"),
      icon: ShieldCheck,
      color: "#7C3AED",
    },
    {
      key: "safety",
      label: t("Msaada", "Support"),
      icon: Shield,
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
    <div className="p-4 sm:p-6">
      {/* WELCOME */}
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

      {/* ✅ KITUFE KIKUBWA: Jinsi ya Kununua (Badala ya Steps) */}
      <button
        type="button"
        onClick={() => navigate("/jinsi-ya-kununua")}
        className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 mb-6 hover:border-gold hover:shadow-sm transition-all text-left"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(0,98,253,0.08)" }}
        >
          <BookOpen size={22} color={COLORS.royal} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-primary text-sm">
            {t("Jinsi ya Kununua", "How to Buy")}
          </p>
          <p className="text-body-sm text-secondary mt-0.5">
            {t(
              "Bonyeza hapa kuelewa hatua zote za ununuzi",
              "Tap here to understand all steps of a purchase"
            )}
          </p>
        </div>
        <ArrowRight size={18} className="text-muted shrink-0" />
      </button>

      {/* SEARCH BAR */}
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
            className="w-full rounded-full border pl-12 pr-32 py-3.5 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20 transition-all"
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

      {/* QUICK STATS */}
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
          color={COLORS.royal}
          size="sm"
        />
      </div>

      {/* QUICK ACTIONS */}
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

      {/* CATEGORIES */}
      <div className="mb-6">
        <div className="flex flex-col items-center gap-1 mb-4 text-center">
          <h2 className="h-card">{t("Kategoria", "Categories")}</h2>
          <button
            onClick={() => navigate("/kategoria")}
            className="text-body-sm font-semibold hover:underline"
            style={{ color: COLORS.goldInk }}
          >
            {t("Ona Zote →", "View All →")}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.slice(0, 6).map((cat) => {
            const Icon = getCategoryIcon(cat.iconKey);
            const catLabel = cat.label?.[lang] || cat.label?.sw || cat.key;
            return (
              <CategoryTile
                key={cat.key}
                to={`/kategoria/${cat.key}`}
                label={catLabel}
                imageUrl={cat.imageUrl}
                Icon={Icon}
              />
            );
          })}
        </div>
      </div>

      {/* LISTINGS */}
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

      {/* RECENT ACTIVITY */}
      <RecentActivity onNavigate={onNavigate} side="buyer" />
    </div>
  );
}

// ============================================================
// LISTING SECTION
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
  const categories = useActiveCategories();

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

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {listings.map((l) => {
          const cat = categories.find((c) => c.key === l.category);
          const CatIcon = getCategoryIcon(cat?.iconKey || "Home");
          return (
            <ListingCard
              key={l.id}
              listing={l}
              category={cat}
              Icon={CatIcon}
              lang={lang}
            />
          );
        })}
      </div>
    </div>
  );
}
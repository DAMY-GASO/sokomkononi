import React, { useState, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  MapPin,
  Heart,
  Grid3x3,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  Search,
  Home as HomeIcon,
  Star,
  Shield,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock3,
  Ban,
} from "lucide-react";
import { usePublicListings } from "../config/listingsStore.js";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../config/categoriesStore.js";
import {
  isBoostActive,
  isLeadingActive,
  formatTZS,
  timeAgo,
} from "./dashboard/components/shared";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  sandLine: "#E6E2D6",
};

// ============================================================
// HELPERS
// ============================================================
function reservationCountdown(reservedUntil, lang) {
  if (!reservedUntil) return "";
  const ms = new Date(reservedUntil).getTime() - Date.now();
  if (ms <= 0) return lang === "sw" ? "Inaisha hivi karibuni" : "Ending soon";
  const hours = Math.floor(ms / 3600000);
  if (hours < 24)
    return lang === "sw" ? `Inaisha baada ya saa ${hours}` : `Ends in ${hours}hrs`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0)
    return lang === "sw" ? `Inaisha baada ya siku ${days}` : `Ends in ${days} days`;
  return lang === "sw"
    ? `Inaisha baada ya siku ${days} ${remainingHours}saa`
    : `Ends in ${days}d ${remainingHours}h`;
}

// ============================================================
// FILTER SIDEBAR
// ============================================================
function FilterSidebar({ category, filters, setFilters, isOpen, onClose, lang }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const priceRanges = {
    nyumba: [
      { label: "Chini ya TZS 50M", min: 0, max: 50000000 },
      { label: "TZS 50M - 100M", min: 50000000, max: 100000000 },
      { label: "TZS 100M - 200M", min: 100000000, max: 200000000 },
      { label: "Juu ya TZS 200M", min: 200000000, max: Infinity },
    ],
    viwanja: [
      { label: "Chini ya TZS 10M", min: 0, max: 10000000 },
      { label: "TZS 10M - 20M", min: 10000000, max: 20000000 },
      { label: "TZS 20M - 50M", min: 20000000, max: 50000000 },
      { label: "Juu ya TZS 50M", min: 50000000, max: Infinity },
    ],
    magari: [
      { label: "Chini ya TZS 20M", min: 0, max: 20000000 },
      { label: "TZS 20M - 50M", min: 20000000, max: 50000000 },
      { label: "TZS 50M - 100M", min: 50000000, max: 100000000 },
      { label: "Juu ya TZS 100M", min: 100000000, max: Infinity },
    ],
    biashara: [
      { label: "Chini ya TZS 20M", min: 0, max: 20000000 },
      { label: "TZS 20M - 50M", min: 20000000, max: 50000000 },
      { label: "TZS 50M - 100M", min: 50000000, max: 100000000 },
      { label: "Juu ya TZS 100M", min: 100000000, max: Infinity },
    ],
    mashine: [
      { label: "Chini ya TZS 30M", min: 0, max: 30000000 },
      { label: "TZS 30M - 70M", min: 30000000, max: 70000000 },
      { label: "TZS 70M - 150M", min: 70000000, max: 150000000 },
      { label: "Juu ya TZS 150M", min: 150000000, max: Infinity },
    ],
  };

  const defaultRanges = [
    { label: "Chini ya TZS 20M", min: 0, max: 20000000 },
    { label: "TZS 20M - 50M", min: 20000000, max: 50000000 },
    { label: "TZS 50M - 100M", min: 50000000, max: 100000000 },
    { label: "Juu ya TZS 100M", min: 100000000, max: Infinity },
  ];

  const activeRanges = priceRanges[category] || defaultRanges;

  const handleApply = () => {
    setFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({ priceRange: null, verified: false, featured: false });
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={16} />
          {lang === "sw" ? "Vichujio" : "Filters"}
        </h3>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {lang === "sw" ? "Bei" : "Price"}
        </h4>
        <div className="space-y-2">
          {activeRanges.map((range, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priceRange"
                checked={localFilters.priceRange === idx}
                onChange={() =>
                  setLocalFilters({ ...localFilters, priceRange: idx })
                }
                className="w-4 h-4 text-[#E8A33D] focus:ring-[#E8A33D]"
              />
              <span className="text-sm text-gray-600">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {lang === "sw" ? "Vigezo Vingine" : "Other"}
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.verified}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, verified: e.target.checked })
              }
              className="w-4 h-4 rounded text-[#E8A33D] focus:ring-[#E8A33D]"
            />
            <span className="text-sm text-gray-600">
              {lang === "sw" ? "Zilizothibitishwa tu" : "Verified only"}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.featured}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, featured: e.target.checked })
              }
              className="w-4 h-4 rounded text-[#E8A33D] focus:ring-[#E8A33D]"
            />
            <span className="text-sm text-gray-600">
              {lang === "sw" ? "Featured tu" : "Featured only"}
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-100">
        <button
          onClick={handleApply}
          className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          {lang === "sw" ? "Tumia Vichujio" : "Apply Filters"}
        </button>
        <button
          onClick={handleReset}
          className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          {lang === "sw" ? "Safisha" : "Reset"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
          {content}
        </div>
      </aside>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={onClose} />
          <div className="w-80 max-w-[85%] bg-white h-full overflow-y-auto p-5">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();

  const allCategories = useActiveCategories();
  const categoryKey = slug || allCategories[0]?.key || "nyumba";
  const categoryInfo = allCategories.find((c) => c.key === categoryKey);

  const CategoryIcon = getCategoryIcon(categoryInfo?.iconKey);
  const categoryLabel =
    categoryInfo?.label?.[lang] || categoryInfo?.label?.sw || categoryKey;
  const categoryDescription =
    categoryInfo?.description?.[lang] || categoryInfo?.description?.sw || "";
  const categoryImage = categoryInfo?.imageUrl || null;
  const hasCategoryImage = Boolean(categoryImage);

  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({
    priceRange: null,
    verified: false,
    featured: false,
  });
  const [savedIds, setSavedIds] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("tafuta") || ""
  );
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  const allPublic = usePublicListings();
  const allProperties = useMemo(
    () => allPublic.filter((l) => l.category === categoryKey),
    [allPublic, categoryKey]
  );

  const filteredProperties = useMemo(() => {
    let result = [...allProperties];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }

    if (filters.verified) result = result.filter((p) => p.verified);
    if (filters.featured) result = result.filter((p) => isBoostActive(p));

    if (filters.priceRange !== null) {
      const ranges = {
        nyumba: [
          [0, 50000000],
          [50000000, 100000000],
          [100000000, 200000000],
          [200000000, Infinity],
        ],
        viwanja: [
          [0, 10000000],
          [10000000, 20000000],
          [20000000, 50000000],
          [50000000, Infinity],
        ],
        magari: [
          [0, 20000000],
          [20000000, 50000000],
          [50000000, 100000000],
          [100000000, Infinity],
        ],
        biashara: [
          [0, 20000000],
          [20000000, 50000000],
          [50000000, 100000000],
          [100000000, Infinity],
        ],
        mashine: [
          [0, 30000000],
          [30000000, 70000000],
          [70000000, 150000000],
          [150000000, Infinity],
        ],
      };
      const fallback = [
        [0, 20000000],
        [20000000, 50000000],
        [50000000, 100000000],
        [100000000, Infinity],
      ];
      const [min, max] = (ranges[categoryKey] || fallback)[
        filters.priceRange
      ];
      result = result.filter((p) => p.price >= min && p.price < max);
    }

    const sortComparator = (a, b) => {
      switch (sortBy) {
        case "price_low":
          return a.price - b.price;
        case "price_high":
          return b.price - a.price;
        case "popular":
          return (b.views || 0) - (a.views || 0);
        case "newest":
        default:
          return new Date(b.postedAt) - new Date(a.postedAt);
      }
    };

    const statusRank = (p) =>
      p.status === "live" ? 0 : p.status === "reserved" ? 1 : 2;

    result.sort((a, b) => {
      const aLeading = isLeadingActive(a) ? 1 : 0;
      const bLeading = isLeadingActive(b) ? 1 : 0;
      if (aLeading !== bLeading) return bLeading - aLeading;
      const aRank = statusRank(a);
      const bRank = statusRank(b);
      if (aRank !== bRank) return aRank - bRank;
      return sortComparator(a, b);
    });

    return result;
  }, [allProperties, searchQuery, filters, sortBy, categoryKey]);

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSave = (id) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // Kama category haipo (slug si sahihi)
  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <HomeIcon size={64} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {lang === "sw" ? "Category haipatikani" : "Category not found"}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {lang === "sw"
              ? "Category hii haipo au imezimwa. Tafuta mali nyingine."
              : "This category doesn't exist or has been disabled. Browse other properties."}
          </p>
          <Link
            to="/kategoria"
            className="inline-block bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            {lang === "sw" ? "Ona Categories Zote" : "View All Categories"}
          </Link>
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="bg-[#101A2E] text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link to="/" className="hover:text-white transition-colors">
              {lang === "sw" ? "Nyumbani" : "Home"}
            </Link>
            <ChevronRight size={14} />
            <span className="text-white">{categoryLabel}</span>
          </nav>

          <div className="flex items-center gap-4">
            {/* === CATEGORY IMAGE / ICON === */}
            {hasCategoryImage ? (
              <img
                src={categoryImage}
                alt={categoryLabel}
                className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#E8A33D]/20 flex items-center justify-center flex-shrink-0">
                <CategoryIcon size={28} color={COLORS.gold} />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {categoryLabel}
              </h1>
              {categoryDescription && (
                <p className="text-white/60 text-sm mt-1">
                  {categoryDescription}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="mt-6 max-w-2xl">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === "sw"
                    ? "Tafuta kwenye category hii..."
                    : "Search in this category..."
                }
                className="w-full bg-white/10 border border-white/20 rounded-full pl-12 pr-32 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/30 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] px-5 py-2 rounded-full font-semibold text-sm transition-colors"
              >
                {lang === "sw" ? "Tafuta" : "Search"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <FilterSidebar
            category={categoryKey}
            filters={filters}
            setFilters={setFilters}
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            lang={lang}
          />

          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">
                  {filteredProperties.length}
                </span>{" "}
                {lang === "sw" ? "mali zimepatikana" : "properties found"}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  {lang === "sw" ? "Vichujio" : "Filters"}
                </button>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#E8A33D] cursor-pointer"
                  >
                    <option value="newest">
                      {lang === "sw" ? "Mpya Kwanza" : "Newest First"}
                    </option>
                    <option value="price_low">
                      {lang === "sw"
                        ? "Bei: Chini → Juu"
                        : "Price: Low → High"}
                    </option>
                    <option value="price_high">
                      {lang === "sw"
                        ? "Bei: Juu → Chini"
                        : "Price: High → Low"}
                    </option>
                    <option value="popular">
                      {lang === "sw" ? "Maarufu" : "Popular"}
                    </option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>

                <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 transition-colors ${
                      viewMode === "grid"
                        ? "bg-[#E8A33D] text-[#101A2E]"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid3x3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${
                      viewMode === "list"
                        ? "bg-[#E8A33D] text-[#101A2E]"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                    aria-label="List view"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {(filters.priceRange !== null ||
              filters.verified ||
              filters.featured ||
              searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-gray-500">
                  {lang === "sw"
                    ? "Vichujio vilivyotumika:"
                    : "Active filters:"}
                </span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 bg-[#E8A33D]/10 text-[#8A5A16] text-xs px-2.5 py-1 rounded-full">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery("")}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.verified && (
                  <span className="inline-flex items-center gap-1 bg-[#2F6D4F]/10 text-[#2F6D4F] text-xs px-2.5 py-1 rounded-full">
                    Verified
                    <button
                      onClick={() =>
                        setFilters({ ...filters, verified: false })
                      }
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.featured && (
                  <span className="inline-flex items-center gap-1 bg-[#E8A33D]/10 text-[#8A5A16] text-xs px-2.5 py-1 rounded-full">
                    Featured
                    <button
                      onClick={() =>
                        setFilters({ ...filters, featured: false })
                      }
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilters({
                      priceRange: null,
                      verified: false,
                      featured: false,
                    });
                    setSearchQuery("");
                  }}
                  className="text-xs text-[#C1502E] hover:underline font-medium"
                >
                  {lang === "sw" ? "Safisha zote" : "Clear all"}
                </button>
              </div>
            )}

            {paginatedProperties.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                      : "flex flex-col gap-3"
                  }
                >
                  {paginatedProperties.map((property) => (
                    <CategoryPropertyCard
                      key={property.id}
                      property={property}
                      viewMode={viewMode}
                      isSaved={savedIds.includes(property.id)}
                      onToggleSave={toggleSave}
                      lang={lang}
                      categoryImage={categoryImage}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage === 1}
                      className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? "bg-[#E8A33D] text-[#101A2E]"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-800">
                  {lang === "sw"
                    ? "Hakuna mali iliyopatikana"
                    : "No properties found"}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {lang === "sw"
                    ? "Jaribu kubadilisha vichujio au utafutaji wako"
                    : "Try changing your filters or search"}
                </p>
                <button
                  onClick={() => {
                    setFilters({
                      priceRange: null,
                      verified: false,
                      featured: false,
                    });
                    setSearchQuery("");
                  }}
                  className="mt-4 px-5 py-2 bg-[#E8A33D] text-[#101A2E] rounded-lg text-sm font-semibold hover:bg-[#B87A1F] transition-colors"
                >
                  {lang === "sw" ? "Safisha Vichujio" : "Clear Filters"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
}

// ============================================================
// CATEGORY PROPERTY CARD — inaonyesha picha ya category kama
// imageUrl ipo, vinginevyo icon
// ============================================================
function CategoryPropertyCard({
  property,
  viewMode,
  isSaved,
  onToggleSave,
  lang,
  categoryImage,
}) {
  const categoryInfo = useActiveCategories().find(
    (c) => c.key === property.category
  );
  const Icon = getCategoryIcon(categoryInfo?.iconKey);
  const hasImage = Boolean(categoryImage);
  const isFeatured = isBoostActive(property);
  const isLeading = isLeadingActive(property);
  const isVerified = Boolean(property.verified);
  const isReserved = property.status === "reserved";
  const isSold = property.status === "sold";

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSave(property.id);
  };

  if (viewMode === "list") {
    return (
      <div
        className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow flex flex-col sm:flex-row ${
          isSold ? "border-gray-200 opacity-75" : "border-gray-100"
        }`}
      >
        <Link
          to={`/mali/${property.id}`}
          className="w-full sm:w-48 h-48 sm:h-auto bg-gray-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden"
        >
          {hasImage ? (
            <img
              src={categoryImage}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon size={32} className="text-gray-300" />
          )}
          {isReserved && (
            <span className="absolute top-2 left-2 bg-[#E8A33D] text-[#101A2E] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Clock3 size={10} /> RESERVED
            </span>
          )}
          {isSold && (
            <span className="absolute top-2 left-2 bg-[#101A2E] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Ban size={10} /> SOLD
            </span>
          )}
        </Link>
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/mali/${property.id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-gray-800 text-sm hover:text-[#E8A33D] transition-colors">
                  {property.title}
                </h3>
                {isLeading && (
                  <span className="shrink-0 bg-[#2F6D4F]/10 text-[#2F6D4F] text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <TrendingUp size={9} /> Priority
                  </span>
                )}
              </div>
            </Link>
            <button
              onClick={handleSave}
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                isSaved
                  ? "bg-[#C1502E] text-white"
                  : "text-gray-400 hover:text-[#C1502E]"
              }`}
            >
              <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <MapPin size={12} />
            {property.location}
          </div>
          <p className="text-[#C1502E] font-bold text-base mt-2">
            {formatTZS(property.price)}
          </p>
          {isReserved && property.reservedUntil && (
            <p className="text-[11px] font-medium text-[#8A5A16] mt-1 flex items-center gap-1">
              <Clock3 size={11} />{" "}
              {reservationCountdown(property.reservedUntil, lang)}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
            {property.bedrooms && <span>🛏 {property.bedrooms}</span>}
            {property.bathrooms && <span>🚿 {property.bathrooms}</span>}
            {property.area && <span>📐 {property.area}</span>}
            {property.titleStatus && <span>📜 {property.titleStatus}</span>}
            {property.make && (
              <span>
                🚗 {property.make} {property.model}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Eye size={12} /> {property.views || 0}
              </span>
              <span>•</span>
              <span>{timeAgo(property.postedAt, lang)}</span>
            </div>
            {isVerified && (
              <span className="flex items-center gap-1 text-xs text-[#2F6D4F] font-medium">
                <Shield size={12} /> Verified
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all group ${
        isSold ? "border-gray-200 opacity-75" : "border-gray-100"
      }`}
    >
      <Link to={`/mali/${property.id}`} className="block relative">
        <div className="w-full h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
          {hasImage ? (
            <img
              src={categoryImage}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <Icon
              size={40}
              className="text-gray-300 group-hover:scale-110 transition-transform"
            />
          )}
        </div>

        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {isLeading && (
            <span className="bg-[#2F6D4F] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={10} /> Search Priority
            </span>
          )}
          {isFeatured && (
            <span className="bg-[#E8A33D] text-[#101A2E] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star size={10} fill="#101A2E" /> Featured
            </span>
          )}
          {isReserved && (
            <span className="bg-[#E8A33D] text-[#101A2E] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Clock3 size={10} /> RESERVED
            </span>
          )}
          {isSold && (
            <span className="bg-[#101A2E] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Ban size={10} /> SOLD
            </span>
          )}
        </div>

        {isVerified && (
          <span className="absolute top-2 right-2 bg-[#2F6D4F] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Shield size={10} /> Verified
          </span>
        )}
        <button
          onClick={handleSave}
          className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isSaved
              ? "bg-[#C1502E] text-white"
              : "bg-white/90 text-gray-400 hover:text-[#C1502E]"
          }`}
        >
          <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </Link>
      <Link to={`/mali/${property.id}`} className="block p-4">
        <h3 className="font-semibold text-gray-800 text-sm truncate">
          {property.title}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <MapPin size={12} />
          <span className="truncate">{property.location}</span>
        </div>
        <p className="text-[#C1502E] font-bold text-base mt-2">
          {formatTZS(property.price)}
        </p>
        {isReserved && property.reservedUntil && (
          <p className="text-[11px] font-medium text-[#8A5A16] mt-1 flex items-center gap-1">
            <Clock3 size={11} />{" "}
            {reservationCountdown(property.reservedUntil, lang)}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
          {property.bedrooms && <span>🛏 {property.bedrooms}</span>}
          {property.bathrooms && <span>🚿 {property.bathrooms}</span>}
          {property.area && <span>📐 {property.area}</span>}
          {property.titleStatus && <span>📜 {property.titleStatus}</span>}
          {property.make && <span>🚗 {property.year}</span>}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Eye size={12} /> {property.views || 0}
          </span>
          <span>{timeAgo(property.postedAt, lang)}</span>
        </div>
      </Link>
    </div>
  );
}

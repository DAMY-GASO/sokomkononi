import React, { useState, useMemo, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import ListingCard from "../components/ListingCard.jsx";
import {
  Grid3x3,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  Search,
  Home as HomeIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { usePublicListings } from "../config/listingsStore.js";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../config/categoriesStore.js";
import { useSavedIds, toggleSaved } from "../config/savedStore.js";
import {
  COLORS,
  isBoostActive,
  isLeadingActive,
} from "./dashboard/components/shared";

// ============================================================
// HELPERS — bilingual + comma
// ============================================================
function t(lang, sw, en) {
  return lang === "sw" ? sw : en;
}

function formatNumberInput(value) {
  if (!value) return "";
  const digits = String(value).replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function cleanNumberInput(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

// ============================================================
// PRICE RANGES — bilingual
// ============================================================
const PRICE_RANGES = {
  nyumba: [
    { label: { sw: "Chini ya TZS 50M", en: "Under TZS 50M" }, min: 0, max: 50000000 },
    { label: { sw: "TZS 50M - 100M", en: "TZS 50M - 100M" }, min: 50000000, max: 100000000 },
    { label: { sw: "TZS 100M - 200M", en: "TZS 100M - 200M" }, min: 100000000, max: 200000000 },
    { label: { sw: "Juu ya TZS 200M", en: "Above TZS 200M" }, min: 200000000, max: Infinity },
  ],
  viwanja: [
    { label: { sw: "Chini ya TZS 10M", en: "Under TZS 10M" }, min: 0, max: 10000000 },
    { label: { sw: "TZS 10M - 20M", en: "TZS 10M - 20M" }, min: 10000000, max: 20000000 },
    { label: { sw: "TZS 20M - 50M", en: "TZS 20M - 50M" }, min: 20000000, max: 50000000 },
    { label: { sw: "Juu ya TZS 50M", en: "Above TZS 50M" }, min: 50000000, max: Infinity },
  ],
  magari: [
    { label: { sw: "Chini ya TZS 20M", en: "Under TZS 20M" }, min: 0, max: 20000000 },
    { label: { sw: "TZS 20M - 50M", en: "TZS 20M - 50M" }, min: 20000000, max: 50000000 },
    { label: { sw: "TZS 50M - 100M", en: "TZS 50M - 100M" }, min: 50000000, max: 100000000 },
    { label: { sw: "Juu ya TZS 100M", en: "Above TZS 100M" }, min: 100000000, max: Infinity },
  ],
  biashara: [
    { label: { sw: "Chini ya TZS 20M", en: "Under TZS 20M" }, min: 0, max: 20000000 },
    { label: { sw: "TZS 20M - 50M", en: "TZS 20M - 50M" }, min: 20000000, max: 50000000 },
    { label: { sw: "TZS 50M - 100M", en: "TZS 50M - 100M" }, min: 50000000, max: 100000000 },
    { label: { sw: "Juu ya TZS 100M", en: "Above TZS 100M" }, min: 100000000, max: Infinity },
  ],
  mashine: [
    { label: { sw: "Chini ya TZS 30M", en: "Under TZS 30M" }, min: 0, max: 30000000 },
    { label: { sw: "TZS 30M - 70M", en: "TZS 30M - 70M" }, min: 30000000, max: 70000000 },
    { label: { sw: "TZS 70M - 150M", en: "TZS 70M - 150M" }, min: 70000000, max: 150000000 },
    { label: { sw: "Juu ya TZS 150M", en: "Above TZS 150M" }, min: 150000000, max: Infinity },
  ],
};

const DEFAULT_RANGES = [
  { label: { sw: "Chini ya TZS 20M", en: "Under TZS 20M" }, min: 0, max: 20000000 },
  { label: { sw: "TZS 20M - 50M", en: "TZS 20M - 50M" }, min: 20000000, max: 50000000 },
  { label: { sw: "TZS 50M - 100M", en: "TZS 50M - 100M" }, min: 50000000, max: 100000000 },
  { label: { sw: "Juu ya TZS 100M", en: "Above TZS 100M" }, min: 100000000, max: Infinity },
];

// ============================================================
// FILTER SIDEBAR — imeachwa kushoto
// ============================================================
function FilterSidebar({ category, filters, setFilters, isOpen, onClose, lang }) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const activeRanges = PRICE_RANGES[category] || DEFAULT_RANGES;

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
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <SlidersHorizontal size={16} />
          {t(lang, "Vichujio", "Filters")}
        </h3>
        <button
          onClick={onClose}
          className="lg:hidden text-muted hover:text-secondary"
          aria-label={t(lang, "Funga", "Close")}
        >
          <X size={20} />
        </button>
      </div>

      <div>
        <h4 className="text-sm font-medium text-primary mb-3">
          {t(lang, "Bei", "Price")}
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
                className="w-4 h-4 text-gold-ink focus:ring-gold"
              />
              <span className="text-sm text-secondary">
                {range.label?.[lang] || range.label?.sw}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-primary mb-3">
          {t(lang, "Vigezo Vingine", "Other")}
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.verified}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, verified: e.target.checked })
              }
              className="w-4 h-4 rounded text-gold-ink focus:ring-gold"
            />
            <span className="text-sm text-secondary">
              {t(lang, "Zilizothibitishwa tu", "Verified only")}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.featured}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, featured: e.target.checked })
              }
              className="w-4 h-4 rounded text-gold-ink focus:ring-gold"
            />
            <span className="text-sm text-secondary">
              {t(lang, "Featured tu", "Featured only")}
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-100">
        <button
          onClick={handleApply}
          className="w-full bg-gold hover:bg-flame text-night py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          {t(lang, "Tumia Vichujio", "Apply Filters")}
        </button>
        <button
          onClick={handleReset}
          className="w-full border border-gray-200 text-secondary hover:bg-gray-50 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          {t(lang, "Safisha", "Reset")}
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

  const allPublic = usePublicListings();
  const savedIds = useSavedIds();

  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({
    priceRange: null,
    verified: false,
    featured: false,
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("tafuta") || ""
  );
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

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
          p.title?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q)
      );
    }

    if (filters.verified) result = result.filter((p) => p.verified);
    if (filters.featured) result = result.filter((p) => isBoostActive(p));

    if (filters.priceRange !== null) {
      const ranges = PRICE_RANGES[categoryKey] || DEFAULT_RANGES;
      const range = ranges[filters.priceRange];
      if (range) {
        result = result.filter(
          (p) => p.price >= range.min && p.price < range.max
        );
      }
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortBy, categoryKey]);

  const handleToggleSave = (id) => {
    toggleSaved(id);
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
          <HomeIcon size={64} className="mx-auto text-muted mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-2">
            {t(lang, "Category haipatikani", "Category not found")}
          </h1>
          <p className="text-secondary text-sm mb-6">
            {t(
              lang,
              "Category hii haipo au imezimwa. Tafuta mali nyingine.",
              "This category doesn't exist or has been disabled. Browse other properties."
            )}
          </p>
          <Link
            to="/kategoria"
            className="inline-block bg-gold hover:bg-flame text-night px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            {t(lang, "Ona Categories Zote", "View All Categories")}
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

      {/* ============================================================ */}
      {/* HERO — CENTERED */}
      {/* ============================================================ */}
      <section className="dark-surface bg-night text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb — centered */}
          <nav className="flex items-center justify-center gap-2 text-sm text-white/60 mb-4">
            <Link to="/" className="hover:text-white transition-colors">
              {t(lang, "Nyumbani", "Home")}
            </Link>
            <ChevronRight size={14} />
            <span className="text-white">{categoryLabel}</span>
          </nav>

          {/* Icon + Title + Description — centered */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center flex-shrink-0">
              {CategoryIcon && <CategoryIcon size={28} color={COLORS.gold} />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {categoryLabel}
              </h1>
              {categoryDescription && (
                <p className="text-white/60 text-sm mt-2 max-w-xl mx-auto">
                  {categoryDescription}
                </p>
              )}
            </div>
          </div>

          {/* Search — centered */}
          <form onSubmit={handleSearchSubmit} className="mt-6 max-w-2xl mx-auto">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  lang,
                  "Tafuta kwenye category hii...",
                  "Search in this category..."
                )}
                className="w-full bg-white/10 border border-white/20 rounded-full pl-12 pr-32 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gold hover:bg-flame text-night px-5 py-2 rounded-full font-semibold text-sm transition-colors"
              >
                {t(lang, "Tafuta", "Search")}
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
              <p className="text-sm text-secondary">
                <span className="font-semibold text-primary">
                  {filteredProperties.length}
                </span>{" "}
                {t(lang, "mali zimepatikana", "properties found")}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-primary hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  {t(lang, "Vichujio", "Filters")}
                </button>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-primary focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="newest">
                      {t(lang, "Mpya Kwanza", "Newest First")}
                    </option>
                    <option value="price_low">
                      {t(lang, "Bei: Chini → Juu", "Price: Low → High")}
                    </option>
                    <option value="price_high">
                      {t(lang, "Bei: Juu → Chini", "Price: High → Low")}
                    </option>
                    <option value="popular">
                      {t(lang, "Maarufu", "Popular")}
                    </option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                  />
                </div>

                <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 transition-colors ${
                      viewMode === "grid"
                        ? "bg-gold text-night"
                        : "text-secondary hover:bg-gray-50"
                    }`}
                    aria-label={t(lang, "Grid", "Grid")}
                  >
                    <Grid3x3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${
                      viewMode === "list"
                        ? "bg-gold text-night"
                        : "text-secondary hover:bg-gray-50"
                    }`}
                    aria-label={t(lang, "Orodha", "List")}
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
                <span className="text-body-sm text-secondary">
                  {t(lang, "Vichujio vilivyotumika:", "Active filters:")}
                </span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 bg-gold/10 text-gold-ink text-body-sm px-2.5 py-1 rounded-full">
                    "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery("")}
                      aria-label={t(lang, "Ondoa", "Remove")}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.verified && (
                  <span className="inline-flex items-center gap-1 bg-green/10 text-green text-body-sm px-2.5 py-1 rounded-full">
                    {t(lang, "Zilizothibitishwa", "Verified")}
                    <button
                      onClick={() =>
                        setFilters({ ...filters, verified: false })
                      }
                      aria-label={t(lang, "Ondoa", "Remove")}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.featured && (
                  <span className="inline-flex items-center gap-1 bg-gold/10 text-gold-ink text-body-sm px-2.5 py-1 rounded-full">
                    {t(lang, "Featured", "Featured")}
                    <button
                      onClick={() =>
                        setFilters({ ...filters, featured: false })
                      }
                      aria-label={t(lang, "Ondoa", "Remove")}
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
                  className="text-body-sm text-rust hover:underline font-medium"
                >
                  {t(lang, "Safisha zote", "Clear all")}
                </button>
              </div>
            )}

            {paginatedProperties.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
                      : "flex flex-col gap-3"
                  }
                >
                  {paginatedProperties.map((property) => {
                    const cat = allCategories.find(
                      (c) => c.key === property.category
                    );
                    return (
                      <ListingCard
                        key={property.id}
                        listing={property}
                        category={cat}
                        Icon={getCategoryIcon(cat?.iconKey)}
                        lang={lang}
                        viewMode={viewMode}
                        isSaved={savedIds.includes(property.id)}
                        onToggleSave={handleToggleSave}
                      />
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage === 1}
                      className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-colors"
                      aria-label={t(lang, "Nyuma", "Previous")}
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
                              ? "bg-gold text-night"
                              : "border border-gray-200 text-secondary hover:bg-gray-50"
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
                      aria-label={t(lang, "Mbele", "Next")}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-muted" />
                </div>
                <h3 className="font-semibold text-primary">
                  {t(lang, "Hakuna mali iliyopatikana", "No properties found")}
                </h3>
                <p className="text-secondary text-sm mt-1">
                  {t(
                    lang,
                    "Jaribu kubadilisha vichujio au utafutaji wako",
                    "Try changing your filters or search"
                  )}
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
                  className="mt-4 px-5 py-2 bg-gold text-night rounded-lg text-sm font-semibold hover:bg-flame transition-colors"
                >
                  {t(lang, "Safisha Vichujio", "Clear Filters")}
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

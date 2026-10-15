import React, { useState, useMemo, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
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
import { isBoostActive, isLeadingActive } from "./dashboard/components/shared";
import ListingCardShop from "../components/shop/ListingCardShop.jsx";

/* ============================================================
   Helpers
   ============================================================ */
function t(lang, sw, en) {
  return lang === "sw" ? sw : en;
}

const PRICE_RANGES = {
  nyumba: [
    { label: { sw: "Chini ya TZS 50M", en: "Under TZS 50M" }, min: 0, max: 50000000 },
    { label: { sw: "TZS 50M - 100M", en: "TZS 50M - 100M" }, min: 50000000, max: 100000000 },
    { label: { sw: "TZS 100M - 200M", en: "TZS 100M - 200M" }, min: 100000000, max: 200000000 },
    { label: { sw: "Juu ya TZS 200M", en: "Above TZS 200M" }, min: 200000000, max: Infinity },
  ],
};

const DEFAULT_RANGES = [
  { label: { sw: "Chini ya TZS 20M", en: "Under TZS 20M" }, min: 0, max: 20000000 },
  { label: { sw: "TZS 20M - 50M", en: "TZS 20M - 50M" }, min: 20000000, max: 50000000 },
  { label: { sw: "TZS 50M - 100M", en: "TZS 50M - 100M" }, min: 50000000, max: 100000000 },
  { label: { sw: "Juu ya TZS 100M", en: "Above TZS 100M" }, min: 100000000, max: Infinity },
];

/* ═══════════════════════════════════════════════════════════
   FILTER SIDEBAR
   ═══════════════════════════════════════════════════════════ */
function FilterSidebar({ category, filters, setFilters, isOpen, onClose, lang }) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => { setLocalFilters(filters); }, [filters]);

  const activeRanges = PRICE_RANGES[category] || DEFAULT_RANGES;

  const handleApply = () => { setFilters(localFilters); onClose(); };
  const handleReset = () => {
    setLocalFilters({ priceRange: null, verified: false, featured: false });
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
          <SlidersHorizontal size={15} />
          {t(lang, "Vichujio", "Filters")}
        </h3>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-secondary hover:bg-[color:rgb(var(--c-page))] lg:hidden"
          aria-label={t(lang, "Funga", "Close")}
        >
          <X size={18} />
        </button>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
          {t(lang, "Bei", "Price")}
        </h4>
        <div className="space-y-2">
          {activeRanges.map((range, idx) => (
            <label key={idx} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="priceRange"
                checked={localFilters.priceRange === idx}
                onChange={() => setLocalFilters({ ...localFilters, priceRange: idx })}
                className="h-4 w-4 accent-[color:rgb(var(--c-gold))]"
              />
              <span className="text-sm text-primary">
                {range.label?.[lang] || range.label?.sw}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
          {t(lang, "Vigezo Vingine", "Other")}
        </h4>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={localFilters.verified}
              onChange={(e) => setLocalFilters({ ...localFilters, verified: e.target.checked })}
              className="h-4 w-4 rounded accent-[color:rgb(var(--c-gold))]"
            />
            <span className="text-sm text-primary">
              {t(lang, "Zilizothibitishwa tu", "Verified only")}
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={localFilters.featured}
              onChange={(e) => setLocalFilters({ ...localFilters, featured: e.target.checked })}
              className="h-4 w-4 rounded accent-[color:rgb(var(--c-gold))]"
            />
            <span className="text-sm text-primary">
              {t(lang, "Featured tu", "Featured only")}
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2 border-t border-[color:rgb(var(--c-hairline))] pt-4">
        <button
          onClick={handleApply}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-[#011957] transition-colors hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)" }}
        >
          {t(lang, "Tumia Vichujio", "Apply Filters")}
        </button>
        <button
          onClick={handleReset}
          className="w-full rounded-lg border border-[color:rgb(var(--c-hairline))] py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-[color:rgb(var(--c-page))]"
        >
          {t(lang, "Safisha", "Reset")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card p-5 lg:sticky lg:top-24">
          {content}
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex-1 bg-black/50" onClick={onClose} />
          <div className="h-full w-80 max-w-[85%] overflow-y-auto bg-card p-5">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
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

  const allPublic = usePublicListings();
  const savedIds = useSavedIds();

  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({ priceRange: null, verified: false, featured: false });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("tafuta") || "");
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
        case "price_low":  return a.price - b.price;
        case "price_high": return b.price - a.price;
        case "popular":    return (b.views || 0) - (a.views || 0);
        case "newest":
        default:           return new Date(b.postedAt) - new Date(a.postedAt);
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

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filters, sortBy, categoryKey]);

  const handleToggleSave = (id) => toggleSaved(id);
  const handleSearchSubmit = (e) => { e.preventDefault(); setCurrentPage(1); };

  /* ── Category not found ───────────────────────────────── */
  if (!categoryInfo) {
    return (
      <div className="min-h-screen bg-page">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <HomeIcon size={64} className="mx-auto mb-4 text-muted" />
          <h1 className="mb-2 text-2xl font-bold text-primary">
            {t(lang, "Category haipatikani", "Category not found")}
          </h1>
          <p className="mb-6 text-sm text-secondary">
            {t(
              lang,
              "Category hii haipo au imezimwa. Tafuta mali nyingine.",
              "This category doesn't exist or has been disabled. Browse other properties."
            )}
          </p>
          <Link
            to="/kategoria"
            className="inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-[#011957]"
            style={{ background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)" }}
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
    <div className="min-h-screen bg-page">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════
          HERO HEADER — category image as the background
          ═══════════════════════════════════════════════════════ */}
      <section className="surface-night relative isolate overflow-hidden">
        {/* Background image (only if the category has one) */}
        {categoryImage && (
          <img
            src={categoryImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            loading="eager"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}

        {/* Navy tint overlay — always on, so text is readable over any image */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background: categoryImage
              ? "linear-gradient(180deg, rgba(1,15,58,0.72) 0%, rgba(1,25,87,0.88) 100%)"
              : "linear-gradient(135deg, #010F3A 0%, #011957 55%, #042475 100%)",
          }}
        />

        {/* Subtle grid pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />

        {/* Ambient gold glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/4 -z-10 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #FEA406 0%, transparent 70%)" }}
        />

        <div className="container relative py-12 sm:py-16">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center justify-center gap-2 text-xs text-white/60 sm:text-sm">
            <Link to="/" className="transition-colors hover:text-white">
              {t(lang, "Nyumbani", "Home")}
            </Link>
            <ChevronRight size={14} className="text-white/40" />
            <span className="font-medium text-white">{categoryLabel}</span>
          </nav>

          {/* Icon + Title + Description */}
          <div className="flex flex-col items-center gap-4 text-center">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl sm:h-16 sm:w-16"
              style={{
                background: "rgba(254,164,6,0.20)",
                border: "1px solid rgba(254,164,6,0.35)",
              }}
            >
              <CategoryIcon size={28} color="#FEA406" />
            </span>

            <div className="max-w-2xl">
              <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                {categoryLabel}
              </h1>
              {categoryDescription && (
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] sm:text-base">
                  {categoryDescription}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="mx-auto mt-8 max-w-2xl">
            <div className="relative flex items-center">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 text-white/50"
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
                className="h-12 w-full rounded-full pl-12 pr-32 text-sm outline-none transition-colors sm:text-base"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.20)",
                  color: "#FFFFFF",
                  backdropFilter: "blur(10px)",
                }}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-full px-4 text-xs font-semibold transition-transform active:translate-y-px sm:px-5 sm:text-sm"
                style={{
                  background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)",
                  color: "#011957",
                }}
              >
                {t(lang, "Tafuta", "Search")}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BODY
          ═══════════════════════════════════════════════════════ */}
      <div className="container py-6">
        <div className="flex gap-6">
          <FilterSidebar
            category={categoryKey}
            filters={filters}
            setFilters={setFilters}
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            lang={lang}
          />

          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card p-3 sm:p-4">
              <p className="text-sm text-secondary">
                <span className="font-semibold text-primary">
                  {filteredProperties.length}
                </span>{" "}
                {t(lang, "mali zimepatikana", "properties found")}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-[color:rgb(var(--c-hairline))] px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-[color:rgb(var(--c-page))] lg:hidden"
                >
                  <SlidersHorizontal size={14} />
                  {t(lang, "Vichujio", "Filters")}
                </button>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="cursor-pointer appearance-none rounded-lg border border-[color:rgb(var(--c-hairline))] bg-card px-3 py-2 pr-8 text-sm font-medium text-primary outline-none focus:border-[color:rgb(var(--c-gold))]"
                  >
                    <option value="newest">{t(lang, "Mpya Kwanza", "Newest First")}</option>
                    <option value="price_low">{t(lang, "Bei: Chini → Juu", "Price: Low → High")}</option>
                    <option value="price_high">{t(lang, "Bei: Juu → Chini", "Price: High → Low")}</option>
                    <option value="popular">{t(lang, "Maarufu", "Popular")}</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
                  />
                </div>

                <div className="hidden overflow-hidden rounded-lg border border-[color:rgb(var(--c-hairline))] sm:flex">
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label={t(lang, "Grid", "Grid")}
                    className="grid h-9 w-9 place-items-center transition-colors"
                    style={{
                      background: viewMode === "grid" ? "#FEA406" : "transparent",
                      color: viewMode === "grid" ? "#011957" : "var(--text-secondary)",
                    }}
                  >
                    <Grid3x3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label={t(lang, "Orodha", "List")}
                    className="grid h-9 w-9 place-items-center transition-colors"
                    style={{
                      background: viewMode === "list" ? "#FEA406" : "transparent",
                      color: viewMode === "list" ? "#011957" : "var(--text-secondary)",
                    }}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {(filters.priceRange !== null || filters.verified || filters.featured || searchQuery) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-secondary">
                  {t(lang, "Vichujio vilivyotumika:", "Active filters:")}
                </span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:rgb(var(--c-gold)/0.14)] px-2.5 py-1 text-xs font-medium text-[#A35F00] dark:text-[#FEA406]">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery("")} aria-label={t(lang, "Ondoa", "Remove")}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#2F6D4F]/14 px-2.5 py-1 text-xs font-medium text-[#2F6D4F]">
                    {t(lang, "Zilizothibitishwa", "Verified")}
                    <button onClick={() => setFilters({ ...filters, verified: false })} aria-label={t(lang, "Ondoa", "Remove")}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:rgb(var(--c-gold)/0.14)] px-2.5 py-1 text-xs font-medium text-[#A35F00] dark:text-[#FEA406]">
                    {t(lang, "Featured", "Featured")}
                    <button onClick={() => setFilters({ ...filters, featured: false })} aria-label={t(lang, "Ondoa", "Remove")}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilters({ priceRange: null, verified: false, featured: false });
                    setSearchQuery("");
                  }}
                  className="text-xs font-medium text-[#C1502E] hover:underline"
                >
                  {t(lang, "Safisha zote", "Clear all")}
                </button>
              </div>
            )}

            {/* Listing grid / list */}
            {paginatedProperties.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4"
                      : "flex flex-col gap-3"
                  }
                >
                  {paginatedProperties.map((property) => {
                    const cat = allCategories.find((c) => c.key === property.category);
                    return (
                      <ListingCardShop
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label={t(lang, "Nyuma", "Previous")}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-[color:rgb(var(--c-hairline))] text-primary transition-colors hover:bg-[color:rgb(var(--c-page))] disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className="grid h-9 w-9 place-items-center rounded-lg text-sm font-medium transition-colors"
                        style={
                          currentPage === page
                            ? { background: "#FEA406", color: "#011957" }
                            : {
                                border: "1px solid rgb(var(--c-hairline))",
                                color: "var(--text-primary)",
                              }
                        }
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label={t(lang, "Mbele", "Next")}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-[color:rgb(var(--c-hairline))] text-primary transition-colors hover:bg-[color:rgb(var(--c-page))] disabled:opacity-40"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card p-10 text-center sm:p-14">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[color:rgb(var(--c-page))]">
                  <Search size={24} className="text-muted" />
                </div>
                <h3 className="font-semibold text-primary">
                  {t(lang, "Hakuna mali iliyopatikana", "No properties found")}
                </h3>
                <p className="mt-1 text-sm text-secondary">
                  {t(
                    lang,
                    "Jaribu kubadilisha vichujio au utafutaji wako",
                    "Try changing your filters or search"
                  )}
                </p>
                <button
                  onClick={() => {
                    setFilters({ priceRange: null, verified: false, featured: false });
                    setSearchQuery("");
                  }}
                  className="mt-4 rounded-lg px-5 py-2 text-sm font-semibold text-[#011957]"
                  style={{ background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)" }}
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

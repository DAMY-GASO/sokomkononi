// ============================================================
// AllListingsPage.jsx — /mali-zote
// ✅ Grid & List zote zinatumia ListingCard (picha zinaonekana)
// ✅ MPYA: Filter (category, bei, eneo, verified, featured)
// ✅ MPYA: URL params sync (?category=X&sort=price_low&min=..&max=..&eneo=..)
//    → link inaweza kushirikiwa na back/forward inafanya kazi
// ============================================================
import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Home as HomeIcon,
  ChevronDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { usePublicListings } from "../config/listingsStore.js";
import ListingCard from "../components/ListingCard.jsx";
import { rankListings, currentRotationSeed } from "../config/listingRanking.js";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../config/categoriesStore.js";
import { isBoostActive } from "./dashboard/components/shared";

const PAGE_SIZE = 12;
const VALID_SORTS = ["newest", "price_low", "price_high", "popular"];

// Inasoma namba kutoka URL (inarudisha "" kama si halali)
function parseNum(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? String(n) : "";
}

// Maandishi ya eneo la listing (location + region/district/area)
function locationText(l) {
  const a = l.attributes && typeof l.attributes === "object" ? l.attributes : {};
  return [l.location, a.region, a.district, a.area]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function AllListingsPage() {
  const { lang } = useLanguage();
  const allListings = usePublicListings();
  const activeCategories = useActiveCategories();
  const [searchParams, setSearchParams] = useSearchParams();

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ── State inatoka kwenye URL (single source of truth) ──────
  const sortParam = searchParams.get("sort");
  const sortBy = VALID_SORTS.includes(sortParam) ? sortParam : "newest";
  const categoryFilter = searchParams.get("category") || "";
  const minPrice = parseNum(searchParams.get("min"));
  const maxPrice = parseNum(searchParams.get("max"));
  const locationFilter = searchParams.get("eneo") || "";
  const verifiedOnly = searchParams.get("verified") === "1";
  const featuredOnly = searchParams.get("featured") === "1";

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === "" || v === null || v === undefined || v === false) next.delete(k);
      else next.set(k, v === true ? "1" : String(v));
    });
    if (next.get("sort") === "newest") next.delete("sort");
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () =>
    updateParams({
      category: "",
      min: "",
      max: "",
      eneo: "",
      verified: false,
      featured: false,
    });

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [rotationSeed] = useState(currentRotationSeed);
  const [showFilters, setShowFilters] = useState(false);

  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "grid";
    try {
      return localStorage.getItem("smk_listings_view") || "grid";
    } catch {
      return "grid";
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("smk_listings_view", viewMode);
      }
    } catch {
      /* storage haipatikani — ignore */
    }
  }, [viewMode]);

  // Filter ikibadilika → rudi ukurasa wa kwanza wa "Load More"
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortBy, categoryFilter, minPrice, maxPrice, locationFilter, verifiedOnly, featuredOnly]);

  const liveListings = useMemo(
    () =>
      rankListings(
        allListings.filter(
          (l) => l.status === "live" || l.status === "reserved"
        ),
        rotationSeed
      ),
    [allListings, rotationSeed]
  );

  const filteredListings = useMemo(() => {
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);
    const loc = locationFilter.trim().toLowerCase();

    return liveListings.filter((l) => {
      if (categoryFilter && String(l.category) !== categoryFilter) return false;
      if (min !== null && (Number(l.price) || 0) < min) return false;
      if (max !== null && (Number(l.price) || 0) > max) return false;
      if (loc && !locationText(l).includes(loc)) return false;
      if (verifiedOnly && !l.verified) return false;
      if (featuredOnly && !isBoostActive(l)) return false;
      return true;
    });
  }, [liveListings, categoryFilter, minPrice, maxPrice, locationFilter, verifiedOnly, featuredOnly]);

  const sortedListings = useMemo(() => {
    const arr = [...filteredListings];
    if (sortBy === "price_low") return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === "price_high") return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sortBy === "popular") return arr.sort((a, b) => (b.views || 0) - (a.views || 0));
    return arr.sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));
  }, [filteredListings, sortBy]);

  const visibleListings = sortedListings.slice(0, visibleCount);
  const hasMore = visibleCount < sortedListings.length;

  const categoryByKey = useMemo(() => {
    const map = new Map();
    activeCategories.forEach((c) => {
      const key = c.key || c.slug;
      if (key) map.set(String(key), c);
    });
    return map;
  }, [activeCategories]);

  const categoryLabelOf = (c) =>
    c?.label?.[lang] || c?.label?.sw || c?.key || c?.slug || "";

  const activeFilterCount =
    (categoryFilter ? 1 : 0) +
    (minPrice !== "" ? 1 : 0) +
    (maxPrice !== "" ? 1 : 0) +
    (locationFilter.trim() ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (featuredOnly ? 1 : 0);

  const inputCls =
    "w-full rounded-lg border border-[color:rgb(var(--c-hairline))] bg-card px-3 py-2 text-sm text-primary outline-none focus:border-[color:rgb(var(--c-gold))]";

  const renderCard = (l, mode) => {
    const cat = categoryByKey.get(String(l.category));
    const Icon = getCategoryIcon(cat?.iconKey || "Home");
    return (
      <ListingCard
        key={l.id}
        listing={l}
        category={cat}
        Icon={Icon}
        lang={lang}
        viewMode={mode}
      />
    );
  };

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <section className="py-8 sm:py-10 px-4 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            {t("Mali Zote", "All Listings")}
          </h1>
          <p className="text-sm text-secondary mt-2">
            {activeFilterCount > 0
              ? t(
                  `Mali ${sortedListings.length} kati ya ${liveListings.length} zinalingana na vichujio vyako.`,
                  `${sortedListings.length} of ${liveListings.length} listings match your filters.`
                )
              : t(
                  `Mali ${liveListings.length} zinazopatikana sasa hivi.`,
                  `${liveListings.length} listings available right now.`
                )}
          </p>
        </div>

        {/* ── Toolbar ─────────────────────────────────────── */}
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center rounded-lg border border-[color:rgb(var(--c-hairline))] bg-card p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-[color:rgb(var(--c-gold))] text-white"
                    : "text-muted hover:text-primary"
                }`}
                title={t("Muonekano wa Grid", "Grid View")}
                aria-label={t("Muonekano wa Grid", "Grid View")}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-[color:rgb(var(--c-gold))] text-white"
                    : "text-muted hover:text-primary"
                }`}
                title={t("Muonekano wa Orodha", "List View")}
                aria-label={t("Muonekano wa Orodha", "List View")}
              >
                <List size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              aria-expanded={showFilters}
              className="flex items-center gap-1.5 rounded-lg border border-[color:rgb(var(--c-hairline))] bg-card px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-page"
            >
              <SlidersHorizontal size={14} />
              {t("Vichujio", "Filters")}
              {activeFilterCount > 0 && (
                <span className="ml-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-[color:rgb(var(--c-gold))] px-1 text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="relative w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => updateParams({ sort: e.target.value })}
              aria-label={t("Panga kwa", "Sort by")}
              className="w-full sm:w-auto cursor-pointer appearance-none rounded-lg border border-[color:rgb(var(--c-hairline))] bg-card px-3 py-2 pr-8 text-sm font-medium text-primary outline-none focus:border-[color:rgb(var(--c-gold))]"
            >
              <option value="newest">{t("Mpya Kwanza", "Newest First")}</option>
              <option value="price_low">{t("Bei: Chini → Juu", "Price: Low → High")}</option>
              <option value="price_high">{t("Bei: Juu → Chini", "Price: High → Low")}</option>
              <option value="popular">{t("Maarufu", "Popular")}</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
            />
          </div>
        </div>

        {/* ── Filter panel ────────────────────────────────── */}
        {showFilters && (
          <div className="mb-4 rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary">
                  {t("Kategoria", "Category")}
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => updateParams({ category: e.target.value })}
                  className={inputCls}
                >
                  <option value="">{t("Zote", "All")}</option>
                  {activeCategories.map((c) => {
                    const key = c.key || c.slug;
                    return (
                      <option key={key} value={key}>
                        {categoryLabelOf(c)}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary">
                  {t("Eneo", "Location")}
                </span>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => updateParams({ eneo: e.target.value })}
                  placeholder={t("mf. Dar es Salaam, Arusha", "e.g. Dar es Salaam, Arusha")}
                  className={inputCls}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary">
                  {t("Bei ya chini (TZS)", "Min price (TZS)")}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={minPrice}
                  onChange={(e) => updateParams({ min: parseNum(e.target.value) })}
                  placeholder="0"
                  className={inputCls}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary">
                  {t("Bei ya juu (TZS)", "Max price (TZS)")}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => updateParams({ max: parseNum(e.target.value) })}
                  placeholder={t("Bila kikomo", "No limit")}
                  className={inputCls}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[color:rgb(var(--c-hairline))] pt-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => updateParams({ verified: e.target.checked })}
                    className="h-4 w-4 rounded accent-[color:rgb(var(--c-gold))]"
                  />
                  <span className="text-sm text-primary">
                    {t("Zilizothibitishwa tu", "Verified only")}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={featuredOnly}
                    onChange={(e) => updateParams({ featured: e.target.checked })}
                    className="h-4 w-4 rounded accent-[color:rgb(var(--c-gold))]"
                  />
                  <span className="text-sm text-primary">
                    {t("Featured tu", "Featured only")}
                  </span>
                </label>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-[#C1502E] hover:underline"
                >
                  {t("Safisha vichujio", "Clear filters")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Active filter chips ─────────────────────────── */}
        {activeFilterCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-secondary">
              {t("Vichujio vilivyotumika:", "Active filters:")}
            </span>
            {categoryFilter && (
              <Chip
                label={categoryLabelOf(categoryByKey.get(categoryFilter)) || categoryFilter}
                onRemove={() => updateParams({ category: "" })}
                removeLabel={t("Ondoa", "Remove")}
              />
            )}
            {locationFilter.trim() && (
              <Chip
                label={`📍 ${locationFilter.trim()}`}
                onRemove={() => updateParams({ eneo: "" })}
                removeLabel={t("Ondoa", "Remove")}
              />
            )}
            {minPrice !== "" && (
              <Chip
                label={`≥ TZS ${Number(minPrice).toLocaleString("en-US")}`}
                onRemove={() => updateParams({ min: "" })}
                removeLabel={t("Ondoa", "Remove")}
              />
            )}
            {maxPrice !== "" && (
              <Chip
                label={`≤ TZS ${Number(maxPrice).toLocaleString("en-US")}`}
                onRemove={() => updateParams({ max: "" })}
                removeLabel={t("Ondoa", "Remove")}
              />
            )}
            {verifiedOnly && (
              <Chip
                label={t("Zilizothibitishwa", "Verified")}
                onRemove={() => updateParams({ verified: false })}
                removeLabel={t("Ondoa", "Remove")}
              />
            )}
            {featuredOnly && (
              <Chip
                label="Featured"
                onRemove={() => updateParams({ featured: false })}
                removeLabel={t("Ondoa", "Remove")}
              />
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-[#C1502E] hover:underline"
            >
              {t("Safisha zote", "Clear all")}
            </button>
          </div>
        )}

        {/* ── Results ─────────────────────────────────────── */}
        {sortedListings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-hairline p-10 sm:p-16 text-center bg-page">
            <HomeIcon size={44} className="mx-auto text-muted mb-3" />
            <p className="text-sm text-secondary">
              {activeFilterCount > 0
                ? t("Hakuna mali inayolingana na vichujio vyako.", "No listings match your filters.")
                : t("Hakuna mali kwa sasa.", "No listings yet.")}
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-lg px-5 py-2 text-sm font-semibold text-[#011957]"
                style={{ background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)" }}
              >
                {t("Safisha Vichujio", "Clear Filters")}
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4">
                {visibleListings.map((l) => renderCard(l, "grid"))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:gap-4">
                {visibleListings.map((l) => renderCard(l, "list"))}
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="px-6 py-2.5 rounded-xl border border-hairline text-sm font-semibold text-primary hover:bg-page transition-colors"
                >
                  {t("Onyesha Zaidi", "Load More")}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer selectedLang={lang} />
      <BottomNav />
    </div>
  );
}

function Chip({ label, onRemove, removeLabel }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[color:rgb(var(--c-gold)/0.14)] px-2.5 py-1 text-xs font-medium text-[#A35F00] dark:text-[#FEA406]">
      {label}
      <button type="button" onClick={onRemove} aria-label={removeLabel}>
        <X size={12} />
      </button>
    </span>
  );
}
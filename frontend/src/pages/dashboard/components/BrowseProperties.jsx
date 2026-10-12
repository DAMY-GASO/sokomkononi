import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Grid3x3,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  Home as HomeIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  COLORS,
  getCategory,
  isBoostActive,
  isLeadingActive,
} from "./shared";
import { usePublicListings } from "../../../config/listingsStore.js";
import ListingCard from "../../../components/ListingCard.jsx";
import {
  useSavedIds,
  toggleSaved,
} from "../../../config/savedStore.js";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../../../config/categoriesStore.js";

// Mikoa 31 ya Tanzania
const REGIONS = [
  "Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera", "Katavi",
  "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya", "Morogoro",
  "Mtwara", "Mwanza", "Njombe", "Pwani", "Rukwa", "Ruvuma", "Shinyanga",
  "Simiyu", "Singida", "Songwe", "Tabora", "Tanga",
  "Kaskazini Pemba", "Kusini Pemba", "Kaskazini Unguja", "Kusini Unguja",
  "Mjini Magharibi",
];

// ============================================================
// FILTER SIDEBAR
// ============================================================
function FilterSidebar({ filters, setFilters, isOpen, onClose, lang }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const allCategories = useActiveCategories();

  const priceRanges = [
    { label: "Chini ya TZS 20M", en: "Under TZS 20M", min: 0, max: 20000000 },
    { label: "TZS 20M - 50M", en: "TZS 20M - 50M", min: 20000000, max: 50000000 },
    { label: "TZS 50M - 100M", en: "TZS 50M - 100M", min: 50000000, max: 100000000 },
    { label: "TZS 100M - 200M", en: "TZS 100M - 200M", min: 100000000, max: 200000000 },
    { label: "Juu ya TZS 200M", en: "Above TZS 200M", min: 200000000, max: Infinity },
  ];

  const handleApply = () => {
    setFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const reset = {
      categories: [],
      priceRange: null,
      regions: [],
      verified: false,
      featured: false,
    };
    setLocalFilters(reset);
  };

  const toggleCategory = (cat) => {
    setLocalFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const toggleRegion = (region) => {
    setLocalFilters((prev) => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter((r) => r !== region)
        : [...prev.regions, region],
    }));
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <SlidersHorizontal size={16} />
          {lang === "sw" ? "Vichujio" : "Filters"}
        </h3>
        <button
          onClick={onClose}
          className="lg:hidden text-muted hover:text-secondary"
        >
          <X size={20} />
        </button>
      </div>

      <div>
        <h4 className="text-sm font-medium text-secondary mb-3">
          {lang === "sw" ? "Kategoria" : "Category"}
        </h4>
        <div className="space-y-2">
          {allCategories.map((cat) => {
            const CatIcon = getCategoryIcon(cat.iconKey);
            return (
              <label
                key={cat.key}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={localFilters.categories.includes(cat.key)}
                  onChange={() => toggleCategory(cat.key)}
                  className="w-4 h-4 rounded text-gold-ink focus:ring-gold"
                />
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt=""
                    className="w-5 h-5 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <CatIcon size={16} className="text-muted flex-shrink-0" />
                )}
                <span className="text-sm text-secondary">
                  {cat.label?.[lang] || cat.label?.sw}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-secondary mb-3">
          {lang === "sw" ? "Bei" : "Price"}
        </h4>
        <div className="space-y-2">
          {priceRanges.map((range, idx) => (
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
                {lang === "sw" ? range.label : range.en}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-secondary mb-3">
          {lang === "sw" ? "Mkoa" : "Region"}
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {REGIONS.map((region) => (
            <label key={region} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.regions.includes(region)}
                onChange={() => toggleRegion(region)}
                className="w-4 h-4 rounded text-gold-ink focus:ring-gold"
              />
              <span className="text-sm text-secondary">{region}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-secondary mb-3">
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
              className="w-4 h-4 rounded text-gold-ink focus:ring-gold"
            />
            <span className="text-sm text-secondary">
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
              className="w-4 h-4 rounded text-gold-ink focus:ring-gold"
            />
            <span className="text-sm text-secondary">
              {lang === "sw" ? "Featured tu" : "Featured only"}
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-100">
        <button
          onClick={handleApply}
          className="w-full bg-gold hover:bg-flame text-night py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          {lang === "sw" ? "Tumia Vichujio" : "Apply Filters"}
        </button>
        <button
          onClick={handleReset}
          className="w-full border border-gray-200 text-secondary hover:bg-gray-50 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          {lang === "sw" ? "Safisha" : "Reset"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 p-5 lg:sticky lg:top-20">
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
export default function BrowseProperties({
  lang = "sw",
  excludeSellerId = null, // ⬅️ MPYA — seller hawezi kuona listings zake kwenye browse
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("tafuta") || ""
  );

  useEffect(() => {
    setSearchQuery(searchParams.get("tafuta") || "");
  }, [searchParams]);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: null,
    regions: [],
    verified: false,
    featured: false,
  });
  const savedIds = useSavedIds();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  const allPropertiesRaw = usePublicListings();

  // ⬇️ MPYA: Chuja listings za seller mwenyewe
  const allProperties = useMemo(() => {
    if (!excludeSellerId) return allPropertiesRaw;
    return allPropertiesRaw.filter(
      (p) => String(p.sellerId) !== String(excludeSellerId)
    );
  }, [allPropertiesRaw, excludeSellerId]);

  const filteredProperties = useMemo(() => {
    let result = [...allProperties];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const category = getCategory(p.category);
        const catLabelSw = category?.label?.sw?.toLowerCase() || "";
        const catLabelEn = category?.label?.en?.toLowerCase() || "";
        return (
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          (p.region && p.region.toLowerCase().includes(q)) ||
          catLabelSw.includes(q) ||
          catLabelEn.includes(q)
        );
      });
    }

    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }

    if (filters.regions.length > 0) {
      result = result.filter((p) => filters.regions.includes(p.region));
    }

    if (filters.verified) {
      result = result.filter((p) => p.verified);
    }

    if (filters.featured) {
      result = result.filter((p) => isBoostActive(p));
    }

    if (filters.priceRange !== null) {
      const ranges = [
        [0, 20000000],
        [20000000, 50000000],
        [50000000, 100000000],
        [100000000, 200000000],
        [200000000, Infinity],
      ];
      const [min, max] = ranges[filters.priceRange];
      result = result.filter((p) => p.price >= min && p.price < max);
    }

    const sortComparator = (a, b) => {
      switch (sortBy) {
        case "price_low":
          return a.price - b.price;
        case "price_high":
          return b.price - a.price;
        case "popular":
          return b.views - a.views;
        case "newest":
        default:
          return new Date(b.postedAt) - new Date(a.postedAt);
      }
    };

    const statusRank = (p) => {
      if (p.status === "live") return 0;
      if (p.status === "reserved") return 1;
      if (p.status === "sold") return 2;
      return 3;
    };

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
  }, [allProperties, searchQuery, filters, sortBy]);

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSave = (id, _property) => {
    return toggleSaved(id);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    if (searchQuery.trim()) {
      navigate(`/tafuta?tafuta=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: null,
      regions: [],
      verified: false,
      featured: false,
    });
    setSearchQuery("");
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceRange !== null ||
    filters.regions.length > 0 ||
    filters.verified ||
    filters.featured;

  return (
    <div
      style={{
        background: COLORS.sand,
        minHeight: "100%",
      }}
      className="w-full p-4 sm:p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* HEADER — CENTERED */}
        <div className="mb-5 text-center">
          <h1 className="h-title">
            {lang === "sw" ? "Tafuta Mali" : "Browse Properties"}
          </h1>
          <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
            {lang === "sw"
              ? "Pata mali unayoitafuta kutoka kwa wauzaji walioidhinishwa."
              : "Find the property you're looking for from verified sellers."}
          </p>
        </div>

        {/* SEARCH BAR — CENTERED */}
        <form onSubmit={handleSearchSubmit} className="mb-5">
          <div className="relative max-w-2xl mx-auto">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "sw"
                  ? "Tafuta mali kwa jina, mahali, au kategoria..."
                  : "Search by title, location, or category..."
              }
              style={{
                background: "white",
                borderColor: COLORS.sandLine,
                color: COLORS.night,
              }}
              className="w-full rounded-full border pl-12 pr-32 py-3.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
            />
            <button
              type="submit"
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {lang === "sw" ? "Tafuta" : "Search"}
            </button>
          </div>
        </form>

        <div className="flex gap-6">
          <FilterSidebar
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
                {lang === "sw" ? "mali zimepatikana" : "properties found"}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-secondary hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  {lang === "sw" ? "Vichujio" : "Filters"}
                </button>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-secondary focus:outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="newest">
                      {lang === "sw" ? "Mpya Kwanza" : "Newest First"}
                    </option>
                    <option value="price_low">
                      {lang === "sw" ? "Bei: Chini → Juu" : "Price: Low → High"}
                    </option>
                    <option value="price_high">
                      {lang === "sw" ? "Bei: Juu → Chini" : "Price: High → Low"}
                    </option>
                    <option value="popular">
                      {lang === "sw" ? "Maarufu" : "Popular"}
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
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-body-sm text-secondary">
                  {lang === "sw" ? "Vichujio:" : "Filters:"}
                </span>
                {filters.categories.map((cat) => {
                  const catObj = getCategory(cat);
                  const catImg = catObj?.imageUrl;
                  return (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 bg-gold/10 text-gold-ink text-body-sm px-2.5 py-1 rounded-full"
                    >
                      {catImg && (
                        <img
                          src={catImg}
                          alt=""
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      )}
                      {catObj?.label?.[lang] || cat}
                      <button
                        onClick={() =>
                          setFilters({
                            ...filters,
                            categories: filters.categories.filter(
                              (c) => c !== cat
                            ),
                          })
                        }
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
                <button
                  onClick={clearFilters}
                  className="text-body-sm text-rust hover:underline font-medium"
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
                      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                      : "flex flex-col gap-3"
                  }
                >
                  {paginatedProperties.map((property) => {
                    const cat = getCategory(property.category);
                    return (
                      <ListingCard
                        key={property.id}
                        listing={property}
                        category={cat}
                        Icon={getCategoryIcon(cat?.iconKey)}
                        lang={lang}
                        viewMode={viewMode}
                        isSaved={savedIds.includes(property.id)}
                        onToggleSave={toggleSave}
                      />
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <Search size={48} className="mx-auto text-muted mb-3" />
                <h3 className="font-semibold text-primary">
                  {lang === "sw"
                    ? "Hakuna mali iliyopatikana"
                    : "No properties found"}
                </h3>
                <p className="text-secondary text-sm mt-1">
                  {lang === "sw"
                    ? "Jaribu kubadilisha vichujio au utafutaji wako"
                    : "Try changing your filters or search"}
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-5 py-2 bg-gold text-night rounded-lg text-sm font-semibold hover:bg-flame transition-colors"
                >
                  {lang === "sw" ? "Safisha Vichujio" : "Clear Filters"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
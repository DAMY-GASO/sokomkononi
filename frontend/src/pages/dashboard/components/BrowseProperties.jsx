import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Heart,
  Grid3x3,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
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
import {
  COLORS,
  FONTS,
  getCategory,
  formatTZS,
  timeAgo,
  isBoostActive,
  isLeadingActive,
} from "./shared";
import { usePublicListings } from "../../../config/listingsStore.js";
import { useSavedIds, toggleSaved } from "../../../config/savedStore.js";
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
// RESERVATION COUNTDOWN
// ============================================================
function reservationCountdown(reservedUntil, lang) {
  if (!reservedUntil) return "";
  const ms = new Date(reservedUntil).getTime() - Date.now();
  if (ms <= 0) return lang === "sw" ? "Inaisha hivi karibuni" : "Ending soon";
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return lang === "sw" ? `Inaisha baada ya saa ${hours}` : `Ends in ${hours}hrs`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return lang === "sw" ? `Inaisha baada ya siku ${days}` : `Ends in ${days} days`;
  return lang === "sw"
    ? `Inaisha baada ya siku ${days} ${remainingHours}saa`
    : `Ends in ${days}d ${remainingHours}h`;
}

// ============================================================
// CARD IMAGE RESOLVER
// Priority: property.imageUrl → category.imageUrl → null (icon fallback)
// ============================================================
function resolveCardImage(property, category) {
  if (property?.imageUrl) return property.imageUrl;
  if (category?.imageUrl) return category.imageUrl;
  return null;
}

// ============================================================
// PROPERTY CARD
// ============================================================
function PropertyCard({ property, viewMode, isSaved, onToggleSave, lang }) {
  const category = getCategory(property.category);
  const Icon = getCategoryIcon(category?.iconKey);
  const categoryLabel = category?.label?.[lang] || category?.label?.sw || property.category;
  const cardImage = resolveCardImage(property, category);

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
      <Link
        to={`/mali/${property.id}`}
        className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow flex flex-col sm:flex-row ${
          isSold ? "border-gray-200 opacity-75" : "border-gray-100"
        }`}
      >
        <div className="w-full sm:w-48 h-40 sm:h-auto bg-gray-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
          {cardImage ? (
            <img
              src={cardImage}
              alt={property.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Icon size={32} className="text-gray-300" />
          )}
          {isReserved && (
            <span className="absolute top-2 left-2 bg-[#E8A33D] text-[#101A2E] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Clock3 size={10} />
              RESERVED
            </span>
          )}
          {isSold && (
            <span className="absolute top-2 left-2 bg-[#101A2E] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Ban size={10} />
              SOLD
            </span>
          )}
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-gray-800 text-sm truncate">
                  {property.title}
                </h3>
                {isLeading && (
                  <span className="shrink-0 bg-[#2F6D4F]/10 text-[#2F6D4F] text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <TrendingUp size={9} />
                    Priority
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <MapPin size={12} />
                {property.location}
              </div>
            </div>
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
          <p className="text-[#C1502E] font-bold text-base mt-2">
            {formatTZS(property.price)}
          </p>
          {isReserved && property.reservedUntil && (
            <p className="text-[11px] font-medium text-[#8A5A16] mt-1 flex items-center gap-1">
              <Clock3 size={11} />
              {reservationCountdown(property.reservedUntil, lang)}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
            {property.bedrooms && (
              <span>🛏 {property.bedrooms} {lang === "sw" ? "vyumba" : "bed"}</span>
            )}
            {property.bathrooms && (
              <span>🚿 {property.bathrooms} {lang === "sw" ? "bafu" : "bath"}</span>
            )}
            {property.area && <span>📐 {property.area}</span>}
            {property.make && (
              <span>
                🚗 {property.make} {property.model}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Eye size={12} /> {property.views}
              </span>
              <span>•</span>
              <span>{timeAgo(property.postedAt, lang)}</span>
            </div>
            {isVerified && (
              <span className="flex items-center gap-1 text-xs text-[#2F6D4F] font-medium">
                <Shield size={12} />
                Verified
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Grid view
  return (
    <Link
      to={`/mali/${property.id}`}
      className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all group block ${
        isSold ? "border-gray-200 opacity-75" : "border-gray-100"
      }`}
    >
      <div className="relative">
        <div className="w-full h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
          {cardImage ? (
            <img
              src={cardImage}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
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
              <TrendingUp size={10} />
              Search Priority
            </span>
          )}
          {isFeatured && (
            <span className="bg-[#E8A33D] text-[#101A2E] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star size={10} fill="#101A2E" />
              Featured
            </span>
          )}
          {isReserved && (
            <span className="bg-[#E8A33D] text-[#101A2E] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Clock3 size={10} />
              RESERVED
            </span>
          )}
          {isSold && (
            <span className="bg-[#101A2E] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Ban size={10} />
              SOLD
            </span>
          )}
        </div>

        {isVerified && (
          <span className="absolute top-2 right-2 bg-[#2F6D4F] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Shield size={10} />
            Verified
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
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-medium text-[#E8A33D] bg-[#E8A33D]/10 px-2 py-0.5 rounded-full">
            {categoryLabel}
          </span>
        </div>
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
            <Clock3 size={11} />
            {reservationCountdown(property.reservedUntil, lang)}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
          {property.bedrooms && <span>🛏 {property.bedrooms}</span>}
          {property.bathrooms && <span>🚿 {property.bathrooms}</span>}
          {property.area && <span>📐 {property.area}</span>}
          {property.make && <span>🚗 {property.year}</span>}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Eye size={12} /> {property.views}
          </span>
          <span>{timeAgo(property.postedAt, lang)}</span>
        </div>
      </div>
    </Link>
  );
}

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
    const reset = { categories: [], priceRange: null, regions: [], verified: false, featured: false };
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
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={16} />
          {lang === "sw" ? "Vichujio" : "Filters"}
        </h3>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {lang === "sw" ? "Kategoria" : "Category"}
        </h4>
        <div className="space-y-2">
          {allCategories.map((cat) => {
            const CatIcon = getCategoryIcon(cat.iconKey);
            return (
              <label key={cat.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.categories.includes(cat.key)}
                  onChange={() => toggleCategory(cat.key)}
                  className="w-4 h-4 rounded text-[#E8A33D] focus:ring-[#E8A33D]"
                />
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt=""
                    className="w-5 h-5 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <CatIcon size={16} className="text-gray-400 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-600">
                  {cat.label[lang] || cat.label.sw}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {lang === "sw" ? "Bei" : "Price"}
        </h4>
        <div className="space-y-2">
          {priceRanges.map((range, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priceRange"
                checked={localFilters.priceRange === idx}
                onChange={() => setLocalFilters({ ...localFilters, priceRange: idx })}
                className="w-4 h-4 text-[#E8A33D] focus:ring-[#E8A33D]"
              />
              <span className="text-sm text-gray-600">
                {lang === "sw" ? range.label : range.en}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {lang === "sw" ? "Mkoa" : "Region"}
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {REGIONS.map((region) => (
            <label key={region} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.regions.includes(region)}
                onChange={() => toggleRegion(region)}
                className="w-4 h-4 rounded text-[#E8A33D] focus:ring-[#E8A33D]"
              />
              <span className="text-sm text-gray-600">{region}</span>
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
              onChange={(e) => setLocalFilters({ ...localFilters, verified: e.target.checked })}
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
              onChange={(e) => setLocalFilters({ ...localFilters, featured: e.target.checked })}
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
export default function BrowseProperties({ lang = "sw" }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
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

  const allProperties = usePublicListings();

  const filteredProperties = useMemo(() => {
    let result = [...allProperties];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          (p.region && p.region.toLowerCase().includes(q))
      );
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

    // Leading Fee inapewa kipaumbele; kisha AVAILABLE → RESERVED → SOLD
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

  const toggleSave = (id) => toggleSaved(id);

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
      style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "100%" }}
      className="w-full p-4 sm:p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-7xl mx-auto">
        <h1
          style={{ fontFamily: FONTS.display, color: COLORS.night }}
          className="text-2xl sm:text-3xl font-semibold mb-1"
        >
          {lang === "sw" ? "Tafuta Mali" : "Browse Properties"}
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-5">
          {lang === "sw"
            ? "Pata mali unayoitafuta kutoka kwa wauzaji walioidhinishwa."
            : "Find the property you're looking for from verified sellers."}
        </p>

        <form onSubmit={handleSearchSubmit} className="mb-5">
          <div className="relative max-w-2xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
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
              style={{ background: "white", borderColor: COLORS.sandLine, color: COLORS.night }}
              className="w-full rounded-full border pl-12 pr-32 py-3.5 text-sm outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-all"
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
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-gray-500">
                  {lang === "sw" ? "Vichujio:" : "Filters:"}
                </span>
                {filters.categories.map((cat) => {
                  const catObj = getCategory(cat);
                  const catImg = catObj?.imageUrl;
                  return (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 bg-[#E8A33D]/10 text-[#8A5A16] text-xs px-2.5 py-1 rounded-full"
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
                            categories: filters.categories.filter((c) => c !== cat),
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
                    <PropertyCard
                      key={property.id}
                      property={property}
                      viewMode={viewMode}
                      isSaved={savedIds.includes(property.id)}
                      onToggleSave={toggleSave}
                      lang={lang}
                    />
                  ))}
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
                <Search size={48} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-semibold text-gray-800">
                  {lang === "sw" ? "Hakuna mali iliyopatikana" : "No properties found"}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {lang === "sw"
                    ? "Jaribu kubadilisha vichujio au utafutaji wako"
                    : "Try changing your filters or search"}
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-5 py-2 bg-[#E8A33D] text-[#101A2E] rounded-lg text-sm font-semibold hover:bg-[#B87A1F] transition-colors"
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

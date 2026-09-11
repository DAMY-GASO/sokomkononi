import React, { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
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
  Trees,
  Car,
  Briefcase,
  Wrench,
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
import { useSavedIds, toggleSaved } from "../config/savedStore.js";
import { isBoostActive, isLeadingActive } from "./dashboard/components/shared";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  sandLine: "#E6E2D6",
};

// ============================================================
// CATEGORY INFO
// ============================================================
const CATEGORY_INFO = {
  nyumba: { label: { sw: "Nyumba", en: "Houses" }, icon: HomeIcon },
  viwanja: { label: { sw: "Viwanja", en: "Plots" }, icon: Trees },
  magari: { label: { sw: "Magari", en: "Cars" }, icon: Car },
  biashara: { label: { sw: "Biashara", en: "Businesses" }, icon: Briefcase },
  mashine: { label: { sw: "Mashine", en: "Machinery" }, icon: Wrench },
};

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
// HELPERS
// ============================================================
function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

function timeAgo(dateStr, lang) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return lang === "sw" ? "Leo" : "Today";
  if (days === 1) return lang === "sw" ? "Jana" : "Yesterday";
  if (days < 30) return lang === "sw" ? `Siku ${days}` : `${days} days`;
  const months = Math.floor(days / 30);
  return months === 1
    ? lang === "sw" ? "Mwezi 1" : "1 month"
    : lang === "sw" ? `Miezi ${months}` : `${months} months`;
}

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
// PROPERTY CARD
// ============================================================
function PropertyCard({ property, viewMode, isSaved, onToggleSave, searchQuery, lang }) {
  const categoryInfo = CATEGORY_INFO[property.category] || CATEGORY_INFO.nyumba;
  const Icon = categoryInfo.icon;
  const isFeatured = isBoostActive(property);
  const isLeading = isLeadingActive(property);
  const isVerified = Boolean(property.verified);
  const isReserved = property.status === "reserved";
  const isSold = property.status === "sold";

  const highlightText = (text) => {
    if (!searchQuery || !text) return text;
    const parts = String(text).split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-[#E8A33D]/30 text-[#101A2E] rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

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
          className="w-full sm:w-48 h-48 sm:h-auto bg-gray-100 flex items-center justify-center flex-shrink-0 relative"
        >
          <Icon size={32} className="text-gray-300" />
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
                  {highlightText(property.title)}
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
                isSaved ? "bg-[#C1502E] text-white" : "text-gray-400 hover:text-[#C1502E]"
              }`}
            >
              <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <MapPin size={12} />
            {highlightText(property.location)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-medium text-[#E8A33D] bg-[#E8A33D]/10 px-2 py-0.5 rounded-full">
              {categoryInfo.label[lang]}
            </span>
          </div>
          <p className="text-[#C1502E] font-bold text-base mt-2">
            {formatTZS(property.price)}
          </p>
          {isReserved && property.reservedUntil && (
            <p className="text-[11px] font-medium text-[#8A5A16] mt-1 flex items-center gap-1">
              <Clock3 size={11} /> {reservationCountdown(property.reservedUntil, lang)}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
            {property.bedrooms && <span>🛏 {property.bedrooms} {lang === "sw" ? "vyumba" : "bed"}</span>}
            {property.bathrooms && <span>🚿 {property.bathrooms} {lang === "sw" ? "bafu" : "bath"}</span>}
            {property.area && <span>📐 {property.area}</span>}
            {property.titleStatus && <span>📜 {property.titleStatus}</span>}
            {property.make && <span>🚗 {property.make} {property.model}</span>}
            {property.type && <span>🏢 {property.type}</span>}
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
                <Shield size={12} />
                Verified
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
        <div className="w-full h-44 bg-gray-100 flex items-center justify-center">
          <Icon size={40} className="text-gray-300 group-hover:scale-110 transition-transform" />
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
            <Shield size={10} />
            Verified
          </span>
        )}
        <button
          onClick={handleSave}
          className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isSaved ? "bg-[#C1502E] text-white" : "bg-white/90 text-gray-400 hover:text-[#C1502E]"
          }`}
        >
          <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </Link>
      <Link to={`/mali/${property.id}`} className="block p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-medium text-[#E8A33D] bg-[#E8A33D]/10 px-2 py-0.5 rounded-full">
            {categoryInfo.label[lang]}
          </span>
        </div>
        <h3 className="font-semibold text-gray-800 text-sm truncate">
          {highlightText(property.title)}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <MapPin size={12} />
          <span className="truncate">{highlightText(property.location)}</span>
        </div>
        <p className="text-[#C1502E] font-bold text-base mt-2">
          {formatTZS(property.price)}
        </p>
        {isReserved && property.reservedUntil && (
          <p className="text-[11px] font-medium text-[#8A5A16] mt-1 flex items-center gap-1">
            <Clock3 size={11} /> {reservationCountdown(property.reservedUntil, lang)}
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

// ============================================================
// FILTERS SIDEBAR
// ============================================================
function FilterSidebar({ filters, setFilters, isOpen, onClose, lang, onApply }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const priceRanges = [
    { sw: "Chini ya TZS 20M", en: "Under TZS 20M", min: 0, max: 20000000 },
    { sw: "TZS 20M - 50M", en: "TZS 20M - 50M", min: 20000000, max: 50000000 },
    { sw: "TZS 50M - 100M", en: "TZS 50M - 100M", min: 50000000, max: 100000000 },
    { sw: "TZS 100M - 200M", en: "TZS 100M - 200M", min: 100000000, max: 200000000 },
    { sw: "Juu ya TZS 200M", en: "Above TZS 200M", min: 200000000, max: Infinity },
  ];

  const handleApply = () => {
    setFilters(localFilters);
    onApply();
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
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={16} />
          {lang === "sw" ? "Vichujio" : "Filters"}
        </h3>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {lang === "sw" ? "Kategoria" : "Category"}
        </h4>
        <div className="space-y-2">
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.categories.includes(key)}
                onChange={() => toggleCategory(key)}
                className="w-4 h-4 rounded text-[#E8A33D] focus:ring-[#E8A33D]"
              />
              <span className="text-sm text-gray-600">{info.label[lang]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
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
                {lang === "sw" ? range.sw : range.en}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Regions */}
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

      {/* Other */}
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

      {/* Actions */}
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
          <div className="w-80 max-w-[85%] bg-white h-full overflow-y-auto p-5">{content}</div>
        </div>
      )}
    </>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const query = searchParams.get("tafuta") || searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(query);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("relevance");
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

  // === Soma listings halisi kutoka store ===
  const allListings = usePublicListings();

  // Update URL when search changes
  useEffect(() => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, [query]);

  // Search and filter properties
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    const keywords = q.split(/\s+/);

    let result = allListings.filter((p) => {
      const searchableText = [
        p.title,
        p.location,
        p.region,
        p.make,
        p.model,
        p.type,
        p.titleStatus,
        CATEGORY_INFO[p.category]?.label?.sw,
        CATEGORY_INFO[p.category]?.label?.en,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return keywords.every((keyword) => searchableText.includes(keyword));
    });

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
        case "newest":
          return new Date(b.postedAt) - new Date(a.postedAt);
        case "popular":
          return (b.views || 0) - (a.views || 0);
        case "relevance":
        default:
          return 0;
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

      if (sortBy === "relevance") {
        const aFeat = isBoostActive(a) ? 1 : 0;
        const bFeat = isBoostActive(b) ? 1 : 0;
        if (aFeat !== bFeat) return bFeat - aFeat;
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        return new Date(b.postedAt) - new Date(a.postedAt);
      }

      return sortComparator(a, b);
    });

    return result;
  }, [allListings, query, filters, sortBy]);

  const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE);
  const paginatedResults = searchResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ tafuta: searchQuery.trim() });
    }
  };

  const toggleSave = (id) => toggleSaved(id);

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: null,
      regions: [],
      verified: false,
      featured: false,
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceRange !== null ||
    filters.regions.length > 0 ||
    filters.verified ||
    filters.featured;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* SEARCH HEADER */}
      <section className="bg-[#101A2E] text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {lang === "sw" ? "Matokeo ya Utafutaji" : "Search Results"}
          </h1>
          {query && (
            <p className="text-white/60 text-sm mt-1">
              {lang === "sw" ? `Matokeo ya "${query}"` : `Results for "${query}"`}
            </p>
          )}

          <form onSubmit={handleSearchSubmit} className="mt-6 max-w-2xl">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === "sw"
                    ? "Tafuta nyumba, gari, kiwanja..."
                    : "Search houses, cars, plots..."
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

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            lang={lang}
            onApply={() => setCurrentPage(1)}
          />

          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">{searchResults.length}</span>{" "}
                  {lang === "sw" ? "matokeo yamepatikana" : "results found"}
                </p>
                {query && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lang === "sw" ? "Kwa:" : "For:"} "{query}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  {lang === "sw" ? "Vichujio" : "Filters"}
                  {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#C1502E]" />}
                </button>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:border-[#E8A33D] cursor-pointer"
                  >
                    <option value="relevance">
                      {lang === "sw" ? "Uhusiano" : "Relevance"}
                    </option>
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
                      viewMode === "grid" ? "bg-[#E8A33D] text-[#101A2E]" : "text-gray-500 hover:bg-gray-50"
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid3x3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${
                      viewMode === "list" ? "bg-[#E8A33D] text-[#101A2E]" : "text-gray-500 hover:bg-gray-50"
                    }`}
                    aria-label="List view"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-gray-500">
                  {lang === "sw" ? "Vichujio:" : "Filters:"}
                </span>
                {filters.categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 bg-[#E8A33D]/10 text-[#8A5A16] text-xs px-2.5 py-1 rounded-full"
                  >
                    {CATEGORY_INFO[cat]?.label[lang]}
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
                ))}
                {filters.regions.map((region) => (
                  <span
                    key={region}
                    className="inline-flex items-center gap-1 bg-[#2F6D4F]/10 text-[#2F6D4F] text-xs px-2.5 py-1 rounded-full"
                  >
                    {region}
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          regions: filters.regions.filter((r) => r !== region),
                        })
                      }
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {filters.verified && (
                  <span className="inline-flex items-center gap-1 bg-[#2F6D4F]/10 text-[#2F6D4F] text-xs px-2.5 py-1 rounded-full">
                    Verified
                    <button onClick={() => setFilters({ ...filters, verified: false })}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.featured && (
                  <span className="inline-flex items-center gap-1 bg-[#E8A33D]/10 text-[#8A5A16] text-xs px-2.5 py-1 rounded-full">
                    Featured
                    <button onClick={() => setFilters({ ...filters, featured: false })}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#C1502E] hover:underline font-medium"
                >
                  {lang === "sw" ? "Safisha zote" : "Clear all"}
                </button>
              </div>
            )}

            {/* Results */}
            {!query.trim() ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-800">
                  {lang === "sw" ? "Anza kutafuta" : "Start searching"}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {lang === "sw"
                    ? "Weka neno la kutafuta ili kupata mali"
                    : "Enter a search term to find properties"}
                </p>
              </div>
            ) : paginatedResults.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                      : "flex flex-col gap-3"
                  }
                >
                  {paginatedResults.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      viewMode={viewMode}
                      isSaved={savedIds.includes(property.id)}
                      onToggleSave={toggleSave}
                      searchQuery={query}
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
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-800">
                  {lang === "sw" ? "Hakuna matokeo yaliyopatikana" : "No results found"}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {lang === "sw"
                    ? `Hakuna mali inayolingana na "${query}"`
                    : `No properties match "${query}"`}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setSearchParams({});
                      setSearchQuery("");
                    }}
                    className="px-5 py-2 bg-[#E8A33D] text-[#101A2E] rounded-lg text-sm font-semibold hover:bg-[#B87A1F] transition-colors"
                  >
                    {lang === "sw" ? "Anza Utafutaji Mpya" : "New Search"}
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      {lang === "sw" ? "Safisha Vichujio" : "Clear Filters"}
                    </button>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-3">
                    {lang === "sw" ? "Mapendekezo:" : "Suggestions:"}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {["Nyumba", "Magari", "Viwanja", "Dar es Salaam", "Arusha"].map(
                      (suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setSearchQuery(suggestion);
                            setSearchParams({ tafuta: suggestion });
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-[#E8A33D]/10 hover:text-[#E8A33D] text-gray-600 text-xs font-medium rounded-full transition-colors"
                        >
                          {suggestion}
                        </button>
                      )
                    )}
                  </div>
                </div>
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

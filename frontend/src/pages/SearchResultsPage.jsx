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
  Clock,
  DollarSign,
} from "lucide-react";

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

// ============================================================
// MOCK DATA - Mali zote (combined)
// ============================================================

const ALL_PROPERTIES = [
  // Nyumba
  { id: "n1", title: "Nyumba ya Ghorofa Mbezi Beach", category: "nyumba", price: 85000000, location: "Mbezi Beach, Dar es Salaam", region: "Dar es Salaam", bedrooms: 4, bathrooms: 3, area: "350 sqm", isFeatured: true, isVerified: true, views: 214, postedAt: "2026-08-28" },
  { id: "n2", title: "Apartment ya Kisasa Masaki", category: "nyumba", price: 150000000, location: "Masaki, Dar es Salaam", region: "Dar es Salaam", bedrooms: 3, bathrooms: 2, area: "180 sqm", isFeatured: true, isVerified: true, views: 456, postedAt: "2026-08-25" },
  { id: "n3", title: "Nyumba ya Vyumba 3, Njiro", category: "nyumba", price: 45000000, location: "Njiro, Arusha", region: "Arusha", bedrooms: 3, bathrooms: 2, area: "200 sqm", isVerified: true, views: 178, postedAt: "2026-08-20" },
  { id: "n4", title: "Villa ya Kifahari Oysterbay", category: "nyumba", price: 250000000, location: "Oysterbay, Dar es Salaam", region: "Dar es Salaam", bedrooms: 5, bathrooms: 4, area: "500 sqm", isFeatured: true, views: 892, postedAt: "2026-08-15" },
  { id: "n5", title: "Nyumba ya Kienyeji Kigamboni", category: "nyumba", price: 35000000, location: "Kigamboni, Dar es Salaam", region: "Dar es Salaam", bedrooms: 3, bathrooms: 2, area: "250 sqm", views: 123, postedAt: "2026-08-10" },
  { id: "n6", title: "Apartment Mbezi Luis", category: "nyumba", price: 65000000, location: "Mbezi Luis, Dar es Salaam", region: "Dar es Salaam", bedrooms: 2, bathrooms: 2, area: "120 sqm", isVerified: true, views: 267, postedAt: "2026-08-05" },

  // Viwanja
  { id: "v1", title: "Kiwanja Ubungo — Hati Miliki", category: "viwanja", price: 28000000, location: "Ubungo, Dar es Salaam", region: "Dar es Salaam", area: "600 sqm", title: "Hati Miliki", isVerified: true, views: 145, postedAt: "2026-08-28" },
  { id: "v2", title: "Shamba la Kilimo Kilosa", category: "viwanja", price: 1500000, location: "Kilosa, Morogoro", region: "Morogoro", area: "5 ekari", title: "Hati ya Kimila", views: 234, postedAt: "2026-08-25" },
  { id: "v3", title: "Kiwanja Kigamboni", category: "viwanja", price: 18000000, location: "Kigamboni, Dar es Salaam", region: "Dar es Salaam", area: "400 sqm", title: "Hati Miliki", isFeatured: true, isVerified: true, views: 389, postedAt: "2026-08-20" },
  { id: "v4", title: "Shamba Ismani Iringa", category: "viwanja", price: 8500000, location: "Ismani, Iringa", region: "Iringa", area: "10 ekari", title: "Hati Miliki", views: 167, postedAt: "2026-08-15" },

  // Magari
  { id: "m1", title: "Toyota Harrier 2016", category: "magari", price: 42000000, location: "Kinondoni, Dar es Salaam", region: "Dar es Salaam", make: "Toyota", model: "Harrier", year: 2016, mileage: "85,000 km", fuel: "Petrol", transmission: "Automatic", isFeatured: true, isVerified: true, views: 567, postedAt: "2026-08-28" },
  { id: "m2", title: "Toyota Land Cruiser Prado 2018", category: "magari", price: 95000000, location: "Masaki, Dar es Salaam", region: "Dar es Salaam", make: "Toyota", model: "Prado", year: 2018, mileage: "45,000 km", fuel: "Diesel", transmission: "Automatic", isFeatured: true, isVerified: true, views: 892, postedAt: "2026-08-25" },
  { id: "m3", title: "Nissan X-Trail 2015", category: "magari", price: 28000000, location: "Mwanza", region: "Mwanza", make: "Nissan", model: "X-Trail", year: 2015, mileage: "120,000 km", fuel: "Petrol", transmission: "Automatic", views: 234, postedAt: "2026-08-20" },
  { id: "m4", title: "Toyota IST 2007", category: "magari", price: 12500000, location: "Arusha", region: "Arusha", make: "Toyota", model: "IST", year: 2007, mileage: "180,000 km", fuel: "Petrol", transmission: "Automatic", views: 189, postedAt: "2026-08-15" },

  // Biashara
  { id: "b1", title: "Duka la Vifaa vya Ujenzi — Kariakoo", category: "biashara", price: 15000000, location: "Kariakoo, Dar es Salaam", region: "Dar es Salaam", type: "Duka", revenue: "TZS 5M/mwezi", isFeatured: true, isVerified: true, views: 389, postedAt: "2026-08-28" },
  { id: "b2", title: "Mgahawa wa Kisasa — Mikocheni", category: "biashara", price: 45000000, location: "Mikocheni, Dar es Salaam", region: "Dar es Salaam", type: "Mgahawa", revenue: "TZS 15M/mwezi", isFeatured: true, isVerified: true, views: 567, postedAt: "2026-08-25" },

  // Mashine
  { id: "ma1", title: "Excavator CAT 320D", category: "mashine", price: 120000000, location: "Chalinze, Pwani", region: "Pwani", type: "Excavator", hours: "3,200 hrs", condition: "Nzuri Sana", isFeatured: true, isVerified: true, views: 234, postedAt: "2026-08-28" },
  { id: "ma2", title: "Trekta la Kilimo John Deere", category: "mashine", price: 68000000, location: "Mbeya", region: "Mbeya", type: "Trekta", hours: "1,500 hrs", condition: "Nzuri Sana", isVerified: true, views: 345, postedAt: "2026-08-25" },
];

// Regions za Tanzania
const REGIONS = [
  "Dar es Salaam",
  "Arusha",
  "Mwanza",
  "Dodoma",
  "Mbeya",
  "Morogoro",
  "Tanga",
  "Zanzibar",
  "Iringa",
  "Pwani",
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatTZS(amount) {
  return "TZS " + Math.round(amount).toLocaleString("en-US");
}

function timeAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return "Leo";
  if (days === 1) return "Jana";
  if (days < 30) return `Siku ${days}`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Mwezi 1" : `Miezi ${months}`;
}

// ============================================================
// PROPERTY CARD
// ============================================================

function PropertyCard({ property, viewMode, isSaved, onToggleSave, searchQuery, lang }) {
  const categoryInfo = CATEGORY_INFO[property.category] || CATEGORY_INFO.nyumba;
  const Icon = categoryInfo.icon;

  // Highlight search term
  const highlightText = (text) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
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

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col sm:flex-row">
        <Link
          to={`/mali/${property.id}`}
          className="w-full sm:w-48 h-48 sm:h-auto bg-gray-100 flex items-center justify-center flex-shrink-0 relative"
        >
          <Icon size={32} className="text-gray-300" />
          {property.isFeatured && (
            <span className="absolute top-2 left-2 bg-[#E8A33D] text-[#101A2E] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star size={10} fill="#101A2E" />
              Featured
            </span>
          )}
        </Link>
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/mali/${property.id}`} className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-sm hover:text-[#E8A33D] transition-colors">
                {highlightText(property.title)}
              </h3>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleSave(property.id);
              }}
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
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {property.bedrooms && <span>🛏 {property.bedrooms} vyumba</span>}
            {property.bathrooms && <span>🚿 {property.bathrooms} bafu</span>}
            {property.area && <span>📐 {property.area}</span>}
            {property.make && <span>🚗 {property.make} {property.model}</span>}
            {property.type && <span>🏢 {property.type}</span>}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Eye size={12} /> {property.views}
              </span>
              <span>•</span>
              <span>{timeAgo(property.postedAt)}</span>
            </div>
            {property.isVerified && (
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
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
      <Link to={`/mali/${property.id}`} className="block relative">
        <div className="w-full h-44 bg-gray-100 flex items-center justify-center">
          <Icon size={40} className="text-gray-300 group-hover:scale-110 transition-transform" />
        </div>
        {property.isFeatured && (
          <span className="absolute top-2 left-2 bg-[#E8A33D] text-[#101A2E] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Star size={10} fill="#101A2E" />
            Featured
          </span>
        )}
        {property.isVerified && (
          <span className="absolute top-2 right-2 bg-[#2F6D4F] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Shield size={10} />
            Verified
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleSave(property.id);
          }}
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
          <span>{timeAgo(property.postedAt)}</span>
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
    { label: "Chini ya TZS 20M", min: 0, max: 20000000 },
    { label: "TZS 20M - 50M", min: 20000000, max: 50000000 },
    { label: "TZS 50M - 100M", min: 50000000, max: 100000000 },
    { label: "TZS 100M - 200M", min: 100000000, max: 200000000 },
    { label: "Juu ya TZS 200M", min: 200000000, max: Infinity },
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
          Vichujio
        </h3>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Kategoria</h4>
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
        <h4 className="text-sm font-medium text-gray-700 mb-3">Bei</h4>
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
              <span className="text-sm text-gray-600">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Mkoa</h4>
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
        <h4 className="text-sm font-medium text-gray-700 mb-3">Vigezo Vingine</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.verified}
              onChange={(e) => setLocalFilters({ ...localFilters, verified: e.target.checked })}
              className="w-4 h-4 rounded text-[#E8A33D] focus:ring-[#E8A33D]"
            />
            <span className="text-sm text-gray-600">Zilizothibitishwa tu</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.featured}
              onChange={(e) => setLocalFilters({ ...localFilters, featured: e.target.checked })}
              className="w-4 h-4 rounded text-[#E8A33D] focus:ring-[#E8A33D]"
            />
            <span className="text-sm text-gray-600">Featured tu</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-4 border-t border-gray-100">
        <button
          onClick={handleApply}
          className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          Tumia Vichujio
        </button>
        <button
          onClick={handleReset}
          className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          Safisha
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

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

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
  const [savedIds, setSavedIds] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

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

    let result = ALL_PROPERTIES.filter((p) => {
      const searchableText = [
        p.title,
        p.location,
        p.region,
        p.make,
        p.model,
        p.type,
        p.title,
        CATEGORY_INFO[p.category]?.label?.sw,
        CATEGORY_INFO[p.category]?.label?.en,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // All keywords must match
      return keywords.every((keyword) => searchableText.includes(keyword));
    });

    // Apply filters
    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }

    if (filters.regions.length > 0) {
      result = result.filter((p) => filters.regions.includes(p.region));
    }

    if (filters.verified) {
      result = result.filter((p) => p.isVerified);
    }

    if (filters.featured) {
      result = result.filter((p) => p.isFeatured);
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

    // Sort
    switch (sortBy) {
      case "price_low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        break;
      case "popular":
        result.sort((a, b) => b.views - a.views);
        break;
      case "relevance":
      default:
        // Featured first, then verified, then newest
        result.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          if (a.isVerified && !b.isVerified) return -1;
          if (!a.isVerified && b.isVerified) return 1;
          return new Date(b.postedAt) - new Date(a.postedAt);
        });
    }

    return result;
  }, [query, filters, sortBy]);

  // Pagination
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

  const toggleSave = (id) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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

      {/* ================= SEARCH HEADER ================= */}
      <section className="bg-[#101A2E] text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {lang === "sw" ? "Matokeo ya Utafutaji" : "Search Results"}
          </h1>
          {query && (
            <p className="text-white/60 text-sm mt-1">
              {lang === "sw"
                ? `Matokeo ya "${query}"`
                : `Results for "${query}"`}
            </p>
          )}

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

      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            lang={lang}
            onApply={() => setCurrentPage(1)}
          />

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">
                    {searchResults.length}
                  </span>{" "}
                  {lang === "sw"
                    ? "matokeo yamepatikana"
                    : "results found"}
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
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-[#C1502E]" />
                  )}
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
                  {lang === "sw"
                    ? "Hakuna matokeo yaliyopatikana"
                    : "No results found"}
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

                {/* Suggestions */}
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

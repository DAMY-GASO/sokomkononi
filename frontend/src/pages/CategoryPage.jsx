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
  Trees,
  Car,
  Briefcase,
  Wrench,
  Star,
  Shield,
  Eye,
  ChevronLeft,
  ChevronRight,
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
// CATEGORY MAPPING
// ============================================================

const CATEGORY_INFO = {
  nyumba: {
    label: { sw: "Nyumba & Majengo", en: "Houses & Buildings" },
    icon: HomeIcon,
    description: {
      sw: "Pata nyumba, apartments, na majengo yote Tanzania",
      en: "Find houses, apartments, and buildings across Tanzania",
    },
  },
  viwanja: {
    label: { sw: "Viwanja & Mashamba", en: "Plots & Land" },
    icon: Trees,
    description: {
      sw: "Viwanja vya makazi, kilimo, na biashara",
      en: "Residential, agricultural, and commercial plots",
    },
  },
  magari: {
    label: { sw: "Magari", en: "Cars" },
    icon: Car,
    description: {
      sw: "Magari mapya na yaliyotumika Tanzania",
      en: "New and used cars in Tanzania",
    },
  },
  biashara: {
    label: { sw: "Biashara Zinazouzwa", en: "Businesses for Sale" },
    icon: Briefcase,
    description: {
      sw: "Biashara zinazouzwa - maduka, migahawa, n.k.",
      en: "Businesses for sale - shops, restaurants, etc.",
    },
  },
  mashine: {
    label: { sw: "Mashine & Equipment", en: "Machinery & Equipment" },
    icon: Wrench,
    description: {
      sw: "Mashine za ujenzi, kilimo, na viwanda",
      en: "Construction, agricultural, and industrial machinery",
    },
  },
};

// ============================================================
// MOCK DATA - Mali 12 kwa category
// ============================================================

const MOCK_PROPERTIES = {
  nyumba: [
    { id: "n1", title: "Nyumba ya Ghorofa Mbezi Beach", price: 85000000, location: "Mbezi Beach, Dar es Salaam", bedrooms: 4, bathrooms: 3, area: "350 sqm", isFeatured: true, isVerified: true, views: 214, postedAt: "2026-08-28", img: "/assets/properties/house1.jpg" },
    { id: "n2", title: "Apartment ya Kisasa Masaki", price: 150000000, location: "Masaki, Dar es Salaam", bedrooms: 3, bathrooms: 2, area: "180 sqm", isFeatured: true, isVerified: true, views: 456, postedAt: "2026-08-25", img: "/assets/properties/house2.jpg" },
    { id: "n3", title: "Nyumba ya Vyumba 3, Njiro", price: 45000000, location: "Njiro, Arusha", bedrooms: 3, bathrooms: 2, area: "200 sqm", isVerified: true, views: 178, postedAt: "2026-08-20", img: "/assets/properties/house3.jpg" },
    { id: "n4", title: "Villa ya Kifahari Oysterbay", price: 250000000, location: "Oysterbay, Dar es Salaam", bedrooms: 5, bathrooms: 4, area: "500 sqm", isFeatured: true, views: 892, postedAt: "2026-08-15", img: "/assets/properties/house4.jpg" },
    { id: "n5", title: "Nyumba ya Kienyeji Kigamboni", price: 35000000, location: "Kigamboni, Dar es Salaam", bedrooms: 3, bathrooms: 2, area: "250 sqm", views: 123, postedAt: "2026-08-10", img: "/assets/properties/house5.jpg" },
    { id: "n6", title: "Apartment Mbezi Luis", price: 65000000, location: "Mbezi Luis, Dar es Salaam", bedrooms: 2, bathrooms: 2, area: "120 sqm", isVerified: true, views: 267, postedAt: "2026-08-05", img: "/assets/properties/house6.jpg" },
    { id: "n7", title: "Nyumba Sinza Madukani", price: 55000000, location: "Sinza, Dar es Salaam", bedrooms: 3, bathrooms: 2, area: "180 sqm", views: 145, postedAt: "2026-07-28", img: "/assets/properties/house7.jpg" },
    { id: "n8", title: "Ghorofa Mikocheni", price: 120000000, location: "Mikocheni, Dar es Salaam", bedrooms: 4, bathrooms: 3, area: "300 sqm", isFeatured: true, isVerified: true, views: 534, postedAt: "2026-07-20", img: "/assets/properties/house8.jpg" },
    { id: "n9", title: "Nyumba Mwenge", price: 40000000, location: "Mwenge, Dar es Salaam", bedrooms: 3, bathrooms: 2, area: "200 sqm", views: 89, postedAt: "2026-07-15", img: "/assets/properties/house9.jpg" },
    { id: "n10", title: "Villa Kigali", price: 180000000, location: "Kigali, Dar es Salaam", bedrooms: 5, bathrooms: 4, area: "450 sqm", isVerified: true, views: 312, postedAt: "2026-07-10", img: "/assets/properties/house10.jpg" },
    { id: "n11", title: "Nyumba Tabata", price: 38000000, location: "Tabata, Dar es Salaam", bedrooms: 3, bathrooms: 2, area: "170 sqm", views: 156, postedAt: "2026-07-05", img: "/assets/properties/house11.jpg" },
    { id: "n12", title: "Apartment Kariakoo", price: 72000000, location: "Kariakoo, Dar es Salaam", bedrooms: 2, bathrooms: 2, area: "110 sqm", views: 234, postedAt: "2026-06-28", img: "/assets/properties/house12.jpg" },
  ],
  viwanja: [
    { id: "v1", title: "Kiwanja Ubungo — Hati Miliki", price: 28000000, location: "Ubungo, Dar es Salaam", area: "600 sqm", title: "Hati Miliki", isVerified: true, views: 145, postedAt: "2026-08-28", img: "/assets/properties/land1.jpg" },
    { id: "v2", title: "Shamba la Kilimo Kilosa", price: 1500000, location: "Kilosa, Morogoro", area: "5 ekari", title: "Hati ya Kimila", views: 234, postedAt: "2026-08-25", img: "/assets/properties/land2.jpg" },
    { id: "v3", title: "Kiwanja Kigamboni", price: 18000000, location: "Kigamboni, Dar es Salaam", area: "400 sqm", title: "Hati Miliki", isFeatured: true, isVerified: true, views: 389, postedAt: "2026-08-20", img: "/assets/properties/land3.jpg" },
    { id: "v4", title: "Shamba Ismani Iringa", price: 8500000, location: "Ismani, Iringa", area: "10 ekari", title: "Hati Miliki", views: 167, postedAt: "2026-08-15", img: "/assets/properties/land4.jpg" },
    { id: "v5", title: "Kiwanja Bunju", price: 22000000, location: "Bunju, Dar es Salaam", area: "500 sqm", title: "Hati Miliki", isVerified: true, views: 278, postedAt: "2026-08-10", img: "/assets/properties/land5.jpg" },
    { id: "v6", title: "Shamba Morogoro Mjini", price: 12000000, location: "Morogoro Mjini", area: "3 ekari", title: "Hati ya Kimila", views: 145, postedAt: "2026-08-05", img: "/assets/properties/land6.jpg" },
    { id: "v7", title: "Kiwanja Mbweni", price: 15000000, location: "Mbweni, Dar es Salaam", area: "400 sqm", title: "Hati Miliki", views: 189, postedAt: "2026-07-28", img: "/assets/properties/land7.jpg" },
    { id: "v8", title: "Shamba Kilimo Dodoma", price: 20000000, location: "Dodoma", area: "8 ekari", title: "Hati Miliki", isFeatured: true, views: 312, postedAt: "2026-07-20", img: "/assets/properties/land8.jpg" },
  ],
  magari: [
    { id: "m1", title: "Toyota Harrier 2016", price: 42000000, location: "Kinondoni, Dar es Salaam", make: "Toyota", model: "Harrier", year: 2016, mileage: "85,000 km", fuel: "Petrol", transmission: "Automatic", isFeatured: true, isVerified: true, views: 567, postedAt: "2026-08-28", img: "/assets/properties/car1.jpg" },
    { id: "m2", title: "Toyota Land Cruiser Prado 2018", price: 95000000, location: "Masaki, Dar es Salaam", make: "Toyota", model: "Prado", year: 2018, mileage: "45,000 km", fuel: "Diesel", transmission: "Automatic", isFeatured: true, isVerified: true, views: 892, postedAt: "2026-08-25", img: "/assets/properties/car2.jpg" },
    { id: "m3", title: "Nissan X-Trail 2015", price: 28000000, location: "Mwanza", make: "Nissan", model: "X-Trail", year: 2015, mileage: "120,000 km", fuel: "Petrol", transmission: "Automatic", views: 234, postedAt: "2026-08-20", img: "/assets/properties/car3.jpg" },
    { id: "m4", title: "Toyota IST 2007", price: 12500000, location: "Arusha", make: "Toyota", model: "IST", year: 2007, mileage: "180,000 km", fuel: "Petrol", transmission: "Automatic", views: 189, postedAt: "2026-08-15", img: "/assets/properties/car4.jpg" },
    { id: "m5", title: "Mercedes-Benz C200 2017", price: 65000000, location: "Dar es Salaam", make: "Mercedes", model: "C200", year: 2017, mileage: "55,000 km", fuel: "Petrol", transmission: "Automatic", isVerified: true, views: 445, postedAt: "2026-08-10", img: "/assets/properties/car5.jpg" },
    { id: "m6", title: "Toyota RAV4 2019", price: 75000000, location: "Dodoma", make: "Toyota", model: "RAV4", year: 2019, mileage: "30,000 km", fuel: "Petrol", transmission: "Automatic", isFeatured: true, views: 678, postedAt: "2026-08-05", img: "/assets/properties/car6.jpg" },
    { id: "m7", title: "Subaru Forester 2014", price: 32000000, location: "Mbeya", make: "Subaru", model: "Forester", year: 2014, mileage: "140,000 km", fuel: "Petrol", transmission: "Automatic", views: 234, postedAt: "2026-07-28", img: "/assets/properties/car7.jpg" },
    { id: "m8", title: "Honda CR-V 2016", price: 45000000, location: "Dar es Salaam", make: "Honda", model: "CR-V", year: 2016, mileage: "90,000 km", fuel: "Petrol", transmission: "Automatic", views: 345, postedAt: "2026-07-20", img: "/assets/properties/car8.jpg" },
    { id: "m9", title: "Toyota Vitz 2015", price: 18000000, location: "Mwanza", make: "Toyota", model: "Vitz", year: 2015, mileage: "100,000 km", fuel: "Petrol", transmission: "Automatic", views: 456, postedAt: "2026-07-15", img: "/assets/properties/car9.jpg" },
    { id: "m10", title: "Mazda CX-5 2018", price: 58000000, location: "Arusha", make: "Mazda", model: "CX-5", year: 2018, mileage: "65,000 km", fuel: "Petrol", transmission: "Automatic", isVerified: true, views: 389, postedAt: "2026-07-10", img: "/assets/properties/car10.jpg" },
  ],
  biashara: [
    { id: "b1", title: "Duka la Vifaa vya Ujenzi — Kariakoo", price: 15000000, location: "Kariakoo, Dar es Salaam", type: "Duka", revenue: "TZS 5M/mwezi", isFeatured: true, isVerified: true, views: 389, postedAt: "2026-08-28", img: "/assets/properties/biz1.jpg" },
    { id: "b2", title: "Mgahawa wa Kisasa — Mikocheni", price: 45000000, location: "Mikocheni, Dar es Salaam", type: "Mgahawa", revenue: "TZS 15M/mwezi", isFeatured: true, isVerified: true, views: 567, postedAt: "2026-08-25", img: "/assets/properties/biz2.jpg" },
    { id: "b3", title: "Saluni ya Kisasa — Mbezi", price: 12000000, location: "Mbezi, Dar es Salaam", type: "Saluni", revenue: "TZS 3M/mwezi", views: 234, postedAt: "2026-08-20", img: "/assets/properties/biz3.jpg" },
    { id: "b4", title: "Duka la Nguo — Kariakoo", price: 25000000, location: "Kariakoo, Dar es Salaam", type: "Duka", revenue: "TZS 8M/mwezi", isVerified: true, views: 345, postedAt: "2026-08-15", img: "/assets/properties/biz4.jpg" },
    { id: "b5", title: "Pharmacy — Sinza", price: 35000000, location: "Sinza, Dar es Salaam", type: "Pharmacy", revenue: "TZS 10M/mwezi", views: 278, postedAt: "2026-08-10", img: "/assets/properties/biz5.jpg" },
    { id: "b6", title: "Kiwanda cha Kutengeneza Samani", price: 85000000, location: "Ubungo, Dar es Salaam", type: "Kiwanda", revenue: "TZS 25M/mwezi", isFeatured: true, views: 456, postedAt: "2026-08-05", img: "/assets/properties/biz6.jpg" },
  ],
  mashine: [
    { id: "ma1", title: "Excavator CAT 320D", price: 120000000, location: "Chalinze, Pwani", type: "Excavator", hours: "3,200 hrs", condition: "Nzuri Sana", isFeatured: true, isVerified: true, views: 234, postedAt: "2026-08-28", img: "/assets/properties/machine1.jpg" },
    { id: "ma2", title: "Trekta la Kilimo John Deere", price: 68000000, location: "Mbeya", type: "Trekta", hours: "1,500 hrs", condition: "Nzuri Sana", isVerified: true, views: 345, postedAt: "2026-08-25", img: "/assets/properties/machine2.jpg" },
    { id: "ma3", title: "Bulldozer Komatsu D65", price: 150000000, location: "Dodoma", type: "Bulldozer", hours: "4,500 hrs", condition: "Nzuri", views: 189, postedAt: "2026-08-20", img: "/assets/properties/machine3.jpg" },
    { id: "ma4", title: "Generator 500 KVA", price: 35000000, location: "Dar es Salaam", type: "Generator", hours: "800 hrs", condition: "Nzuri Sana", isFeatured: true, views: 278, postedAt: "2026-08-15", img: "/assets/properties/machine4.jpg" },
    { id: "ma5", title: "Forklift Toyota 2.5 Ton", price: 25000000, location: "Dar es Salaam", type: "Forklift", hours: "2,000 hrs", condition: "Nzuri", views: 156, postedAt: "2026-08-10", img: "/assets/properties/machine5.jpg" },
    { id: "ma6", title: "Compressor Atlas Copco", price: 18000000, location: "Mwanza", type: "Compressor", hours: "1,200 hrs", condition: "Nzuri Sana", views: 123, postedAt: "2026-08-05", img: "/assets/properties/machine6.jpg" },
  ],
};

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

function PropertyCard({ property, category, viewMode, isSaved, onToggleSave }) {
  const Icon = CATEGORY_INFO[category]?.icon || HomeIcon;

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
                {property.title}
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
            {property.location}
          </div>
          <p className="text-[#C1502E] font-bold text-base mt-2">
            {formatTZS(property.price)}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {property.bedrooms && <span>🛏 {property.bedrooms} vyumba</span>}
            {property.bathrooms && <span>🚿 {property.bathrooms} bafu</span>}
            {property.area && <span>📐 {property.area}</span>}
            {property.make && <span>🚗 {property.make} {property.model}</span>}
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

  // Grid view (default)
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

  const handleApply = () => {
    setFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({ priceRange: null, verified: false, featured: false });
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Bei</h4>
        <div className="space-y-2">
          {priceRanges[category]?.map((range, idx) => (
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

      {/* Other filters */}
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
          {content}
        </div>
      </aside>

      {/* Mobile drawer */}
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
  const { t, lang } = useLanguage();

  const category = slug || "nyumba";
  const categoryInfo = CATEGORY_INFO[category] || CATEGORY_INFO.nyumba;
  const CategoryIcon = categoryInfo.icon;

  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "price_low" | "price_high" | "popular"
  const [filters, setFilters] = useState({ priceRange: null, verified: false, featured: false });
  const [savedIds, setSavedIds] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("tafuta") || "");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  const allProperties = MOCK_PROPERTIES[category] || [];

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    let result = [...allProperties];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }

    // Verified filter
    if (filters.verified) {
      result = result.filter((p) => p.isVerified);
    }

    // Featured filter
    if (filters.featured) {
      result = result.filter((p) => p.isFeatured);
    }

    // Price range filter
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
      const [min, max] = ranges[category][filters.priceRange];
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
      case "popular":
        result.sort((a, b) => b.views - a.views);
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    }

    return result;
  }, [allProperties, searchQuery, filters, sortBy, category]);

  // Pagination
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ================= HERO BANNER ================= */}
      <section className="bg-[#101A2E] text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link to="/" className="hover:text-white transition-colors">
              Nyumbani
            </Link>
            <ChevronRight size={14} />
            <span className="text-white">{categoryInfo.label[lang]}</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E8A33D]/20 flex items-center justify-center flex-shrink-0">
              <CategoryIcon size={28} color={COLORS.gold} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {categoryInfo.label[lang]}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {categoryInfo.description[lang]}
              </p>
            </div>
          </div>

          {/* Search Bar */}
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

      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <FilterSidebar
            category={category}
            filters={filters}
            setFilters={setFilters}
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            lang={lang}
          />

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">
                    {filteredProperties.length}
                  </span>{" "}
                  {lang === "sw" ? "mali zimepatikana" : "properties found"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  {lang === "sw" ? "Vichujio" : "Filters"}
                </button>

                {/* Sort */}
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

                {/* View mode toggle */}
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
            {(filters.priceRange !== null || filters.verified || filters.featured || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-gray-500">
                  {lang === "sw" ? "Vichujio vilivyotumika:" : "Active filters:"}
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
                  onClick={() => {
                    setFilters({ priceRange: null, verified: false, featured: false });
                    setSearchQuery("");
                  }}
                  className="text-xs text-[#C1502E] hover:underline font-medium"
                >
                  {lang === "sw" ? "Safisha zote" : "Clear all"}
                </button>
              </div>
            )}

            {/* Properties Grid/List */}
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
                      category={category}
                      viewMode={viewMode}
                      isSaved={savedIds.includes(property.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>

                {/* Pagination */}
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
                  {lang === "sw" ? "Hakuna mali iliyopatikana" : "No properties found"}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {lang === "sw"
                    ? "Jaribu kubadilisha vichujio au utafutaji wako"
                    : "Try changing your filters or search"}
                </p>
                <button
                  onClick={() => {
                    setFilters({ priceRange: null, verified: false, featured: false });
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

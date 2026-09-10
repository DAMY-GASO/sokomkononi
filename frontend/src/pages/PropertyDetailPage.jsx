import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Heart,
  Share2,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Shield,
  Eye,
  Flag,
  Star,
  Camera,
  Car,
  Fuel,
  Gauge,
  Settings,
  Trees,
  Home as HomeIcon,
  Briefcase,
  Wrench,
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
// MOCK DATA - IMEREKEBISHWA
// Note: Tumia `titleStatus` badala ya `title` kwa hati
// ili kuepuka duplicate key 'title' kwenye features object
// ============================================================

const MOCK_PROPERTY = {
  id: "p1",
  title: "Nyumba ya Ghorofa Mbezi Beach",
  category: "nyumba",
  categoryLabel: "Nyumba & Majengo",
  price: 85000000,
  priceNegotiable: true,
  location: "Mbezi Beach, Dar es Salaam",
  region: "Dar es Salaam",
  description:
    "Nyumba nzuri ya ghorofa yenye vyumba 4 vya kulala, sebule kubwa, jikoni ya kisasa, na eneo la kuegesha magari 3. Iko katika eneo zuri la Mbezi Beach, karibu na shule, hospitali, na maduka. Ina hati miliki kamili na inafaa kwa familia au biashara ya kupangisha.",
  images: [
    "/assets/properties/house1.jpg",
    "/assets/properties/house2.jpg",
    "/assets/properties/house3.jpg",
    "/assets/properties/house4.jpg",
    "/assets/properties/house5.jpg",
  ],
  features: {
    bedrooms: 4,
    bathrooms: 3,
    area: "350 sqm",
    parking: 3,
    yearBuilt: "2020",
    titleStatus: "Hati Miliki",   // ← IMEBADILISHWA kutoka `title`
    furnished: "Semi-Furnished",
    condition: "Nzuri Sana",
  },
  amenities: [
    "Umeme wa TANESCO",
    "Maji ya DAWASA",
    "Ukuta wa Kuzuia",
    "Geti la Umeme",
    "CCTV Cameras",
    "Bustani",
    "Septic Tank",
    "Borehole",
  ],
  seller: {
    id: "s1",
    name: "John Doe",
    avatar: "J",
    phone: "0743 895 038",
    verified: true,
    rating: 4.8,
    totalListings: 12,
    memberSince: "2024",
  },
  stats: {
    views: 214,
    saves: 45,
    inquiries: 6,
  },
  postedAt: "2026-08-28",
  isSaved: false,
  isVerified: true,
  isFeatured: true,
};

// Map ya categories
const CATEGORY_ICONS = {
  nyumba: HomeIcon,
  viwanja: Trees,
  magari: Car,
  biashara: Briefcase,
  mashine: Wrench,
};

function formatTZS(amount) {
  return "TZS " + Math.round(amount).toLocaleString("en-US");
}

function timeAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return "Leo";
  if (days === 1) return "Jana";
  if (days < 30) return `Siku ${days} zilizopita`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Mwezi 1 uliopita" : `Miezi ${months} iliyopita`;
}

// ============================================================
// IMAGE GALLERY
// ============================================================

function ImageGallery({ images, title, isFeatured, isVerified }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="relative w-full h-64 sm:h-96 md:h-[500px] rounded-2xl overflow-hidden bg-gray-100">
        {/* Main Image */}
        <img
          src={images[currentIndex]}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback kama picha haipo
            e.target.style.display = "none";
            e.target.parentElement.classList.add("flex", "items-center", "justify-center");
          }}
        />

        {/* Fallback icon kama picha haipo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <HomeIcon size={64} className="text-gray-300" />
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10">
          <Camera size={14} />
          {currentIndex + 1} / {images.length}
        </div>

        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-3 left-3 bg-[#E8A33D] text-[#101A2E] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 z-10">
            <Star size={12} fill="#101A2E" />
            Featured
          </div>
        )}

        {/* Verified Badge */}
        {isVerified && (
          <div className="absolute top-3 right-3 bg-[#2F6D4F] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 z-10">
            <Shield size={12} />
            Verified
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                idx === currentIndex
                  ? "border-[#E8A33D] opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ============================================================
// FEATURES SECTION
// ============================================================

function FeatureItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
      <div className="w-10 h-10 rounded-lg bg-[#E8A33D]/10 flex items-center justify-center flex-shrink-0">
        <Icon size={18} color={COLORS.gold} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function FeaturesSection({ property }) {
  const features = property.features;

  const featureItems = [];

  if (features.bedrooms) {
    featureItems.push({ icon: Bed, label: "Vyumba vya Kulala", value: features.bedrooms });
  }
  if (features.bathrooms) {
    featureItems.push({ icon: Bath, label: "Bafu", value: features.bathrooms });
  }
  if (features.area) {
    featureItems.push({ icon: Maximize, label: "Ukubwa", value: features.area });
  }
  if (features.parking) {
    featureItems.push({ icon: Car, label: "Maegesho", value: features.parking });
  }
  if (features.yearBuilt) {
    featureItems.push({ icon: Calendar, label: "Mwaka wa Ujenzi", value: features.yearBuilt });
  }
  // ✅ SASA inatumia titleStatus badala ya title
  if (features.titleStatus) {
    featureItems.push({ icon: CheckCircle, label: "Hati", value: features.titleStatus });
  }
  if (features.condition) {
    featureItems.push({ icon: Settings, label: "Hali", value: features.condition });
  }
  if (features.furnished) {
    featureItems.push({ icon: HomeIcon, label: "Samani", value: features.furnished });
  }

  if (featureItems.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Hakuna sifa za ziada zilizoainishwa
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {featureItems.map((item, idx) => (
        <FeatureItem key={idx} {...item} />
      ))}
    </div>
  );
}

// ============================================================
// SELLER CARD
// ============================================================

function SellerCard({ seller, onContact }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-[#E8A33D]/10 flex items-center justify-center text-[#E8A33D] font-bold text-xl flex-shrink-0">
          {seller.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 truncate">{seller.name}</h3>
            {seller.verified && (
              <CheckCircle size={16} className="text-[#2F6D4F] flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              <Star size={12} fill="#E8A33D" color="#E8A33D" />
              <span className="text-xs font-medium text-gray-700">{seller.rating}</span>
            </div>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{seller.totalListings} mali</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Mwanachama tangu {seller.memberSince}
          </p>
        </div>
      </div>

      <button
        onClick={onContact}
        className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <MessageSquare size={16} />
        Wasiliana na Muuzaji
      </button>

      <a
        href={`tel:${seller.phone}`}
        className="w-full mt-2 border border-[#2F6D4F] text-[#2F6D4F] hover:bg-[#2F6D4F]/5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <Phone size={16} />
        Piga Simu
      </a>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Muuzaji amethibitishwa na SokoMkononi
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [property] = useState(MOCK_PROPERTY);
  const [isSaved, setIsSaved] = useState(property.isSaved);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(lang === "sw" ? "Link imenakiliwa!" : "Link copied!");
    }
  };

  const handleContact = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowContactModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 overflow-x-auto">
          <Link to="/" className="hover:text-[#E8A33D] transition-colors whitespace-nowrap">
            {lang === "sw" ? "Nyumbani" : "Home"}
          </Link>
          <ChevronRight size={14} className="flex-shrink-0" />
          <Link
            to={`/kategoria/${property.category}`}
            className="hover:text-[#E8A33D] transition-colors whitespace-nowrap"
          >
            {property.categoryLabel}
          </Link>
          <ChevronRight size={14} className="flex-shrink-0" />
          <span className="text-gray-800 font-medium truncate">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ================= LEFT - Main Content ================= */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery 
              images={property.images} 
              title={property.title}
              isFeatured={property.isFeatured}
              isVerified={property.isVerified}
            />

            {/* Title & Price */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                    <MapPin size={14} className="flex-shrink-0" />
                    <span>{property.location}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {property.stats.views} {lang === "sw" ? "walioangalia" : "views"}
                    </span>
                    <span>•</span>
                    <span>{timeAgo(property.postedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleSave}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                      isSaved
                        ? "bg-[#C1502E] border-[#C1502E] text-white"
                        : "border-gray-200 text-gray-400 hover:text-[#C1502E] hover:border-[#C1502E]"
                    }`}
                    aria-label="Save"
                  >
                    <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-10 h-10 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
                    aria-label="Share"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    className="w-10 h-10 rounded-full border border-gray-200 text-gray-400 hover:text-[#C1502E] flex items-center justify-center transition-colors"
                    aria-label="Report"
                  >
                    <Flag size={18} />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-end gap-3 flex-wrap">
                  <p className="text-2xl sm:text-3xl font-bold text-[#C1502E]">
                    {formatTZS(property.price)}
                  </p>
                  {property.priceNegotiable && (
                    <span className="text-xs font-medium text-[#2F6D4F] bg-[#2F6D4F]/10 px-2.5 py-1 rounded-full mb-1">
                      {lang === "sw" ? "Bei inajadiliwa" : "Negotiable"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "details"
                      ? "text-[#E8A33D] border-b-2 border-[#E8A33D]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {lang === "sw" ? "Maelezo" : "Details"}
                </button>
                <button
                  onClick={() => setActiveTab("amenities")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "amenities"
                      ? "text-[#E8A33D] border-b-2 border-[#E8A33D]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {lang === "sw" ? "Huduma" : "Amenities"}
                </button>
                <button
                  onClick={() => setActiveTab("location")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "location"
                      ? "text-[#E8A33D] border-b-2 border-[#E8A33D]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {lang === "sw" ? "Mahali" : "Location"}
                </button>
              </div>

              <div className="p-5">
                {activeTab === "details" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">
                        {lang === "sw" ? "Maelezo" : "Description"}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {property.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">
                        {lang === "sw" ? "Sifa za Mali" : "Property Features"}
                      </h3>
                      <FeaturesSection property={property} />
                    </div>
                  </div>
                )}

                {activeTab === "amenities" && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">
                      {lang === "sw" ? "Huduma Zilizopo" : "Available Amenities"}
                    </h3>
                    {property.amenities.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {property.amenities.map((amenity, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg"
                          >
                            <CheckCircle size={16} className="text-[#2F6D4F] flex-shrink-0" />
                            <span className="text-sm text-gray-700">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {lang === "sw" ? "Hakuna huduma zilizoainishwa" : "No amenities listed"}
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "location" && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">
                      {lang === "sw" ? "Mahali" : "Location"}
                    </h3>
                    <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <MapPin size={32} className="text-gray-300 mx-auto" />
                        <p className="text-gray-500 text-sm mt-2">{property.location}</p>
                        <p className="text-gray-400 text-xs">
                          {lang === "sw" ? "Ramani itaonekana hapa" : "Map will appear here"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT - Sidebar ================= */}
          <div className="lg:col-span-1 space-y-4">
            {/* Seller Card */}
            <SellerCard seller={property.seller} onContact={handleContact} />

            {/* Safety Tips */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Shield size={16} className="text-[#E8A33D]" />
                {lang === "sw" ? "Vidokezo vya Usalama" : "Safety Tips"}
              </h3>
              <ul className="space-y-2.5">
                {(lang === "sw" ? [
                  "Kutana na muuzaji sehemu za wazi",
                  "Angalia mali kabla ya kulipa",
                  "Thibitisha hati za mali",
                  "Tumia Deal Room yetu kwa mazungumzo",
                ] : [
                  "Meet the seller in open places",
                  "Inspect the property before paying",
                  "Verify property documents",
                  "Use our Deal Room for conversations",
                ]).map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle size={14} className="text-[#2F6D4F] mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
              <Link
                to="/kuhusu#usalama"
                className="block mt-3 text-xs text-[#E8A33D] font-medium hover:underline"
              >
                {lang === "sw" ? "Soma zaidi kuhusu usalama →" : "Read more about safety →"}
              </Link>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">
                {lang === "sw" ? "Takwimu" : "Statistics"}
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-800">{property.stats.views}</p>
                  <p className="text-xs text-gray-500">
                    {lang === "sw" ? "Walioangalia" : "Views"}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{property.stats.saves}</p>
                  <p className="text-xs text-gray-500">
                    {lang === "sw" ? "Wamehifadhi" : "Saves"}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">
                    {property.stats.inquiries}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lang === "sw" ? "Maswali" : "Inquiries"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {lang === "sw" ? "Mali Zinazofanana" : "Similar Properties"}
            </h2>
            <Link
              to={`/kategoria/${property.category}`}
              className="text-[#E8A33D] text-sm font-medium hover:underline"
            >
              {lang === "sw" ? "Tazama Zote →" : "View All →"}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <Link
                key={item}
                to={`/mali/${item}`}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <HomeIcon size={32} className="text-gray-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">
                    {lang === "sw" ? "Nyumba ya Vyumba 3, Mbezi" : "3-Bedroom House, Mbezi"}
                  </h3>
                  <p className="text-[#C1502E] font-bold text-sm mt-1">
                    TZS 35,000,000
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <MapPin size={12} />
                    Dar es Salaam
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {lang === "sw" ? "Wasiliana na" : "Contact"} {property.seller.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {lang === "sw"
                ? "Chagua jinsi ungependa kuwasiliana:"
                : "Choose how you'd like to get in touch:"}
            </p>
            <div className="space-y-2">
              <a
                href={`tel:${property.seller.phone}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Phone size={20} className="text-[#2F6D4F]" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {lang === "sw" ? "Piga Simu" : "Call"}
                  </p>
                  <p className="text-xs text-gray-500">{property.seller.phone}</p>
                </div>
              </a>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  navigate("/dashboard/buyer");
                }}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
              >
                <MessageSquare size={20} className="text-[#E8A33D]" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {lang === "sw" ? "Tuma Ujumbe" : "Send Message"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lang === "sw"
                      ? "Anzisha mazungumzo kwenye Deal Room"
                      : "Start a conversation in the Deal Room"}
                  </p>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowContactModal(false)}
              className="w-full mt-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              {lang === "sw" ? "Funga" : "Close"}
            </button>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}

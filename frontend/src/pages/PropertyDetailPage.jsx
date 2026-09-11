import React, { useState, useMemo } from "react";
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
  Settings,
  Trees,
  Home as HomeIcon,
  Briefcase,
  Wrench,
  Clock3,
  BellRing,
  Ban,
} from "lucide-react";
import { useListings } from "../config/listingsStore.js";
import { useWaitingList, joinWaitingList } from "../config/waitingListStore.js";
import { isBoostActive, isLeadingActive } from "./dashboard/components/shared";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  sandLine: "#E6E2D6",
};

const CATEGORY_ICONS = {
  nyumba: HomeIcon,
  viwanja: Trees,
  magari: Car,
  biashara: Briefcase,
  mashine: Wrench,
};

const CATEGORY_LABELS = {
  nyumba: "Nyumba & Majengo",
  viwanja: "Viwanja & Mashamba",
  magari: "Magari",
  biashara: "Biashara Zinazouzwa",
  mashine: "Mashine / Heavy Equipment",
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

function reservationCountdown(reservedUntil) {
  if (!reservedUntil) return "";
  const ms = new Date(reservedUntil).getTime() - Date.now();
  if (ms <= 0) return "Inaisha hivi karibuni";
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `Saa ${hours} zimebaki`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `Siku ${days} zimebaki`;
  return `Siku ${days} ${remainingHours}saa zimebaki`;
}

// ============================================================
// IMAGE GALLERY
// ============================================================
function ImageGallery({ property }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = property.images || [];
  const Icon = CATEGORY_ICONS[property.category] || HomeIcon;
  const isReserved = property.status === "reserved";
  const isSold = property.status === "sold";
  const isFeatured = isBoostActive(property);
  const isVerified = Boolean(property.verified);

  if (images.length === 0) {
    return (
      <div className="relative w-full h-64 sm:h-96 md:h-[500px] rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
        <Icon size={64} className="text-gray-300" />
        {(isReserved || isSold) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-[#101A2E] text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2">
              {isSold ? <Ban size={16} /> : <Clock3 size={16} />}
              {isSold ? "Imeuzwa" : "Ina Reservation"}
            </span>
          </div>
        )}
      </div>
    );
  }

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <>
      <div className="relative w-full h-64 sm:h-96 md:h-[500px] rounded-2xl overflow-hidden bg-gray-100">
        <img
          src={images[currentIndex]}
          alt={property.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none"; }}
        />

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

        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10">
          <Camera size={14} />
          {currentIndex + 1} / {images.length}
        </div>

        {isFeatured && (
          <div className="absolute top-3 left-3 bg-[#E8A33D] text-[#101A2E] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 z-10">
            <Star size={12} fill="#101A2E" />
            Featured
          </div>
        )}

        {isVerified && (
          <div className="absolute top-3 right-3 bg-[#2F6D4F] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 z-10">
            <Shield size={12} />
            Verified
          </div>
        )}

        {(isReserved || isSold) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
            <span className="bg-[#101A2E] text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2">
              {isSold ? <Ban size={16} /> : <Clock3 size={16} />}
              {isSold ? "Imeuzwa" : "Ina Reservation"}
            </span>
          </div>
        )}
      </div>

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
// FEATURES
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
  const items = [];

  if (property.bedrooms) items.push({ icon: Bed, label: "Vyumba vya Kulala", value: property.bedrooms });
  if (property.bathrooms) items.push({ icon: Bath, label: "Bafu", value: property.bathrooms });
  if (property.area) items.push({ icon: Maximize, label: "Ukubwa", value: property.area });
  if (property.year) items.push({ icon: Calendar, label: "Mwaka", value: property.year });
  if (property.titleStatus) items.push({ icon: CheckCircle, label: "Hati", value: property.titleStatus });
  if (property.make) items.push({ icon: Car, label: "Gari", value: `${property.make} ${property.model || ""}`.trim() });
  if (property.mileage) items.push({ icon: Settings, label: "Mileage", value: property.mileage });
  if (property.type) items.push({ icon: Settings, label: "Aina", value: property.type });
  if (property.hours) items.push({ icon: Settings, label: "Saa za Matumizi", value: property.hours });

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Hakuna sifa za ziada zilizoainishwa
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item, idx) => (
        <FeatureItem key={idx} {...item} />
      ))}
    </div>
  );
}

// ============================================================
// SELLER CARD
// ============================================================
function SellerCard({ property, status, alreadyOnWaitlist, onJoinWaitlist, onContact }) {
  const isReserved = status === "reserved";
  const isSold = status === "sold";
  const isUnavailable = isReserved || isSold;
  const sellerName = property.seller_name || "Muuzaji";
  const sellerInitial = sellerName.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-[#E8A33D]/10 flex items-center justify-center text-[#E8A33D] font-bold text-xl flex-shrink-0">
          {sellerInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 truncate">{sellerName}</h3>
            {property.verified && (
              <CheckCircle size={16} className="text-[#2F6D4F] flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Muuzaji kwenye SokoMkononi
          </p>
        </div>
      </div>

      {isUnavailable ? (
        <>
          <div className="mb-3 p-3 rounded-xl bg-[#E8A33D]/10 border border-[#E8A33D]/30">
            <p className="text-xs font-semibold text-[#8A5A16] flex items-center gap-1.5">
              {isSold ? <Ban size={13} /> : <Clock3 size={13} />}
              {isSold ? "Mali hii tayari imeuzwa." : "Mali hii tayari ina Reservation."}
            </p>
            {isReserved && property.reservedUntil && (
              <p className="text-[11px] text-[#8A5A16] mt-1">
                {reservationCountdown(property.reservedUntil)}
              </p>
            )}
            <p className="text-[11px] text-[#8A5A16]/80 mt-1">
              Jiunge na Waiting List ili tukutaarifu papo hapo endapo itaachiwa huru.
            </p>
          </div>
          <button
            onClick={onJoinWaitlist}
            disabled={alreadyOnWaitlist || isSold}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              alreadyOnWaitlist || isSold
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#101A2E] hover:bg-[#0A1220] text-white"
            }`}
          >
            <BellRing size={16} />
            {isSold
              ? "Imeuzwa Tayari"
              : alreadyOnWaitlist
              ? "Tayari Umejiunga"
              : "Jiunge na Waiting List"}
          </button>
        </>
      ) : (
        <button
          onClick={onContact}
          className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <MessageSquare size={16} />
          Wasiliana na Muuzaji
        </button>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Muuzaji amethibitishwa na SokoMkononi
        </p>
      </div>
    </div>
  );
}

// ============================================================
// NOT FOUND
// ============================================================
function ListingNotFound({ lang }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <HomeIcon size={64} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {lang === "sw" ? "Mali haipatikani" : "Listing not found"}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {lang === "sw"
            ? "Tangazo hili huenda limefutwa au halipo. Tafuta mali nyingine."
            : "This listing may have been removed or does not exist. Browse other properties."}
        </p>
        <Link
          to="/dashboard/buyer"
          className="inline-block bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {lang === "sw" ? "Tafuta Mali Nyingine" : "Browse Other Properties"}
        </Link>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();

  // === BADILIKO KUU: soma listing halisi kutoka store ===
  const allListings = useListings();
  const property = useMemo(() => allListings.find((l) => l.id === id), [allListings, id]);

  const [isSaved, setIsSaved] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const waitingListEntries = useWaitingList();
  const alreadyOnWaitlist = useMemo(
    () =>
      property
        ? waitingListEntries.some(
            (e) =>
              e.property === property.title &&
              (e.status === "pending" || e.status === "notified")
          )
        : false,
    [waitingListEntries, property]
  );

  // Kama listing haipo (id si sahihi) — onyesha "haipatikani".
  if (!property) {
    return <ListingNotFound lang={lang} />;
  }

  const handleJoinWaitlist = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    joinWaitingList({
      property: property.title,
      category: property.category,
      price: property.price,
      location: property.location,
    });
  };

  const handleSave = () => setIsSaved(!isSaved);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description || property.title,
        url: window.location.href,
      });
    } else if (navigator.clipboard) {
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

  const categoryLabel = CATEGORY_LABELS[property.category] || "Mali";

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
            {categoryLabel}
          </Link>
          <ChevronRight size={14} className="flex-shrink-0" />
          <span className="text-gray-800 font-medium truncate">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            <ImageGallery property={property} />

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
                      <Eye size={12} /> {property.views || 0} {lang === "sw" ? "walioangalia" : "views"}
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

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-end gap-3 flex-wrap">
                  <p className="text-2xl sm:text-3xl font-bold text-[#C1502E]">
                    {formatTZS(property.price)}
                  </p>
                  {property.status === "live" && (
                    <span className="text-xs font-medium text-[#2F6D4F] bg-[#2F6D4F]/10 px-2.5 py-1 rounded-full mb-1">
                      {lang === "sw" ? "Inapatikana" : "Available"}
                    </span>
                  )}
                  {property.status === "reserved" && (
                    <span className="text-xs font-medium text-[#8A5A16] bg-[#E8A33D]/15 px-2.5 py-1 rounded-full mb-1">
                      {lang === "sw" ? "Ina Reservation" : "Reserved"}
                    </span>
                  )}
                  {property.status === "sold" && (
                    <span className="text-xs font-medium text-white bg-[#101A2E] px-2.5 py-1 rounded-full mb-1">
                      {lang === "sw" ? "Imeuzwa" : "Sold"}
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
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                        {property.description || (lang === "sw" ? "Hakuna maelezo yaliyotolewa." : "No description provided.")}
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

          {/* RIGHT */}
          <div className="lg:col-span-1 space-y-4">
            <SellerCard
              property={property}
              status={property.status}
              alreadyOnWaitlist={alreadyOnWaitlist}
              onJoinWaitlist={handleJoinWaitlist}
              onContact={handleContact}
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Shield size={16} className="text-[#E8A33D]" />
                {lang === "sw" ? "Vidokezo vya Usalama" : "Safety Tips"}
              </h3>
              <ul className="space-y-2.5">
                {(lang === "sw"
                  ? [
                      "Kutana na muuzaji sehemu za wazi",
                      "Angalia mali kabla ya kulipa",
                      "Thibitisha hati za mali",
                      "Tumia Deal Room yetu kwa mazungumzo",
                    ]
                  : [
                      "Meet the seller in open places",
                      "Inspect the property before paying",
                      "Verify property documents",
                      "Use our Deal Room for conversations",
                    ]
                ).map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle size={14} className="text-[#2F6D4F] mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">
                {lang === "sw" ? "Takwimu" : "Statistics"}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-800">{property.views || 0}</p>
                  <p className="text-xs text-gray-500">
                    {lang === "sw" ? "Walioangalia" : "Views"}
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{property.inquiries || 0}</p>
                  <p className="text-xs text-gray-500">
                    {lang === "sw" ? "Maswali" : "Inquiries"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {lang === "sw" ? "Wasiliana na" : "Contact"} {property.seller_name || "Muuzaji"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {lang === "sw"
                ? "Chagua jinsi ungependa kuwasiliana:"
                : "Choose how you'd like to get in touch:"}
            </p>
            <div className="space-y-2">
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

import React, { useState, useMemo, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../config/authStore.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  MapPin, Bed, Bath, Maximize, Calendar, Heart, Share2, Phone,
  MessageSquare, ChevronLeft, ChevronRight, CheckCircle, Shield,
  Eye, Flag, Star, Camera, Car, Settings, Trees, Home as HomeIcon,
  Briefcase, Wrench, Clock3, BellRing, Ban,
} from "lucide-react";
import {
  useListings,
  fetchListingImagesAsync,
  fetchListingDetailAsync,
} from "../config/listingsStore.js";
import { useSavedIds, toggleSaved } from "../config/savedStore.js";
import { useWaitingList, joinWaitingListAsync } from "../config/waitingListStore.js";
import { getOrCreateDealAsync } from "../config/dealsStore.js";
import { createConversationAsync } from "../config/messagesStore.js";
import {
  CATEGORY_EXTRA,
  getPostingConfig,
} from "../config/categorySchemas.js";
import {
  COLORS,
  isBoostActive,
  isLeadingActive,
} from "./dashboard/components/shared";

const CATEGORY_ICONS = {
  nyumba: HomeIcon,
  viwanja: Trees,
  magari: Car,
  biashara: Briefcase,
  mashine: Wrench,
};

const CATEGORY_LABELS = {
  nyumba: { sw: "Nyumba & Majengo", en: "Houses & Buildings" },
  viwanja: { sw: "Viwanja & Mashamba", en: "Plots & Land" },
  magari: { sw: "Magari", en: "Cars" },
  biashara: { sw: "Biashara Zinazouzwa", en: "Businesses for Sale" },
  mashine: { sw: "Mashine / Heavy Equipment", en: "Machinery / Heavy Equipment" },
};

function t(lang, sw, en) { return lang === "sw" ? sw : en; }
function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}
function timeAgo(dateStr, lang) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return t(lang, "Leo", "Today");
  if (days === 1) return t(lang, "Jana", "Yesterday");
  if (days < 30) return t(lang, `Siku ${days} zilizopita`, `${days} days ago`);
  const months = Math.floor(days / 30);
  return months === 1
    ? t(lang, "Mwezi 1 uliopita", "1 month ago")
    : t(lang, `Miezi ${months} iliyopita`, `${months} months ago`);
}
function reservationCountdown(reservedUntil, lang) {
  if (!reservedUntil) return "";
  const ms = new Date(reservedUntil).getTime() - Date.now();
  if (ms <= 0) return t(lang, "Inaisha hivi karibuni", "Ending soon");
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return t(lang, `Saa ${hours} zimebaki`, `${hours}hrs left`);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return t(lang, `Siku ${days} zimebaki`, `${days} days left`);
  return t(lang, `Siku ${days} ${remainingHours}saa zimebaki`, `${days}d ${remainingHours}h left`);
}

function ImageGallery({ property, lang }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const rawList = [
    ...(Array.isArray(property.images) ? property.images : []),
    ...(Array.isArray(property.photos) ? property.photos : []),
    ...(property.imageUrl ? [property.imageUrl] : []),
    ...(property.image_url ? [property.image_url] : []),
    ...(property.primary_image ? [property.primary_image] : []),
  ];
  const images = rawList
    .map((img) => {
      if (!img) return null;
      if (typeof img === "string") return img;
      return img.image_url || img.url || img.image || img.src || null;
    })
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  const Icon = CATEGORY_ICONS[property.category] || HomeIcon;
  const isReserved = property.status === "reserved";
  const isSold = property.status === "sold";
  const isFeatured = isBoostActive(property);
  const isVerified = Boolean(property.verified);

  if (images.length === 0) {
    return (
      <div className="relative w-full aspect-square max-w-[640px] mx-auto rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
        <Icon size={64} className="text-muted" />
        {(isReserved || isSold) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-[#101A2E] text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2">
              {isSold ? <Ban size={16} /> : <Clock3 size={16} />}
              {isSold ? t(lang, "Imeuzwa", "Sold") : t(lang, "Ina Reservation", "Reserved")}
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
      <div className="relative w-full aspect-square max-w-[640px] mx-auto rounded-2xl overflow-hidden bg-[#F5F3EC]">
        <img
          src={images[currentIndex]}
          alt={property.title}
          className="absolute inset-0 block w-full h-full object-cover object-center"
          onError={(e) => { e.target.style.display = "none"; }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
              aria-label={t(lang, "Picha iliyotangulia", "Previous image")}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
              aria-label={t(lang, "Picha inayofuata", "Next image")}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-body-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10">
          <Camera size={14} />
          {currentIndex + 1} / {images.length}
        </div>
        {isFeatured && (
          <div className="absolute top-3 left-3 bg-[#E8A33D] text-[#101A2E] text-body-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1 z-10">
            <Star size={12} fill="#101A2E" />
            {t(lang, "Imeangaziwa", "Featured")}
          </div>
        )}
        {isVerified && (
          <div className="absolute top-3 right-3 bg-[#2F6D4F] text-white text-body-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1 z-10">
            <Shield size={12} />
            {t(lang, "Imethibitishwa", "Verified")}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 max-w-[640px] mx-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                idx === currentIndex ? "border-[#E8A33D] opacity-100" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover object-center block" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function FeatureItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
      <div className="w-10 h-10 rounded-lg bg-[#E8A33D]/10 flex items-center justify-center flex-shrink-0">
        <Icon size={18} color={COLORS.gold} />
      </div>
      <div>
        <p className="text-body-sm text-secondary">{label}</p>
        <p className="text-sm font-semibold text-primary">{value}</p>
      </div>
    </div>
  );
}

function FeaturesSection({ property, lang }) {
  const items = [];
  if (property.bedrooms) items.push({ icon: Bed, label: t(lang, "Vyumba vya Kulala", "Bedrooms"), value: property.bedrooms });
  if (property.bathrooms) items.push({ icon: Bath, label: t(lang, "Bafu", "Bathrooms"), value: property.bathrooms });
  if (property.area) items.push({ icon: Maximize, label: t(lang, "Ukubwa", "Size"), value: property.area });
  if (property.year) items.push({ icon: Calendar, label: t(lang, "Mwaka", "Year"), value: property.year });
  if (property.titleStatus) items.push({ icon: CheckCircle, label: t(lang, "Hati", "Title"), value: property.titleStatus });
  if (property.make) items.push({ icon: Car, label: t(lang, "Gari", "Car"), value: `${property.make} ${property.model || ""}`.trim() });
  if (property.mileage) items.push({ icon: Settings, label: t(lang, "Mileage", "Mileage"), value: property.mileage });
  if (property.type) items.push({ icon: Settings, label: t(lang, "Aina", "Type"), value: property.type });
  if (property.hours) items.push({ icon: Settings, label: t(lang, "Saa za Matumizi", "Usage Hours"), value: property.hours });

  if (items.length === 0) {
    return <p className="text-sm text-secondary text-center py-4">{t(lang, "Hakuna sifa za ziada zilizoainishwa", "No additional features specified")}</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item, idx) => <FeatureItem key={idx} {...item} />)}
    </div>
  );
}

// ============================================================
// ATTRIBUTES TABLE — inaonyesha fields zote za kategoria kama jedwali
// Inasoma property.attributes (JSONField) + CATEGORY_EXTRA + mode fields
// ============================================================
function AttributesTable({ property, lang }) {
  const rows = useMemo(() => {
    const out = [];
    const categoryKey = property.category;
    const baseFields = CATEGORY_EXTRA[categoryKey] || [];
    const cfg = getPostingConfig(categoryKey);
    const attrs = property.attributes || {};

    // Helper: rudisha thamani inayoonekana kwa field
    const resolveValue = (f, raw) => {
      if (raw === undefined || raw === null) return null;
      const str = String(raw).trim();
      if (str === "") return null;
      const opt = f.options?.find((op) => String(op.value) === str);
      return opt ? (opt.label?.[lang] || opt.label?.sw || str) : str;
    };

    // 1. Mode (kwa Jobs/Huduma)
    if (cfg.modes && attrs.mode) {
      const mode = cfg.modes.find((m) => m.key === attrs.mode);
      if (mode) {
        out.push({
          label: t(lang, "Aina", "Type"),
          value: mode.label?.[lang] || mode.label?.sw || attrs.mode,
        });
        // Fields za mode
        (mode.extra || []).forEach((f) => {
          const v = resolveValue(f, attrs[f.key]);
          if (v !== null) {
            out.push({
              label: f.label?.[lang] || f.label?.sw || f.key,
              value: v,
            });
          }
        });
      }
    }

    // 2. Fields za kategoria (kutoka CATEGORY_EXTRA)
    baseFields.forEach((f) => {
      // Ruka field ikiwa ni ya mode tu (tayari imeshughulikiwa)
      if (cfg.modes && cfg.modes.some((m) => (m.extra || []).some((mf) => mf.key === f.key))) {
        return;
      }
      const v = resolveValue(f, attrs[f.key]);
      if (v !== null) {
        out.push({
          label: f.label?.[lang] || f.label?.sw || f.key,
          value: v,
        });
      }
    });

    // 3. Eneo (Mkoa, Wilaya, Eneo)
    if (attrs.region) {
      out.push({ label: t(lang, "Mkoa", "Region"), value: attrs.region });
    }
    if (attrs.district) {
      out.push({ label: t(lang, "Wilaya", "District"), value: attrs.district });
    }
    if (attrs.area) {
      out.push({ label: t(lang, "Eneo", "Area"), value: attrs.area });
    }

    return out;
  }, [property, lang]);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-secondary text-center py-4">
        {t(lang, "Hakuna taarifa za ziada zilizoainishwa", "No additional details specified")}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="px-4 py-2.5 font-medium text-secondary w-1/2 align-top">
                {row.label}
              </td>
              <td className="px-4 py-2.5 text-primary font-semibold align-top">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SellerCard({ property, status, alreadyOnWaitlist, onJoinWaitlist, onContact, lang }) {
  const isReserved = status === "reserved";
  const isSold = status === "sold";
  const isUnavailable = isReserved || isSold;
  const sellerName = property.seller_name || t(lang, "Muuzaji", "Seller");
  const sellerInitial = sellerName.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-[#E8A33D]/10 flex items-center justify-center text-[#E8A33D] font-bold text-xl flex-shrink-0">
          {sellerInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-primary truncate">{sellerName}</h3>
            {property.verified && <CheckCircle size={16} className="text-[#2F6D4F] flex-shrink-0" />}
          </div>
          <p className="text-body-sm text-muted mt-0.5">
            {t(lang, "Muuzaji kwenye SokoMkononi", "Seller on SokoMkononi")}
          </p>
        </div>
      </div>

      {isUnavailable ? (
        <>
          <div className="mb-3 p-3 rounded-xl bg-[#E8A33D]/10 border border-[#E8A33D]/30">
            <p className="text-body-sm font-semibold text-[#8A5A16] flex items-center gap-1.5">
              {isSold ? <Ban size={13} /> : <Clock3 size={13} />}
              {isSold
                ? t(lang, "Mali hii tayari imeuzwa.", "This property has already been sold.")
                : t(lang, "Mali hii tayari ina Reservation.", "This property already has a Reservation.")}
            </p>
            {isReserved && property.reservedUntil && (
              <p className="text-body-sm text-[#8A5A16] mt-1">{reservationCountdown(property.reservedUntil, lang)}</p>
            )}
            <p className="text-body-sm text-[#8A5A16]/80 mt-1">
              {t(lang, "Jiunge na Waiting List ili tukutaarifu papo hapo endapo itaachiwa huru.", "Join the Waiting List so we notify you immediately if it becomes available.")}
            </p>
          </div>
          <button
            onClick={onJoinWaitlist}
            disabled={alreadyOnWaitlist || isSold}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              alreadyOnWaitlist || isSold ? "bg-gray-100 text-muted cursor-not-allowed" : "bg-[#101A2E] hover:bg-[#0A1220] text-white"
            }`}
          >
            <BellRing size={16} />
            {isSold
              ? t(lang, "Imeuzwa Tayari", "Already Sold")
              : alreadyOnWaitlist
                ? t(lang, "Tayari Umejiunga", "Already Joined")
                : t(lang, "Jiunge na Waiting List", "Join Waiting List")}
          </button>
        </>
      ) : (
        <button
          onClick={onContact}
          className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <MessageSquare size={16} />
          {t(lang, "Wasiliana na Muuzaji", "Contact Seller")}
        </button>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-body-sm text-secondary text-center">
          {t(lang, "Muuzaji amethibitishwa na SokoMkononi", "Seller verified by SokoMkononi")}
        </p>
      </div>
    </div>
  );
}

function ListingNotFound({ lang }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <HomeIcon size={64} className="mx-auto text-muted mb-4" />
        <h1 className="text-2xl font-bold text-primary mb-2">
          {t(lang, "Mali haipatikani", "Listing not found")}
        </h1>
        <p className="text-secondary text-sm mb-6">
          {t(lang, "Tangazo hili huenda limefutwa au halipo. Tafuta mali nyingine.", "This listing may have been removed or does not exist. Browse other properties.")}
        </p>
        <Link
          to="/dashboard/buyer"
          className="inline-block bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {t(lang, "Tafuta Mali Nyingine", "Browse Other Properties")}
        </Link>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const { user } = useAuth();

  const allListings = useListings();
  const property = useMemo(
    () => allListings.find((l) => String(l.id) === String(id)),
    [allListings, id]
  );

  const savedIds = useSavedIds();
  const isSaved = property ? savedIds.includes(property.id) : false;
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactLoading, setContactLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  // ============================================================
  // IMAGE PIPELINE
  // ============================================================
  const [fetchedImages, setFetchedImages] = useState([]);

  useEffect(() => {
    if (!property?.id) return;
    let cancelled = false;

    const extractUrls = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((img) => {
          if (!img) return null;
          if (typeof img === "string") return img;
          return (
            img.image_url ||
            img.url ||
            img.image ||
            img.src ||
            img.file ||
            null
          );
        })
        .filter(Boolean);
    };

    (async () => {
      // ---- Step 1: refresh the listing detail ----
      try {
        const detailRes = await fetchListingDetailAsync(property.id);
        if (cancelled) return;
        if (detailRes?.ok && detailRes.listing) {
          const l = detailRes.listing;
          const urls = [
            ...extractUrls(l.photos),
            ...extractUrls(l.images),
            l.imageUrl,
          ].filter(Boolean);
          if (urls.length > 0) {
            console.log("[PropertyDetail] images from detail endpoint:", urls);
            setFetchedImages(urls);
            return;
          }
        }
      } catch (err) {
        console.warn("[PropertyDetail] detail fetch failed:", err);
      }

      // ---- Step 2: fall back to the images endpoint ----
      try {
        const imagesRes = await fetchListingImagesAsync(property.id);
        if (cancelled) return;
        if (imagesRes?.ok) {
          const urls = extractUrls(imagesRes.images);
          if (urls.length > 0) {
            console.log("[PropertyDetail] images from /images/ endpoint:", urls);
            setFetchedImages(urls);
            return;
          }
        }
      } catch (err) {
        console.warn("[PropertyDetail] images fetch failed:", err);
      }

      console.warn(
        "[PropertyDetail] no images found for listing",
        property.id,
        "— check backend /listings/ and /listings/{id}/images/"
      );
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.id]);

  const waitingListEntries = useWaitingList();
  const alreadyOnWaitlist = useMemo(
    () =>
      property
        ? waitingListEntries.some(
            (e) =>
              e.property === property.title &&
              (e.status === "waiting" || e.status === "notified")
          )
        : false,
    [waitingListEntries, property]
  );

  useEffect(() => {
    if (!user || !property || !location.state) return;
    const { openContactModal, autoJoinWaitlist } = location.state;

    if (openContactModal) setShowContactModal(true);
    if (autoJoinWaitlist && !alreadyOnWaitlist) {
      joinWaitingListAsync(property.id).then((res) => {
        if (!res.ok) console.warn("[PropertyDetailPage] auto-join waiting list failed:", res.error);
      });
    }

    if (openContactModal || autoJoinWaitlist) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, property]);

  if (!property) return <ListingNotFound lang={lang} />;

  const handleJoinWaitlist = () => {
    if (!user) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}`, autoJoinWaitlist: true },
      });
      return;
    }
    joinWaitingListAsync(property.id).then((res) => {
      if (!res.ok) console.warn("[PropertyDetailPage] joinWaitingList failed:", res.error);
    });
  };

  const handleSave = () => toggleSaved(property.id, property);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description || property.title,
        url: window.location.href,
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert(t(lang, "Link imenakiliwa!", "Link copied!"));
    }
  };

  const handleContact = () => {
    if (!user) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}`, openContactModal: true },
      });
      return;
    }
    setShowContactModal(true);
  };

  const handleStartDealRoom = async () => {
    if (contactLoading) return;
    if (!user) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}`, openContactModal: true },
      });
      return;
    }
    setShowContactModal(false);
    setContactLoading("deal");
    try {
      const res = await getOrCreateDealAsync({
        listingId: property.id,
        currentUserId: user.id,
        sellerName: property.seller_name || t(lang, "Muuzaji", "Seller"),
        buyerName: user.name || user.fullName || "",
      });
      if (res?.ok && res?.deal?.id) {
        navigate(`/dashboard/buyer/deals?deal=${res.deal.id}`);
      } else {
        console.error("[PropertyDetail] deal create failed:", res?.error);
        alert(
          res?.error?.data?.detail ||
            res?.error?.message ||
            t(lang, "Imeshindwa kuanzisha deal.", "Failed to start deal.")
        );
        navigate("/dashboard/buyer/deals");
      }
    } catch (err) {
      console.error("[PropertyDetail] deal handler threw:", err);
      alert(err?.message || t(lang, "Hitilafu imetokea.", "Something went wrong."));
      navigate("/dashboard/buyer/deals");
    } finally {
      setContactLoading(null);
    }
  };

  const handleStartConversation = async () => {
    if (contactLoading) return;
    if (!user) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}`, openContactModal: true },
      });
      return;
    }
    setShowContactModal(false);
    setContactLoading("message");
    try {
      const res = await createConversationAsync({
        listingId: property.id,
        initialMessage: t(
          "Habari, nina swali kuhusu mali hii.",
          "Hi, I have a question about this listing."
        ),
      });
      if (res?.ok && res?.conversation?.id) {
        navigate(`/dashboard/buyer/messages?c=${res.conversation.id}`);
      } else {
        console.error("[PropertyDetail] conversation create failed:", res?.error);
        alert(
          res?.error?.data?.detail ||
            res?.error?.message ||
            t(lang, "Imeshindwa kuanzisha mazungumzo.", "Failed to start conversation.")
        );
        navigate("/dashboard/buyer/messages");
      }
    } catch (err) {
      console.error("[PropertyDetail] conversation handler threw:", err);
      alert(err?.message || t(lang, "Hitilafu imetokea.", "Something went wrong."));
      navigate("/dashboard/buyer/messages");
    } finally {
      setContactLoading(null);
    }
  };

  const categoryLabel =
    CATEGORY_LABELS[property.category]?.[lang] ||
    CATEGORY_LABELS[property.category]?.sw ||
    t(lang, "Mali", "Property");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-secondary mb-4 overflow-x-auto">
          <Link to="/" className="hover:text-[#E8A33D] transition-colors whitespace-nowrap">
            {t(lang, "Nyumbani", "Home")}
          </Link>
          <ChevronRight size={14} className="flex-shrink-0" />
          <Link to={`/kategoria/${property.category}`} className="hover:text-[#E8A33D] transition-colors whitespace-nowrap">
            {categoryLabel}
          </Link>
          <ChevronRight size={14} className="flex-shrink-0" />
          <span className="text-primary font-medium truncate">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ImageGallery
              property={{
                ...property,
                images: Array.from(
                  new Set(
                    [
                      ...(Array.isArray(property.images) ? property.images : []),
                      ...(Array.isArray(property.photos) ? property.photos : []),
                      ...(property.imageUrl ? [property.imageUrl] : []),
                      ...fetchedImages,
                    ].filter(Boolean)
                  )
                ),
              }}
              lang={lang}
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-primary">{property.title}</h1>
                  <div className="flex items-center gap-2 mt-2 text-secondary text-sm">
                    <MapPin size={14} className="flex-shrink-0" />
                    <span>{property.location}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-body-sm text-muted flex-wrap">
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {property.views || 0} {t(lang, "walioangalia", "views")}
                    </span>
                    <span>•</span>
                    <span>{timeAgo(property.postedAt, lang)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleSave}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                      isSaved
                        ? "bg-[#C1502E] border-[#C1502E] text-white"
                        : "border-gray-200 text-muted hover:text-[#C1502E] hover:border-[#C1502E]"
                    }`}
                    aria-label={t(lang, "Hifadhi", "Save")}
                  >
                    <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-10 h-10 rounded-full border border-gray-200 text-muted hover:text-secondary flex items-center justify-center transition-colors"
                    aria-label={t(lang, "Shiriki", "Share")}
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    className="w-10 h-10 rounded-full border border-gray-200 text-muted hover:text-[#C1502E] flex items-center justify-center transition-colors"
                    aria-label={t(lang, "Ripoti", "Report")}
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
                    <span className="text-body-sm font-medium text-[#2F6D4F] bg-[#2F6D4F]/10 px-2.5 py-1 rounded-full mb-1">
                      {t(lang, "Inapatikana", "Available")}
                    </span>
                  )}
                  {property.status === "reserved" && (
                    <span className="text-body-sm font-medium text-[#8A5A16] bg-[#E8A33D]/15 px-2.5 py-1 rounded-full mb-1">
                      {t(lang, "Ina Reservation", "Reserved")}
                    </span>
                  )}
                  {property.status === "sold" && (
                    <span className="text-body-sm font-medium text-white bg-[#101A2E] px-2.5 py-1 rounded-full mb-1">
                      {t(lang, "Imeuzwa", "Sold")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "details" ? "text-[#E8A33D] border-b-2 border-[#E8A33D]" : "text-secondary hover:text-primary"
                  }`}
                >
                  {t(lang, "Maelezo", "Details")}
                </button>
                <button
                  onClick={() => setActiveTab("location")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "location" ? "text-[#E8A33D] border-b-2 border-[#E8A33D]" : "text-secondary hover:text-primary"
                  }`}
                >
                  {t(lang, "Mahali", "Location")}
                </button>
              </div>

              <div className="p-5">
                {activeTab === "details" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-primary mb-3">{t(lang, "Maelezo", "Description")}</h3>
                      <p className="text-secondary text-sm leading-relaxed whitespace-pre-line">
                        {property.description || t(lang, "Hakuna maelezo yaliyotolewa.", "No description provided.")}
                      </p>
                    </div>

                    {/* JEDWALI LA TAARIFA ZA KATEGORIA */}
                    <div>
                      <h3 className="font-semibold text-primary mb-3">
                        {t(lang, "Taarifa za Kategoria", "Category Details")}
                      </h3>
                      <AttributesTable property={property} lang={lang} />
                    </div>

                    {/* Sifa za haraka */}
                    <div>
                      <h3 className="font-semibold text-primary mb-3">
                        {t(lang, "Sifa za Haraka", "Quick Features")}
                      </h3>
                      <FeaturesSection property={property} lang={lang} />
                    </div>
                  </div>
                )}
                {activeTab === "location" && (
                  <div>
                    <h3 className="font-semibold text-primary mb-4">{t(lang, "Mahali", "Location")}</h3>
                    <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <MapPin size={32} className="text-muted mx-auto" />
                        <p className="text-secondary text-sm mt-2">{property.location}</p>
                        <p className="text-muted text-body-sm">{t(lang, "Ramani itaonekana hapa", "Map will appear here")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <SellerCard
              property={property}
              status={property.status}
              alreadyOnWaitlist={alreadyOnWaitlist}
              onJoinWaitlist={handleJoinWaitlist}
              onContact={handleContact}
              lang={lang}
            />

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <Shield size={16} className="text-[#E8A33D]" />
                {t(lang, "Vidokezo vya Usalama", "Safety Tips")}
              </h3>
              <ul className="space-y-2.5">
                {[
                  t(lang, "Kutana na muuzaji sehemu za wazi", "Meet the seller in open places"),
                  t(lang, "Angalia mali kabla ya kulipa", "Inspect the property before paying"),
                  t(lang, "Thibitisha hati za mali", "Verify property documents"),
                  t(lang, "Tumia Deal Room yetu kwa mazungumzo", "Use our Deal Room for conversations"),
                ].map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-body-sm text-secondary">
                    <CheckCircle size={14} className="text-[#2F6D4F] mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-primary mb-3">{t(lang, "Takwimu", "Statistics")}</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-primary">{property.views || 0}</p>
                  <p className="text-body-sm text-secondary">{t(lang, "Walioangalia", "Views")}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary">{property.inquiries || 0}</p>
                  <p className="text-body-sm text-secondary">{t(lang, "Maswali", "Inquiries")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <h3 className="text-primary mb-2">
              {t(lang, "Wasiliana na", "Contact")} {property.seller_name || t(lang, "Muuzaji", "Seller")}
            </h3>
            <p className="text-sm text-secondary mb-4">
              {t(lang, "Chagua jinsi ungependa kuwasiliana:", "Choose how you'd like to get in touch:")}
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleStartDealRoom}
                disabled={!!contactLoading}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <MessageSquare size={20} className="text-[#E8A33D]" />
                <div>
                  <p className="text-sm font-medium text-primary">
                    {t(lang, "Anzisha Deal Room", "Start a Deal Room")}
                  </p>
                  <p className="text-body-sm text-secondary">
                    {t(lang, "Mazungumzo ya kina ya ununuzi", "Full purchase negotiation")}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={handleStartConversation}
                disabled={!!contactLoading}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <MessageSquare size={20} className="text-[#2F6D4F]" />
                <div>
                  <p className="text-sm font-medium text-primary">
                    {t(lang, "Tuma Ujumbe wa Haraka", "Send a Quick Message")}
                  </p>
                  <p className="text-body-sm text-secondary">
                    {t(lang, "Uliza swali bila kuanzisha deal", "Ask a question without a deal")}
                  </p>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowContactModal(false)}
              className="w-full mt-4 py-2.5 text-sm font-medium text-secondary hover:text-primary transition-colors"
            >
              {t(lang, "Funga", "Close")}
            </button>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}

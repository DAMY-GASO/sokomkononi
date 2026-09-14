import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Menu,
  X,
  PlusCircle,
  ListChecks,
  Rocket,
  MessagesSquare,
  Receipt,
  LayoutGrid,
  Clock3,
  Megaphone,
  Heart,
  MessageSquare,
  Home,
  Globe,
  Check,
  TrendingUp,
  LogOut,
  User,
  Inbox,
  Shield,
  Package,
} from "lucide-react";
import { COLORS, FONTS } from "./shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  useListings,
  addListing as addListingToStore,
  removeListing as removeListingFromStore,
  updateListing as updateListingInStore,
  checkListingExpiry,
  pauseListing,
  unpauseListing,
  markAsSold,
} from "../../../config/listingsStore.js";
import { useSentAnnouncements } from "../../../config/announcementsStore.js";
import {
  useNotifications,
  notifyListingFeePaid,
} from "../../../config/notificationsStore.js";
import { checkReservationReminders } from "../../../config/dealsStore.js";
import { checkSavedListingsChanges } from "../../../config/savedListingsWatcher.js";
import { addTransaction } from "../../../config/transactionsStore.js";
import { useNewLeadsCount } from "../../../config/leadsStore.js";
import { useSearchesCount } from "../../../config/searchesStore.js";
import PostPropertyForm from "./PostPropertyForm";
import MyListings from "./MyListings";
import LeadsSection from "../seller/LeadsSection.jsx";
import BoostSasa from "./BoostSasa";
import LeadingSasa from "./LeadingSasa";
import AdvertiseSasa from "./AdvertiseSasa";
import PromotedBannerStrip from "./PromotedBannerStrip";
import DealRooms from "./DealRooms";
import BrowseProperties from "./BrowseProperties";
import BottomNav from "../../../components/BottomNav.jsx";

// Seller & Buyer Overview
import SellerOverview from "../seller/SellerOverview.jsx";
import BuyerOverview from "../buyer/BuyerOverview.jsx";

// Buyer Sections
import MySearchesSection from "../buyer/MySearchesSection.jsx";
import SafetySupportSection from "../buyer/SafetySupportSection.jsx";

// Kurasa mpya
import SavedPropertiesPage from "../../SavedPropertiesPage";
import MessagesPage from "../../MessagesPage";
import NotificationsPage from "../../NotificationsPage";
import MyTransactionsPage from "../../MyTransactionsPage";
import WaitingListPage from "../../WaitingListPage";
import BundlesPage from "../../BundlesPage";
import {
  useWaitingList,
  leaveWaitingList,
} from "../../../config/waitingListStore.js";

// ============================================================
// SELLER NAV — Bilingual kamili
// ============================================================
const SELLER_NAV = [
  {
    key: "overview",
    label: { sw: "Muhtasari", en: "Overview" },
    icon: LayoutGrid,
  },
  {
    key: "post",
    label: { sw: "Weka Mali Yako", en: "Post Property" },
    icon: PlusCircle,
  },
  {
    key: "listings",
    label: { sw: "Mali Zangu", en: "My Listings" },
    icon: ListChecks,
  },
  { key: "leads", label: { sw: "Maulizio", en: "Enquiries" }, icon: Inbox },
  {
    key: "saved",
    label: { sw: "Zilizohifadhiwa", en: "Saved" },
    icon: Heart,
  },
  { key: "boost", label: { sw: "Boost Sasa", en: "Boost Now" }, icon: Rocket },
  {
    key: "leading",
    label: { sw: "Ada ya Kipaumbele", en: "Leading Fee" },
    icon: TrendingUp,
  },
  {
    key: "advertise",
    label: { sw: "Tangaza Sasa", en: "Advertise Now" },
    icon: Megaphone,
  },
  {
    key: "deals",
    label: { sw: "Vyumba vya Majadiliano", en: "Deal Rooms" },
    icon: MessagesSquare,
  },
  {
    key: "messages",
    label: { sw: "Ujumbe", en: "Messages" },
    icon: MessageSquare,
  },
  {
    key: "notifications",
    label: { sw: "Taarifa", en: "Notifications" },
    icon: Bell,
  },
  {
    key: "transactions",
    label: { sw: "Miamala Yangu", en: "My Transactions" },
    icon: Receipt,
  },
  {
    key: "bundles",
    label: { sw: "Vifurushi", en: "Bundles" },
    icon: Package,
  },
];

// ============================================================
// BUYER NAV — Bilingual kamili + searches + safety
// ============================================================
const BUYER_NAV = [
  {
    key: "overview",
    label: { sw: "Muhtasari", en: "Overview" },
    icon: LayoutGrid,
  },
  {
    key: "browse",
    label: { sw: "Tafuta Mali", en: "Browse Properties" },
    icon: Search,
  },
  {
    key: "saved",
    label: { sw: "Zilizohifadhiwa", en: "Saved" },
    icon: Heart,
  },
  {
    key: "searches",
    label: { sw: "Utafutaji Wangu", en: "My Searches" },
    icon: Bell,
  },
  {
    key: "deals",
    label: { sw: "Vyumba vya Majadiliano", en: "Deal Rooms" },
    icon: MessagesSquare,
  },
  {
    key: "messages",
    label: { sw: "Ujumbe", en: "Messages" },
    icon: MessageSquare,
  },
  {
    key: "notifications",
    label: { sw: "Taarifa", en: "Notifications" },
    icon: Bell,
  },
  {
    key: "waiting",
    label: { sw: "Orodha ya Kusubiri", en: "Waiting List" },
    icon: Clock3,
  },
  {
    key: "transactions",
    label: { sw: "Miamala Yangu", en: "My Transactions" },
    icon: Receipt,
  },
  {
    key: "bundles",
    label: { sw: "Vifurushi", en: "Bundles" },
    icon: Package,
  },
  {
    key: "safety",
    label: { sw: "Usalama & Msaada", en: "Safety & Support" },
    icon: Shield,
  },
];

const URL_TO_STATE = {
  // Seller
  "/dashboard": { side: "seller", key: "overview" },
  "/dashboard/seller": { side: "seller", key: "overview" },
  "/dashboard/overview": { side: "seller", key: "overview" },
  "/dashboard/post": { side: "seller", key: "post" },
  "/dashboard/listings": { side: "seller", key: "listings" },
  "/dashboard/leads": { side: "seller", key: "leads" },
  "/dashboard/saved": { side: "seller", key: "saved" },
  "/dashboard/boost": { side: "seller", key: "boost" },
  "/dashboard/leading": { side: "seller", key: "leading" },
  "/dashboard/advertise": { side: "seller", key: "advertise" },
  "/dashboard/deals": { side: "seller", key: "deals" },
  "/dashboard/messages": { side: "seller", key: "messages" },
  "/dashboard/notifications": { side: "seller", key: "notifications" },
  "/dashboard/transactions": { side: "seller", key: "transactions" },
  "/dashboard/bundles": { side: "seller", key: "bundles" },

  // Buyer
  "/dashboard/buyer": { side: "buyer", key: "overview" },
  "/dashboard/buyer/overview": { side: "buyer", key: "overview" },
  "/dashboard/buyer/browse": { side: "buyer", key: "browse" },
  "/dashboard/buyer/saved": { side: "buyer", key: "saved" },
  "/dashboard/buyer/searches": { side: "buyer", key: "searches" },
  "/dashboard/buyer/messages": { side: "buyer", key: "messages" },
  "/dashboard/buyer/notifications": { side: "buyer", key: "notifications" },
  "/dashboard/buyer/waiting": { side: "buyer", key: "waiting" },
  "/dashboard/buyer/transactions": { side: "buyer", key: "transactions" },
  "/dashboard/buyer/bundles": { side: "buyer", key: "bundles" },
  "/dashboard/buyer/safety": { side: "buyer", key: "safety" },
};

const STATE_TO_URL = {
  seller: {
    overview: "/dashboard/overview",
    post: "/dashboard/post",
    listings: "/dashboard/listings",
    leads: "/dashboard/leads",
    saved: "/dashboard/saved",
    boost: "/dashboard/boost",
    leading: "/dashboard/leading",
    advertise: "/dashboard/advertise",
    deals: "/dashboard/deals",
    messages: "/dashboard/messages",
    notifications: "/dashboard/notifications",
    transactions: "/dashboard/transactions",
    bundles: "/dashboard/bundles",
  },
  buyer: {
    overview: "/dashboard/buyer",
    browse: "/dashboard/buyer/browse",
    saved: "/dashboard/buyer/saved",
    searches: "/dashboard/buyer/searches",
    deals: "/dashboard/deals",
    messages: "/dashboard/buyer/messages",
    notifications: "/dashboard/buyer/notifications",
    waiting: "/dashboard/buyer/waiting",
    transactions: "/dashboard/buyer/transactions",
    bundles: "/dashboard/buyer/bundles",
    safety: "/dashboard/buyer/safety",
  },
};

// ============================================================
// ANNOUNCEMENT HELPERS — bilingual
// ============================================================
function getAnnouncementMessage(a, lang) {
  if (!a) return "";
  if (lang === "en" && a.messageEn) return a.messageEn;
  return a.message || "";
}

function getAnnouncementTitle(a, lang) {
  if (!a) return "";
  if (lang === "en" && a.titleEn) return a.titleEn;
  return a.title || "";
}

export default function DashboardShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const { user, logout } = useAuth();

  const [side, setSide] = useState("seller");
  const [activeKey, setActiveKey] = useState("overview");
  const [tickerIndex, setTickerIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const listings = useListings();
  const { unreadCount: unreadNotifCount } = useNotifications("user");
  const announcements = useSentAnnouncements();
  const waitingList = useWaitingList();
  const newLeadsCount = useNewLeadsCount();
  const buyerSearchesCount = useSearchesCount();
  const [boostTarget, setBoostTarget] = useState(null);
  const [leadingTarget, setLeadingTarget] = useState(null);
  const [advertiseTarget, setAdvertiseTarget] = useState(null);
  const [langOpen, setLangOpen] = useState(false);

  const nav = side === "seller" ? SELLER_NAV : BUYER_NAV;

  const languages = [
    { code: "sw", native: "Kiswahili" },
    { code: "en", native: "English" },
  ];

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // SOMA URL NA KUFUNGUA TAB SAHIHI
  // ============================================================
  useEffect(() => {
    const path = location.pathname;
    const match = URL_TO_STATE[path];
    if (match) {
      setSide(match.side);
      setActiveKey(match.key);
    }
  }, [location.pathname]);

  // ============================================================
  // KUMBUSHO LA RESERVATION + LISTING EXPIRY + SAVED CHANGES
  // ============================================================
  useEffect(() => {
    checkReservationReminders();
    checkListingExpiry();
    checkSavedListingsChanges();
    const interval = setInterval(() => {
      checkReservationReminders();
      checkListingExpiry();
      checkSavedListingsChanges();
    }, 2 * 60 * 1000); // kila dakika 2
    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // TICKER
  // ============================================================
  useEffect(() => {
    if (announcements.length === 0) return;
    const id = setInterval(() => {
      setTickerIndex((i) => (i + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(id);
  }, [announcements.length]);

  // ============================================================
  // FUNGA USER MENU UKIBOFYA NJE
  // ============================================================
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = () => setUserMenuOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen]);

  const accent = side === "seller" ? COLORS.gold : COLORS.green;

  // ============================================================
  // LISTING HELPERS
  // ============================================================
  const addListing = (listing) => addListingToStore(listing);
  const removeListing = (id) => removeListingFromStore(id);
  const updateListing = (id, patch) => updateListingInStore(id, patch);

  const handlePause = (id) => pauseListing(id);
  const handleResume = (id) => unpauseListing(id);
  const handleMarkSold = (id) => markAsSold(id);

  // ============================================================
  // TRANSACTION HELPERS
  // ============================================================
  const handleReservationPaid = (deal, { hours, fee, method, expiresAt }) => {
    addTransaction({
      type: "reservation",
      title: `Reservation Fee — ${deal.listingTitle}`,
      property: deal.listingTitle,
      amount: fee,
      status: "completed",
      method,
      dealId: deal.id,
      reservationHours: hours,
      reservationExpiresAt: expiresAt,
    });
  };

  const handleFinalPaymentConfirmed = (
    deal,
    dealSide,
    { method, reference }
  ) => {
    const isSeller = dealSide === "seller";
    addTransaction({
      type: isSeller ? "sale" : "purchase",
      title: `${isSeller ? "Mauzo" : "Ununuzi"} — ${deal.listingTitle}`,
      property: deal.listingTitle,
      amount: deal.currentOffer,
      status: "completed",
      method: method || "—",
      dealId: deal.id,
      paymentReference: reference,
    });
  };

  // ============================================================
  // NAVIGATION HELPERS
  // ============================================================
  const handleNavClick = (key) => {
    setActiveKey(key);
    const url = STATE_TO_URL[side]?.[key];
    if (url) {
      navigate(url);
    }
  };

  const goToBoost = (listingId) => {
    setBoostTarget(listingId);
    handleNavClick("boost");
  };

  const goToLeading = (listingId) => {
    setLeadingTarget(listingId);
    handleNavClick("leading");
  };

  const goToAdvertise = (listingId) => {
    setAdvertiseTarget(listingId);
    handleNavClick("advertise");
  };

  const goToListingDetail = (listingId) => {
    if (listingId) navigate(`/mali/${listingId}`);
  };

  const markListingPaid = (id) => {
    updateListing(id, { status: "live" });
    const listing = listings.find((l) => l.id === id);
    if (listing) {
      notifyListingFeePaid({
        listingId: id,
        listingTitle: listing.title,
        amount: listing.listingFee,
      });
      addTransaction({
        type: "listing_fee",
        title: `Listing Fee — ${listing.title}`,
        property: listing.title,
        amount: listing.listingFee,
        status: "completed",
        method: "M-Pesa",
        listingId: id,
      });
    }
  };

  const handleSideChange = (newSide) => {
    setSide(newSide);
    const firstKey = "overview";
    setActiveKey(firstKey);
    const url = STATE_TO_URL[newSide]?.[firstKey];
    if (url) {
      navigate(url);
    }
  };

  const handleLanguageSelect = (code) => {
    setLang(code);
    setLangOpen(false);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate("/login");
  };

  // ============================================================
  // RENDER MAIN CONTENT
  // ============================================================
  const renderMain = () => {
    // Overview — tofauti kwa seller na buyer
    if (activeKey === "overview") {
      if (side === "seller") {
        return <SellerOverview onNavigate={handleNavClick} />;
      }
      return <BuyerOverview onNavigate={handleNavClick} />;
    }
    if (activeKey === "post") {
      return (
        <PostPropertyForm
          onSubmit={addListing}
          onGoToListings={() => handleNavClick("listings")}
          onPaid={markListingPaid}
          onGoToBoost={goToBoost}
        />
      );
    }
    if (activeKey === "listings") {
      return (
        <MyListings
          listings={listings}
          onRemove={removeListing}
          onBoost={goToBoost}
          onLeading={goToLeading}
          onAdvertise={goToAdvertise}
          onPaid={markListingPaid}
          onPause={handlePause}
          onResume={handleResume}
          onMarkSold={handleMarkSold}
        />
      );
    }
    if (activeKey === "leads") {
      return <LeadsSection onNavigate={handleNavClick} />;
    }
    if (activeKey === "browse") {
      return <BrowseProperties lang={lang} />;
    }
    if (activeKey === "saved") {
      return <SavedPropertiesPage />;
    }
    if (activeKey === "searches") {
      return <MySearchesSection />;
    }
    if (activeKey === "safety") {
      return <SafetySupportSection />;
    }
    if (activeKey === "boost") {
      return (
        <BoostSasa
          listings={listings}
          initialListingId={boostTarget}
          onBoosted={updateListing}
        />
      );
    }
    if (activeKey === "leading") {
      return (
        <LeadingSasa
          listings={listings}
          initialListingId={leadingTarget}
          onLead={updateListing}
        />
      );
    }
    if (activeKey === "advertise") {
      return (
        <AdvertiseSasa
          listings={listings}
          initialListingId={advertiseTarget}
          onAdvertised={() => {}}
        />
      );
    }
    if (activeKey === "deals") {
      return (
        <DealRooms
          side={side}
          onReservationPaid={handleReservationPaid}
          onFinalPaymentConfirmed={handleFinalPaymentConfirmed}
        />
      );
    }
    if (activeKey === "messages") {
      return (
        <MessagesPage
          initialConversationId={
            new URLSearchParams(location.search).get("c")
          }
        />
      );
    }
    if (activeKey === "notifications") {
      return <NotificationsPage />;
    }
    if (activeKey === "transactions") {
      return <MyTransactionsPage />;
    }
    if (activeKey === "bundles") {
      return <BundlesPage />;
    }
    if (activeKey === "waiting") {
      return (
        <WaitingListPage
          entries={waitingList}
          onLeave={leaveWaitingList}
          onGoToDeals={() => handleNavClick("deals")}
        />
      );
    }
    // ============================================================
    // FALLBACK — centered + bilingual
    // ============================================================
    return (
      <main className="flex-1 p-4 sm:p-6 text-center">
        <h1
          style={{ fontFamily: FONTS.display, color: COLORS.night }}
          className="text-2xl sm:text-3xl font-semibold"
        >
          {nav.find((n) => n.key === activeKey)?.label?.[lang] || ""}
        </h1>
        <p
          style={{ color: "rgba(16,26,46,0.6)" }}
          className="text-sm mt-2 max-w-xl mx-auto"
        >
          {side === "seller"
            ? t(
                "Sehemu ya Uza Sasa — dhibiti mali zako, malipo na maombi ya wanunuzi.",
                "Sell Now section — manage your listings, payments, and buyer enquiries."
              )
            : t(
                "Sehemu ya Nunua Sasa — tafuta, negotiate na fuatilia manunuzi yako.",
                "Buy Now section — find, negotiate, and track your purchases."
              )}
        </p>
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="rounded-2xl border-2 border-dashed p-10 text-center mt-6"
        >
          <p style={{ color: "rgba(16,26,46,0.45)" }} className="text-sm">
            {t(
              `Sehemu ya "${nav.find((n) => n.key === activeKey)?.label?.[lang] || ""}" itajengwa hapa`,
              `The "${nav.find((n) => n.key === activeKey)?.label?.[lang] || ""}" section will be built here`
            )}
          </p>
        </div>
      </main>
    );
  };

  // ============================================================
  // USER AVATAR
  // ============================================================
  const renderAvatar = (size = "w-8 h-8", textSize = "text-sm") => {
    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.name || "User"}
          className={`${size} rounded-full object-cover shrink-0`}
        />
      );
    }
    return (
      <div
        style={{ background: COLORS.gold, color: COLORS.night }}
        className={`${size} rounded-full flex items-center justify-center ${textSize} font-bold shrink-0`}
      >
        {user?.name?.charAt(0)?.toUpperCase() || "U"}
      </div>
    );
  };

  return (
    <div
      style={{
        fontFamily: FONTS.body,
        background: COLORS.sand,
        minHeight: "100vh",
      }}
      className="w-full flex flex-col pb-16 md:pb-0"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      {/* TOP HEADER */}
      <header
        style={{ background: COLORS.night }}
        className="w-full flex items-center gap-3 px-3 sm:px-5 py-3 sticky top-0 z-30"
      >
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="text-white/80 hover:text-white md:hidden"
          aria-label={t("Fungua menyu", "Open menu")}
        >
          <Menu size={22} />
        </button>

        <a
          href="/"
          style={{ fontFamily: FONTS.display, color: COLORS.sand }}
          className="text-lg sm:text-xl font-semibold tracking-tight shrink-0 hover:opacity-80 transition-opacity"
        >
          SokoMkononi
        </a>

        <div
          style={{
            background: COLORS.nightSoft,
            borderColor: "rgba(245,243,236,0.12)",
          }}
          className="hidden sm:flex items-center flex-1 max-w-md rounded-full border px-3 py-1.5 gap-2"
        >
          <Search size={16} color="rgba(245,243,236,0.6)" />
          <input
            placeholder={t("Tafuta mali...", "Search properties...")}
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: COLORS.sand }}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Seller/Buyer Toggle */}
          <div
            style={{ background: COLORS.nightSoft }}
            className="hidden md:flex items-center rounded-full p-1"
          >
            <button
              onClick={() => handleSideChange("seller")}
              style={{
                background: side === "seller" ? COLORS.gold : "transparent",
                color: side === "seller" ? COLORS.night : COLORS.sand,
              }}
              className="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              {t("Uza Sasa", "Sell Now")}
            </button>
            <button
              onClick={() => handleSideChange("buyer")}
              style={{
                background: side === "buyer" ? COLORS.green : "transparent",
                color: COLORS.sand,
              }}
              className="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              {t("Nunua Sasa", "Buy Now")}
            </button>
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              style={{
                background: COLORS.nightSoft,
                borderColor: "rgba(245,243,236,0.15)",
              }}
              className="text-white/80 hover:text-white text-sm font-medium border rounded-md px-2 sm:px-3 py-1.5 transition-colors flex items-center gap-1"
            >
              <Globe size={14} />
              <span className="hidden sm:inline">
                {currentLang?.native || "Kiswahili"}
              </span>
              <span className="sm:hidden">
                {currentLang?.code?.toUpperCase() || "SW"}
              </span>
            </button>
            {langOpen && (
              <div
                style={{
                  background: COLORS.nightSoft,
                  borderColor: "rgba(245,243,236,0.1)",
                }}
                className="absolute right-0 mt-2 w-48 border rounded-lg shadow-xl py-2 z-50"
              >
                <div
                  style={{ borderColor: "rgba(245,243,236,0.1)" }}
                  className="px-4 py-2 border-b"
                >
                  <p
                    style={{ color: "rgba(245,243,236,0.5)" }}
                    className="text-xs font-semibold"
                  >
                    {t("Chagua Lugha", "Choose Language")}
                  </p>
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLanguageSelect(l.code)}
                    style={{
                      background:
                        lang === l.code
                          ? "rgba(245,243,236,0.05)"
                          : "transparent",
                      color: COLORS.sand,
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm font-medium">{l.native}</span>
                    {lang === l.code && <Check size={14} color={COLORS.gold} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Home button */}
          <a
            href="/"
            className="text-white/80 hover:text-white p-1.5 transition-colors"
            aria-label={t("Rudi kwenye ukurasa wa mwanzo", "Back to homepage")}
          >
            <Home size={20} />
          </a>

          {/* Notifications */}
          <button
            onClick={() => handleNavClick("notifications")}
            className="relative text-white/80 hover:text-white p-1.5 transition-colors"
            aria-label={t("Taarifa", "Notifications")}
          >
            <Bell size={20} />
            {unreadNotifCount > 0 && (
              <span
                style={{ background: COLORS.rust }}
                className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full"
              />
            )}
          </button>

          {/* USER AVATAR + MENU */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen((v) => !v);
              }}
              className="rounded-full transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/50"
              aria-label={t("Menyu ya mtumiaji", "User menu")}
              aria-expanded={userMenuOpen}
            >
              {renderAvatar("w-8 h-8", "text-sm")}
            </button>

            {userMenuOpen && (
              <div
                style={{
                  background: COLORS.nightSoft,
                  borderColor: "rgba(245,243,236,0.1)",
                }}
                className="absolute right-0 mt-2 w-56 border rounded-lg shadow-xl py-2 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{ borderColor: "rgba(245,243,236,0.1)" }}
                  className="px-4 py-3 border-b"
                >
                  <p
                    style={{ color: COLORS.sand }}
                    className="text-sm font-semibold truncate"
                  >
                    {user?.name || "User"}
                  </p>
                  <p
                    style={{ color: "rgba(245,243,236,0.5)" }}
                    className="text-xs truncate"
                  >
                    {user?.email || ""}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/wasifu");
                  }}
                  style={{ color: COLORS.sand }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                >
                  <User size={16} color="rgba(245,243,236,0.7)" />
                  {t("Wasifu", "Profile")}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#C1502E] hover:bg-[#C1502E]/10 transition-colors text-left"
                >
                  <LogOut size={16} />
                  {t("Toka", "Logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE SELLER/BUYER TOGGLE */}
      <div
        style={{ background: COLORS.nightSoft }}
        className="md:hidden flex items-center justify-center gap-1 p-1 mx-3 mt-2 rounded-full"
      >
        <button
          onClick={() => handleSideChange("seller")}
          style={{
            background: side === "seller" ? COLORS.gold : "transparent",
            color: side === "seller" ? COLORS.night : COLORS.sand,
          }}
          className="flex-1 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          {t("Uza Sasa", "Sell Now")}
        </button>
        <button
          onClick={() => handleSideChange("buyer")}
          style={{
            background: side === "buyer" ? COLORS.green : "transparent",
            color: COLORS.sand,
          }}
          className="flex-1 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          {t("Nunua Sasa", "Buy Now")}
        </button>
      </div>

      {/* ANNOUNCEMENT TICKER — bilingual */}
      <div
        style={{ background: COLORS.sandLine, color: COLORS.night }}
        className="w-full flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm"
      >
        <Megaphone size={14} color={COLORS.rust} className="shrink-0" />
        <span className="truncate">
          {announcements.length > 0
            ? getAnnouncementMessage(
                announcements[tickerIndex % announcements.length],
                lang
              )
            : t(
                "Karibu SokoMkononi — tafuta au weka mali yako leo.",
                "Welcome to SokoMkononi — find or list your property today."
              )}
        </span>
      </div>

      <PromotedBannerStrip onOpenListing={goToListingDetail} />

      <div className="flex flex-1 relative">
        <aside
          style={{ background: COLORS.sand, borderColor: COLORS.sandLine }}
          className="hidden md:flex w-56 shrink-0 border-r flex-col py-4 px-3 gap-1 sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto"
        >
          {nav.map(({ key, label, icon: Icon }) => {
            const isActive = key === activeKey;
            return (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                style={{
                  background: isActive ? COLORS.night : "transparent",
                  color: isActive ? COLORS.sand : COLORS.night,
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
              >
                <Icon size={17} color={isActive ? accent : COLORS.night} />
                {label[lang] || label.sw}
                {/* Badge ya listings */}
                {key === "listings" && listings.length > 0 && (
                  <span
                    style={{
                      background: isActive
                        ? "rgba(245,243,236,0.18)"
                        : COLORS.sandLine,
                      color: isActive ? COLORS.sand : COLORS.night,
                    }}
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  >
                    {listings.length}
                  </span>
                )}
                {/* Badge ya leads mpya */}
                {key === "leads" && newLeadsCount > 0 && (
                  <span
                    style={{
                      background: isActive
                        ? "rgba(245,243,236,0.18)"
                        : COLORS.rust,
                      color: isActive ? COLORS.sand : "white",
                    }}
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  >
                    {newLeadsCount}
                  </span>
                )}
                {/* Badge ya searches */}
                {key === "searches" && buyerSearchesCount > 0 && (
                  <span
                    style={{
                      background: isActive
                        ? "rgba(245,243,236,0.18)"
                        : COLORS.sandLine,
                      color: isActive ? COLORS.sand : COLORS.night,
                    }}
                    className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  >
                    {buyerSearchesCount}
                  </span>
                )}
              </button>
            );
          })}

          <a
            href="/"
            style={{ color: COLORS.night }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left hover:bg-black/5 mt-4 border-t pt-4"
          >
            <Home size={17} color={COLORS.night} />
            {t("Rudi Nyumbani", "Back to Home")}
          </a>
        </aside>

        {sidebarOpen && (
          <div className="md:hidden absolute inset-0 z-20 flex">
            <div
              style={{ background: COLORS.sand }}
              className="w-64 h-full py-4 px-3 flex flex-col gap-1 shadow-xl overflow-y-auto"
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label={t("Funga", "Close")}
                >
                  <X size={20} color={COLORS.night} />
                </button>
              </div>
              {nav.map(({ key, label, icon: Icon }) => {
                const isActive = key === activeKey;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      handleNavClick(key);
                      setSidebarOpen(false);
                    }}
                    style={{
                      background: isActive ? COLORS.night : "transparent",
                      color: isActive ? COLORS.sand : COLORS.night,
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left"
                  >
                    <Icon size={17} color={isActive ? accent : COLORS.night} />
                    {label[lang] || label.sw}
                    {key === "leads" && newLeadsCount > 0 && (
                      <span
                        style={{
                          background: isActive
                            ? "rgba(245,243,236,0.18)"
                            : COLORS.rust,
                          color: isActive ? COLORS.sand : "white",
                        }}
                        className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      >
                        {newLeadsCount}
                      </span>
                    )}
                    {key === "searches" && buyerSearchesCount > 0 && (
                      <span
                        style={{
                          background: isActive
                            ? "rgba(245,243,236,0.18)"
                            : COLORS.sandLine,
                          color: isActive ? COLORS.sand : COLORS.night,
                        }}
                        className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      >
                        {buyerSearchesCount}
                      </span>
                    )}
                  </button>
                );
              })}

              <a
                href="/"
                style={{ color: COLORS.night }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left hover:bg-black/5 mt-4 border-t pt-4"
              >
                <Home size={17} color={COLORS.night} />
                {t("Rudi Nyumbani", "Back to Home")}
              </a>
            </div>
            <div
              onClick={() => setSidebarOpen(false)}
              className="flex-1 bg-black/30"
            />
          </div>
        )}

        <div className="flex-1 min-w-0 overflow-y-auto">{renderMain()}</div>
      </div>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

// ============================================================
// DashboardShell.jsx
// Seller/Buyer dashboard shell. Inaruhusu admin KUPITA tu kama
// guard ya kuzuia admin kuingia dashboard za watumiaji.
// Admin ana dashboard yake (/smk-control-9x7k).
// ============================================================
import React, { useState, useEffect, useCallback } from "react";
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
  Tag,
  ShoppingBag,
  ShieldCheck,
  Headphones,
  MessageSquarePlus,
} from "lucide-react";
import { COLORS } from "./shared.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import MyVerificationsPanel from "./MyVerificationsPanel.jsx";
import UserSupportSection from "./UserSupportSection.jsx";
import SellerFeedback from "../seller/SellerFeedback.jsx";
import { useAuth, logoutAsync } from "../../../config/authStore.js";
import { ADMIN_PATH } from "../../../config/adminPath.js";
import {
  useMyListings,
  getMyListings,
  fetchMyListingsFromApi,
  createListingAsync,
  removeListingAsync,
  updateListingAsync,
  pauseListingAsync,
  unpauseListingAsync,
  markSoldAsync,
  payListingFeeAsync,
  normalizeListingFromApi,
  saveMyListings,
} from "../../../config/listingsStore.js";
import { useSentAnnouncements } from "../../../config/announcementsStore.js";
import { useNotifications } from "../../../config/notificationsStore.js";
import { setDashboardSide } from "../../../config/dashboardSideStore.js";
import { addTransaction } from "../../../config/transactionsStore.js";
import { useNewLeadsCount } from "../../../config/leadsStore.js";
import { useSearchesCount } from "../../../config/searchesStore.js";
import PostPropertyForm from "./PostPropertyForm.jsx";
import PayListingFee from "./PayListingFee.jsx";
import MyListings from "./MyListings.jsx";
import LeadsSection from "../seller/LeadsSection.jsx";
import BoostSasa from "./BoostSasa.jsx";
import LeadingSasa from "./LeadingSasa.jsx";
import AdvertiseSasa from "./AdvertiseSasa.jsx";
import PromotedBannerStrip from "./PromotedBannerStrip.jsx";
import DealRooms from "./DealRooms.jsx";
import BrowseProperties from "./BrowseProperties.jsx";
import BottomNav from "../../../components/BottomNav.jsx";

// Seller & Buyer Overview
import SellerOverview from "../seller/SellerOverview.jsx";
import BuyerOverview from "../buyer/BuyerOverview.jsx";
import RecentActivityPage from "./RecentActivityPage.jsx";

// Buyer Sections
import MySearchesSection from "../buyer/MySearchesSection.jsx";
import SafetySupportSection from "../buyer/SafetySupportSection.jsx";

// Kurasa mpya
import SavedPropertiesPage from "../../SavedPropertiesPage.jsx";
import MessagesPage from "../../MessagesPage.jsx";
import NotificationsPage from "../../NotificationsPage.jsx";
import MyTransactionsPage from "../../MyTransactionsPage.jsx";
import WaitingListPage from "../../WaitingListPage.jsx";
import BundlesPage from "../../BundlesPage.jsx";
import {
  useWaitingList,
  leaveWaitingList,
} from "../../../config/waitingListStore.js";

import PageLoader from "../../../components/PageLoader.jsx";

// ============================================================
// SELLER NAV
// ============================================================
const SELLER_NAV = [
  { key: "overview", label: { sw: "Muhtasari", en: "Overview" }, icon: LayoutGrid },
  { key: "post", label: { sw: "Weka Tangazo", en: "Post Listing" }, icon: PlusCircle },
  { key: "listings", label: { sw: "Mali Zangu", en: "My Listings" }, icon: ListChecks },
  { key: "leads", label: { sw: "Maulizio", en: "Enquiries" }, icon: Inbox },
  { key: "saved", label: { sw: "Matangazo Yaliyohifadhiwa", en: "Saved Listings" }, icon: Heart },
  { key: "boost", label: { sw: "Boost Sasa", en: "Boost Now" }, icon: Rocket },
  { key: "leading", label: { sw: "Nunua Leads", en: "Buy Leads" }, icon: TrendingUp },
  { key: "advertise", label: { sw: "Tangaza Sasa", en: "Advertise Now" }, icon: Megaphone },
  { key: "deals", label: { sw: "Vyumba vya Majadiliano", en: "Deal Rooms" }, icon: MessagesSquare },
  { key: "messages", label: { sw: "Ujumbe", en: "Messages" }, icon: MessageSquare },
  { key: "notifications", label: { sw: "Taarifa", en: "Notifications" }, icon: Bell },
  { key: "transactions", label: { sw: "Miamala Yangu", en: "My Transactions" }, icon: Receipt },
  { key: "bundles", label: { sw: "Nunua Vifurushi", en: "Buy Bundles" }, icon: Package },
  { key: "verification", label: { sw: "Uthibitisho Wangu", en: "My Verification" }, icon: ShieldCheck },
  { key: "support", label: { sw: "Msaada", en: "Support" }, icon: Headphones },
  { key: "feedback", label: { sw: "Maoni Yangu", en: "My Feedback" }, icon: MessageSquarePlus },
];

// ============================================================
// BUYER NAV
// ============================================================
const BUYER_NAV = [
  { key: "overview", label: { sw: "Muhtasari", en: "Overview" }, icon: LayoutGrid },
  { key: "browse", label: { sw: "Tafuta Mali", en: "Browse Properties" }, icon: Search },
  { key: "saved", label: { sw: "Matangazo Yaliyohifadhiwa", en: "Saved Listings" }, icon: Heart },
  { key: "searches", label: { sw: "Utafutaji Wangu", en: "My Searches" }, icon: Bell },
  { key: "deals", label: { sw: "Vyumba vya Majadiliano", en: "Deal Rooms" }, icon: MessagesSquare },
  { key: "messages", label: { sw: "Ujumbe", en: "Messages" }, icon: MessageSquare },
  { key: "notifications", label: { sw: "Taarifa", en: "Notifications" }, icon: Bell },
  { key: "waiting", label: { sw: "Orodha ya Kusubiri", en: "Waiting List" }, icon: Clock3 },
  { key: "transactions", label: { sw: "Miamala Yangu", en: "My Transactions" }, icon: Receipt },
  { key: "bundles", label: { sw: "Nunua Vifurushi", en: "Buy Bundles" }, icon: Package },
  { key: "verification", label: { sw: "Uthibitisho Wangu", en: "My Verification" }, icon: ShieldCheck },
  { key: "safety", label: { sw: "Usalama & Msaada", en: "Safety & Support" }, icon: Shield },
  { key: "support", label: { sw: "Msaada", en: "Support" }, icon: Headphones },
  { key: "feedback", label: { sw: "Maoni Yangu", en: "My Feedback" }, icon: MessageSquarePlus },
];

const URL_TO_STATE = {
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
  "/dashboard/verification": { side: "seller", key: "verification" },
  "/dashboard/support": { side: "seller", key: "support" },
  "/dashboard/feedback": { side: "seller", key: "feedback" },
  "/dashboard/activity": { side: "seller", key: "activity" },
  "/dashboard/pay-listing": { side: "seller", key: "pay_listing" },

  "/dashboard/buyer": { side: "buyer", key: "overview" },
  "/dashboard/buyer/overview": { side: "buyer", key: "overview" },
  "/dashboard/buyer/browse": { side: "buyer", key: "browse" },
  "/dashboard/buyer/saved": { side: "buyer", key: "saved" },
  "/dashboard/buyer/searches": { side: "buyer", key: "searches" },
  "/dashboard/buyer/messages": { side: "buyer", key: "messages" },
  "/dashboard/buyer/notifications": { side: "buyer", key: "notifications" },
  "/dashboard/buyer/deals": { side: "buyer", key: "deals" },
  "/dashboard/buyer/waiting": { side: "buyer", key: "waiting" },
  "/dashboard/buyer/transactions": { side: "buyer", key: "transactions" },
  "/dashboard/buyer/bundles": { side: "buyer", key: "bundles" },
  "/dashboard/buyer/verification": { side: "buyer", key: "verification" },
  "/dashboard/buyer/support": { side: "buyer", key: "support" },
  "/dashboard/buyer/safety": { side: "buyer", key: "safety" },
  "/dashboard/buyer/activity": { side: "buyer", key: "activity" },
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
    verification: "/dashboard/verification",
    support: "/dashboard/support",
    feedback: "/dashboard/feedback",
    activity: "/dashboard/activity",
    pay_listing: "/dashboard/pay-listing",
  },
  buyer: {
    overview: "/dashboard/buyer",
    browse: "/dashboard/buyer/browse",
    saved: "/dashboard/buyer/saved",
    searches: "/dashboard/buyer/searches",
    deals: "/dashboard/buyer/deals",
    messages: "/dashboard/buyer/messages",
    notifications: "/dashboard/buyer/notifications",
    waiting: "/dashboard/buyer/waiting",
    transactions: "/dashboard/buyer/transactions",
    bundles: "/dashboard/buyer/bundles",
    verification: "/dashboard/buyer/verification",
    support: "/dashboard/buyer/support",
    safety: "/dashboard/buyer/safety",
    activity: "/dashboard/buyer/activity",
  },
};

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
  const { user } = useAuth();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(id);
  }, []);

  // ⬇️ ZUIA ADMIN kuingia dashboard za watumiaji
  const isAdminUser =
    user?.role === "Admin" ||
    user?.role === "admin" ||
    user?.role === "ADMIN" ||
    user?.isStaff === true ||
    user?.is_staff === true ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  useEffect(() => {
    if (!user?.id || isAdminUser) return;
    fetchMyListingsFromApi();
  }, [user?.id, isAdminUser]);

  const [side, setSide] = useState("seller");
  const [activeKey, setActiveKey] = useState("overview");
  // ⬇️ EDIT — listing id inayohaririwa (null kama hakuna)
  const [editListingId, setEditListingId] = useState(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const listings = useMyListings();
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
  // ROUTE → STATE (pamoja na /dashboard/listings/edit/:id)
  // ============================================================
  useEffect(() => {
    const path = location.pathname;

    // Handle /dashboard/listings/edit/:id
    const editMatch = path.match(/^\/dashboard\/listings\/edit\/([^/]+)\/?$/);
    if (editMatch) {
      setSide("seller");
      setActiveKey("listings");
      setEditListingId(editMatch[1]);
      return;
    }

    const match = URL_TO_STATE[path];
    if (match) {
      setSide(match.side);
      setActiveKey(match.key);
      setEditListingId(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    setDashboardSide(side);
  }, [side]);

  useEffect(() => {
    if (announcements.length === 0) return;
    const id = setInterval(() => {
      setTickerIndex((i) => (i + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(id);
  }, [announcements.length]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = () => setUserMenuOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen]);

  const accent = side === "seller" ? COLORS.gold : COLORS.green;

  // ============================================================
  // LISTING HELPERS — API-backed
  // ============================================================
  const addListing = (listing) => {
    if (listing && (listing.id || listing.pk)) {
      const normalized = normalizeListingFromApi(listing, "pending_payment");
      if (normalized && normalized.id != null) {
        const current = getMyListings();
        saveMyListings([
          normalized,
          ...current.filter((l) => String(l.id) !== String(normalized.id)),
        ]);
      }
      return { ok: true, listing };
    }
    return createListingAsync(listing);
  };
  const removeListing = (id) => removeListingAsync(id);
  const updateListing = (id, patch) => updateListingAsync(id, patch);

  const handlePause = (id) => pauseListingAsync(id);
  const handleResume = (id) => unpauseListingAsync(id);
  const handleMarkSold = (id) => markSoldAsync(id);

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

  const handleFinalPaymentConfirmed = (deal, dealSide, { method, reference }) => {
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
  const handleNavClick = useCallback(
    (key) => {
      setActiveKey(key);
      setEditListingId(null); // ⬅️ toka edit mode kila unapobonyeza nav
      const url = STATE_TO_URL[side]?.[key];
      if (url) navigate(url);
    },
    [side, navigate]
  );

  const goToBoost = useCallback(
    (listingId) => {
      setBoostTarget(listingId);
      handleNavClick("boost");
    },
    [handleNavClick]
  );

  const goToLeading = useCallback(
    (listingId) => {
      setLeadingTarget(listingId);
      handleNavClick("leading");
    },
    [handleNavClick]
  );

  const goToAdvertise = useCallback(
    (listingId) => {
      setAdvertiseTarget(listingId);
      handleNavClick("advertise");
    },
    [handleNavClick]
  );

  const goToListingDetail = useCallback(
    (listingId) => {
      if (listingId) navigate(`/mali/${listingId}`);
    },
    [navigate]
  );

  // ⬇️ EDIT — peleka kwenye ukurasa wa kuhariri
  const goToEdit = useCallback(
    (listingId) => {
      if (listingId) navigate(`/dashboard/listings/edit/${listingId}`);
    },
    [navigate]
  );

  const handleSideChange = useCallback(
    (newSide) => {
      setSide(newSide);
      setActiveKey("overview");
      setEditListingId(null);
      const url = STATE_TO_URL[newSide]?.overview;
      if (url) navigate(url);
    },
    [navigate]
  );

  const markListingPaid = async (id, { alreadyPaid = false } = {}) => {
    const all = getMyListings();
    const listing = all.find((l) => String(l.id) === String(id));

    updateListing(id, {
      status: "in_review",
      paidAt: new Date().toISOString(),
    });

    if (!alreadyPaid && listing) {
      addTransaction({
        type: "listing_fee",
        title: `Listing Fee — ${listing.title}`,
        property: listing.title,
        amount: listing.listingFee || listing.feeAmount,
        status: "completed",
        method: "M-Pesa",
        listingId: id,
      });
    }
    return { ok: true };
  };

  const handleLanguageSelect = (code) => {
    setLang(code);
    setLangOpen(false);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logoutAsync();
    navigate("/login");
  };

  // ============================================================
  // RENDER MAIN CONTENT
  // ============================================================
  const renderMain = () => {
    if (activeKey === "overview") {
      if (side === "seller") {
        return <SellerOverview onNavigate={handleNavClick} />;
      }
      return <BuyerOverview onNavigate={handleNavClick} />;
    }
    if (activeKey === "post") {
      return (
        <PostPropertyForm
          mode="create"
          onSubmit={addListing}
          onGoToListings={() => handleNavClick("listings")}
          onPaid={markListingPaid}
          onGoToBoost={goToBoost}
        />
      );
    }
    if (activeKey === "listings") {
      // ⬇️ EDIT MODE — kama editListingId ipo, onyesha PostPropertyForm
      if (editListingId) {
        const listing = listings.find(
          (l) => String(l.id) === String(editListingId)
        );

        // Kama listing haipo local cache, mwambie mtumiaji arudi
        if (!listing) {
          return (
            <div className="p-6 text-center">
              <p className="text-secondary text-sm">
                {t(
                  "Tangazo halipatikani. Huenda limefutwa au halijasync.",
                  "Listing not found. It may have been deleted or not synced."
                )}
              </p>
              <button
                onClick={() => handleNavClick("listings")}
                className="mt-4 text-sm font-semibold underline"
                style={{ color: COLORS.gold }}
              >
                {t("Rudi kwenye Mali Zangu", "Back to My Listings")}
              </button>
            </div>
          );
        }

        return (
          <PostPropertyForm
            mode="edit"
            initialData={listing}
            onSubmit={async (data) => {
              const res = await updateListing(editListingId, data);
              if (res?.ok) {
                handleNavClick("listings");
              }
              return res;
            }}
            onGoToListings={() => handleNavClick("listings")}
            onPaid={markListingPaid}
            onGoToBoost={goToBoost}
          />
        );
      }

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
          onPostNew={() => handleNavClick("post")}
          onEdit={goToEdit}
        />
      );
    }
    if (activeKey === "leads") {
      return <LeadsSection onNavigate={handleNavClick} />;
    }
    if (activeKey === "browse") {
      return <BrowseProperties lang={lang} excludeSellerId={user?.id} />;
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
          initialDealId={new URLSearchParams(location.search).get("deal")}
          onReservationPaid={handleReservationPaid}
          onFinalPaymentConfirmed={handleFinalPaymentConfirmed}
        />
      );
    }
    if (activeKey === "messages") {
      return (
        <MessagesPage
          initialConversationId={new URLSearchParams(location.search).get("c")}
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
    if (activeKey === "verification") {
      return <MyVerificationsPanel />;
    }
    if (activeKey === "support") {
      return <UserSupportSection side={side} />;
    }
    if (activeKey === "feedback") {
      return <SellerFeedback />;
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
    if (activeKey === "activity") {
      return <RecentActivityPage side={side} onNavigate={handleNavClick} />;
    }
    if (activeKey === "pay_listing") {
      return <PayListingFee />;
    }
    return (
      <main className="flex-1 p-4 sm:p-6 text-center">
        <h1 className="h-title">
          {nav.find((n) => n.key === activeKey)?.label?.[lang] || ""}
        </h1>
        <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
          {side === "seller"
            ? t(
                "Upande wa Muuzaji — dhibiti mali zako, malipo na maombi ya wanunuzi.",
                "Seller side — manage your listings, payments, and buyer enquiries."
              )
            : t(
                "Upande wa Mnunuzi — tafuta, negotiate na fuatilia manunuzi yako.",
                "Buyer side — find, negotiate, and track your purchases."
              )}
        </p>
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="rounded-2xl border-2 border-dashed p-10 text-center mt-6"
        >
          <p className="text-muted text-sm">
            {t(
              `Sehemu ya "${nav.find((n) => n.key === activeKey)?.label?.[lang] || ""}" itajengwa hapa`,
              `The "${nav.find((n) => n.key === activeKey)?.label?.[lang] || ""}" section will be built here`
            )}
          </p>
        </div>
      </main>
    );
  };

  const renderAvatar = (size = "w-8 h-8", textSize = "text-sm") => {
    if (user?.avatarUrl) {
      return (
        <img
          src={user.avatarUrl}
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

  // ⬇️ Zuia render kama ni admin
  if (isAdminUser) {
    return (
      <div
        style={{ background: COLORS.sand, minHeight: "100vh" }}
        className="w-full flex items-center justify-center p-6"
      >
        <div className="text-center max-w-md">
          <div
            style={{ background: `${COLORS.rust}15` }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Shield size={28} color={COLORS.rust} />
          </div>
          <h2 className="text-lg font-bold text-primary mb-2">
            {t("Admin Hana Ruhusa Hapa", "Admin Cannot Access Here")}
          </h2>
          <p className="text-sm text-secondary leading-relaxed">
            {t(
              "Admin ana dashboard yake. Kama unataka kuingia dashboard za watumiaji, tafadhali tengeneza account nyingine kama Buyer au Seller.",
              "Admin has their own dashboard. If you want to access user dashboards, please create another account as a Buyer or Seller."
            )}
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => navigate(ADMIN_PATH)}
              style={{ background: COLORS.night, color: "white" }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold"
            >
              {t("Nenda Dashboard ya Admin", "Go to Admin Dashboard")}
            </button>
            <button
              onClick={handleLogout}
              style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold border bg-white"
            >
              {t("Toka na uingie kama mtumiaji", "Log out and sign in as a user")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <PageLoader lang={lang} />;
  }

  return (
    <div
      style={{
        background: COLORS.sand,
        minHeight: "100vh",
      }}
      className="w-full flex flex-col pb-16 md:pb-0"
    >
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
          style={{ color: COLORS.sand }}
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
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              <Tag size={14} />
              {t("Dashibodi ya Muuzaji", "Seller Dashboard")}
            </button>
            <button
              onClick={() => handleSideChange("buyer")}
              style={{
                background: side === "buyer" ? COLORS.green : "transparent",
                color: COLORS.sand,
              }}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              <ShoppingBag size={14} />
              {t("Dashibodi ya Mnunuzi", "Buyer Dashboard")}
            </button>
          </div>

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
                    className="text-body-sm font-semibold"
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

          <a
            href="/"
            className="hidden md:block text-white/80 hover:text-white p-1.5 transition-colors"
            aria-label={t("Rudi kwenye ukurasa wa mwanzo", "Back to homepage")}
          >
            <Home size={20} />
          </a>

          <button
            onClick={() => handleNavClick("notifications")}
            className="relative text-white/80 hover:text-white p-1.5 transition-colors"
            aria-label={t("Taarifa", "Notifications")}
          >
            <Bell size={20} />
            {unreadNotifCount > 0 && (
              <span
                style={{ background: COLORS.rust }}
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              >
                {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
              </span>
            )}
          </button>

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
                    className="text-body-sm truncate"
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
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          <Tag size={14} />
          {t("Dashibodi ya Muuzaji", "Seller Dashboard")}
        </button>
        <button
          onClick={() => handleSideChange("buyer")}
          style={{
            background: side === "buyer" ? COLORS.green : "transparent",
            color: COLORS.sand,
          }}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          <ShoppingBag size={14} />
          {t("Dashibodi ya Mnunuzi", "Buyer Dashboard")}
        </button>
      </div>

    
      {/* ANNOUNCEMENT TICKER */}
     {announcements.length > 0 && (
   <div
     style={{ background: COLORS.sandLine, color: COLORS.night }}
     className="w-full flex items-center gap-2 px-4 py-1.5 text-body-sm sm:text-sm"
   >
    <Megaphone size={14} color={COLORS.rust} className="shrink-0" />
      <span className="truncate">
        {getAnnouncementMessage(
        announcements[tickerIndex % announcements.length],
        lang
        )}
       </span>
      </div>
    )}

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
                {key === "listings" && listings.length > 0 && (
                  <span
                    style={{
                      background: isActive
                        ? "rgba(245,243,236,0.18)"
                        : COLORS.sandLine,
                      color: isActive ? COLORS.sand : COLORS.night,
                    }}
                    className="ml-auto text-body-sm font-bold px-1.5 py-0.5 rounded-full"
                  >
                    {listings.length}
                  </span>
                )}
                {key === "leads" && newLeadsCount > 0 && (
                  <span
                    style={{
                      background: isActive
                        ? "rgba(245,243,236,0.18)"
                        : COLORS.rust,
                      color: isActive ? COLORS.sand : "white",
                    }}
                    className="ml-auto text-body-sm font-bold px-1.5 py-0.5 rounded-full"
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
                    className="ml-auto text-body-sm font-bold px-1.5 py-0.5 rounded-full"
                  >
                    {buyerSearchesCount}
                  </span>
                )}
              </button>
            );
          })}

          <a
            href="/"
            className="text-primary flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left hover:bg-black/5 mt-4 border-t pt-4"
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
                        className="ml-auto text-body-sm font-bold px-1.5 py-0.5 rounded-full"
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
                        className="ml-auto text-body-sm font-bold px-1.5 py-0.5 rounded-full"
                      >
                        {buyerSearchesCount}
                      </span>
                    )}
                  </button>
                );
              })}

              <a
                href="/"
                className="text-primary flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left hover:bg-black/5 mt-4 border-t pt-4"
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

        <div className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden overflow-y-auto">{renderMain()}</div>
      </div>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search, Bell, Menu, X, PlusCircle, ListChecks, Rocket, MessagesSquare,
  Receipt, LayoutGrid, Clock3, CalendarCheck, Megaphone, Heart, Home,
  Globe, Check, TrendingUp, LogOut, User as UserIcon, Inbox, Shield,
  Package, Tag, ShoppingBag, ShieldCheck, MessageSquarePlus,
  Plus, Share2, Users, Sun, Moon, ChevronLeft, ChevronRight,
} from "lucide-react";
import { COLORS } from "./shared.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useTheme } from "../../../config/themeStore.js";
import MyVerificationsPanel from "./MyVerificationsPanel.jsx";
import SellerFeedback from "../seller/SellerFeedback.jsx";
import { useAuth, logoutAsync } from "../../../config/authStore.js";
import { ADMIN_PATH } from "../../../config/adminPath.js";

// ✅ FIX: Import rolesStore — RBAC inaunganishwa sasa
import { useRoles, useSubAdminsWithRoles } from "../../../config/rolesStore.js";

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
  normalizeListingFromApi,
  saveMyListings,
  fetchListingDetailAsync,
} from "../../../config/listingsStore.js";
import { useAnnouncements, hydrateAnnouncementsFromApi } from "../../../config/announcementsStore.js";
import { useNotifications } from "../../../config/notificationsStore.js";
import { setDashboardSide } from "../../../config/dashboardSideStore.js";
import { URL_TO_STATE } from "../../../config/dashboardRoutes.js";
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
import MyReservationsPage from "./MyReservationsPage.jsx";
import BrowseProperties from "./BrowseProperties.jsx";
import BottomNav from "../../../components/BottomNav.jsx";
import PageLoader from "../../../components/PageLoader.jsx";
import SellerOverview from "../seller/SellerOverview.jsx";
import BuyerOverview from "../buyer/BuyerOverview.jsx";
import RecentActivityPage from "./RecentActivityPage.jsx";
import MySearchesSection from "../buyer/MySearchesSection.jsx";
import SafetySupportSection from "../buyer/SafetySupportSection.jsx";
import SavedPropertiesPage from "../../SavedPropertiesPage.jsx";
import NotificationsPage from "../../NotificationsPage.jsx";
import MyTransactionsPage from "../../MyTransactionsPage.jsx";
import WaitingListPage from "../../WaitingListPage.jsx";
import BundlesPage from "../../BundlesPage.jsx";
import NotFoundPage from "../../NotFoundPage.jsx";
import {
  useWaitingList,
  leaveWaitingList,
} from "../../../config/waitingListStore.js";

// ✅ FIX: Sidebar collapse persistence key
const SIDEBAR_COLLAPSED_KEY = "sokomkononi_sidebar_collapsed_v1";

function readSidebarCollapsed() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}
function writeSidebarCollapsed(v) {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, v ? "1" : "0");
  } catch { /* ignore */ }
}

// ✅ FIX: Admin blocked message — constant, inatafsiriwa kwa t() panapotumika
const ADMIN_BLOCKED_MESSAGE = {
  title: { sw: "Admin Hana Ruhusa Hapa", en: "Admin Cannot Access Here" },
  body: {
    sw: "Admin ana dashboard yake. Kama unataka kuingia dashboard za watumiaji, tafadhali tengeneza account nyingine kama Buyer au Seller.",
    en: "Admin has their own dashboard. If you want to access user dashboards, please create another account as a Buyer or Seller.",
  },
  goAdmin: { sw: "Nenda Dashboard ya Admin", en: "Go to Admin Dashboard" },
  logout: { sw: "Toka na uingie kama mtumiaji", en: "Log out and sign in as a user" },
};

// ✅ FIX: RBAC — mapping ya NAV key → PERMISSION key (rolesStore)
// `null` = daima inaonekana (hakuna kizuizi cha RBAC)
// Ikiwa NAV key haipo kwenye mapping, default = inaonekana
const NAV_PERMISSION_MAP = {
  seller: {
    overview: null,
    post: null,
    listings: null,
    leads: null,
    boost: null,
    leading: null,
    advertise: null,
    deals: "deals",
    notifications: null,
    transactions: null,
    bundles: "bundles",
    verification: "verification",
    safety: "support",
    feedback: null,
  },
  buyer: {
    overview: null,
    browse: null,
    saved: null,
    searches: null,
    deals: "deals",
    reservations: "deals",
    notifications: null,
    waiting: null,
    transactions: null,
    bundles: "bundles",
    verification: "verification",
    safety: "support",
    feedback: null,
  },
};

// ✅ FIX: Permissions helper — inachuja NAV kulingana na RBAC ya mtumiaji
function canAccessNavKey(side, key, user, roles, staffList) {
  // 1. Admin kamili — ruhusu kila kitu (Admin block ipo juu kwa admin property)
  if (
    user?.isStaff === true ||
    user?.is_staff === true ||
    user?.isSuperuser === true ||
    user?.is_superuser === true ||
    user?.role === "Admin" ||
    user?.role === "admin" ||
    user?.role === "ADMIN"
  ) {
    return true;
  }

  // 2. Pata role ya RBAC ya mtumiaji (kama yupo kwenye staff list)
  const me = (staffList || []).find(
    (s) => s.userId === user?.id || s.userId === user?.pk
  );
  if (!me || !me.active) {
    // Si sub-admin au hajaamilishwa — ruhusu kila kitu
    return true;
  }

  // 3. Pata role yake
  const role = (roles || []).find((r) => r.id === me.roleId);
  if (!role) return true;

  // 4. Chuja kwa mapping
  const permKey = NAV_PERMISSION_MAP?.[side]?.[key];
  if (permKey == null) return true;
  return (role.permissions || []).includes(permKey);
}

const SELLER_NAV = [
  { key: "overview", label: { sw: "Muhtasari", en: "Overview" }, icon: LayoutGrid },
  { key: "post", label: { sw: "Weka Tangazo", en: "Post Listing" }, icon: PlusCircle },
  { key: "listings", label: { sw: "Mali Zangu", en: "My Listings" }, icon: ListChecks },
  { key: "leads", label: { sw: "Maulizio", en: "Enquiries" }, icon: Inbox },
  { key: "boost", label: { sw: "Angaza Sasa", en: "Boost Now" }, icon: Rocket },
  { key: "leading", label: { sw: "Kuwa Kipaumbele", en: "Buy Leads" }, icon: TrendingUp },
  { key: "advertise", label: { sw: "Tangaza Sasa", en: "Advertise Now" }, icon: Megaphone },
  { key: "deals", label: { sw: "Vyumba vya Majadiliano", en: "Deal Rooms" }, icon: MessagesSquare },
  { key: "notifications", label: { sw: "Taarifa", en: "Notifications" }, icon: Bell },
  { key: "transactions", label: { sw: "Miamala Yangu", en: "My Transactions" }, icon: Receipt },
  { key: "bundles", label: { sw: "Nunua Vifurushi", en: "Buy Bundles" }, icon: Package },
  { key: "verification", label: { sw: "Uthibitisho Wangu", en: "My Verification" }, icon: ShieldCheck },
  { key: "safety", label: { sw: "Usalama & Msaada", en: "Safety & Support" }, icon: Shield },
  { key: "feedback", label: { sw: "Maoni Yangu", en: "My Feedback" }, icon: MessageSquarePlus },
];

const BUYER_NAV = [
  { key: "overview", label: { sw: "Muhtasari", en: "Overview" }, icon: LayoutGrid },
  { key: "browse", label: { sw: "Tafuta Mali", en: "Browse Listing" }, icon: Search },
  { key: "saved", label: { sw: "Matangazo Yaliyohifadhiwa", en: "Saved Listings" }, icon: Heart },
  { key: "searches", label: { sw: "Utafutaji Wangu", en: "My Searches" }, icon: Bell },
  { key: "deals", label: { sw: "Vyumba vya Majadiliano", en: "Deal Rooms" }, icon: MessagesSquare },
  { key: "reservations", label: { sw: "Mali Nilizoshikilia", en: "My Reservations" }, icon: CalendarCheck },
  { key: "notifications", label: { sw: "Taarifa", en: "Notifications" }, icon: Bell },
  { key: "waiting", label: { sw: "Orodha ya Kusubiri", en: "Reservation List" }, icon: Clock3 },
  { key: "transactions", label: { sw: "Miamala Yangu", en: "My Transactions" }, icon: Receipt },
  { key: "bundles", label: { sw: "Nunua Vifurushi", en: "Buy Bundles" }, icon: Package },
  { key: "verification", label: { sw: "Uthibitisho Wangu", en: "My Verification" }, icon: ShieldCheck },
  { key: "safety", label: { sw: "Usalama & Msaada", en: "Safety & Support" }, icon: Shield },
  { key: "feedback", label: { sw: "Maoni Yangu", en: "My Feedback" }, icon: MessageSquarePlus },
];

const STATE_TO_URL = {
  seller: {
    overview: "/dashboard/overview",
    post: "/dashboard/post",
    listings: "/dashboard/listings",
    leads: "/dashboard/leads",
    boost: "/dashboard/boost",
    leading: "/dashboard/leading",
    advertise: "/dashboard/advertise",
    deals: "/dashboard/deals",
    notifications: "/dashboard/notifications",
    transactions: "/dashboard/transactions",
    bundles: "/dashboard/bundles",
    verification: "/dashboard/verification",
    safety: "/dashboard/safety",
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
    reservations: "/dashboard/buyer/reservations",
    notifications: "/dashboard/buyer/notifications",
    waiting: "/dashboard/buyer/waiting",
    transactions: "/dashboard/buyer/transactions",
    bundles: "/dashboard/buyer/bundles",
    verification: "/dashboard/buyer/verification",
    feedback: "/dashboard/buyer/feedback",
    safety: "/dashboard/buyer/safety",
    activity: "/dashboard/buyer/activity",
  },
};

const BOOT_LOADER_MIN_MS = 600;
const BOOT_LOADER_MAX_MS = 8000;

function getAnnouncementMessage(a, lang) {
  if (!a) return "";
  if (lang === "en" && a.messageEn) return a.messageEn;
  return a.message || "";
}

export default function DashboardShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const { user } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  // ✅ FIX: RBAC — sasa umeunganishwa kikamilifu
  const roles = useRoles();
  const staffList = useSubAdminsWithRoles();

  const isAdminUser =
    user?.role === "Admin" ||
    user?.role === "admin" ||
    user?.role === "ADMIN" ||
    user?.isStaff === true ||
    user?.is_staff === true ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  // ✅ FIX: Sidebar collapsible — state imehifadhiwa kwenye localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readSidebarCollapsed());
  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((v) => {
      const next = !v;
      writeSidebarCollapsed(next);
      return next;
    });
  }, []);

  // ── Boot loader ──
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    if (isAdminUser) {
      setBootReady(true);
      return undefined;
    }
    if (!user?.id) return undefined;

    let cancelled = false;
    let minTimer = null;
    const startedAt = Date.now();

    const bootTasks = [
      () => fetchMyListingsFromApi(),
    ];

    Promise.allSettled(
      bootTasks.map((task) => Promise.resolve().then(task))
    ).then(() => {
      if (cancelled) return;
      const wait = Math.max(0, BOOT_LOADER_MIN_MS - (Date.now() - startedAt));
      minTimer = setTimeout(() => {
        if (!cancelled) setBootReady(true);
      }, wait);
    });

    return () => {
      cancelled = true;
      if (minTimer) clearTimeout(minTimer);
    };
  }, [user?.id, isAdminUser]);

  useEffect(() => {
    const id = setTimeout(() => setBootReady(true), BOOT_LOADER_MAX_MS);
    return () => clearTimeout(id);
  }, []);

  const { side, activeKey, editListingId, known } = useMemo(() => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const edit = path.match(/^\/dashboard\/listings\/edit\/([^/]+)$/);
    if (edit) {
      return { side: "seller", activeKey: "listings", editListingId: edit[1], known: true };
    }
    const m = URL_TO_STATE[path];
    return m
      ? { side: m.side, activeKey: m.key, editListingId: null, known: true }
      : { side: "seller", activeKey: "overview", editListingId: null, known: false };
  }, [location.pathname]);

  const [tickerIndex, setTickerIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const avatarButtonRef = useRef(null);

  const listings = useMyListings();
  const { unreadCount: unreadNotifCount } = useNotifications("user");
  const announcements = useAnnouncements();
  const waitingList = useWaitingList();
  const newLeadsCount = useNewLeadsCount();
  const buyerSearchesCount = useSearchesCount();
  const [boostTarget, setBoostTarget] = useState(null);
  const [leadingTarget, setLeadingTarget] = useState(null);
  const [advertiseTarget, setAdvertiseTarget] = useState(null);
  const [langOpen, setLangOpen] = useState(false);

  const [editReadyId, setEditReadyId] = useState(null);
  useEffect(() => {
    if (!editListingId) {
      setEditReadyId(null);
      return undefined;
    }
    let cancelled = false;
    fetchListingDetailAsync(editListingId).finally(() => {
      if (!cancelled) setEditReadyId(String(editListingId));
    });
    return () => {
      cancelled = true;
    };
  }, [editListingId]);

  // ✅ FIX: Chuja nav items kwa RBAC (au zote kama si sub-admin)
  const baseNav = side === "seller" ? SELLER_NAV : BUYER_NAV;
  const nav = useMemo(
    () =>
      baseNav.filter((item) =>
        canAccessNavKey(side, item.key, user, roles, staffList)
      ),
    [baseNav, side, user, roles, staffList]
  );

  const languages = [
    { code: "sw", native: "Kiswahili" },
    { code: "en", native: "English" },
  ];

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

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
    const handleClickOutside = (event) => {
      if (
        userMenuRef.current?.contains(event.target) ||
        avatarButtonRef.current?.contains(event.target)
      ) {
        return;
      }
      setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const accent = side === "seller" ? COLORS.gold : COLORS.green;

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

  const handleNavClick = useCallback(
    (key) => {
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

  const goToEdit = useCallback(
    (listingId) => {
      if (listingId) navigate(`/dashboard/listings/edit/${listingId}`);
    },
    [navigate]
  );

  const handleSideChange = useCallback(
    (newSide) => {
      const url = STATE_TO_URL[newSide]?.overview;
      if (url) navigate(url);
    },
    [navigate]
  );

  const markListingPaid = async (id, { alreadyPaid = false } = {}) => {
    const all = getMyListings();
    const listing = all.find((l) => String(l.id) === String(id));
    if (!listing) return { ok: false, error: new Error("Listing not found") };

    const res = await updateListing(id, {
      status: "paid_pending_approval",
      paidAt: new Date().toISOString(),
    });

    if (!res.ok) return res;

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

  const handleShare = async () => {
    setUserMenuOpen(false);
    const shareUrl =
      typeof window !== "undefined" ? window.location.origin : "";
    const shareData = {
      title: "SokoMkononi",
      text:
        lang === "sw"
          ? "Nunua na uza mali kwa urahisi na usalama — SokoMkononi."
          : "Buy and sell property easily and safely — SokoMkononi.",
      url: shareUrl,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("sokomkononi:toast", {
              detail: {
                type: "success",
                message:
                  lang === "sw"
                    ? "Kiungo kimenakiliwa — shiriki na marafiki!"
                    : "Link copied — share with friends!",
              },
            })
          );
        }
      }
    } catch { /* noop */ }
  };

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
      if (editListingId) {
        const listing = listings.find(
          (l) => String(l.id) === String(editListingId)
        );
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
        if (editReadyId !== String(editListingId)) {
          return (
            <div className="p-6 text-center text-secondary text-sm">
              {t("Inapakia tangazo...", "Loading listing...")}
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
                await fetchListingDetailAsync(editListingId);
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
    if (activeKey === "leads") return <LeadsSection onNavigate={handleNavClick} />;
    if (activeKey === "browse") return <BrowseProperties lang={lang} excludeSellerId={user?.id} />;
    if (activeKey === "saved") return <SavedPropertiesPage />;
    if (activeKey === "searches") return <MySearchesSection />;
    if (activeKey === "safety") return <SafetySupportSection side={side} />;
    if (activeKey === "boost") {
      return <BoostSasa listings={listings} initialListingId={boostTarget} onBoosted={updateListing} />;
    }
    if (activeKey === "leading") {
      return <LeadingSasa listings={listings} initialListingId={leadingTarget} onLead={updateListing} />;
    }
    if (activeKey === "advertise") {
      return <AdvertiseSasa listings={listings} initialListingId={advertiseTarget} onAdvertised={() => {}} />;
    }
    if (activeKey === "deals") {
      return (
        <DealRooms
          key={`${side}:${location.search}`}
          side={side}
          initialDealId={new URLSearchParams(location.search).get("deal")}
          onReservationPaid={handleReservationPaid}
          onFinalPaymentConfirmed={handleFinalPaymentConfirmed}
        />
      );
    }
    if (activeKey === "reservations") return <MyReservationsPage />;
    if (activeKey === "notifications") return <NotificationsPage />;
    if (activeKey === "transactions") return <MyTransactionsPage />;
    if (activeKey === "bundles") return <BundlesPage role={side} />;
    if (activeKey === "verification") return <MyVerificationsPanel side={side} />;
    if (activeKey === "feedback") return <SellerFeedback side={side} />;
    if (activeKey === "waiting") {
      return (
        <WaitingListPage
          entries={waitingList}
          onLeave={leaveWaitingList}
          onGoToDeals={() => handleNavClick("deals")}
        />
      );
    }
    if (activeKey === "activity") return <RecentActivityPage side={side} onNavigate={handleNavClick} />;
    if (activeKey === "pay_listing") return <PayListingFee />;
    return (
      <main className="flex-1 p-4 sm:p-6 text-center">
        <h1 className="h-title">{nav.find((n) => n.key === activeKey)?.label?.[lang] || ""}</h1>
        <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
          {side === "seller"
            ? t("Upande wa Muuzaji — dhibiti mali zako, malipo na maombi ya wanunuzi.", "Seller side — manage your listings, payments, and buyer enquiries.")
            : t("Upande wa Mnunuzi — tafuta, negotiate na fuatilia manunuzi yako.", "Buyer side — find, negotiate, and track your purchases.")}
        </p>
        <div className="rounded-2xl border-2 border-dashed border-hairline p-10 text-center mt-6">
          <p className="text-muted text-sm">
            {t(`Sehemu ya "${nav.find((n) => n.key === activeKey)?.label?.[lang] || ""}" itajengwa hapa`, `The "${nav.find((n) => n.key === activeKey)?.label?.[lang] || ""}" section will be built here`)}
          </p>
        </div>
      </main>
    );
  };

  const renderAvatar = (size = "w-8 h-8", textSize = "text-sm") => {
    const url = user?.avatarUrl || user?.avatar || user?.avatar_url || user?.picture || null;
    if (url) {
      return (
        <img
          src={url}
          alt={user?.name || "User"}
          className={`${size} rounded-full object-cover shrink-0`}
          onError={(e) => { e.target.style.display = "none"; }}
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

  if (!known) return <NotFoundPage />;

  if (!bootReady && !isAdminUser) return <PageLoader />;

  if (isAdminUser) {
    return (
      <div style={{ minHeight: "100vh" }} className="bg-page w-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div style={{ background: `${COLORS.rust}15` }} className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={28} color={COLORS.rust} />
          </div>
          <h2 className="text-lg font-bold text-primary mb-2">
            {t(ADMIN_BLOCKED_MESSAGE.title.sw, ADMIN_BLOCKED_MESSAGE.title.en)}
          </h2>
          <p className="text-sm text-secondary leading-relaxed">
            {t(ADMIN_BLOCKED_MESSAGE.body.sw, ADMIN_BLOCKED_MESSAGE.body.en)}
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={() => navigate(ADMIN_PATH)} style={{ background: COLORS.night, color: "white" }} className="px-4 py-2.5 rounded-lg text-sm font-semibold">
              {t(ADMIN_BLOCKED_MESSAGE.goAdmin.sw, ADMIN_BLOCKED_MESSAGE.goAdmin.en)}
            </button>
            <button onClick={handleLogout} style={{ borderColor: "rgb(var(--c-hairline))", color: COLORS.ink }} className="px-4 py-2.5 rounded-lg text-sm font-semibold border bg-card">
              {t(ADMIN_BLOCKED_MESSAGE.logout.sw, ADMIN_BLOCKED_MESSAGE.logout.en)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-surface="sand" className="bg-page w-full flex flex-col pb-16 md:pb-0 min-h-screen">
      <header
        style={{ background: "#011957" }}
        className="w-full flex items-center gap-3 px-3 sm:px-5 py-3 sticky top-0 z-30 text-white border-b border-white/[0.08]"
      >
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="text-white/80 hover:text-white md:hidden"
          aria-label={t("Fungua menyu", "Open menu")}
        >
          <Menu size={22} />
        </button>

        <button
          onClick={toggleSidebarCollapsed}
          className="hidden md:flex text-white/70 hover:text-white p-1.5 rounded-md hover:bg-white/[0.08] transition-colors"
          aria-label={
            sidebarCollapsed
              ? t("Panua menyu", "Expand menu")
              : t("Kunja menyu", "Collapse menu")
          }
          title={
            sidebarCollapsed
              ? t("Panua menyu", "Expand menu")
              : t("Kunja menyu", "Collapse menu")
          }
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <a href="/" className="text-lg sm:text-xl font-semibold tracking-tight shrink-0 hover:opacity-80 transition-opacity">
          SokoMkononi
        </a>

        <div style={{ background: "#042475", borderColor: "rgba(245,243,236,0.12)" }} className="hidden sm:flex items-center flex-1 max-w-md rounded-full border px-3 py-1.5 gap-2">
          <Search size={16} color="rgba(245,243,236,0.6)" />
          <input placeholder={t("Tafuta mali...", "Search properties...")} className="bg-transparent outline-none text-sm flex-1 text-white placeholder:text-white/50" />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div style={{ background: "#042475" }} className="hidden md:flex items-center rounded-full p-1">
            <button
              onClick={() => handleSideChange("seller")}
              style={{ background: side === "seller" ? COLORS.gold : "transparent", color: side === "seller" ? COLORS.night : "#FFFFFF" }}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              <Tag size={14} />
              {t("Dashibodi ya Muuzaji", "Seller Dashboard")}
            </button>
            <button
              onClick={() => handleSideChange("buyer")}
              style={{ background: side === "buyer" ? COLORS.green : "transparent", color: "#FFFFFF" }}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              <ShoppingBag size={14} />
              {t("Dashibodi ya Mnunuzi", "Buyer Dashboard")}
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="text-white/80 hover:text-white p-1.5 rounded-md hover:bg-white/[0.08] transition-colors"
            aria-label={theme === "dark" ? t("Badilisha kuwa mwanga", "Switch to light mode") : t("Badilisha kuwa giza", "Switch to dark mode")}
            title={theme === "dark" ? t("Mode ya Mwanga", "Light mode") : t("Mode ya Giza", "Dark mode")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              style={{ background: "#042475", borderColor: "rgba(245,243,236,0.15)" }}
              className="text-white/80 hover:text-white text-sm font-medium border rounded-md px-2 sm:px-3 py-1.5 transition-colors flex items-center gap-1"
            >
              <Globe size={14} />
              <span className="hidden sm:inline">{currentLang?.native || "Kiswahili"}</span>
              <span className="sm:hidden">{currentLang?.code?.toUpperCase() || "SW"}</span>
            </button>
            {langOpen && (
              <div
                data-keep-light
                style={{ background: "#042475", borderColor: "rgba(245,243,236,0.1)" }}
                className="absolute right-0 mt-2 w-48 border rounded-lg shadow-xl py-2 z-50"
              >
                <div style={{ borderColor: "rgba(245,243,236,0.1)" }} className="px-4 py-2 border-b">
                  <p className="text-white/50 text-xs font-semibold">
                    {t("Chagua Lugha", "Choose Language")}
                  </p>
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLanguageSelect(l.code)}
                    style={{ background: lang === l.code ? "rgba(245,243,236,0.05)" : "transparent", color: "#F5F3EC" }}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm font-medium">{l.native}</span>
                    {lang === l.code && <Check size={14} color={COLORS.gold} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a href="/" className="hidden md:block text-white/80 hover:text-white p-1.5 transition-colors" aria-label={t("Rudi kwenye ukurasa wa mwanzo", "Back to homepage")}>
            <Home size={20} />
          </a>

          <button
            onClick={() => handleNavClick("notifications")}
            className="relative text-white/80 hover:text-white p-1.5 transition-colors"
            aria-label={t("Taarifa", "Notifications")}
          >
            <Bell size={20} />
            {unreadNotifCount > 0 && (
              <span style={{ background: COLORS.rust }} className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              ref={avatarButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen((v) => !v);
              }}
              className="rounded-full transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#FEA406]/50"
              aria-label={t("Menyu ya mtumiaji", "User menu")}
              aria-expanded={userMenuOpen}
            >
              {renderAvatar("w-8 h-8", "text-sm")}
            </button>

            {userMenuOpen && (
              <div
                ref={userMenuRef}
                data-keep-light
                style={{ background: "#042475", borderColor: "rgba(245,243,236,0.1)" }}
                className="absolute right-0 mt-2 w-64 border rounded-lg shadow-xl py-1 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ borderColor: "rgba(245,243,236,0.1)" }} className="px-4 py-3 border-b">
                  <p className="text-sm font-semibold truncate" style={{ color: "#FFFFFF" }}>
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "rgba(245,243,236,0.55)" }}>
                    {user?.email || ""}
                  </p>
                </div>

                {[
                  { to: "/wasifu",                 label: t("Wasifu", "Profile"),                Icon: UserIcon },
                  { to: "/alika-marafiki",         label: t("Alika Marafiki", "Invite Friends"), Icon: Users },
                ].map(({ to, label, Icon }) => (
                  <button
                    key={to}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate(to);
                    }}
                    style={{ color: "#F5F3EC" }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                  >
                    <Icon size={15} color="rgba(245,243,236,0.55)" />
                    {label}
                  </button>
                ))}

                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleShare}
                  style={{ color: "#F5F3EC" }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                >
                  <Share2 size={15} color="rgba(245,243,236,0.55)" />
                  {t("Shiriki SokoMkononi", "Share SokoMkononi")}
                </button>

                <div className="my-1 border-t" style={{ borderColor: "rgba(245,243,236,0.1)" }} />

                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#FF8A65] hover:bg-[#C1502E]/10 transition-colors text-left"
                >
                  <LogOut size={15} />
                  {t("Toka", "Logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ background: "#042475" }} className="md:hidden flex items-center justify-center gap-1 p-1 mx-3 mt-2 rounded-full">
        <button
          onClick={() => handleSideChange("seller")}
          style={{ background: side === "seller" ? COLORS.gold : "transparent", color: side === "seller" ? COLORS.night : "#FFFFFF" }}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          <Tag size={14} />
          {t("Dashibodi ya Muuzaji", "Seller Dashboard")}
        </button>
        <button
          onClick={() => handleSideChange("buyer")}
          style={{ background: side === "buyer" ? COLORS.green : "transparent", color: "#FFFFFF" }}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          <ShoppingBag size={14} />
          {t("Dashibodi ya Mnunuzi", "Buyer Dashboard")}
        </button>
      </div>

      {(() => {
        const now = new Date();
        const activeAnnouncements = announcements.filter((a) => {
          if (!a.sent) return false;
          if (a.scheduledFor && new Date(a.scheduledFor) > now) return false;
          return true;
        });
        if (activeAnnouncements.length === 0) return null;
        return (
          <div className="w-full flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm bg-[rgb(var(--c-page))] text-[rgb(var(--c-ink))] border-b border-[rgb(var(--c-hairline))]">
            <Megaphone size={14} color={COLORS.rust} className="shrink-0" />
            <span className="truncate">
              {getAnnouncementMessage(activeAnnouncements[tickerIndex % activeAnnouncements.length], lang)}
            </span>
          </div>
        );
      })()}

      <PromotedBannerStrip onOpenListing={goToListingDetail} />

      <div className="flex flex-1 relative">
        <aside
          className={`hidden md:flex ${
            sidebarCollapsed ? "w-16" : "w-56"
          } shrink-0 border-r border-[rgb(var(--c-hairline))] flex-col py-4 ${
            sidebarCollapsed ? "px-1.5" : "px-3"
          } gap-1 sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto overscroll-contain bg-[rgb(var(--c-page))] transition-[width] duration-200`}
        >
          {nav.map(({ key, label, icon: Icon }) => {
            const isActive = key === activeKey;
            const fullLabel = label[lang] || label.sw;
            return (
              <button
                key={key}
                onClick={() => handleNavClick(key)}
                title={sidebarCollapsed ? fullLabel : undefined}
                aria-label={fullLabel}
                className={`relative flex items-center ${
                  sidebarCollapsed ? "justify-center" : "gap-3"
                } px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isActive
                    ? "bg-[rgb(var(--c-ink))] text-[rgb(var(--c-page))]"
                    : "text-[rgb(var(--c-ink))] hover:bg-[rgb(var(--c-ink)/0.06)]"
                }`}
              >
                <Icon size={17} style={{ color: isActive ? accent : "currentColor" }} className="shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate">{fullLabel}</span>
                )}
                {!sidebarCollapsed && key === "listings" && listings.length > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-[rgb(var(--c-hairline))]"}`}>
                    {listings.length}
                  </span>
                )}
                {!sidebarCollapsed && key === "leads" && newLeadsCount > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-[#C1502E] text-white"}`}>
                    {newLeadsCount}
                  </span>
                )}
                {!sidebarCollapsed && key === "searches" && buyerSearchesCount > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-[rgb(var(--c-hairline))]"}`}>
                    {buyerSearchesCount}
                  </span>
                )}
                {sidebarCollapsed && key === "leads" && newLeadsCount > 0 && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#C1502E]" />
                )}
              </button>
            );
          })}
          <a
            href="/"
            title={sidebarCollapsed ? t("Rudi Nyumbani", "Back to Home") : undefined}
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left hover:bg-[rgb(var(--c-ink)/0.06)] mt-4 border-t border-[rgb(var(--c-hairline))] pt-4 text-[rgb(var(--c-text-2))]`}
          >
            <Home size={17} className="shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{t("Rudi Nyumbani", "Back to Home")}</span>}
          </a>
        </aside>

        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="w-72 max-w-[85%] h-full pt-16 pb-4 px-3 flex flex-col gap-1 shadow-xl overflow-y-auto overscroll-contain bg-[rgb(var(--c-page))]">
              <div className="flex justify-end mb-2">
                <button onClick={() => setSidebarOpen(false)} aria-label={t("Funga", "Close")} className="p-2 text-[rgb(var(--c-text-2))] hover:text-[rgb(var(--c-ink))]">
                  <X size={20} />
                </button>
              </div>
              {nav.map(({ key, label, icon: Icon }) => {
                const isActive = key === activeKey;
                return (
                  <button
                    key={key}
                    onClick={() => { handleNavClick(key); setSidebarOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left w-full ${
                      isActive
                        ? "bg-[rgb(var(--c-ink))] text-[rgb(var(--c-page))]"
                        : "text-[rgb(var(--c-ink))] hover:bg-[rgb(var(--c-ink)/0.06)]"
                    }`}
                  >
                    <Icon size={17} style={{ color: isActive ? accent : "currentColor" }} />
                    <span className="flex-1 truncate">{label[lang] || label.sw}</span>
                    {key === "leads" && newLeadsCount > 0 && (
                      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isActive ? "bg-white/20" : "bg-[#C1502E] text-white"}`}>
                        {newLeadsCount}
                      </span>
                    )}
                    {key === "searches" && buyerSearchesCount > 0 && (
                      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${isActive ? "bg-white/20" : "bg-[rgb(var(--c-hairline))]"}`}>
                        {buyerSearchesCount}
                      </span>
                    )}
                  </button>
                );
              })}
              <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left hover:bg-[rgb(var(--c-ink)/0.06)] mt-4 border-t border-[rgb(var(--c-hairline))] pt-4 text-[rgb(var(--c-text-2))]">
                <Home size={17} />
                {t("Rudi Nyumbani", "Back to Home")}
              </a>
            </div>
            <div onClick={() => setSidebarOpen(false)} className="flex-1 bg-black/50" />
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
import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../config/authStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useDashboardSide } from "../config/dashboardSideStore.js";
import {
  useNotifications,
  resolveNotificationSide,
} from "../config/notificationsStore.js";

const icons = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z" />
    </svg>
  ),
  saved: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </svg>
  ),
  deals: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  ),
  sell: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  search: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  myListings: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  listings: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
};

// ✅ Kurasa ambazo hazitakiwi kuwa na BottomNav (fomu, deal room, post)
const HIDDEN_ROUTES = [
  "/dashboard/post",
  "/dashboard/listings/new",
  "/dashboard/deals/", // Deal Rooms (mfano /dashboard/deals/123)
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const side = useDashboardSide();
  
  // ✅ Pata notifications kutoka store
  // useNotifications inarudisha OBJECT { notifications, unreadCount, ... }, si array
  const { notifications } = useNotifications("user", Boolean(user));

  // ✅ 1. FICHA BOTTOM NAV KWENYE KURASA ZA FOMU
  const shouldHide = useMemo(() => {
    const path = location.pathname;
    // Ficha ikiwa ni fomu ya kuweka tangazo au ukiwa ndani ya deal room mahususi
    if (path.includes("/post") || path.includes("/new")) return true;
    if (path.includes("/deals/") && path !== "/dashboard/deals" && path !== "/dashboard/buyer/deals") return true;
    return false;
  }, [location.pathname]);

  // ✅ 2. HESABU IDADI YA NOTIFICATIONS ZA DEALS
  const unreadDealCount = useMemo(() => {
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter((n) => {
      if (n.read) return false;
      // Hesabu za upande uliopo tu (buyer/seller), kama NotificationsPage
      const nSide = resolveNotificationSide(n);
      if (nSide !== "both" && nSide !== side) return false;
      const rawType = String(n.rawType || "").toUpperCase();
      const relType = String(n.meta?.related_object_type || "").toLowerCase();
      return n.type === "deal" || rawType.includes("DEAL") || relType.includes("deal");
    }).length;
  }, [notifications, side]);

  if (shouldHide) return null;

  const isActive = (path) => {
    if (!path) return false;
    if (path === "/login") return false;
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isBuyerSide = side === "buyer";

  const actionLink = isBuyerSide
    ? "/tafuta"
    : user
      ? "/dashboard/post"
      : "/register?intent=sell";
  const actionIcon = isBuyerSide ? icons.search : icons.sell;
  const actionLabel = isBuyerSide
    ? (lang === "sw" ? "Tafuta" : "Search")
    : t("nav_sell");

  const dealsTarget = isBuyerSide
    ? "/dashboard/buyer/deals"
    : "/dashboard/deals";
  const dealsLink = user ? dealsTarget : "/login";

  const secondTarget = isBuyerSide
    ? "/dashboard/buyer/saved"
    : "/dashboard/listings";
  const secondLink = user ? secondTarget : "/login";
  const secondIcon = isBuyerSide ? icons.saved : icons.myListings;
  const secondLabel = isBuyerSide
    ? t("nav_saved")
    : (lang === "sw" ? "Mali Zangu" : "My Listings");

  const listingsLink = "/mali-zote";

  return (
    <nav
      className="bottom-nav safe-bottom"
      aria-label={lang === "sw" ? "Menyu kuu" : "Main navigation"}
    >
      {/* Home — wote */}
      <Link
        to="/"
        className={`nav-item ${isActive("/") ? "active" : ""}`}
        aria-current={isActive("/") ? "page" : undefined}
      >
        {icons.home}
        <span>{t("nav_home")}</span>
      </Link>

      <Link
        to={secondLink}
        state={!user ? { from: secondTarget } : undefined}
        className={`nav-item ${isActive(secondTarget) ? "active" : ""}`}
        aria-current={isActive(secondTarget) ? "page" : undefined}
      >
        {secondIcon}
        <span>{secondLabel}</span>
      </Link>

      {/* Center action — Post (seller) au Search (buyer) */}
      <Link to={actionLink} className="nav-item sell-btn">
        {actionIcon}
        <span>{actionLabel}</span>
      </Link>

      {/* ✅ Deals — wote (na Badge ya idadi ya notifications) */}
      <Link
        to={dealsLink}
        state={!user ? { from: dealsTarget } : undefined}
        className={`nav-item ${isActive(dealsLink) ? "active" : ""}`}
        aria-current={isActive(dealsLink) ? "page" : undefined}
      >
        <span className="relative inline-flex items-center justify-center">
          {icons.deals}
          
          {/* Badge ya Notifications */}
          {unreadDealCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
              {unreadDealCount > 9 ? "9+" : unreadDealCount}
            </span>
          )}
        </span>
        <span>Deals</span>
      </Link>

      {/* Listings — wote */}
      <Link
        to={listingsLink}
        className={`nav-item ${isActive(listingsLink) ? "active" : ""}`}
        aria-current={isActive(listingsLink) ? "page" : undefined}
      >
        {icons.listings}
        <span>{lang === "sw" ? "Mali Zote" : "All Listings"}</span>
      </Link>
    </nav>
  );
}
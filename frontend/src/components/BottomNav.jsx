import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, PlusCircle, MessageSquare, LayoutGrid, Heart } from "lucide-react";
import { useAuth } from "../config/authStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useDashboardSide } from "../config/dashboardSideStore.js";

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

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const side = useDashboardSide();
  const isActive = (p) => (p === "/" ? location.pathname === "/" : location.pathname.startsWith(p));
  const isBuyer = side === "buyer";

  const isActive = (path) => {
    if (!path) return false;
    // Never treat /login as "active" for Deals/Saved tabs when logged out.
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

  // Deal Rooms ndiyo sehemu pekee ya mazungumzo (Messages page imeondolewa).
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
    <nav className="bottom-nav safe-bottom">
      {/* Home — wote */}
      <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
        {icons.home}
        <span>{t("nav_home")}</span>
      </Link>

      <Link
        to={secondLink}
        state={!user ? { from: secondTarget } : undefined}
        className={`nav-item ${isActive(secondTarget) ? "active" : ""}`}
      >
        {secondIcon}
        <span>{secondLabel}</span>
      </Link>

      {/* Center action — Post (seller) au Search (buyer) */}
      <Link to={actionLink} className="nav-item sell-btn">
        {actionIcon}
        <span>{actionLabel}</span>
      </Link>

      {/* Deals — wote (mazungumzo yote yako hapa) */}
      <Link
        to={dealsLink}
        state={!user ? { from: dealsTarget } : undefined}
        className={`nav-item ${isActive(dealsLink) ? "active" : ""}`}
      >
        <span className="relative">
          {icons.deals}
        </span>
        <span>Deals</span>
      </Link>

      {/* Listings — wote */}
      <Link to={listingsLink} className={`nav-item ${isActive(listingsLink) ? "active" : ""}`}>
        {icons.listings}
        <span>{lang === "sw" ? "Mali Zote" : "All Listings"}</span>
      </Link>
    </nav>
  );
}

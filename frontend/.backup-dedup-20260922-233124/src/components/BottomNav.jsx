import React from "react";
import { Link, useLocation } from "react-router-dom";
// ⬇️ MABADILIKO: useAuth kutoka authStore (sio AuthContext)
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
  messages: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
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

  const isActive = (path) => {
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

  const savedTarget = isBuyerSide
    ? "/dashboard/buyer/saved"
    : "/dashboard/saved";
  const messagesTarget = isBuyerSide
    ? "/dashboard/buyer/messages"
    : "/dashboard/messages";

  const savedLink = user ? savedTarget : "/login";
  const messagesLink = user ? messagesTarget : "/login";

  const listingsLink = "/mali-zote";

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
        {icons.home}
        <span>{t("nav_home")}</span>
      </Link>

      <Link
        to={savedLink}
        state={!user ? { from: savedTarget } : undefined}
        className={`nav-item ${isActive(savedLink) ? "active" : ""}`}
      >
        {icons.saved}
        <span>{t("nav_saved")}</span>
      </Link>

      <Link to={actionLink} className="nav-item sell-btn">
        {actionIcon}
        <span>{actionLabel}</span>
      </Link>

      <Link
        to={messagesLink}
        state={!user ? { from: messagesTarget } : undefined}
        className={`nav-item ${isActive(messagesLink) ? "active" : ""}`}
      >
        <span className="relative">
          {icons.messages}
        </span>
        <span>{t("nav_messages")}</span>
      </Link>

      <Link to={listingsLink} className={`nav-item ${isActive(listingsLink) ? "active" : ""}`}>
        {icons.listings}
        <span>{lang === "sw" ? "Mali Zote" : "All Listings"}</span>
      </Link>
    </nav>
  );
}

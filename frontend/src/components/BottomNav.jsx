import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

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
  messages: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  ),
};

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Kurasa zinazohitaji mtumiaji awe ame-login kwanza. Asipoingia, anapelekwa /login.
  const authLink = (path) => (user ? path : "/login");

  // Sell link - kama ameingia, anapelekwa seller dashboard; kama hajaingia, anapelekwa register
  const sellLink = user ? "/dashboard/seller" : "/register?intent=sell";

  // Profile link - inaelekeza /wasifu (sahihi) badala ya /profile
  const profileLink = user ? "/wasifu" : "/login";

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
        {icons.home}
        <span>{t("nav_home")}</span>
      </Link>

      <Link to={authLink("/saved")} className={`nav-item ${isActive("/saved") ? "active" : ""}`}>
        {icons.saved}
        <span>{t("nav_saved")}</span>
      </Link>

      <Link to={sellLink} className="nav-item sell-btn">
        {icons.sell}
        <span>{t("nav_sell")}</span>
      </Link>

      <Link to={authLink("/messages")} className={`nav-item ${isActive("/messages") ? "active" : ""}`}>
        <span className="relative">
          {icons.messages}
        </span>
        <span>{t("nav_messages")}</span>
      </Link>

      <Link to={profileLink} className={`nav-item ${isActive("/wasifu") || isActive("/profile") ? "active" : ""}`}>
        {icons.profile}
        <span>{t("nav_profile")}</span>
      </Link>
    </nav>
  );
}

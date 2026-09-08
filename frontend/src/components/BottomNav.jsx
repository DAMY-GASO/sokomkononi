import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function BottomNav() {
  const { t } = useLanguage();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${isActive("/") ? "active" : ""}`}>
        <span>🏠</span>
        <span>{t("nav_home")}</span>
      </Link>
      <Link to="/saved" className={`nav-item ${isActive("/saved") ? "active" : ""}`}>
        <span>⭐</span>
        <span>{t("nav_saved")}</span>
      </Link>
      <Link to="/register?intent=sell" className="nav-item sell-btn">
        <span>➕</span>
        <span>{t("nav_sell")}</span>
      </Link>
      <Link to="/messages" className={`nav-item ${isActive("/messages") ? "active" : ""}`}>
        <span>💬</span>
        <span>{t("nav_messages")}</span>
        <span className="badge">2</span>
      </Link>
      <Link to="/profile" className={`nav-item ${isActive("/profile") ? "active" : ""}`}>
        <span>👤</span>
        <span>{t("nav_profile")}</span>
      </Link>
    </nav>
  );
}

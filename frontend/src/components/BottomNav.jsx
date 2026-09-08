import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function BottomNav() {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: "/", icon: "🏠", label: "Home" },
    { path: "/saved", icon: "⭐", label: "Saved" },
    { path: "/sell", icon: "➕", label: "Sell", isSell: true },
    { path: "/messages", icon: "💬", label: "Messages", badge: "2" },
    { path: "/profile", icon: "👤", label: "Profile" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const active = isActive(item.path);
        
        if (item.isSell) {
          return (
            <Link
              key={item.path}
              to="/register?intent=sell"
              className={`nav-item sell-btn ${active ? "active" : ""}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${active ? "active" : ""}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && <span className="badge">{item.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

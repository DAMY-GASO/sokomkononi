// ============================================================
// AdminDashboard.jsx — SHELL PEKEE + Routes + Permissions
// ============================================================
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  useNotifications,
  getLocalizedField,
} from "../../config/notificationsStore.js";
import { Menu, X, Bell, LogOut, User as UserIcon, Settings, Lock } from "lucide-react";

import { COLORS, FONTS, NAV, ADMIN_NOTIFICATION_ICONS, timeAgo } from "./admin/shared/constants.js";

// Core sections
import OverviewSection from "./admin/sections/OverviewSection.jsx";
import UserManagementSection from "./admin/sections/UserManagementSection.jsx";
import ModerationSection from "./admin/sections/ModerationSection.jsx";
import VerificationSection from "./admin/sections/VerificationSection.jsx";
import DealsSection from "./admin/sections/DealsSection.jsx";
import RevenueSection from "./admin/sections/RevenueSection.jsx";
import PromotionsSection from "./admin/sections/PromotionsSection.jsx";
import ReportsSection from "./admin/sections/ReportsSection.jsx";

// Support & Content
import SupportSection from "./admin/sections/SupportSection.jsx";
import ContentSection from "./admin/sections/ContentSection.jsx";

// System
import AuditLogsSection from "./admin/sections/AuditLogsSection.jsx";
import SystemSettingsSection from "./admin/sections/SystemSettingsSection.jsx";
import RBACSection from "./admin/sections/RBACSection.jsx";
import AdminProfile from "./admin/sections/AdminProfile.jsx";

// Badges
import { usePendingVerificationsCount } from "../../config/verificationsStore.js";
import { useOpenTicketsCount } from "../../config/ticketsStore.js";

// Permissions
import { useRoles, getRole } from "../../config/rolesStore.js";

// ============================================================
// URL ↔ STATE MAPPING
// ============================================================
const URL_TO_STATE = {
  "/admin": "overview",
  "/admin/overview": "overview",
  "/admin/users": "users",
  "/admin/moderation": "moderation",
  "/admin/verification": "verification",
  "/admin/deals": "deals",
  "/admin/revenue": "revenue",
  "/admin/promotions": "promotions",
  "/admin/reports": "reports",
  "/admin/support": "support",
  "/admin/content": "content",
  "/admin/audit": "audit",
  "/admin/system": "system",
  "/admin/staff": "staff",
  "/admin/profile": "profile",
};

const STATE_TO_URL = {
  overview: "/admin/overview",
  users: "/admin/users",
  moderation: "/admin/moderation",
  verification: "/admin/verification",
  deals: "/admin/deals",
  revenue: "/admin/revenue",
  promotions: "/admin/promotions",
  reports: "/admin/reports",
  support: "/admin/support",
  content: "/admin/content",
  audit: "/admin/audit",
  system: "/admin/system",
  staff: "/admin/staff",
  profile: "/admin/profile",
};

// ============================================================
// AVATAR
// ============================================================
function Avatar({ user, size = "md" }) {
  const sizeClass = size === "lg" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  const initial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "A";

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user?.name || "Admin"}
        className={`${sizeClass} rounded-full object-cover border border-white/20`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold`}
    >
      {initial}
    </div>
  );
}

// ============================================================
// LANGUAGE SWITCHER
// ============================================================
function LanguageSwitcher({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const languages = [
    { code: "en", native: "English" },
    { code: "sw", native: "Kiswahili" },
  ];
  const current = languages.find((l) => l.code === lang) || languages[1];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-white/60 hover:text-white text-sm font-medium border border-white/15 rounded-md px-2 sm:px-3 py-1.5 transition-colors flex items-center gap-1"
        aria-label={lang === "sw" ? "Badilisha lugha" : "Change language"}
      >
        <span className="hidden sm:inline">{current?.native || "Kiswahili"}</span>
        <span className="sm:hidden">{current?.code?.toUpperCase() || "SW"}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-[#182541] border border-white/10 rounded-lg shadow-xl py-2 z-50">
            <div className="px-4 py-2 border-b border-white/10">
              <p className="text-white/50 text-xs font-semibold">
                {lang === "sw"
                  ? "Je, unapendelea lugha gani?"
                  : "Which language do you prefer?"}
              </p>
            </div>
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${
                  lang === l.code ? "bg-white/5" : ""
                }`}
              >
                <span className="text-white text-sm font-medium">{l.native}</span>
                {lang === l.code && (
                  <svg className="w-4 h-4 text-[#E8A33D]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
export default function AdminDashboard() {
  const { user, isAdmin, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { notifications, unreadCount, markRead } = useNotifications("admin");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Badges
  const pendingVerificationsCount = usePendingVerificationsCount();
  const openTicketsCount = useOpenTicketsCount();

  // Permissions
  const roles = useRoles();

  // ============================================================
  // ACTIVE SECTION — kutoka URL
  // ============================================================
  const activeSection = useMemo(() => {
    const path = location.pathname;
    return URL_TO_STATE[path] || "overview";
  }, [location.pathname]);

  // ============================================================
  // STAFF PERMISSIONS — nani anaweza kuona nini
  // ============================================================
  const staffRole = useMemo(() => {
    // Super Admin (default) — anaona kila kitu
    if (isAdmin && !user?.roleKey) {
      return getRole("super_admin");
    }
    // Staff aliye na roleKey — anaona kulingana na permissions zake
    if (user?.roleKey) {
      return getRole(user.roleKey);
    }
    // Fallback: Super Admin
    return getRole("super_admin");
  }, [isAdmin, user?.roleKey]);

  const canAccess = (sectionKey) => {
    // Profile na System — kila mtu anaweza kufikia yake
    if (sectionKey === "profile" || sectionKey === "system") return true;
    // Overview — kila mtu
    if (sectionKey === "overview") return true;
    // Angalia permissions
    if (!staffRole) return false;
    return staffRole.permissions?.includes(sectionKey);
  };

  // Filter NAV kulingana na permissions
  const visibleNav = useMemo(() => {
    return NAV.filter((item) => canAccess(item.key));
  }, [staffRole]);

  const openNotification = (n) => {
    markRead(n.id);
    const target = n.target || "overview";
    navigate(STATE_TO_URL[target] || STATE_TO_URL.overview);
    setNotifOpen(false);
  };

  useEffect(() => {
    if (!user) {
      navigate("/admin/login");
      return;
    }
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    setLoading(false);
  }, [user, isAdmin, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  // ============================================================
  // NAVIGATION — setActiveSection inatumika kama navigate
  // ============================================================
  const handleNavClick = (key) => {
    const url = STATE_TO_URL[key];
    if (url) {
      navigate(url);
    }
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E8A33D] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4">
            {lang === "sw"
              ? "Inaangalia mamlaka yako..."
              : "Checking your authorization..."}
          </p>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    // Kama hana ruhusa — onyesha "Access Denied"
    if (!canAccess(activeSection)) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md px-4">
            <div
              style={{ background: `${COLORS.rust}15` }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Lock size={28} color={COLORS.rust} />
            </div>
            <h2
              style={{ fontFamily: FONTS.display, color: COLORS.night }}
              className="text-xl font-semibold mb-2"
            >
              {lang === "sw" ? "Huna Ruhusa" : "Access Denied"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {lang === "sw"
                ? "Huna ruhusa ya kufikia sehemu hii. Wasiliana na Super Admin."
                : "You don't have permission to access this section. Contact Super Admin."}
            </p>
            <button
              onClick={() => navigate(STATE_TO_URL.overview)}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="text-xs font-semibold px-4 py-2.5 rounded-lg"
            >
              {lang === "sw" ? "Rudi kwenye Muhtasari" : "Back to Overview"}
            </button>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case "overview":
        return <OverviewSection onNavigate={handleNavClick} />;
      case "users":
        return <UserManagementSection />;
      case "moderation":
        return <ModerationSection />;
      case "verification":
        return <VerificationSection />;
      case "deals":
        return <DealsSection />;
      case "revenue":
        return <RevenueSection />;
      case "promotions":
        return <PromotionsSection />;
      case "reports":
        return <ReportsSection />;
      case "support":
        return <SupportSection />;
      case "content":
        return <ContentSection />;
      case "audit":
        return <AuditLogsSection />;
      case "system":
        return <SystemSettingsSection />;
      case "staff":
        return <RBACSection />;
      case "profile":
        return <AdminProfile />;
      default:
        return <OverviewSection onNavigate={handleNavClick} />;
    }
  };

  // Badge helper
  const getBadge = (key) => {
    if (key === "verification" && pendingVerificationsCount > 0) {
      return pendingVerificationsCount;
    }
    if (key === "support" && openTicketsCount > 0) {
      return openTicketsCount;
    }
    return null;
  };

  return (
    <div
      style={{ fontFamily: FONTS.body, background: COLORS.sand }}
      className="min-h-screen"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <header
        style={{ background: COLORS.night }}
        className="sticky top-0 z-50 w-full flex items-center justify-between px-4 sm:px-6 py-3"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-white/70 hover:text-white md:hidden"
            aria-label={lang === "sw" ? "Fungua menyu" : "Open menu"}
          >
            <Menu size={20} />
          </button>
          <span
            style={{ fontFamily: FONTS.display, color: COLORS.sand }}
            className="text-lg sm:text-xl font-semibold tracking-tight"
          >
            SokoMkononi
          </span>
          <span className="text-[10px] font-semibold bg-[#E8A33D]/20 text-[#E8A33D] px-2.5 py-0.5 rounded-full">
            ADMIN
          </span>
          {staffRole && staffRole.key !== "super_admin" && (
            <span className="hidden sm:inline text-[10px] font-semibold bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
              {staffRole.label?.[lang] || staffRole.label?.sw}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher lang={lang} setLang={setLang} />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative text-white/60 hover:text-white transition-colors"
              aria-label={lang === "sw" ? "Taarifa" : "Notifications"}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{ background: COLORS.rust }}
                  className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                style={{ borderColor: COLORS.sandLine }}
                className="absolute right-0 mt-3 w-80 max-w-[85vw] bg-white rounded-xl border shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">
                    {lang === "sw" ? "Taarifa za Admin" : "Admin Notifications"}
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{ color: COLORS.rust }}
                      className="text-xs font-semibold"
                    >
                      {unreadCount} {lang === "sw" ? "mpya" : "new"}
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifications.map((n) => {
                    const Icon = ADMIN_NOTIFICATION_ICONS[n.type] || Bell;
                    return (
                      <button
                        key={n.id}
                        onClick={() => openNotification(n)}
                        style={{
                          background: n.read ? "white" : `${COLORS.gold}0D`,
                        }}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div
                          style={{ background: `${COLORS.night}0D` }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        >
                          <Icon size={14} color={COLORS.night} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 leading-snug">
                            {getLocalizedField(n.title, lang)}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {timeAgo(n.at, lang)}
                          </p>
                        </div>
                        {!n.read && (
                          <span
                            style={{ background: COLORS.gold }}
                            className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                          />
                        )}
                      </button>
                    );
                  })}
                  {notifications.length === 0 && (
                    <p className="text-xs text-gray-400 px-4 py-6 text-center">
                      {lang === "sw" ? "Hakuna taarifa" : "No notifications"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar + Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#E8A33D]/40"
              aria-label={lang === "sw" ? "Menyu ya wasifu" : "Profile menu"}
            >
              <Avatar user={user} />
            </button>

            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    <Avatar user={user} size="lg" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user?.name || "Admin"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigate(STATE_TO_URL.profile);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <UserIcon size={16} className="text-gray-400" />
                    {lang === "sw" ? "Wasifu" : "Profile"}
                  </button>

                  <button
                    onClick={() => {
                      navigate(STATE_TO_URL.system);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Settings size={16} className="text-gray-400" />
                    {lang === "sw" ? "Mipangilio" : "Settings"}
                  </button>

                  <div className="border-t border-gray-100" />

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#C1502E] hover:bg-[#C1502E]/5 transition-colors text-left"
                  >
                    <LogOut size={16} />
                    {lang === "sw" ? "Toka" : "Logout"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* SIDEBAR — DESKTOP */}
        <aside
          style={{ borderColor: COLORS.sandLine }}
          className="hidden md:flex w-64 shrink-0 border-r flex-col py-4 px-3 gap-1 min-h-[calc(100vh-56px)]"
        >
          {visibleNav.map(({ key, label, icon: Icon }) => {
            const isActive = key === activeSection;
            const badge = getBadge(key);
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
                <Icon size={17} color={isActive ? COLORS.gold : COLORS.night} />
                <span className="flex-1 truncate">{label[lang] || label.sw}</span>
                {badge && (
                  <span
                    style={{
                      background: isActive ? "rgba(245,243,236,0.18)" : COLORS.rust,
                      color: isActive ? COLORS.sand : "white",
                    }}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* SIDEBAR — MOBILE */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div
              style={{ background: COLORS.sand }}
              className="w-72 max-w-[85%] h-full pt-20 pb-4 px-3 flex flex-col gap-1 shadow-xl overflow-y-auto"
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label={lang === "sw" ? "Funga" : "Close"}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} color={COLORS.night} />
                </button>
              </div>

              {visibleNav.map(({ key, label, icon: Icon }) => {
                const isActive = key === activeSection;
                const badge = getBadge(key);
                return (
                  <button
                    key={key}
                    onClick={() => handleNavClick(key)}
                    style={{
                      background: isActive ? COLORS.night : "transparent",
                      color: isActive ? COLORS.sand : COLORS.night,
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left"
                  >
                    <Icon
                      size={17}
                      color={isActive ? COLORS.gold : COLORS.night}
                    />
                    <span className="flex-1 truncate">{label[lang] || label.sw}</span>
                    {badge && (
                      <span
                        style={{
                          background: isActive ? "rgba(245,243,236,0.18)" : COLORS.rust,
                          color: isActive ? COLORS.sand : "white",
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div
              onClick={() => setSidebarOpen(false)}
              className="flex-1 bg-black/30"
            />
          </div>
        )}

        <main className="flex-1 max-w-7xl px-4 sm:px-6 py-6">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

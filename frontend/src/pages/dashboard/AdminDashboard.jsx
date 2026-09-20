// ============================================================
// AdminDashboard.jsx — SHELL PEKEE + Routes + Permissions
// + PageLoader (mara moja tu)
// + Secret admin path
// ============================================================
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, logoutAsync } from "../../config/authStore.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  useNotifications,
  getLocalizedField,
} from "../../config/notificationsStore.js";
import {
  Menu,
  X,
  Bell,
  LogOut,
  User as UserIcon,
  Settings,
  Lock,
} from "lucide-react";

// ⬇️ Secret admin path
import { ADMIN_PATH, ADMIN_LOGIN_PATH } from "../../config/adminPath.js";

import {
  COLORS,
  NAV,
  ADMIN_NOTIFICATION_ICONS,
  timeAgo,
} from "./admin/shared/constants.js";

// ============================================================
// PAGE LOADER
// ============================================================
import PageLoader from "../../components/PageLoader.jsx";

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

// Trash
import TrashSection from "./admin/sections/TrashSection.jsx";

// Bundles
import AdminBundles from "../AdminBundles.jsx";

// Badges
import { usePendingVerificationsCount } from "../../config/verificationsStore.js";
import { useOpenTicketsCount } from "../../config/ticketsStore.js";

// Permissions
import { useRoles, getRole } from "../../config/rolesStore.js";

// ============================================================
// URL ↔ STATE MAPPING (dynamic na ADMIN_PATH)
// ============================================================
const URL_TO_STATE = {
  [ADMIN_PATH]: "overview",
  [`${ADMIN_PATH}/overview`]: "overview",
  [`${ADMIN_PATH}/users`]: "users",
  [`${ADMIN_PATH}/moderation`]: "moderation",
  [`${ADMIN_PATH}/verification`]: "verification",
  [`${ADMIN_PATH}/deals`]: "deals",
  [`${ADMIN_PATH}/revenue`]: "revenue",
  [`${ADMIN_PATH}/promotions`]: "promotions",
  [`${ADMIN_PATH}/reports`]: "reports",
  [`${ADMIN_PATH}/support`]: "support",
  [`${ADMIN_PATH}/content`]: "content",
  [`${ADMIN_PATH}/audit`]: "audit",
  [`${ADMIN_PATH}/system`]: "system",
  [`${ADMIN_PATH}/staff`]: "staff",
  [`${ADMIN_PATH}/profile`]: "profile",
  [`${ADMIN_PATH}/bundles`]: "bundles",
  [`${ADMIN_PATH}/trash`]: "trash",
};

const STATE_TO_URL = {
  overview: `${ADMIN_PATH}/overview`,
  users: `${ADMIN_PATH}/users`,
  moderation: `${ADMIN_PATH}/moderation`,
  verification: `${ADMIN_PATH}/verification`,
  deals: `${ADMIN_PATH}/deals`,
  revenue: `${ADMIN_PATH}/revenue`,
  promotions: `${ADMIN_PATH}/promotions`,
  reports: `${ADMIN_PATH}/reports`,
  support: `${ADMIN_PATH}/support`,
  content: `${ADMIN_PATH}/content`,
  audit: `${ADMIN_PATH}/audit`,
  system: `${ADMIN_PATH}/system`,
  staff: `${ADMIN_PATH}/staff`,
  profile: `${ADMIN_PATH}/profile`,
  bundles: `${ADMIN_PATH}/bundles`,
  trash: `${ADMIN_PATH}/trash`,
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
        <span className="hidden sm:inline">
          {current?.native || "Kiswahili"}
        </span>
        <span className="sm:hidden">
          {current?.code?.toUpperCase() || "SW"}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
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
                <span className="text-white text-sm font-medium">
                  {l.native}
                </span>
                {lang === l.code && (
                  <svg
                    className="w-4 h-4 text-[#E8A33D]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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
  const { user, isAdmin } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { notifications, unreadCount, markRead } = useNotifications("admin");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const pendingVerificationsCount = usePendingVerificationsCount();
  const openTicketsCount = useOpenTicketsCount();
  const roles = useRoles();

  // ============================================================
  // ACTIVE SECTION — kutoka URL
  // ============================================================
  const activeSection = useMemo(() => {
    const path = location.pathname;
    return URL_TO_STATE[path] || "overview";
  }, [location.pathname]);

  // ============================================================
  // STAFF PERMISSIONS
  // ============================================================
  const staffRole = useMemo(() => {
    if (isAdmin && !user?.roleKey) return getRole("super_admin");
    if (user?.roleKey) return getRole(user.roleKey);
    return getRole("super_admin");
  }, [isAdmin, user?.roleKey]);

  const canAccess = (sectionKey) => {
    // ✅ Super Admin anaona kila kitu — bila kuangalia permissions
    if (staffRole?.key === "super_admin") return true;

    if (sectionKey === "profile" || sectionKey === "system") return true;
    if (sectionKey === "overview") return true;
    if (!staffRole) return false;
    return staffRole.permissions?.includes(sectionKey);
  };

  const visibleNav = useMemo(() => {
    return NAV.filter((item) => canAccess(item.key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffRole]);

  const openNotification = (n) => {
    markRead(n.id);
    const target = n.target || "overview";
    navigate(STATE_TO_URL[target] || STATE_TO_URL.overview);
    setNotifOpen(false);
  };

  // ============================================================
  // AUTH CHECK + LOADER — tumia ADMIN_LOGIN_PATH
  // ============================================================
  useEffect(() => {
    if (!user) {
      navigate(ADMIN_LOGIN_PATH);
      return;
    }
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    const id = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(id);
  }, [user, isAdmin, navigate]);

  const handleLogout = async () => {
    await logoutAsync();
    navigate(ADMIN_LOGIN_PATH);
  };

  const handleNavClick = (key) => {
    const url = STATE_TO_URL[key];
    if (url) {
      navigate(url);
    }
    setSidebarOpen(false);
  };

  if (loading) {
    return <PageLoader lang={lang} />;
  }

  const renderSection = () => {
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
              style={{ color: "var(--text-primary)" }}
              className="text-xl font-semibold mb-2"
            >
              {lang === "sw" ? "Huna Ruhusa" : "Access Denied"}
            </h2>
            <p className="text-sm text-secondary mb-4">
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
      case "trash":
        return <TrashSection />;
      case "bundles":
        return <AdminBundles />;
      case "profile":
        return <AdminProfile />;
      default:
        return <OverviewSection onNavigate={handleNavClick} />;
    }
  };

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
      style={{ background: COLORS.sand }}
      className="min-h-screen w-full overflow-x-hidden"
    >
      <header
        style={{ background: COLORS.night }}
        className="sticky top-0 z-50 w-full flex items-center justify-between px-4 sm:px-6 py-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-white/70 hover:text-white md:hidden shrink-0"
            aria-label={lang === "sw" ? "Fungua menyu" : "Open menu"}
          >
            <Menu size={20} />
          </button>
          <span
            style={{ color: COLORS.sand }}
            className="text-lg sm:text-xl font-semibold tracking-tight truncate"
          >
            SokoMkononi
          </span>
          <span className="text-[10px] font-semibold bg-[#E8A33D]/20 text-[#E8A33D] px-2.5 py-0.5 rounded-full shrink-0">
            ADMIN
          </span>
          {staffRole && staffRole.key !== "super_admin" && (
            <span className="hidden sm:inline text-[10px] font-semibold bg-white/10 text-white/70 px-2 py-0.5 rounded-full truncate">
              {staffRole.label?.[lang] || staffRole.label?.sw}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
                  <span className="text-sm font-semibold text-primary">
                    {lang === "sw"
                      ? "Taarifa za Admin"
                      : "Admin Notifications"}
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
                          <p className="text-xs text-primary leading-snug">
                            {getLocalizedField(n.title, lang)}
                          </p>
                          <p className="text-[11px] text-muted mt-1">
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
                    <p className="text-xs text-muted px-4 py-6 text-center">
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
                <div className="absolute right-0 mt-2 w-64 max-w-[85vw] bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    <Avatar user={user} size="lg" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">
                        {user?.name || "Admin"}
                      </p>
                      <p className="text-xs text-secondary truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigate(STATE_TO_URL.profile);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary hover:bg-gray-50 transition-colors text-left"
                  >
                    <UserIcon size={16} className="text-muted" />
                    {lang === "sw" ? "Wasifu" : "Profile"}
                  </button>

                  <button
                    onClick={() => {
                      navigate(STATE_TO_URL.system);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary hover:bg-gray-50 transition-colors text-left"
                  >
                    <Settings size={16} className="text-muted" />
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

      <div className="flex w-full">
        {/* SIDEBAR — DESKTOP */}
        <aside
          style={{ borderColor: COLORS.sandLine }}
          className="hidden md:flex w-64 shrink-0 border-r flex-col py-4 px-3 gap-1 min-h-[calc(100vh-56px)] overflow-y-auto"
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
                  color: isActive ? COLORS.sand : "var(--text-primary)",
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full min-w-0"
              >
                <Icon
                  size={17}
                  color={isActive ? COLORS.gold : COLORS.night}
                  className="shrink-0"
                />
                <span className="flex-1 truncate">
                  {label[lang] || label.sw}
                </span>
                {badge && (
                  <span
                    style={{
                      background: isActive
                        ? "rgba(245,243,236,0.18)"
                        : COLORS.rust,
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
                  className="p-2 text-muted hover:text-secondary"
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
                      color: isActive ? COLORS.sand : "var(--text-primary)",
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left w-full min-w-0"
                  >
                    <Icon
                      size={17}
                      color={isActive ? COLORS.gold : COLORS.night}
                      className="shrink-0"
                    />
                    <span className="flex-1 truncate">
                      {label[lang] || label.sw}
                    </span>
                    {badge && (
                      <span
                        style={{
                          background: isActive
                            ? "rgba(245,243,236,0.18)"
                            : COLORS.rust,
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

        {/* MAIN */}
        <main className="flex-1 min-w-0 max-w-7xl px-4 sm:px-6 py-6 overflow-x-hidden">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

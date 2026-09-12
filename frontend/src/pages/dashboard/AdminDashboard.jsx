// ============================================================
// AdminDashboard.jsx — SHELL PEKEE
// ============================================================
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useNotifications } from "../../config/notificationsStore.js";
import { Menu, X, Bell, LogOut, User as UserIcon, Settings } from "lucide-react";

import { COLORS, FONTS, NAV, ADMIN_NOTIFICATION_ICONS, timeAgo } from "./admin/shared/constants.js";
import OverviewSection from "./admin/sections/OverviewSection.jsx";
import UserManagementSection from "./admin/sections/UserManagementSection.jsx";
import ModerationSection from "./admin/sections/ModerationSection.jsx";
import DealsSection from "./admin/sections/DealsSection.jsx";
import RevenueSection from "./admin/sections/RevenueSection.jsx";
import SystemSettingsSection from "./admin/sections/SystemSettingsSection.jsx";
import AdminProfile from "./admin/sections/AdminProfile.jsx";

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
function LanguageSwitcher({ lang, setLang, variant = "header" }) {
  const [open, setOpen] = useState(false);
  const languages = [
    { code: "en", native: "English" },
    { code: "sw", native: "Kiswahili" },
  ];
  const current = languages.find((l) => l.code === lang) || languages[1];

  const isSidebar = variant === "sidebar";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={
          isSidebar
            ? "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left"
            : "text-white/60 hover:text-white text-sm font-medium border border-white/15 rounded-md px-2 sm:px-3 py-1.5 transition-colors flex items-center gap-1"
        }
        style={
          isSidebar
            ? { background: "transparent", color: COLORS.night }
            : undefined
        }
        aria-label={lang === "sw" ? "Badilisha lugha" : "Change language"}
      >
        {isSidebar ? (
          <>
            <span className="flex items-center gap-2">
              🌐
              <span>{lang === "sw" ? "Lugha" : "Language"}</span>
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {current?.code?.toUpperCase()}
            </span>
          </>
        ) : (
          <>
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
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={
              isSidebar
                ? "mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50"
                : "absolute right-0 mt-2 w-56 sm:w-64 bg-[#182541] border border-white/10 rounded-lg shadow-xl py-2 z-50"
            }
          >
            {!isSidebar && (
              <div className="px-4 py-2 border-b border-white/10">
                <p className="text-white/50 text-xs font-semibold">
                  {lang === "sw"
                    ? "Je, unapendelea lugha gani?"
                    : "Which language do you prefer?"}
                </p>
              </div>
            )}
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={
                  isSidebar
                    ? `w-full px-3 py-2 flex items-center justify-between text-sm hover:bg-gray-50 ${
                        lang === l.code ? "bg-gray-50" : ""
                      }`
                    : `w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${
                        lang === l.code ? "bg-white/5" : ""
                      }`
                }
              >
                <span
                  className={
                    isSidebar
                      ? "text-sm font-medium text-gray-700"
                      : "text-white text-sm font-medium"
                  }
                >
                  {l.native}
                </span>
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
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { notifications, unreadCount, markRead } = useNotifications("admin");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const openNotification = (n) => {
    markRead(n.id);
    setActiveSection(n.target || "overview");
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
    switch (activeSection) {
      case "overview":
        return <OverviewSection onNavigate={setActiveSection} />;
      case "users":
        return <UserManagementSection />;
      case "moderation":
        return <ModerationSection />;
      case "deals":
        return <DealsSection />;
      case "revenue":
        return <RevenueSection />;
      case "system":
        return <SystemSettingsSection />;
      case "profile":
        return <AdminProfile />;
      default:
        return <OverviewSection onNavigate={setActiveSection} />;
    }
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
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher (header) */}
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
                          <p className="text-xs text-gray-700 leading-snug">{n.title}</p>
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

                  {/* Profile — sasa ni section */}
                  <button
                    onClick={() => {
                      setActiveSection("profile");
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <UserIcon size={16} className="text-gray-400" />
                    {lang === "sw" ? "Wasifu" : "Profile"}
                  </button>

                  {/* Settings — inaelekea section ya system */}
                  <button
                    onClick={() => {
                      setActiveSection("system");
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
          {NAV.map(({ key, label, icon: Icon }) => {
            const isActive = key === activeSection;
            return (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                style={{
                  background: isActive ? COLORS.night : "transparent",
                  color: isActive ? COLORS.sand : COLORS.night,
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
              >
                <Icon size={17} color={isActive ? COLORS.gold : COLORS.night} />
                {label[lang] || label.sw}
              </button>
            );
          })}

          <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.sandLine }}>
            <LanguageSwitcher lang={lang} setLang={setLang} variant="sidebar" />
          </div>
        </aside>

        {/* SIDEBAR — MOBILE */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div
              style={{ background: COLORS.sand }}
              className="w-64 h-full py-4 px-3 flex flex-col gap-1 shadow-xl overflow-y-auto"
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label={lang === "sw" ? "Funga" : "Close"}
                >
                  <X size={20} color={COLORS.night} />
                </button>
              </div>
              {NAV.map(({ key, label, icon: Icon }) => {
                const isActive = key === activeSection;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveSection(key);
                      setSidebarOpen(false);
                    }}
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
                    {label[lang] || label.sw}
                  </button>
                );
              })}

              <div
                className="mt-4 pt-4 border-t"
                style={{ borderColor: COLORS.sandLine }}
              >
                <LanguageSwitcher lang={lang} setLang={setLang} variant="sidebar" />
              </div>
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

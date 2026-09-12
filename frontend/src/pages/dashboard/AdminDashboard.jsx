
// ============================================================
// AdminDashboard.jsx — SHELL PEKEE
// Sections zote 6 zinatoka kwenye faili zao:
//   - ./admin/sections/OverviewSection.jsx
//   - ./admin/sections/UserManagementSection.jsx
//   - ./admin/sections/ModerationSection.jsx
//   - ./admin/sections/DealsSection.jsx
//   - ./admin/sections/RevenueSection.jsx
//   - ./admin/sections/SystemSettingsSection.jsx
// Bilingual — inasoma `lang` kutoka useLanguage().
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useNotifications } from "../../config/notificationsStore.js";
import { Menu, X, Bell, LogOut } from "lucide-react";

import { COLORS, FONTS, NAV, ADMIN_NOTIFICATION_ICONS, timeAgo } from "./admin/shared/constants.js";
import OverviewSection from "./admin/sections/OverviewSection.jsx";
import UserManagementSection from "./admin/sections/UserManagementSection.jsx";
import ModerationSection from "./admin/sections/ModerationSection.jsx";
import DealsSection from "./admin/sections/DealsSection.jsx";
import RevenueSection from "./admin/sections/RevenueSection.jsx";
import SystemSettingsSection from "./admin/sections/SystemSettingsSection.jsx";

export default function AdminDashboard() {
  const { user, isAdmin, logout } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { notifications, unreadCount, markRead } = useNotifications("admin");
  const [notifOpen, setNotifOpen] = useState(false);

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
                            {n.title}
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

          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">
              {lang === "sw" ? "Toka" : "Logout"}
            </span>
          </button>
          <div className="w-8 h-8 rounded-full bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">
            {user?.name?.charAt(0) || "A"}
          </div>
        </div>
      </header>

      <div className="flex">
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
        </aside>

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

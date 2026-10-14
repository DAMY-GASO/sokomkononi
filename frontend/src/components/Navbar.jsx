// ============================================================
// Navbar.jsx — clean rewrite (fixed)
//
// Dropdowns use a SINGLE state variable `openMenu` that holds the
// name of the currently-open dropdown, or null. Only one can ever
// be open. Outside-click, route change, and Escape all close it.
//
// FIXES:
//  - whitespace-nowrap on all nav links (Kiswahili haivunji UI)
//  - flex-shrink-0 on right side, min-w-0 on left side
//  - Reduced nav gap (gap-4 lg:gap-6)
//  - Removed broken Ads dropdown (New/Deal/Verified/Urgent) —
//    replaced with simple /tafuta link
//  - Shortened "Ingia/Jisajili" → "Ingia"
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";

import { useLanguage } from "../context/LanguageContext.jsx";
import {
  usePopularCategories,
  getCategoryIcon,
} from "../config/categoriesStore.js";
import { useAuth, logoutAsync } from "../config/authStore.js";
import { useNotifications } from "../config/notificationsStore.js";
import { useDashboardSide } from "../config/dashboardSideStore.js";
import { useAttribution } from "../context/AttributionContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import AnnouncementBar from "./AnnouncementBar.jsx";

// ─────────────────────────────────────────────────────────────
function NotificationBell() {
  const { user, isLoading } = useAuth();
  const { unreadCount } = useNotifications("user", Boolean(user) && !isLoading);
  const side = useDashboardSide();
  if (!user) return null;
  const target =
    side === "buyer"
      ? "/dashboard/buyer/notifications"
      : "/dashboard/notifications";
  return (
    <Link
      to={target}
      className="relative text-white/60 hover:text-white p-1.5 transition-colors flex-shrink-0"
      aria-label="Notifications"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
          style={{ background: "#C1502E" }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
export default function Navbar({
  lang: langProp,
  setLang: setLangProp,
  categories = [],
  trustLinks = [],
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { registerTap: registerLogoTap } = useAttribution();

  const { lang: langCtx, setLang: setLangCtx } = useLanguage();
  const lang = langProp ?? langCtx;
  const setLang = setLangProp ?? setLangCtx;

  const popularCategories = usePopularCategories();

  // ═══════════════════════════════════════════════════════════
  // SINGLE dropdown state — only one can ever be open.
  // Value is one of: "lang" | "cat" | "help" | "user" | null
  // ═══════════════════════════════════════════════════════════
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);

  const toggleMenu = (name) =>
    setOpenMenu((prev) => (prev === name ? null : name));
  const closeMenu = () => setOpenMenu(null);

  // Mobile drawer is a separate overlay — not a dropdown
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSub, setMobileSub] = useState(null); // "cat" | "help" | null

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Close dropdown + drawer on route change ───────────────
  useEffect(() => {
    setOpenMenu(null);
    setDrawerOpen(false);
    setMobileSub(null);
  }, [location.pathname]);

  // ── Outside click closes dropdown + drawer ────────────────
  useEffect(() => {
    const onDown = (e) => {
      // Dropdowns live inside navRef; the mobile drawer does not.
      // We close the dropdown if the click is outside navRef.
      if (openMenu !== null && navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [openMenu]);

  // ── Escape closes everything ──────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setDrawerOpen(false);
        setMobileSub(null);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ── Body scroll lock while drawer is open ─────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (drawerOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // ── Menu definitions ──────────────────────────────────────
  // NOTE: Ads dropdown removed — /tafuta?tafuta=... filters weren't
  // returning anything, so Ads is now a simple link to /tafuta.
  const helpMenuItems = [
    { label: { sw: "Jinsi ya Kununua", en: "How to Buy" }, link: "/jinsi-ya-kununua" },
    { label: { sw: "Jinsi ya Kuuza", en: "How to Sell" }, link: "/jinsi-ya-kununua#kuuza" },
    { label: { sw: "FAQ", en: "FAQ" }, link: "/mawasiliano#faq" },
    { label: { sw: "Wasiliana Nasi", en: "Contact Us" }, link: "/mawasiliano" },
  ];

  const languages = [
    { code: "en", native: "English" },
    { code: "sw", native: "Kiswahili" },
  ];

  const currentLang = languages.find((l) => l.code === lang) || languages[1];

  // ── Handlers ──────────────────────────────────────────────
  const handleLanguageSelect = (code) => {
    setLang(code);
    closeMenu();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tafuta?tafuta=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    closeMenu();
    await logoutAsync();
    navigate("/login");
  };

  const handleLogoClick = (e) => {
    const hit = registerLogoTap();
    if (hit) e.preventDefault();
  };

  const displayCategories = categories.length > 0 ? categories : popularCategories;
  const getCatLabel = (cat) =>
    cat.label?.[lang] || cat.label?.sw ||
    cat.name?.[lang] || cat.name?.sw ||
    cat.key || cat.slug;
  const getCatKey = (cat) => cat.key || cat.slug || "";
  const getCatImage = (cat) => cat.imageUrl || null;

  const Chev = ({ open }) => (
    <svg
      className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <>
      <AnnouncementBar />
      {/* ═════════════════════════════════════════════════════ */}
      {/* HEADER                                                */}
      {/* ═════════════════════════════════════════════════════ */}
      <header
        ref={navRef}
        className="bg-night text-white border-b border-white/10 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-3">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden text-white p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <Link
              to="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2 select-none min-w-0"
            >
              <img src="/logo.webp" alt="" width={32} height={32} className="h-8 w-8 rounded-full flex-shrink-0" />
              <span className="font-bold text-base sm:text-lg tracking-tight truncate">SokoMkononi</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-5 min-w-0">
            <Link
              to="/"
              className="text-white/70 hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              {lang === "sw" ? "Nyumbani" : "Home"}
            </Link>

            {/* Categories dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu("cat")}
                aria-expanded={openMenu === "cat"}
                className="flex items-center gap-1 text-white/70 hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
              >
                {lang === "sw" ? "Kategoria" : "Categories"}
                <Chev open={openMenu === "cat"} />
              </button>
              {openMenu === "cat" && (
                <div className="absolute left-0 mt-2 w-56 bg-night-soft border border-white/10 rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-y-auto">
                  {displayCategories.map((cat) => {
                    const CatIcon = getCategoryIcon(cat.iconKey);
                    const img = getCatImage(cat);
                    return (
                      <Link
                        key={getCatKey(cat)}
                        to={`/kategoria/${getCatKey(cat)}`}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        {img ? (
                          <img src={img} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                        ) : (
                          <CatIcon size={16} className="text-white/50 flex-shrink-0" />
                        )}
                        <span className="truncate">{getCatLabel(cat)}</span>
                      </Link>
                    );
                  })}
                  <div className="border-t border-white/10 mt-1 pt-1">
                    <Link
                      to="/kategoria"
                      className="block px-4 py-2 text-sm text-gold font-semibold hover:bg-white/5 transition-colors"
                    >
                      {lang === "sw" ? "Ona Zote →" : "View All →"}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Trust links or defaults */}
            {trustLinks.length > 0 ? (
              trustLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {lang === "sw" ? l.label.sw : l.label.en}
                </Link>
              ))
            ) : (
              <>
                <Link
                  to="/kuhusu"
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {lang === "sw" ? "Kuhusu Sisi" : "About Us"}
                </Link>

                {/* Ads — simple link (dropdown removed) */}
                <Link
                  to="/tafuta"
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {lang === "sw" ? "Matangazo" : "Ads"}
                </Link>

                {/* Help */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleMenu("help")}
                    aria-expanded={openMenu === "help"}
                    className="flex items-center gap-1 text-white/70 hover:text-white text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    {lang === "sw" ? "Msaada" : "Help"}
                    <Chev open={openMenu === "help"} />
                  </button>
                  {openMenu === "help" && (
                    <div className="absolute left-0 mt-2 w-56 bg-night-soft border border-white/10 rounded-lg shadow-xl py-2 z-50">
                      {helpMenuItems.map((item) => (
                        <Link
                          key={item.link}
                          to={item.link}
                          className="block px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          {lang === "sw" ? item.label.sw : item.label.en}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* Right: search + lang + bell + user */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Search - desktop */}
            <form onSubmit={handleSearchSubmit} className="relative hidden lg:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "sw" ? "Tafuta mali..." : "Search properties..."}
                className="bg-white/10 border border-white/15 rounded-md pl-3 pr-9 py-1.5 text-white text-sm placeholder-white/40 focus:outline-none focus:border-gold w-40 xl:w-56"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" />
                </svg>
              </button>
            </form>

            {/* Search icon - below lg */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="lg:hidden text-white/60 hover:text-white p-1.5 transition-colors"
              aria-label="Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* Language */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu("lang")}
                aria-expanded={openMenu === "lang"}
                className="text-white/60 hover:text-white text-sm font-medium border border-white/15 rounded-md px-2 sm:px-3 py-1.5 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <span className="hidden sm:inline">{currentLang?.native || "Kiswahili"}</span>
                <span className="sm:hidden">{currentLang?.code?.toUpperCase() || "SW"}</span>
                <Chev open={openMenu === "lang"} />
              </button>
              {openMenu === "lang" && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-night-soft border border-white/10 rounded-lg shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-white/50 text-xs font-semibold">
                      {lang === "sw" ? "Je, unapendelea lugha gani?" : "Which language do you prefer?"}
                    </p>
                  </div>
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleLanguageSelect(l.code)}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${
                        lang === l.code ? "bg-white/5" : ""
                      }`}
                    >
                      <span className="text-white text-sm font-medium">{l.native}</span>
                      {lang === l.code && (
                        <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
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
              )}
            </div>

            <ThemeToggle />

            <NotificationBell />

            {/* User / Login */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleMenu("user")}
                  aria-expanded={openMenu === "user"}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-md px-2 py-1.5 transition-colors"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center text-night font-bold text-xs">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="hidden lg:inline text-white text-sm font-medium truncate max-w-[80px]">
                    {user.name?.split(" ")[0] || "User"}
                  </span>
                  <Chev open={openMenu === "user"} />
                </button>
                {openMenu === "user" && (
                  <div className="absolute right-0 mt-2 w-56 bg-night-soft border border-white/10 rounded-lg shadow-xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-white/50 text-xs truncate">{user.email}</p>
                    </div>
                    <Link to="/dashboard" className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                      {lang === "sw" ? "Dashibodi" : "Dashboard"}
                    </Link>
                    <Link to="/wasifu" className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                      {lang === "sw" ? "Wasifu" : "Profile"}
                    </Link>
                    <Link to="/dashboard/buyer" className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                      {lang === "sw" ? "Nunua Sasa" : "Buy Now"}
                    </Link>
                    <Link to="/dashboard/post" className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                      {lang === "sw" ? "Uza Sasa" : "Sell Now"}
                    </Link>
                    <Link to="/alika-marafiki" className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                      {lang === "sw" ? "Alika Marafiki" : "Invite Friends"}
                    </Link>
                    <div className="my-2 border-t border-white/10" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-rust hover:bg-rust/10 transition-colors"
                    >
                      {lang === "sw" ? "Toka" : "Logout"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-gold hover:bg-flame text-night font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-md transition-colors whitespace-nowrap"
              >
                {lang === "sw" ? "Ingia" : "Login"}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="lg:hidden bg-night border-t border-white/10 px-3 sm:px-4 py-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "sw" ? "Tafuta mali..." : "Search properties..."}
                  className="w-full bg-white/10 border border-white/15 rounded-md pl-3 pr-9 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-gold"
                />
                <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" strokeWidth="2" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="text-white/60 hover:text-white text-sm px-2 py-2"
              >
                {lang === "sw" ? "Ghairi" : "Cancel"}
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ═════════════════════════════════════════════════════ */}
      {/* MOBILE DRAWER                                         */}
      {/* ═════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 left-0 h-full w-72 max-w-[80%] bg-night z-50 transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl p-2"
          aria-label="Close menu"
        >
          ✕
        </button>
        <div className="pt-16 px-6 h-full overflow-y-auto pb-8">
          <div className="flex items-center gap-2 mb-8 pb-4 border-b border-white/10">
            <img src="/logo.webp" alt="" width={36} height={36} className="h-9 w-9 rounded-full" />
            <span className="text-white font-bold text-lg tracking-tight">SokoMkononi</span>
          </div>

          <nav className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setDrawerOpen(false)}
              className="text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
            >
              {lang === "sw" ? "Nyumbani" : "Home"}
            </Link>

            {/* Categories sub */}
            <button
              type="button"
              onClick={() => setMobileSub((v) => (v === "cat" ? null : "cat"))}
              aria-expanded={mobileSub === "cat"}
              className="flex items-center justify-between text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span>{lang === "sw" ? "Kategoria" : "Categories"}</span>
              <Chev open={mobileSub === "cat"} />
            </button>
            <div
              className={`grid transition-all duration-300 ${mobileSub === "cat" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              style={{ display: "grid" }}
            >
              <div className="overflow-hidden pl-2">
                {displayCategories.map((cat) => {
                  const CatIcon = getCategoryIcon(cat.iconKey);
                  const img = getCatImage(cat);
                  return (
                    <Link
                      key={getCatKey(cat)}
                      to={`/kategoria/${getCatKey(cat)}`}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-2.5 text-white/60 hover:text-white text-sm py-2 px-4 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {img ? (
                        <img src={img} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />
                      ) : (
                        <CatIcon size={16} className="text-white/40 flex-shrink-0" />
                      )}
                      <span className="truncate">{getCatLabel(cat)}</span>
                    </Link>
                  );
                })}
                <Link
                  to="/kategoria"
                  onClick={() => setDrawerOpen(false)}
                  className="block text-gold hover:text-flame text-sm font-semibold py-2 px-4 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {lang === "sw" ? "Ona Zote →" : "View All →"}
                </Link>
              </div>
            </div>

            <div className="my-2 border-t border-white/10" />

            {/* Ads — simple link (dropdown removed) */}
            <Link
              to="/tafuta"
              onClick={() => setDrawerOpen(false)}
              className="text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
            >
              {lang === "sw" ? "Matangazo" : "Ads"}
            </Link>

            <Link
              to="/kuhusu"
              onClick={() => setDrawerOpen(false)}
              className="text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
            >
              {lang === "sw" ? "Kuhusu Sisi" : "About Us"}
            </Link>

            {/* Help sub */}
            <button
              type="button"
              onClick={() => setMobileSub((v) => (v === "help" ? null : "help"))}
              aria-expanded={mobileSub === "help"}
              className="flex items-center justify-between text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span>{lang === "sw" ? "Msaada" : "Help"}</span>
              <Chev open={mobileSub === "help"} />
            </button>
            <div
              className={`grid transition-all duration-300 ${mobileSub === "help" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              style={{ display: "grid" }}
            >
              <div className="overflow-hidden pl-2">
                {helpMenuItems.map((item) => (
                  <Link
                    key={item.link}
                    to={item.link}
                    onClick={() => setDrawerOpen(false)}
                    className="block text-white/60 hover:text-white text-sm py-2 px-4 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {lang === "sw" ? item.label.sw : item.label.en}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
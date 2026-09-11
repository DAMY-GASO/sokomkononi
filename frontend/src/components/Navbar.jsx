import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { usePopularCategories } from "../config/categoriesStore.js";

export default function Navbar({
  lang: langProp,
  setLang: setLangProp,
  categories = [],
  trustLinks = [],
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Soma kutoka context kama props hazijatolewa
  const { lang: langCtx, setLang: setLangCtx } = useLanguage();
  const lang = langProp ?? langCtx;
  const setLang = setLangProp ?? setLangCtx;

  // Popular categories kutoka store — fallback kama hakuna prop
  const popularCategories = usePopularCategories();

  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [adsDropdownOpen, setAdsDropdownOpen] = useState(false);
  const [mobileAdsDropdownOpen, setMobileAdsDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Matangazo menu items
  const adMenuItems = [
    { label: { sw: "Matangazo Mapya", en: "New Ads" }, link: "/tafuta?tafuta=mpya" },
    { label: { sw: "Matangazo ya Ofa", en: "Deal Ads" }, link: "/tafuta?tafuta=ofa" },
    { label: { sw: "Matangazo Yaliyothibitishwa", en: "Verified Ads" }, link: "/tafuta?tafuta=verified" },
    { label: { sw: "Matangazo ya Haraka", en: "Urgent Ads" }, link: "/tafuta?tafuta=haraka" },
    { label: { sw: "Matangazo Yote", en: "All Ads" }, link: "/tafuta" },
  ];

  const languages = [
    { code: "en", native: "English" },
    { code: "sw", native: "Kiswahili" },
  ];

  const handleLanguageSelect = (code) => {
    setLang(code);
    setLangOpen(false);
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
    await logout();
    navigate("/login");
  };

  const currentLang = languages.find((l) => l.code === lang) || languages[1];

  const handleOverlayClick = () => {
    setMenuOpen(false);
  };

  // Kama page imepitisha `categories` prop (kutoka HomePage), tumia hizo.
  // Vinginevyo, tumia popularCategories kutoka store.
  const displayCategories = categories.length > 0 ? categories : popularCategories;

  // Helper ya kupata jina la category — inashughulikia `label` na `name`
  const getCatLabel = (cat) =>
    cat.label?.[lang] ||
    cat.label?.sw ||
    cat.name?.[lang] ||
    cat.name?.sw ||
    cat.key ||
    cat.slug;

  // Helper ya kupata key/slug ya category
  const getCatKey = (cat) => cat.key || cat.slug;

  return (
    <>
      {/* HEADER */}
      <header className="bg-[#101A2E] text-white border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="hidden md:flex w-7 h-7 rounded-md bg-[#E8A33D] items-center justify-center text-[#101A2E] font-bold text-sm">
                S
              </span>
              <span className="font-bold text-base sm:text-lg tracking-tight">SokoMkononi</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link to="/" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              {lang === "sw" ? "Nyumbani" : "Home"}
            </Link>

            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCatOpen((prev) => !prev)}
                className="flex items-center gap-1 text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                {lang === "sw" ? "Kategoria" : "Categories"}
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${catOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {catOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-[#182541] border border-white/10 rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-y-auto">
                  {displayCategories.map((cat) => (
                    <Link
                      key={getCatKey(cat)}
                      to={`/kategoria/${getCatKey(cat)}`}
                      onClick={() => setCatOpen(false)}
                      className="block px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      {getCatLabel(cat)}
                    </Link>
                  ))}
                  <div className="border-t border-white/10 mt-1 pt-1">
                    <Link
                      to="/kategoria"
                      onClick={() => setCatOpen(false)}
                      className="block px-4 py-2 text-sm text-[#E8A33D] font-semibold hover:bg-white/5 transition-colors"
                    >
                      {lang === "sw" ? "Ona Zote →" : "View All →"}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Trust Links */}
            {trustLinks.length > 0 ? (
              trustLinks.map((l) => {
                if (l.to === "/usalama") {
                  return (
                    <div key={l.to} className="relative">
                      <button
                        onClick={() => setAdsDropdownOpen((prev) => !prev)}
                        className="flex items-center gap-1 text-white/70 hover:text-white text-sm font-medium transition-colors"
                      >
                        {lang === "sw" ? "Matangazo" : "Ads"}
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${adsDropdownOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {adsDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-64 bg-[#182541] border border-white/10 rounded-lg shadow-xl py-2 z-50">
                          {adMenuItems.map((item) => (
                            <Link
                              key={item.link}
                              to={item.link}
                              onClick={() => setAdsDropdownOpen(false)}
                              className="block px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                            >
                              {lang === "sw" ? item.label.sw : item.label.en}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="text-white/70 hover:text-white text-sm font-medium transition-colors"
                  >
                    {lang === "sw" ? l.label.sw : l.label.en}
                  </Link>
                );
              })
            ) : (
              <>
                <Link
                  to="/kuhusu"
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors"
                >
                  {lang === "sw" ? "Kuhusu Sisi" : "About Us"}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setAdsDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1 text-white/70 hover:text-white text-sm font-medium transition-colors"
                  >
                    {lang === "sw" ? "Matangazo" : "Ads"}
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${adsDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {adsDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-[#182541] border border-white/10 rounded-lg shadow-xl py-2 z-50">
                      {adMenuItems.map((item) => (
                        <Link
                          key={item.link}
                          to={item.link}
                          onClick={() => setAdsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          {lang === "sw" ? item.label.sw : item.label.en}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <Link
                  to="/mawasiliano"
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors"
                >
                  {lang === "sw" ? "Mawasiliano" : "Contact"}
                </Link>
              </>
            )}
          </nav>

          {/* Right: Search + Language + User/Login */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search - Desktop */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === "sw" ? "Tafuta mali..." : "Search properties..."}
                className="bg-white/10 border border-white/15 rounded-md pl-3 pr-9 py-1.5 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#E8A33D] w-40 lg:w-56"
              />
              <button
                type="submit"
                aria-label={lang === "sw" ? "Tafuta" : "Search"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" />
                </svg>
              </button>
            </form>

            {/* Search Icon - Mobile */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="sm:hidden text-white/60 hover:text-white p-1.5 transition-colors"
              aria-label={lang === "sw" ? "Tafuta" : "Search"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="text-white/60 hover:text-white text-sm font-medium border border-white/15 rounded-md px-2 sm:px-3 py-1.5 transition-colors flex items-center gap-1"
              >
                <span className="hidden sm:inline">{currentLang?.native || "Kiswahili"}</span>
                <span className="sm:hidden">{currentLang?.code?.toUpperCase() || "SW"}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${langOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-[#182541] border border-white/10 rounded-lg shadow-xl py-2 z-50">
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
              )}
            </div>

            {/* User Menu / Login Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-md px-2 py-1.5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-xs">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden lg:inline text-white text-sm font-medium truncate max-w-[80px]">
                    {user.name?.split(" ")[0] || "User"}
                  </span>
                  <svg
                    className={`w-4 h-4 text-white/60 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#182541] border border-white/10 rounded-lg shadow-xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-white/50 text-xs truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      {lang === "sw" ? "Dashibodi" : "Dashboard"}
                    </Link>
                    <Link
                      to="/wasifu"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      {lang === "sw" ? "Wasifu" : "Profile"}
                    </Link>
                    <Link
                      to="/dashboard/buyer"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      {lang === "sw" ? "Nunua Sasa" : "Buy Now"}
                    </Link>
                    {/* === IMEBADILISHWA: /dashboard/seller → /dashboard/post === */}
                    <Link
                      to="/dashboard/post"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      {lang === "sw" ? "Uza Sasa" : "Sell Now"}
                    </Link>
                    <div className="my-2 border-t border-white/10" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#C1502E] hover:bg-[#C1502E]/10 transition-colors"
                    >
                      {lang === "sw" ? "Toka" : "Logout"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-semibold text-sm px-4 py-2 rounded-md transition-colors whitespace-nowrap"
              >
                {lang === "sw" ? "Ingia/Jisajili" : "Login/Register"}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div className="sm:hidden bg-[#101A2E] border-t border-white/10 px-4 py-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "sw" ? "Tafuta mali..." : "Search properties..."}
                  className="w-full bg-white/10 border border-white/15 rounded-md pl-3 pr-9 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#E8A33D]"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
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

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleOverlayClick}
      />
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[80%] bg-[#101A2E] z-50 transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl p-2"
        >
          ✕
        </button>
        <div className="pt-16 px-6 h-full overflow-y-auto pb-8">
          <div className="flex items-center gap-2 mb-8 pb-4 border-b border-white/10">
            <span className="w-8 h-8 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">
              S
            </span>
            <span className="text-white font-bold text-lg tracking-tight">SokoMkononi</span>
          </div>
          <nav className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
            >
              {lang === "sw" ? "Nyumbani" : "Home"}
            </Link>

            {/* Categories dropdown - mobile */}
            <button
              onClick={() => setMobileCatOpen((prev) => !prev)}
              aria-expanded={mobileCatOpen}
              className="flex items-center justify-between text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span>{lang === "sw" ? "Kategoria" : "Categories"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${mobileCatOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                mobileCatOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
              style={{ display: "grid" }}
            >
              <div className="overflow-hidden pl-2">
                {displayCategories.map((cat) => (
                  <Link
                    key={getCatKey(cat)}
                    to={`/kategoria/${getCatKey(cat)}`}
                    onClick={() => setMenuOpen(false)}
                    className="block text-white/60 hover:text-white text-sm py-2 px-4 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {getCatLabel(cat)}
                  </Link>
                ))}
                <Link
                  to="/kategoria"
                  onClick={() => setMenuOpen(false)}
                  className="block text-[#E8A33D] hover:text-[#B87A1F] text-sm font-semibold py-2 px-4 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {lang === "sw" ? "Ona Zote →" : "View All →"}
                </Link>
              </div>
            </div>

            <div className="my-2 border-t border-white/10" />

            {/* Matangazo Dropdown - mobile */}
            <button
              onClick={() => setMobileAdsDropdownOpen((prev) => !prev)}
              aria-expanded={mobileAdsDropdownOpen}
              className="flex items-center justify-between text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span>{lang === "sw" ? "Matangazo" : "Ads"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${mobileAdsDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                mobileAdsDropdownOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
              style={{ display: "grid" }}
            >
              <div className="overflow-hidden pl-2">
                {adMenuItems.map((item) => (
                  <Link
                    key={item.link}
                    to={item.link}
                    onClick={() => setMenuOpen(false)}
                    className="block text-white/60 hover:text-white text-sm py-2 px-4 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {lang === "sw" ? item.label.sw : item.label.en}
                  </Link>
                ))}
              </div>
            </div>

            {/* Trust Links - mobile */}
            {trustLinks.length > 0 ? (
              trustLinks.map((l) => {
                if (l.to === "/usalama") return null;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className="text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {lang === "sw" ? l.label.sw : l.label.en}
                  </Link>
                );
              })
            ) : (
              <>
                <Link
                  to="/kuhusu"
                  onClick={() => setMenuOpen(false)}
                  className="text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {lang === "sw" ? "Kuhusu Sisi" : "About Us"}
                </Link>
                <Link
                  to="/mawasiliano"
                  onClick={() => setMenuOpen(false)}
                  className="text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {lang === "sw" ? "Mawasiliano" : "Contact"}
                </Link>
              </>
            )}
          </nav>

          <div className="my-6 border-t border-white/10" />

          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-white/50 text-xs truncate">{user.email}</p>
                </div>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center border border-white/20 text-white font-semibold text-base rounded-md py-3 hover:bg-white/5 transition-colors"
              >
                {lang === "sw" ? "Dashibodi" : "Dashboard"}
              </Link>
              <Link
                to="/wasifu"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center border border-white/20 text-white font-semibold text-base rounded-md py-3 hover:bg-white/5 transition-colors"
              >
                {lang === "sw" ? "Wasifu" : "Profile"}
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="w-full text-center border border-[#C1502E] text-[#C1502E] font-semibold text-base rounded-md py-3 hover:bg-[#C1502E]/10 transition-colors"
              >
                {lang === "sw" ? "Toka" : "Logout"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="w-full text-center bg-[#E8A33D] text-[#101A2E] font-semibold text-base rounded-md py-3 hover:bg-[#B87A1F] transition-colors"
              >
                {lang === "sw" ? "Ingia/Jisajili" : "Login/Register"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(() => {
    return localStorage.getItem("preferred_language") || "sw";
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/kategoria/nyumba", label: "Nyumba" },
    { to: "/kategoria/magari", label: "Magari" },
    { to: "/kategoria/viwanja", label: "Viwanja" },
    { to: "/kategoria/biashara", label: "Biashara" },
  ];

  const languages = [
    { code: "en", label: "English", native: "English" },
    { code: "sw", label: "Swahili", native: "Kiswahili" },
  ];

  const handleLanguageSelect = (code) => {
    setSelectedLang(code);
  };

  const handleSaveLanguage = () => {
    localStorage.setItem("preferred_language", selectedLang);
    setLangOpen(false);
    window.location.reload();
  };

  const currentLang = languages.find(l => l.code === selectedLang);

  // Close menu when clicking outside
  const handleOverlayClick = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-night/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button - Left side */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-sand p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="w-7 h-7 rounded-md bg-gold flex items-center justify-center text-night font-bold text-sm">
                S
              </span>
              <span className="text-sand font-bold text-base sm:text-lg tracking-tight">
                SokoMkononi
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sand/70 hover:text-sand text-sm font-medium transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right: Search + Language + Login/Post */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Icon */}
            <button className="text-sand/60 hover:text-sand p-1.5 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="text-sand/60 hover:text-sand text-sm font-medium border border-white/15 rounded-md px-2 sm:px-3 py-1.5 transition-colors flex items-center gap-1"
              >
                <span className="hidden xs:inline">{currentLang?.native || "Kiswahili"}</span>
                <span className="xs:hidden">{currentLang?.code?.toUpperCase() || "SW"}</span>
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
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-night-2 border border-white/10 rounded-lg shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sand/50 text-xs font-semibold">Je, unapendelea lugha gani?</p>
                  </div>

                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${
                        selectedLang === lang.code ? "bg-white/5" : ""
                      }`}
                    >
                      <span className="text-sand text-sm font-medium">{lang.label}</span>
                      <span className="text-sand/50 text-sm">{lang.native}</span>
                      {selectedLang === lang.code && (
                        <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}

                  <div className="px-4 pt-2 border-t border-white/10 mt-1">
                    <button
                      onClick={handleSaveLanguage}
                      className="w-full bg-gold hover:bg-gold-dark text-night font-semibold text-sm py-2 rounded-md transition-colors"
                    >
                      Hifadhi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Login/Post - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sand/80 hover:text-sand text-sm font-medium"
              >
                Ingia
              </Link>
              <Link
                to="/register?intent=sell"
                className="bg-gold hover:bg-gold-dark text-night font-semibold text-sm px-4 py-2 rounded-md transition-colors whitespace-nowrap"
              >
                Weka Tangazo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay ${menuOpen ? "open" : ""}`}
        onClick={handleOverlayClick}
      />

      {/* Mobile Menu Panel - Slides from right */}
      <div className={`mobile-menu-panel ${menuOpen ? "open" : ""}`}>
        {/* Close button */}
        <button
          onClick={() => setMenuOpen(false)}
          className="menu-close-btn"
          aria-label="Close menu"
        >
          ✕
        </button>

        <div className="mt-12">
          {/* Logo in menu */}
          <div className="flex items-center gap-2 mb-8 pb-4 border-b border-white/10">
            <span className="w-8 h-8 rounded-md bg-gold flex items-center justify-center text-night font-bold text-sm">
              S
            </span>
            <span className="text-sand font-bold text-lg tracking-tight">SokoMkononi</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className="text-sand/80 hover:text-sand text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Divider */}
          <div className="my-6 border-t border-white/10" />

          {/* Auth buttons in menu */}
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center text-sand/80 text-base font-medium border border-white/15 rounded-md py-3 hover:bg-white/5 transition-colors"
            >
              Ingia
            </Link>
            <Link
              to="/register?intent=sell"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center bg-gold text-night font-semibold text-base rounded-md py-3 hover:bg-gold-dark transition-colors"
            >
              Weka Tangazo
            </Link>
          </div>

          {/* Language selector in menu */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sand/50 text-xs font-semibold mb-3">Lugha</p>
            <div className="flex gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    handleSaveLanguage();
                    setMenuOpen(false);
                  }}
                  className={`flex-1 text-center text-sm font-medium py-2 rounded-md transition-colors ${
                    selectedLang === lang.code
                      ? "bg-gold text-night"
                      : "text-sand/60 border border-white/15 hover:bg-white/5"
                  }`}
                >
                  {lang.native}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

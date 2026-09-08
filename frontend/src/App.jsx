import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./index.css";

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(() => {
    return localStorage.getItem("preferred_language") || "sw";
  });

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

  const categories = [
    { name: "Nyumba", icon: "🏠", count: "3,200+" },
    { name: "Viwanja", icon: "🌳", count: "2,100+" },
    { name: "Magari", icon: "🚗", count: "2,800+" },
    { name: "Pikipiki", icon: "🏍️", count: "1,500+" },
    { name: "Mabasi", icon: "🚌", count: "800+" },
    { name: "Malori", icon: "🚛", count: "600+" },
    { name: "Trekta", icon: "🚜", count: "400+" },
    { name: "Boti", icon: "⛵", count: "200+" },
    { name: "Ndege", icon: "✈️", count: "50+" },
    { name: "Mashine", icon: "🔧", count: "900+" },
    { name: "Samani", icon: "🛋️", count: "1,200+" },
    { name: "Vifaa vya Elektroniki", icon: "💻", count: "2,000+" },
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

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================================ */}
      {/* NAVBAR - NO LOGIN/POST BUTTONS ON DESKTOP */}
      {/* ============================================================ */}
      <header className="bg-[#101A2E] text-white border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">
                S
              </span>
              <span className="font-bold text-base sm:text-lg tracking-tight">SokoMkononi</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right: Search + Language ONLY - No Login/Post buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Icon */}
            <button className="text-white/60 hover:text-white p-1.5 transition-colors">
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
                    <p className="text-white/50 text-xs font-semibold">Je, unapendelea lugha gani?</p>
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${
                        selectedLang === lang.code ? "bg-white/5" : ""
                      }`}
                    >
                      <span className="text-white text-sm font-medium">{lang.label}</span>
                      <span className="text-white/50 text-sm">{lang.native}</span>
                      {selectedLang === lang.code && (
                        <svg className="w-4 h-4 text-[#E8A33D]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                  <div className="px-4 pt-2 border-t border-white/10 mt-1">
                    <button
                      onClick={handleSaveLanguage}
                      className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-semibold text-sm py-2 rounded-md transition-colors"
                    >
                      Hifadhi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MOBILE MENU - SLIDES FROM RIGHT (WITH LOGIN & POST AD) */}
      {/* ============================================================ */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[80%] bg-[#101A2E] z-50 transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl p-2 transition-colors"
          aria-label="Close menu"
        >
          ✕
        </button>

        <div className="pt-16 px-6">
          {/* Logo in menu */}
          <div className="flex items-center gap-2 mb-8 pb-4 border-b border-white/10">
            <span className="w-8 h-8 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">
              S
            </span>
            <span className="text-white font-bold text-lg tracking-tight">SokoMkononi</span>
          </div>

          {/* Auth buttons - ONLY IN MOBILE MENU */}
          <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-white/10">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center text-white/80 text-base font-medium border border-white/15 rounded-md py-3 hover:bg-white/5 transition-colors"
            >
              {selectedLang === "sw" ? "🔑 Ingia" : "🔑 Login"}
            </Link>
            <Link
              to="/register?intent=sell"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center bg-[#E8A33D] text-[#101A2E] font-semibold text-base rounded-md py-3 hover:bg-[#B87A1F] transition-colors"
            >
              {selectedLang === "sw" ? "📢 Weka Tangazo" : "📢 Post Ad"}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className="text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Language selector in menu */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs font-semibold mb-3">
              {selectedLang === "sw" ? "Lugha" : "Language"}
            </p>
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
                      ? "bg-[#E8A33D] text-[#101A2E]"
                      : "text-white/60 border border-white/15 hover:bg-white/5"
                  }`}
                >
                  {lang.native}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* HERO SECTION */}
      {/* ============================================================ */}
      <section className="bg-[#101A2E] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#E8A33D] text-sm font-semibold tracking-wide">
            {selectedLang === "sw" ? "Soko la Kidijitali la Mali" : "Digital Property Marketplace"}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mt-3 leading-tight">
            {selectedLang === "sw" ? "Nunua na Uza Mali kwa Urahisi" : "Buy and Sell Property Easily"}
          </h1>
          <p className="text-white/70 text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            {selectedLang === "sw"
              ? "SokoMkononi ni jukwaa salama la kununua na kuuza nyumba, magari, viwanja na mali nyingine."
              : "SokoMkononi is a safe platform to buy and sell houses, cars, land and other properties."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link
              to="/register?intent=buy"
              className="bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-semibold px-6 py-3 rounded-md transition-colors"
            >
              {selectedLang === "sw" ? "Nunua Sasa" : "Buy Now"}
            </Link>
            <Link
              to="/register?intent=sell"
              className="border border-[#2F6D4F] text-[#2F6D4F] bg-[#2F6D4F]/10 hover:bg-[#2F6D4F]/20 font-semibold px-6 py-3 rounded-md transition-colors"
            >
              {selectedLang === "sw" ? "Uza Bidhaa" : "Sell Item"}
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CATEGORIES SECTION */}
      {/* ============================================================ */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedLang === "sw" ? "Kategoria Maarufu" : "Popular Categories"}
          </h2>
          <Link to="/kategoria" className="text-[#E8A33D] text-sm font-semibold hover:underline">
            {selectedLang === "sw" ? "Tazama Yote →" : "View All →"}
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat, index) => (
            <Link
              key={index}
              to={`/kategoria/${cat.name.toLowerCase()}`}
              className="bg-[#F5F3EC] rounded-lg p-4 text-center hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">{cat.name}</h3>
              <p className="text-xs text-gray-500">{cat.count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* BOTTOM NAVIGATION - MOBILE ONLY */}
      {/* ============================================================ */}
      <nav className="bottom-nav">
        <Link to="/" className="nav-item active">
          <span>🏠</span>
          <span>Home</span>
        </Link>
        <Link to="/saved" className="nav-item">
          <span>⭐</span>
          <span>Saved</span>
        </Link>
        <Link to="/register?intent=sell" className="nav-item sell-btn">
          <span>➕</span>
          <span>Sell</span>
        </Link>
        <Link to="/messages" className="nav-item">
          <span>💬</span>
          <span>Messages</span>
          <span className="badge">2</span>
        </Link>
        <Link to="/profile" className="nav-item">
          <span>👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}

// ============================================================
// APP COMPONENT
// ============================================================
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;

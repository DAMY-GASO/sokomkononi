import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import Footer from "./components/Footer.jsx";
import BottomNav from "./components/BottomNav.jsx";
import LoginPage from "./pages/Auth/LoginPage.jsx";
import RegisterPage from "./pages/Auth/RegisterPage.jsx";
import WaitlistPage from "./pages/Auth/WaitlistPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import "./index.css";

function CategoryIcon({ type }) {
  const common = { width: 44, height: 44, viewBox: "0 0 24 24", fill: "none", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case "house":
      return (
        <svg {...common} stroke="#E8A33D">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "land":
      return (
        <svg {...common} stroke="#2F6D4F">
          <path d="M12 3v7" />
          <path d="M12 10c-3 0-5-2-5-5" />
          <path d="M12 10c3 0 5-2 5-5" />
          <path d="M6 21h12" />
          <path d="M9 21V13" />
          <path d="M15 21V13" />
        </svg>
      );
    case "car":
      return (
        <svg {...common} stroke="#C1502E">
          <path d="M3 16V12l2.5-5h13L21 12v4" />
          <path d="M3 16h18" />
          <circle cx="7" cy="18" r="1.6" />
          <circle cx="17" cy="18" r="1.6" />
        </svg>
      );
    case "moto":
      return (
        <svg {...common} stroke="#101A2E">
          <circle cx="6" cy="17" r="3" />
          <circle cx="18" cy="17" r="3" />
          <path d="M6 17h6l3-7h3" />
          <path d="M9 10h4" />
        </svg>
      );
    case "bus":
      return (
        <svg {...common} stroke="#2F6D4F">
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M3 12h18" />
          <circle cx="7.5" cy="19" r="1.4" />
          <circle cx="16.5" cy="19" r="1.4" />
        </svg>
      );
    case "gear":
      return (
        <svg {...common} stroke="#E8A33D">
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.3-2l1.7-1.3-2-3.4-2 .8a7 7 0 0 0-1.7-1l-.3-2.1h-4l-.3 2.1a7 7 0 0 0-1.7 1l-2-.8-2 3.4L6.1 10a7 7 0 0 0 0 4l-1.7 1.3 2 3.4 2-.8a7 7 0 0 0 1.7 1l.3 2.1h4l.3-2.1a7 7 0 0 0 1.7-1l2 .8 2-3.4L18.7 14a7 7 0 0 0 .3-2Z" />
        </svg>
      );
    case "sofa":
      return (
        <svg {...common} stroke="#C1502E">
          <path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
          <path d="M3 12h18v5H3z" />
          <path d="M4 17v2" />
          <path d="M20 17v2" />
        </svg>
      );
    case "electronics":
      return (
        <svg {...common} stroke="#101A2E">
          <rect x="3" y="4" width="18" height="12" rx="1" />
          <path d="M8 20h8" />
          <path d="M12 16v4" />
        </svg>
      );
    default:
      return null;
  }
}

function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    { code: "en", native: "English" },
    { code: "sw", native: "Kiswahili" },
  ];

  const categories = [
    { name: "Nyumba", count: "3,200+", icon: "house" },
    { name: "Viwanja", count: "2,100+", icon: "land" },
    { name: "Magari", count: "2,800+", icon: "car" },
    { name: "Pikipiki", count: "1,500+", icon: "moto" },
    { name: "Mabasi", count: "800+", icon: "bus" },
    { name: "Mashine", count: "900+", icon: "gear" },
    { name: "Samani", count: "1,200+", icon: "sofa" },
    { name: "Vifaa vya Elektroniki", count: "2,000+", icon: "electronics" },
  ];

  const faqs = [
    {
      q: { sw: "Je, SokoMkononi ni salama?", en: "Is SokoMkononi safe?" },
      a: {
        sw: "Ndio, SokoMkononi ina mfumo wa uthibitishaji wa wauzaji na wanunuzi, pamoja na mfumo wa malipo salama.",
        en: "Yes, SokoMkononi has a verification system for sellers and buyers, plus a secure payment system.",
      },
    },
    {
      q: { sw: "Ninawezaje kuuza mali yangu?", en: "How can I sell my property?" },
      a: {
        sw: "Bonyeza kitufe cha 'Uza' na ujaze maelezo ya mali yako. Timu yetu itaipitia na kuiweka kwenye soko.",
        en: "Click the 'Sell' button and fill in your property details. Our team will review and list it.",
      },
    },
    {
      q: { sw: "Je, kuna ada ya matumizi?", en: "Are there any fees?" },
      a: {
        sw: "SokoMkononi inatoza ada ndogo baada ya mauzo kukamilika. Hakuna malipo ya awali.",
        en: "SokoMkononi charges a small fee after a sale is completed. No upfront payments.",
      },
    },
  ];

  const handleLanguageSelect = (code) => {
    setSelectedLang(code);
  };

  const handleSaveLanguage = () => {
    localStorage.setItem("preferred_language", selectedLang);
    setLangOpen(false);
    window.location.reload();
  };

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    // TODO: badilisha "/kategoria" na route halisi ya matokeo ya utafutaji ukishaitengeneza
    navigate(`/kategoria?tafuta=${encodeURIComponent(q)}`);
    setMobileSearchOpen(false);
  };

  const currentLang = languages.find(l => l.code === selectedLang);

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================================ */}
      {/* NAVBAR */}
      {/* ============================================================ */}
      <header className="bg-[#101A2E] text-white border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden md:flex w-7 h-7 rounded-md bg-[#E8A33D] items-center justify-center text-[#101A2E] font-bold text-sm">S</span>
              <span className="font-bold text-base sm:text-lg tracking-tight">SokoMkononi</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={selectedLang === "sw" ? "Tafuta mali..." : "Search properties..."}
                className="bg-white/10 border border-white/15 rounded-md pl-3 pr-9 py-1.5 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#E8A33D] w-40 lg:w-56"
              />
              <button type="submit" aria-label={selectedLang === "sw" ? "Tafuta" : "Search"} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" />
                </svg>
              </button>
            </form>

            {/* Search Icon - Mobile (inafungua search bar halisi) */}
            <button
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              aria-expanded={mobileSearchOpen}
              aria-label={selectedLang === "sw" ? "Tafuta" : "Search"}
              className="sm:hidden text-white/60 hover:text-white p-1.5 transition-colors"
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
                <svg className={`w-4 h-4 transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors ${selectedLang === lang.code ? "bg-white/5" : ""}`}
                    >
                      <span className="text-white text-sm font-medium">{lang.native}</span>
                      {selectedLang === lang.code && (
                        <svg className="w-4 h-4 text-[#E8A33D]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                  <div className="px-4 pt-2 border-t border-white/10 mt-1">
                    <button onClick={handleSaveLanguage} className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-semibold text-sm py-2 rounded-md transition-colors">
                      Hifadhi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Login/Register Button - Single button */}
            <Link
              to="/login"
              className="bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-semibold text-sm px-4 py-2 rounded-md transition-colors whitespace-nowrap"
            >
              {selectedLang === "sw" ? "Ingia/Jisajili" : "Login/Register"}
            </Link>
          </div>
        </div>

        {/* Search Bar - Mobile (inatokea ubofyapo icon ya search) */}
        {mobileSearchOpen && (
          <div className="sm:hidden border-t border-white/10 px-4 py-3 bg-[#101A2E]">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={selectedLang === "sw" ? "Tafuta mali..." : "Search properties..."}
                  className="w-full bg-white/10 border border-white/15 rounded-md pl-3 pr-9 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#E8A33D]"
                />
                <button type="submit" aria-label={selectedLang === "sw" ? "Tafuta" : "Search"} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" strokeWidth="2" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); }}
                className="text-white/60 hover:text-white text-sm px-2 py-2"
              >
                {selectedLang === "sw" ? "Ghairi" : "Cancel"}
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* MOBILE MENU */}
      {/* ============================================================ */}
      <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setMenuOpen(false)} />
      <div className={`fixed top-0 right-0 h-full w-72 max-w-[80%] bg-[#101A2E] z-50 transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl p-2">✕</button>
        <div className="pt-16 px-6">
          <div className="flex items-center gap-2 mb-8 pb-4 border-b border-white/10">
            <span className="w-8 h-8 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">S</span>
            <span className="text-white font-bold text-lg tracking-tight">SokoMkononi</span>
          </div>
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="text-white/80 hover:text-white text-base font-medium py-3 px-4 rounded-lg hover:bg-white/5 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="my-6 border-t border-white/10" />
          <div className="flex flex-col gap-3">
            <Link to="/login" onClick={() => setMenuOpen(false)} className="w-full text-center bg-[#E8A33D] text-[#101A2E] font-semibold text-base rounded-md py-3 hover:bg-[#B87A1F] transition-colors">
              {selectedLang === "sw" ? "Ingia/Jisajili" : "Login/Register"}
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* HERO SECTION */}
      {/* ============================================================ */}
      <section className="bg-[#101A2E] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mt-3 leading-tight">
            {selectedLang === "sw" ? "Nunua na Uza Mali kwa Urahisi" : "Buy and Sell Property Easily"}
          </h1>
          <p className="text-white/70 text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            {selectedLang === "sw"
              ? "SokoMkononi ni jukwaa salama la kununua na kuuza nyumba, magari, viwanja na mali nyingine."
              : "SokoMkononi is a safe platform to buy and sell houses, cars, land and other properties."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link to="/register?intent=buy" className="bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-semibold px-6 py-3 rounded-md transition-colors">
              {selectedLang === "sw" ? "Nunua Sasa" : "Buy Now"}
            </Link>
            <Link to="/register?intent=sell" className="border border-[#2F6D4F] text-[#2F6D4F] bg-[#2F6D4F]/10 hover:bg-[#2F6D4F]/20 font-semibold px-6 py-3 rounded-md transition-colors">
              {selectedLang === "sw" ? "Uza Bidhaa" : "Sell Item"}
            </Link>
          </div>

          {/* App Download Badges — huelekeza kwenye waitlist, app haijazinduliwa bado */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Link to="/waitlist" className="flex items-center gap-2 border border-white/20 rounded-md px-4 py-2 hover:bg-white/5 transition-colors">
              <svg width="20" height="20" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.7,19.2L4.3,35.3c0,0,0,0,0,0c0.5,1.7,2.1,3,4,3c0.8,0,1.5-0.2,2.1-0.6l0,0l17.4-9.9L19.7,19.2z" fill="#EA4335" />
                <path d="M35.3,16.4L35.3,16.4l-7.5-4.3l-8.4,7.4l8.5,8.3l7.5-4.2c1.3-0.7,2.2-2.1,2.2-3.6C37.5,18.5,36.6,17.1,35.3,16.4z" fill="#FBBC04" />
                <path d="M4.3,4.7C4.2,5,4.2,5.4,4.2,5.8v28.5c0,0.4,0,0.7,0.1,1.1l16-15.7L4.3,4.7z" fill="#4285F4" />
                <path d="M19.8,20l8-7.9L10.5,2.3C9.9,1.9,9.1,1.7,8.3,1.7c-1.9,0-3.6,1.3-4,3c0,0,0,0,0,0L19.8,20z" fill="#34A853" />
              </svg>
              <span className="text-xs text-left">
                <span className="block text-white/50 text-[10px]">{selectedLang === "sw" ? "Pakua kwenye" : "Download on"}</span>
                <span className="block font-semibold text-white">Google Play</span>
              </span>
            </Link>
            <Link to="/waitlist" className="flex items-center gap-2 border border-white/20 rounded-md px-4 py-2 hover:bg-white/5 transition-colors">
              <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M16.7 1.3c.1 1-.3 2-.9 2.8-.6.8-1.7 1.4-2.7 1.3-.1-1 .4-2 1-2.7.6-.8 1.7-1.3 2.6-1.4Z" />
                <path d="M20.9 17c-.5 1.1-.7 1.6-1.3 2.6-.9 1.4-2.1 3.1-3.6 3.1-1.3 0-1.7-.9-3.5-.9s-2.2.9-3.5.9c-1.5 0-2.6-1.5-3.5-2.9C3.2 17 2.5 13 3.6 10.5c.7-1.6 2-2.6 3.4-2.6 1.3 0 2.2.9 3.3.9 1.1 0 1.7-.9 3.5-.9 1.3 0 2.7.7 3.7 1.9-3.2 1.8-2.7 6.5.4 7.2Z" />
              </svg>
              <span className="text-xs text-left">
                <span className="block text-white/50 text-[10px]">{selectedLang === "sw" ? "Pakua kwenye" : "Download on"}</span>
                <span className="block font-semibold text-white">App Store</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* STATS SECTION */}
      {/* ============================================================ */}
      <section className="bg-[#0D1524] text-white py-8">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl md:text-3xl font-bold text-[#E8A33D]">5,000+</p>
            <p className="text-white/50 text-xs md:text-sm mt-1">{selectedLang === "sw" ? "Wauzaji" : "Sellers"}</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold text-[#E8A33D]">10,000+</p>
            <p className="text-white/50 text-xs md:text-sm mt-1">{selectedLang === "sw" ? "Mali" : "Properties"}</p>
          </div>
          <div>
            <p className="text-2xl md:text-3xl font-bold text-[#E8A33D]">2,500+</p>
            <p className="text-white/50 text-xs md:text-sm mt-1">{selectedLang === "sw" ? "Mikataba" : "Deals"}</p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* WHY SOKOMKONONI - Centered */}
      {/* ============================================================ */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 text-center">
            {selectedLang === "sw" ? "Kwa nini SokoMkononi?" : "Why SokoMkononi?"}
          </h2>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto text-center">
            {selectedLang === "sw" ? "Jukwaa salama na la kuaminika la kununua na kuuza mali nchini Tanzania." : "A safe and trusted platform for buying and selling property in Tanzania."}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-[#F5F3EC] rounded-xl">
            <div className="w-16 h-16 bg-[#E8A33D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.8">
                <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-800 text-center">{selectedLang === "sw" ? "Salama na Inaaminika" : "Safe & Trusted"}</h3>
            <p className="text-gray-600 text-sm mt-2 text-center">{selectedLang === "sw" ? "Kila muamala unathibitishwa na timu yetu kwa usalama wa pande zote." : "Every transaction is verified by our team for all parties' safety."}</p>
          </div>
          <div className="text-center p-6 bg-[#F5F3EC] rounded-xl">
            <div className="w-16 h-16 bg-[#2F6D4F]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="1.8">
                <rect x="7" y="2" width="10" height="20" rx="2" strokeLinejoin="round" />
                <path d="M11 18h2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-800 text-center">{selectedLang === "sw" ? "Upatikanaji Rahisi" : "Easy Access"}</h3>
            <p className="text-gray-600 text-sm mt-2 text-center">{selectedLang === "sw" ? "Pata mali yoyote popote ulipo nchini Tanzania kupitia app yetu." : "Find any property anywhere in Tanzania through our app."}</p>
          </div>
          <div className="text-center p-6 bg-[#F5F3EC] rounded-xl">
            <div className="w-16 h-16 bg-[#C1502E]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#C1502E" strokeWidth="1.8">
                <circle cx="8" cy="15" r="6" />
                <circle cx="15" cy="8" r="6" />
                <path d="M8 15h1M15 8v1" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-800 text-center">{selectedLang === "sw" ? "Bei za Ushindani" : "Competitive Prices"}</h3>
            <p className="text-gray-600 text-sm mt-2 text-center">{selectedLang === "sw" ? "Pata bei nzuri na uwezo wa kujadili moja kwa moja na wauzaji." : "Get great prices and negotiate directly with sellers."}</p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PROPERTY CAROUSEL */}
      {/* ============================================================ */}
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{selectedLang === "sw" ? "Mali Zinazotrendi" : "Trending Properties"}</h2>
          <a href="#" className="text-[#E8A33D] text-sm font-semibold hover:underline">{selectedLang === "sw" ? "Tazama Zote →" : "View All →"}</a>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1,2,3,4,5,6].map((item) => (
            <div key={item} className="min-w-[200px] sm:min-w-[240px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-shrink-0 hover:shadow-md transition-shadow">
              {/* Placeholder ya picha — badilisha na <img src=... /> halisi baadaye */}
              <div className="h-40 bg-[#F5F3EC] flex items-center justify-center">
                <span className="text-4xl">🏠</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-sm truncate">Nyumba ya Vyumba 3, Mbezi</h3>
                <p className="text-[#E8A33D] font-bold text-lg">TSh 85,000,000</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-500 text-xs">📍 Dar es Salaam</span>
                  <span className="text-green-600 text-xs font-medium">● Available</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* CATEGORIES */}
      {/* ============================================================ */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{selectedLang === "sw" ? "Kategoria Maarufu" : "Popular Categories"}</h2>
          <Link to="/kategoria" className="text-[#E8A33D] text-sm font-semibold hover:underline">{selectedLang === "sw" ? "Tazama Yote →" : "View All →"}</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat, index) => (
            <Link key={index} to={`/kategoria/${cat.name.toLowerCase()}`} className="bg-[#F5F3EC] rounded-lg p-4 text-center hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CategoryIcon type={cat.icon} />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">{cat.name}</h3>
              <p className="text-xs text-gray-500">{cat.count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* TESTIMONIALS - Centered */}
      {/* ============================================================ */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
          {selectedLang === "sw" ? "Wanachosema Wadau Wetu" : "What Our Customers Say"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#F5F3EC] rounded-xl p-6">
            <p className="text-gray-700 text-sm leading-relaxed text-center">"{selectedLang === "sw" ? "Nilinunua nyumba yangu kwa urahisi kupitia SokoMkononi. Mchakato wote ulikuwa rahisi na salama." : "I bought my house easily through SokoMkononi. The whole process was simple and secure."}"</p>
            <p className="text-[#E8A33D] font-semibold mt-3 text-sm text-center">— Mary, Dar es Salaam</p>
          </div>
          <div className="bg-[#F5F3EC] rounded-xl p-6">
            <p className="text-gray-700 text-sm leading-relaxed text-center">"{selectedLang === "sw" ? "Nimeuza magari matatu kwa mwezi mmoja pekee! Jukwaa hili limebadilisha biashara yangu." : "I've sold three cars in just one month! This platform has transformed my business."}"</p>
            <p className="text-[#E8A33D] font-semibold mt-3 text-sm text-center">— Juma, Arusha</p>
          </div>
          <div className="bg-[#F5F3EC] rounded-xl p-6">
            <p className="text-gray-700 text-sm leading-relaxed text-center">"{selectedLang === "sw" ? "Nilipata kiwanja bora kwa bei nzuri. Nashukuru SokoMkononi kwa uwazi wao." : "I found a great plot at a good price. Thank you SokoMkononi for your transparency."}"</p>
            <p className="text-[#E8A33D] font-semibold mt-3 text-sm text-center">— Fatima, Mwanza</p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ - Centered, accordion inayofunguka mtumiaji akibofya */}
      {/* ============================================================ */}
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
          {selectedLang === "sw" ? "Maswali Yanayoulizwa Sana" : "Frequently Asked Questions"}
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-[#F5F3EC]/60 transition-colors"
                >
                  <h3 className="font-semibold text-gray-800">{selectedLang === "sw" ? faq.q.sw : faq.q.en}</h3>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 text-[#E8A33D] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  style={{ display: "grid" }}
                >
                  <div className="overflow-hidden">
                    <p className="text-gray-600 text-sm px-4 pb-4">{selectedLang === "sw" ? faq.a.sw : faq.a.en}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <Footer selectedLang={selectedLang} />

      {/* ============================================================ */}
      {/* BOTTOM NAVIGATION - MOBILE ONLY */}
      {/* ============================================================ */}
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;

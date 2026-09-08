import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("sw");

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
    // TODO: Save language preference to localStorage or backend
    localStorage.setItem("preferred_language", selectedLang);
    setLangOpen(false);
    // Reload page to apply language change
    window.location.reload();
  };

  const currentLang = languages.find(l => l.code === selectedLang);

  return (
    <header className="sticky top-0 z-50 bg-night/95 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-7 h-7 rounded-md bg-gold flex items-center justify-center text-night font-bold text-sm">
            S
          </span>
          <span className="text-sand font-bold text-lg tracking-tight">Soko</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
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

        <div className="hidden md:flex items-center gap-4">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="text-sand/60 hover:text-sand text-sm font-medium border border-white/15 rounded-md px-3 py-1.5 transition-colors flex items-center gap-1.5"
            >
              <span>{currentLang?.native || "Kiswahili"}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${langOpen ? "rotate-180" : ""}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {langOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-night-2 border border-white/10 rounded-lg shadow-xl py-2">
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

          <Link
            to="/login"
            className="text-sand/80 hover:text-sand text-sm font-medium"
          >
            Ingia
          </Link>
          <Link
            to="/register?intent=sell"
            className="bg-gold hover:bg-gold-dark text-night font-semibold text-sm px-4 py-2 rounded-md transition-colors"
          >
            Weka Tangazo
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden text-sand p-1.5"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {mobileOpen ? (
              <path d="M5 5L17 17M17 5L5 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <>
                <path d="M3 6H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M3 11H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M3 16H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-night px-5 py-5">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="text-sand/80 text-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 mt-5 pt-5 border-t border-white/10">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center text-sand/80 text-sm font-medium border border-white/15 rounded-md py-2.5"
            >
              Ingia
            </Link>
            <Link
              to="/register?intent=sell"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center bg-gold text-night font-semibold text-sm rounded-md py-2.5"
            >
              Weka Tangazo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

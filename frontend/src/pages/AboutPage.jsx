import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Navbar from "../components/Navbar.jsx";

export default function AboutSafetyPage() {
  const { t, lang } = useLanguage();
  const [adsDropdownOpen, setAdsDropdownOpen] = useState(false);

  // Values from About page
  const values = [
    { title: t("about_value1_title"), body: t("about_value1_body") },
    { title: t("about_value2_title"), body: t("about_value2_body") },
    { title: t("about_value3_title"), body: t("about_value3_body") },
  ];

  // Matangazo menu items
  const adMenuItems = [
    { label: "Matangazo Mapya", link: "/matangazo/mapya" },
    { label: "Matangazo ya Ofa", link: "/matangazo/ofa" },
    { label: "Matangazo Yaliyothibitishwa", link: "/matangazo/yaliyothibitishwa" },
    { label: "Matangazo ya Haraka", link: "/matangazo/haraka" },
    { label: "Matangazo Yote", link: "/matangazo/yote" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================================ */}
      {/* NAVBAR */}
      {/* ============================================================ */}
      <Navbar />

      {/* ============================================================ */}
      {/* HERO SECTION - About */}
      {/* ============================================================ */}
      <section className="bg-[#101A2E] text-white py-14 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("about_heading")}</h1>
        <p className="text-white/70 mt-3 max-w-xl mx-auto">{t("about_subtext")}</p>
      </section>

      {/* ============================================================ */}
      {/* MISSION SECTION */}
      {/* ============================================================ */}
      <section className="py-14 px-4 max-w-3xl mx-auto text-center">
        <p className="text-gray-700 leading-relaxed">{t("about_mission")}</p>
      </section>

      {/* ============================================================ */}
      {/* VALUES SECTION - From About */}
      {/* ============================================================ */}
      <section className="pb-14 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
          {lang === "sw" ? "Thamani Zetu" : "Our Values"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <div key={i} className="text-center p-6 bg-[#F5F3EC] rounded-xl">
              <h3 className="font-bold text-lg text-gray-800">{v.title}</h3>
              <p className="text-gray-600 text-sm mt-2">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* DIVIDER */}
      {/* ============================================================ */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="border-t border-gray-200"></div>
      </div>

      {/* ============================================================ */}
      {/* MATANGAZO SECTION - Badala ya Usalama */}
      {/* ============================================================ */}
      <section className="py-14 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#E8A33D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {lang === "sw" ? "Matangazo" : "Advertisements"}
          </h2>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto">
            {lang === "sw" 
              ? "Chagua aina ya tangazo unalotaka kuona" 
              : "Choose the type of advertisement you want to see"}
          </p>
        </div>

        {/* Dropdown ya Matangazo */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <button
              onClick={() => setAdsDropdownOpen(!adsDropdownOpen)}
              className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-5 py-3 text-gray-700 hover:border-[#E8A33D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8A33D] focus:border-transparent"
            >
              <span className="font-medium">
                {lang === "sw" ? "Chagua Aina ya Tangazo" : "Select Ad Type"}
              </span>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${adsDropdownOpen ? "rotate-180" : ""}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {adsDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50">
                {adMenuItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.link}
                    onClick={() => setAdsDropdownOpen(false)}
                    className="block px-5 py-3 text-gray-700 hover:bg-[#F5F3EC] hover:text-[#E8A33D] transition-colors border-b border-gray-100 last:border-0"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Info ya ziada */}
          <div className="mt-6 p-5 border border-[#E8A33D]/30 bg-[#F5F3EC] rounded-xl text-center">
            <p className="text-gray-600 text-sm">
              {lang === "sw" 
                ? "💡 Bonyeza dropdown ili uchague aina ya matangazo unayotaka kuona." 
                : "💡 Click the dropdown to select the type of ads you want to see."}
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BOTTOM NAVIGATION - MOBILE ONLY */}
      {/* ============================================================ */}
      <BottomNav />

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <Footer selectedLang={lang} />
    </div>
  );
}

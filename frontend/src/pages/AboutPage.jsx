import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx"; // Ongeza hii

export default function AboutSafetyPage() {
  const { t, lang } = useLanguage();

  // Values from About page
  const values = [
    { title: t("about_value1_title"), body: t("about_value1_body") },
    { title: t("about_value2_title"), body: t("about_value2_body") },
    { title: t("about_value3_title"), body: t("about_value3_body") },
  ];

  // Tips from Safety page
  const tips = [
    { title: t("safety_tip1_title"), body: t("safety_tip1_body") },
    { title: t("safety_tip2_title"), body: t("safety_tip2_body") },
    { title: t("safety_tip3_title"), body: t("safety_tip3_body") },
    { title: t("safety_tip4_title"), body: t("safety_tip4_body") },
  ];

  return (
    <div className="min-h-screen bg-white">
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
      {/* SAFETY SECTION */}
      {/* ============================================================ */}
      <section className="py-14 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#E8A33D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.8">
              <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{t("safety_heading")}</h2>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto">{t("safety_subtext")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {tips.map((tip, i) => (
            <div key={i} className="p-6 bg-[#F5F3EC] rounded-xl">
              <h3 className="font-bold text-gray-800">{tip.title}</h3>
              <p className="text-gray-600 text-sm mt-2">{tip.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 border border-[#C1502E]/30 bg-[#C1502E]/5 rounded-xl">
          <p className="text-gray-700 text-sm">{t("safety_report_note")}</p>
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

import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Navbar from "../components/Navbar.jsx";

export default function AboutSafetyPage() {
  const { t, lang } = useLanguage();

  // Values from About page - pamoja na SVG icons
  const values = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      bgColor: "bg-[#E8A33D]/20",
      title: t("about_value1_title"),
      body: t("about_value1_body"),
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      bgColor: "bg-[#2F6D4F]/20",
      title: t("about_value2_title"),
      body: t("about_value2_body"),
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C1502E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ),
      bgColor: "bg-[#C1502E]/20",
      title: t("about_value3_title"),
      body: t("about_value3_body"),
    },
  ];

  // Safety Tips - pamoja na SVG icons
  const tips = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      ),
      title: t("safety_tip1_title"),
      body: t("safety_tip1_body"),
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      title: t("safety_tip2_title"),
      body: t("safety_tip2_body"),
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C1502E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      ),
      title: t("safety_tip3_title"),
      body: t("safety_tip3_body"),
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
      title: t("safety_tip4_title"),
      body: t("safety_tip4_body"),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <Navbar />

      {/* HERO SECTION - About */}
      <section className="bg-[#101A2E] text-white py-14 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("about_heading")}</h1>
        <p className="text-white/70 mt-3 max-w-xl mx-auto">{t("about_subtext")}</p>
      </section>

      {/* MISSION SECTION */}
      <section className="py-14 px-4 max-w-3xl mx-auto text-center">
        <p className="text-gray-700 leading-relaxed">{t("about_mission")}</p>
      </section>

      {/* VALUES SECTION */}
      <section className="pb-14 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
          {t("about_values_heading")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <div
              key={i}
              className="text-center p-6 bg-[#F5F3EC] rounded-xl flex flex-col items-center"
            >
              <div
                className={`w-16 h-16 ${v.bgColor} rounded-full flex items-center justify-center mb-4`}
              >
                {v.icon}
              </div>
              <h3 className="font-bold text-lg text-gray-800">{v.title}</h3>
              <p className="text-gray-600 text-sm mt-2">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="border-t border-gray-200"></div>
      </div>

      {/* SAFETY SECTION - id="usalama" */}
      <section id="usalama" className="py-14 px-4 max-w-4xl mx-auto">
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

        {/* Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {tips.map((tip, i) => (
            <div key={i} className="p-6 bg-[#F5F3EC] rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  {tip.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{tip.title}</h3>
                  <p className="text-gray-600 text-sm mt-2">{tip.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ALERT - REPORT NOTE */}
        <div className="mt-8 p-5 rounded-xl border-2 border-red-300 bg-red-50 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800 mb-1">
              {t("safety_report_heading")}
            </p>
            <p className="text-red-700 text-sm leading-relaxed">{t("safety_report_note")}</p>
          </div>
        </div>
      </section>

      <BottomNav />
      <Footer selectedLang={lang} />
    </div>
  );
}

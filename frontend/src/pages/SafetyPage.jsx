import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function SafetyPage() {
  const { t } = useLanguage();

  const tips = [
    { title: t("safety_tip1_title"), body: t("safety_tip1_body") },
    { title: t("safety_tip2_title"), body: t("safety_tip2_body") },
    { title: t("safety_tip3_title"), body: t("safety_tip3_body") },
    { title: t("safety_tip4_title"), body: t("safety_tip4_body") },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#101A2E] text-white py-14 px-4 text-center">
        <div className="w-14 h-14 bg-[#E8A33D]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.8">
            <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">{t("safety_heading")}</h1>
        <p className="text-white/70 mt-3 max-w-xl mx-auto">{t("safety_subtext")}</p>
      </section>

      <section className="py-14 px-4 max-w-4xl mx-auto">
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

      <div className="pb-16 text-center">
        <Link to="/" className="text-[#E8A33D] font-semibold text-sm hover:underline">
          {t("waitlist_back_home")}
        </Link>
      </div>
    </div>
  );
}

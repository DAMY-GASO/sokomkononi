import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx"; // Ongeza hii

export default function AboutPage() {
  const { t } = useLanguage();

  const values = [
    { title: t("about_value1_title"), body: t("about_value1_body") },
    { title: t("about_value2_title"), body: t("about_value2_body") },
    { title: t("about_value3_title"), body: t("about_value3_body") },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#101A2E] text-white py-14 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("about_heading")}</h1>
        <p className="text-white/70 mt-3 max-w-xl mx-auto">{t("about_subtext")}</p>
      </section>

      <section className="py-14 px-4 max-w-3xl mx-auto text-center">
        <p className="text-gray-700 leading-relaxed">{t("about_mission")}</p>
      </section>

      <section className="pb-16 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <div key={i} className="text-center p-6 bg-[#F5F3EC] rounded-xl">
              <h3 className="font-bold text-lg text-gray-800">{v.title}</h3>
              <p className="text-gray-600 text-sm mt-2">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="pb-16 text-center">
        <Link to="/" className="text-[#E8A33D] font-semibold text-sm hover:underline">
          {t("waitlist_back_home")}
        </Link>
      </div>

      {/* Ongeza Footer hapa */}
      <Footer />
    </div>
  );
}

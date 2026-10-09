// ============================================================
// NotFoundPage.jsx — real 404 (replaces catch-all → HomePage)
// ============================================================
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function NotFoundPage() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          <p className="text-6xl font-bold text-[#E8A33D] mb-4">404</p>
          <h1 className="text-2xl font-bold text-primary mb-2">
            {t("Ukurasa haupatikani", "Page not found")}
          </h1>
          <p className="text-sm text-secondary mb-8">
            {t(
              "Ukurasa uliotafuta haupo. Unaweza kurudi nyumbani au kutafuta mali.",
              "The page you're looking for doesn't exist. Go home or browse listings."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-lg bg-[#E8A33D] text-[#101A2E] font-semibold text-sm"
            >
              {t("Nyumbani", "Home")}
            </Link>
            <Link
              to="/tafuta"
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-primary font-semibold text-sm"
            >
              {t("Tafuta Mali", "Browse")}
            </Link>
          </div>
        </div>
      </main>
      <Footer selectedLang={lang} />
      <BottomNav />
    </div>
  );
}

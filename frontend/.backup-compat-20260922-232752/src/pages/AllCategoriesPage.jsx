// ============================================================
// AllCategoriesPage.jsx
// Ukurasa wa umma unaoonyesha KATEGORIA ZOTE zilizo hai
// (si maarufu tu). Route sahihi: "/kategoria" (bila :slug).
// "/kategoria/:slug" inabaki kwa CategoryPage.jsx (kategoria moja).
// Bilingual kamili + KILA KITU CENTERED.
// ============================================================

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { usePublicListings } from "../config/listingsStore.js";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../config/categoriesStore.js";
import { COLORS } from "./dashboard/components/shared";

function t(lang, sw, en) {
  return lang === "sw" ? sw : en;
}

export default function AllCategoriesPage() {
  const { lang } = useLanguage();
  const allCategories = useActiveCategories();
  const allListings = usePublicListings();

  // Hesabu mali ngapi (live) kwa kila category — live
  const categoriesWithCount = useMemo(() => {
    return allCategories.map((cat) => ({
      ...cat,
      count: allListings.filter(
        (l) => l.category === cat.key && l.status === "live"
      ).length,
    }));
  }, [allCategories, allListings]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ============================================================ */}
      {/* HEADER — CENTERED */}
      {/* ============================================================ */}
      <section className="dark-surface bg-[#101A2E] text-white py-12 sm:py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#E8A33D]/20 flex items-center justify-center mx-auto mb-4">
          <LayoutGrid size={28} color={COLORS.gold} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">
          {t(lang, "Kategoria Zote", "All Categories")}
        </h1>
        <p className="text-white/70 text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
          {t(
            lang,
            "Vinjari mali kwa kategoria — nyumba, viwanja, magari, biashara na zaidi.",
            "Browse properties by category — houses, plots, cars, businesses and more."
          )}
        </p>
      </section>

      {/* ============================================================ */}
      {/* GRID YA KATEGORIA ZOTE */}
      {/* ============================================================ */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        {categoriesWithCount.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">
            {t(lang, "Hakuna kategoria kwa sasa", "No categories yet")}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categoriesWithCount.map((cat) => {
              const Icon = getCategoryIcon(cat.iconKey);
              const hasPhoto = Boolean(cat.imageUrl);
              const label = cat.label?.[lang] || cat.label?.sw || cat.key;
              return (
                <Link
                  key={cat.key}
                  to={`/kategoria/${cat.key}`}
                  className="bg-white rounded-xl overflow-hidden text-center border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group"
                >
                  <div className="h-32 sm:h-36 bg-[#F5F3EC] flex items-center justify-center overflow-hidden">
                    {hasPhoto ? (
                      <img
                        src={cat.imageUrl}
                        alt={label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Icon
                        size={40}
                        className="text-[#E8A33D] group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="h-card">
                      {label}
                    </h3>
                    <p className="text-body-sm text-secondary mt-0.5">
                      {cat.count} {t(lang, "mali", "listings")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Footer selectedLang={lang} />
      <BottomNav />
    </div>
  );
}

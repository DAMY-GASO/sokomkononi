import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCategoryIcon } from "../../config/categoriesStore.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function CategoryBento({ categories = [], listings = [] }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  if (!categories.length) return null;
  // Uniform grid: 2 columns on mobile, 3 columns from sm up → 6 tiles in 2 rows
  const top = categories.slice(0, 6);

  return (
    <section className="py-12 sm:py-16 bg-sand">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-[11px] font-semibold text-gold-ink uppercase tracking-[0.18em]">
            {t("Kategoria", "Categories")}
          </span>
          <h2 className="text-xl sm:text-3xl font-bold text-primary tracking-tight mt-2">
            {t("Vinjari kwa Kategoria", "Shop by Category")}
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-2 max-w-xl mx-auto">
            {t(
              "Chagua aina ya mali unayoitafuta — nyumba, viwanja, magari na zaidi.",
              "Pick the type of property you're looking for — houses, land, cars and more."
            )}
          </p>
        </div>

        {/* Uniform 3x2 grid — every tile has the same size */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {top.map((cat) => {
            const Icon = getCategoryIcon(cat.iconKey);
            const count = listings.filter(
              (l) => l.category === cat.key && l.status === "live"
            ).length;
            const label = cat.label?.[lang] || cat.label?.sw || cat.key;
            return (
              <Link
                key={cat.key}
                to={`/kategoria/${cat.key}`}
                className="group relative overflow-hidden rounded-2xl aspect-[4/3]
                           bg-white border border-sandline
                           dark:bg-night-deep dark:border-transparent"
              >
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={label}
                    className="absolute inset-0 w-full h-full object-cover opacity-100 dark:opacity-60 transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-sand dark:bg-night-deep">
                    <Icon size={48} color="#FEA406" className="opacity-60 dark:opacity-70" />
                  </div>
                )}

                {/* Light: soft white gradient for dark-text readability */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 dark:hidden"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.0) 30%, rgba(255,255,255,0.92) 100%)",
                  }}
                />
                {/* Dark: navy gradient */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 hidden dark:block"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(1,15,58,0.15) 0%, rgba(1,15,58,0.85) 100%)",
                  }}
                />

                <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-5">
                  <h3 className="text-base sm:text-lg font-bold leading-tight text-primary dark:text-white">
                    {label}
                  </h3>
                  <p className="text-[11px] sm:text-xs mt-1 text-secondary dark:text-white/60">
                    {count} {t("mali", count === 1 ? "listing" : "listings")}
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold transition-all group-hover:gap-2.5 text-gold-ink dark:text-[#FEA406]">
                    {t("Tazama", "Shop Now")} <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useActiveCategories, getCategoryIcon } from "../../config/categoriesStore.js";
import ListingCardShop from "./ListingCardShop.jsx";

export default function FeaturedSection({
  gridCols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  title,
  subtitle,
  badge,
  listings = [],
  viewAllTo = "/mali-zote",
  viewAllLabel,
  emptyText,
  savedIds = [],
  onToggleSave,
}) {
  const { lang } = useLanguage();
  const categories = useActiveCategories();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <header className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            {badge && (
              <span className="text-[11px] font-semibold text-gold-ink uppercase tracking-[0.18em]">
                {badge}
              </span>
            )}
            <h2 className="text-xl sm:text-3xl font-bold text-primary tracking-tight mt-1.5">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-secondary mt-1.5 max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
          <Link
            to={viewAllTo}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gold-ink hover:gap-2.5 transition-all"
          >
            <span className="hidden sm:inline">{viewAllLabel || t("Ona Zote", "View All")}</span>
            <ArrowRight size={14} />
          </Link>
        </header>

        {listings.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted">
            {emptyText || t("Hakuna mali kwa sasa.", "No listings yet.")}
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-3 sm:gap-5`}>
            {listings.map((l) => {
              const cat = categories.find((c) => c.key === l.category);
              const Icon = getCategoryIcon(cat?.iconKey || "Home");
              return (
                <ListingCardShop
                  key={l.id}
                  listing={l}
                  category={cat}
                  Icon={Icon}
                  lang={lang}
                  isSaved={savedIds.includes(l.id)}
                  onToggleSave={onToggleSave}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

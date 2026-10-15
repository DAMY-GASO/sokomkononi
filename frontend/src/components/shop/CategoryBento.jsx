import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCategoryIcon } from "../../config/categoriesStore.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Section, SectionHeader } from "../ui";

export default function CategoryBento({ categories = [], listings = [] }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  if (!categories.length) return null;
  const top = categories.slice(0, 6);

  return (
    <Section className="bg-[color:rgb(var(--c-page))]">
      <SectionHeader
        align="center"
        eyebrow={t("Kategoria", "Categories")}
        title={t("Vinjari kwa Kategoria", "Shop by Category")}
        subtitle={t(
          "Chagua aina ya mali unayoitafuta — nyumba, viwanja, magari na zaidi.",
          "Pick the type of property you're looking for — houses, land, cars and more."
        )}
      />

      {/* Responsive grid: 2 cols on phone → 3 on tablet → 3 on desktop
          (aspect-[4/3] keeps tiles readable at every width) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 stagger">
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
              className="group relative block w-full min-w-0 overflow-hidden rounded-2xl
                         aspect-[5/4] sm:aspect-[4/3]
                         bg-card border border-[color:rgb(var(--c-hairline))] hover-lift"
            >
              {/* Background layer */}
              {cat.imageUrl ? (
                <img
                  src={cat.imageUrl}
                  alt={label}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-[color:rgb(var(--c-page))]">
                  <Icon
                    size={48}
                    strokeWidth={1.4}
                    className="text-[color:rgb(var(--c-gold))] opacity-60 sm:opacity-70"
                  />
                </div>
              )}

              {/* Gradient scrim — same in light + dark because the
                  bottom of the tile always has white text over it */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
              />

              {/* Text content — clipped, never overlaps the icon */}
              <div className="relative z-10 flex h-full min-w-0 flex-col justify-end p-3.5 sm:p-5">
                <h3 className="line-clamp-2 text-[14px] font-bold leading-tight text-white sm:text-[16px]">
                  {label}
                </h3>
                <p className="mt-1 truncate text-[11px] text-white/75 sm:text-xs">
                  {count} {t("mali", count === 1 ? "listing" : "listings")}
                </p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[rgb(254,164,6)] transition-all group-hover:gap-2.5 sm:text-xs">
                  {t("Tazama", "Shop Now")} <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useActiveCategories, getCategoryIcon } from "../../config/categoriesStore.js";
import ListingCardShop from "./ListingCardShop.jsx";
import { Section, SectionHeader, Button } from "../ui";

export default function FeaturedSection({ gridCols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4", title, subtitle, badge, listings = [], viewAllTo = "/mali-zote", viewAllLabel, emptyText, savedIds = [], onToggleSave }) {
  const { lang } = useLanguage();
  const categories = useActiveCategories();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  return (
    <Section>
      <SectionHeader
        eyebrow={badge} title={title} subtitle={subtitle}
        action={<Button to={viewAllTo} variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>{viewAllLabel || t("Ona Zote", "View All")}</Button>}
      />
      {listings.length === 0 ? (
        <div className="text-center py-14 text-sm text-muted">{emptyText || t("Hakuna mali kwa sasa.", "No listings yet.")}</div>
      ) : (
        <div className={`grid ${gridCols} gap-3 sm:gap-4 stagger`}>
          {listings.map((l) => {
            const cat = categories.find((c) => c.key === l.category);
            const Icon = getCategoryIcon(cat?.iconKey || "Home");
            return <ListingCardShop key={l.id} listing={l} category={cat} Icon={Icon} lang={lang} isSaved={savedIds.includes(l.id)} onToggleSave={onToggleSave} />;
          })}
        </div>
      )}
    </Section>
  );
}

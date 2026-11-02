import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useActiveCategories, getCategoryIcon } from "../../config/categoriesStore.js";
import ListingCardShop from "./ListingCardShop.jsx";
import { Section, SectionHeader, Button } from "../ui";

export default function SimilarListings({ listings = [], lang }) {
  const categories = useActiveCategories();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  if (listings.length === 0) return null;

  return (
    <Section className="bg-[color:rgb(var(--c-page))]">
      <SectionHeader
        eyebrow={t("Mali Zinazofanana", "Similar Listings")}
        title={t("Mali Nyingine Zinazofanana", "Other Similar Properties")}
        subtitle={t(
          "Mali zilizo kwenye kategoria sawa na unayoiangalia.",
          "Properties in the same category as the one you're viewing."
        )}
        action={
          <Button to="/mali-zote" variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>
            {t("Ona Zote", "View All")}
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 stagger">
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
            />
          );
        })}
      </div>
    </Section>
  );
}
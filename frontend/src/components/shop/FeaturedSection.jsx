import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useActiveCategories, getCategoryIcon } from "../../config/categoriesStore.js";
import ListingCardShop from "./ListingCardShop.jsx";
import { Section, SectionHeader, Button } from "../ui";

export default function FeaturedSection({ gridCols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4", title, subtitle, badge, listings = [], viewAllTo = "/mali-zote", viewAllLabel, emptyText, savedIds = [], onToggleSave, cardBadge = null, onLoadMore, loadingMore = false, hasMore = false, loadMoreLabel }) {
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
        <>
        <div className={`grid ${gridCols} gap-3 sm:gap-4 stagger`}>
          {listings.map((l) => {
            const cat = categories.find((c) => c.key === l.category);
            const Icon = getCategoryIcon(cat?.iconKey || "Home");
            const card = (
              <ListingCardShop listing={l} category={cat} Icon={Icon} lang={lang} isSaved={savedIds.some((x) => String(x) === String(l.id))} onToggleSave={onToggleSave} />
            );
            // Bila badge: muonekano wa awali (Featured, New Arrivals).
            if (!cardBadge) return React.cloneElement(card, { key: l.id });
            // Na badge (mf. Trending): kona ya juu-kushoto kama Advertised.
            return (
              <div key={l.id} className="relative">
                <span className="absolute -top-2 -left-2 z-10 flex items-center gap-1 rounded-md bg-[#FEA406] px-2 py-1 text-[10px] font-bold text-[#011957] shadow-md">
                  {cardBadge.icon}
                  {cardBadge.label}
                </span>
                {card}
              </div>
            );
          })}
        </div>
        {onLoadMore && hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-[#011957] shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)" }}
            >
              {loadingMore ? <Loader2 size={15} className="animate-spin" /> : null}
              {loadMoreLabel || t("Ona Zaidi", "Load More")}
            </button>
          </div>
        )}
        </>
      )}
    </Section>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Megaphone } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useActiveCategories, getCategoryIcon } from "../../config/categoriesStore.js";
import ListingCardShop from "./ListingCardShop.jsx";
import CountdownTimer from "./CountdownTimer.jsx";
import { Section, SectionHeader, Button } from "../ui";
import { COLORS } from "..\..\pages\dashboard\components\shared.js";

export default function AdvertisedSection({
  gridCols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  title, subtitle, badge, listings = [], viewAllTo = "/mali-zote", viewAllLabel, savedIds = [], onToggleSave,
  banners = []
}) {
  const { lang } = useLanguage();
  const categories = useActiveCategories();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const getBanner = (listingId) => banners.find((b) => String(b.listingId) === String(listingId));

  return (
    <Section className="bg-[#F4F7FC] dark:bg-night/20">
      <SectionHeader
        eyebrow={
          <span className="flex items-center gap-1.5 text-[#0062FD]">
            <Megaphone size={14} /> {badge}
          </span>
        }
        title={title}
        subtitle={subtitle}
        action={<Button to={viewAllTo} variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>{viewAllLabel || t("Ona Zote", "View All")}</Button>}
      />
      {listings.length === 0 ? (
        <div className="text-center py-14 text-sm text-muted">{t("Hakuna matangazo kwa sasa.", "No advertised listings yet.")}</div>
      ) : (
        <div className={`grid ${gridCols} gap-3 sm:gap-4 stagger`}>
          {listings.map((l) => {
            const cat = categories.find((c) => c.key === l.category);
            const Icon = getCategoryIcon(cat?.iconKey || "Home");
            const banner = getBanner(l.id);
            const expiresAt = banner?.expiresAt ? new Date(banner.expiresAt).getTime() : null;

            return (
              <div key={l.id} className="relative">
                {/* Badge ya bluu: Imetangazwa */}
                <span
                  className="absolute -top-2 -left-2 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold shadow-md ring-1 ring-white/20"
                  style={{ background: COLORS.royal, color: "#FFFFFF" }}
                >
                  <Megaphone size={10} /> {t("Imetangazwa", "Advertised")}
                </span>
                <ListingCardShop
                  listing={l}
                  category={cat}
                  Icon={Icon}
                  lang={lang}
                  // Zima badge ya ndani ya kadi (Inavuma) isichanganye na hii
                  hidePromoBadge
                  isSaved={savedIds.some((x) => String(x) === String(l.id))}
                  onToggleSave={onToggleSave}
                />
                {expiresAt && (
                  <div className="mt-2 flex justify-center">
                    <CountdownTimer targetMs={expiresAt} tone="auto" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

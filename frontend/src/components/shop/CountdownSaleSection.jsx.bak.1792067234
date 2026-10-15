import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";
import CountdownTimer from "./CountdownTimer.jsx";
import ListingCardShop from "./ListingCardShop.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../../config/categoriesStore.js";

function endOfWeekMs() {
  const now = new Date();
  const day = now.getDay();
  const daysToSunday = (7 - day) % 7 || 7;
  const end = new Date(now);
  end.setDate(now.getDate() + daysToSunday);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

export default function CountdownSaleSection({
  listings = [],
  savedIds = [],
  onToggleSave,
}) {
  const { lang } = useLanguage();
  const categories = useActiveCategories();
  const target = useMemo(endOfWeekMs, []);
  const t = (sw, en) => (lang === "sw" ? sw : en);

  if (!listings.length) return null;

  return (
    <section className="relative py-12 sm:py-16 overflow-hidden bg-card border-y border-hairline">
      {/* Dark mode: blue gradient overlay */}
      <div
        aria-hidden="true"
        className="hidden dark:block absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #011957 0%, #042475 45%, #0062FD 100%)",
        }}
      />
      {/* Dark mode: dotted pattern */}
      <div
        aria-hidden="true"
        className="hidden dark:block absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-6 sm:mb-8">
          <div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold
                         bg-royal/10 text-royal
                         dark:bg-white/10 dark:text-white dark:backdrop-blur-sm"
            >
              <Zap size={11} color="#FEA406" fill="#FEA406" />
              {t("Ofa za Wiki Hii", "This Week's Offers")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-3 text-primary dark:text-white">
              {t("Mali Zinazopendekezwa kwa Wiki", "Featured This Week")}
            </h2>
            <p className="text-xs sm:text-sm mt-1.5 text-secondary dark:text-white/65">
              {t(
                "Pata fursa kwa bei nafuu kabla muda haujaisha.",
                "Grab the deals before time runs out."
              )}
            </p>
          </div>
          <CountdownTimer targetMs={target} />
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {listings.slice(0, 4).map((l) => {
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

        <div className="flex justify-center mt-8">
          <Link
            to="/mali-zote?sort=popular"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-[#011957]"
            style={{
              background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)",
            }}
          >
            {t("Ona Ofa Zote", "Shop All Deals")} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

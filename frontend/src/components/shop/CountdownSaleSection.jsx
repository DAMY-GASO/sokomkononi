import React, { useMemo } from "react";
import { Zap, ArrowRight } from "lucide-react";
import CountdownTimer from "./CountdownTimer.jsx";
import ListingCardShop from "./ListingCardShop.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useActiveCategories, getCategoryIcon } from "../../config/categoriesStore.js";
import { Section, Button } from "../ui";

function endOfWeekMs() {
  const now = new Date();
  const daysToSunday = (7 - now.getDay()) % 7 || 7;
  const end = new Date(now);
  end.setDate(now.getDate() + daysToSunday);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

export default function CountdownSaleSection({ listings = [], savedIds = [], onToggleSave }) {
  const { lang } = useLanguage();
  const categories = useActiveCategories();
  const target = useMemo(endOfWeekMs, []);
  const t = (sw, en) => (lang === "sw" ? sw : en);
  if (!listings.length) return null;
  return (
    <Section className="bg-[color:rgb(var(--c-page))]">
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-[#FEA406]/25 bg-white dark:border-transparent dark:bg-[#011957] dark:surface-night">
        <div className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full blur-3xl opacity-30 dark:opacity-60" style={{ background: "radial-gradient(circle, rgb(254 164 6 / .35), transparent 70%)" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-6 sm:mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold bg-[#FEA406]/15 text-[#8A5A16] dark:bg-white/10 dark:text-white backdrop-blur-sm">
              <Zap size={11} fill="#FEA406" color="#FEA406" />
              {t("Ofa za Wiki Hii", "This Week's Offers")}
            </span>
            <h2 className="text-headline mt-3 text-[color:rgb(var(--text-primary))] dark:text-white">{t("Mali Zinazopendekezwa kwa Wiki", "Featured This Week")}</h2>
            <p className="text-xs sm:text-sm mt-1.5 text-[color:rgb(var(--text-secondary))] dark:text-white/65">{t("Pata fursa kwa bei nafuu kabla muda haujaisha.", "Grab the deals before time runs out.")}</p>
          </div>
          <CountdownTimer targetMs={target} tone="navy" />
        </div>
        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {listings.slice(0, 4).map((l) => {
            const cat = categories.find((c) => c.key === l.category);
            const Icon = getCategoryIcon(cat?.iconKey || "Home");
            return <ListingCardShop key={l.id} listing={l} category={cat} Icon={Icon} lang={lang} isSaved={savedIds.includes(l.id)} onToggleSave={onToggleSave} />;
          })}
        </div>
        <div className="relative flex justify-center mt-8">
          <Button to="/mali-zote?sort=popular" rightIcon={<ArrowRight size={15} />}>{t("Ona Ofa Zote", "Shop All Deals")}</Button>
        </div>
      </div>
    </Section>
  );
}

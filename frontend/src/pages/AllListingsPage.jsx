// ============================================================
// AllListingsPage.jsx — /mali-zote
// ✅ FIX: Category matching inatumia safeStr, hakuna object
// ✅ NEW: Sort By (Mpya, Bei, Maarufu)
// ============================================================
import React, { useMemo, useState } from "react";
import { Home as HomeIcon, ChevronDown } from "lucide-react"; // <-- Ongeza ChevronDown
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { usePublicListings } from "../config/listingsStore.js";
import ListingCard from "../components/ListingCard.jsx";
import { rankListings, currentRotationSeed } from "../config/listingRanking.js";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../config/categoriesStore.js";

const PAGE_SIZE = 12;

export default function AllListingsPage() {
  const { lang } = useLanguage();
  const allListings = usePublicListings();
  const activeCategories = useActiveCategories();

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [rotationSeed] = useState(currentRotationSeed);
  const [sortBy, setSortBy] = useState("newest"); // <-- Mpya

  // Mali zenye search priority (Leading Fee) zinatangulia na kuzunguka kwa haki;
  // zingine zinafuata kwa mpangilio wa mpya → za zamani.
  const liveListings = useMemo(
    () =>
      rankListings(
        allListings.filter(
          (l) => l.status === "live" || l.status === "reserved"
        ),
        rotationSeed
      ),
    [allListings, rotationSeed]
  );

  // ✅ Sort By
  const sortedListings = useMemo(() => {
    const arr = [...liveListings];
    if (sortBy === "price_low") return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === "price_high") return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sortBy === "popular") return arr.sort((a, b) => (b.views || 0) - (a.views || 0));
    // newest (default)
    return arr.sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));
  }, [liveListings, sortBy]);

  const visibleListings = sortedListings.slice(0, visibleCount);
  const hasMore = visibleCount < sortedListings.length;

  const categoryByKey = useMemo(() => {
    const map = new Map();
    activeCategories.forEach((c) => {
      const key = c.key || c.slug;
      if (key) map.set(String(key), c);
    });
    return map;
  }, [activeCategories]);

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <section className="py-8 sm:py-10 px-4 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            {t("Mali Zote", "All Listings")}
          </h1>
          <p className="text-sm text-secondary mt-2">
            {t(
              `Mali ${liveListings.length} zinazopatikana sasa hivi.`,
              `${liveListings.length} listings available right now.`
            )}
          </p>
        </div>

        {/* ✅ Sort By Toolbar */}
        <div className="mb-4 flex items-center justify-end gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="cursor-pointer appearance-none rounded-lg border border-[color:rgb(var(--c-hairline))] bg-card px-3 py-2 pr-8 text-sm font-medium text-primary outline-none focus:border-[color:rgb(var(--c-gold))]"
            >
              <option value="newest">{t("Mpya Kwanza", "Newest First")}</option>
              <option value="price_low">{t("Bei: Chini → Juu", "Price: Low → High")}</option>
              <option value="price_high">{t("Bei: Juu → Chini", "Price: High → Low")}</option>
              <option value="popular">{t("Maarufu", "Popular")}</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
            />
          </div>
        </div>

        {sortedListings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-hairline p-10 sm:p-16 text-center bg-page">
            <HomeIcon size={44} className="mx-auto text-muted mb-3" />
            <p className="text-sm text-secondary">
              {t("Hakuna mali kwa sasa.", "No listings yet.")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4">
              {visibleListings.map((l) => {
                const cat = categoryByKey.get(String(l.category));
                const Icon = getCategoryIcon(cat?.iconKey || "Home");
                return (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    category={cat}
                    Icon={Icon}
                    lang={lang}
                  />
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() =>
                    setVisibleCount((prev) => prev + PAGE_SIZE)
                  }
                  className="px-6 py-2.5 rounded-xl border border-hairline text-sm font-semibold text-primary hover:bg-page transition-colors"
                >
                  {t("Onyesha Zaidi", "Load More")}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer selectedLang={lang} />
      <BottomNav />
    </div>
  );
}
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Home as HomeIcon } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { usePublicListings } from "../config/listingsStore.js";
import ListingCard from "../components/ListingCard.jsx";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../config/categoriesStore.js";

const PAGE_SIZE = 12;

export default function AllListingsPage() {
  const { lang, setLang } = useLanguage();
  const allListings = usePublicListings();
  const activeCategories = useActiveCategories();

  // Navbar inatarajia categories zenye `count` (kama HomePage.jsx
  // inavyozitengeneza) — tunahesabu hapa ili muundo ulingane.
  const categories = useMemo(
    () =>
      activeCategories.map((cat) => ({
        ...cat,
        count: allListings.filter((l) => l.category === cat.key).length,
      })),
    [activeCategories, allListings]
  );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // Listings zinazoonekana kwa umma — live au reserved (sawa na
  // kigezo kinachotumika kwenye "Trending" ya HomePage.jsx).
  const liveListings = useMemo(
    () =>
      allListings.filter(
        (l) => l.status === "live" || l.status === "reserved"
      ),
    [allListings]
  );

  const visibleListings = liveListings.slice(0, visibleCount);
  const hasMore = visibleCount < liveListings.length;

  return (
    <div className="min-h-screen bg-white">
      <Navbar lang={lang} setLang={setLang} categories={categories} />

      <section className="py-8 sm:py-10 px-4 max-w-7xl mx-auto">
        {/* HEADER */}
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

        {/* GRID */}
        {liveListings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 sm:p-16 text-center bg-sand">
            <HomeIcon size={44} className="mx-auto text-muted mb-3" />
            <p className="text-sm text-secondary">
              {t("Hakuna mali kwa sasa.", "No listings yet.")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4">
              {visibleListings.map((l) => {
                const cat = categories.find((c) => c.key === l.category);
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

            {/* LOAD MORE */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() =>
                    setVisibleCount((prev) => prev + PAGE_SIZE)
                  }
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-primary hover:bg-sand transition-colors"
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

// ============================================================
// AllListingsPage.jsx — /mali-zote
// ✅ FIX: Category matching inatumia safeStr, hakuna object
// ============================================================
import React, { useMemo, useState } from "react";
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
  const { lang } = useLanguage();
  const allListings = usePublicListings();
  const activeCategories = useActiveCategories();

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ✅ FIX: Hakuna tena `categories` prop kwa Navbar (Navbar inachukua
  //    yenyewe kutoka useActiveCategories + usePublicListings).
  //    Hii inaepuka mismatch ya `l.category === cat.key`.

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const liveListings = useMemo(
    () =>
      allListings.filter(
        (l) => l.status === "live" || l.status === "reserved"
      ),
    [allListings]
  );

  const visibleListings = liveListings.slice(0, visibleCount);
  const hasMore = visibleCount < liveListings.length;

  // ✅ FIX: category lookup kwa key (string)
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

        {liveListings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 sm:p-16 text-center bg-page">
            <HomeIcon size={44} className="mx-auto text-muted mb-3" />
            <p className="text-sm text-secondary">
              {t("Hakuna mali kwa sasa.", "No listings yet.")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4">
              {visibleListings.map((l) => {
                // ✅ FIX: l.category ni STRING (slug) — sio object
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
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-primary hover:bg-page transition-colors"
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
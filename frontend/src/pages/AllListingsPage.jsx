import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Home as HomeIcon } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { usePublicListings } from "../config/listingsStore.js";
import { formatTZS } from "./dashboard/components/shared.js";
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
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-10 sm:p-16 text-center bg-[#F5F3EC]">
            <HomeIcon size={44} className="mx-auto text-muted mb-3" />
            <p className="text-sm text-secondary">
              {t("Hakuna mali kwa sasa.", "No listings yet.")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleListings.map((l) => {
                const cat = categories.find((c) => c.key === l.category);
                const Icon = getCategoryIcon(cat?.iconKey || "Home");
                // Prefer the listing's own photo; fall back to the
                // category photo; then to the category icon.
                const listingPhoto =
                  l.imageUrl ||
                  (Array.isArray(l.photos) && l.photos[0]) ||
                  null;
                const img = listingPhoto || cat?.imageUrl || null;
                const region = l.region || l.location;

                return (
                  <Link
                    key={l.id}
                    to={`/mali/${l.id}`}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-square bg-[#F5F3EC] flex items-center justify-center overflow-hidden">
                      {img ? (
                        <img
                          src={img}
                          alt={l.title}
                          className="absolute inset-0 block w-full h-full object-cover object-center"
                          loading="lazy"
                        />
                      ) : (
                        <Icon size={40} className="text-[#E8A33D]" />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-primary text-sm truncate">
                        {l.title}
                      </h3>
                      <p className="text-[#E8A33D] font-bold text-sm sm:text-base mt-0.5">
                        {formatTZS(l.price)}
                      </p>
                      {region && (
                        <p className="text-secondary text-xs mt-1 truncate">
                          📍 {region}
                        </p>
                      )}
                      {l.status === "reserved" && (
                        <span className="inline-block mt-1.5 text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {t("Reserved", "Reserved")}
                        </span>
                      )}
                    </div>
                  </Link>
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
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-primary hover:bg-[#F5F3EC] transition-colors"
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

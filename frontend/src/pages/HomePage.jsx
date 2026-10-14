import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../config/authStore.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import BannerHero from "../components/BannerHero.jsx";
import NewsletterStrip from "../components/NewsletterStrip.jsx";
import HeroSection from "../components/shop/HeroSection.jsx";
import TrustBar from "../components/shop/TrustBar.jsx";
import FeaturedSection from "../components/shop/FeaturedSection.jsx";
import CategoryBento from "../components/shop/CategoryBento.jsx";
import CountdownSaleSection from "../components/shop/CountdownSaleSection.jsx";
import TestimonialsSection from "../components/shop/TestimonialsSection.jsx";
import NewsletterCTA from "../components/shop/NewsletterCTA.jsx";
import { usePublicListings } from "../config/listingsStore.js";
import { usePopularCategories } from "../config/categoriesStore.js";
import { useContent } from "../config/contentStore.js";
import { useSavedIds, toggleSaved } from "../config/savedStore.js";

export default function HomePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const publicListings = usePublicListings();
  const popularCategories = usePopularCategories();
  const content = useContent();
  const savedIds = useSavedIds();

  const handleBuyNow = () => {
    if (user) navigate("/dashboard/buyer");
    else navigate("/register?intent=buy");
  };

  const handleSellNow = () => {
    if (user) navigate("/dashboard/post");
    else navigate("/register?intent=sell");
  };

  const handleSearch = (q) => {
    const trimmed = String(q || "").trim();
    if (trimmed) {
      navigate(`/tafuta?tafuta=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/tafuta");
    }
  };

  const handleToggleSave = (id) => toggleSaved(id);

  const liveListings = useMemo(
    () => publicListings.filter((l) => l.status === "live"),
    [publicListings]
  );

  const featured = useMemo(
    () =>
      liveListings
        .slice()
        .sort((a, b) => {
          const aScore = (a.isBoosted ? 2 : 0) + (a.views || 0) / 1000;
          const bScore = (b.isBoosted ? 2 : 0) + (b.views || 0) / 1000;
          return bScore - aScore;
        })
        .slice(0, 8),
    [liveListings]
  );

  const newArrivals = useMemo(
    () =>
      liveListings
        .slice()
        .sort((a, b) => {
          const at = new Date(a.postedAt || 0).getTime();
          const bt = new Date(b.postedAt || 0).getTime();
          return bt - at;
        })
        .slice(0, 6),
    [liveListings]
  );

  const boosted = useMemo(
    () => liveListings.filter((l) => l.isBoosted).slice(0, 4),
    [liveListings]
  );

  // Marketing stats — placeholder until backend exposes /public-stats/.
  // Never present fabricated counts as authoritative; keep as strings
  // and label them as approximate on the UI if needed.
  const stats = useMemo(
    () => ({ listings: "500+", users: "140k+", rating: "4.7" }),
    []
  );

  const testimonials = content?.testimonials || [];

  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <BannerHero />

      <HeroSection
        stats={stats}
        onBuyNow={handleBuyNow}
        onSellNow={handleSellNow}
        onSearch={handleSearch}
      />

      <TrustBar />

      <FeaturedSection
        badge={lang === "sw" ? "Zinazopendekezwa" : "Featured"}
        title={lang === "sw" ? "Mali Zinazopendekezwa" : "Featured Listings"}
        subtitle={
          lang === "sw"
            ? "Chaguo letu lililochaguliwa la mali zinazovutia."
            : "Our hand-picked selection of trending properties."
        }
        listings={featured}
        viewAllTo="/mali-zote"
        savedIds={savedIds}
        onToggleSave={handleToggleSave}
      />

      <CategoryBento categories={popularCategories} listings={liveListings} />

      <FeaturedSection
        gridCols="grid-cols-2 sm:grid-cols-3"
        badge={lang === "sw" ? "Mali Mpya" : "Just Added"}
        title={lang === "sw" ? "Mali Zilizoongezwa Hivi Karibuni" : "New Arrivals"}
        subtitle={
          lang === "sw"
            ? "Mali zilizowekwa hivi karibuni na wauzaji wetu."
            : "Fresh listings from our trusted sellers."
        }
        listings={newArrivals}
        viewAllTo="/mali-zote"
        viewAllLabel={lang === "sw" ? "Ona Zote" : "See All"}
        savedIds={savedIds}
        onToggleSave={handleToggleSave}
      />

      {boosted.length > 0 && (
        <CountdownSaleSection
          listings={boosted}
          savedIds={savedIds}
          onToggleSave={handleToggleSave}
        />
      )}

      <TestimonialsSection testimonials={testimonials} />

      <NewsletterCTA />

      <NewsletterStrip variant="compact" />

      <Footer selectedLang={lang} />
      <BottomNav />
    </div>
  );
}

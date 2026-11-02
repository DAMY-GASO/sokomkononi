import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Search, MessageSquare, KeyRound } from "lucide-react";

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
import AdvertisedSection from "../components/shop/AdvertisedSection.jsx";
import CategoryBento from "../components/shop/CategoryBento.jsx";
import TestimonialsSection from "../components/shop/TestimonialsSection.jsx";
import { usePublicListings } from "../config/listingsStore.js";
import { usePopularCategories } from "../config/categoriesStore.js";
import { useContent } from "../config/contentStore.js";
import { useSavedIds, toggleSaved } from "../config/savedStore.js";
import { useActiveBannerAds } from "../config/bannerAdsStore.js"; // <-- Muhimu kwa Advertised
import { Section, SectionHeader, Card } from "../components/ui";
import {
  ROTATION_WINDOW_MS,
  isLeadingListing,
  leadingTier,
  boostTier,
  rotateByTier,
} from "../config/listingRanking.js";

// ============================================================
// HELPERS — vigezo vya kila sehemu ya homepage
// ============================================================

function listingCategoryKeys(l) {
  const c = l?.category ?? l?.categoryId ?? l?.category_id ?? l?.categorySlug;
  const out = [];
  const push = (v) => {
    if (v === null || v === undefined || v === "") return;
    out.push(String(v).toLowerCase());
  };
  if (c && typeof c === "object") {
    push(c.id);
    push(c.slug);
    push(c.name);
  } else {
    push(c);
  }
  push(l?.categorySlug);
  return out;
}

function categoryKeys(cat) {
  const out = [];
  [cat?.id, cat?.slug, cat?.key, cat?.name].forEach((v) => {
    if (v !== null && v !== undefined && v !== "") out.push(String(v).toLowerCase());
  });
  return out;
}

const DEDUPE_SECTIONS = true; // mali moja isionekane kwenye sehemu zaidi ya moja

function ViewAllCategories({ lang }) {
  return (
    <div className="mx-auto flex max-w-7xl justify-center px-4 pb-10 pt-2 sm:px-6">
      <Link
        to="/kategoria"
        className="inline-flex items-center gap-2 rounded-full bg-[#FEA406] px-6 py-3 text-sm font-bold text-[#011957] shadow-sm transition-transform hover:scale-[1.02]"
      >
        {lang === "sw" ? "Ona Kategoria Zote" : "View All Categories"}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function HowItWorks() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const steps = [
    { Icon: Search, title: t("Tafuta", "Search"), body: t("Chagua mali inayokufaa kwa kutumia vichujio — kategoria, mkoa, bei.", "Find the right property using filters — category, region, price.") },
    { Icon: MessageSquare, title: t("Wasiliana", "Connect"), body: t("Zungumza na muuzaji moja kwa moja kwenye Deal Room salama.", "Talk to the seller directly inside a secure Deal Room.") },
    { Icon: KeyRound, title: t("Kamilisha", "Complete"), body: t("Fanya ukaguzi, lipa kwa usalama, na pokea mali yako.", "Inspect, pay securely, and receive your property.") },
  ];
  return (
    <Section>
      <SectionHeader
        align="center"
        eyebrow={t("Jinsi Inavyofanya Kazi", "How it works")}
        title={t("Hatua Tatu Rahisi", "Three simple steps")}
        subtitle={t("Mchakato mzima umebuniwa uwe rahisi na salama.", "The entire process is designed to be simple and safe.")}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {steps.map(({ Icon, title, body }, idx) => (
          <Card key={title} className="relative p-7">
            <div className="mb-5 flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(1,25,87,0.06)] text-primary dark:bg-white/[0.06]"><Icon size={22} /></span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FEA406] text-[#011957] text-sm font-black tabular-nums shadow-sm">0{idx + 1}</span>
            </div>
            <h3 className="mb-2 text-section">{title}</h3>
            <p className="text-body-sm leading-relaxed text-secondary">{body}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const publicListings = usePublicListings();
  const popularCategories = usePopularCategories();
  const content = useContent();
  const savedIds = useSavedIds();
  const activeBanners = useActiveBannerAds(); // <-- Banners halisi za matangazo
  const [rotationSeed] = useState(() => Math.floor(Date.now() / ROTATION_WINDOW_MS));

  const handleBuyNow = () => { if (user) navigate("/dashboard/buyer"); else navigate("/register?intent=buy"); };
  const handleSellNow = () => { if (user) navigate("/dashboard/post"); else navigate("/register?intent=sell"); };
  const handleSearch = (q) => { const trimmed = String(q || "").trim(); navigate(trimmed ? `/tafuta?tafuta=${encodeURIComponent(trimmed)}` : "/tafuta"); };
  const handleToggleSave = (id, listing) => toggleSaved(id, listing);

  const liveListings = useMemo(() => publicListings.filter((l) => l.status === "live"), [publicListings]);

  // 1) FEATURED (Leading) - Mali 8
  const featured = useMemo(
    () => rotateByTier(liveListings.filter(isLeadingListing), leadingTier, rotationSeed, 8),
    [liveListings, rotationSeed]
  );

  // 2) ADVERTISED (kutoka banners) - Mali 8
  const advertised = useMemo(() => {
    const used = new Set(featured.map((l) => l.id));
    
    // Pata listingId zote zilizo kwenye banners hai
    const bannerListingIds = activeBanners
      .filter((b) => b.listingId)
      .map((b) => String(b.listingId));
    
    // Chuja listings zenye banners, bila kurudia
    const pool = liveListings.filter(
      (l) => bannerListingIds.includes(String(l.id)) && (!DEDUPE_SECTIONS || !used.has(l.id))
    );

    // Panga kwa tarehe ya kuisha (zinazokaribia kuisha kwanza)
    return pool
      .sort((a, b) => {
        const aBanner = activeBanners.find((b) => String(b.listingId) === String(a.id));
        const bBanner = activeBanners.find((b) => String(b.listingId) === String(b.id));
        const aExp = aBanner?.expiresAt ? new Date(aBanner.expiresAt).getTime() : 0;
        const bExp = bBanner?.expiresAt ? new Date(bBanner.expiresAt).getTime() : 0;
        return aExp - bExp;
      })
      .slice(0, 8);
  }, [liveListings, featured, activeBanners]);

  // 3) TRENDING (Boost) - Mali 8
  const boosted = useMemo(() => {
    const used = new Set();
    if (DEDUPE_SECTIONS) {
      featured.forEach((l) => used.add(l.id));
      advertised.forEach((l) => used.add(l.id));
    }
    const pool = liveListings.filter(
      (l) => (l.isBoosted || l.boostedUntil || l.boostExpiresAt) && (!DEDUPE_SECTIONS || !used.has(l.id))
    );
    return rotateByTier(pool, boostTier, rotationSeed + 1, 8);
  }, [liveListings, featured, advertised, rotationSeed]);

  // 4) NEW ARRIVALS - Mali 8
  const newArrivals = useMemo(() => {
    const used = new Set();
    if (DEDUPE_SECTIONS) {
      featured.forEach((l) => used.add(l.id));
      advertised.forEach((l) => used.add(l.id));
      boosted.forEach((l) => used.add(l.id));
    }
    return liveListings
      .filter((l) => !used.has(l.id))
      .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0))
      .slice(0, 8);
  }, [liveListings, featured, advertised, boosted]);

  // 5) Categories → zenye mali tu, zenye mali nyingi zinatangulia
  const categoriesWithListings = useMemo(() => {
    const counts = new Map();
    (popularCategories || []).forEach((c, idx) => {
      const keys = new Set(categoryKeys(c));
      let n = 0;
      liveListings.forEach((l) => {
        if (listingCategoryKeys(l).some((k) => keys.has(k))) n += 1;
      });
      if (n > 0) counts.set(c, { n, idx });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1].n - a[1].n || a[1].idx - b[1].idx)
      .map(([c]) => c);
  }, [popularCategories, liveListings]);

  const testimonials = content?.testimonials || [];

  return (
    <div className="page-clip min-h-screen bg-page">
      <Navbar categories={popularCategories} />
      <main>
        <BannerHero />
        <HeroSection onBuyNow={handleBuyNow} onSellNow={handleSellNow} onSearch={handleSearch} />
        <TrustBar />
        
        {/* 1. FEATURED LISTINGS */}
        {featured.length > 0 && (
          <FeaturedSection
            badge={lang === "sw" ? "Zinazopendekezwa" : "Featured"}
            title={lang === "sw" ? "Mali Zinazopendekezwa" : "Featured Listings"}
            subtitle={lang === "sw" ? "Mali zenye kipaumbele cha utafutaji kutoka kwa wauzaji wetu." : "Priority listings from our sellers."}
            listings={featured} viewAllTo="/mali-zote" savedIds={savedIds} onToggleSave={handleToggleSave}
          />
        )}

        {/* 2. CATEGORIES */}
        {categoriesWithListings.length > 0 && (
          <>
            <CategoryBento categories={categoriesWithListings} listings={liveListings} />
            <ViewAllCategories lang={lang} />
          </>
        )}

        {/* 3. ADVERTISED LISTINGS (kutoka banners) */}
        {advertised.length > 0 && (
          <AdvertisedSection
            badge={lang === "sw" ? "Matangazo" : "Advertised"}
            title={lang === "sw" ? "Matangazo ya Washirika" : "Sponsored Listings"}
            subtitle={lang === "sw" ? "Mali zilizolipiwa kuonekana hapa." : "Promoted listings from our partners."}
            listings={advertised} 
            viewAllTo="/mali-zote?aina=tangazo" 
            savedIds={savedIds} 
            onToggleSave={handleToggleSave}
            banners={activeBanners} // <-- Pitisha banners kwa countdown
          />
        )}

        {/* 4. HOW IT WORKS */}
        <HowItWorks />

        {/* 5. TRENDING LISTINGS (Boost) */}
        {boosted.length > 0 && (
          <FeaturedSection
            badge={lang === "sw" ? "Inavuma" : "Trending"}
            title={lang === "sw" ? "Mali Zinazovuma" : "Trending Listings"}
            subtitle={lang === "sw" ? "Mali zilizolipiwa Boost na zinapata umaarufu." : "Boosted listings gaining popularity."}
            listings={boosted} viewAllTo="/mali-zote" savedIds={savedIds} onToggleSave={handleToggleSave}
          />
        )}

        {/* 6. NEW ARRIVALS */}
        <FeaturedSection
          gridCols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          badge={lang === "sw" ? "Mali Mpya" : "Just Added"}
          title={lang === "sw" ? "Mali Zilizoongezwa Hivi Karibuni" : "New Arrivals"}
          subtitle={lang === "sw" ? "Mali zilizowekwa hivi karibuni na wauzaji wetu." : "Fresh listings from our trusted sellers."}
          listings={newArrivals} viewAllTo="/mali-zote"
          viewAllLabel={lang === "sw" ? "Ona Zote" : "See All"}
          savedIds={savedIds} onToggleSave={handleToggleSave}
        />

        {/* 7. TESTIMONIALS & NEWSLETTER */}
        <TestimonialsSection testimonials={testimonials} />
        <NewsletterStrip variant="compact" />
      </main>
      <Footer selectedLang={lang} />
      <BottomNav />
    </div>
  );
}
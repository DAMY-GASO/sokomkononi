import React, { useMemo } from "react";
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
import CategoryBento from "../components/shop/CategoryBento.jsx";
import CountdownSaleSection from "../components/shop/CountdownSaleSection.jsx";
import TestimonialsSection from "../components/shop/TestimonialsSection.jsx";
import { usePublicListings } from "../config/listingsStore.js";
import { usePopularCategories } from "../config/categoriesStore.js";
import { useContent } from "../config/contentStore.js";
import { useSavedIds, toggleSaved } from "../config/savedStore.js";
import { Section, SectionHeader, Card } from "../components/ui";

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

  const handleBuyNow = () => { if (user) navigate("/dashboard/buyer"); else navigate("/register?intent=buy"); };
  const handleSellNow = () => { if (user) navigate("/dashboard/post"); else navigate("/register?intent=sell"); };
  const handleSearch = (q) => { const trimmed = String(q || "").trim(); navigate(trimmed ? `/tafuta?tafuta=${encodeURIComponent(trimmed)}` : "/tafuta"); };
  const handleToggleSave = (id, listing) => toggleSaved(id, listing);

  const liveListings = useMemo(() => publicListings.filter((l) => l.status === "live"), [publicListings]);
  const featured = useMemo(() => liveListings.slice().sort((a, b) => { const aS = (a.isBoosted ? 2 : 0) + (a.views || 0) / 1000; const bS = (b.isBoosted ? 2 : 0) + (b.views || 0) / 1000; return bS - aS; }).slice(0, 8), [liveListings]);
  const newArrivals = useMemo(() => liveListings.slice().sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0)).slice(0, 6), [liveListings]);
  const boosted = useMemo(() => liveListings.filter((l) => l.isBoosted).slice(0, 4), [liveListings]);
  const stats = useMemo(() => ({ listings: "12K+", users: "140K+", rating: "4.7" }), []);
  const testimonials = content?.testimonials || [];

  return (
    <div className="page-clip min-h-screen bg-page">
      <Navbar categories={popularCategories} />
      <main>
        <BannerHero />
        <HeroSection stats={stats} onBuyNow={handleBuyNow} onSellNow={handleSellNow} onSearch={handleSearch} />
        <TrustBar />
        <FeaturedSection
          badge={lang === "sw" ? "Zinazopendekezwa" : "Featured"}
          title={lang === "sw" ? "Mali Zinazopendekezwa" : "Featured Listings"}
          subtitle={lang === "sw" ? "Chaguo letu lililochaguliwa la mali zinazovutia." : "Our hand-picked selection of trending properties."}
          listings={featured} viewAllTo="/mali-zote" savedIds={savedIds} onToggleSave={handleToggleSave}
        />
        <CategoryBento categories={popularCategories} listings={liveListings} />
        <HowItWorks />
        <FeaturedSection
          gridCols="grid-cols-2 sm:grid-cols-3"
          badge={lang === "sw" ? "Mali Mpya" : "Just Added"}
          title={lang === "sw" ? "Mali Zilizoongezwa Hivi Karibuni" : "New Arrivals"}
          subtitle={lang === "sw" ? "Mali zilizowekwa hivi karibuni na wauzaji wetu." : "Fresh listings from our trusted sellers."}
          listings={newArrivals} viewAllTo="/mali-zote"
          viewAllLabel={lang === "sw" ? "Ona Zote" : "See All"}
          savedIds={savedIds} onToggleSave={handleToggleSave}
        />
        {boosted.length > 0 && <CountdownSaleSection listings={boosted} savedIds={savedIds} onToggleSave={handleToggleSave} />}
        <TestimonialsSection testimonials={testimonials} />
        <NewsletterStrip variant="compact" />
      </main>
      <Footer selectedLang={lang} />
      <BottomNav />
    </div>
  );
}

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../config/authStore.js";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Navbar from "../components/Navbar.jsx";
import PageLoader from "../components/PageLoader.jsx";
import FaqAccordion from "../components/FaqAccordion.jsx";
import { homeFaqs } from "../config/faqsData.js";
import { usePublicListings } from "../config/listingsStore.js";
import { useAppStoreLinks } from "../config/systemSettingsStore.js";
import {
  usePopularCategories,
  getCategoryIcon,
} from "../config/categoriesStore.js";
import { pickLabel } from "../shared/labelUtils.js";

function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

// ============================================================
// ANIMATED TEXT — maelezo yanatembea
// ============================================================
function AnimatedText({ text, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <p
        className="whitespace-nowrap"
        style={{
          animation: "marquee 25s linear infinite",
        }}
      >
        {text}
      </p>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// TYPEWRITER TEXT — maelezo yanajiprinta
// ============================================================
function TypewriterText({ text, speed = 50, className = "" }) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayed("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return (
    <span className={className}>
      {displayed}
      {index < text.length && (
        <span className="inline-block w-0.5 h-6 bg-[#E8A33D] ml-1 animate-pulse" />
      )}
    </span>
  );
}

// ============================================================
// REVEAL — inafichua sehemu kwa mvuto unapo-scroll
// ============================================================
function Reveal({ children, className = "", direction = "up", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const directions = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
    none: "",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${directions[direction]}`
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const { user } = useAuth();

  // === PAGE LOADER ===
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // === Categories kutoka store ===
  const popularCategories = usePopularCategories();
  const allListings = usePublicListings();

  // Hesabu count per category — live
  const categories = useMemo(() => {
    return popularCategories.map((cat) => ({
      ...cat,
      count: allListings.filter((l) => l.category === cat.key).length,
    }));
  }, [popularCategories, allListings]);

  // === Trending listings kutoka store ===
  const trendingProperties = useMemo(() => {
    return [...allListings]
      .filter((l) => l.status === "live" || l.status === "reserved")
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 9)
      .map((l) => {
        const cat = popularCategories.find((c) => c.key === l.category);
        return {
          id: l.id,
          title: l.title,
          region: l.region || l.location,
          price: formatTZS(l.price),
          category: l.category,
          categoryImage: cat?.imageUrl || null,
          categoryIcon: cat?.iconKey || "Home",
        };
      });
  }, [allListings, popularCategories]);

  // Links za apps zinatoka kwenye system settings (admin anaziweka/kuzibadilisha)
  const [appLinks] = useAppStoreLinks();
  const playUrl = (appLinks?.play || "").trim();
  const appStoreUrl = (appLinks?.appstore || "").trim();

  const handleSellNow = () => {
    if (user) navigate("/dashboard/post");
    else navigate("/register?intent=sell");
  };

  const handleBuyNow = () => {
    if (user) navigate("/dashboard/buyer");
    else navigate("/register?intent=buy");
  };


  const testimonials = [
    {
      name: "Mary",
      region: "Dar es Salaam",
      avatar: "/assets/testimonials/marry.jpg",
      quote: {
        sw: "Nilinunua nyumba yangu kwa urahisi kupitia SokoMkononi. Mchakato wote ulikuwa rahisi na salama.",
        en: "I bought my house easily through SokoMkononi. The whole process was simple and secure.",
      },
    },
    {
      name: "Juma",
      region: "Arusha",
      avatar: "/assets/testimonials/juma.jpg",
      quote: {
        sw: "Nimeuza magari matatu kwa mwezi mmoja pekee! Jukwaa hili limebadilisha biashara yangu.",
        en: "I've sold three cars in just one month! This platform has transformed my business.",
      },
    },
    {
      name: "Fatima",
      region: "Mwanza",
      avatar: "/assets/testimonials/fatima.jpg",
      quote: {
        sw: "Nilipata kiwanja bora kwa bei nzuri. Nashukuru SokoMkononi kwa uwazi wao.",
        en: "I found a great plot at a good price. Thank you SokoMkononi for your transparency.",
      },
    },
    {
      name: "David",
      region: "Dodoma",
      avatar: "/assets/testimonials/david.jpg",
      quote: {
        sw: "SokoMkononi imenisaidia kupata wateja wa kuaminika kwa bidhaa zangu za kilimo. Mapato yameongezeka mara mbili!",
        en: "SokoMkononi has helped me find reliable customers for my agricultural products. My income has doubled!",
      },
    },
  ];

  // ============================================================
  // PAGE LOADER
  // ============================================================
  if (pageLoading) {
    return <PageLoader lang={lang} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar lang={lang} setLang={setLang} categories={categories} />

      {/* HERO */}
      <section className="dark-surface bg-[#101A2E] text-white py-12 sm:py-16 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            {lang === "sw" ? "Nunua na Uza Mali kwa Urahisi" : "Buy and Sell Property Easily"}
          </h1>

          <div className="mt-6 max-w-3xl mx-auto min-h-[4rem] sm:min-h-[5rem]">
            <p className="text-white/75 text-lg sm:text-xl md:text-2xl leading-relaxed font-regular">
              <TypewriterText
                text={
                  lang === "sw"
                    ? "SokoMkononi ni jukwaa linalowaunganisha wanunuzi na wauzaji sehemu moja, kwa kurahisisha kutafuta, kuuza na kununua kwa urahisi na kujiamini."
                    : "SokoMkononi is a safe platform that bring together buyers and sellers in one place, for simplifying searches, buying and selling in a simple way confidently."
                }
                speed={40}
              />
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center mt-10 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={handleBuyNow}
              className="bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-bold text-lg sm:text-xl px-8 sm:px-12 py-5 sm:py-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {lang === "sw" ? "Nunua Sasa" : "Buy Now"}
            </button>
            <button
              onClick={handleSellNow}
              className="bg-[#2F6D4F] hover:bg-[#245a41] text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-5 sm:py-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {lang === "sw" ? "Uza Sasa" : "Sell Now"}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-10">
            <a
              href={playUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!playUrl}
              onClick={(e) => { if (!playUrl) e.preventDefault(); }}
              className={`flex items-center gap-2 border border-white/20 rounded-md px-4 py-2 transition-colors ${playUrl ? "hover:bg-white/5" : "opacity-60 cursor-default"}`}
            >
              <svg width="20" height="20" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.7,19.2L4.3,35.3c0,0,0,0,0,0c0.5,1.7,2.1,3,4,3c0.8,0,1.5-0.2,2.1-0.6l0,0l17.4-9.9L19.7,19.2z" fill="#EA4335" />
                <path d="M35.3,16.4L35.3,16.4l-7.5-4.3l-8.4,7.4l8.5,8.3l7.5-4.2c1.3-0.7,2.2-2.1,2.2-3.6C37.5,18.5,36.6,17.1,35.3,16.4z" fill="#FBBC04" />
                <path d="M4.3,4.7C4.2,5,4.2,5.4,4.2,5.8v28.5c0,0.4,0,0.7,0.1,1.1l16-15.7L4.3,4.7z" fill="#4285F4" />
                <path d="M19.8,20l8-7.9L10.5,2.3C9.9,1.9,9.1,1.7,8.3,1.7c-1.9,0-3.6,1.3-4,3c0,0,0,0,0,0L19.8,20z" fill="#34A853" />
              </svg>
              <span className="text-xs text-left">
                <span className="block text-white/50 text-[10px]">
                  {playUrl
                    ? lang === "sw" ? "Pata kwenye" : "Get it on"
                    : lang === "sw" ? "Inakuja hivi karibuni" : "Coming soon"}
                </span>
                <span className="block font-semibold text-white">Google Play</span>
              </span>
            </a>
            <a
              href={appStoreUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!appStoreUrl}
              onClick={(e) => { if (!appStoreUrl) e.preventDefault(); }}
              className={`flex items-center gap-2 border border-white/20 rounded-md px-4 py-2 transition-colors ${appStoreUrl ? "hover:bg-white/5" : "opacity-60 cursor-default"}`}
            >
              <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M16.7 1.3c.1 1-.3 2-.9 2.8-.6.8-1.7 1.4-2.7 1.3-.1-1 .4-2 1-2.7.6-.8 1.7-1.3 2.6-1.4Z" />
                <path d="M20.9 17c-.5 1.1-.7 1.6-1.3 2.6-.9 1.4-2.1 3.1-3.6 3.1-1.3 0-1.7-.9-3.5-.9s-2.2.9-3.5.9c-1.5 0-2.6-1.5-3.5-2.9C3.2 17 2.5 13 3.6 10.5c.7-1.6 2-2.6 3.4-2.6 1.3 0 2.2.9 3.3.9 1.1 0 1.7-.9 3.5-.9 1.3 0 2.7.7 3.7 1.9-3.2 1.8-2.7 6.5.4 7.2Z" />
              </svg>
              <span className="text-xs text-left">
                <span className="block text-white/50 text-[10px]">
                  {appStoreUrl
                    ? lang === "sw" ? "Pata kwenye" : "Get it on"
                    : lang === "sw" ? "Inakuja hivi karibuni" : "Coming soon"}
                </span>
                <span className="block font-semibold text-white">App Store</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center mb-12">
            <h2>
              {lang === "sw" ? "Kwa Nini SokoMkononi?" : "Why SokoMkononi?"}
            </h2>
            <p className="text-body-sm text-secondary mt-4 italic">
              {lang === "sw"
                ? "SokoMkononi — Nunua na Uza kwa Kujiamini"
                : "SokoMkononi — Buy and Sell with Confidence"}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Reveal delay={0}>
            <div className="p-8 bg-[#F5F3EC] rounded-xl text-center flex flex-col items-center h-full">
              <div className="w-16 h-16 bg-[#E8A33D]/20 rounded-full flex items-center justify-center mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11.5 12 4l9 7.5" />
                  <path d="M5 10v10h14V10" />
                  <path d="M9 20v-6h6v6" />
                </svg>
              </div>
              <h3>{lang === "sw" ? "Jukwaa la Kisasa" : "A Modern Platform"}</h3>
              <p className="text-secondary text-body-sm mt-3 leading-relaxed">
                {lang === "sw"
                  ? "Jukwaa la kisasa linalowaunganisha wanunuzi na wauzaji wa mali Tanzania kwa urahisi, uwazi na kuaminiana."
                  : "A modern platform connecting property buyers and sellers in Tanzania with ease, transparency and trust."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-5 text-body-sm font-medium text-[#E8A33D]">
                <span> {lang === "sw" ? "Tafuta" : "Search"}</span>
                <span className="text-muted">|</span>
                <span> {lang === "sw" ? "Ungana" : "Connect"}</span>
                <span className="text-muted">|</span>
                <span> {lang === "sw" ? "Jadiliana" : "Negotiate"}</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="p-8 bg-[#F5F3EC] rounded-xl text-center flex flex-col items-center h-full">
              <div className="w-16 h-16 bg-[#2F6D4F]/20 rounded-full flex items-center justify-center mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="1.8">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3>{lang === "sw" ? "Upatikanaji Rahisi" : "Easy Access"}</h3>
              <p className="text-secondary text-body-sm mt-3 leading-relaxed">
                {lang === "sw"
                  ? "Tafuta na pata mali unayohitaji popote Tanzania, kwa urahisi kupitia SokoMkononi Web Platform na Apps za iOS & Android."
                  : "Find and get the property you need anywhere in Tanzania, easily through the SokoMkononi Web Platform and iOS & Android Apps."}
              </p>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <div className="p-8 bg-[#F5F3EC] rounded-xl text-center flex flex-col items-center h-full">
              <div className="w-16 h-16 bg-[#C1502E]/20 rounded-full flex items-center justify-center mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C1502E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>{lang === "sw" ? "Salama na Inaaminika" : "Safe & Trusted"}</h3>
              <p className="text-secondary text-body-sm mt-3 leading-relaxed">
                {lang === "sw"
                  ? "Tunajenga mazingira ya biashara yenye uwazi na uaminifu, huku watumiaji wakipewa nafasi ya kuthibitisha taarifa kabla ya kufanya muamala."
                  : "We build a transparent and trustworthy trading environment, while giving users the opportunity to verify information before making a transaction."}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TRENDING */}
      <section id="matangazo" className="scroll-mt-16 py-8 px-4 max-w-7xl mx-auto">
        <Reveal>
          <div className="flex justify-between items-center mb-6">
            <h2>{lang === "sw" ? "Mali Zinazotrendi" : "Trending Properties"}</h2>
            <Link to="/mali-zote" className="text-[#E8A33D] text-body-sm font-semibold hover:underline">
              {lang === "sw" ? "Tazama Zote →" : "View All →"}
            </Link>
          </div>
        </Reveal>

        {trendingProperties.length === 0 ? (
          <div className="text-center py-10 text-muted text-body-sm">
            {lang === "sw" ? "Hakuna mali kwa sasa" : "No listings yet"}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {trendingProperties.map((prop, i) => {
              const Icon = getCategoryIcon(prop.categoryIcon);
              const hasPhoto = Boolean(prop.categoryImage);
              return (
                <Reveal
                  key={prop.id}
                  delay={Math.min(i * 70, 350)}
                  direction="up"
                  className="h-full"
                >
                  <Link
                    to={`/mali/${prop.id}`}
                    className="block h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-32 sm:h-40 bg-[#F5F3EC] flex items-center justify-center overflow-hidden">
                      {hasPhoto ? (
                        <img src={prop.categoryImage} alt={prop.title} className="w-full h-full object-cover" />
                      ) : (
                        <Icon size={48} className="text-[#E8A33D]" />
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="h-card truncate">{prop.title}</h3>
                      <p className="text-[#E8A33D] text-price">{prop.price}</p>
                      <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2 mt-2">
                        <span className="text-secondary text-body-sm truncate max-w-full">📍 {prop.region}</span>
                        <span className="text-green-600 text-body-sm font-medium whitespace-nowrap">
                          ● {lang === "sw" ? "Inapatikana" : "Available"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      {/* CATEGORIES */}
      <section id="kategoria" className="scroll-mt-16 py-12 px-4 max-w-7xl mx-auto">
        <Reveal>
          <div className="flex justify-between items-center mb-6">
            <h2>{lang === "sw" ? "Kategoria Maarufu" : "Popular Categories"}</h2>
            <Link to="/kategoria" className="text-[#E8A33D] text-body-sm font-semibold hover:underline">
              {lang === "sw" ? "Tazama Yote →" : "View All →"}
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => {
            const Icon = getCategoryIcon(cat.iconKey);
            const hasPhoto = Boolean(cat.imageUrl);
            // ✅ FIXED: use pickLabel — no more undefined.label crashes
            const catLabel = pickLabel(cat?.label, lang, cat?.key ?? "");
            return (
              <Reveal key={cat.key} delay={Math.min(i * 60, 360)}>
                <Link
                  to={`/kategoria/${cat.key}`}
                  className="block bg-white rounded-lg overflow-hidden text-center border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group"
                >
                  <div className="h-36 sm:h-40 bg-[#F5F3EC] flex items-center justify-center overflow-hidden">
                    {hasPhoto ? (
                      <img
                        src={cat.imageUrl}
                        alt={catLabel}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Icon size={48} className="text-[#E8A33D] group-hover:scale-105 transition-transform" />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="h-card">{catLabel}</h3>
                    <p className="text-body-sm text-secondary">
                      {cat.count} {lang === "sw" ? "mali" : "listings"}
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <Reveal>
          <h2 className="text-center mb-12">
            {lang === "sw" ? "Wanachosema Wadau Wetu" : "What Our Contributors Say"}
          </h2>
        </Reveal>
        <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x snap-mandatory">
          {testimonials.map((item, index) => (
            <Reveal
              key={index}
              delay={index * 100}
              className="min-w-[220px] sm:min-w-[280px] max-w-[240px] sm:max-w-[300px] flex-shrink-0 snap-center"
            >
              <div className="h-64 sm:h-72 bg-[#F5F3EC] rounded-xl p-5 sm:p-6 flex flex-col">
                <img
                  src={item.avatar}
                  alt={item.name}
                  loading="lazy"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover mx-auto mb-3 sm:mb-4 border-2 border-white shadow-sm flex-shrink-0"
                />
                <p
                  className="text-secondary text-body-sm leading-relaxed text-center overflow-hidden flex-1"
                  style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}
                >
                  "{lang === "sw" ? item.quote.sw : item.quote.en}"
                </p>
                <p className="text-[#E8A33D] font-semibold mt-3 text-body-sm text-center flex-shrink-0">
                  — {item.name}, {item.region}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 py-16 px-4 max-w-3xl mx-auto">
        <Reveal>
          <h2 className="text-center mb-4">
            {lang === "sw" ? "Maswali Yanayoulizwa Mara kwa Mara" : "Frequently Asked Questions"}
          </h2>
          <p className="text-secondary text-body-sm text-center mb-12">
            {lang === "sw"
              ? "Majibu ya maswali yanayoulizwa sana kuhusu SokoMkononi"
              : "Answers to the most frequently asked questions about SokoMkononi"}
          </p>
        </Reveal>
        <Reveal>
          <FaqAccordion items={homeFaqs} lang={lang} />
        </Reveal>

        <Reveal>
          <div className="text-center mt-8">
            <Link
              to="/mawasiliano#faq"
              className="inline-block border-2 border-[#E8A33D] text-[#E8A33D] hover:bg-[#E8A33D] hover:text-[#101A2E] font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              {lang === "sw" ? "Ona Zaidi →" : "Explore More →"}
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer selectedLang={lang} />
      <BottomNav />
    </div>
  );
}

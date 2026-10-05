import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../config/authStore.js";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Navbar from "../components/Navbar.jsx";
import PageLoader from "../components/PageLoader.jsx";
import ListingCard from "../components/ListingCard.jsx";
import CategoryTile from "../components/CategoryTile.jsx";
import { usePublicListings } from "../config/listingsStore.js";
import { useAppStoreLinks } from "../config/systemSettingsStore.js";
import {
  usePopularCategories,
  getCategoryIcon,
} from "../config/categoriesStore.js";

// ============================================================
// TypewriterText — elegant with blinking cursor
// ============================================================
function TypewriterText({ text, speed = 30 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;
    if (!text) return;
    const interval = setInterval(() => {
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        setDone(true);
        return;
      }
      const ch = text[indexRef.current];
      indexRef.current += 1;
      setDisplayed((prev) => prev + ch);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="inline">
      {displayed}
      <span
        className={`inline-block w-[2px] h-[1em] align-middle ml-0.5 bg-gold ${
          done ? "animate-blink opacity-60" : "opacity-100"
        }`}
        aria-hidden="true"
      />
    </span>
  );
}

// ============================================================
// Reveal — fade in on scroll
// ============================================================
function Reveal({ children, delay = 0, direction = "up", className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const hidden =
    direction === "up" ? "translate-y-6" :
    direction === "left" ? "-translate-x-6" :
    direction === "right" ? "translate-x-6" : "translate-y-6";

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible
          ? "opacity-100 translate-y-0 translate-x-0"
          : `opacity-0 ${hidden}`
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================================
// ViewAllTile — kitufe cha "Tazama Zote" kinachokaa ndani ya grid.
// Kinajaza nafasi iliyobaki ya safu ya mwisho kwa kila breakpoint,
// ili grid ikamilike kwa usawa (mf. kategoria 11 → kitufe ni ya 12).
// `cols` = idadi ya nguzo kwa kila breakpoint, mf. { base: 2, md: 3, lg: 4 }
// ============================================================
const SPAN_CLASSES = {
  base: { 1: "col-span-1", 2: "col-span-2" },
  sm: { 1: "sm:col-span-1", 2: "sm:col-span-2", 3: "sm:col-span-3" },
  md: { 1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4" },
  lg: {
    1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3",
    4: "lg:col-span-4", 5: "lg:col-span-5", 6: "lg:col-span-6",
  },
};

function fillSpan(itemCount, cols) {
  return Object.keys(SPAN_CLASSES)
    .filter((bp) => cols[bp])
    .map((bp) => SPAN_CLASSES[bp][cols[bp] - (itemCount % cols[bp])])
    .join(" ");
}

// Idadi ya mali zinazotrend kwenye grid; kitufe cha "Tazama Zote" ni nafasi ya mwisho
// (mali 24 + kitufe 1 = nafasi 25).
const TRENDING_LIMIT = 24;
const TRENDING_COLS = { base: 2, md: 3, lg: 4 };
const CATEGORY_COLS = { base: 2, sm: 3, md: 4, lg: 6 };

function ViewAllTile({ to, label, itemCount, cols, delay = 0 }) {
  return (
    <Reveal delay={delay} className={fillSpan(itemCount, cols)}>
      <Link
        to={to}
        className="group flex h-full min-h-[110px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-gold bg-night px-4 py-5 text-center text-base font-semibold leading-tight text-gold transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold hover:text-night hover:shadow-[0_12px_24px_-14px_rgba(254,164,6,0.7)] sm:text-lg"
      >
        <span>{label}</span>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-300 group-hover:translate-x-1"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </Reveal>
  );
}

// ============================================================
// AmbientBackground — extremely subtle moving lights
// ============================================================
function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Very faint diagonal beams */}
      <div
        className="absolute top-[8%] h-px w-[30%] bg-gradient-to-r from-transparent via-gold to-transparent animate-beam"
        style={{ opacity: 0.12 }}
      />
      <div
        className="absolute top-[38%] h-px w-[25%] bg-gradient-to-r from-transparent via-royal to-transparent animate-beam"
        style={{ animationDelay: "-8s", opacity: 0.1 }}
      />
      <div
        className="absolute top-[72%] h-px w-[35%] bg-gradient-to-r from-transparent via-gold to-transparent animate-beam"
        style={{ animationDelay: "-15s", opacity: 0.09 }}
      />

      {/* Barely-there drifting dots */}
      <span
        className="absolute top-[14%] w-1 h-1 rounded-full bg-gold animate-drift-across"
        style={{ opacity: 0.22, animationDuration: "55s" }}
      />
      <span
        className="absolute top-[48%] w-[3px] h-[3px] rounded-full bg-royal animate-drift-across"
        style={{ opacity: 0.18, animationDuration: "68s", animationDelay: "-20s" }}
      />
      <span
        className="absolute top-[76%] w-1 h-1 rounded-full bg-gold animate-drift-across"
        style={{ opacity: 0.2, animationDuration: "62s", animationDelay: "-38s" }}
      />

      {/* Very soft breathing glows */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full animate-glow-breathe"
        style={{ background: "radial-gradient(circle, rgba(254,164,6,0.04) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full animate-glow-breathe"
        style={{ background: "radial-gradient(circle, rgba(0,98,253,0.04) 0%, transparent 70%)", animationDelay: "-4s" }}
      />
    </div>
  );
}

// Loader inaonekana mara moja kila ukurasa unapofunguliwa upya (si kila
// unaporudi Home kupitia navigation ndani ya app).
let homeLoaderShown = false;

// ============================================================
// MAIN
// ============================================================
export default function HomePage() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const { user } = useAuth();
  const publicListings = usePublicListings();
  const popularCategories = usePopularCategories();

  const [openFaq, setOpenFaq] = useState(null);

  // Page loader — inaonekana kwa muda mfupi kabla ya Home kuonyeshwa
  const [ready, setReady] = useState(homeLoaderShown);
  useEffect(() => {
    if (ready) return undefined;
    const id = setTimeout(() => {
      homeLoaderShown = true;
      setReady(true);
    }, 900);
    return () => clearTimeout(id);
  }, [ready]);

  // Links za apps zinatoka kwenye system settings (admin anaziweka/kuzibadilisha)
  const [appLinks] = useAppStoreLinks();
  const playUrl = (appLinks?.play || "").trim();
  const appStoreUrl = (appLinks?.appstore || "").trim();

  const handleBuyNow = () => {
    if (user) navigate("/dashboard/buyer");
    else navigate("/register?intent=buy");
  };

  const handleSellNow = () => {
    if (user) navigate("/dashboard/post");
    else navigate("/register?intent=sell");
  };

  const toggleFaq = (i) => setOpenFaq((prev) => (prev === i ? null : i));

  const categories = useMemo(
    () =>
      popularCategories.map((cat) => ({
        ...cat,
        count: publicListings.filter(
          (l) => l.category === cat.key && l.status === "live"
        ).length,
      })),
    [popularCategories, publicListings]
  );

  const trendingProperties = useMemo(
    () =>
      publicListings
        .filter((l) => l.status === "live")
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, TRENDING_LIMIT),
    [publicListings]
  );

  const testimonials = [
    {
      quote: {
        sw: "Nilinunua nyumba yangu kwa urahisi kupitia SokoMkononi. Mchakato wote ulikuwa rahisi na salama.",
        en: "I bought my house easily through SokoMkononi. The whole process was simple and secure.",
      },
      name: "Mary",
      region: "Dar es Salaam",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    {
      quote: {
        sw: "Nimeuza magari matatu kwa mwezi mmoja pekee! Jukwaa hili limebadilisha biashara yangu.",
        en: "I've sold three cars in just one month! This platform has transformed my business.",
      },
      name: "Juma",
      region: "Arusha",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
      quote: {
        sw: "Nilipata kiwanja bora kwa bei nzuri. Nashukuru SokoMkononi kwa uwazi wao.",
        en: "I found a great plot at a good price. Thank you SokoMkononi for your transparency.",
      },
      name: "Fatima",
      region: "Mwanza",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
  ];

  const faqs = [
    {
      q: { sw: "Je, SokoMkononi ni salama?", en: "Is SokoMkononi safe?" },
      a: {
        sw: "Ndio, SokoMkononi ina mfumo wa uthibitishaji wa wauzaji na wanunuzi, pamoja na mfumo wa malipo salama.",
        en: "Yes, SokoMkononi has a verification system for sellers and buyers, plus a secure payment system.",
      },
    },
    {
      q: { sw: "Ninawezaje kuuza mali yangu?", en: "How can I sell my property?" },
      a: {
        sw: "Bonyeza kitufe cha 'Uza' na ujaze maelezo ya mali yako. Timu yetu itaipitia na kuiweka kwenye soko.",
        en: "Click the 'Sell' button and fill in your property details. Our team will review and list it.",
      },
    },
    {
      q: { sw: "Je, kuna ada ya matumizi?", en: "Are there any fees?" },
      a: {
        sw: "SokoMkononi inatoza ada ndogo baada ya mauzo kukamilika. Hakuna malipo ya awali.",
        en: "SokoMkononi charges a small fee after a sale is completed. No upfront payments.",
      },
    },
    {
      q: { sw: "Ninawezaje kuwasiliana na muuzaji?", en: "How can I contact a seller?" },
      a: {
        sw: "Baada ya kuonyesha nia ya kununua, unaweza kuwasiliana moja kwa moja kwenye 'Deal Room' yetu.",
        en: "After expressing interest to buy, you can communicate directly in our 'Deal Room'.",
      },
    },
  ];

  const whyFeatures = [
    {
      title: lang === "sw" ? "Jukwaa la Kisasa" : "A Modern Platform",
      desc: lang === "sw"
        ? "Linalowaunganisha wanunuzi na wauzaji kwa urahisi, uwazi na kuaminiana."
        : "Connecting buyers and sellers with ease, transparency and trust.",
      accent: "#C97300",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C97300" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z" />
        </svg>
      ),
    },
    {
      title: lang === "sw" ? "Upatikanaji Rahisi" : "Easy Access",
      desc: lang === "sw"
        ? "Tafuta mali popote Tanzania — Web, iOS na Android."
        : "Find properties anywhere in Tanzania — Web, iOS and Android.",
      accent: "#0062FD",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0062FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      ),
    },
    {
      title: lang === "sw" ? "Salama na Inaaminika" : "Safe & Trusted",
      desc: lang === "sw"
        ? "Watumiaji wanathibitishwa kabla ya kufanya muamala wowote."
        : "Users are verified before any transaction takes place.",
      accent: "#C1502E",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C1502E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
  ];

  if (!ready) return <PageLoader lang={lang} />;

  return (
    <div className="min-h-screen bg-white relative">
      <AmbientBackground />

      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar lang={lang} setLang={setLang} categories={categories} />

        {/* ═══════════════════════════════════════════════════ */}
        {/* HERO                                                */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="relative dark-surface bg-night-deep text-white px-4 py-14 sm:py-20 lg:py-24 overflow-hidden min-h-[92svh] sm:min-h-[88svh] flex items-center">
          {/* Aurora orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -top-1/3 -left-1/4 w-[70%] h-[70%] rounded-full opacity-20 blur-[130px] animate-aurora"
              style={{ background: "radial-gradient(circle, #FEA406 0%, transparent 60%)" }}
            />
            <div
              className="absolute -bottom-1/3 -right-1/4 w-[70%] h-[70%] rounded-full opacity-[0.28] blur-[130px] animate-aurora"
              style={{ background: "radial-gradient(circle, #0062FD 0%, transparent 60%)", animationDelay: "-6s" }}
            />
          </div>

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            }}
          />

          {/* Faint local beams */}
          <div
            className="absolute top-[12%] h-px w-[30%] bg-gradient-to-r from-transparent via-gold to-transparent animate-beam"
            style={{ opacity: 0.15 }}
          />
          <div
            className="absolute bottom-[16%] h-px w-[25%] bg-gradient-to-r from-transparent via-royal to-transparent animate-beam"
            style={{ animationDelay: "-10s", opacity: 0.12 }}
          />

          {/* Barely-visible drifting dots (mobile + desktop) */}
          <span
            className="absolute top-[22%] left-[10%] w-1 h-1 rounded-full bg-gold animate-drift-across"
            style={{ opacity: 0.2, animationDuration: "58s" }}
          />
          <span
            className="absolute top-[68%] right-[12%] w-[3px] h-[3px] rounded-full bg-royal animate-drift-across"
            style={{ opacity: 0.18, animationDuration: "72s", animationDelay: "-22s" }}
          />

          {/* Content */}
          <div className="relative w-full max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-full px-4 py-2 mb-7 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
              </span>
              <span className="text-xs sm:text-sm font-medium text-white/80 tracking-wider uppercase">
                {lang === "sw" ? "Soko la Kidijitali la Mali" : "Digital Property Marketplace"}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-bold leading-[1.05] tracking-[-0.02em] animate-fade-in-up text-[clamp(2.25rem,9.5vw,4.5rem)]"
              style={{ animationDelay: "0.1s" }}
            >
              {lang === "sw" ? (
                <>
                  Nunua na Uza{" "}
                  <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                    Mali
                  </span>{" "}
                  kwa Urahisi
                </>
              ) : (
                <>
                  Buy and Sell{" "}
                  <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                    Property
                  </span>{" "}
                  Easily
                </>
              )}
            </h1>

            {/* ── Elegant typewriter subtitle ───────────────── */}
            <div
              className="mt-7 max-w-3xl mx-auto animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <p
                className="text-white/85 leading-[1.65] px-2 min-h-[9rem] sm:min-h-[5.5rem]"
                style={{
                  fontSize: "clamp(1.05rem, 2.6vw, 1.3rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.005em",
                  fontFamily:
                    "'Inter', 'Playfair Display', system-ui, sans-serif",
                }}
              >
                <TypewriterText
                  text={
                    lang === "sw"
                      ? "SokoMkononi ni jukwaa linalowaunganisha wanunuzi na wauzaji sehemu moja, kwa kurahisisha kutafuta, kuuza na kununua kwa urahisi na kujiamini."
                      : "SokoMkononi is a safe platform that brings together buyers and sellers in one place, simplifying searches, buying and selling with confidence."
                  }
                  speed={22}
                />
              </p>
            </div>

            {/* ── Premium CTA buttons ───────────────────────── */}
            <div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mt-10 max-w-md sm:max-w-none mx-auto animate-fade-in-up px-2"
              style={{ animationDelay: "0.35s" }}
            >
              {/* Buy Now — primary gold */}
              <button
                onClick={handleBuyNow}
                className="group relative overflow-hidden inline-flex items-center gap-3 rounded-full
                  bg-gradient-to-r from-gold to-gold-light
                  hover:from-flame hover:to-gold
                  text-night font-semibold
                  pl-2 pr-6 sm:pr-8 py-2.5
                  shadow-[0_8px_30px_-8px_rgba(254,164,6,0.55)]
                  hover:shadow-[0_14px_45px_-8px_rgba(254,164,6,0.75)]
                  transition-all duration-300
                  hover:-translate-y-1 active:translate-y-0"
              >
                <span className="w-12 h-12 rounded-full bg-night/10 group-hover:bg-night/[0.16] flex items-center justify-center shrink-0 transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                <span className="text-lg sm:text-xl whitespace-nowrap">
                  {lang === "sw" ? "Nunua Sasa" : "Buy Now"}
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </button>

              {/* Sell Now — secondary green */}
              <button
                onClick={handleSellNow}
                className="group relative overflow-hidden inline-flex items-center gap-3 rounded-full
                  bg-gradient-to-r from-royal to-royal-dark
                  hover:from-royal-dark hover:to-royal
                  text-white font-semibold
                  pl-2 pr-6 sm:pr-8 py-2.5
                  shadow-[0_8px_30px_-8px_rgba(0,98,253,0.55)]
                  hover:shadow-[0_14px_45px_-8px_rgba(0,98,253,0.7)]
                  transition-all duration-300
                  hover:-translate-y-1 active:translate-y-0"
              >
                <span className="w-12 h-12 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center shrink-0 transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span className="text-lg sm:text-xl whitespace-nowrap">
                  {lang === "sw" ? "Uza Sasa" : "Sell Now"}
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              </button>
            </div>

            {/* ── Elegant trust row ─────────────────────────── */}
            <div
              className="mt-8 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5 gap-y-2 text-xs sm:text-sm text-white/70 animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-royal" />
                {lang === "sw" ? "Malipo Salama" : "Secure Payments"}
              </span>
              <span className="hidden sm:block w-px h-3 bg-white/10" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {lang === "sw" ? "Wauzaji Walioidhinishwa" : "Verified Sellers"}
              </span>
              <span className="hidden sm:block w-px h-3 bg-white/10" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                {lang === "sw" ? "Msaada wa Haraka" : "Fast Support"}
              </span>
            </div>

            {/* App badges */}
            <div
              className="flex flex-wrap gap-2 sm:gap-3 justify-center mt-8 sm:mt-10 animate-fade-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              <a
                href={playUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!playUrl}
                onClick={(e) => { if (!playUrl) e.preventDefault(); }}
                className={`group flex items-center gap-2 sm:gap-3 border border-white/10 hover:border-white/25 rounded-xl px-3.5 sm:px-4 py-2.5 hover:bg-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${!playUrl ? "opacity-60 cursor-default pointer-events-auto" : ""}`}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" aria-hidden="true">
                  <path d="M4.5 3.5c-.3.3-.5.7-.5 1.2v14.6c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L4.6 3.4l-.1.1z" fill="#00D2FF" />
                  <path d="M15.9 15L13 12.1v-.2l2.9-2.9 6.5 3.7c.8.5.8 1.3 0 1.8l-6.5 3.7z" fill="#FFCE00" />
                  <path d="M15.9 15L13 12l-8.4 8.5c.4.4 1 .4 1.7.1L15.9 15" fill="#FF3A44" />
                  <path d="M15.9 9.1L6.3 3.6c-.7-.4-1.3-.3-1.7.1L13 12l2.9-2.9z" fill="#00F076" />
                </svg>
                <span className="text-left">
                  <span className="block text-white/65 text-[11px] sm:text-xs">
                    {playUrl
                      ? lang === "sw" ? "Pata kwenye" : "Get it on"
                      : lang === "sw" ? "Inakuja hivi karibuni" : "Coming soon"}
                  </span>
                  <span className="block font-semibold text-white text-sm sm:text-base">Google Play</span>
                </span>
              </a>
              <a
                href={appStoreUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!appStoreUrl}
                onClick={(e) => { if (!appStoreUrl) e.preventDefault(); }}
                className={`group flex items-center gap-2 sm:gap-3 border border-white/10 hover:border-white/25 rounded-xl px-3.5 sm:px-4 py-2.5 hover:bg-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${!appStoreUrl ? "opacity-60 cursor-default pointer-events-auto" : ""}`}
              >
                <svg viewBox="0 0 384 512" className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 fill-white/90" aria-hidden="true">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.3c0 26.2 4.8 53.3 14.4 81.3 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.8zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
                <span className="text-left">
                  <span className="block text-white/65 text-[11px] sm:text-xs">
                    {appStoreUrl
                      ? lang === "sw" ? "Pata kwenye" : "Get it on"
                      : lang === "sw" ? "Inakuja hivi karibuni" : "Coming soon"}
                  </span>
                  <span className="block font-semibold text-white text-sm sm:text-base">App Store</span>
                </span>
              </a>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 text-white/25 animate-bounce-subtle pointer-events-none">
            <span className="text-[9px] uppercase tracking-[0.25em]">
              {lang === "sw" ? "Sogeza" : "Scroll"}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* WHY — editorial two-column layout                   */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="relative py-16 sm:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              {/* Left column — heading */}
              <Reveal>
                <div className="lg:sticky lg:top-24">
                  <span className="text-[11px] font-semibold text-gold-ink uppercase tracking-[0.2em]">
                    {lang === "sw" ? "Kwa Nini SokoMkononi" : "Why SokoMkononi"}
                  </span>
                  <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-primary mt-4 leading-[1.15] tracking-[-0.015em]">
                    {lang === "sw"
                      ? "Jukwaa lililoundwa kwa ajili yako"
                      : "A platform built for you"}
                  </h2>
                  <p className="text-secondary text-base sm:text-lg mt-5 leading-relaxed max-w-md">
                    {lang === "sw"
                      ? "Tunajenga mazingira salama, yenye uwazi na uaminifu kwa wanunuzi na wauzaji wa mali Tanzania."
                      : "We build a safe, transparent and trustworthy environment for property buyers and sellers in Tanzania."}
                  </p>
                  <Link
                    to="/kuhusu"
                    className="inline-flex items-center gap-2 mt-7 text-gold-ink font-semibold text-sm hover:gap-3 transition-all duration-300 group"
                  >
                    {lang === "sw" ? "Jifunze zaidi" : "Learn more"}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </Reveal>

              {/* Right column — stacked features */}
              <div className="flex flex-col gap-4">
                {whyFeatures.map((f, i) => (
                  <Reveal key={i} delay={i * 120}>
                    <div className="group flex items-start gap-4 sm:gap-5 p-5 sm:p-6 bg-white border border-gray-100 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)]">
                      <div
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                        style={{ background: `${f.accent}10` }}
                      >
                        {f.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-primary text-base sm:text-[17px] leading-tight">
                          {f.title}
                        </h3>
                        <p className="text-secondary text-sm mt-1.5 leading-relaxed">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TRENDING                                            */}
        {/* ═══════════════════════════════════════════════════ */}
        <section id="matangazo" className="scroll-mt-16 py-14 px-4 max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-7">
              <span className="text-[11px] font-semibold text-gold-ink uppercase tracking-[0.2em]">
                {lang === "sw" ? "Trending" : "Trending"}
              </span>
              <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-primary mt-2 tracking-[-0.015em]">
                {lang === "sw" ? "Mali Zinazotrendi" : "Trending Properties"}
              </h2>
              <p className="text-sm text-secondary mt-1.5">
                {lang === "sw" ? "Mali zinazoangaliwa zaidi sasa hivi" : "Most viewed listings right now"}
              </p>
            </div>
          </Reveal>

          {trendingProperties.length === 0 ? (
            <div className="text-center py-10 text-muted text-sm">
              {lang === "sw" ? "Hakuna mali kwa sasa" : "No listings yet"}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {trendingProperties.map((prop, i) => {
                const cat = popularCategories.find((c) => c.key === prop.category);
                const Icon = getCategoryIcon(cat?.iconKey);
                return (
                  <Reveal
                    key={prop.id}
                    delay={Math.min(i * 70, 350)}
                    className="h-full"
                  >
                    <ListingCard listing={prop} category={cat} Icon={Icon} lang={lang} />
                  </Reveal>
                );
              })}
              <ViewAllTile
                to="/mali-zote"
                label={lang === "sw" ? "Tazama Zote" : "View All"}
                itemCount={trendingProperties.length}
                cols={TRENDING_COLS}
                delay={Math.min(trendingProperties.length * 70, 350)}
              />
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* CATEGORIES                                          */}
        {/* ═══════════════════════════════════════════════════ */}
        <section id="kategoria" className="scroll-mt-16 py-14 px-4 max-w-7xl mx-auto">
          <div className="bg-sand rounded-3xl p-3.5 sm:p-8">
            <Reveal>
              <div className="text-center mb-7">
                <span className="text-[11px] font-semibold text-gold-ink uppercase tracking-[0.2em]">
                  {lang === "sw" ? "Kategoria" : "Categories"}
                </span>
                <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-primary mt-2 tracking-[-0.015em]">
                  {lang === "sw" ? "Kategoria Maarufu" : "Popular Categories"}
                </h2>
                <p className="text-sm text-secondary mt-1.5">
                  {lang === "sw" ? "Chagua aina ya mali unayotafuta" : "Pick the type of property you're looking for"}
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {categories.map((cat, i) => {
                const Icon = getCategoryIcon(cat.iconKey);
                return (
                  <Reveal
                    key={cat.key}
                    delay={Math.min(i * 60, 360)}
                    className="h-full"
                  >
                    <CategoryTile
                      to={`/kategoria/${cat.key}`}
                      label={cat.label?.[lang] || cat.label?.sw}
                      count={cat.count}
                      countLabel={lang === "sw" ? "mali" : "listings"}
                      imageUrl={cat.imageUrl}
                      Icon={Icon}
                    />
                  </Reveal>
                );
              })}
              <ViewAllTile
                to="/kategoria"
                label={lang === "sw" ? "Tazama Yote" : "View All"}
                itemCount={categories.length}
                cols={CATEGORY_COLS}
                delay={Math.min(categories.length * 60, 360)}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TESTIMONIALS                                        */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <span className="text-[11px] font-semibold text-gold-ink uppercase tracking-[0.2em]">
                {lang === "sw" ? "Ushuhuda" : "Testimonials"}
              </span>
              <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-primary mt-2 tracking-[-0.015em]">
                {lang === "sw"
                  ? "Wanachosema Wadau Wetu"
                  : "What Our Contributors Say"}
              </h2>
              <p className="text-sm text-secondary mt-2 max-w-xl mx-auto">
                {lang === "sw"
                  ? "Ushuhuda kutoka kwa wateja wetu halisi"
                  : "Real testimonials from our customers"}
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {testimonials.map((item, index) => (
              <Reveal key={index} delay={index * 120}>
                <div className="relative h-full bg-white border border-gray-100 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/[0.06]">
                  <svg
                    className="absolute top-4 right-5 w-8 h-8 text-gold/30"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6 17h3l2-4V7H5v6h3zm9 0h3l2-4V7h-6v6h3z" />
                  </svg>
                  <p className="text-secondary text-sm leading-relaxed mb-4">
                    "{lang === "sw" ? item.quote.sw : item.quote.en}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      loading="lazy"
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                    />
                    <div>
                      <p className="text-gold-ink font-semibold text-sm">
                        {item.name}
                      </p>
                      <p className="text-xs text-secondary">{item.region}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FAQ                                                 */}
        {/* ═══════════════════════════════════════════════════ */}
        <section id="faq" className="scroll-mt-16 py-16 px-4 max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <span className="text-[11px] font-semibold text-gold-ink uppercase tracking-[0.2em]">
                FAQ
              </span>
              <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-primary mt-2 tracking-[-0.015em]">
                {lang === "sw"
                  ? "Maswali Yanayoulizwa Mara kwa Mara"
                  : "Frequently Asked Questions"}
              </h2>
              <p className="text-secondary text-sm mt-2">
                {lang === "sw"
                  ? "Majibu ya maswali yanayoulizwa sana kuhusu SokoMkononi"
                  : "Answers to the most frequently asked questions about SokoMkononi"}
              </p>
            </div>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <Reveal key={index} delay={Math.min(index * 40, 400)}>
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white transition-all hover:border-gold/40">
                    <button
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                      className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-sand/60 transition-colors"
                    >
                      <h3 className="font-semibold text-primary flex-1">
                        {lang === "sw" ? faq.q.sw : faq.q.en}
                      </h3>
                      <svg
                        className={`w-5 h-5 flex-shrink-0 text-gold-ink transition-transform duration-300 mt-0.5 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                      style={{ display: "grid" }}
                    >
                      <div className="overflow-hidden">
                        <div className="text-secondary text-sm px-4 pb-4 whitespace-pre-line leading-relaxed">
                          {lang === "sw" ? faq.a.sw : faq.a.en}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal>
            <div className="text-center mt-8">
              <Link
                to="/mawasiliano#faq"
                className="group inline-flex items-center gap-2 border-2 border-gold text-gold-ink hover:bg-gold hover:text-night font-semibold px-8 py-3 rounded-xl transition-all duration-300"
              >
                {lang === "sw" ? "Ona Zaidi" : "Explore More"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </section>

        <Footer selectedLang={lang} />

        <BottomNav />
      </div>
    </div>
  );
}

// ============================================================
// HomePage.jsx — public landing page
// Refined: faint ambient dots, elegant typewriter, premium CTAs,
// editorial "Why" section. Fully responsive.
// ============================================================
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../config/authStore.js";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Navbar from "../components/Navbar.jsx";
import { usePublicListings } from "../config/listingsStore.js";
import { useAppStoreLinks } from "../config/systemSettingsStore.js";
import {
  usePopularCategories,
  getCategoryIcon,
} from "../config/categoriesStore.js";

function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

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
        className={`inline-block w-[2px] h-[1em] align-middle ml-0.5 bg-[#E8A33D] ${
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
        className="absolute top-[8%] h-px w-[30%] bg-gradient-to-r from-transparent via-[#E8A33D] to-transparent animate-beam"
        style={{ opacity: 0.12 }}
      />
      <div
        className="absolute top-[38%] h-px w-[25%] bg-gradient-to-r from-transparent via-[#2F6D4F] to-transparent animate-beam"
        style={{ animationDelay: "-8s", opacity: 0.1 }}
      />
      <div
        className="absolute top-[72%] h-px w-[35%] bg-gradient-to-r from-transparent via-[#E8A33D] to-transparent animate-beam"
        style={{ animationDelay: "-15s", opacity: 0.09 }}
      />

      {/* Barely-there drifting dots */}
      <span
        className="absolute top-[14%] w-1 h-1 rounded-full bg-[#E8A33D] animate-drift-across"
        style={{ opacity: 0.22, animationDuration: "55s" }}
      />
      <span
        className="absolute top-[48%] w-[3px] h-[3px] rounded-full bg-[#2F6D4F] animate-drift-across"
        style={{ opacity: 0.18, animationDuration: "68s", animationDelay: "-20s" }}
      />
      <span
        className="absolute top-[76%] w-1 h-1 rounded-full bg-[#E8A33D] animate-drift-across"
        style={{ opacity: 0.2, animationDuration: "62s", animationDelay: "-38s" }}
      />

      {/* Very soft breathing glows */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full animate-glow-breathe"
        style={{ background: "radial-gradient(circle, rgba(232,163,61,0.04) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full animate-glow-breathe"
        style={{ background: "radial-gradient(circle, rgba(47,109,79,0.04) 0%, transparent 70%)", animationDelay: "-4s" }}
      />
    </div>
  );
}

// ============================================================
// HeroStatCard — barely visible, appears after a long delay
// ============================================================
function HeroStatCard({ label, value, accent = "rgba(255,255,255,0.7)", delay = 0 }) {
  return (
    <div
      className="backdrop-blur-md rounded-2xl px-3.5 py-2.5 animate-fade-in-soft-delayed"
      style={{
        animationDelay: `${6 + delay}s`,
        opacity: 0,
        background: "rgba(255,255,255,0.012)",
        border: "1px solid rgba(255,255,255,0.035)",
      }}
    >
      <p
        className="text-[9px] uppercase tracking-[0.15em] font-medium"
        style={{ color: "rgba(255,255,255,0.18)" }}
      >
        {label}
      </p>
      <p
        className="text-sm lg:text-base font-semibold mt-0.5"
        style={{ color: accent }}
      >
        {value}
      </p>
    </div>
  );
}

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
        .slice(0, 8),
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
      accent: "#E8A33D",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z" />
        </svg>
      ),
    },
    {
      title: lang === "sw" ? "Upatikanaji Rahisi" : "Easy Access",
      desc: lang === "sw"
        ? "Tafuta mali popote Tanzania — Web, iOS na Android."
        : "Find properties anywhere in Tanzania — Web, iOS and Android.",
      accent: "#2F6D4F",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

  return (
    <div className="min-h-screen bg-white relative">
      <AmbientBackground />

      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar lang={lang} setLang={setLang} categories={categories} />

        {/* ═══════════════════════════════════════════════════ */}
        {/* HERO                                                */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="relative dark-surface bg-[#0A1220] text-white px-4 py-14 sm:py-20 lg:py-24 overflow-hidden min-h-[92svh] sm:min-h-[88svh] flex items-center">
          {/* Aurora orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -top-1/3 -left-1/4 w-[70%] h-[70%] rounded-full opacity-20 blur-[130px] animate-aurora"
              style={{ background: "radial-gradient(circle, #E8A33D 0%, transparent 60%)" }}
            />
            <div
              className="absolute -bottom-1/3 -right-1/4 w-[70%] h-[70%] rounded-full opacity-[0.15] blur-[130px] animate-aurora"
              style={{ background: "radial-gradient(circle, #2F6D4F 0%, transparent 60%)", animationDelay: "-6s" }}
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
            className="absolute top-[12%] h-px w-[30%] bg-gradient-to-r from-transparent via-[#E8A33D] to-transparent animate-beam"
            style={{ opacity: 0.15 }}
          />
          <div
            className="absolute bottom-[16%] h-px w-[25%] bg-gradient-to-r from-transparent via-[#2F6D4F] to-transparent animate-beam"
            style={{ animationDelay: "-10s", opacity: 0.12 }}
          />

          {/* Barely-visible drifting dots (mobile + desktop) */}
          <span
            className="absolute top-[22%] left-[10%] w-1 h-1 rounded-full bg-[#E8A33D] animate-drift-across"
            style={{ opacity: 0.2, animationDuration: "58s" }}
          />
          <span
            className="absolute top-[68%] right-[12%] w-[3px] h-[3px] rounded-full bg-[#2F6D4F] animate-drift-across"
            style={{ opacity: 0.18, animationDuration: "72s", animationDelay: "-22s" }}
          />

          {/* ── Corner stat cards — barely visible, delay 6s ── */}
          <div className="absolute top-[16%] left-[4%] hidden xl:block animate-float" style={{ animationDelay: "-2s" }}>
            <HeroStatCard label="Mali Zinazopatikana" value="2,500+" delay={0} />
          </div>
          <div className="absolute top-[12%] right-[4%] hidden xl:block animate-float-slow" style={{ animationDelay: "-4s" }}>
            <HeroStatCard label="Wauzaji Walioidhinishwa" value="1,200+" accent="rgba(232,163,61,0.55)" delay={0.4} />
          </div>
          <div className="absolute bottom-[16%] left-[5%] hidden xl:block animate-float-slow" style={{ animationDelay: "-6s" }}>
            <HeroStatCard label="Malipo Salama" value="100%" accent="rgba(47,109,79,0.55)" delay={0.8} />
          </div>
          <div className="absolute bottom-[12%] right-[5%] hidden xl:block animate-float" style={{ animationDelay: "-3s" }}>
            <HeroStatCard label="Mikataba" value="850+" delay={1.2} />
          </div>

          {/* Content */}
          <div className="relative w-full max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-full px-4 py-1.5 mb-7 animate-fade-in-up">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8A33D] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#E8A33D]" />
              </span>
              <span className="text-[11px] font-medium text-white/70 tracking-wider uppercase">
                {lang === "sw" ? "Soko la Kidijitali la Mali" : "Digital Property Marketplace"}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-bold leading-[1.05] tracking-[-0.02em] animate-fade-in-up text-[clamp(2rem,7vw,4.25rem)]"
              style={{ animationDelay: "0.1s" }}
            >
              {lang === "sw" ? (
                <>
                  Nunua na Uza{" "}
                  <span className="bg-gradient-to-r from-[#E8A33D] via-[#F5C976] to-[#E8A33D] bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                    Mali
                  </span>{" "}
                  kwa Urahisi
                </>
              ) : (
                <>
                  Buy and Sell{" "}
                  <span className="bg-gradient-to-r from-[#E8A33D] via-[#F5C976] to-[#E8A33D] bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
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
                className="text-white/75 leading-[1.7] px-2"
                style={{
                  fontSize: "clamp(0.95rem, 2.1vw, 1.2rem)",
                  fontWeight: 300,
                  letterSpacing: "-0.005em",
                  minHeight: "clamp(3.5rem, 8vw, 5rem)",
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
                  bg-gradient-to-r from-[#E8A33D] to-[#F5C976]
                  hover:from-[#D99728] hover:to-[#E8A33D]
                  text-[#101A2E] font-semibold
                  pl-2 pr-6 sm:pr-8 py-2 sm:py-2.5
                  shadow-[0_8px_30px_-8px_rgba(232,163,61,0.55)]
                  hover:shadow-[0_14px_45px_-8px_rgba(232,163,61,0.75)]
                  transition-all duration-300
                  hover:-translate-y-1 active:translate-y-0"
              >
                <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#101A2E]/10 group-hover:bg-[#101A2E]/[0.16] flex items-center justify-center shrink-0 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                <span className="text-base sm:text-lg whitespace-nowrap">
                  {lang === "sw" ? "Nunua Sasa" : "Buy Now"}
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </button>

              {/* Sell Now — secondary green */}
              <button
                onClick={handleSellNow}
                className="group relative overflow-hidden inline-flex items-center gap-3 rounded-full
                  bg-gradient-to-r from-[#2F6D4F] to-[#3E8A66]
                  hover:from-[#245a41] hover:to-[#2F6D4F]
                  text-white font-semibold
                  pl-2 pr-6 sm:pr-8 py-2 sm:py-2.5
                  shadow-[0_8px_30px_-8px_rgba(47,109,79,0.55)]
                  hover:shadow-[0_14px_45px_-8px_rgba(47,109,79,0.75)]
                  transition-all duration-300
                  hover:-translate-y-1 active:translate-y-0"
              >
                <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center shrink-0 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span className="text-base sm:text-lg whitespace-nowrap">
                  {lang === "sw" ? "Uza Sasa" : "Sell Now"}
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              </button>
            </div>

            {/* ── Elegant trust row ─────────────────────────── */}
            <div
              className="mt-8 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5 gap-y-2 text-[11px] sm:text-xs text-white/45 animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#2F6D4F]" />
                {lang === "sw" ? "Malipo Salama" : "Secure Payments"}
              </span>
              <span className="hidden sm:block w-px h-3 bg-white/10" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[#E8A33D]" />
                {lang === "sw" ? "Wauzaji Walioidhinishwa" : "Verified Sellers"}
              </span>
              <span className="hidden sm:block w-px h-3 bg-white/10" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-white/40" />
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
                className={`group flex items-center gap-2 sm:gap-3 border border-white/10 hover:border-white/25 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${!playUrl ? "opacity-60 cursor-default pointer-events-auto" : ""}`}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" aria-hidden="true">
                  <path d="M4.5 3.5c-.3.3-.5.7-.5 1.2v14.6c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L4.6 3.4l-.1.1z" fill="#00D2FF" />
                  <path d="M15.9 15L13 12.1v-.2l2.9-2.9 6.5 3.7c.8.5.8 1.3 0 1.8l-6.5 3.7z" fill="#FFCE00" />
                  <path d="M15.9 15L13 12l-8.4 8.5c.4.4 1 .4 1.7.1L15.9 15" fill="#FF3A44" />
                  <path d="M15.9 9.1L6.3 3.6c-.7-.4-1.3-.3-1.7.1L13 12l2.9-2.9z" fill="#00F076" />
                </svg>
                <span className="text-[11px] sm:text-xs text-left">
                  <span className="block text-white/40 text-[9px] sm:text-[10px]">
                    {playUrl
                      ? lang === "sw" ? "Pata kwenye" : "Get it on"
                      : lang === "sw" ? "Inakuja hivi karibuni" : "Coming soon"}
                  </span>
                  <span className="block font-semibold text-white text-xs sm:text-sm">Google Play</span>
                </span>
              </a>
              <a
                href={appStoreUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!appStoreUrl}
                onClick={(e) => { if (!appStoreUrl) e.preventDefault(); }}
                className={`group flex items-center gap-2 sm:gap-3 border border-white/10 hover:border-white/25 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${!appStoreUrl ? "opacity-60 cursor-default pointer-events-auto" : ""}`}
              >
                <svg viewBox="0 0 384 512" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 fill-white/90" aria-hidden="true">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.3c0 26.2 4.8 53.3 14.4 81.3 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.8zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
                <span className="text-[11px] sm:text-xs text-left">
                  <span className="block text-white/40 text-[9px] sm:text-[10px]">
                    {appStoreUrl
                      ? lang === "sw" ? "Pata kwenye" : "Get it on"
                      : lang === "sw" ? "Inakuja hivi karibuni" : "Coming soon"}
                  </span>
                  <span className="block font-semibold text-white text-xs sm:text-sm">App Store</span>
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
                  <span className="text-[11px] font-semibold text-[#E8A33D] uppercase tracking-[0.2em]">
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
                    className="inline-flex items-center gap-2 mt-7 text-[#E8A33D] font-semibold text-sm hover:gap-3 transition-all duration-300 group"
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
                    <div className="group flex items-start gap-4 sm:gap-5 p-5 sm:p-6 bg-white border border-gray-100 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#E8A33D]/25 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)]">
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-7">
              <div>
                <span className="text-[11px] font-semibold text-[#E8A33D] uppercase tracking-[0.2em]">
                  {lang === "sw" ? "Trending" : "Trending"}
                </span>
                <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-primary mt-2 tracking-[-0.015em]">
                  {lang === "sw" ? "Mali Zinazotrendi" : "Trending Properties"}
                </h2>
                <p className="text-sm text-secondary mt-1.5">
                  {lang === "sw" ? "Mali zinazoangaliwa zaidi sasa hivi" : "Most viewed listings right now"}
                </p>
              </div>
              <Link
                to="/mali-zote"
                className="group inline-flex items-center gap-1.5 text-[#E8A33D] text-sm font-semibold shrink-0 hover:gap-2.5 transition-all"
              >
                {lang === "sw" ? "Tazama Zote" : "View All"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Reveal>

          {trendingProperties.length === 0 ? (
            <div className="text-center py-10 text-muted text-sm">
              {lang === "sw" ? "Hakuna mali kwa sasa" : "No listings yet"}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {trendingProperties.map((prop, i) => {
                const cat = popularCategories.find((c) => c.key === prop.category);
                const Icon = getCategoryIcon(cat?.iconKey);
                const listingPhoto =
                  prop.imageUrl ||
                  (Array.isArray(prop.photos) && prop.photos[0]) ||
                  null;
                const img = listingPhoto || cat?.imageUrl || null;
                return (
                  <Reveal
                    key={prop.id}
                    delay={Math.min(i * 70, 350)}
                    className="h-full"
                  >
                    <Link
                      to={`/mali/${prop.id}`}
                      className="group block h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/[0.08]"
                    >
                      <div className="relative h-32 sm:h-44 bg-[#F5F3EC] flex items-center justify-center overflow-hidden">
                        {img ? (
                          <img
                            src={img}
                            alt={prop.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <Icon size={48} className="text-[#E8A33D]" />
                        )}
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-[#2F6D4F] text-white text-[10px] font-semibold flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                          {lang === "sw" ? "Inapatikana" : "Available"}
                        </div>
                      </div>
                      <div className="p-3 sm:p-4">
                        <h3 className="font-semibold text-primary text-sm truncate group-hover:text-[#E8A33D] transition-colors">
                          {prop.title}
                        </h3>
                        <p className="text-[#E8A33D] text-sm sm:text-base font-bold mt-1">
                          {formatTZS(prop.price)}
                        </p>
                        <p className="text-secondary text-xs mt-1.5 truncate flex items-center gap-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {prop.region || prop.location}
                        </p>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* CATEGORIES                                          */}
        {/* ═══════════════════════════════════════════════════ */}
        <section id="kategoria" className="scroll-mt-16 py-14 px-4 max-w-7xl mx-auto">
          <div className="bg-[#FAF9F5] rounded-3xl p-6 sm:p-10">
            <Reveal>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-7">
                <div>
                  <span className="text-[11px] font-semibold text-[#E8A33D] uppercase tracking-[0.2em]">
                    {lang === "sw" ? "Kategoria" : "Categories"}
                  </span>
                  <h2 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-primary mt-2 tracking-[-0.015em]">
                    {lang === "sw" ? "Kategoria Maarufu" : "Popular Categories"}
                  </h2>
                  <p className="text-sm text-secondary mt-1.5">
                    {lang === "sw" ? "Chagua aina ya mali unayotafuta" : "Pick the type of property you're looking for"}
                  </p>
                </div>
                <Link
                  to="/kategoria"
                  className="group inline-flex items-center gap-1.5 text-[#E8A33D] text-sm font-semibold shrink-0 hover:gap-2.5 transition-all"
                >
                  {lang === "sw" ? "Tazama Yote" : "View All"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {categories.map((cat, i) => {
                const Icon = getCategoryIcon(cat.iconKey);
                const hasPhoto = Boolean(cat.imageUrl);
                return (
                  <Reveal key={cat.key} delay={Math.min(i * 60, 360)}>
                    <Link
                      to={`/kategoria/${cat.key}`}
                      className="group block bg-white rounded-2xl overflow-hidden text-center border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-black/[0.06] hover:border-[#E8A33D]/30"
                    >
                      <div className="h-32 sm:h-36 bg-[#F5F3EC] flex items-center justify-center overflow-hidden relative">
                        {hasPhoto ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.label?.[lang] || cat.label?.sw}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <Icon
                            size={44}
                            className="text-[#E8A33D] transition-transform duration-300 group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-primary text-sm">
                          {cat.label?.[lang] || cat.label?.sw}
                        </h3>
                        <p className="text-xs text-secondary mt-0.5">
                          {cat.count} {lang === "sw" ? "mali" : "listings"}
                        </p>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TESTIMONIALS                                        */}
        {/* ═══════════════════════════════════════════════════ */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <span className="text-[11px] font-semibold text-[#E8A33D] uppercase tracking-[0.2em]">
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
                    className="absolute top-4 right-5 w-8 h-8 text-[#E8A33D]/20"
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
                      <p className="text-[#E8A33D] font-semibold text-sm">
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
              <span className="text-[11px] font-semibold text-[#E8A33D] uppercase tracking-[0.2em]">
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
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white transition-all hover:border-[#E8A33D]/30">
                    <button
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                      className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-[#F5F3EC]/60 transition-colors"
                    >
                      <h3 className="font-semibold text-primary flex-1">
                        {lang === "sw" ? faq.q.sw : faq.q.en}
                      </h3>
                      <svg
                        className={`w-5 h-5 flex-shrink-0 text-[#E8A33D] transition-transform duration-300 mt-0.5 ${
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
                className="group inline-flex items-center gap-2 border-2 border-[#E8A33D] text-[#E8A33D] hover:bg-[#E8A33D] hover:text-[#101A2E] font-semibold px-8 py-3 rounded-xl transition-all duration-300"
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

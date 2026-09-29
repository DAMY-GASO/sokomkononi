// ============================================================
// HomePage.jsx — public landing page
// ============================================================
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../config/authStore.js";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Navbar from "../components/Navbar.jsx";
import { usePublicListings } from "../config/listingsStore.js";
import {
  usePopularCategories,
  getCategoryIcon,
} from "../config/categoriesStore.js";

function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

// ============================================================
// TypewriterText — subtitles that print letter by letter
// ============================================================
function TypewriterText({ text, speed = 40 }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
    if (!text) return;
    const interval = setInterval(() => {
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        return;
      }
      const ch = text[indexRef.current];
      indexRef.current += 1;
      setDisplayed((prev) => prev + ch);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayed}</span>;
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
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const hidden =
    direction === "up" ? "translate-y-4" : "translate-x-4";

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${
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
// MAIN COMPONENT
// ============================================================
export default function HomePage() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const { user } = useAuth();
  const publicListings = usePublicListings();
  const popularCategories = usePopularCategories();

  const [openFaq, setOpenFaq] = useState(null);
  const [appToastVisible, setAppToastVisible] = useState(false);
  const [appToastDismissed, setAppToastDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("sokomkononi_app_toast_dismissed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (appToastDismissed) return;
    const timer = setTimeout(() => setAppToastVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [appToastDismissed]);

  const appToastShouldRender = !appToastDismissed;

  const dismissAppToast = () => {
    setAppToastVisible(false);
    setTimeout(() => {
      setAppToastDismissed(true);
      try {
        window.localStorage.setItem("sokomkononi_app_toast_dismissed", "1");
      } catch {}
    }, 300);
  };

  const handleBuyNow = () => {
    if (user) navigate("/dashboard/buyer");
    else navigate("/register?intent=buy");
  };

  const handleSellNow = () => {
    if (user) navigate("/dashboard/post");
    else navigate("/register?intent=sell");
  };

  const toggleFaq = (i) =>
    setOpenFaq((prev) => (prev === i ? null : i));

  const categories = useMemo(
    () =>
      popularCategories.map((cat) => ({
        ...cat,
        count: publicListings.filter((l) => l.category === cat.key).length,
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
      q: {
        sw: "Ninawezaje kuuza mali yangu?",
        en: "How can I sell my property?",
      },
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
      q: {
        sw: "Ninawezaje kuwasiliana na muuzaji?",
        en: "How can I contact a seller?",
      },
      a: {
        sw: "Baada ya kuonyesha nia ya kununua, unaweza kuwasiliana moja kwa moja kwenye 'Deal Room' yetu.",
        en: "After expressing interest to buy, you can communicate directly in our 'Deal Room'.",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar lang={lang} setLang={setLang} categories={categories} />

      {/* HERO */}
      <section className="relative dark-surface bg-[#0A1220] text-white py-14 sm:py-20 lg:py-24 px-4 overflow-hidden">
        {/* ── Aurora background orbs ───────────────────── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-1/3 -left-1/4 w-[70%] h-[70%] rounded-full opacity-25 blur-[120px] animate-aurora"
            style={{ background: "radial-gradient(circle, #E8A33D 0%, transparent 60%)" }}
          />
          <div
            className="absolute -bottom-1/3 -right-1/4 w-[70%] h-[70%] rounded-full opacity-20 blur-[120px] animate-aurora"
            style={{ background: "radial-gradient(circle, #2F6D4F 0%, transparent 60%)", animationDelay: "-6s" }}
          />
          <div
            className="absolute top-1/4 left-1/3 w-[60%] h-[60%] rounded-full opacity-[0.14] blur-[120px] animate-aurora"
            style={{ background: "radial-gradient(circle, #C1502E 0%, transparent 60%)", animationDelay: "-12s" }}
          />
        </div>

        {/* ── Grid overlay with radial mask ──────────────── */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />

        {/* ── Floating dots ──────────────────────────────── */}
        <span className="absolute top-[15%] left-[8%] w-2 h-2 rounded-full bg-[#E8A33D] opacity-70 animate-float hidden md:block" />
        <span className="absolute top-[25%] right-[10%] w-1.5 h-1.5 rounded-full bg-[#2F6D4F] opacity-60 animate-float-slow hidden md:block" style={{ animationDelay: "-2s" }} />
        <span className="absolute bottom-[22%] left-[14%] w-2.5 h-2.5 rounded-full bg-[#E8A33D] opacity-50 animate-float-slow hidden md:block" style={{ animationDelay: "-4s" }} />
        <span className="absolute top-[62%] right-[7%] w-1.5 h-1.5 rounded-full bg-white opacity-40 animate-float hidden md:block" style={{ animationDelay: "-1s" }} />

        {/* ── Floating value-prop cards ──────────────────── */}
        <div className="absolute top-[18%] left-[3%] hidden xl:block animate-float" style={{ animationDelay: "-1s" }}>
          <div className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 shadow-2xl">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Mali Zinazopatikana</p>
            <p className="text-lg font-bold text-white mt-0.5">2,500+</p>
          </div>
        </div>
        <div className="absolute top-[12%] right-[3%] hidden xl:block animate-float-slow" style={{ animationDelay: "-3s" }}>
          <div className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 shadow-2xl">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Wauzaji Walioidhinishwa</p>
            <p className="text-lg font-bold text-[#E8A33D] mt-0.5">1,200+</p>
          </div>
        </div>
        <div className="absolute bottom-[16%] left-[5%] hidden xl:block animate-float-slow" style={{ animationDelay: "-5s" }}>
          <div className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 shadow-2xl">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Malipo Salama</p>
            <p className="text-lg font-bold text-[#2F6D4F] mt-0.5">100%</p>
          </div>
        </div>
        <div className="absolute bottom-[12%] right-[5%] hidden xl:block animate-float" style={{ animationDelay: "-2s" }}>
          <div className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 shadow-2xl">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Mikataba</p>
            <p className="text-lg font-bold text-white mt-0.5">850+</p>
          </div>
        </div>

        {/* ── Main content ──────────────────────────────── */}
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Pulse-dot badge */}
          <div className="inline-flex items-center gap-2 bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-full px-4 py-1.5 mb-6 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8A33D] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8A33D]" />
            </span>
            <span className="text-xs font-medium text-white/80 tracking-wide">
              {lang === "sw" ? "Soko la Kidijitali la Mali" : "Digital Property Marketplace"}
            </span>
          </div>

          {/* Headline with shimmer */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight animate-fade-in-up"
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

          {/* Subtitle */}
          <div
            className="mt-6 max-w-2xl mx-auto min-h-[3.5rem] sm:min-h-[4rem] animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <p className="text-white/70 text-base sm:text-lg md:text-xl leading-relaxed">
              <TypewriterText
                text={
                  lang === "sw"
                    ? "SokoMkononi ni jukwaa linalowaunganisha wanunuzi na wauzaji sehemu moja, kwa kurahisisha kutafuta, kuuza na kununua kwa urahisi na kujiamini."
                    : "SokoMkononi is a safe platform that brings together buyers and sellers in one place, simplifying searches, buying and selling with confidence."
                }
                speed={25}
              />
            </p>
          </div>

          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mt-10 max-w-md sm:max-w-none mx-auto animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <button
              onClick={handleBuyNow}
              className="group relative overflow-hidden bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-bold text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-2xl transition-all duration-300 shadow-lg shadow-[#E8A33D]/20 hover:shadow-[0_0_45px_8px_rgba(232,163,61,0.4)] transform hover:-translate-y-1 active:translate-y-0"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                {lang === "sw" ? "Nunua Sasa" : "Buy Now"}
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>

            <button
              onClick={handleSellNow}
              className="group relative overflow-hidden bg-[#2F6D4F] hover:bg-[#245a41] text-white font-bold text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-2xl transition-all duration-300 shadow-lg shadow-[#2F6D4F]/20 hover:shadow-[0_0_45px_8px_rgba(47,109,79,0.4)] transform hover:-translate-y-1 active:translate-y-0"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {lang === "sw" ? "Uza Sasa" : "Sell Now"}
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </div>

          {/* Trust row */}
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-white/60 text-xs sm:text-sm animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              {lang === "sw" ? "Malipo Salama" : "Secure Payments"}
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {lang === "sw" ? "Wauzaji Walioidhinishwa" : "Verified Sellers"}
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {lang === "sw" ? "Msaada wa Haraka" : "Fast Support"}
            </span>
          </div>

          {/* App badges */}
          <div
            className="flex flex-wrap gap-3 justify-center mt-10 animate-fade-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            <Link
              to="/waitlist"
              className="group flex items-center gap-3 border border-white/15 hover:border-white/35 rounded-xl px-4 py-2.5 hover:bg-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
                <path d="M4.5 3.5c-.3.3-.5.7-.5 1.2v14.6c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L4.6 3.4l-.1.1z" fill="#00D2FF" />
                <path d="M15.9 15L13 12.1v-.2l2.9-2.9 6.5 3.7c.8.5.8 1.3 0 1.8l-6.5 3.7z" fill="#FFCE00" />
                <path d="M15.9 15L13 12l-8.4 8.5c.4.4 1 .4 1.7.1L15.9 15" fill="#FF3A44" />
                <path d="M15.9 9.1L6.3 3.6c-.7-.4-1.3-.3-1.7.1L13 12l2.9-2.9z" fill="#00F076" />
              </svg>
              <span className="text-xs text-left">
                <span className="block text-white/50 text-[10px]">
                  {lang === "sw" ? "Pata kwenye" : "Get it on"}
                </span>
                <span className="block font-semibold text-white text-sm">Google Play</span>
              </span>
            </Link>
            <Link
              to="/waitlist"
              className="group flex items-center gap-3 border border-white/15 hover:border-white/35 rounded-xl px-4 py-2.5 hover:bg-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 384 512" className="w-6 h-6 shrink-0 fill-white" aria-hidden="true">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.3c0 26.2 4.8 53.3 14.4 81.3 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.8zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              <span className="text-xs text-left">
                <span className="block text-white/50 text-[10px]">
                  {lang === "sw" ? "Pata kwenye" : "Get it on"}
                </span>
                <span className="block font-semibold text-white text-sm">App Store</span>
              </span>
            </Link>
          </div>
        </div>

        {/* ── Scroll hint ─────────────────────────────────── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1 text-white/35 animate-bounce-subtle pointer-events-none">
          <span className="text-[10px] uppercase tracking-[0.2em]">
            {lang === "sw" ? "Sogeza" : "Scroll"}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
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
              <h3>
                {lang === "sw" ? "Jukwaa la Kisasa" : "A Modern Platform"}
              </h3>
              <p className="text-secondary text-body-sm mt-3 leading-relaxed">
                {lang === "sw"
                  ? "Jukwaa la kisasa linalowaunganisha wanunuzi na wauzaji wa mali Tanzania kwa urahisi, uwazi na kuaminiana."
                  : "A modern platform connecting property buyers and sellers in Tanzania with ease, transparency and trust."}
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="p-8 bg-[#F5F3EC] rounded-xl text-center flex flex-col items-center h-full">
              <h3>
                {lang === "sw" ? "Upatikanaji Rahisi" : "Easy Access"}
              </h3>
              <p className="text-secondary text-body-sm mt-3 leading-relaxed">
                {lang === "sw"
                  ? "Tafuta na pata mali unayohitaji popote Tanzania, kwa urahisi kupitia SokoMkononi Web Platform na Apps za iOS & Android."
                  : "Find and get the property you need anywhere in Tanzania, easily through the SokoMkononi Web Platform and iOS & Android Apps."}
              </p>
            </div>
          </Reveal>
          <Reveal delay={240}>
            <div className="p-8 bg-[#F5F3EC] rounded-xl text-center flex flex-col items-center h-full">
              <h3>
                {lang === "sw" ? "Salama na Inaaminika" : "Safe & Trusted"}
              </h3>
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
            <h2>
              {lang === "sw" ? "Mali Zinazotrendi" : "Trending Properties"}
            </h2>
            <Link
              to="/mali-zote"
              className="text-[#E8A33D] text-body-sm font-semibold hover:underline"
            >
              {lang === "sw" ? "Tazama Zote →" : "View All →"}
            </Link>
          </div>
        </Reveal>

        {trendingProperties.length === 0 ? (
          <div className="text-center py-10 text-muted text-body-sm">
            {lang === "sw" ? "Hakuna mali kwa sasa" : "No listings yet"}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {trendingProperties.map((prop, i) => {
              const cat = popularCategories.find((c) => c.key === prop.category);
              const Icon = getCategoryIcon(cat?.iconKey);
              const hasPhoto = Boolean(prop.imageUrl || cat?.imageUrl);
              const img = prop.imageUrl || cat?.imageUrl;
              return (
                <Reveal
                  key={prop.id}
                  delay={Math.min(i * 70, 350)}
                  className="min-w-[200px] sm:min-w-[240px] flex-shrink-0"
                >
                  <Link
                    to={`/mali/${prop.id}`}
                    className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-40 bg-[#F5F3EC] flex items-center justify-center overflow-hidden">
                      {hasPhoto ? (
                        <img
                          src={img}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon size={48} className="text-[#E8A33D]" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="h-card truncate">{prop.title}</h3>
                      <p className="text-[#E8A33D] text-price">
                        {formatTZS(prop.price)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-secondary text-body-sm truncate">
                          📍 {prop.region || prop.location}
                        </span>
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
            <h2>
              {lang === "sw" ? "Kategoria Maarufu" : "Popular Categories"}
            </h2>
            <Link
              to="/kategoria"
              className="text-[#E8A33D] text-body-sm font-semibold hover:underline"
            >
              {lang === "sw" ? "Tazama Yote →" : "View All →"}
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => {
            const Icon = getCategoryIcon(cat.iconKey);
            const hasPhoto = Boolean(cat.imageUrl);
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
                        alt={cat.label?.[lang] || cat.label?.sw}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Icon
                        size={48}
                        className="text-[#E8A33D] group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="h-card">
                      {cat.label?.[lang] || cat.label?.sw}
                    </h3>
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
            {lang === "sw"
              ? "Wanachosema Wadau Wetu"
              : "What Our Contributors Say"}
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
                <p className="text-secondary text-body-sm leading-relaxed text-center overflow-hidden flex-1">
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
            {lang === "sw"
              ? "Maswali Yanayoulizwa Mara kwa Mara"
              : "Frequently Asked Questions"}
          </h2>
          <p className="text-secondary text-body-sm text-center mb-12">
            {lang === "sw"
              ? "Majibu ya maswali yanayoulizwa sana kuhusu SokoMkononi"
              : "Answers to the most frequently asked questions about SokoMkononi"}
          </p>
        </Reveal>
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <Reveal key={index} delay={Math.min(index * 40, 400)}>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-[#F5F3EC]/60 transition-colors"
                  >
                    <h3 className="h-card flex-1">
                      {lang === "sw" ? faq.q.sw : faq.q.en}
                    </h3>
                    <svg
                      className={`w-5 h-5 flex-shrink-0 text-[#E8A33D] transition-transform duration-200 mt-0.5 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                    style={{ display: "grid" }}
                  >
                    <div className="overflow-hidden">
                      <div className="text-secondary text-body-sm px-4 pb-4 whitespace-pre-line leading-relaxed">
                        {lang === "sw" ? faq.a.sw : faq.a.en}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <Footer selectedLang={lang} />

      {appToastShouldRender && (
        <div
          className={`fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-[60] transition-all duration-300 ${
            appToastVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0 pointer-events-none"
          }`}
        >
          <div className="bg-[#101A2E] text-white rounded-xl shadow-2xl border border-white/10 p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold">
                {lang === "sw"
                  ? "App ya SokoMkononi inakuja!"
                  : "The SokoMkononi app is coming!"}
              </p>
              <p className="text-white/60 text-body-sm mt-0.5 leading-relaxed">
                {lang === "sw"
                  ? "Jiunge na waitlist ili uwe wa kwanza kujua."
                  : "Join the waitlist to be first to know."}
              </p>
              <Link
                to="/waitlist"
                onClick={dismissAppToast}
                className="inline-block mt-2 text-[#E8A33D] text-body-sm font-semibold hover:underline"
              >
                {lang === "sw" ? "Jiunge Sasa →" : "Join Now →"}
              </Link>
            </div>
            <button
              onClick={dismissAppToast}
              aria-label={lang === "sw" ? "Funga" : "Close"}
              className="text-white/40 hover:text-white flex-shrink-0"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

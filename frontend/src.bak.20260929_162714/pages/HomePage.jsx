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
      <section className="dark-surface bg-[#101A2E] text-white py-12 sm:py-16 px-4 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            {lang === "sw"
              ? "Nunua na Uza Mali kwa Urahisi"
              : "Buy and Sell Property Easily"}
          </h1>

          <div className="mt-6 max-w-3xl mx-auto min-h-[4rem] sm:min-h-[5rem]">
            <p className="text-white/75 text-lg sm:text-xl md:text-2xl leading-relaxed font-regular">
              <TypewriterText
                text={
                  lang === "sw"
                    ? "SokoMkononi ni jukwaa linalowaunganisha wanunuzi na wauzaji sehemu moja, kwa kurahisisha kutafuta, kuuza na kununua kwa urahisi na kujiamini."
                    : "SokoMkononi is a safe platform that brings together buyers and sellers in one place, simplifying searches, buying and selling with confidence."
                }
                speed={30}
              />
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center mt-10 max-w-md sm:max-w-none mx-auto">
            <button
              onClick={handleBuyNow}
              className="bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-bold text-lg sm:text-xl px-8 sm:px-12 py-5 sm:py-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {lang === "sw" ? "Nunua Sasa" : "Buy Now"}
            </button>
            <button
              onClick={handleSellNow}
              className="bg-[#2F6D4F] hover:bg-[#245a41] text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-5 sm:py-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {lang === "sw" ? "Uza Sasa" : "Sell Now"}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-10">
            <Link
              to="/waitlist"
              className="flex items-center gap-2 border border-white/20 rounded-md px-4 py-2 hover:bg-white/5 transition-colors"
            >
              <span className="text-xs text-left">
                <span className="block text-white/50 text-[10px]">
                  {lang === "sw" ? "Pata kwenye" : "Get it on"}
                </span>
                <span className="block font-semibold text-white">
                  Google Play
                </span>
              </span>
            </Link>
            <Link
              to="/waitlist"
              className="flex items-center gap-2 border border-white/20 rounded-md px-4 py-2 hover:bg-white/5 transition-colors"
            >
              <span className="text-xs text-left">
                <span className="block text-white/50 text-[10px]">
                  {lang === "sw" ? "Pata kwenye" : "Get it on"}
                </span>
                <span className="block font-semibold text-white">
                  App Store
                </span>
              </span>
            </Link>
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

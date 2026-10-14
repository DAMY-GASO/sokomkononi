import React, { useEffect, useRef, useState } from "react";
import { Search, Zap, Star } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

// ── Typewriter ───────────────────────────────────────────────
function TypewriterText({ text, speed = 22 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;
    if (!text) return undefined;
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
        className={`inline-block w-[2px] h-[1em] align-middle ml-0.5 bg-[#FEA406] ${
          done ? "animate-blink opacity-60" : "opacity-100"
        }`}
        aria-hidden="true"
      />
    </span>
  );
}

export default function HeroSection({
  stats = {},
  onBuyNow,
  onSellNow,
  onSearch,
}) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const heroSubtitle =
    lang === "sw"
      ? "SokoMkononi ni jukwaa salama linalowaunganisha wanunuzi na wauzaji Tanzania — nyumba, viwanja, magari, biashara na zaidi."
      : "SokoMkononi is a safe platform connecting buyers and sellers across Tanzania — houses, land, cars, businesses and more.";

  return (
    <section className="relative overflow-hidden">
      {/* bahati.png background */}
      <img
        src="/bahati.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />

      {/* Tinted overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(1,15,58,0.94) 0%, rgba(1,25,87,0.86) 30%, rgba(1,25,87,0.62) 55%, rgba(1,25,87,0.28) 100%)",
        }}
      />

      {/* Grid pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
      {/* Glows */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none opacity-[0.18] blur-[120px]"
        style={{ background: "radial-gradient(circle, #FEA406 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.22] blur-[140px]"
        style={{ background: "radial-gradient(circle, #0062FD 0%, transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-14 sm:py-20 lg:py-24">
        {/* Copy column — narrower so the bottom-right cards have room */}
        <div className="max-w-2xl lg:max-w-xl xl:max-w-3xl">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-5 bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FEA406] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FEA406]" />
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-white/80 tracking-wide uppercase">
                {t("Soko la Mali Tanzania", "Property Marketplace")}
              </span>
            </div>

            <h1 className="font-bold text-white leading-[1.08] tracking-tight text-[clamp(2rem,5.5vw,3.6rem)]">
              {t("Nunua na Uza ", "Buy and Sell ")}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #FEA406 0%, #FFC857 100%)",
                }}
              >
                {t("Mali", "Property")}
              </span>
              {t(" kwa Urahisi", " Easily")}
            </h1>

            {/* Typewriter subtitle */}
            <p
              className="text-white/75 text-sm sm:text-base mt-5 max-w-xl mx-auto lg:mx-0 leading-relaxed min-h-[3.5rem] sm:min-h-[3rem]"
              aria-label={heroSubtitle}
            >
              <TypewriterText text={heroSubtitle} speed={22} />
            </p>

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearch?.(e.target.q.value);
              }}
              className="mt-7 max-w-lg mx-auto lg:mx-0"
            >
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  name="q"
                  type="text"
                  placeholder={t("Tafuta mali...", "Search listings...")}
                  className="w-full bg-white/10 border border-white/15 rounded-full pl-11 pr-32 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-[#FEA406] transition-colors backdrop-blur-sm"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-full text-xs font-semibold text-[#011957] transition-opacity hover:opacity-90"
                  style={{
                    background:
                      "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)",
                  }}
                >
                  {t("Tafuta", "Search")}
                </button>
              </div>
            </form>

            {/* Buy + Sell — slightly smaller than before */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center lg:justify-start items-center mt-8 max-w-xs sm:max-w-none mx-auto px-2">
              {/* BUY */}
              <button
                onClick={onBuyNow}
                className="group relative overflow-hidden inline-flex items-center gap-2 rounded-full
                  bg-gradient-to-r from-gold to-gold-light
                  hover:from-flame hover:to-gold
                  text-night font-semibold
                  pl-1 pr-3 sm:pl-1.5 sm:pr-6 py-1.5 sm:py-2
                  shadow-[0_8px_30px_-8px_rgba(254,164,6,0.55)]
                  hover:shadow-[0_14px_45px_-8px_rgba(254,164,6,0.75)]
                  transition-all duration-300
                  hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-night/10 group-hover:bg-night/[0.16] flex items-center justify-center shrink-0 transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                <span className="text-xs sm:text-base whitespace-nowrap">
                  {t("Nunua Sasa", "Buy Now")}
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </button>

              {/* SELL */}
              <button
                onClick={onSellNow}
                className="group relative overflow-hidden inline-flex items-center gap-2 rounded-full
                  bg-gradient-to-r from-royal to-royal-dark
                  hover:from-royal-dark hover:to-royal
                  text-white font-semibold
                  pl-1 pr-3 sm:pl-1.5 sm:pr-6 py-1.5 sm:py-2
                  shadow-[0_8px_30px_-8px_rgba(0,98,253,0.55)]
                  hover:shadow-[0_14px_45px_-8px_rgba(0,98,253,0.7)]
                  transition-all duration-300
                  hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center shrink-0 transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span className="text-xs sm:text-base whitespace-nowrap">
                  {t("Uza Sasa", "Sell Now")}
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              </button>
            </div>

            {/* Trust row */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 sm:gap-x-6 gap-y-3">
              <Stat value={`${stats.listings || 500}+`} label={t("Mali", "Listings")} />
              <Divider />
              <Stat value={`${stats.users || 140000}+`} label={t("Watumiaji", "Users")} format />
              <Divider />
              <Stat
                icon={<Star size={14} fill="#FEA406" color="#FEA406" />}
                value={stats.rating || "4.7"}
                label={t("Rated", "Rated")}
              />
            </div>
          </div>
        </div>

        {/* Float cards — bottom-right corner of the hero section */}
        <div className="hidden xl:flex flex-col gap-3 w-[240px] absolute bottom-6 right-4 2xl:right-6">
          <FloatCard
            icon={<Zap size={14} color="#FEA406" />}
            title={t("Uthibitisho wa Mali", "Verified Listings")}
            desc={t("Kila tangazo linakaguliwa", "Every listing is reviewed")}
          />
          <FloatCard
            icon={<Search size={14} color="#FEA406" />}
            title={t("Utafutaji wa Haraka", "Fast Search")}
            desc={t("Kategoria, mkoa, bei", "Category, region, price")}
            delay="80ms"
          />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label, icon, format = false }) {
  let display = value;
  if (format && typeof value === "string") {
    const n = parseInt(value.replace(/[^0-9]/g, ""), 10);
    if (Number.isFinite(n) && n >= 1000) {
      display = `${Math.round(n / 1000)}k+`;
    }
  }
  return (
    <div className="flex items-center gap-2 text-white">
      {icon}
      <span className="text-lg sm:text-2xl font-bold">{display}</span>
      <span className="text-xs text-white/60">{label}</span>
    </div>
  );
}
function Divider() {
  return (
    <span aria-hidden="true" className="hidden sm:block w-px h-5 bg-white/15" />
  );
}
function FloatCard({ icon, title, desc, delay = "0ms" }) {
  return (
    <div
      className="flex items-center gap-2.5 p-3 rounded-xl border border-white/15 backdrop-blur-xl backdrop-saturate-150"
      style={{
        animationDelay: delay,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(10,15,30,0.45) 100%)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)",
      }}
    >
      <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-[#FEA406]/15">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-white text-xs font-semibold leading-tight">{title}</p>
        <p className="text-white/55 text-[10px] mt-0.5 truncate">{desc}</p>
      </div>
    </div>
  );
}

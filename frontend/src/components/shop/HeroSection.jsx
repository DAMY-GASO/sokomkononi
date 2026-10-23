import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ArrowRight, ShieldCheck, TrendingUp, Star, MapPin,
  Sparkles, ChevronRight, Eye, Users, Home,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import SearchBar from "../ui/SearchBar.jsx";
import { usePublicListings } from "../../config/listingsStore.js";
import { api } from "../../api/client.js";
import { pickVariantUrl } from "../../utils/imageVariants.js";

/* ── Safe color constants (always visible on the navy hero) ── */
const HERO_TEXT   = "#FFFFFF";
const HERO_SUB    = "#FFFFFF";
const HERO_MUTED  = "rgba(255,255,255,0.65)";
const HERO_ACCENT = "#FEA406";

function Typewriter({ text, speed = 22 }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const iRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(text); setDone(true); return undefined; }
    setShown(""); setDone(false); iRef.current = 0;
    const id = setInterval(() => {
      if (iRef.current >= text.length) { clearInterval(id); setDone(true); return; }
      iRef.current += 1;
      setShown(text.slice(0, iRef.current));
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <span style={{ color: HERO_SUB }}>
      {shown}
      <span
        aria-hidden="true"
        className={`ml-0.5 inline-block h-[1em] w-[2px] align-middle ${done ? "animate-pulse opacity-60" : "opacity-100"}`}
        style={{ background: HERO_ACCENT }}
      />
    </span>
  );
}

function Stat({ value, label, icon }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon && (
        <span
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={{ background: "rgba(255,255,255,0.08)", color: HERO_ACCENT }}
        >
          {icon}
        </span>
      )}
      <div className="leading-tight">
        <div className="text-lg font-bold tabular-nums sm:text-xl" style={{ color: "#FFFFFF" }}>
          {value}
        </div>
        <div className="text-[11px] font-medium uppercase tracking-wider" style={{ color: HERO_MUTED }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function FloatCard({ icon, title, desc, delay = "0ms" }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3 backdrop-blur-xl"
      style={{
        animationDelay: delay,
        background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(10,15,30,0.62) 100%)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 10px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)",
      }}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: "rgba(254,164,6,0.15)", color: HERO_ACCENT }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold leading-tight" style={{ color: "#FFFFFF" }}>{title}</p>
        <p className="truncate text-[11px] leading-tight" style={{ color: HERO_MUTED }}>{desc}</p>
      </div>
    </div>
  );
}

function TrendingCard({ listing, fallbackLabel }) {
  if (!listing) {
    return (
      <div className="overflow-hidden rounded-3xl p-2 shadow-2xl"
           style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl skeleton" />
        <div className="px-3 pb-1 pt-3 space-y-2">
          <div className="h-4 rounded skeleton w-3/4" />
          <div className="h-3 rounded skeleton w-1/2" />
        </div>
      </div>
    );
  }

  const imgUrl = pickVariantUrl(listing.photos?.[0], "card") || listing.imageUrl;
  const price = Number(listing.price) || 0;
  const priceLabel = price > 0
    ? "TZS " + (price >= 1_000_000
        ? (price / 1_000_000).toFixed(price >= 10_000_000 ? 0 : 1).replace(/\.0$/, "") + "M"
        : price.toLocaleString("en-US"))
    : "";

  return (
    <Link
      to={`/mali/${listing.id}`}
      className="group block overflow-hidden rounded-3xl p-2 shadow-2xl backdrop-blur-md transition-transform hover:-translate-y-0.5"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/5">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={listing.title}
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center" style={{ color: "rgba(255,255,255,0.30)" }}>
            <Sparkles size={56} strokeWidth={1.2} />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: HERO_ACCENT, color: "#011957" }}>
          <Sparkles size={10} />
          {fallbackLabel}
        </span>
        {listing.views > 0 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm"
                style={{ color: "#FFFFFF" }}>
            <Eye size={10} /> {listing.views}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 px-3 pb-1 pt-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold" style={{ color: "#FFFFFF" }}>
            {listing.title}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px]" style={{ color: HERO_SUB }}>
            <MapPin size={12} /> {listing.location || listing.region || "Tanzania"}
          </p>
        </div>
        {priceLabel && (
          <div className="text-right shrink-0">
            <div className="text-[15px] font-bold tabular-nums" style={{ color: HERO_ACCENT }}>
              {priceLabel}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function HeroSection({ stats = {}, onBuyNow, onSellNow, onSearch }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const listings = usePublicListings();

  // ── Public stats kutoka backend ──────────────────────────
  const [publicStats, setPublicStats] = useState({
    users: 0,
    properties: 0,
    rating: 4.7,
  });

  useEffect(() => {
    let cancelled = false;
    api
      .get("/stats/public/")
      .then((res) => {
        if (cancelled) return;
        setPublicStats({
          users: Number(res?.users) || 0,
          properties: Number(res?.properties) || 0,
          rating: Number(res?.rating) || 4.7,
        });
      })
      .catch(() => {
        // Fallback kwa listings za local
        if (cancelled) return;
        setPublicStats((s) => ({
          ...s,
          properties: listings.filter((l) => l.status === "live").length,
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [listings]);

  const trending = useMemo(() => {
    if (!Array.isArray(listings) || listings.length === 0) return [];
    const live = listings.filter((l) => l.status === "live");
    const boosted = live.filter((l) => l.isBoosted || l.boostedUntil || l.boostExpiresAt);
    const pool = boosted.length > 0 ? boosted : live;
    return pool
      .slice()
      .sort((a, b) => {
        const aB = a.isBoosted ? 1 : 0;
        const bB = b.isBoosted ? 1 : 0;
        if (aB !== bB) return bB - aB;
        return (b.views || 0) - (a.views || 0);
      })
      .slice(0, 5);
  }, [listings]);

  const featuredListing = trending[0] || null;

  const subtitle =
    lang === "sw"
      ? "SokoMkononi ni jukwaa salama linalowaunganisha wanunuzi na wauzaji Tanzania — nyumba, viwanja, magari, biashara na zaidi."
      : "SokoMkononi is a safe platform connecting buyers and sellers across Tanzania — houses, land, cars, businesses and more.";

  const submit = (e) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (onSearch) onSearch(trimmed);
    else navigate(trimmed ? `/tafuta?tafuta=${encodeURIComponent(trimmed)}` : "/tafuta");
  };

  const liveCount = publicStats.properties || listings.filter((l) => l.status === "live").length;

  return (
    <section
      className="surface-night relative isolate overflow-hidden"
      style={{ background: "linear-gradient(90deg, #010F3A 0%, #011957 55%, #042475 100%)" }}
    >
      <img
        src="/bahati.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        loading="eager"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(1,15,58,0.97) 0%, rgba(1,25,87,0.90) 30%, rgba(1,25,87,0.70) 60%, rgba(1,25,87,0.36) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-40 -z-10 h-[520px] w-[520px] rounded-full opacity-20 blur-[130px]"
        style={{ background: "radial-gradient(circle, #FEA406 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 -z-10 h-[620px] w-[620px] rounded-full opacity-25 blur-[150px]"
        style={{ background: "radial-gradient(circle, #0062FD 0%, transparent 70%)" }}
      />

      <div className="container relative">
        <div className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-28">
          <div className="animate-fade-in-up lg:col-span-7 xl:col-span-6">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: HERO_ACCENT }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: HERO_ACCENT }} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: HERO_TEXT }}>
                {t("Soko la Mali Tanzania", "Property Marketplace")}
              </span>
            </span>

            <h1
              className="mt-5 max-w-[18ch] font-bold leading-[1.05] tracking-[-0.028em] text-[clamp(2rem,5.5vw,3.75rem)]"
              style={{ color: "#FFFFFF" }}
            >
              {t("Nunua na uza ", "Buy and sell ")}
              <span
                style={{
                  background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {t("mali", "property")}
              </span>
              {t(" kwa urahisi na uhakika.", " easily and with confidence.")}
            </h1>

            <p
              className="mt-5 min-h-[4rem] max-w-xl text-[15px] leading-relaxed sm:min-h-[3.5rem] sm:text-base"
              style={{ color: "#FFFFFF" }}
              aria-label={subtitle}
            >
              <Typewriter text={subtitle} speed={22} />
            </p>

            <div className="mt-8 max-w-2xl">
              <SearchBar
                value={q}
                onChange={setQ}
                onSubmit={(v) => {
                  const trimmed = v.trim();
                  if (onSearch) onSearch(trimmed);
                  else navigate(trimmed ? `/tafuta?tafuta=${encodeURIComponent(trimmed)}` : "/tafuta");
                }}
                placeholder={t("Tafuta nyumba, kiwanja, gari…", "Search houses, land, cars…")}
                size="md"
                variant="navy"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: HERO_MUTED }}>
                {t("Maarufu:", "Popular:")}
              </span>
              {[
                { slug: "nyumba", label: t("Nyumba", "Houses") },
                { slug: "viwanja", label: t("Viwanja", "Land") },
                { slug: "magari", label: t("Magari", "Cars") },
                { slug: "biashara", label: t("Biashara", "Business") },
              ].map((c) => (
                <Link
                  key={c.slug}
                  to={`/kategoria/${c.slug}`}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: HERO_TEXT,
                  }}
                >
                  {c.label}
                  <ChevronRight size={11} className="opacity-60" />
                </Link>
              ))}
            </div>

            {/* CTAs — centered, equal width, larger text */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={onBuyNow}
                className="group relative inline-flex h-14 w-full max-w-[280px] items-center justify-center gap-2.5 overflow-hidden rounded-full pl-2 pr-6 text-base font-bold transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:min-w-[200px]"
                style={{
                  background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)",
                  color: "#011957",
                  boxShadow: "0 12px 36px -12px rgba(254,164,6,0.7)",
                }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "rgba(1,25,87,0.10)" }}>
                  <Search size={18} />
                </span>
                {t("Nunua Sasa", "Buy Now")}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-[1200ms] group-hover:translate-x-full" />
              </button>
              <button
                type="button"
                onClick={onSellNow}
                className="group relative inline-flex h-14 w-full max-w-[280px] items-center justify-center gap-2.5 overflow-hidden rounded-full pl-2 pr-6 text-base font-bold transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:min-w-[200px]"
                style={{
                  background: "linear-gradient(135deg, #0062FD 0%, #0050D0 100%)",
                  color: "#FFFFFF",
                  boxShadow: "0 12px 36px -12px rgba(0,98,253,0.7)",
                }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <TrendingUp size={18} />
                </span>
                {t("Uza Sasa", "Sell Now")}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[1200ms] group-hover:translate-x-full" />
              </button>
            </div>

            {/* Stats — Users, Properties, Rated (kutoka API) */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:justify-start">
              <Stat
                icon={<Users size={15} />}
                value={(publicStats.users || 0).toLocaleString()}
                label={t("Watumiaji", "Users")}
              />
              <span aria-hidden="true" className="hidden h-8 w-px sm:block" style={{ background: "rgba(255,255,255,0.14)" }} />
              <Stat
                icon={<Home size={15} />}
                value={(publicStats.properties || 0).toLocaleString()}
                label={t("Mali", "Properties")}
              />
              <span aria-hidden="true" className="hidden h-8 w-px sm:block" style={{ background: "rgba(255,255,255,0.14)" }} />
              <Stat
                icon={<Star size={14} style={{ fill: HERO_ACCENT }} />}
                value={publicStats.rating || "4.7"}
                label={t("Rated", "Rated")}
              />
            </div>
          </div>

          <div className="relative hidden lg:col-span-5 lg:block xl:col-span-6">
            <div className="relative mx-auto max-w-md">
              <TrendingCard listing={featuredListing} fallbackLabel={t("Inayotrendi", "Trending")} />

              <div className="absolute -left-6 top-14 animate-float">
                <FloatCard icon={<ShieldCheck size={16} />} title={t("Imethibitishwa", "Verified")} desc={t("Muuzaji halisi", "Real seller")} />
              </div>
              <div className="absolute -right-4 bottom-16 animate-float-slow" style={{ animationDelay: "240ms" }}>
                <FloatCard icon={<TrendingUp size={16} />} title={`+${liveCount || 0}`} desc={t("Mali hai", "Live listings")} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
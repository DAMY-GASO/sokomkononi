import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, ShieldCheck, TrendingUp, Star, MapPin, Sparkles, ChevronRight, PlayCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

function Typewriter({ text, speed = 22 }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const iRef = useRef(0);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
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
    <span className="inline">
      {shown}
      <span aria-hidden="true" className={`ml-0.5 inline-block h-[1em] w-[2px] align-middle bg-[#FEA406] ${done ? "animate-pulse opacity-60" : "opacity-100"}`} />
    </span>
  );
}

function Stat({ value, label, icon }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon && <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-[#FEA406] backdrop-blur-sm">{icon}</span>}
      <div className="leading-tight">
        <div className="text-lg font-bold text-white tabular-nums sm:text-xl">{value}</div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-white/55">{label}</div>
      </div>
    </div>
  );
}

function FloatCard({ icon, title, desc, delay = "0ms" }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/15 p-3 backdrop-blur-xl"
         style={{ animationDelay: delay, background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(10,15,30,0.55) 100%)", boxShadow: "0 10px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)" }}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#FEA406]/15 text-[#FEA406]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[12px] font-semibold leading-tight text-white">{title}</p>
        <p className="truncate text-[11px] leading-tight text-white/55">{desc}</p>
      </div>
    </div>
  );
}

export default function HeroSection({ stats = {}, onBuyNow, onSellNow, onSearch }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const subtitle = lang === "sw"
    ? "SokoMkononi ni jukwaa salama linalowaunganisha wanunuzi na wauzaji Tanzania — nyumba, viwanja, magari, biashara na zaidi."
    : "SokoMkononi is a safe platform connecting buyers and sellers across Tanzania — houses, land, cars, businesses and more.";
  const submit = (e) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (onSearch) onSearch(trimmed);
    else navigate(trimmed ? `/tafuta?tafuta=${encodeURIComponent(trimmed)}` : "/tafuta");
  };

  return (
    <section className="relative isolate overflow-hidden">
      <img src="/bahati.webp" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover" loading="eager" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "linear-gradient(90deg, rgba(1,15,58,0.96) 0%, rgba(1,25,87,0.88) 30%, rgba(1,25,87,0.66) 60%, rgba(1,25,87,0.32) 100%)" }} />
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-40 -z-10 h-[520px] w-[520px] rounded-full opacity-20 blur-[130px]" style={{ background: "radial-gradient(circle, #FEA406 0%, transparent 70%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-40 -z-10 h-[620px] w-[620px] rounded-full opacity-25 blur-[150px]" style={{ background: "radial-gradient(circle, #0062FD 0%, transparent 70%)" }} />

      <div className="container relative">
        <div className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-28">
          <div className="animate-fade-in-up lg:col-span-7 xl:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FEA406] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FEA406]" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">{t("Soko la Mali Tanzania", "Property Marketplace")}</span>
            </span>
            <h1 className="mt-5 max-w-[18ch] font-bold leading-[1.05] tracking-[-0.028em] text-white text-[clamp(2rem,5.5vw,3.75rem)]">
              {t("Nunua na uza ", "Buy and sell ")}
              <span className="bg-gradient-to-r from-[#FEA406] to-[#FD8706] bg-clip-text text-transparent">{t("mali", "property")}</span>
              {t(" Tanzania kwa uhakika.", " in Tanzania with confidence.")}
            </h1>
            <p className="mt-5 min-h-[4rem] max-w-xl text-[15px] leading-relaxed text-white/72 sm:min-h-[3.5rem] sm:text-base" aria-label={subtitle}>
              <Typewriter text={subtitle} speed={22} />
            </p>
            <form onSubmit={submit} className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/15 bg-white/[0.06] p-1.5 backdrop-blur-md sm:flex-row sm:items-stretch">
              <span className="relative flex flex-1 items-center">
                <Search size={18} className="pointer-events-none absolute left-4 text-white/45" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Tafuta nyumba, kiwanja, gari…", "Search houses, land, cars…")} className="h-12 w-full rounded-xl bg-transparent pl-11 pr-3 text-[15px] text-white placeholder:text-white/40 outline-none" />
              </span>
              <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-[#011957] transition-transform active:translate-y-px" style={{ background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)", boxShadow: "0 10px 30px -10px rgba(254,164,6,0.6)" }}>
                {t("Tafuta", "Search")}
                <ArrowRight size={15} />
              </button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">{t("Maarufu:", "Popular:")}</span>
              {[{ slug: "nyumba", label: t("Nyumba","Houses") }, { slug: "viwanja", label: t("Viwanja","Land") }, { slug: "magari", label: t("Magari","Cars") }, { slug: "biashara", label: t("Biashara","Business") }].map((c) => (
                <Link key={c.slug} to={`/kategoria/${c.slug}`} className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/80 transition-colors hover:border-white/30 hover:bg-white/[0.10]">
                  {c.label}
                  <ChevronRight size={11} className="opacity-60" />
                </Link>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={onBuyNow} className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full pl-1.5 pr-6 text-sm font-semibold text-[#011957] transition-transform hover:-translate-y-0.5 active:translate-y-0" style={{ background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)", boxShadow: "0 12px 36px -12px rgba(254,164,6,0.7)" }}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#011957]/10"><Search size={16} /></span>
                {t("Nunua Sasa", "Buy Now")}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-[1200ms] group-hover:translate-x-full" />
              </button>
              <button type="button" onClick={onSellNow} className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full pl-1.5 pr-6 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0" style={{ background: "linear-gradient(135deg, #0062FD 0%, #0050D0 100%)", boxShadow: "0 12px 36px -12px rgba(0,98,253,0.7)" }}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15"><TrendingUp size={16} /></span>
                {t("Uza Sasa", "Sell Now")}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[1200ms] group-hover:translate-x-full" />
              </button>
              <Link to="/jinsi-ya-kununua" className="inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
                <PlayCircle size={18} />
                {t("Jinsi inavyofanya kazi", "How it works")}
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Stat icon={<MapPin size={15} />} value={`${stats.listings || "12K"}+`} label={t("Mali", "Listings")} />
              <span aria-hidden="true" className="hidden h-8 w-px bg-white/12 sm:block" />
              <Stat icon={<ShieldCheck size={15} />} value={`${stats.users || "140K"}+`} label={t("Watumiaji", "Users")} />
              <span aria-hidden="true" className="hidden h-8 w-px bg-white/12 sm:block" />
              <Stat icon={<Star size={14} className="fill-[#FEA406]" />} value={stats.rating || "4.7"} label={t("Rated", "Rated")} />
            </div>
          </div>
          <div className="relative hidden lg:col-span-5 lg:block xl:col-span-6">
            <div className="relative mx-auto max-w-md">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-2 shadow-2xl backdrop-blur-md">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-white/8 to-white/2">
                  <div className="absolute inset-0 grid place-items-center text-white/25"><Sparkles size={56} strokeWidth={1.2} /></div>
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#FEA406] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#011957]">
                    <Sparkles size={10} />
                    {t("Inayotrendi", "Trending")}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 px-3 pb-1 pt-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-white">{t("Villa ya kisasa — Masaki", "Modern Villa — Masaki")}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/60"><MapPin size={12} /> Dar es Salaam</p>
                  </div>
                  <div className="text-right"><div className="text-[15px] font-bold text-[#FEA406] tabular-nums">TZS 850M</div></div>
                </div>
              </div>
              <div className="absolute -left-6 top-14 animate-float"><FloatCard icon={<ShieldCheck size={16} />} title={t("Imethibitishwa", "Verified")} desc={t("Muuzaji halisi", "Real seller")} /></div>
              <div className="absolute -right-4 bottom-16 animate-float-slow" style={{ animationDelay: "240ms" }}><FloatCard icon={<TrendingUp size={16} />} title="+320" desc={t("Mikataba leo", "Deals today")} /></div>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-[color:rgb(var(--c-page))]" />
    </section>
  );
}

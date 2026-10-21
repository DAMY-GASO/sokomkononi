import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAppStoreLinks } from "../config/systemSettingsStore.js";
import { useAttribution } from "../context/AttributionContext.jsx";

const STORE_FALLBACKS = {
  play: "https://play.google.com/store/apps/details?id=co.tz.sokomkononi.app",
  appstore: "https://apps.apple.com/app/sokomkononi/id0000000000",
};
const SOCIAL = [
  { href: "https://facebook.com",  icon: Facebook,  label: "Facebook"  },
  { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
  { href: "https://twitter.com",   icon: Twitter,   label: "X"         },
  { href: "https://linkedin.com",  icon: Linkedin,  label: "LinkedIn"  },
  { href: "https://youtube.com",   icon: Youtube,   label: "YouTube"   },
];

// SVG logos — public/assets/payments/*.svg
// HAKIKISHA majina ya faili kwenye folder yanalingana EXACTLY na haya.
const PAYMENTS = [
  { label: "M-Pesa",       src: "/assets/payments/mpesa.svg",      fallbackBg: "#2E9E44", fallbackFg: "#FFFFFF" },
  { label: "HaloPesa",     src: "/assets/payments/halopesa.svg",   fallbackBg: "#E33C2B", fallbackFg: "#FFFFFF" },
  { label: "Mixx by Yas",  src: "/assets/payments/mixx.svg",       fallbackBg: "#FFCC00", fallbackFg: "#011957" },
  { label: "Airtel Money", src: "/assets/payments/airtel.svg",     fallbackBg: "#ED1C24", fallbackFg: "#FFFFFF" },
  { label: "NMB",          src: "/assets/payments/nmb.svg",        fallbackBg: "#00734D", fallbackFg: "#FFFFFF" },
  { label: "CRDB",         src: "/assets/payments/crdb.svg",       fallbackBg: "#0072BC", fallbackFg: "#FFFFFF" },
  { label: "Visa",         src: "/assets/payments/visa.svg",       fallbackBg: "#1A1F71", fallbackFg: "#FFFFFF" },
  { label: "Mastercard",   src: "/assets/payments/mastercard.svg", fallbackBg: "#EB001B", fallbackFg: "#FFFFFF" },
];

// Pay logo — rounded rectangle sawa kwa zote, logo inaadapt ndani
function PayLogo({ payment }) {
  const [err, setErr] = React.useState(false);

  if (err || !payment.src) {
    return (
      <span
        title={payment.label}
        className="flex h-10 w-16 items-center justify-center rounded-lg px-2 text-[10px] font-bold tracking-wide whitespace-nowrap shadow-sm"
        style={{ background: payment.fallbackBg, color: payment.fallbackFg }}
      >
        {payment.label}
      </span>
    );
  }

  return (
    <span
      title={payment.label}
      className="flex h-10 w-16 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-white/20"
    >
      <img
        src={payment.src}
        alt={payment.label}
        className="h-full w-full object-contain"
        onError={() => setErr(true)}
        loading="lazy"
      />
    </span>
  );
}

export default function Footer({ selectedLang: propLang }) {
  const { lang: ctxLang } = useLanguage();
  const lang = propLang ?? ctxLang;
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [appLinks] = useAppStoreLinks();
  const { registerTap: registerLogoTap } = useAttribution();
  const playUrl = (appLinks?.play || "").trim() || STORE_FALLBACKS.play;
  const appStoreUrl = (appLinks?.appstore || "").trim() || STORE_FALLBACKS.appstore;

  const columns = [
    { title: t("Kampuni", "Company"), links: [
      { to: "/kuhusu", label: t("Kuhusu Sisi", "About Us") },
      { to: "/mawasiliano", label: t("Wasiliana Nasi", "Contact Us") },
      { to: "/jinsi-ya-kununua", label: t("Jinsi Inavyofanya Kazi", "How it works") },
    ]},
    { title: t("Kategoria", "Categories"), links: [
      { to: "/kategoria/nyumba", label: t("Nyumba", "Houses") },
      { to: "/kategoria/viwanja", label: t("Viwanja", "Land") },
      { to: "/kategoria/magari", label: t("Magari", "Cars") },
      { to: "/kategoria/biashara", label: t("Biashara", "Business") },
    ]},
    { title: t("Msaada", "Support"), links: [
      { to: "/faragha", label: t("Sera ya Faragha", "Privacy Policy") },
      { to: "/sheria", label: t("Vigezo vya Matumizi", "Terms of Use") },
      { to: "/mawasiliano#faq", label: t("Maswali", "FAQ") },
    ]},
  ];

  return (
    <footer className="relative mt-24 overflow-hidden bg-[#010F3A] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, #FEA406, transparent 70%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, #0062FD, transparent 70%)" }} />
      <div className="container relative py-14 lg:py-20">
        <div className="mb-14 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8 lg:p-10">
          <div className="grid items-center gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#FEA406]/30 bg-[#FEA406]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FEA406]">
                {t("Pakua App", "Download App")}
              </span>
              <h2 className="mt-4 text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight text-white">
                {t("PAKUA SOKOMKONONI", "GET SOKOMKONONI")}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
                {t("Fanya biashara kwa urahisi zaidi ukiwa popote — pata taarifa za deals zako, tafuta mali, na wasiliana na Madalali/Wateja moja kwa moja kutoka simu yako.",
                   "Do business more easily wherever you are — get deal notifications, search properties, and communicate with Agents/Customers directly from your phone.")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
              <a href={playUrl || undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!playUrl} onClick={(e) => { if (!playUrl) e.preventDefault(); }} className="group inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.08]">
                <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden="true">
                  <path d="M4.5 3.5c-.3.3-.5.7-.5 1.2v14.6c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L4.6 3.4l-.1.1z" fill="#00D2FF" />
                  <path d="M15.9 15L13 12.1v-.2l2.9-2.9 6.5 3.7c.8.5.8 1.3 0 1.8l-6.5 3.7z" fill="#FFCE00" />
                  <path d="M15.9 15L13 12l-8.4 8.5c.4.4 1 .4 1.7.1L15.9 15" fill="#FF3A44" />
                  <path d="M15.9 9.1L6.3 3.6c-.7-.4-1.3-.3-1.7.1L13 12l2.9-2.9z" fill="#00F076" />
                </svg>
                <span className="text-left">
                  <span className="block text-[10px] uppercase tracking-wider text-white/50">{t("Pakua kwenye", "Download on")}</span>
                  <span className="block text-sm font-semibold text-white">Google Play</span>
                </span>
              </a>
              <a href={appStoreUrl || undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!appStoreUrl} onClick={(e) => { if (!appStoreUrl) e.preventDefault(); }} className="group inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.08]">
                <svg viewBox="0 0 384 512" className="h-6 w-6 shrink-0 fill-white" aria-hidden="true">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.3c0 26.2 4.8 53.3 14.4 81.3 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.8zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
                <span className="text-left">
                  <span className="block text-[10px] uppercase tracking-wider text-white/50">{t("Pakua kwenye", "Download on")}</span>
                  <span className="block text-sm font-semibold text-white">App Store</span>
                </span>
              </a>
            </div>
          </div>
        </div>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-4">
            {/* Logo — favicon.svg moja kwa moja, hakuna circle nene */}
            <Link to="/" onClick={registerLogoTap} className="inline-flex items-center gap-2.5">
              <img src="/favicon.svg" alt="SokoMkononi" className="h-9 w-9 object-contain" />
              <span className="text-[16px] font-bold text-white">Soko<span className="text-[#FEA406]">Mkononi</span></span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/55">
              {t("Jukwaa la kuaminika la kununua na kuuza mali nchini Tanzania.", "A trusted platform for buying and selling property in Tanzania.")}
            </p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5 text-white/60"><Mail size={15} className="shrink-0 text-white/35" /><a href="mailto:hello@sokomkononi.co.tz" className="hover:text-white">hello@sokomkononi.co.tz</a></li>
              <li className="flex items-center gap-2.5 text-white/60"><Phone size={15} className="shrink-0 text-white/35" /><a href="tel:+255743895038" className="hover:text-white">+255 743 895 038</a></li>
              <li className="flex items-center gap-2.5 text-white/60"><MapPin size={15} className="shrink-0 text-white/35" />Dar es Salaam, Tanzania</li>
            </ul>
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL.map((s) => { const Icon = s.icon; return (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 transition-all hover:border-white/30 hover:bg-white/[0.06] hover:text-white">
                  <Icon size={15} />
                </a>
              ); })}
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}><Link to={l.to} className="text-sm text-white/70 transition-colors hover:text-white">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
          <div className="lg:col-span-2">
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">{t("Karibu", "Say hi")}</h4>
            <Link to="/mawasiliano" className="group flex items-center justify-between gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-white transition-all hover:border-white/30 hover:bg-white/[0.06]">
              {t("Andika ujumbe", "Send a message")}
              <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-6 border-t border-white/[0.08] pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="order-2 lg:order-1">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">{t("Malipo yanakubaliwa", "Payments accepted")}</p>
            <div className="flex flex-wrap items-center gap-2">
              {PAYMENTS.map((p) => (
                <PayLogo key={p.label} payment={p} />
              ))}
            </div>
          </div>
          <p className="order-1 text-xs text-white/40 lg:order-2">
            © {new Date().getFullYear()} SokoMkononi. {t("Haki zote zimehifadhiwa.", "All rights reserved.")}
          </p>
        </div>
      </div>
    </footer>
  );
}
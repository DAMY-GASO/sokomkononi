import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAppStoreLinks, useContactInfo } from "../config/systemSettingsStore.js";
import { useAttribution } from "../context/AttributionContext.jsx";
import { useActiveCategories } from "../config/categoriesStore.js";
import { usePublicListings } from "../config/listingsStore.js";

// ── WhatsApp Icon Halisi (SVG) ─────────────────────────────
function WhatsAppIcon({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Viungo vya Play Store / App Store ──────────────────────────
function validPlayUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && x.hostname === "play.google.com" && x.pathname.startsWith("/store/apps/details") && !!x.searchParams.get("id");
  } catch { return false; }
}
function validAppStoreUrl(u) {
  try {
    const x = new URL(u);
    const m = x.pathname.match(/\/id(\d{6,})/);
    return x.protocol === "https:" && (x.hostname === "apps.apple.com" || x.hostname === "itunes.apple.com") && !!m && Number(m[1]) > 0;
  } catch { return false; }
}

// SVG logos — public/assets/payments/*.svg
const PAYMENTS = [
  { label: "M-Pesa",       src: "/assets/payments/mpesa.svg",      fallbackBg: "#2E9E44", fallbackFg: "#FFFFFF" },
  { label: "HaloPesa",     src: "/assets/payments/halopesa.svg",   fallbackBg: "#E33C2B", fallbackFg: "#FFFFFF" },
  { label: "Mixx by Yas",  src: "/assets/payments/mixx-by-yas.svg",       fallbackBg: "#FFCC00", fallbackFg: "#011957" },
  { label: "Airtel Money", src: "/assets/payments/airtel-money.svg",     fallbackBg: "#ED1C24", fallbackFg: "#FFFFFF" },
  { label: "NMB",          src: "/assets/payments/nmb.svg",        fallbackBg: "#00734D", fallbackFg: "#FFFFFF" },
  { label: "CRDB",         src: "/assets/payments/crdb.svg",       fallbackBg: "#0072BC", fallbackFg: "#FFFFFF" },
  { label: "Visa",         src: "/assets/payments/visa.svg",       fallbackBg: "#1A1F71", fallbackFg: "#FFFFFF" },
  { label: "Mastercard",   src: "/assets/payments/mastercard.svg", fallbackBg: "#EB001B", fallbackFg: "#FFFFFF" },
];

function PayLogo({ payment }) {
  const [err, setErr] = React.useState(false);
  if (err || !payment.src) {
    return (
      <span title={payment.label} className="flex h-8 w-14 items-center justify-center rounded-md px-1 text-[9px] font-bold tracking-wide whitespace-nowrap shadow-sm" style={{ background: payment.fallbackBg, color: payment.fallbackFg }}>
        {payment.label}
      </span>
    );
  }
  return (
    <span title={payment.label} className="flex h-8 w-14 items-center justify-center rounded-md bg-white/95 p-1 shadow-sm ring-1 ring-white/10">
      <img src={payment.src} alt={payment.label} className="h-full w-full object-contain" onError={() => setErr(true)} loading="lazy" />
    </span>
  );
}

export default function Footer({ selectedLang: propLang }) {
  const { lang: ctxLang } = useLanguage();
  const lang = propLang ?? ctxLang;
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [appLinks] = useAppStoreLinks();
  const [contactInfo] = useContactInfo();
  const { registerTap: registerLogoTap } = useAttribution();

  const email = contactInfo?.email || "support@sokomkononi.co.tz";
  const phone = contactInfo?.phone || "+255743895038";
  const whatsappNumber = contactInfo?.whatsapp || "255743895038";
  const address = contactInfo?.address || "Dar es Salaam, Tanzania";

  // ✅ Dynamic Social URLs kutoka Contact Info
  const SOCIAL = [
    { href: contactInfo?.facebook,  icon: Facebook,  label: "Facebook"  },
    { href: contactInfo?.instagram, icon: Instagram, label: "Instagram" },
    { href: contactInfo?.x,         icon: Twitter,   label: "X"         },
    { href: contactInfo?.linkedin,  icon: Linkedin,  label: "LinkedIn"  },
    { href: contactInfo?.youtube,   icon: Youtube,   label: "YouTube"   },
  ].filter((x) => x.href && x.href.trim().startsWith("http"));

  const playRaw = (appLinks?.play || "").trim();
  const appStoreRaw = (appLinks?.appstore || "").trim();
  const playUrl = validPlayUrl(playRaw) ? playRaw : "";
  const appStoreUrl = validAppStoreUrl(appStoreRaw) ? appStoreRaw : "";
  const hasStoreLinks = Boolean(playUrl || appStoreUrl);

  const allCategories = useActiveCategories();
  const allListings = usePublicListings();
  const categoryLinks = React.useMemo(() => {
    const live = (allListings || []).filter((l) => l.status === "live");
    return (allCategories || [])
      .map((c) => ({ c, n: live.filter((l) => String(l.category) === String(c.key)).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 4)
      .map(({ c }) => ({
        to: `/kategoria/${c.key}`,
        label: c.label?.[lang] || c.label?.sw || String(c.key),
      }));
  }, [allCategories, allListings, lang]);

  const columns = [
    { title: t("Kampuni", "Company"), links: [
      { to: "/kuhusu", label: t("Kuhusu Sisi", "About Us") },
      { to: "/mawasiliano", label: t("Wasiliana Nasi", "Contact Us") },
      { to: "/jinsi-ya-kununua", label: t("Jinsi Inavyofanya Kazi", "How it works") },
      { to: "/jinsi-ya-kuuza", label: t("Jinsi ya Kuuza", "How to Sell") }, // ✅ MPYA
    ]},
    { title: t("Kategoria", "Categories"), links: [
      ...categoryLinks,
      { to: "/kategoria", label: t("Kategoria zote", "All categories") },
    ]},
    { title: t("Msaada", "Support"), links: [
      { to: "/faragha", label: t("Sera ya Faragha", "Privacy Policy") },
      { to: "/sheria", label: t("Vigezo vya Matumizi", "Terms of Use") },
      { to: "/mawasiliano#faq", label: t("Maswali", "FAQ") },
      { to: "/jinsi-ya-kuuza", label: t("Jinsi ya Kuuza", "How to Sell") }, // ✅ MPYA
    ]},
  ];

  return (
    <footer className="relative mt-24 overflow-hidden bg-night-deep text-white">
      <div className="container relative py-14 lg:py-20">
        {hasStoreLinks && (
        <div className="mb-14 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8 lg:p-10">
          <div className="grid items-center gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
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
              {playUrl && (
              <a href={playUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.08]">
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
            )}
              {appStoreUrl && (
              <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.08]">
                <svg viewBox="0 0 384 512" className="h-6 w-6 shrink-0 fill-white" aria-hidden="true">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.3c0 26.2 4.8 53.3 14.4 81.3 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.8zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
                <span className="text-left">
                  <span className="block text-[10px] uppercase tracking-wider text-white/50">{t("Pakua kwenye", "Download on")}</span>
                  <span className="block text-sm font-semibold text-white">App Store</span>
                </span>
              </a>
            )}
            </div>
          </div>
        </div>
        )}
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-4">
            <Link to="/" onClick={registerLogoTap} className="inline-flex items-center gap-2.5">
              <img src="/logo.webp" alt="SokoMkononi" className="h-9 w-9 rounded-full object-cover" />
              <span className="text-[16px] font-bold text-white">Soko<span className="text-gold">Mkononi</span></span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/55">
              {t("Jukwaa la kuaminika la kununua na kuuza mali nchini Tanzania.", "A trusted platform for buying and selling property in Tanzania.")}
            </p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5 text-white/60">
                <Mail size={15} className="shrink-0 text-white/35" />
                <a href={`mailto:${email}`} className="hover:text-white">{email}</a>
              </li>
              <li className="flex items-center gap-2.5 text-white/60">
                <Phone size={15} className="shrink-0 text-white/35" />
                <a href={`tel:${phone}`} className="hover:text-white">{phone}</a>
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="ml-1 grid h-6 w-6 place-items-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-110"
                >
                  <WhatsAppIcon size={14} />
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-white/60">
                <MapPin size={15} className="shrink-0 text-white/35" />
                {address}
              </li>
            </ul>
            {SOCIAL.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL.map((s) => { const Icon = s.icon; return (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 transition-all hover:border-white/30 hover:bg-white/[0.06] hover:text-white">
                  <Icon size={15} />
                </a>
              ); })}
            </div>
            )}
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
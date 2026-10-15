import React from "react";
import { ShieldCheck, BadgeCheck, Headphones, Lock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

/**
 * TrustBar — 4 trust cards below the hero.
 *   • Cards with gradient icon tiles, hover-lift, theme-aware
 *   • No third-party brand names (FimiPay removed per spec)
 *   • 4-across on desktop, 2-across on tablet, 1-across on phone
 */
export default function TrustBar() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const items = [
    {
      Icon: ShieldCheck,
      title: t("Malipo Salama", "Secure Payment"),
      desc: t("Ulinzi wa kila muamala", "Every transaction protected"),
      color: "#0062FD",
      hint: t("SSL", "SSL"),
    },
    {
      Icon: BadgeCheck,
      title: t("Wauzaji Waliohakikiwa", "Verified Sellers"),
      desc: t("Uthibitisho kamili wa utambulisho", "Full identity verification"),
      color: "#2F6D4F",
      hint: t("KYC", "KYC"),
    },
    {
      Icon: Headphones,
      title: t("Msaada wa Haraka", "Fast Support"),
      desc: t("Timu yetu iko tayari saa 24/7", "Our team is available 24/7"),
      color: "#FEA406",
      hint: "24/7",
    },
    {
      Icon: Lock,
      title: t("Faragha Yako", "Your Privacy"),
      desc: t("Data yako inalindwa kikamilifu", "Your data is fully protected"),
      color: "#7C3AED",
      hint: t("Siri", "Private"),
    },
  ];

  return (
    <section className="relative border-y border-[color:rgb(var(--c-hairline))] bg-card">
      <div className="container py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 stagger">
          {items.map(({ Icon, title, desc, color, hint }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-[color:rgb(var(--c-hairline))] bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Accent gradient strip on top */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)` }}
              />
              {/* Ambient glow on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
                style={{ background: color }}
              />

              <div className="relative flex flex-col gap-3">
                {/* Icon tile */}
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `${color}15`,
                    color,
                    border: `1px solid ${color}30`,
                  }}
                >
                  <Icon size={20} strokeWidth={1.9} />
                </span>

                {/* Hint badge */}
                <span
                  className="absolute right-0 top-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: `${color}15`, color }}
                >
                  {hint}
                </span>

                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold leading-tight text-primary">
                    {title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-snug text-secondary">
                    {desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

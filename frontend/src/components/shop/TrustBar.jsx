import React from "react";
import { ShieldCheck, BadgeCheck, Headphones, Lock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function TrustBar() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const items = [
    { Icon: ShieldCheck, title: t("Malipo Salama", "Secure Payment"),   desc: t("Ulinzi wa FimiPay", "FimiPay protected") },
    { Icon: BadgeCheck,  title: t("Wauzaji Waliohakikiwa", "Verified Sellers"), desc: t("Uthibitisho kamili", "Full verification") },
    { Icon: Headphones,  title: t("Msaada wa Haraka", "Fast Support"),   desc: t("Saa 24/7", "24/7 support") },
    { Icon: Lock,        title: t("Faragha Yako", "Your Privacy"),       desc: t("Data salama", "Data secured") },
  ];
  return (
    <section className="border-y border-[color:rgb(var(--c-hairline))] bg-card">
      <div className="container py-6 sm:py-8 grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6">
        {items.map(({ Icon, title, desc }, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="icon-tile icon-tile-gold"><Icon size={18} /></div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-primary leading-tight">{title}</p>
              <p className="text-xs text-secondary mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

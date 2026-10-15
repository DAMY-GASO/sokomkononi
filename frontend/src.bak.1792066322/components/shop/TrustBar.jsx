import React from "react";
import { ShieldCheck, BadgeCheck, Headphones, Lock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function TrustBar() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const items = [
    { icon: ShieldCheck, title: t("Malipo Salama", "Secure Payment"),  desc: t("Ulinzi wa FimiPay", "FimiPay protected") },
    { icon: BadgeCheck,  title: t("Wauzaji Waliohakikiwa", "Verified Sellers"), desc: t("Uthibitisho kamili", "Full verification") },
    { icon: Headphones,  title: t("Msaada wa Haraka", "Fast Support"),   desc: t("Saa 24/7", "24/7 support") },
    { icon: Lock,        title: t("Faragha Yako", "Your Privacy"),       desc: t("Data salama", "Data secured") },
  ];

  return (
    <section className="bg-card border-y border-hairline">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {items.map(({ icon: Icon, title, desc }, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(254,164,6,0.12)" }}
            >
              <Icon size={18} color="#FEA406" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary leading-tight">{title}</p>
              <p className="text-xs text-secondary mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

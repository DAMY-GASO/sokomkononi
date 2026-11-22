import React from "react";
import { ShieldCheck, BadgeCheck, Headphones } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function BenefitTiles() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const items = [
    { Icon: ShieldCheck, title: t("Malipo Salama", "Secure Payment"), desc: t("FimiPay encrypted", "FimiPay encrypted") },
    { Icon: BadgeCheck,  title: t("Mali Imethibitishwa", "Verified Listing"), desc: t("Imekaguliwa na admin", "Reviewed by admin") },
    { Icon: Headphones,  title: t("Msaada wa Haraka", "Fast Support"), desc: t("Saa 24/7", "24/7 help") },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card p-4">
      {items.map(({ Icon, title, desc }, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="icon-tile icon-tile-gold"><Icon size={16} /></div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary leading-tight">{title}</p>
            <p className="text-[11px] text-secondary mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

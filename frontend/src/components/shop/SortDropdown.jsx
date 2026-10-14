import React from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

const OPTIONS = [
  { value: "newest",     label: { sw: "Mpya Kwanza",       en: "Newest First" } },
  { value: "price_low",  label: { sw: "Bei: Chini → Juu",  en: "Price: Low → High" } },
  { value: "price_high", label: { sw: "Bei: Juu → Chini",  en: "Price: High → Low" } },
  { value: "popular",    label: { sw: "Maarufu",           en: "Popular" } },
];

export default function SortDropdown({ value = "newest", onChange, className = "" }) {
  const { lang } = useLanguage();
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label={lang === "sw" ? "Panga kwa" : "Sort by"}
        className={
          "appearance-none rounded-lg pl-3 pr-8 py-2 text-sm font-medium " +
          "text-primary bg-white border border-sandline " +
          "focus:outline-none focus:border-royal cursor-pointer transition-colors"
        }
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label[lang] || o.label.sw}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
      />
    </div>
  );
}

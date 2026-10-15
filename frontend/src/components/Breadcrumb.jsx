import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function Breadcrumb({ items = [], homeIcon = true, className = "" }) {
  const { lang } = useLanguage();
  if (!items.length) return null;
  return (
    <nav aria-label={lang === "sw" ? "Njia ya urambazaji" : "Breadcrumb"} className={`flex items-center flex-wrap gap-1.5 text-xs sm:text-sm ${className}`}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const showIcon = homeIcon && idx === 0;
        return (
          <React.Fragment key={idx}>
            {isLast ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-white truncate max-w-[220px] sm:max-w-none">
                {showIcon && <Home size={12} />}
                {item.label}
              </span>
            ) : (
              <Link to={item.to || "/"} className="inline-flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
                {showIcon && <Home size={12} />}
                {item.label}
              </Link>
            )}
            {!isLast && <ChevronRight size={12} className="shrink-0 text-white/40" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

/**
 * Breadcrumb — pass an array of items:
 *   [{ label: "Nyumbani", to: "/" }, { label: "Kategoria", to: "/kategoria" }, { label: "..." }]
 * Last item renders as plain text.
 */
export default function Breadcrumb({ items = [], homeIcon = true, className = "" }) {
  const { lang } = useLanguage();
  if (!items.length) return null;

  return (
    <nav
      aria-label={lang === "sw" ? "Njia ya urambazaji" : "Breadcrumb"}
      className={`flex items-center flex-wrap gap-1.5 text-xs sm:text-sm text-white/60 ${className}`}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const showIcon = homeIcon && idx === 0;
        return (
          <React.Fragment key={idx}>
            {isLast ? (
              <span className="text-white font-medium truncate max-w-[220px] sm:max-w-none inline-flex items-center gap-1.5">
                {showIcon && <Home size={12} />}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to || "/"}
                className="hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                {showIcon && <Home size={12} />}
                {item.label}
              </Link>
            )}
            {!isLast && <ChevronRight size={12} className="shrink-0" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

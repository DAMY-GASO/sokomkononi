import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

function range(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3)
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onChange,
  className = "",
}) {
  const { lang } = useLanguage();
  if (totalPages <= 1) return null;
  const pages = range(currentPage, totalPages);

  return (
    <nav
      aria-label={lang === "sw" ? "Kurasa" : "Pagination"}
      className={`flex items-center justify-center gap-1.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange?.(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-lg border border-sandline flex items-center justify-center text-primary disabled:opacity-40 hover:bg-sand transition-colors"
        aria-label={lang === "sw" ? "Iliyotangulia" : "Previous"}
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-1 text-muted select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange?.(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={
              "w-9 h-9 rounded-lg text-sm font-medium transition-colors " +
              (p === currentPage
                ? "text-[#011957]"
                : "border border-sandline text-primary hover:bg-sand")
            }
            style={
              p === currentPage
                ? { background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)" }
                : undefined
            }
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange?.(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-lg border border-sandline flex items-center justify-center text-primary disabled:opacity-40 hover:bg-sand transition-colors"
        aria-label={lang === "sw" ? "Inayofuata" : "Next"}
      >
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}

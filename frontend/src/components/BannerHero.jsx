// src/components/BannerHero.jsx
// ============================================================
// BannerHero — inaonyesha banners zilizo active kutoka contentStore
// kwenye HomePage. Ina slider rahisi kama kuna banner zaidi ya moja.
// ============================================================
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useContent } from "../config/contentStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { COLORS } from "../pages/dashboard/components/shared.js";

export default function BannerHero() {
  const content = useContent();
  const { lang } = useLanguage();
  const [idx, setIdx] = useState(0);

  const banners = (content?.banners || []).filter(
    (b) => b.active !== false && (b.imageUrl || b.title?.sw || b.title?.en)
  );

  // Reset index kama banners zimebadilika
  useEffect(() => {
    setIdx(0);
  }, [banners.length]);

  // Auto-rotate kila sekunde 6 kama kuna banner zaidi ya moja
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % banners.length);
    }, 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const b = banners[idx];
  const hasImage = Boolean(b.imageUrl);
  const title = b.title?.[lang] || b.title?.sw || "";
  const subtitle = b.subtitle?.[lang] || b.subtitle?.sw || "";
  const ctaText = b.ctaText?.[lang] || b.ctaText?.sw || "";

  return (
    <section className="relative w-full">
      <div
        className="relative w-full overflow-hidden"
        style={{ minHeight: "clamp(220px, 40vw, 420px)" }}
      >
        {hasImage ? (
          <img
            src={b.imageUrl}
            alt={title || "Banner"}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${COLORS.night} 0%, #1a2842 100%)`,
            }}
          />
        )}

        {/* Overlay kwa maandishi yasomeke */}
        <div
          className="absolute inset-0"
          style={{
            background: hasImage
              ? "linear-gradient(90deg, rgba(16,26,46,0.85) 0%, rgba(16,26,46,0.4) 60%, rgba(16,26,46,0.1) 100%)"
              : "transparent",
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col justify-center h-full">
          <div className="max-w-xl">
            {title && (
              <h2
                className="font-bold leading-tight text-white"
                style={{ fontSize: "clamp(1.5rem, 4vw, 2.75rem)" }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-white/80 mt-3 leading-relaxed"
                style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)" }}
              >
                {subtitle}
              </p>
            )}
            {ctaText && b.ctaLink && (
              <Link
                to={b.ctaLink}
                className="inline-flex items-center gap-2 mt-6 rounded-full font-semibold px-5 py-2.5 transition-all hover:-translate-y-0.5"
                style={{
                  background: COLORS.gold,
                  color: COLORS.night,
                  boxShadow: "0 8px 24px -10px rgba(232,163,61,0.7)",
                }}
              >
                {ctaText}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Arrows kama kuna banner zaidi ya moja */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + banners.length) % banners.length)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-20"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % banners.length)}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-20"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`rounded-full transition-all ${
                    i === idx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                  }`}
                  aria-label={`Go to banner ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
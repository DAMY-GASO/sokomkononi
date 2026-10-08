// src/components/BannerHero.jsx
// ============================================================
// BannerHero — inaonyesha banners zilizo active kutoka contentStore
// kwenye HomePage. Maandishi yote yamewekwa katikati (centered).
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

  const banners = (content?.banners || [])
    .filter(
      (b) =>
        b.active !== false &&
        (b.imageUrl || b.title?.sw || b.title?.en)
    )
    .sort((a, b) => (a.order ?? 1) - (b.order ?? 1));

  useEffect(() => {
    setIdx(0);
  }, [banners.length]);

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
        style={{ minHeight: "clamp(240px, 42vw, 460px)" }}
      >
        {/* Background — picha au gradient */}
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

        {/* Overlay — inaimarisha maandishi yasomeke */}
        <div
          className="absolute inset-0"
          style={{
            background: hasImage
              ? "linear-gradient(180deg, rgba(16,26,46,0.55) 0%, rgba(16,26,46,0.75) 100%)"
              : "transparent",
          }}
        />

        {/* Content — centered */}
        <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            {title && (
              <h2
                className="font-bold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
                style={{ fontSize: "clamp(1.6rem, 4.2vw, 2.9rem)" }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-white/90 mt-4 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                style={{ fontSize: "clamp(0.95rem, 2vw, 1.15rem)" }}
              >
                {subtitle}
              </p>
            )}
            {ctaText && b.ctaLink && (
              <Link
                to={b.ctaLink}
                className="inline-flex items-center gap-2 mt-7 rounded-full font-semibold px-6 py-3 transition-all hover:-translate-y-0.5"
                style={{
                  background: COLORS.gold,
                  color: COLORS.night,
                  boxShadow: "0 10px 28px -10px rgba(232,163,61,0.75)",
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

        {/* Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + banners.length) % banners.length)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center transition-colors z-20"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % banners.length)}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center transition-colors z-20"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`rounded-full transition-all ${
                    i === idx ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
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
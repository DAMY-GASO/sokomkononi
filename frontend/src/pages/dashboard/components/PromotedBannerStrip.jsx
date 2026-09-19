import React, { useState, useEffect } from "react";
import { Megaphone, MapPin, ChevronRight } from "lucide-react";
import { COLORS, getCategory, formatTZS } from "./shared";
import { useActiveBannerAds } from "../../../config/bannerAdsStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";

const ROTATION_MS = 5000;

// ============================================================
// PromotedBannerStrip
// Banner inayozunguka (kila sekunde 5) kwenye Dashboard.
// KILA KITU CENTERED + bilingual kamili.
// ============================================================
export default function PromotedBannerStrip({ onOpenListing = () => {} }) {
  const { lang } = useLanguage();
  const banners = useActiveBannerAds();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[index % banners.length];
  const category = getCategory(banner.category);
  const Icon = category?.icon;

  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <button
      onClick={() => onOpenListing(banner.listingId)}
      style={{
        background: `linear-gradient(90deg, ${COLORS.night} 0%, ${COLORS.nightSoft} 100%)`,
      }}
      className="w-full flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4 py-3 text-center sm:text-left transition-opacity hover:opacity-95"
      aria-label={t("Tangazo lililolipiwa", "Sponsored listing")}
    >
      {/* Badge + Icon — centered kwenye mobile, inline kwenye desktop */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          style={{ background: "rgba(232,163,61,0.18)", color: COLORS.gold }}
          className="flex items-center gap-1 text-body-sm font-bold px-2 py-1 rounded-full uppercase tracking-wide"
        >
          <Megaphone size={11} /> {t("Tangazo", "Sponsored")}
        </span>

        <div
          style={{ background: COLORS.gold }}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        >
          {Icon && <Icon size={15} color={COLORS.night} />}
        </div>
      </div>

      {/* Title + Location/Price — centered */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p
          style={{ color: COLORS.sand }}
          className="text-sm font-semibold truncate"
        >
          {banner.listingTitle}
        </p>
        <p
          style={{ color: "rgba(245,243,236,0.6)" }}
          className="flex items-center justify-center sm:justify-start gap-1 text-body-sm truncate"
        >
          <MapPin size={10} className="shrink-0" /> {banner.location}
          <span className="mx-1">•</span>
          {formatTZS(banner.price)}
        </p>
      </div>

      {/* Dots — centered */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-1 shrink-0">
          {banners.map((_, i) => (
            <span
              key={i}
              style={{
                background:
                  i === index % banners.length
                    ? COLORS.gold
                    : "rgba(245,243,236,0.25)",
              }}
              className="w-1.5 h-1.5 rounded-full"
            />
          ))}
        </div>
      )}

      {/* Chevron — centered kwenye mobile, inline kwenye desktop */}
      <ChevronRight
        size={16}
        color="rgba(245,243,236,0.5)"
        className="shrink-0 hidden sm:block"
      />
    </button>
  );
}

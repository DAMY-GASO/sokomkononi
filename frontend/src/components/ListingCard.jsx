import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import ListingImage from "./ListingImage.jsx";
import { isBoostActive } from "../pages/dashboard/components/shared";

export function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

const STATUS_CHIP = {
  reserved: { sw: "Imehifadhiwa", en: "Reserved", cls: "bg-gold text-night" },
  pending_payment: { sw: "Inasubiri malipo", en: "Pending payment", cls: "bg-gold text-night" },
  sold: { sw: "Imeuzwa", en: "Sold", cls: "bg-night text-white" },
};

/**
 * ListingCard
 * Grid mode: vertical card (default).
 * List mode: horizontal row with thumbnail on the left.
 * Optional heart overlay when onToggleSave is provided.
 */
export default function ListingCard({
  listing,
  category,
  Icon,
  lang = "sw",
  to,
  viewMode = "grid",
  isSaved = false,
  onToggleSave,
}) {
  const navigate = useNavigate();
  const photos = Array.isArray(listing.photos) ? listing.photos : [];
  const photo = listing.imageUrl || photos[0] || category?.imageUrl || null;
  const extra = photos.length > 1 ? photos.length : 0;
  const chip = STATUS_CHIP[listing.status];
  const featured = isBoostActive(listing);
  const sold = listing.status === "sold";
  const href = to || `/mali/${listing.id}`;

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onToggleSave === "function") onToggleSave(listing.id, listing);
  };

  const HeartButton = onToggleSave ? (
    <button
      type="button"
      onClick={handleSave}
      aria-label={isSaved ? "Remove from saved" : "Save"}
      className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
        isSaved
          ? "bg-rust border-rust text-white"
          : "bg-white/90 border-white/70 text-night hover:bg-white"
      }`}
    >
      <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
    </button>
  ) : null;

  // ── LIST MODE ────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <Link
        to={href}
        className={`group relative flex gap-3 rounded-2xl border-[1.5px] bg-white p-2 shadow-[0_1px_2px_rgba(1,25,87,0.04)] transition-all duration-200 hover:border-gold hover:shadow-[0_12px_24px_-14px_rgba(254,164,6,0.7)] ${
          featured ? "border-gold" : "border-sandline"
        } ${sold ? "opacity-80" : ""}`}
      >
        <div className="relative shrink-0 overflow-hidden rounded-xl w-32 h-32 sm:w-40 sm:h-40">
          <ListingImage
            src={photo}
            alt={listing.title}
            ratio="aspect-square"
            fallback={Icon ? <Icon size={32} strokeWidth={1.6} /> : null}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
          <p className="text-lg font-bold leading-tight text-night">
            {formatTZS(listing.price)}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-normal leading-snug text-text-primary">
            {listing.title}
          </h3>
          <p className="mt-auto flex items-center gap-1 truncate pt-2 text-xs text-secondary">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{listing.region || listing.location}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {featured && !sold && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-night">
                {lang === "sw" ? "Imeangaziwa" : "Featured"}
              </span>
            )}
            {chip && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${chip.cls}`}>
                {chip[lang] || chip.sw}
              </span>
            )}
          </div>
        </div>
        {HeartButton}
      </Link>
    );
  }

  // ── GRID MODE (default) ─────────────────────────────
  return (
    <Link
      to={href}
      className={`group relative flex h-full flex-col rounded-2xl border-[1.5px] bg-white p-1.5 shadow-[0_1px_2px_rgba(1,25,87,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_12px_24px_-14px_rgba(254,164,6,0.7)] focus-visible:outline-offset-4 sm:p-2 ${
        featured ? "border-gold" : "border-sandline"
      } ${sold ? "opacity-80" : ""}`}
    >
      <div className="relative overflow-hidden rounded-xl">
        <ListingImage
          src={photo}
          alt={listing.title}
          ratio="aspect-square"
          fallback={Icon ? <Icon size={44} strokeWidth={1.6} /> : null}
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {featured && !sold && (
            <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-night shadow-sm">
              {lang === "sw" ? "Imeangaziwa" : "Featured"}
            </span>
          )}
          {chip && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ${chip.cls}`}>
              {chip[lang] || chip.sw}
            </span>
          )}
        </div>
        {extra > 0 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {extra}
          </span>
        )}
        {HeartButton}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-2.5">
        <p className="text-[17px] font-bold leading-tight text-night sm:text-lg">
          {formatTZS(listing.price)}
        </p>
        <h3
          className="mt-1 min-h-[2.4rem] text-sm font-normal leading-snug text-text-primary"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {listing.title}
        </h3>
        <p className="mt-auto flex items-center gap-1 truncate pt-1 text-xs text-secondary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">{listing.region || listing.location}</span>
        </p>
      </div>
    </Link>
  );
}

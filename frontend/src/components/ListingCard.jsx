import React from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Camera } from "lucide-react";
import ListingImage from "./ListingImage.jsx";
import { isBoostActive } from "../utils/listings.js";
import { Badge, cx } from "./ui";

// ✅ SAFE: hakikisha ni string kila mara
function safeStr(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return "";
  if (typeof v === "object") {
    if (typeof v.sw === "string") return v.sw;
    if (typeof v.en === "string") return v.en;
    if (typeof v.name === "string") return v.name;
    if (typeof v.label === "string") return v.label;
    if (typeof v.slug === "string") return v.slug;
    if (typeof v.key === "string") return v.key;
  }
  return "";
}

export function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

const STATUS = {
  reserved: { sw: "Imehifadhiwa", en: "Reserved", variant: "gold" },
  pending_payment: { sw: "Haijalipwa", en: "Unpaid", variant: "night" },
  sold: { sw: "Imeuzwa", en: "Sold", variant: "night" },
};

export default function ListingCard({
  listing,
  category: rawCategory,
  Icon,
  lang = "sw",
  to,
  viewMode = "grid",
  isSaved = false,
  onToggleSave,
}) {
  // ✅ FIX: category ni STRING kila mara (kama ni object, chukua key/slug/name)
  const categoryImageUrl = (() => {
    if (!rawCategory) return null;
    if (typeof rawCategory === "string") return null;
    if (typeof rawCategory === "object") {
      const url = rawCategory.imageUrl || rawCategory.image_url;
      return typeof url === "string" ? url : null;
    }
    return null;
  })();

  const photos = Array.isArray(listing.photos) ? listing.photos : [];
  const photo = photos[0] || listing.imageUrl || categoryImageUrl || null;
  const extra = photos.length > 1 ? photos.length - 1 : 0;
  const chip = STATUS[listing.status];
  const featured = isBoostActive(listing);
  const sold = listing.status === "sold";
  const href = to || `/mali/${listing.id}`;
  const location = safeStr(listing.region) || safeStr(listing.location);

  const HeartBtn = onToggleSave ? (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleSave(listing.id, listing);
      }}
      aria-label={isSaved ? "Remove from saved" : "Save"}
      className={cx(
        "absolute right-2.5 top-2.5 z-10 grid h-9 w-9 place-items-center rounded-full transition-all",
        isSaved
          ? "bg-[#C1502E] text-white shadow-md"
          : "bg-white/95 text-night backdrop-blur-sm hover:bg-white shadow-sm dark:bg-[rgb(8,24,68)]/90 dark:text-white"
      )}
    >
      <Heart size={15} fill={isSaved ? "currentColor" : "none"} />
    </button>
  ) : null;

  if (viewMode === "list") {
    return (
      <Link
        to={href}
        className={cx(
          "group relative flex gap-3 rounded-2xl bg-card p-2 hover-lift border",
          featured
            ? "border-[color:rgb(var(--c-gold)/0.6)]"
            : "border-[color:rgb(var(--c-hairline))]",
          sold && "opacity-80"
        )}
      >
        <div className="relative shrink-0 overflow-hidden rounded-xl w-28 h-28 sm:w-36 sm:h-36">
          <ListingImage
            src={photo}
            variant="card"
            alt={safeStr(listing.title)}
            ratio="aspect-square"
            fallback={Icon ? <Icon size={32} strokeWidth={1.5} /> : null}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-1.5 pr-1.5">
          <p className="text-[17px] font-bold leading-tight tabular-nums text-primary">
            {formatTZS(listing.price)}
          </p>
          <h3 className="mt-1 line-clamp-2 text-[14px] leading-snug text-primary">
            {safeStr(listing.title)}
          </h3>
          <p className="mt-auto flex items-center gap-1 truncate pt-2 text-xs text-secondary">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{location}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {featured && !sold && (
              <Badge variant="gold">
                {lang === "sw" ? "Imeangaziwa" : "Featured"}
              </Badge>
            )}
            {chip && (
              <Badge variant={chip.variant}>
                {chip[lang] || chip.sw}
              </Badge>
            )}
          </div>
        </div>
        {HeartBtn}
      </Link>
    );
  }

  return (
    <Link
      to={href}
      className={cx(
        "group relative flex h-full flex-col rounded-2xl bg-card p-1.5 hover-lift border focus-visible:outline-offset-4",
        featured
          ? "border-[color:rgb(var(--c-gold)/0.6)]"
          : "border-[color:rgb(var(--c-hairline))]",
        sold && "opacity-80"
      )}
    >
      <div className="relative overflow-hidden rounded-xl">
        <ListingImage
          src={photo}
          variant="card"
          alt={safeStr(listing.title)}
          ratio="aspect-square"
          fallback={Icon ? <Icon size={44} strokeWidth={1.5} /> : null}
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {featured && !sold && (
            <Badge variant="gold" className="shadow-sm">
              {lang === "sw" ? "Imeangaziwa" : "Featured"}
            </Badge>
          )}
          {chip && (
            <Badge variant={chip.variant} className="shadow-sm">
              {chip[lang] || chip.sw}
            </Badge>
          )}
        </div>
        {extra > 0 && (
          <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Camera size={11} /> {extra}
          </span>
        )}
        {HeartBtn}
      </div>
      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3">
        <p className="text-[17px] font-bold leading-tight tabular-nums text-primary sm:text-lg">
          {formatTZS(listing.price)}
        </p>
        <h3
          className="mt-1 min-h-[2.4rem] text-[14px] leading-snug text-primary"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {safeStr(listing.title)}
        </h3>
        <p className="mt-auto flex items-center gap-1 truncate pt-1.5 text-xs text-secondary">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{location}</span>
        </p>
      </div>
    </Link>
  );
}
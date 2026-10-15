import React from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import ListingImage from "../ListingImage.jsx";
import { isBoostActive } from "../../utils/listings.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

// Chukua picha zote kwa mpangilio — photos, images, au imageUrl moja
function getPhotos(listing) {
  if (!listing) return [];
  const arr =
    (Array.isArray(listing.photos) && listing.photos) ||
    (Array.isArray(listing.images) && listing.images) ||
    [];
  const urls = arr
    .map((img) => {
      if (!img) return null;
      if (typeof img === "string") return img;
      return (
        img.image_url ||
        img.url ||
        img.image ||
        img.src ||
        img.file ||
        null
      );
    })
    .filter(Boolean);
  if (urls.length) return urls;
  if (listing.imageUrl) return [listing.imageUrl];
  return [];
}

// Badges (badge = label + color token)
function Badge({ kind, lang }) {
  const defs = {
    new:     { label: { sw: "MPYA",        en: "NEW" },       bg: "#2F6D4F" },
    sale:    { label: { sw: "PUNGUZO",     en: "SALE" },      bg: "#C1502E" },
    hot:     { label: { sw: "MOTO",        en: "HOT" },       bg: "#FEA406", ink: "#011957" },
    boost:   { label: { sw: "IMEANGAZIWA", en: "FEATURED" },  bg: "#FEA406", ink: "#011957" },
  };
  const d = defs[kind];
  if (!d) return null;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide"
      style={{ background: d.bg, color: d.ink || "#FFFFFF" }}
    >
      {d.label[lang] || d.label.sw}
    </span>
  );
}

export default function ListingCardShop({
  listing,
  category,
  Icon,
  lang = "sw",
  isSaved = false,
  onToggleSave,
  className = "",
}) {
  if (!listing) return null;

  const photos = getPhotos(listing);
  const hasMany = photos.length > 1;
  const fallbackImg = category?.imageUrl || null;

  const status = String(listing.status || "").toLowerCase();
  const sold = status === "sold";
  const reserved = status === "reserved";
  const boosted = isBoostActive(listing);
  const verified = Boolean(listing.verified);

  const postedAt = listing.postedAt || listing.createdAt;
  const hoursOld = postedAt
    ? (Date.now() - new Date(postedAt).getTime()) / 3600000
    : Infinity;
  const isNew = hoursOld < 72;

  const catLabel =
    category?.label?.[lang] || category?.label?.sw || listing.category || "";

  const badges = [];
  if (isNew && !sold) badges.push("new");
  if (boosted) badges.push("boost");
  if (reserved) badges.push("hot");
  if (sold) badges.push("sale");

  const href = `/mali/${listing.id}`;

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSave?.(listing.id, listing);
  };

  return (
    <Link
      to={href}
      className={`group relative flex flex-col rounded-2xl bg-card border border-hairline overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(1,25,87,0.35)] ${className}`}
    >
      {/* Image — horizontal scroll ya picha zote */}
      <div className="relative overflow-hidden aspect-square">
        {photos.length === 0 ? (
          // Hakuna picha — fallback
          <ListingImage
            src={fallbackImg}
            variant="card"
            alt={listing.title}
            ratio="aspect-square"
            fallback={Icon ? <Icon size={44} strokeWidth={1.5} /> : null}
          />
        ) : hasMany ? (
          <div className="no-scrollbar flex h-full w-full snap-x snap-mandatory gap-1 overflow-x-auto scroll-smooth">
            {photos.map((url, idx) => (
              <div
                key={idx}
                className="relative h-full w-full shrink-0 snap-center overflow-hidden"
              >
                <ListingImage
                  src={url}
                  variant="card"
                  alt={`${listing.title} — ${idx + 1}`}
                  ratio="aspect-square"
                  fallback={
                    idx === 0 && Icon ? (
                      <Icon size={44} strokeWidth={1.5} />
                    ) : null
                  }
                />
                <span className="pointer-events-none absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
                  {idx + 1}/{photos.length}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <ListingImage
            src={photos[0]}
            variant="card"
            alt={listing.title}
            ratio="aspect-square"
            fallback={Icon ? <Icon size={44} strokeWidth={1.5} /> : null}
          />
        )}

        {/* Corner badges */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5 items-start">
          {badges.map((b, i) => (
            <Badge key={i} kind={b} lang={lang} />
          ))}
          {verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 text-[#011957] shadow-sm">
              <ShieldCheck size={10} />
              {lang === "sw" ? "IMETHIBITISHWA" : "VERIFIED"}
            </span>
          )}
        </div>

        {/* Heart */}
        {onToggleSave && (
          <button
            type="button"
            onClick={handleSave}
            aria-label={
              isSaved
                ? lang === "sw" ? "Ondoa" : "Remove"
                : lang === "sw" ? "Hifadhi" : "Save"
            }
            className={`absolute right-2.5 top-2.5 sm:right-3 sm:top-3 z-20 flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full border transition-colors backdrop-blur-sm ${
              isSaved
                ? "bg-rust border-rust text-white"
                : "bg-white/95 border-white/80 text-night hover:bg-white dark:bg-black/55 dark:border-white/25 dark:text-white dark:hover:bg-black/75"
            }`}
          >
            <Heart size={15} fill={isSaved ? "currentColor" : "none"} />
          </button>
        )}

        {/* Hover CTA overlay */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <span
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#011957] translate-y-3 group-hover:translate-y-0 transition-transform duration-300"
            style={{
              background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)",
            }}
          >
            {lang === "sw" ? "Angalia" : "View"} <ArrowRight size={12} />
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted truncate">
          {catLabel}
        </p>
        <h3 className="mt-1 text-sm font-semibold leading-snug text-primary line-clamp-2 min-h-[2.4rem]">
          {listing.title}
        </h3>

        <div className="mt-2 flex items-center gap-3 text-[11px] text-secondary flex-wrap">
          <span className="flex items-center gap-1">
            <Eye size={11} /> {(listing.views || 0).toLocaleString()}
          </span>
          {listing.region && (
            <span className="flex items-center gap-1 min-w-0">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate max-w-[130px]">{listing.region}</span>
            </span>
          )}
        </div>

        <p className="mt-3 text-base sm:text-lg font-bold text-night dark:text-[#FEA406] break-words">
          {formatTZS(listing.price)}
        </p>
      </div>
    </Link>
  );
}
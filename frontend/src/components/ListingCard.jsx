import React from "react";
import { Link } from "react-router-dom";
import ListingImage from "./ListingImage.jsx";

export function formatTZS(amount) {
  return "TZS " + Math.round(amount || 0).toLocaleString("en-US");
}

const STATUS_CHIP = {
  reserved: { sw: "Imehifadhiwa", en: "Reserved", cls: "bg-gold text-night" },
  pending_payment: { sw: "Inasubiri malipo", en: "Pending payment", cls: "bg-gold text-night" },
  sold: { sw: "Imeuzwa", en: "Sold", cls: "bg-night text-white" },
};

/**
 * ListingCard — kadi ya tangazo kwa mtindo wa marketplace:
 * picha kubwa ya mraba → bei (nzito) → jina (mistari 2) → eneo.
 * Tumia kwenye Home, All Listings, Category, Saved… ili muonekano uwe mmoja.
 */
export default function ListingCard({ listing, category, Icon, lang = "sw", to }) {
  const photos = Array.isArray(listing.photos) ? listing.photos : [];
  const photo = listing.imageUrl || photos[0] || category?.imageUrl || null;
  const extra = photos.length > 1 ? photos.length : 0;
  const chip = STATUS_CHIP[listing.status];

  return (
    <Link
      to={to || `/mali/${listing.id}`}
      className="group block h-full rounded-2xl focus-visible:outline-offset-4"
    >
      <div className="relative overflow-hidden rounded-xl ring-1 ring-sandline sm:rounded-2xl">
        <ListingImage
          src={photo}
          alt={listing.title}
          ratio="aspect-square"
          fallback={Icon ? <Icon size={44} strokeWidth={1.6} /> : null}
        />

        {chip && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm ${chip.cls}`}
          >
            {chip[lang] || chip.sw}
          </span>
        )}

        {extra > 0 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {extra}
          </span>
        )}
      </div>

      <div className="px-0.5 pt-2.5">
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
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-secondary">
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

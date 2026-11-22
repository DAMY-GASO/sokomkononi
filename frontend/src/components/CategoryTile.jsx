import React from "react";
import { Link } from "react-router-dom";

/**
 * CategoryTile — image fills the WHOLE tile, label overlaid at the bottom.
 *
 * Behaviour:
 *   • If `imageUrl` exists → it becomes the full-tile background, with a
 *     navy gradient scrim so the label is always readable.
 *   • If no image → a navy gradient background with a centered gold icon
 *     (fallback), so the tile never looks empty.
 *
 * Responsive:
 *   • Works in 2-column phone grids, 3/4/5-column desktop grids.
 *   • Fixed aspect ratio so every tile has identical height.
 *   • Text clamps to 2 lines — never overlaps or wraps awkwardly.
 */
export default function CategoryTile({ to, label, count, countLabel, imageUrl, Icon }) {
  const hasImage = Boolean(imageUrl);

  return (
    <Link
      to={to}
      className="group relative flex w-full min-w-0 flex-col overflow-hidden rounded-2xl
                 border-[1.5px] border-[color:rgb(var(--c-gold)/0.55)] bg-card
                 aspect-[4/3] sm:aspect-[5/4]
                 transition-all duration-200
                 hover:-translate-y-0.5 hover:border-[color:rgb(var(--c-gold))]
                 hover:shadow-[0_12px_28px_-14px_rgba(254,164,6,0.6)]
                 focus-visible:outline-offset-4 active:scale-[0.98]"
    >
      {/* ═══════════════════════════════════════════════════════
          BACKGROUND LAYER
          ═══════════════════════════════════════════════════════ */}
      {hasImage ? (
        <>
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center
                       transition-transform duration-700 group-hover:scale-105"
          />
          {/* Navy gradient scrim — always readable over any image */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(1,15,58,0.10) 0%, rgba(1,15,58,0.40) 45%, rgba(1,15,58,0.90) 100%)",
            }}
          />
        </>
      ) : (
        <>
          {/* Fallback: navy gradient background */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #011957 0%, #042475 100%)",
            }}
          />
          {/* Centered gold icon */}
          <div className="absolute inset-0 grid place-items-center pb-14">
            {Icon && (
              <Icon
                size={44}
                strokeWidth={1.4}
                className="text-[#FEA406] opacity-85
                           transition-transform duration-300 group-hover:scale-110
                           sm:size-[52px]"
              />
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          FOREGROUND CONTENT — label + count at the bottom
          ═══════════════════════════════════════════════════════ */}
      <div className="relative z-10 mt-auto flex w-full flex-col items-center gap-1 px-3 pb-3.5 pt-6 text-center">
        <span className="line-clamp-2 w-full text-[13px] font-bold leading-tight text-white
                         drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]
                         sm:text-[15px]">
          {label}
        </span>
        {count != null && (
          <span className="text-[11px] font-medium text-white/75
                           drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-xs">
            {count} {countLabel}
          </span>
        )}
      </div>
    </Link>
  );
}

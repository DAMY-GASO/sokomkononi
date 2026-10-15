import React from "react";
import { Link } from "react-router-dom";

/**
 * CategoryTile — category card with a clearly visible icon.
 *
 * Sizing strategy:
 *  • Icon container is a fixed 48px square (56px on ≥640px).
 *  • Icon inside it is 24px (28px on ≥640px).
 *  • Container is `flex-shrink-0` so it never collapses.
 *  • Works in both light and dark: dark navy container + gold icon
 *    with a gold ring border that stays visible on any background.
 */
export default function CategoryTile({ to, label, count, countLabel, imageUrl, Icon }) {
  return (
    <Link
      to={to}
      className="group flex h-full w-full min-w-0 flex-col items-center justify-center gap-3 rounded-2xl
                 border-[1.5px] border-[color:rgb(var(--c-gold)/0.6)] bg-card px-3 py-5 text-center
                 transition-all duration-200
                 hover:-translate-y-0.5 hover:border-[color:rgb(var(--c-gold))] hover:shadow-md
                 focus-visible:outline-offset-4 active:scale-[0.98] sm:py-6"
    >
      {/* Icon container — fixed size, never squashes.
          Uses relative + overflow-hidden so the image (when present) can
          fill it with `absolute inset-0`. */}
      <span className="category-tile-icon relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          Icon && (
            <Icon
              strokeWidth={1.75}
              className="transition-transform duration-300 group-hover:scale-110"
            />
          )
        )}
      </span>

      {/* Text block — clipped to 2 lines max, ellipsis on overflow */}
      <span className="block w-full min-w-0">
        <span className="block text-[14px] font-semibold leading-tight text-primary line-clamp-2 sm:text-[15px]">
          {label}
        </span>
        {count != null && (
          <span className="mt-1 block text-[11px] text-secondary sm:text-xs">
            {count} {countLabel}
          </span>
        )}
      </span>
    </Link>
  );
}

import React from "react";
import { Link } from "react-router-dom";

/**
 * CategoryTile — kadi ya kategoria yenye border ya gold.
 * Kitufe cha picha/ikoni kina ukubwa ule ule (48px → 56px) iwe ni ikoni
 * ya gold juu ya navy, au picha uliyoweka — kwa hiyo grid haivurugiki.
 * Mpangilio ni ule ule wa ukurasa wa "Weka Mali".
 */
export default function CategoryTile({ to, label, count, countLabel, imageUrl, Icon }) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-gold/70 bg-white px-3 py-5 text-center shadow-[0_1px_2px_rgba(1,25,87,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_12px_24px_-14px_rgba(254,164,6,0.7)] active:scale-[0.98] sm:py-6"
    >
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-night text-gold ring-1 ring-gold/30 sm:h-14 sm:w-14 sm:rounded-2xl">
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
              size={24}
              strokeWidth={1.75}
              className="transition-transform duration-300 group-hover:scale-110"
            />
          )
        )}
      </span>

      <span className="block min-w-0">
        <span className="block text-[15px] font-semibold leading-tight text-night sm:text-base">
          {label}
        </span>
        {count != null && (
          <span className="mt-1 block text-xs text-secondary">
            {count} {countLabel}
          </span>
        )}
      </span>
    </Link>
  );
}

import React from "react";

/**
 * IconTile — a fixed-size, never-squashing container for a single icon.
 *
 * Why: in flex/grid layouts, a `<div class="w-10 h-10">` with an SVG
 * inside is often squashed to 0px because flex-shrink defaults to 1.
 * This component sets `flex-shrink-0` and uses aspect-ratio so the
 * icon always has room to render — on every breakpoint, in every theme.
 *
 * @param {object}   props
 * @param {Function} props.icon    — lucide-react icon component
 * @param {"sm"|"md"|"lg"} [props.size="md"]
 * @param {"default"|"gold"|"night"|"green"|"rust"|"royal"} [props.tone="default"]
 */
export default function IconTile({ icon: Icon, size = "md", tone = "default", className = "" }) {
  const sizeMap = {
    sm: { box: "h-9 w-9 sm:h-10 sm:w-10", icon: 14 },
    md: { box: "h-11 w-11 sm:h-12 sm:w-12", icon: 18 },
    lg: { box: "h-14 w-14 sm:h-16 sm:w-16", icon: 22 },
  };
  const toneMap = {
    default: "bg-[color:rgb(var(--c-page))] text-primary border-[color:rgb(var(--c-hairline))]",
    gold:    "bg-[#FEA406]/14 text-[#A35F00] dark:text-[#FEA406] border-[#FEA406]/30",
    night:   "bg-[#011957] text-[#FEA406] border-[#FEA406]/35",
    green:   "bg-[#2F6D4F]/12 text-[#2F6D4F] border-[#2F6D4F]/25",
    rust:    "bg-[#C1502E]/12 text-[#C1502E] border-[#C1502E]/25",
    royal:   "bg-[#0062FD]/12 text-[#0062FD] border-[#0062FD]/25",
  };
  const s = sizeMap[size] || sizeMap.md;
  const t = toneMap[tone] || toneMap.default;
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-xl border ${s.box} ${t} ${className}`}
      style={{ aspectRatio: "1 / 1" }}
    >
      {Icon && <Icon size={s.icon} strokeWidth={1.75} />}
    </span>
  );
}

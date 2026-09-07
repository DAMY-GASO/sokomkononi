import React from "react";
import { Link } from "react-router-dom";

// Vitufe vya "Download Android/iOS App" — vinaelekeza kwenye Coming Soon/Waitlist
// kwa sasa (tazama muongozo 7). Zinaweza kutumika sehemu tofauti (touchpoints).
export default function AppDownloadBadges({ variant = "dark" }) {
  const isDark = variant === "dark";
  const border = isDark ? "border-white/25" : "border-ink-muted/30";
  const text = isDark ? "text-sand" : "text-ink-secondary";
  const iconText = isDark ? "text-sand/70" : "text-ink-muted";

  return (
    <div className="flex gap-2.5">
      <Link
        to="/app"
        className={`flex items-center gap-2 border ${border} rounded-md px-3.5 py-2 hover:opacity-80 transition-opacity`}
      >
        <span className={`${iconText} text-lg leading-none`}>▸</span>
        <span className={`text-xs ${text}`}>
          <span className="block leading-none text-[10px]">Pakua kwenye</span>
          <span className="block font-semibold leading-tight">Google Play</span>
        </span>
      </Link>
      <Link
        to="/app"
        className={`flex items-center gap-2 border ${border} rounded-md px-3.5 py-2 hover:opacity-80 transition-opacity`}
      >
        <span className={`${iconText} text-lg leading-none`}></span>
        <span className={`text-xs ${text}`}>
          <span className="block leading-none text-[10px]">Pakua kwenye</span>
          <span className="block font-semibold leading-tight">App Store</span>
        </span>
      </Link>
    </div>
  );
}

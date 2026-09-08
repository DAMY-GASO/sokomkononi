import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function AppDownloadBadges({ variant = "dark" }) {
  const { t } = useLanguage();
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
          <span className="block leading-none text-[10px]">{t("badge_get_it_on")}</span>
          <span className="block font-semibold leading-tight">{t("badge_google_play")}</span>
        </span>
      </Link>
      <Link
        to="/app"
        className={`flex items-center gap-2 border ${border} rounded-md px-3.5 py-2 hover:opacity-80 transition-opacity`}
      >
        <span className={`${iconText} text-lg leading-none`}></span>
        <span className={`text-xs ${text}`}>
          <span className="block leading-none text-[10px]">{t("badge_download_on")}</span>
          <span className="block font-semibold leading-tight">{t("badge_app_store")}</span>
        </span>
      </Link>
    </div>
  );
}

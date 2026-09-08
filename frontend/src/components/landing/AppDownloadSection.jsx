import React from "react";
import AppDownloadBadges from "./AppDownloadBadges.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function AppDownloadSection() {
  const { t } = useLanguage();

  return (
    <section className="bg-sand py-14 md:py-16 border-t border-ink-muted/15">
      <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-gold text-sm font-semibold">{t("appsec_eyebrow")}</p>
          <h2 className="text-xl md:text-2xl font-bold text-ink-primary mt-1">
            {t("appsec_heading")}
          </h2>
          <p className="text-ink-secondary text-sm md:text-base mt-2 max-w-md">
            {t("appsec_body")}
          </p>
        </div>
        <AppDownloadBadges variant="light" />
      </div>
    </section>
  );
}

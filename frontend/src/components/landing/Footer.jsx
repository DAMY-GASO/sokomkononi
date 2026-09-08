import React from "react";
import { Link } from "react-router-dom";
import AppDownloadBadges from "./AppDownloadBadges.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Footer() {
  const { t } = useLanguage();

  const columns = [
    {
      heading: t("footer_company_heading"),
      links: [
        { to: "/kuhusu", label: t("footer_about") },
        { to: "/mawasiliano", label: t("footer_contact") },
        { to: "/kazi-kwetu", label: t("footer_careers") },
      ],
    },
    {
      heading: t("footer_categories_heading"),
      links: [
        { to: "/kategoria/nyumba", label: t("cat_nyumba") },
        { to: "/kategoria/magari", label: t("cat_magari") },
        { to: "/kategoria/viwanja", label: t("cat_viwanja") },
        { to: "/kategoria/biashara", label: t("cat_biashara") },
      ],
    },
    {
      heading: t("footer_support_heading"),
      links: [
        { to: "/faq", label: t("footer_faq") },
        { to: "/usalama", label: t("footer_safety") },
        { to: "/vigezo-vya-matumizi", label: t("footer_terms") },
        { to: "/faragha", label: t("footer_privacy") },
      ],
    },
  ];

  return (
    <footer className="bg-night-2 text-sand border-t border-white/10">
      <div className="max-w-6xl mx-auto px-5 py-14 md:py-16">
        <div className="grid md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-10">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-gold flex items-center justify-center text-night font-bold text-sm">
                S
              </span>
              <span className="font-bold text-lg tracking-tight">Soko</span>
            </Link>
            <p className="text-sand/60 text-sm mt-3 max-w-xs leading-relaxed">
              {t("footer_tagline")}
            </p>
            <div className="mt-5">
              <AppDownloadBadges variant="dark" />
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-sand/50 text-xs font-semibold mb-4">{col.heading}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sand/75 hover:text-sand text-sm transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
          <p className="text-sand/40 text-xs">
            © {new Date().getFullYear()} Soko. {t("footer_rights")}
          </p>

          <div className="flex items-center gap-2 text-sand/40 text-xs">
            <span>{t("footer_payments_label")}</span>
            <span className="text-sand/60 font-medium">M-Pesa</span>
            <span>·</span>
            <span className="text-sand/60 font-medium">Tigo Pesa</span>
            <span>·</span>
            <span className="text-sand/60 font-medium">Airtel Money</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

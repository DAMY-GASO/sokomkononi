import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function CategoryStalls() {
  const { t } = useLanguage();
  const stalls = [
    { name: t("cat_nyumba"), count: "3,200+", img: "https://picsum.photos/seed/soko-stall-nyumba/600/500", span: "md:col-span-3" },
    { name: t("cat_viwanja"), count: "2,100+", img: "https://picsum.photos/seed/soko-stall-viwanja/600/500", span: "md:col-span-2" },
    { name: t("cat_magari"), count: "2,800+", img: "https://picsum.photos/seed/soko-stall-magari/600/500", span: "md:col-span-2" },
    { name: t("cat_biashara"), count: "900+", img: "https://picsum.photos/seed/soko-stall-biashara/600/500", span: "md:col-span-3" },
    { name: t("cat_mashine"), count: "600+", img: "https://picsum.photos/seed/soko-stall-mashine/600/500", span: "md:col-span-5" },
  ];

  return (
    <section className="bg-night py-14 md:py-16">
      <div className="max-w-6xl mx-auto px-5">
        <h2 className="text-xl md:text-2xl font-bold text-sand mb-7">
          {t("categories_heading")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stalls.map((s) => (
            <Link
              key={s.name}
              to="/dashboard"
              className={`relative group overflow-hidden rounded-lg h-48 md:h-56 ${s.span}`}
            >
              <img
                src={s.img}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <p className="text-sand font-semibold text-sm">{s.name}</p>
                <p className="text-gold text-sm font-bold tabular-nums mt-0.5">
                  {s.count} {t("cat_count_suffix")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

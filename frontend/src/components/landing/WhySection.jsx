import React from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function WhySection() {
  const { t } = useLanguage();
  const points = [
    { color: "bg-gold", title: t("why_point1_title"), body: t("why_point1_body") },
    { color: "bg-market", title: t("why_point2_title"), body: t("why_point2_body") },
    { color: "bg-rust", title: t("why_point3_title"), body: t("why_point3_body") },
  ];

  return (
    <section className="max-w-6xl mx-auto px-5 py-14 md:py-16">
      <div className="grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-10 md:gap-16">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-ink-primary leading-snug">
            {t("why_heading")}
          </h2>
          <p className="text-ink-secondary text-sm md:text-base mt-3 leading-relaxed">
            {t("why_subtext")}
          </p>
        </div>

        <div className="space-y-6">
          {points.map((p) => (
            <div key={p.title} className="flex gap-4">
              <span className={`mt-1.5 w-2.5 h-2.5 rounded-sm shrink-0 ${p.color}`} />
              <div>
                <h3 className="font-semibold text-ink-primary text-base">{p.title}</h3>
                <p className="text-ink-secondary text-sm mt-1 leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

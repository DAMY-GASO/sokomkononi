import React from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function Testimonials() {
  const { t } = useLanguage();
  const notes = [
    { quote: t("testimonial1_quote"), name: t("testimonial1_name"), offset: "md:mt-0" },
    { quote: t("testimonial2_quote"), name: t("testimonial2_name"), offset: "md:mt-8" },
    { quote: t("testimonial3_quote"), name: t("testimonial3_name"), offset: "md:mt-4" },
  ];

  return (
    <section className="max-w-6xl mx-auto px-5 py-14 md:py-16">
      <h2 className="text-xl md:text-2xl font-bold text-ink-primary mb-9">
        {t("testimonials_heading")}
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {notes.map((n) => (
          <div key={n.name} className={n.offset}>
            <p className="text-base text-ink-primary leading-relaxed">"{n.quote}"</p>
            <p className="text-ink-muted text-sm mt-3">{n.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

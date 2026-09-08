import React, { useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function FAQAccordion() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(0);

  const faqs = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
  ];

  return (
    <section className="max-w-3xl mx-auto px-5 py-14 md:py-16">
      <h2 className="text-xl md:text-2xl font-bold text-ink-primary mb-7">
        {t("faq_heading")}
      </h2>

      <div className="divide-y divide-ink-muted/20 border-t border-b border-ink-muted/20">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <span className="font-semibold text-ink-primary text-sm md:text-base pr-4">{f.q}</span>
                <span className="text-ink-muted text-xl shrink-0">{isOpen ? "–" : "+"}</span>
              </button>
              {isOpen && (
                <p className="text-ink-secondary text-sm md:text-base pb-4 leading-relaxed">{f.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

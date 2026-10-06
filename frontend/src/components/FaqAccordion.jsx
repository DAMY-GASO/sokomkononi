import React, { useState } from "react";

/**
 * FaqAccordion — defensive against shape variations:
 *   { q: {sw,en}, a: {sw,en} }     ← HomePage shape
 *   { question: {sw,en}, answer: … } ← alternate shape
 *   { q: "…", a: "…" }               ← plain strings
 */
function pick(v, lang) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return v[lang] ?? v.sw ?? v.en ?? "";
}
function pickQuestion(faq, lang) {
  return pick(faq?.q ?? faq?.question, lang);
}
function pickAnswer(faq, lang) {
  return pick(faq?.a ?? faq?.answer, lang);
}

export default function FaqAccordion({ items, lang = "sw" }) {
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i));

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((faq, index) => {
        const isOpen = openIndex === index;
        const question = pickQuestion(faq, lang);
        const answer = pickAnswer(faq, lang);
        return (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-[#F5F3EC]/60 transition-colors"
            >
              <h3 className="h-card flex-1">{question}</h3>
              <svg
                className={`w-5 h-5 flex-shrink-0 text-[#E8A33D] transition-transform duration-200 mt-0.5 ${
                  isOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
              style={{ display: "grid" }}
            >
              <div className="overflow-hidden">
                <div className="text-secondary text-body-sm px-4 pb-4 whitespace-pre-line leading-relaxed">
                  {answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import React, { useState } from "react";

// Accordion inayotumika HomePage na ContactPage.
export default function FaqAccordion({ items, lang }) {
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <div className="space-y-3">
      {items.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-[#F5F3EC]/60 transition-colors"
            >
              <h3 className="h-card flex-1">{lang === "sw" ? faq.q.sw : faq.q.en}</h3>
              <svg
                className={`w-5 h-5 flex-shrink-0 text-[#E8A33D] transition-transform duration-200 mt-0.5 ${
                  isOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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
                  {lang === "sw" ? faq.a.sw : faq.a.en}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

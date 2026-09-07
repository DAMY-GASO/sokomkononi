import React, { useState } from "react";

const faqs = [
  { q: "Ninalipaje reservation deposit?", a: "Baada ya kukubaliana bei kwenye Deal Room, unachagua muda (24, 48, 72 masaa, au custom) na kulipa kupitia M-Pesa, Tigo Pesa, Airtel Money au benki." },
  { q: "Nini kikitokea nikienda kukagua mali na sio kama ilivyoelezwa?", a: "Unachagua 'Not As Described' kwenye mfumo, na Deal Room inafunguka tena kwa negotiation na muuzaji." },
  { q: "Je, malipo ya mwisho yanapita kwenye SokoMkononi?", a: "Hapana. Malipo ya mwisho yanafanyika moja kwa moja kati yako na muuzaji baada ya ukaguzi. SokoMkononi inasimamia tu reservation na Deal Room." },
  { q: "Nikichelewa kulipa reservation, nini kinatokea?", a: "Reservation ikiisha muda, mali inarudi wazi tena, na watu waliojiunga Waiting List wanapata taarifa mara moja." },
];

export default function FAQAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <section className="max-w-3xl mx-auto px-5 py-14 md:py-16">
      <h2 className="text-xl md:text-2xl font-bold text-ink-primary mb-7">
        Maswali ya kawaida
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

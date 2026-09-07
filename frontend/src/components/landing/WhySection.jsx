import React from "react";

const points = [
  {
    color: "bg-gold",
    title: "Deal Room ya kila mnunuzi na muuzaji",
    body: "Makubaliano ya bei yanaonekana wazi kwa pande zote mbili — hakuna mabishano ya bei baadaye.",
  },
  {
    color: "bg-market",
    title: "Reservation ya uhakika",
    body: "Ukishalipa reservation deposit, mali haiwezi kuuzwa kwa mtu mwingine mpaka muda wako uishe.",
  },
  {
    color: "bg-rust",
    title: "Ukaguzi kabla ya malipo ya mwisho",
    body: "Nenda kaone mali kwanza. Malipo ya mwisho yanafanyika baada tu ya wewe kuridhika.",
  },
];

export default function WhySection() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14 md:py-16">
      <div className="grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-10 md:gap-16">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-ink-primary leading-snug">
            Soko lenye uaminifu, si tu tovuti ya matangazo.
          </h2>
          <p className="text-ink-secondary text-sm md:text-base mt-3 leading-relaxed">
            SokoMkononi imejengwa kuzunguka usalama wa deal — kutoka
            makubaliano ya bei mpaka malipo ya mwisho.
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

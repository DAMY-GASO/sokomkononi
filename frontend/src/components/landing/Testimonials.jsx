import React from "react";

const notes = [
  { quote: "Niliuza kiwanja changu Bagamoyo ndani ya wiki moja. Deal Room ilinisaidia tusigombane na mnunuzi kuhusu bei.", name: "Amina, Muuzaji — Pwani", offset: "md:mt-0" },
  { quote: "Nililipa reservation, nikaenda kukagua nyumba mwenyewe kabla ya kulipa balance. Nilijisikia salama kabisa.", name: "Juma, Mnunuzi — Dar es Salaam", offset: "md:mt-8" },
  { quote: "Gari langu liliwekewa boost na ndani ya siku tatu nilipata mnunuzi wa kweli.", name: "Neema, Muuzaji — Arusha", offset: "md:mt-4" },
];

export default function Testimonials() {
  return (
    <section className="max-w-6xl mx-auto px-5 py-14 md:py-16">
      <h2 className="text-xl md:text-2xl font-bold text-ink-primary mb-9">
        Watu wanasemaje
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {notes.map((n) => (
          <div key={n.name} className={n.offset}>
            <p className="text-base text-ink-primary leading-relaxed">
              "{n.quote}"
            </p>
            <p className="text-ink-muted text-sm mt-3">{n.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

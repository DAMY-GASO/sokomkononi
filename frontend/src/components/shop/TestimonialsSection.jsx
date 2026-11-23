import React from "react";
import { Star, ShieldCheck, MessageSquare, Lock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Section, SectionHeader, Card } from "../ui";
import { COLORS } from "../../pages/dashboard/components/shared.js";

const FALLBACK = [
  { name: "Mary M.",   region: "Dar es Salaam", quote: { sw: "Nilinunua laptop iliyotumika kwa bei nzuri. Tulikutana na muuzaji, nikaikagua kabla ya kulipa. Nimeridhika.", en: "I bought a used laptop at a fair price. I met the seller and checked it before paying. Very happy." } },
  { name: "Juma K.",   region: "Arusha",        quote: { sw: "Niliuza simu yangu ya zamani ndani ya siku mbili tu. Wanunuzi walinitafuta wenyewe kupitia Deal Room.",      en: "I sold my old phone in just two days. Buyers contacted me directly through the Deal Room." } },
  { name: "Fatima A.", region: "Mwanza",        quote: { sw: "Nimepata vitabu vya chuo kwa nusu ya bei ya dukani. Jukwaa ni rahisi kutumia, hata kwa simu.",              en: "I found my college books for half the shop price. The platform is easy to use, even on a phone." } },
];

export default function TestimonialsSection({ testimonials }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const list = Array.isArray(testimonials) && testimonials.length ? testimonials.slice(0, 3) : FALLBACK;
  return (
    <Section>
      <SectionHeader
        align="center"
        eyebrow={t("Ushuhuda", "Testimonials")}
        title={t("Wanachosema Wateja Wetu", "What Our Customers Say")}
        subtitle={t("Wateja halisi, uzoefu halisi.", "Real customers, real experiences.")}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 stagger">
        {list.map((item, i) => {
          const quote = typeof item.quote === "string" ? item.quote : (item.quote?.[lang] || item.quote?.sw || "");
          const name = item.name || "—";
          const region = item.region || item.location || "";
          return (
            <Card key={i} className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-0.5">{[1,2,3,4,5].map((n) => (<Star key={n} size={14} fill={COLORS.gold} color={COLORS.gold} />))}</div>
              <p className="text-sm text-secondary leading-relaxed flex-1">"{quote}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-[color:rgb(var(--c-hairline))]">
                <div className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #011957 0%, #0062FD 100%)" }}>{String(name).charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary truncate">{name}</p>
                  {region && <p className="text-xs text-muted truncate">{region}</p>}
                </div>
                <span className="text-xs font-bold uppercase tracking-wide text-green flex items-center gap-1 shrink-0"><ShieldCheck size={10} /> {t("Mteja", "Customer")}</span>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-10 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><MessageSquare size={14} /> {t("Deal Room Salama", "Secure Deal Room")}</span>
        <span className="inline-flex items-center gap-1.5"><Lock size={14} /> {t("SSL Imelindwa", "SSL Secured")}</span>
      </div>
    </Section>
  );
}

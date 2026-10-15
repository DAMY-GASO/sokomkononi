import React from "react";
import { Star, ShieldCheck, Award, Lock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { Section, SectionHeader, Card } from "../ui";

const FALLBACK = [
  { name: "Mary M.",  region: "Dar es Salaam", quote: { sw: "Nilinunua nyumba yangu kwa urahisi kupitia SokoMkononi. Mchakato wote ulikuwa rahisi na salama.", en: "I bought my house easily through SokoMkononi. The whole process was simple and secure." } },
  { name: "Juma K.",  region: "Arusha",         quote: { sw: "Nimeuza magari matatu kwa mwezi mmoja! Jukwaa hili limebadilisha biashara yangu.",       en: "I've sold three cars in just one month! This platform transformed my business." } },
  { name: "Fatima A.", region: "Mwanza",        quote: { sw: "Nilipata kiwanja bora kwa bei nzuri. Nashukuru SokoMkononi kwa uwazi wao.",             en: "I found a great plot at a good price. Thank you SokoMkononi for your transparency." } },
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
              <div className="flex items-center gap-0.5">{[1,2,3,4,5].map((n) => (<Star key={n} size={14} fill="#FEA406" color="#FEA406" />))}</div>
              <p className="text-sm text-secondary leading-relaxed flex-1">"{quote}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-[color:rgb(var(--c-hairline))]">
                <div className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #011957 0%, #0062FD 100%)" }}>{String(name).charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary truncate">{name}</p>
                  {region && <p className="text-[11px] text-muted truncate">{region}</p>}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#2F6D4F] flex items-center gap-1 shrink-0"><ShieldCheck size={10} /> {t("Amethibitishwa", "Verified")}</span>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-10 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5"><Award size={13} /> {t("Wauzaji Bora", "Top Rated Sellers")}</span>
        <span className="inline-flex items-center gap-1.5"><Lock size={13} /> {t("SSL Imelindwa", "SSL Secured")}</span>
        <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} /> {t("Uthibitishwa wa Mali", "Verified Listings")}</span>
      </div>
    </Section>
  );
}

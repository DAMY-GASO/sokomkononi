import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, ChevronRight, ShoppingBag, Tag } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../config/authStore.js";
import NewsletterStrip from "../components/NewsletterStrip.jsx";

/* ── Numbered step flow ──────────────────────────────────── */
function StepFlow({ steps, startAt = 1 }) {
  return (
    <ol className="mx-auto flex max-w-md flex-col text-left">
      {steps.map((step, i) => (
        <li key={i} className="relative flex items-start gap-3 pb-3 last:pb-0">
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute left-[15px] top-8 bottom-0 w-px bg-[color:rgb(var(--c-hairline))]"
            />
          )}
          <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#011957] text-xs font-bold text-white">
            {startAt + i}
          </span>
          <div className="flex min-h-[2rem] flex-1 items-center rounded-xl bg-[color:rgb(var(--c-page))] px-4 py-1.5 text-sm font-medium text-primary">
            {step}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function JinsiYaKununuaNaKuuza() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        const id = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
        return () => clearTimeout(id);
      }
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location]);

  const handleBuyNow = () => user ? navigate("/dashboard/buyer") : navigate("/register?intent=buy");
  const handleSellNow = () => user ? navigate("/dashboard/post") : navigate("/register?intent=sell");

  const buyBefore = [
    t('Bonyeza "Nunua Sasa"', 'Tap "Buy Now"'),
    t("Chagua Aina ya Mali", "Choose Property Type"),
    t("Tafuta na Chagua Mali Unayoitaka", "Search and Select the Property"),
    t("Wasiliana na Muuzaji kupitia Deal Room", "Contact the Seller via Deal Room"),
    t("Fanya Makubaliano ya Bei", "Negotiate the Price"),
    t("Muuzaji Akikubali", "Once the Seller Accepts"),
    t("Lipia Reservation", "Pay the Reservation Fee"),
  ];
  const buyAfter = [
    t("Kamilisha Malipo", "Complete Payment"),
    t("Kamilisha Mchakato wa Ununuzi", "Complete the Purchase Process"),
  ];
  const sellSteps = [
    t('Bonyeza "Uza Sasa"', 'Tap "Sell Now"'),
    t("Chagua Aina ya Mali", "Choose Property Type"),
    t("Weka Picha za Mali (1–8)", "Upload Property Photos (1–8)"),
    t("Jaza Taarifa Zote za Mali", "Fill In All Property Details"),
    t("Wasilisha Taarifa", "Submit Your Details"),
    t("Lipia Huduma ya Kuchapisha", "Pay the Publishing Fee"),
    t("Chagua Njia ya Malipo", "Choose a Payment Method"),
    t("Kamilisha Malipo", "Complete Payment"),
  ];

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════
          HERO — navy with grid pattern + gold glow
          ═══════════════════════════════════════════════════════ */}
      <section className="surface-night relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(135deg, #010F3A 0%, #011957 55%, #042475 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/4 -z-10 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #FEA406 0%, transparent 70%)" }}
        />

        <div className="container relative py-12 sm:py-16 text-center">
          <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight tracking-tight text-white">
            {t("Jinsi Inavyofanya Kazi", "How It Works")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            {t(
              "Fuata hatua hizi rahisi kununua au kuuza mali kwenye SokoMkononi.",
              "Follow these simple steps to buy or sell a property on SokoMkononi."
            )}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#kununua"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#011957]"
              style={{ background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)" }}
            >
              <ShoppingBag size={15} />
              {t("Jinsi ya Kununua", "How to Buy")}
            </a>
            <a
              href="#kuuza"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/[0.15]"
            >
              <Tag size={15} />
              {t("Jinsi ya Kuuza", "How to Sell")}
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BUY
          ═══════════════════════════════════════════════════════ */}
      <section id="kununua" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#A35F00] dark:text-[#FEA406]">
            {t("Kwa Mnunuzi", "For Buyers")}
          </span>
          <h2 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold text-primary">
            {t("Jinsi ya Kununua", "How to Buy")}
          </h2>
          <p className="mx-auto mt-3 mb-10 max-w-xl text-sm leading-relaxed text-secondary">
            {t(
              "Kutoka kutafuta mali hadi kukamilisha ununuzi — hivi ndivyo mchakato unavyokwenda.",
              "From finding a property to completing the purchase — here's how the process works."
            )}
          </p>

          <StepFlow steps={buyBefore} />

          <div className="mx-auto my-6 flex max-w-2xl items-start gap-2 rounded-xl border border-[color:rgb(var(--c-royal)/0.25)] bg-[color:rgb(var(--c-royal)/0.08)] px-4 py-3 text-left text-sm leading-relaxed text-primary">
            <Lock size={16} className="mt-0.5 shrink-0 text-[color:rgb(var(--c-royal))]" />
            <span>
              {t(
                "Reservation huweka mali kwenye hali ya kuhifadhiwa kwa muda maalum, huku ukikamilisha hatua muhimu kama ukaguzi wa mali, uthibitishaji wa nyaraka na maandalizi ya malipo.",
                "A Reservation holds the property for a set period while you complete key steps such as inspecting the property, verifying documents, and preparing payment."
              )}
            </span>
          </div>

          <StepFlow steps={buyAfter} startAt={buyBefore.length + 1} />

          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-[#2F6D4F]/25 bg-[#2F6D4F]/10 px-4 py-3 text-sm font-medium text-[#2F6D4F]">
            {t(
              "Hongera! Umefanikiwa kukamilisha ununuzi wa mali kupitia SokoMkononi.",
              "Congratulations! You've successfully completed a property purchase through SokoMkononi."
            )}
          </div>

          <button
            onClick={handleBuyNow}
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-[#011957] transition-transform hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)" }}
          >
            {t("Nunua Sasa", "Buy Now")}
            <ChevronRight size={15} />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SELL
          ═══════════════════════════════════════════════════════ */}
      <section id="kuuza" className="scroll-mt-20 bg-[color:rgb(var(--c-page))] py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#2F6D4F]">
            {t("Kwa Muuzaji", "For Sellers")}
          </span>
          <h2 className="mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold text-primary">
            {t("Jinsi ya Kuuza", "How to Sell")}
          </h2>
          <p className="mx-auto mt-3 mb-10 max-w-xl text-sm leading-relaxed text-secondary">
            {t(
              "Kutoka kuweka tangazo hadi mali yako kuonekana na wanunuzi — hivi ndivyo mchakato unavyokwenda.",
              "From posting a listing to your property going live for buyers — here's how the process works."
            )}
          </p>

          <StepFlow steps={sellSteps} />

          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-[#2F6D4F]/25 bg-[#2F6D4F]/10 px-4 py-3 text-sm font-medium text-[#2F6D4F]">
            {t(
              "Hongera! Mali yako sasa imechapishwa kwenye SokoMkononi na iko tayari kuonekana na wanunuzi.",
              "Congratulations! Your property has been published on SokoMkononi and is now visible to buyers."
            )}
          </div>

          <button
            onClick={handleSellNow}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#2F6D4F] px-8 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {t("Uza Sasa", "Sell Now")}
            <ChevronRight size={15} />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          STILL HAVE QUESTIONS
          ═══════════════════════════════════════════════════════ */}
      <section className="border-t border-[color:rgb(var(--c-hairline))] py-10">
        <p className="px-4 text-center text-sm text-secondary">
          {t("Bado una maswali?", "Still have questions?")}{" "}
          <Link
            to="/mawasiliano#faq"
            className="font-semibold text-[color:rgb(var(--c-gold-ink))] hover:underline dark:text-[color:rgb(var(--c-gold))]"
          >
            {t("Angalia FAQ", "Check the FAQ")}
          </Link>{" "}
          {t("au", "or")}{" "}
          <Link
            to="/mawasiliano"
            className="font-semibold text-[color:rgb(var(--c-gold-ink))] hover:underline dark:text-[color:rgb(var(--c-gold))]"
          >
            {t("Wasiliana Nasi", "Contact Us")}
          </Link>
          .
        </p>
      </section>

      <NewsletterStrip variant="compact" />
      <Footer selectedLang={lang} />
      <BottomNav />
    </div>
  );
}

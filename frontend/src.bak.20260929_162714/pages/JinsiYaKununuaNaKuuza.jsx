import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useAuth } from "../config/authStore.js";

// ============================================================
// STEP FLOW — mfululizo wa hatua na mishale kati yake
// ============================================================
function StepFlow({ steps }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-3">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-1.5 bg-[#F5F3EC] rounded-full pl-1.5 pr-3 py-1.5">
            <span className="w-5 h-5 rounded-full bg-[#101A2E] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="text-body-sm font-medium text-secondary whitespace-nowrap">
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight size={14} className="text-muted shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function JinsiYaKununuaNaKuuza() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // HASH SCROLL — ukifika na #kuuza (mfano kutoka Navbar > Msaada),
  // tembeza moja kwa moja hadi sehemu husika.
  // ============================================================
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        const timeout = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
        return () => clearTimeout(timeout);
      }
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location]);

  const handleBuyNow = () => {
    if (user) navigate("/dashboard/buyer");
    else navigate("/register?intent=buy");
  };

  const handleSellNow = () => {
    if (user) navigate("/dashboard/post");
    else navigate("/register?intent=sell");
  };

  // ============================================================
  // JINSI YA KUNUNUA — hatua
  // ============================================================
  const buyStepsBeforeNote = [
    t('Bonyeza "Nunua Sasa"', 'Tap "Buy Now"'),
    t("Chagua Aina ya Mali", "Choose Property Type"),
    t(
      "Tafuta na Chagua Mali Unayoitaka",
      "Search and Select the Property You Want"
    ),
    t(
      "Wasiliana na Muuzaji kupitia Deal Room",
      "Contact the Seller via the Deal Room"
    ),
    t("Fanya Makubaliano ya Bei", "Negotiate the Price"),
    t("Muuzaji Akikubali", "Once the Seller Accepts"),
    t("Lipia Reservation", "Pay the Reservation Fee"),
  ];

  const buyStepsAfterNote = [
    t("Kamilisha Malipo", "Complete Payment"),
    t("Kamilisha Mchakato wa Ununuzi", "Complete the Purchase Process"),
  ];

  // ============================================================
  // JINSI YA KUUZA — hatua
  // ============================================================
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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ============================================================ */}
      {/* PAGE HEADER — "dark-surface" imeongezwa hapa ili h1 ya ndani
          ibaki nyeupe (rejea index.css: .dark-surface h1..h6 { color: #fff }) */}
      {/* ============================================================ */}
      <section className="dark-surface bg-[#101A2E] text-white py-12 sm:py-16 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
          {t("Jinsi Inavyofanya Kazi", "How It Works")}
        </h1>
        <p className="text-white/70 text-sm sm:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
          {t(
            "Fuata hatua hizi rahisi kununua au kuuza mali kwenye SokoMkononi.",
            "Follow these simple steps to buy or sell a property on SokoMkononi."
          )}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <a
            href="#kununua"
            className="bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-semibold text-btn px-5 py-2.5 rounded-full transition-colors"
          >
            {t("Jinsi ya Kununua", "How to Buy")}
          </a>
          <a
            href="#kuuza"
            className="bg-[#2F6D4F] hover:bg-[#245a41] text-white font-semibold text-btn px-5 py-2.5 rounded-full transition-colors"
          >
            {t("Jinsi ya Kuuza", "How to Sell")}
          </a>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 1 — JINSI YA KUNUNUA */}
      {/* ============================================================ */}
      <section
        id="kununua"
        className="scroll-mt-16 py-16 px-4 max-w-4xl mx-auto text-center"
      >
        <span
          className="text-body-sm font-bold uppercase tracking-wide"
          style={{ color: "#E8A33D" }}
        >
          {t("Kwa Mnunuzi", "For Buyers")}
        </span>
        <h2 className="mt-2">
          {t("Jinsi ya Kununua", "How to Buy")}
        </h2>
        <p className="text-body-sm text-secondary mt-3 mb-10 max-w-xl mx-auto leading-relaxed">
          {t(
            "Kutoka kutafuta mali hadi kukamilisha ununuzi — hivi ndivyo mchakato unavyokwenda.",
            "From finding a property to completing the purchase — here's how the process works."
          )}
        </p>

        <StepFlow steps={buyStepsBeforeNote} />

        <div
          className="flex items-start gap-2 rounded-lg px-4 py-3 my-6 max-w-2xl mx-auto text-body-sm leading-relaxed text-left"
          style={{ background: "rgba(37,99,235,0.06)", color: "#1D4ED8" }}
        >
          <Lock size={16} className="shrink-0 mt-0.5" />
          <span>
            {t(
              "Reservation huweka mali kwenye hali ya kuhifadhiwa kwa muda maalum, huku ukikamilisha hatua muhimu kama ukaguzi wa mali, uthibitishaji wa nyaraka na maandalizi ya malipo.",
              "A Reservation holds the property for a set period while you complete key steps such as inspecting the property, verifying documents, and preparing payment."
            )}
          </span>
        </div>

        <StepFlow steps={buyStepsAfterNote} />

        <div
          className="text-sm sm:text-base font-medium rounded-lg px-4 py-3 mt-8 max-w-2xl mx-auto"
          style={{ background: "rgba(47,109,79,0.08)", color: "#2F6D4F" }}
        >
          🎉{" "}
          {t(
            "Hongera! Umefanikiwa kukamilisha ununuzi wa mali kupitia SokoMkononi.",
            "Congratulations! You've successfully completed a property purchase through SokoMkononi."
          )}
        </div>

        <button
          onClick={handleBuyNow}
          className="mt-8 bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-semibold text-btn px-8 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          {t("Nunua Sasa", "Buy Now")}
        </button>
      </section>

      <div className="border-t border-gray-100" />

      {/* ============================================================ */}
      {/* SECTION 2 — JINSI YA KUUZA */}
      {/* ============================================================ */}
      <section
        id="kuuza"
        className="scroll-mt-16 py-16 px-4 max-w-4xl mx-auto text-center bg-[#F5F3EC]/40"
      >
        <span
          className="text-body-sm font-bold uppercase tracking-wide"
          style={{ color: "#2F6D4F" }}
        >
          {t("Kwa Muuzaji", "For Sellers")}
        </span>
        <h2 className="mt-2">
          {t("Jinsi ya Kuuza", "How to Sell")}
        </h2>
        <p className="text-body-sm text-secondary mt-3 mb-10 max-w-xl mx-auto leading-relaxed">
          {t(
            "Kutoka kuweka tangazo hadi mali yako kuonekana na wanunuzi — hivi ndivyo mchakato unavyokwenda.",
            "From posting a listing to your property going live for buyers — here's how the process works."
          )}
        </p>

        <StepFlow steps={sellSteps} />

        <div
          className="text-sm sm:text-base font-medium rounded-lg px-4 py-3 mt-8 max-w-2xl mx-auto"
          style={{ background: "rgba(47,109,79,0.08)", color: "#2F6D4F" }}
        >
          🎉{" "}
          {t(
            "Hongera! Mali yako sasa imechapishwa kwenye SokoMkononi na iko tayari kuonekana na wanunuzi.",
            "Congratulations! Your property has been published on SokoMkononi and is now visible to buyers."
          )}
        </div>

        <button
          onClick={handleSellNow}
          className="mt-8 bg-[#2F6D4F] hover:bg-[#245a41] text-white font-semibold text-btn px-8 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          {t("Uza Sasa", "Sell Now")}
        </button>
      </section>

      {/* ============================================================ */}
      {/* MSAADA ZAIDI — kiungo cha FAQ na Wasiliana Nasi */}
      {/* ============================================================ */}
      <section className="py-10 px-4 text-center border-t border-gray-100">
        <p className="text-body-sm text-secondary">
          {t("Bado una maswali?", "Still have questions?")}{" "}
          <Link
            to="/#faq"
            className="font-semibold hover:underline"
            style={{ color: "#E8A33D" }}
          >
            {t("Angalia FAQ", "Check the FAQ")}
          </Link>{" "}
          {t("au", "or")}{" "}
          <Link
            to="/mawasiliano"
            className="font-semibold hover:underline"
            style={{ color: "#E8A33D" }}
          >
            {t("Wasiliana Nasi", "Contact Us")}
          </Link>
          .
        </p>
      </section>

      <Footer selectedLang={lang} />
      <BottomNav />
    </div>
  );
}

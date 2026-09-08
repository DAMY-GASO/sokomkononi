import React from "react";
import Hero from "../components/landing/Hero.jsx";
import StatsLedger from "../components/landing/StatsLedger.jsx";
import WhySection from "../components/landing/WhySection.jsx";
import CategoryStalls from "../components/landing/CategoryStalls.jsx";
import Testimonials from "../components/landing/Testimonials.jsx";
import AppDownloadSection from "../components/landing/AppDownloadSection.jsx";
import FAQAccordion from "../components/landing/FAQAccordion.jsx";
import FinalCTA from "../components/landing/FinalCTA.jsx";

export default function LandingPage() {
  return (
    <div>
      <Hero />
      <StatsLedger />
      <WhySection />
      <CategoryStalls />
      <Testimonials />
      <AppDownloadSection />
      <FAQAccordion />
      <FinalCTA />
    </div>
  );
}

import React from "react";
import Hero from "../components/landing/Hero.jsx";
import StatsLedger from "../components/landing/StatsLedger.jsx";
import CategoryStalls from "../components/landing/CategoryStalls.jsx";
import WhySection from "../components/landing/WhySection.jsx";
import Testimonials from "../components/landing/Testimonials.jsx";
import AppDownloadSection from "../components/landing/AppDownloadSection.jsx";
import FAQAccordion from "../components/landing/FAQAccordion.jsx";
import FinalCTA from "../components/landing/FinalCTA.jsx";
import Footer from "../components/landing/Footer.jsx";

export default function LandingPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <Hero />
      <StatsLedger />
      <CategoryStalls />
      <WhySection />
      <Testimonials />
      <AppDownloadSection />
      <FAQAccordion />
      <FinalCTA />
      <Footer />
    </div>
  );
}

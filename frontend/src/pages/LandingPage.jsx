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

// Navbar HAIKO hapa kwa makusudi — App.jsx tayari inaweka Navbar ya global
// nje ya <Routes>, kwa hiyo inaonekana juu ya ukurasa huu moja kwa moja.
// Footer inabaki hapa kwa sababu ni ya landing page pekee, si global.
export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatsLedger />
      <CategoryStalls />
      <WhySection />
      <Testimonials />
      <AppDownloadSection />
      <FAQAccordion />
      <FinalCTA />
      <Footer />
    </>
  );
}

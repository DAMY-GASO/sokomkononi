import React from "react";
import Navbar from "./Navbar.jsx";
import Hero from "./Hero.jsx";
import StatsLedger from "./StatsLedger.jsx";
import CategoryStalls from "./CategoryStalls.jsx";
import WhySection from "./WhySection.jsx";
import Testimonials from "./Testimonials.jsx";
import AppDownloadSection from "./AppDownloadSection.jsx";
import FAQAccordion from "./FAQAccordion.jsx";
import FinalCTA from "./FinalCTA.jsx";
import Footer from "./Footer.jsx";

// Mpangilio wa sehemu (top → bottom) umefuata muundo wa kawaida wa marketplace
// landing page: onyesha thamani mara moja (Hero + MarketRail + Stats), kisha
// uwepesishe uvinjari (Categories), jenga imani (Why + Testimonials), toa
// njia mbadala (App), ondoa mashaka (FAQ), na malizia na wito wa kuchukua
// hatua kabla ya Footer.
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sand">
      <Navbar />
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

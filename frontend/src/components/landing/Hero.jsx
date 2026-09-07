import React from "react";
import { Link } from "react-router-dom";
import MarketRail from "./MarketRail.jsx";

export default function Hero() {
  return (
    <section className="bg-night text-sand">
      <div className="max-w-6xl mx-auto px-5 pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="max-w-xl">
          <p className="text-gold text-sm font-semibold tracking-wide">SokoMkononi</p>
          <h1 className="font-bold text-2xl md:text-4xl leading-[1.4] mt-3">
            Nunua na uza mali kwa usalama, mkononi mwako.
          </h1>
          <p className="mt-4 text-sand/70 text-sm md:text-base leading-relaxed max-w-md">
            Jiunge na maelfu ya wanunuzi na wauzaji wa nyumba, viwanja, magari
            na biashara kwenye SokoMkononi — kila deal inapita kwenye Deal Room
            salama kabla ya malipo.
          </p>

          <div className="flex flex-wrap gap-3 mt-7">
            <Link
              to="/register?intent=buy"
              className="bg-gold hover:bg-gold-dark text-night font-semibold text-sm md:text-base px-6 py-3 rounded-md transition-colors"
            >
              Nunua Sasa
            </Link>
            <Link
              to="/register?intent=sell"
              className="border border-market text-market bg-market/10 hover:bg-market/20 font-semibold text-sm md:text-base px-6 py-3 rounded-md transition-colors"
            >
              Uza Sasa
            </Link>
          </div>

          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 mt-6 text-xs text-sand/50 hover:text-sand/80"
          >
            📱 SokoMkononi App inakuja hivi karibuni — jiunge waitlist
          </Link>
        </div>
      </div>

      <MarketRail />
    </section>
  );
}

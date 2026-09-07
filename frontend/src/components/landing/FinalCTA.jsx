import React from "react";
import { Link } from "react-router-dom";

export default function FinalCTA() {
  return (
    <section className="bg-night text-sand text-center py-14 md:py-16 px-5">
      <h2 className="text-2xl md:text-3xl font-bold max-w-lg mx-auto leading-[1.4]">
        Uko tayari kununua au kuuza mali yako?
      </h2>
      <p className="text-sand/60 text-sm md:text-base mt-3">
        Kujisajili kunachukua chini ya dakika moja.
      </p>
      <div className="flex flex-wrap gap-3 justify-center mt-7">
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
    </section>
  );
}

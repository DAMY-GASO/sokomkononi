import React from "react";
import AppDownloadBadges from "./AppDownloadBadges.jsx";

// Sehemu maalum ya kupakua App (touchpoint ya tatu) — tazama muongozo 7
export default function AppDownloadSection() {
  return (
    <section className="bg-sand py-14 md:py-16 border-t border-ink-muted/15">
      <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-gold text-sm font-semibold">Hivi Karibuni</p>
          <h2 className="text-xl md:text-2xl font-bold text-ink-primary mt-1">
            Fanya biashara ukiwa popote — SokoMkononi App inakuja
          </h2>
          <p className="text-ink-secondary text-sm md:text-base mt-2 max-w-md">
            Jiandikishe kwenye waitlist ili upate taarifa mara app itakapotoka
            kwa Android na iOS.
          </p>
        </div>
        <AppDownloadBadges variant="light" />
      </div>
    </section>
  );
}

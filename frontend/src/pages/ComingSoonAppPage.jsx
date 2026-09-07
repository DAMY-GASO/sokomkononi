import React, { useState } from "react";

// Waitlist ya Mobile App (Awamu ya Pili) — tazama muongozo 7
export default function ComingSoonAppPage() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: unganisha na backend endpoint ya waitlist (Awamu ya baadaye)
    setJoined(true);
  }

  return (
    <div className="max-w-md mx-auto px-5 py-20 text-center">
      <p className="text-gold text-sm font-semibold">SokoMkononi App</p>
      <h1 className="text-2xl md:text-3xl font-bold text-ink-primary mt-2">
        Inakuja hivi karibuni
      </h1>
      <p className="text-ink-secondary text-sm md:text-base mt-3 leading-relaxed">
        Tunatengeneza SokoMkononi App kwa ajili ya Android na iOS. Jiandikishe
        hapa chini ili upate taarifa mara itakapotoka.
      </p>

      {joined ? (
        <p className="mt-8 text-market font-semibold text-sm">
          Asante! Umeongezwa kwenye waitlist.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-2">
          <input
            required
            type="email"
            placeholder="Weka email yako"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
          />
          <button className="bg-gold hover:bg-gold-dark text-night font-semibold text-sm px-5 py-2.5 rounded-md transition-colors">
            Niarifu
          </button>
        </form>
      )}

      <div className="flex gap-3 justify-center mt-10 opacity-60">
        <span className="border border-ink-muted/30 rounded-md px-4 py-2 text-xs text-ink-secondary">
          Android — hivi karibuni
        </span>
        <span className="border border-ink-muted/30 rounded-md px-4 py-2 text-xs text-ink-secondary">
          iOS — hivi karibuni
        </span>
      </div>
    </div>
  );
}

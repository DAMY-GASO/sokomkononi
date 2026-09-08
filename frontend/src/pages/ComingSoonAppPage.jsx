import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function ComingSoonAppPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: unganisha na backend endpoint ya waitlist (Awamu ya baadaye)
    setJoined(true);
  }

  return (
    <div className="max-w-md mx-auto px-5 py-20 text-center">
      <p className="text-gold text-sm font-semibold">{t("comingsoon_eyebrow")}</p>
      <h1 className="text-2xl md:text-3xl font-bold text-ink-primary mt-2">
        {t("comingsoon_heading")}
      </h1>
      <p className="text-ink-secondary text-sm md:text-base mt-3 leading-relaxed">
        {t("comingsoon_body")}
      </p>

      {joined ? (
        <p className="mt-8 text-market font-semibold text-sm">{t("comingsoon_success")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-2">
          <input
            required
            type="email"
            placeholder={t("comingsoon_email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
          />
          <button className="bg-gold hover:bg-gold-dark text-night font-semibold text-sm px-5 py-2.5 rounded-md transition-colors">
            {t("comingsoon_submit")}
          </button>
        </form>
      )}

      <div className="flex gap-3 justify-center mt-10 opacity-60">
        <span className="border border-ink-muted/30 rounded-md px-4 py-2 text-xs text-ink-secondary">
          {t("comingsoon_android_soon")}
        </span>
        <span className="border border-ink-muted/30 rounded-md px-4 py-2 text-xs text-ink-secondary">
          {t("comingsoon_ios_soon")}
        </span>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Mail, Loader2, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { api } from "../api/client.js";

const STORAGE_KEY = "sokomkononi_newsletter_subscribed";

export default function NewsletterStrip({ variant = "compact" }) {
  const { lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy || done) return;
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setError(t("Barua pepe si sahihi.", "Invalid email."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post("/contact/", {
        name: "Newsletter subscriber",
        email: trimmed,
        message: "Newsletter subscription (SokoMkononi footer form).",
      });
      try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      setDone(true);
    } catch (err) {
      setError(err?.message || t("Imeshindwa. Jaribu tena.", "Failed. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const isCompact = variant === "compact";

  return (
    <section
      className={`relative w-full border-y border-hairline bg-sand
                  dark:bg-transparent dark:border-transparent
                  ${isCompact ? "py-6 sm:py-8" : "py-10 sm:py-14"}`}
    >
      {/* Dark mode: navy gradient overlay */}
      <div
        aria-hidden="true"
        className="hidden dark:block absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #011957 0%, #042475 60%, #010F3A 100%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="text-center lg:text-left">
            <h3
              className="text-lg sm:text-2xl font-bold
                         text-primary dark:text-white"
            >
              {t("Jiunge na Jarida Letu", "Join Our Newsletter")}
            </h3>
            <p
              className="text-xs sm:text-sm mt-1.5 max-w-md mx-auto lg:mx-0
                         text-secondary dark:text-white/60"
            >
              {t(
                "Pata taarifa za mali mpya, ofa, na vidokezo muhimu.",
                "Get updates on new listings, offers, and important tips."
              )}
            </p>
          </div>

          {done ? (
            <div
              className="flex items-center justify-center gap-2 text-sm font-semibold
                         text-green dark:text-[#FEA406]"
            >
              <Check size={18} />
              {t("Asante! Umejiunga.", "Thanks! You're subscribed.")}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-stretch gap-2 w-full lg:w-auto max-w-md mx-auto lg:mx-0"
            >
              <div className="relative flex-1 min-w-0">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2
                             text-muted dark:text-white/40"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder={t("Barua pepe yako", "Your email")}
                  disabled={busy}
                  className="w-full rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none transition-colors
                             bg-white border border-sandline text-primary placeholder-muted
                             focus:border-gold
                             dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder-white/40
                             dark:focus:border-[#FEA406]
                             disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold text-sm text-[#011957] disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)",
                }}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                {t("Jiunge", "Subscribe")}
              </button>
            </form>
          )}
        </div>
        {error && (
          <p className="text-rust dark:text-[#FEA406] text-xs mt-2 text-center lg:text-right">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

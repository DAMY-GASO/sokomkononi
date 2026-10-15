import React, { useState } from "react";
import { Mail, Loader2, Check, Sparkles, Bell, Gift, LifeBuoy } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { api } from "../../api/client.js";

const STORAGE_KEY = "sokomkononi_newsletter_subscribed";

export default function NewsletterCTA() {
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

  const submit = async (e) => {
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
        message: "Home page newsletter signup (SokoMkononi).",
      });
      try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      setDone(true);
    } catch (err) {
      setError(err?.message || t("Imeshindwa. Jaribu tena.", "Failed. Try again."));
    } finally {
      setBusy(false);
    }
  };

  const benefits = [
    {
      icon: Bell,
      title: t("Mali Mpya Kwanza", "New Listings First"),
      desc: t("Taarifa za papo hapo", "Instant alerts"),
    },
    {
      icon: Gift,
      title: t("Ofa za Kipekee", "Exclusive Offers"),
      desc: t("Punguzo kwa wateja", "Subscriber discounts"),
    },
    {
      icon: Sparkles,
      title: t("Vidokezo Muhimu", "Important Tips"),
      desc: t("Vidokezo vya usalama", "Safety tips"),
    },
    {
      icon: LifeBuoy,
      title: t("Msaada wa Haraka", "Fast Support"),
      desc: t("Tunajibu haraka", "Quick replies"),
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-page">
      <div className="max-w-7xl mx-auto px-4">
        <div
          className="relative rounded-3xl overflow-hidden
                     bg-card border border-hairline
                     dark:bg-transparent dark:border-transparent"
        >
          {/* Dark mode: navy-blue gradient */}
          <div
            aria-hidden="true"
            className="hidden dark:block absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #0062FD 0%, #011957 55%, #010F3A 100%)",
            }}
          />
          {/* Dark mode: dotted pattern */}
          <div
            aria-hidden="true"
            className="hidden dark:block absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          {/* Light mode: subtle gold accent */}
          <div
            aria-hidden="true"
            className="dark:hidden absolute -top-24 -right-24 w-[380px] h-[380px] rounded-full opacity-[0.10] blur-[100px] pointer-events-none"
            style={{ background: "radial-gradient(circle, #FEA406 0%, transparent 70%)" }}
          />

          <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-10 p-8 sm:p-12 lg:p-14">
            <div className="text-center lg:text-left">
              <span
                className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full mb-4
                           bg-gold/15 text-gold-ink
                           dark:bg-[#FEA406]/20 dark:text-[#FEA406]"
              >
                {t("Ofa Maalum", "Special Offer")}
              </span>
              <h2
                className="text-2xl sm:text-4xl font-bold leading-tight
                           text-primary dark:text-white"
              >
                {t(
                  "Pata Taarifa za Mali Mpya Kwanza",
                  "Be First to See New Listings"
                )}
              </h2>
              <p
                className="text-xs sm:text-sm mt-4 max-w-md mx-auto lg:mx-0 leading-relaxed
                           text-secondary dark:text-white/70"
              >
                {t(
                  "Jiunge na jarida letu upate taarifa za mali mpya, ofa, na vidokezo vya usalama — moja kwa moja kwenye barua pepe yako.",
                  "Subscribe to be notified about new listings, offers, and safety tips — straight to your inbox."
                )}
              </p>

              {done ? (
                <div
                  className="mt-6 inline-flex items-center gap-2 font-semibold
                             text-green dark:text-[#FEA406]"
                >
                  <Check size={18} />
                  {t("Asante! Umejiunga.", "Thanks! You're subscribed.")}
                </div>
              ) : (
                <form
                  onSubmit={submit}
                  className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto lg:mx-0"
                >
                  <div className="relative flex-1">
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
                      className="w-full rounded-lg pl-10 pr-3 py-3 text-sm outline-none transition-colors
                                 bg-sand border border-sandline text-primary placeholder-muted
                                 focus:border-gold
                                 dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder-white/40
                                 dark:focus:border-[#FEA406]
                                 disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-lg font-semibold text-sm text-[#011957] disabled:opacity-60"
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
              {error && (
                <p className="text-rust dark:text-[#FEA406] text-xs mt-2">
                  {error}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 self-center">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div
                    key={i}
                    className="rounded-xl p-3.5 sm:p-4 border
                               bg-sand border-sandline
                               dark:bg-white/[0.06] dark:border-white/10 dark:backdrop-blur-sm"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5
                                 bg-gold/15
                                 dark:bg-[#FEA406]/20"
                    >
                      <Icon size={16} className="text-gold-ink dark:text-[#FEA406]" />
                    </div>
                    <p
                      className="text-sm font-semibold leading-tight
                                 text-primary dark:text-white"
                    >
                      {b.title}
                    </p>
                    <p
                      className="text-[11px] mt-1 leading-snug
                                 text-secondary dark:text-white/55"
                    >
                      {b.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

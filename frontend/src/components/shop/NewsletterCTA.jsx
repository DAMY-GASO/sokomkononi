import React, { useState } from "react";
import { Mail, Loader2, Check, Sparkles, Bell, Gift, LifeBuoy } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { api } from "../../api/client.js";
import { Section, Button } from "../ui";

const STORAGE_KEY = "sokomkononi_newsletter_subscribed";

export default function NewsletterCTA() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(() => { try { return window.localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; } });

  const submit = async (e) => {
    e.preventDefault();
    if (busy || done) return;
    const v = email.trim();
    if (!v.includes("@")) { setError(t("Barua pepe si sahihi.", "Invalid email.")); return; }
    setBusy(true); setError("");
    try {
      await api.post("/contact/", { name: "Newsletter subscriber", email: v, message: "Home page newsletter signup." });
      try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      setDone(true);
    } catch (err) {
      setError(err?.message || t("Imeshindwa. Jaribu tena.", "Failed. Try again."));
    } finally { setBusy(false); }
  };

  const benefits = [
    { Icon: Bell,     title: t("Mali Mpya Kwanza", "New Listings First"), desc: t("Taarifa za papo hapo", "Instant alerts") },
    { Icon: Gift,     title: t("Ofa za Kipekee",   "Exclusive Offers"),   desc: t("Punguzo kwa wateja", "Subscriber discounts") },
    { Icon: Sparkles, title: t("Vidokezo Muhimu",  "Important Tips"),     desc: t("Vidokezo vya usalama", "Safety tips") },
    { Icon: LifeBuoy, title: t("Msaada wa Haraka", "Fast Support"),       desc: t("Tunajibu haraka", "Quick replies") },
  ];

  return (
    <Section>
      <div className="surface-night noise relative overflow-hidden rounded-3xl p-6 sm:p-12">
        <div className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full blur-3xl opacity-60" style={{ background: "radial-gradient(circle, rgb(0 98 253 / .32), transparent 70%)" }} />
        <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-10">
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full bg-[rgb(254,164,6,0.20)] text-[rgb(254,164,6)] mb-4">{t("Ofa Maalum", "Special Offer")}</span>
            <h2 className="text-headline text-white">{t("Pata Taarifa za Mali Mpya Kwanza", "Be First to See New Listings")}</h2>
            <p className="text-sm mt-4 max-w-md text-white/70 leading-relaxed">
              {t("Jiunge na jarida letu upate taarifa za mali mpya, ofa, na vidokezo vya usalama — moja kwa moja kwenye barua pepe yako.", "Subscribe to be notified about new listings, offers, and safety tips — straight to your inbox.")}
            </p>
            {done ? (
              <div className="mt-6 inline-flex items-center gap-2 font-semibold text-[rgb(254,164,6)]">
                <Check size={18} />
                {t("Asante! Umejiunga.", "Thanks! You're subscribed.")}
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }} placeholder={t("Barua pepe yako", "Your email")} disabled={busy} className="w-full rounded-lg pl-10 pr-3 py-3 text-sm outline-none transition-colors bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-[rgb(254,164,6)] disabled:opacity-50" />
                </div>
                <Button type="submit" disabled={busy} className="shrink-0">
                  {busy ? <Loader2 size={14} className="animate-spin-slow" /> : null}
                  {t("Jiunge", "Subscribe")}
                </Button>
              </form>
            )}
            {error && <p className="mt-2 text-xs text-[rgb(254,164,6)]">{error}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 self-center">
            {benefits.map((b, i) => (
              <div key={i} className="rounded-xl p-3.5 sm:p-4 border border-white/10 bg-white/[0.06] backdrop-blur-sm">
                <div className="grid place-items-center h-9 w-9 rounded-lg mb-2.5 bg-[rgb(254,164,6,0.16)]"><b.Icon size={16} className="text-[rgb(254,164,6)]" /></div>
                <p className="text-sm font-semibold leading-tight text-white">{b.title}</p>
                <p className="text-[11px] mt-1 leading-snug text-white/55">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

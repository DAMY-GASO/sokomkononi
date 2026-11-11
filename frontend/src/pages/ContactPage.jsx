import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Mail, Phone, MapPin, Send, CheckCircle2, Loader2, AlertTriangle,
  MessageSquare, Clock, ChevronDown, HelpCircle,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import NewsletterStrip from "../components/NewsletterStrip.jsx";
import Captcha, { isCaptchaEnabled } from "../components/Captcha.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../config/authStore.js";
import { faqs } from "../config/FaqsData.js";
import { useContactInfo } from "../config/systemSettingsStore.js";

// ── WhatsApp Icon Halisi (SVG) ─────────────────────────────
function WhatsAppIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Ulinzi dhidi ya spam (bila huduma ya nje) ──────────────
// 1) Honeypot: sehemu iliyofichwa ambayo binadamu hajazi, bot hujaza
// 2) Time-trap: fomu iliyotumwa chini ya sekunde 3 ni bot
// 3) Cooldown: ujumbe mmoja kwa dakika 1 kwa kila kivinjari
const MIN_FILL_MS = 3000;
const COOLDOWN_MS = 60_000;
const COOLDOWN_KEY = "smk_contact_last_sent";

function cooldownLeftMs() {
  try {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    return Math.max(0, COOLDOWN_MS - (Date.now() - last));
  } catch {
    return 0;
  }
}

export default function ContactPage() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [contactInfo] = useContactInfo();
  const { user } = useAuth();
  const isGuest = !user;

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [honeypot, setHoneypot] = useState("");
  // Cloudflare Turnstile — inafanya kazi tu kama VITE_TURNSTILE_SITE_ID ipo
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0); // badilisha ili kureset widget
  const mountedAt = useRef(Date.now());

  const email = contactInfo?.email || "support@sokomkononi.co.tz";
  const phone = contactInfo?.phone || "+255 743 895 038";
  const whatsappNumber = contactInfo?.whatsapp || "255743895038";
  const address = contactInfo?.address || "Dar es Salaam, Tanzania";

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError(t("Jaza sehemu zote tatu.", "Please fill in all three fields."));
      return;
    }
    if (!form.email.includes("@")) {
      setError(t("Barua pepe si sahihi.", "That email doesn't look right."));
      return;
    }
    if (form.message.trim().length < 10) {
      setError(t("Ujumbe lazima uwe na angalau herufi 10.", "Message must be at least 10 characters."));
      return;
    }

    // Bot: honeypot imejazwa → jifanye umefanikiwa bila kutuma chochote
    if (honeypot) {
      setSent(true);
      setForm({ name: "", email: "", message: "" });
      return;
    }
    if (Date.now() - mountedAt.current < MIN_FILL_MS) {
      setError(
        t(
          "Tafadhali subiri sekunde chache kisha ujaribu tena.",
          "Please wait a few seconds and try again."
        )
      );
      return;
    }
    const waitMs = cooldownLeftMs();
    if (waitMs > 0) {
      const secs = Math.ceil(waitMs / 1000);
      setError(
        t(
          `Umetuma ujumbe hivi punde. Subiri sekunde ${secs} kisha ujaribu tena.`,
          `You just sent a message. Please wait ${secs}s and try again.`
        )
      );
      return;
    }

    if (isCaptchaEnabled && !captchaToken) {
      setError(t("Thibitisha kuwa wewe si roboti.", "Please confirm you are not a robot."));
      return;
    }

    setBusy(true);
    setError("");

    try {
      const captchaPart = isCaptchaEnabled ? { captcha_token: captchaToken } : {};
      if (isGuest) {
        // /tickets/ inahitaji login (IsAuthenticated) — mgeni anatumia /contact/ ya umma
        await api.post("/contact/", {
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          ...captchaPart,
        });
      } else {
        // Aliyeingia → ticket moja kwa moja (inafuatiliwa kwenye Safety & Support)
        await api.post("/tickets/", {
          subject: t(
            `Ujumbe kutoka ukurasa wa Mawasiliano — ${form.name.trim()}`,
            `Message from Contact Page — ${form.name.trim()}`
          ),
          description:
            `Jina / Name: ${form.name.trim()}\n` +
            `Email: ${form.email.trim()}\n\n` +
            `${form.message.trim()}`,
          category: "OTHER",
          priority: "MEDIUM",
          ...captchaPart,
        });
      }
      try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())); } catch { /* ignore */ }
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("API Error Details:", err);
      let errorMsg = t(
        "Imeshindwa kutuma ujumbe. Jaribu tena.",
        "Couldn't send. Please try again."
      );
      if (err?.status === 429 || err?.response?.status === 429) {
        // Rate limiting ya backend — onyesha ujumbe wazi badala ya hitilafu ya jumla
        errorMsg = t(
          "Maombi ni mengi sana. Subiri dakika chache kisha ujaribu tena.",
          "Too many requests. Please wait a few minutes and try again."
        );
      } else if (err?.error?.fields) {
        const fieldErrors = err.error.fields;
        const firstField = Object.keys(fieldErrors)[0];
        if (firstField && Array.isArray(fieldErrors[firstField])) {
          errorMsg = fieldErrors[firstField][0];
        }
      } else if (err?.error?.message) {
        errorMsg = err.error.message;
      } else if (err?.data?.detail) {
        errorMsg = err.data.detail;
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      // Token ya Turnstile ni ya matumizi mara moja — reset kila baada ya kutuma
      setCaptchaToken("");
      setCaptchaKey((k) => k + 1);
      setBusy(false);
    }
  };

  const channels = [
    {
      Icon: Mail,
      title: t("Barua Pepe", "Email"),
      value: email,
      href: `mailto:${email}`,
      color: "#0062FD",
    },
    {
      Icon: Phone,
      title: t("Simu", "Phone"),
      value: phone,
      href: `tel:${phone.replace(/\s/g, "")}`,
      color: "#2F6D4F",
      whatsapp: `https://wa.me/${whatsappNumber}`,
    },
    {
      Icon: MapPin,
      title: t("Ofisi", "Office"),
      value: address,
      href: null,
      color: "#FEA406",
    },
    {
      Icon: Clock,
      title: t("Muda wa Kazi", "Business Hours"),
      value: t("Jumatatu–Jumamosi · 08:00–18:00", "Mon–Sat · 8am–6pm"),
      href: null,
      color: "#7C3AED",
    },
  ];

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      {/* HERO */}
      <section className="surface-night relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(135deg, #010F3A 0%, #011957 55%, #042475 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/4 -z-10 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #FEA406 0%, transparent 70%)" }}
        />

        <div className="container relative py-12 sm:py-16">
          <div className="flex flex-col items-center gap-4 text-center">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
              style={{
                background: "rgba(254,164,6,0.20)",
                border: "1px solid rgba(254,164,6,0.35)",
              }}
            >
              <MessageSquare size={26} color="#FEA406" />
            </span>
            <div>
              <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-tight text-white">
                {t("Wasiliana Nasi", "Contact Us")}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
                {t(
                  "Una swali au changamoto? Timu yetu iko tayari kukusaidia.",
                  "Have a question or an issue? Our team is here to help."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT CHANNELS */}
      <section className="container py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map(({ Icon, title, value, href, color, whatsapp }) => {
            const inner = (
              <>
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                  style={{
                    background: `${color}15`,
                    color,
                    border: `1px solid ${color}30`,
                  }}
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                    {title}
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-primary">
                    {value}
                  </p>
                </div>
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-110 self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <WhatsAppIcon size={15} />
                  </a>
                )}
              </>
            );

            return href ? (
              <a
                key={title}
                href={href}
                className="flex items-start gap-3 rounded-2xl border border-hairline bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                {inner}
              </a>
            ) : (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-hairline bg-card p-4 sm:p-5"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      {/* MESSAGE FORM */}
      <section className="container pb-14 sm:pb-16">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-hairline bg-card p-6 sm:p-8">
            {sent ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#2F6D4F]/10">
                  <CheckCircle2 size={32} className="text-[#2F6D4F]" />
                </div>
                <h2 className="text-xl font-bold text-primary">
                  {t("Ujumbe Umetumwa!", "Message Sent!")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  {t(
                    isGuest
                      ? "Asante kwa kuwasiliana nasi. Tutakujibu haraka iwezekanavyo kupitia barua pepe uliyotoa."
                      : "Asante kwa kuwasiliana nasi. Tutakujibu haraka iwezekanavyo kupitia ukurasa wa Usalama & Msaada.",
                    isGuest
                      ? "Thanks for reaching out. We'll reply to the email you provided as soon as possible."
                      : "Thanks for reaching out. We'll reply through Safety & Support as soon as possible."
                  )}
                </p>
                {!isGuest && (
                  <Link
                    to="/dashboard/safety"
                    className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    {t("Nenda kwenye Usalama & Msaada", "Go to Safety & Support")}
                  </Link>
                )}
                <div className="mt-4">
                  <button
                    onClick={() => setSent(false)}
                    className="text-xs font-semibold text-secondary hover:underline"
                  >
                    {t("Tuma ujumbe mwingine", "Send another message")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h2 className="text-lg font-bold text-primary sm:text-xl">
                    {t("Tuandikie Ujumbe", "Drop Us a Message")}
                  </h2>
                  <p className="mt-1 text-sm text-secondary">
                    {t(
                      isGuest
                        ? "Tutakujibu ndani ya saa 24 za kazi kupitia barua pepe yako."
                        : "Tutakujibu ndani ya saa 24 za kazi — majibu yataonekana kwenye ukurasa wa Usalama & Msaada.",
                      isGuest
                        ? "We'll reply within 24 business hours by email."
                        : "We'll reply within 24 business hours — your replies will appear in Safety & Support."
                    )}
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  {/* Honeypot — imefichwa kwa binadamu na screen readers */}
                  <div
                    aria-hidden="true"
                    style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
                  >
                    <label>
                      Website
                      <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-primary">
                      {t("Jina", "Name")}
                    </span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={t("Jina lako", "Your name")}
                      className="input"
                      disabled={busy}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-primary">
                      {t("Barua Pepe", "Email")}
                    </span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder={t("Barua pepe yako", "Your email")}
                      className="input"
                      disabled={busy}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-primary">
                      {t("Ujumbe", "Message")}
                    </span>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder={t("Andika ujumbe wako...", "Write your message...")}
                      className="textarea min-h-[140px]"
                      disabled={busy}
                    />
                    <p className={`mt-1 text-right text-xs ${form.message.trim().length > 0 && form.message.trim().length < 10 ? "text-[#C1502E]" : "text-secondary"}`}>
                      {form.message.trim().length}/10 {t("herufi", "characters")}
                    </p>
                  </label>

                  <Captcha
                    key={captchaKey}
                    onVerify={setCaptchaToken}
                    onExpire={() => setCaptchaToken("")}
                  />

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-[#C1502E]/30 bg-[#C1502E]/10 px-3 py-2 text-xs text-[#C1502E]">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-[#011957] transition-transform active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)",
                      boxShadow: "0 8px 22px -8px rgba(254,164,6,0.55)",
                    }}
                  >
                    {busy ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    {busy
                      ? t("Inatuma...", "Sending...")
                      : t("Tuma Ujumbe", "Send Message")}
                  </button>

                  <p className="text-center text-[11px] leading-snug text-muted">
                    {t("Kwa msaada wa haraka, angalia", "For quick help, see our")}{" "}
                    <Link
                      to="/jinsi-ya-kununua"
                      className="font-semibold text-primary hover:underline"
                    >
                      {t("Jinsi Inavyofanya Kazi", "How It Works")}
                    </Link>{" "}
                    {t("au", "or")}{" "}
                    <a
                      href="#faq"
                      className="font-semibold text-primary hover:underline"
                    >
                      FAQ
                    </a>
                    .
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="border-t border-hairline bg-page">
        <div className="container py-12 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary">
                <HelpCircle size={13} />
                FAQ
              </span>
              <h2 className="mt-4 text-[clamp(1.5rem,3vw,2rem)] font-bold text-primary">
                {t("Maswali Yanayoulizwa Mara kwa Mara", "Frequently Asked Questions")}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-secondary">
                {t(
                  "Majibu ya haraka kwa maswali yanayoulizwa mara kwa mara kuhusu SokoMkononi.",
                  "Quick answers to the most common questions about SokoMkononi."
                )}
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="overflow-hidden rounded-xl border border-hairline bg-card transition-shadow hover:shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-semibold text-primary sm:text-[15px]">
                        {faq.q[lang] || faq.q.sw}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-secondary transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-hairline px-4 pb-4 pt-3 sm:px-5">
                        <p className="whitespace-pre-line text-sm leading-relaxed text-secondary">
                          {faq.a[lang] || faq.a.sw}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-secondary">
                {t("Bado una swali?", "Still have a question?")}{" "}
                <a
                  href={`mailto:${email}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {t("Wasiliana nasi", "Contact us")}
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <NewsletterStrip variant="compact" />
      <Footer selectedLang={lang} />
      <BottomNav />
    </div>
  );
}
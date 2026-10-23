import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail, Phone, MapPin, Send, CheckCircle2, Loader2, AlertTriangle,
  MessageSquare, Clock, ChevronDown, HelpCircle, MessageCircle,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import NewsletterStrip from "../components/NewsletterStrip.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { contactApi } from "../api/contact.js";
import { faqs } from "../config/FaqsData.js";

export default function ContactPage() {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

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
    setBusy(true);
    setError("");
    try {
      await contactApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kutuma ujumbe. Jaribu tena.", "Couldn't send. Please try again.")
      );
    } finally {
      setBusy(false);
    }
  };

  const channels = [
    {
      Icon: Mail,
      title: t("Barua Pepe", "Email"),
      value: "support@sokomkononi.co.tz",
      href: "mailto:support@sokomkononi.co.tz",
      color: "#0062FD",
    },
    {
      Icon: Phone,
      title: t("Simu", "Phone"),
      value: "+255 743 895 038",
      href: "tel:+255743895038",
      color: "#2F6D4F",
      whatsapp: "https://wa.me/255743895038", // ⬅️ WhatsApp link
    },
    {
      Icon: MapPin,
      title: t("Ofisi", "Office"),
      value: "Dar es Salaam, Tanzania",
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
                {/* ⬅️ WHATSAPP BUTTON */}
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-110 self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageCircle size={15} />
                  </a>
                )}
              </>
            );

            return href ? (
              <a
                key={title}
                href={href}
                className="flex items-start gap-3 rounded-2xl border border-[color:rgb(var(--c-hairline))] bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                {inner}
              </a>
            ) : (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-[color:rgb(var(--c-hairline))] bg-card p-4 sm:p-5"
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
          <div className="rounded-2xl border border-[color:rgb(var(--c-hairline))] bg-card p-6 sm:p-8">
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
                    "Asante kwa kuwasiliana nasi. Tutakujibu haraka iwezekanavyo.",
                    "Thanks for reaching out. We'll get back to you as soon as possible."
                  )}
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-sm font-semibold text-[color:rgb(var(--c-royal))] hover:underline"
                >
                  {t("Tuma ujumbe mwingine", "Send another message")}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h2 className="text-lg font-bold text-primary sm:text-xl">
                    {t("Tuandikie Ujumbe", "Drop Us a Message")}
                  </h2>
                  <p className="mt-1 text-sm text-secondary">
                    {t(
                      "Tutakujibu ndani ya saa 24 za kazi.",
                      "We'll reply within 24 business hours."
                    )}
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
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
                  </label>

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
                      className="font-semibold text-[color:rgb(var(--c-royal))] hover:underline"
                    >
                      {t("Jinsi Inavyofanya Kazi", "How It Works")}
                    </Link>{" "}
                    {t("au", "or")}{" "}
                    <a
                      href="#faq"
                      className="font-semibold text-[color:rgb(var(--c-royal))] hover:underline"
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

      {/* ═══════════════════════════════════════════════════════
          FAQ SECTION
          ═══════════════════════════════════════════════════════ */}
      <section id="faq" className="border-t border-[color:rgb(var(--c-hairline))] bg-[color:rgb(var(--c-sand))]">
        <div className="container py-12 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--c-hairline))] bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary">
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
                    className="overflow-hidden rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card transition-shadow hover:shadow-sm"
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
                      <div className="border-t border-[color:rgb(var(--c-hairline))] px-4 pb-4 pt-3 sm:px-5">
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
                  href="mailto:support@sokomkononi.co.tz"
                  className="font-semibold text-[color:rgb(var(--c-royal))] hover:underline"
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
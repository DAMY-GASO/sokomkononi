// ============================================================
// ContactPage.jsx
// Wasiliana Nasi — bilingual kamili + PageLoader.
// ============================================================

import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Footer from "../components/Footer.jsx";
import BottomNav from "../components/BottomNav.jsx";
import Navbar from "../components/Navbar.jsx";

// ============================================================
// PAGE LOADER — rahisi, inaonekana mara moja tu
// ============================================================
import PageLoader from "../components/PageLoader.jsx";

export default function ContactPage() {
  const { t, lang } = useLanguage();

  // ============================================================
  // LOADER — inaonekana mara moja tu ukurasa unapofunguka
  // ============================================================
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(id);
  }, []);

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: unganisha na backend halisi, mfano: await apiPost("/contact", form)
    setSent(true);
  }

  // ============================================================
  // LOADER — kama bado haijawa tayari, onyesha loader
  // ============================================================
  if (!ready) {
    return <PageLoader lang={lang} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <Navbar />

      {/* ============================================================ */}
      {/* HERO SECTION — CENTERED */}
      {/* ============================================================ */}
      <section className="bg-[#101A2E] text-white py-14 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">
          {t("contact_heading")}
        </h1>
        <p className="text-white/70 mt-3 max-w-xl mx-auto">
          {t("contact_subtext")}
        </p>
      </section>

      {/* ============================================================ */}
      {/* CONTACT SECTION — CENTERED */}
      {/* ============================================================ */}
      <section className="py-14 px-4 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Contact details — kila item centered */}
        <div className="space-y-6 text-center">
          <div className="flex flex-col items-center text-center gap-2">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E8A33D"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                {t("contact_email_label")}
              </p>
              <p className="text-gray-600 text-sm">
                support@sokomkononi.co.tz
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-2">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E8A33D"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.8 2.1Z" />
            </svg>
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                {t("contact_phone_label")}
              </p>
              <p className="text-gray-600 text-sm">+255 743 895 038</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-2">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E8A33D"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                {t("contact_office_label")}
              </p>
              <p className="text-gray-600 text-sm">Dar es Salaam, Tanzania</p>
            </div>
          </div>
        </div>

        {/* Contact form — centered */}
        <div>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A33D] focus:border-transparent transition-colors text-center"
                placeholder={t("contact_name_placeholder")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                required
                type="email"
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A33D] focus:border-transparent transition-colors text-center"
                placeholder={t("contact_email_placeholder")}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <textarea
                required
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A33D] focus:border-transparent transition-colors resize-none text-center"
                placeholder={t("contact_message_placeholder")}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <button className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] font-semibold py-2.5 rounded-md text-sm transition-colors">
                {t("contact_submit")}
              </button>
            </form>
          ) : (
            <div className="bg-[#F5F3EC] rounded-xl p-6 text-center">
              <p className="font-semibold text-gray-800">
                {t("contact_success_heading")}
              </p>
              <p className="text-gray-600 text-sm mt-2">
                {t("contact_success_subtext")}
              </p>
            </div>
          )}
        </div>
      </section>

      <BottomNav />
      <Footer selectedLang={lang} />
    </div>
  );
}

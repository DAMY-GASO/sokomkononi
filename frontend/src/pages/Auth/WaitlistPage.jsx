import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function WaitlistPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError(t("waitlist_error_email"));
      return;
    }
    setError("");
    // TODO: unganisha na backend halisi ya waitlist, mfano:
    // await apiPost("/waitlist/join", { email });
    setSubmitted(true);
  }

  return (
    <div className="max-w-sm mx-auto mt-16 px-5 text-center">
      <div className="flex items-center justify-center gap-3 mb-8">
        <a
          href="#"
          className="flex items-center gap-2.5 bg-night border border-ink-muted/30 rounded-xl px-4 py-2.5 hover:border-gold/50 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" aria-hidden="true">
            <path d="M4.5 3.5c-.3.3-.5.7-.5 1.2v14.6c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L4.6 3.4l-.1.1z" fill="#00D2FF" />
            <path d="M15.9 15L13 12.1v-.2l2.9-2.9 6.5 3.7c.8.5.8 1.3 0 1.8l-6.5 3.7z" fill="#FFCE00" />
            <path d="M15.9 15L13 12l-8.4 8.5c.4.4 1 .4 1.7.1L15.9 15" fill="#FF3A44" />
            <path d="M15.9 9.1L6.3 3.6c-.7-.4-1.3-.3-1.7.1L13 12l2.9-2.9z" fill="#00F076" />
          </svg>
          <span className="text-left leading-tight">
            <span className="block text-[9px] text-white/60">
              {t("waitlist_get_it_on") || "GET IT ON"}
            </span>
            <span className="block text-sm font-semibold text-white">Google Play</span>
          </span>
        </a>

        <a
          href="#"
          className="flex items-center gap-2.5 bg-night border border-ink-muted/30 rounded-xl px-4 py-2.5 hover:border-gold/50 transition-colors"
        >
          <svg viewBox="0 0 384 512" className="w-6 h-6 shrink-0 fill-white" aria-hidden="true">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.3c0 26.2 4.8 53.3 14.4 81.3 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.8zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
          </svg>
          <span className="text-left leading-tight">
            <span className="block text-[9px] text-white/60">
              {t("waitlist_download_on") || "DOWNLOAD ON THE"}
            </span>
            <span className="block text-sm font-semibold text-white">App Store</span>
          </span>
        </a>
      </div>

      {!submitted ? (
        <>
          <h1 className="text-2xl font-bold text-ink-primary mb-2">{t("waitlist_heading")}</h1>
          <p className="text-ink-secondary text-sm mb-6">{t("waitlist_subtext")}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
              placeholder={t("waitlist_email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-rust text-sm">{error}</p>}
            <button className="w-full bg-gold hover:bg-gold-dark text-night py-2.5 rounded-md font-semibold text-sm">
              {t("waitlist_submit")}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-ink-primary mb-2">{t("waitlist_success_heading")}</h1>
          <p className="text-ink-secondary text-sm">{t("waitlist_success_subtext")}</p>
        </>
      )}

      <Link to="/" className="block mt-6 text-market text-sm font-semibold">
        {t("waitlist_back_home")}
      </Link>
    </div>
  );
}

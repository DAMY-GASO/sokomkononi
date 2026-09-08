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
      <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">📱</span>
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

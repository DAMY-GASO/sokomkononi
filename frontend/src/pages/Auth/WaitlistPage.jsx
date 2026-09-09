import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";

function SkylineDecoration() {
  return (
    <svg viewBox="0 0 400 200" className="absolute bottom-0 left-0 w-full h-40 opacity-[0.18]" preserveAspectRatio="none">
      <rect x="0" y="120" width="46" height="80" fill="#E8A33D" />
      <rect x="52" y="80" width="34" height="120" fill="#E8A33D" />
      <rect x="92" y="140" width="52" height="60" fill="#E8A33D" />
      <polygon points="150,100 178,60 206,100" fill="#E8A33D" />
      <rect x="150" y="100" width="56" height="100" fill="#E8A33D" />
      <rect x="214" y="70" width="30" height="130" fill="#E8A33D" />
      <rect x="250" y="130" width="60" height="70" fill="#E8A33D" />
      <rect x="316" y="95" width="40" height="105" fill="#E8A33D" />
      <rect x="362" y="150" width="38" height="50" fill="#E8A33D" />
    </svg>
  );
}

export default function WaitlistPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError(t("waitlist_error_email"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      // TODO: unganisha na backend halisi ya waitlist
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch (err) {
      setError(t("waitlist_error_default") || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 md:bg-white flex items-center justify-center p-4 sm:p-6 md:p-0">
      <div className="w-full max-w-md md:max-w-none my-8 md:my-0 bg-white rounded-2xl md:rounded-none shadow-xl md:shadow-none overflow-hidden grid grid-cols-1 md:grid-cols-2 md:min-h-screen">
        
        {/* ================= LEFT PANEL - Branded ================= */}
        <div className="flex relative bg-[#101A2E] text-white flex-col justify-between p-8 md:p-10 lg:p-14 overflow-hidden">
          <Link to="/" className="flex items-center justify-center gap-2 relative z-10 w-full">
            <span className="w-7 h-7 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">S</span>
            <span className="font-bold tracking-tight">SokoMkononi</span>
          </Link>

          <div className="relative z-10 max-w-sm mx-auto text-center py-8 md:py-0">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
              {t("waitlist_panel_heading") || "App Inakuja Hivi Karibuni"}
            </h2>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">
              {t("waitlist_panel_subtext") || "Jiunge na waitlist yetu ili uwe wa kwanza kujua app ya SokoMkononi itakapopatikana."}
            </p>

            <div className="flex items-center justify-center gap-6 mt-8">
              <div>
                <p className="text-xl font-bold text-[#E8A33D]">5,000+</p>
                <p className="text-white/40 text-xs">{t("stats_sellers")}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-xl font-bold text-[#E8A33D]">10,000+</p>
                <p className="text-white/40 text-xs">{t("stats_properties")}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-xl font-bold text-[#E8A33D]">2,500+</p>
                <p className="text-white/40 text-xs">{t("stats_deals")}</p>
              </div>
            </div>

            {/* App Download Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <Link to="#" className="flex items-center gap-2 border border-white/20 rounded-md px-3 py-1.5 hover:bg-white/5 transition-colors">
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                  <path d="M4.5 3.5c-.3.3-.5.7-.5 1.2v14.6c0 .5.2.9.5 1.2l.1.1L13 12.1v-.2L4.6 3.4l-.1.1z" fill="#00D2FF" />
                  <path d="M15.9 15L13 12.1v-.2l2.9-2.9 6.5 3.7c.8.5.8 1.3 0 1.8l-6.5 3.7z" fill="#FFCE00" />
                  <path d="M15.9 15L13 12l-8.4 8.5c.4.4 1 .4 1.7.1L15.9 15" fill="#FF3A44" />
                  <path d="M15.9 9.1L6.3 3.6c-.7-.4-1.3-.3-1.7.1L13 12l2.9-2.9z" fill="#00F076" />
                </svg>
                <span className="text-xs text-left leading-tight">
                  <span className="block text-white/50 text-[8px]">{t("badge_get_it_on")}</span>
                  <span className="block font-semibold text-white text-[10px]">{t("badge_google_play")}</span>
                </span>
              </Link>
              <Link to="#" className="flex items-center gap-2 border border-white/20 rounded-md px-3 py-1.5 hover:bg-white/5 transition-colors">
                <svg viewBox="0 0 384 512" className="w-4 h-4 shrink-0 fill-white" aria-hidden="true">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.3c0 26.2 4.8 53.3 14.4 81.3 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.8zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
                <span className="text-xs text-left leading-tight">
                  <span className="block text-white/50 text-[8px]">{t("badge_download_on")}</span>
                  <span className="block font-semibold text-white text-[10px]">{t("badge_app_store")}</span>
                </span>
              </Link>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/10 pt-6 max-w-sm mx-auto text-center">
            <p className="text-white/70 text-sm italic leading-relaxed">"{t("testimonial1_quote")}"</p>
            <p className="text-[#E8A33D] text-xs font-semibold mt-2">{t("testimonial1_name")}</p>
          </div>

          <SkylineDecoration />
        </div>

        {/* ================= RIGHT PANEL - Form ================= */}
        <div className="flex items-center justify-center px-5 sm:px-10 py-10 md:py-12 bg-white">
          <div className="w-full max-w-sm">
            {!submitted ? (
              <>
                <div className="w-14 h-14 rounded-full bg-[#E8A33D]/15 flex items-center justify-center mb-5 mx-auto">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="7" y="2" width="10" height="20" rx="2" />
                    <path d="M11 18h2" />
                  </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">
                  {t("waitlist_form_heading") || "Jiunge na Waitlist"}
                </h1>
                <p className="text-gray-500 text-sm mb-7 text-center">
                  {t("waitlist_form_subtext") || "Weka barua pepe yako ili upate taarifa za app."}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      {t("waitlist_email_placeholder") || "Barua pepe yako"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <path d="m3 7 9 6 9-6" />
                        </svg>
                      </span>
                      <input
                        type="email"
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
                        placeholder="hello@sokomkononi.co.tz"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && <p className="text-[#C1502E] text-sm">{error}</p>}

                  <button
                    disabled={loading}
                    className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? t("waitlist_submitting") || "Inajiunga..." : t("waitlist_submit") || "Jiunge"}
                  </button>
                </form>

                <p className="mt-6 text-sm text-gray-500 text-center">
                  <Link to="/" className="text-[#2F6D4F] font-semibold hover:underline">
                    {t("waitlist_back_home") || "← Rudi Nyumbani"}
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-[#2F6D4F]/15 flex items-center justify-center mb-5 mx-auto">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2F6D4F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">
                  {t("waitlist_success_heading") || "Umejiunga!"}
                </h1>
                <p className="text-gray-500 text-sm mb-7 text-center">
                  {t("waitlist_success_subtext") || "Tutakutumia ujumbe pindi app itakapokuwa tayari kupakuliwa."}
                </p>

                <Link
                  to="/"
                  className="w-full block text-center bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-sm transition-colors"
                >
                  {t("waitlist_back_home") || "← Rudi Nyumbani"}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

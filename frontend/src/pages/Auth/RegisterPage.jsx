import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

const icons = {
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  ),
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  phone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.8 2.1Z" />
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  ),
};

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

function FieldInput({ icon, type = "text", value, onChange, label, inputMode, required }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
        <input
          type={isPassword && showPassword ? "text" : type}
          inputMode={inputMode}
          required={required}
          className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
          value={value}
          onChange={onChange}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? icons.eye : icons.eyeOff}
          </button>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { sendOtp, verifyOtp, register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const intent = searchParams.get("intent");

  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ============================================
  // MAANDISHI YA UPANDE WA KUSHOTO (LEFT PANEL) - SASA YANATUMIA t()
  // ============================================
  function leftHeading() {
    if (intent === "buy") return t("register_panel_heading_buy");
    if (intent === "sell") return t("register_panel_heading_sell");
    return t("register_panel_heading_default");
  }

  function leftSubtext() {
    if (intent === "buy") return t("register_panel_subtext_buy");
    if (intent === "sell") return t("register_panel_subtext_sell");
    return t("register_panel_subtext_default");
  }

  // ============================================
  // MAANDISHI YA UPANDE WA KULIA (RIGHT PANEL - FORM) - SASA YANATUMIA t()
  // ============================================
  function formHeading() {
    if (intent === "buy") return t("register_form_heading_buy");
    if (intent === "sell") return t("register_form_heading_sell");
    return t("register_form_heading_default");
  }

  function formSubtext() {
    if (intent === "buy") return t("register_form_subtext_buy");
    if (intent === "sell") return t("register_form_subtext_sell");
    return t("register_form_subtext_default");
  }

  function validateForm() {
    if (!form.name.trim()) return t("register_error_name_required");
    if (!form.email.trim()) return t("register_error_email_required");
    if (!form.phone.trim()) return t("register_error_phone_required");
    if (!form.password || form.password.length < 6) return t("register_error_password_short");
    if (form.confirmPassword !== form.password) return t("register_error_password_mismatch");
    if (!agreedToTerms) return t("register_error_terms_required");
    return "";
  }

  async function handleSendOtp(e) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendOtp(form.email);
      setStep("otp");
      startResendCooldown();
    } catch (err) {
      setError(err?.response?.data?.message || t("register_error_default"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      setError(t("register_error_otp_required"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyOtp(form.email, otp.trim());
      const { confirmPassword, ...payload } = form;
      await register({ ...payload, intent: intent || null });

      // ============================================================
      // IMEBADILISHWA: kila mtumiaji mpya anapelekwa kwenye
      // /dashboard/post ("Weka Mali Yako") — sio /dashboard (My Listings)
      // ============================================================
      navigate("/dashboard/post");
    } catch (err) {
      setError(err?.response?.data?.message || t("register_error_otp_invalid"));
    } finally {
      setLoading(false);
    }
  }

  function startResendCooldown() {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await sendOtp(form.email);
      startResendCooldown();
    } catch (err) {
      setError(err?.response?.data?.message || t("register_error_default"));
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
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">{leftHeading()}</h2>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">{leftSubtext()}</p>

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
          <div className="w-full max-w-sm animate-[fadeIn_0.4s_ease-out]">
            {step === "form" && (
              <>
                <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">{formHeading()}</h1>
                <p className="text-gray-500 text-sm mb-7 text-center">{formSubtext()}</p>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <FieldInput
                    icon={icons.user}
                    label={t("register_name_placeholder")}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <FieldInput
                    icon={icons.mail}
                    type="email"
                    required
                    label={t("register_email_placeholder")}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <FieldInput
                    icon={icons.phone}
                    type="tel"
                    label={t("register_phone_placeholder")}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <FieldInput
                    icon={icons.lock}
                    type="password"
                    label={t("register_password_placeholder")}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <FieldInput
                    icon={icons.lock}
                    type="password"
                    label={t("register_confirm_password_placeholder")}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  />

                  <label className="flex items-start gap-2.5 text-xs text-gray-500 leading-relaxed cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#E8A33D] focus:ring-[#E8A33D]/30 shrink-0"
                    />
                    <span>
                      {t("auth_legal_prefix")}{" "}
                      <Link to="/sheria" className="underline hover:text-gray-700">{t("footer_terms")}</Link>{" "}
                      {t("auth_legal_and")}{" "}
                      <Link to="/faragha" className="underline hover:text-gray-700">{t("footer_privacy")}</Link>
                    </span>
                  </label>

                  {error && <p className="text-[#C1502E] text-sm">{error}</p>}

                  <button
                    disabled={loading || !agreedToTerms}
                    className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? t("register_sending_otp") : t("register_continue")}
                  </button>
                </form>

                <p className="mt-6 text-sm text-gray-500 text-center">
                  {t("register_have_account")}{" "}
                  <Link to="/login" className="text-[#2F6D4F] font-semibold hover:underline">
                    {t("register_login_link")}
                  </Link>
                </p>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="w-12 h-12 rounded-full bg-[#E8A33D]/15 flex items-center justify-center mb-5 mx-auto">
                  <span className="text-[#E8A33D]">{icons.mail}</span>
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">{t("register_otp_heading")}</h1>
                <p className="text-gray-500 text-sm mb-7 text-center">
                  {t("register_otp_subtext")} <span className="font-semibold text-gray-800">{form.email}</span>
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 text-lg tracking-[0.5em] text-center font-semibold focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  />

                  {error && <p className="text-[#C1502E] text-sm">{error}</p>}

                  <button
                    disabled={loading}
                    className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
                  >
                    {loading ? t("register_verifying") : t("register_verify_submit")}
                  </button>
                </form>

                <div className="mt-6 text-sm text-gray-500 text-center space-y-2">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-[#2F6D4F] font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0
                      ? `${t("register_resend_otp")} (${resendCooldown}s)`
                      : t("register_resend_otp")}
                  </button>
                  <div>
                    <button
                      onClick={() => { setStep("form"); setOtp(""); setError(""); }}
                      className="text-gray-500 underline"
                    >
                      {t("register_change_email")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

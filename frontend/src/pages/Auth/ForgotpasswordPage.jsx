import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

const icons = {
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  check: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
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

function FieldInput({ icon, type = "text", value, onChange, label }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
        <input
          type={type}
          className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  // NOTE: assumes useAuth() exposes requestPasswordReset({ email, newPassword })
  // — which validates the email, stashes the new password pending confirmation,
  // and emails an OTP to confirm it — and confirmPasswordReset(email, otp),
  // which finalizes the change. Adjust names if yours differ.
  const { requestPasswordReset, confirmPasswordReset } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState("form"); // "form" | "otp" | "success"
  const [form, setForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  function validateForm() {
    if (!form.email.trim()) return t("forgot_error_email_required");
    if (!form.newPassword || form.newPassword.length < 6) return t("forgot_error_password_short");
    if (form.confirmPassword !== form.newPassword) return t("forgot_error_password_mismatch");
    return "";
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

  async function handleSubmitNewPassword(e) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Nenosiri jipya linahifadhiwa kwa muda upande wa server, na taarifa
      // (OTP) inatumwa kwenye email ili kuthibitisha kuwa ni mmiliki wa akaunti.
      await requestPasswordReset({ email: form.email, newPassword: form.newPassword });
      setStep("otp");
      startResendCooldown();
    } catch (err) {
      setError(err?.response?.data?.message || t("forgot_error_default"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      setError(t("forgot_error_otp_required"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await confirmPasswordReset(form.email, otp.trim());
      setStep("success");
    } catch (err) {
      setError(err?.response?.data?.message || t("forgot_error_otp_invalid"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset({ email: form.email, newPassword: form.newPassword });
      startResendCooldown();
    } catch (err) {
      setError(err?.response?.data?.message || t("forgot_error_default"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 md:bg-white flex items-center justify-center p-4 sm:p-6 md:p-0">
      <div className="w-full max-w-md md:max-w-none my-8 md:my-0 bg-white rounded-2xl md:rounded-none shadow-xl md:shadow-none overflow-hidden grid grid-cols-1 md:grid-cols-2 md:min-h-screen">
        {/* ================= TOP/LEFT — Branded panel ================= */}
        <div className="flex relative bg-[#101A2E] text-white flex-col justify-between p-8 md:p-10 lg:p-14 overflow-hidden">
          <Link to="/" className="flex items-center justify-center gap-2 relative z-10 w-full">
            <span className="w-7 h-7 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">S</span>
            <span className="font-bold tracking-tight">SokoMkononi</span>
          </Link>

          <div className="relative z-10 max-w-sm mx-auto text-center py-8 md:py-0">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">{t("forgot_panel_heading")}</h2>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">{t("forgot_panel_subtext")}</p>
          </div>

          <div className="relative z-10 hidden md:block" />

          <SkylineDecoration />
        </div>

        {/* ================= BOTTOM/RIGHT — Form panel ================= */}
        <div className="flex items-center justify-center px-5 sm:px-10 py-10 md:py-12 bg-white">
          <div className="w-full max-w-sm animate-[fadeIn_0.4s_ease-out]">
            {step === "form" && (
              <>
                <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">{t("forgot_heading")}</h1>
                <p className="text-gray-500 text-sm mb-7 text-center">{t("forgot_subtext")}</p>

                <form onSubmit={handleSubmitNewPassword} className="space-y-4">
                  <FieldInput
                    icon={icons.mail}
                    type="email"
                    label={t("forgot_email_placeholder")}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <FieldInput
                    icon={icons.lock}
                    type="password"
                    label={t("forgot_new_password_placeholder")}
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  />
                  <FieldInput
                    icon={icons.lock}
                    type="password"
                    label={t("forgot_confirm_password_placeholder")}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  />

                  {error && <p className="text-[#C1502E] text-sm">{error}</p>}

                  <button
                    disabled={loading}
                    className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
                  >
                    {loading ? t("forgot_sending_otp") : t("forgot_continue")}
                  </button>
                </form>

                <p className="mt-6 text-sm text-gray-500 text-center">
                  <Link to="/login" className="text-[#2F6D4F] font-semibold hover:underline">
                    {t("forgot_back_to_login")}
                  </Link>
                </p>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="w-12 h-12 rounded-full bg-[#E8A33D]/15 flex items-center justify-center mb-5 mx-auto">
                  <span className="text-[#E8A33D]">{icons.mail}</span>
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">{t("forgot_otp_heading")}</h1>
                <p className="text-gray-500 text-sm mb-7 text-center">
                  {t("forgot_otp_subtext")} <span className="font-semibold text-gray-800">{form.email}</span>
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
                    {loading ? t("forgot_verifying") : t("forgot_verify_submit")}
                  </button>
                </form>

                <div className="mt-6 text-sm text-gray-500 text-center space-y-2">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-[#2F6D4F] font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0
                      ? `${t("forgot_resend_otp")} (${resendCooldown}s)`
                      : t("forgot_resend_otp")}
                  </button>
                  <div>
                    <button
                      onClick={() => { setStep("form"); setOtp(""); setError(""); }}
                      className="text-gray-500 underline"
                    >
                      {t("forgot_change_email")}
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === "success" && (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#2F6D4F]/10 flex items-center justify-center mb-5 mx-auto text-[#2F6D4F]">
                  {icons.check}
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("forgot_success_heading")}</h1>
                <p className="text-gray-500 text-sm mb-7 leading-relaxed">{t("forgot_success_subtext")}</p>

                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-sm transition-colors"
                >
                  {t("forgot_go_to_login")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

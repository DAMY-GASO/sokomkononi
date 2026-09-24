import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  forgotPasswordAsync,
  verifyPasswordResetOtpAsync,
  resetPasswordAsync,
} from "../../config/authStore.js";
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
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1" />
      <path d="M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7c1.9 0 3.6-.6 5-1.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
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
  const { lang } = useLanguage();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;

  const toggleLabel =
    lang === "sw"
      ? show ? "Ficha nenosiri" : "Onyesha nenosiri"
      : show ? "Hide password" : "Show password";

  return (
    <div>
      <label className="block text-body-sm font-semibold text-secondary mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">{icon}</span>
        <input
          type={inputType}
          className={`w-full border border-gray-300 rounded-lg pl-10 ${
            isPassword ? "pr-11" : "pr-3"
          } py-2.5 focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors`}
          value={value}
          onChange={onChange}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={toggleLabel}
            title={toggleLabel}
            aria-pressed={show}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted hover:text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D]/40 transition-colors"
          >
            {show ? icons.eyeOff : icons.eye}
          </button>
        )}
      </div>
    </div>
  );
}

function extractError(err, fallback) {
  if (err?.data && typeof err.data === "object") {
    if (err.data.detail) return err.data.detail;
    const first = Object.values(err.data).flat().find((v) => typeof v === "string");
    if (first) return first;
  }
  return err?.message || fallback;
}

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [resetToken, setResetToken] = useState(null);

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

    const res = await forgotPasswordAsync(form.email);
    setLoading(false);

    if (!res.ok) {
      setError(extractError(res.error, t("forgot_error_default")));
      return;
    }

    setStep("otp");
    startResendCooldown();
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      setError(t("forgot_error_otp_required"));
      return;
    }
    setError("");
    setLoading(true);

    const verifyRes = await verifyPasswordResetOtpAsync({
      identifier: form.email,
      otpCode: otp.trim(),
      verificationType: "EMAIL",
    });

    if (!verifyRes.ok) {
      setLoading(false);
      setError(extractError(verifyRes.error, t("forgot_error_otp_invalid")));
      return;
    }

    const token =
      verifyRes.data?.reset_token ||
      verifyRes.data?.token ||
      verifyRes.data?.data?.reset_token;

    if (!token) {
      setLoading(false);
      setError(
        t("forgot_error_token_missing") ||
        "Imeshindwa kupata token ya kubadilisha nenosiri. Jaribu tena."
      );
      return;
    }

    const resetRes = await resetPasswordAsync({
      resetToken: token,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    });

    setLoading(false);

    if (!resetRes.ok) {
      setError(extractError(resetRes.error, t("forgot_error_default")));
      return;
    }

    setStep("success");
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);

    const res = await forgotPasswordAsync(form.email);
    setLoading(false);

    if (!res.ok) {
      setError(extractError(res.error, t("forgot_error_default")));
      return;
    }
    startResendCooldown();
  }

  return (
    <div className="min-h-screen bg-gray-100 md:bg-white flex items-center justify-center p-4 sm:p-6 md:p-0">
      <div className="w-full max-w-md md:max-w-none my-8 md:my-0 bg-white rounded-2xl md:rounded-none shadow-xl md:shadow-none overflow-hidden grid grid-cols-1 md:grid-cols-2 md:min-h-screen">
        {/* ================= TOP/LEFT — Branded panel ================= */}
        <div className="dark-surface flex relative bg-[#101A2E] text-white flex-col justify-between p-8 md:p-10 lg:p-14 overflow-hidden">
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
                <h1 className="h-title mb-1 text-center">{t("forgot_heading")}</h1>
                <p className="text-secondary text-body-sm mb-7 text-center">{t("forgot_subtext")}</p>

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

                  {error && <p className="text-[#C1502E] text-body-sm">{error}</p>}

                  <button
                    disabled={loading}
                    className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-btn transition-colors disabled:opacity-60"
                  >
                    {loading ? t("forgot_sending_otp") : t("forgot_continue")}
                  </button>
                </form>

                <p className="mt-6 text-body-sm text-secondary text-center">
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

                <h1 className="h-title mb-1 text-center">{t("forgot_otp_heading")}</h1>
                <p className="text-secondary text-body-sm mb-7 text-center">
                  {t("forgot_otp_subtext")} <span className="font-semibold text-primary">{form.email}</span>
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

                  {error && <p className="text-[#C1502E] text-body-sm">{error}</p>}

                  <button
                    disabled={loading}
                    className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-btn transition-colors disabled:opacity-60"
                  >
                    {loading ? t("forgot_verifying") : t("forgot_verify_submit")}
                  </button>
                </form>

                <div className="mt-6 text-body-sm text-secondary text-center space-y-2">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-[#2F6D4F] font-semibold disabled:text-muted disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0
                      ? `${t("forgot_resend_otp")} (${resendCooldown}s)`
                      : t("forgot_resend_otp")}
                  </button>
                  <div>
                    <button
                      onClick={() => { setStep("form"); setOtp(""); setError(""); }}
                      className="text-secondary underline"
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

                <h1 className="h-title mb-1">{t("forgot_success_heading")}</h1>
                <p className="text-secondary text-body-sm mb-7 leading-relaxed">{t("forgot_success_subtext")}</p>

                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-btn transition-colors"
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

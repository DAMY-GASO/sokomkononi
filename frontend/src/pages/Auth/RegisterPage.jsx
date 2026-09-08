import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function RegisterPage() {
  // NOTE: assumes useAuth() exposes sendOtp(email) and verifyOtp(email, otp)
  // in addition to the existing register(form). Adjust names if yours differ.
  const { sendOtp, verifyOtp, register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState("form"); // "form" | "otp"
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  function validateForm() {
    if (!form.name.trim()) return t("register_error_name_required");
    if (!form.email.trim()) return t("register_error_email_required");
    if (!form.phone.trim()) return t("register_error_phone_required");
    if (!form.password || form.password.length < 6) return t("register_error_password_short");
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
      await register(form);
      navigate("/dashboard");
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
    <div className="max-w-sm mx-auto mt-16 px-5">
      <h1 className="text-2xl font-bold text-ink-primary mb-6">
        {step === "form" ? t("register_heading") : t("register_otp_heading")}
      </h1>

      {step === "form" && (
        <>
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input
              className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
              placeholder={t("register_name_placeholder")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email"
              className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
              placeholder={t("register_email_placeholder")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
              placeholder={t("register_phone_placeholder")}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              type="password"
              className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
              placeholder={t("register_password_placeholder")}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {error && <p className="text-rust text-sm">{error}</p>}
            <button
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-dark text-night py-2.5 rounded-md font-semibold text-sm disabled:opacity-60"
            >
              {loading ? t("register_sending_otp") : t("register_continue")}
            </button>
          </form>
          <p className="mt-4 text-sm text-ink-secondary text-center">
            {t("register_have_account")}{" "}
            <Link to="/login" className="text-market font-semibold">{t("register_login_link")}</Link>
          </p>
        </>
      )}

      {step === "otp" && (
        <>
          <p className="text-sm text-ink-secondary mb-4">
            {t("register_otp_subtext")} <span className="font-semibold text-ink-primary">{form.email}</span>
          </p>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              inputMode="numeric"
              maxLength={6}
              className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm tracking-[0.3em] text-center font-semibold"
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
            {error && <p className="text-rust text-sm">{error}</p>}
            <button
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-dark text-night py-2.5 rounded-md font-semibold text-sm disabled:opacity-60"
            >
              {loading ? t("register_verifying") : t("register_verify_submit")}
            </button>
          </form>
          <div className="mt-4 text-sm text-ink-secondary text-center space-y-2">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-market font-semibold disabled:text-ink-muted disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `${t("register_resend_otp")} (${resendCooldown}s)`
                : t("register_resend_otp")}
            </button>
            <div>
              <button
                onClick={() => { setStep("form"); setOtp(""); setError(""); }}
                className="text-ink-secondary underline"
              >
                {t("register_change_email")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

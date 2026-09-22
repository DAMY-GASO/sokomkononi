import React, { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { loginAsync } from "../../config/authStore.js";
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
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

export default function LoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.identifier.trim() || !form.password) {
      setError(t("login_error_required") || "Tafadhali jaza sehemu zote.");
      return;
    }

    setError("");
    setLoading(true);

    const res = await loginAsync(form);
    setLoading(false);

    if (!res.ok) {
      const err = res.error;
      const firstFieldError =
        err?.data && typeof err.data === "object" && !err.data.detail
          ? Object.values(err.data).flat().find((v) => typeof v === "string")
          : null;

      setError(
        err?.data?.detail ||
          firstFieldError ||
          err?.message ||
          t("login_error_default") ||
          "Barua pepe/nenosiri si sahihi."
      );
      return;
    }

    const { from, ...restState } = location.state || {};
    const redirectTo = from || searchParams.get("redirect") || "/dashboard/post";

    navigate(redirectTo, {
      replace: true,
      state: Object.keys(restState).length > 0 ? restState : undefined,
    });
  }

  const trustPoints = [
    t("login_trust1"),
    t("login_trust2"),
    t("login_trust3"),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-100 md:bg-white flex items-center justify-center p-4 sm:p-6 md:p-0">
      <div className="w-full max-w-md md:max-w-none my-8 md:my-0 bg-white rounded-2xl md:rounded-none shadow-xl md:shadow-none overflow-hidden grid grid-cols-1 md:grid-cols-2 md:min-h-screen">
        {/* ================= LEFT PANEL - Branded ================= */}
        <div className="dark-surface flex relative bg-[#101A2E] text-white flex-col justify-between p-8 md:p-10 lg:p-14 overflow-hidden">
          <Link to="/" className="flex items-center justify-center gap-2 relative z-10 w-full">
            <span className="w-7 h-7 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">S</span>
            <span className="font-bold tracking-tight">SokoMkononi</span>
          </Link>

          <div className="relative z-10 max-w-sm mx-auto text-center py-8 md:py-0">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
              {t("login_panel_heading")}
            </h2>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">
              {t("login_panel_subtext")}
            </p>

            {trustPoints.length > 0 && (
              <ul className="mt-8 space-y-3 inline-flex flex-col items-start mx-auto">
                {trustPoints.map((point, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-white/80">
                    {icons.check}
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative z-10 hidden md:block" />

          <SkylineDecoration />
        </div>

        {/* ================= RIGHT PANEL - Form ================= */}
        <div className="flex items-center justify-center px-5 sm:px-10 py-10 md:py-12 bg-white">
          <div className="w-full max-w-sm">
            <h1 className="h-title mb-1 text-center">
              {t("login_heading")}
            </h1>
            <p className="text-secondary text-body-sm mb-7 text-center">
              {t("login_subtext")}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-body-sm font-semibold text-secondary mb-1.5">
                  {t("login_identifier_placeholder")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                    {icons.mail}
                  </span>
                  <input
                    type="text"
                    autoComplete="username"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
                    value={form.identifier}
                    onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-body-sm font-semibold text-secondary mb-1.5">
                  {t("login_password_placeholder")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                    {icons.lock}
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? icons.eye : icons.eyeOff}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-[#2F6D4F] text-body-sm font-semibold hover:underline"
                >
                  {t("login_forgot_password")}
                </Link>
              </div>

              {error && <p className="text-[#C1502E] text-body-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-btn transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? t("login_submitting") : t("login_submit")}
              </button>
            </form>

            <p className="mt-6 text-body-sm text-secondary text-center">
              {t("login_no_account")}{" "}
              <Link
                to="/register"
                className="text-[#2F6D4F] font-semibold hover:underline"
              >
                {t("login_register_link")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

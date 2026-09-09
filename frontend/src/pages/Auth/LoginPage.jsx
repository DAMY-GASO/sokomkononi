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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.identifier.trim() || !form.password) {
      setError(t("login_error_required"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || t("login_error_default"));
    } finally {
      setLoading(false);
    }
  }

  const trustPoints = [t("login_trust1"), t("login_trust2"), t("login_trust3")];

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* ================= LEFT — Branded panel (desktop only) ================= */}
      <div className="hidden md:flex relative bg-[#101A2E] text-white flex-col justify-between p-10 lg:p-14 overflow-hidden">
        <Link to="/" className="inline-flex items-center gap-2 relative z-10 w-fit">
          <span className="w-7 h-7 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">S</span>
          <span className="font-bold tracking-tight">SokoMkononi</span>
        </Link>

        <div className="relative z-10 max-w-sm">
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight">{t("login_panel_heading")}</h2>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">{t("login_panel_subtext")}</p>

          <ul className="mt-8 space-y-3">
            {trustPoints.map((point, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-white/80">
                {icons.check}
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10" />

        <SkylineDecoration />
      </div>

      {/* ================= RIGHT — Form panel ================= */}
      <div className="flex items-center justify-center px-5 sm:px-10 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden inline-flex items-center gap-2 mb-10">
            <span className="w-7 h-7 rounded-md bg-[#E8A33D] flex items-center justify-center text-[#101A2E] font-bold text-sm">S</span>
            <span className="font-bold text-[#101A2E] tracking-tight">SokoMkononi</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">{t("login_heading")}</h1>
          <p className="text-gray-500 text-sm mb-7">{t("login_panel_subtext")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {t("login_identifier_placeholder")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icons.mail}</span>
                <input
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {t("login_password_placeholder")}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icons.lock}</span>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-colors"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-[#2F6D4F] text-xs font-semibold hover:underline">
                {t("login_forgot_password")}
              </Link>
            </div>

            {error && <p className="text-[#C1502E] text-sm">{error}</p>}

            <button
              disabled={loading}
              className="w-full bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E] py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {loading ? t("login_submitting") : t("login_submit")}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            {t("login_no_account")}{" "}
            <Link to="/register" className="text-[#2F6D4F] font-semibold hover:underline">
              {t("login_register_link")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

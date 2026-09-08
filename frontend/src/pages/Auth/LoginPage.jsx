import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({ emailOrPhone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
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

  return (
    <div className="max-w-sm mx-auto mt-16 px-5">
      <h1 className="text-2xl font-bold text-ink-primary mb-6">{t("login_heading")}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
          placeholder={t("login_emailphone_placeholder")}
          value={form.emailOrPhone}
          onChange={(e) => setForm({ ...form, emailOrPhone: e.target.value })}
        />
        <input
          type="password"
          className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
          placeholder={t("login_password_placeholder")}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="text-rust text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-dark text-night py-2.5 rounded-md font-semibold text-sm"
        >
          {loading ? t("login_submitting") : t("login_submit")}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink-secondary text-center">
        {t("login_no_account")}{" "}
        <Link to="/register" className="text-market font-semibold">{t("login_register_link")}</Link>
      </p>
    </div>
  );
}

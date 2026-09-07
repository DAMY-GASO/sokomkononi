import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Imeshindikana kujisajili");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 px-5">
      <h1 className="text-2xl font-bold text-ink-primary mb-6">Jisajili SokoMkononi</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
          placeholder="Jina kamili"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
          placeholder="Namba ya simu"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          type="password"
          className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="text-rust text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-dark text-night py-2.5 rounded-md font-semibold text-sm"
        >
          {loading ? "Inasajili..." : "Jisajili"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink-secondary text-center">
        Una akaunti tayari? <Link to="/login" className="text-market font-semibold">Ingia</Link>
      </p>
    </div>
  );
}

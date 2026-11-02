// src/pages/dashboard/components/SystemSettings/ContactInfoPanel.jsx
import React, { useState, useEffect } from "react";
import { Mail, Phone, MapPin, MessageCircle, Save, Check, Loader2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import {
  useContactInfo,
  saveContactInfoAsync,
} from "../../../../../config/systemSettingsStore.js";

export default function ContactInfoPanel() {
  const { lang } = useLanguage();
  const [contact] = useContactInfo();
  const [form, setForm] = useState(contact || { email: "", phone: "", whatsapp: "", address: "" });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (contact) setForm(contact);
  }, [contact]);

  const setField = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await saveContactInfoAsync(form);
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } else {
      setError(t("Imeshindwa kuhifadhi.", "Failed to save."));
    }
  };

  return (
    <div className="bg-card rounded-xl border border-hairline p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgb(var(--c-ink) / 0.08)" }}
        >
          <MessageCircle size={16} style={{ color: COLORS.ink }} />
        </div>
        <p className="text-sm font-semibold text-primary truncate">
          {t("Mawasiliano", "Contact Info")}
        </p>
      </div>

      {error && (
        <div
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.dangerText }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      <label className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-medium text-secondary flex items-center gap-1">
          <Mail size={12} className="shrink-0" /> {t("Barua Pepe", "Email")}
        </span>
        <input
          value={form.email}
          onChange={(e) => setField({ email: e.target.value })}
          placeholder="support@sokomkononi.co.tz"
          className="input min-w-0"
          type="email"
          disabled={saving}
        />
      </label>

      <label className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-medium text-secondary flex items-center gap-1">
          <Phone size={12} className="shrink-0" /> {t("Simu", "Phone")}
        </span>
        <input
          value={form.phone}
          onChange={(e) => setField({ phone: e.target.value })}
          placeholder="+255 743 895 038"
          className="input min-w-0"
          type="tel"
          disabled={saving}
        />
      </label>

      <label className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-medium text-secondary flex items-center gap-1">
          <MessageCircle size={12} className="shrink-0" /> WhatsApp
        </span>
        <input
          value={form.whatsapp}
          onChange={(e) => setField({ whatsapp: e.target.value })}
          placeholder="255743895038"
          className="input min-w-0"
          type="tel"
          disabled={saving}
        />
      </label>

      <label className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-medium text-secondary flex items-center gap-1">
          <MapPin size={12} className="shrink-0" /> {t("Anwani", "Address")}
        </span>
        <input
          value={form.address}
          onChange={(e) => setField({ address: e.target.value })}
          placeholder="Dar es Salaam, Tanzania"
          className="input min-w-0"
          disabled={saving}
        />
      </label>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          style={{
            background: dirty && !saving ? COLORS.gold : "rgb(var(--c-hairline))",
            color: dirty && !saving ? "rgb(var(--c-night))" : "var(--text-muted)",
          }}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-4 py-2 w-full sm:w-auto transition-colors disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? t("Inahifadhi...", "Saving...") : t("Hifadhi", "Save")}
        </button>
        {saved && (
          <span
            style={{ color: COLORS.successText }}
            className="text-xs font-semibold flex items-center gap-1"
          >
            <Check size={13} /> {t("Imehifadhiwa", "Saved")}
          </span>
        )}
      </div>
    </div>
  );
}
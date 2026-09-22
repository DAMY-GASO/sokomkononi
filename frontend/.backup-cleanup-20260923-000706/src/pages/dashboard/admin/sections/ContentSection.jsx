// ============================================================
// ContentSection.jsx
// Admin — Content Management (banners, testimonials, FAQs, About,
// Terms, Privacy, Help).
// Bilingual + mobile-responsive + Async actions na rollback.
// ============================================================

import React, { useState } from "react";
import {
  Image as ImageIcon,
  MessageSquareQuote,
  HelpCircle,
  Info,
  FileText,
  Shield,
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  Save,
  Check,
  Loader2,
} from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
// ⬇️ MABADILIKO: tumia async variants
import {
  useContent,
  addBannerAsync,
  updateBannerAsync,
  removeBannerAsync,
  addTestimonialAsync,
  updateTestimonialAsync,
  removeTestimonialAsync,
  addFaqAsync,
  updateFaqAsync,
  removeFaqAsync,
  updateAboutAsync,
  updateTermsAsync,
  updatePrivacyAsync,
  updateHelpAsync,
} from "../../../../config/contentStore.js";

// ============================================================
// TABS
// ============================================================
const TABS = [
  { key: "banners", label: { sw: "Banners", en: "Banners" }, icon: ImageIcon },
  { key: "testimonials", label: { sw: "Ushuhuda", en: "Testimonials" }, icon: MessageSquareQuote },
  { key: "faqs", label: { sw: "Maswali", en: "FAQs" }, icon: HelpCircle },
  { key: "about", label: { sw: "Kuhusu", en: "About" }, icon: Info },
  { key: "terms", label: { sw: "Vigezo", en: "Terms" }, icon: FileText },
  { key: "privacy", label: { sw: "Faragha", en: "Privacy" }, icon: Shield },
  { key: "help", label: { sw: "Msaada", en: "Help" }, icon: BookOpen },
];

// ============================================================
// BILINGUAL FIELD
// ============================================================
function BilingualField({ label, value, onChange, multiline = false, rows = 3, disabled = false }) {
  const swVal = value?.sw || "";
  const enVal = value?.en || "";
  const Input = multiline ? "textarea" : "input";

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <span className="text-[11px] font-semibold text-secondary break-words">
        {label}
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
        <div className="min-w-0 w-full">
          <span className="text-[10px] font-semibold text-muted uppercase">
            Kiswahili
          </span>
          <Input
            value={swVal}
            onChange={(e) => onChange({ ...value, sw: e.target.value })}
            rows={multiline ? rows : undefined}
            disabled={disabled}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] resize-none mt-1 disabled:opacity-50"
          />
        </div>
        <div className="min-w-0 w-full">
          <span className="text-[10px] font-semibold text-muted uppercase">
            English
          </span>
          <Input
            value={enVal}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            rows={multiline ? rows : undefined}
            disabled={disabled}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] resize-none mt-1 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FORM ACTIONS
// ============================================================
function FormActions({ onCancel, onSave, lang, saving = false, saveLabel = null }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  return (
    <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
      <button
        onClick={onCancel}
        disabled={saving}
        className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-secondary shrink-0 disabled:opacity-50"
      >
        {t("Ghairi", "Cancel")}
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="flex-1 min-w-0 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Save size={13} />
        )}
        {saveLabel || t("Hifadhi", "Save")}
      </button>
    </div>
  );
}

// ============================================================
// BANNERS TAB — async
// ============================================================
function BannersTab({ lang }) {
  const content = useContent();
  const banners = content.banners || [];
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [adding, setAdding] = useState(false);
  // ⬇️ MPYA: busy + error
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleAdd = () => {
    setForm({
      title: { sw: "", en: "" },
      subtitle: { sw: "", en: "" },
      ctaText: { sw: "", en: "" },
      ctaLink: "",
      active: true,
    });
    setAdding(true);
    setEditing(null);
    setError("");
  };

  const handleEdit = (banner) => {
    setForm({ ...banner });
    setEditing(banner.id);
    setAdding(false);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const res = adding
      ? await addBannerAsync(form)
      : await updateBannerAsync(editing, form);

    setSaving(false);

    if (res.ok) {
      setAdding(false);
      setEditing(null);
      setForm({});
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi banner.", "Failed to save banner.")
      );
    }
  };

  const handleCancel = () => {
    setAdding(false);
    setEditing(null);
    setForm({});
    setError("");
  };

  const handleRemove = async (id) => {
    if (!window.confirm(t("Ondoa banner?", "Remove banner?"))) return;

    setError("");
    const res = await removeBannerAsync(id);
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa banner.", "Failed to remove banner.")
      );
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={adding || !!editing}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={13} />
        {t("Banner Mpya", "New Banner")}
      </button>

      {(adding || editing) && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3 w-full min-w-0 overflow-hidden"
        >
          <BilingualField
            label={t("Kichwa", "Title")}
            value={form.title || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, title: v })}
            disabled={saving}
          />
          <BilingualField
            label={t("Maelezo", "Subtitle")}
            value={form.subtitle || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, subtitle: v })}
            multiline
            rows={2}
            disabled={saving}
          />
          <BilingualField
            label={t("Kitufe", "CTA Text")}
            value={form.ctaText || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, ctaText: v })}
            disabled={saving}
          />
          <label className="flex flex-col gap-1 w-full min-w-0">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Kiungo (URL)", "Link (URL)")}
            </span>
            <input
              value={form.ctaLink || ""}
              onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
              placeholder="/tafuta"
              disabled={saving}
              className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              disabled={saving}
              className="w-4 h-4 rounded text-[#E8A33D] shrink-0"
            />
            <span className="text-xs text-secondary">
              {t("Inaonekana HomePage", "Show on HomePage")}
            </span>
          </label>

          <FormActions
            onCancel={handleCancel}
            onSave={handleSave}
            lang={lang}
            saving={saving}
          />
        </div>
      )}

      {banners.map((banner) => (
        <div
          key={banner.id}
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3 sm:p-4 w-full min-w-0 overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 w-full min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  style={{
                    background: banner.active
                      ? "rgba(47,109,79,0.12)"
                      : "rgba(16,26,46,0.08)",
                    color: banner.active ? COLORS.green : COLORS.night,
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                >
                  {banner.active ? t("Hai", "Active") : t("Imezimwa", "Inactive")}
                </span>
              </div>
              <p className="text-sm font-semibold text-primary truncate w-full">
                {banner.title?.[lang] || banner.title?.sw}
              </p>
              <p className="text-xs text-secondary mt-0.5 line-clamp-2">
                {banner.subtitle?.[lang] || banner.subtitle?.sw}
              </p>
              <p className="text-[11px] text-muted mt-1 truncate w-full">
                CTA: {banner.ctaText?.[lang] || banner.ctaText?.sw} → {banner.ctaLink}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleEdit(banner)}
                disabled={saving}
                className="p-1.5 text-muted hover:text-[#E8A33D] disabled:opacity-50"
                aria-label={t("Hariri", "Edit")}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleRemove(banner.id)}
                disabled={saving}
                className="p-1.5 text-muted hover:text-[#C1502E] disabled:opacity-50"
                aria-label={t("Ondoa", "Remove")}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TESTIMONIALS TAB — async
// ============================================================
function TestimonialsTab({ lang }) {
  const content = useContent();
  const testimonials = content.testimonials || [];
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleAdd = () => {
    setForm({ name: "", quote: { sw: "", en: "" }, rating: 5, active: true });
    setAdding(true);
    setEditing(null);
    setError("");
  };

  const handleEdit = (item) => {
    setForm({ ...item });
    setEditing(item.id);
    setAdding(false);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const res = adding
      ? await addTestimonialAsync(form)
      : await updateTestimonialAsync(editing, form);

    setSaving(false);

    if (res.ok) {
      setAdding(false);
      setEditing(null);
      setForm({});
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi ushuhuda.", "Failed to save testimonial.")
      );
    }
  };

  const handleCancel = () => {
    setAdding(false);
    setEditing(null);
    setForm({});
    setError("");
  };

  const handleRemove = async (id) => {
    if (!window.confirm(t("Ondoa ushuhuda?", "Remove testimonial?"))) return;

    setError("");
    const res = await removeTestimonialAsync(id);
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa ushuhuda.", "Failed to remove testimonial.")
      );
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      {error && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={adding || !!editing}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={13} />
        {t("Ushuhuda Mpya", "New Testimonial")}
      </button>

      {(adding || editing) && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3 w-full min-w-0 overflow-hidden"
        >
          <label className="flex flex-col gap-1 w-full min-w-0">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Jina", "Name")}
            </span>
            <input
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mary, Dar es Salaam"
              disabled={saving}
              className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] disabled:opacity-50"
            />
          </label>
          <BilingualField
            label={t("Ushuhuda", "Quote")}
            value={form.quote || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, quote: v })}
            multiline
            rows={3}
            disabled={saving}
          />
          <FormActions
            onCancel={handleCancel}
            onSave={handleSave}
            lang={lang}
            saving={saving}
          />
        </div>
      )}

      {testimonials.map((item) => (
        <div
          key={item.id}
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3 sm:p-4 w-full min-w-0 overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 w-full min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary truncate w-full">
                {item.name}
              </p>
              <p className="text-xs text-secondary mt-1 leading-relaxed line-clamp-3 break-words">
                "{item.quote?.[lang] || item.quote?.sw}"
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleEdit(item)}
                disabled={saving}
                className="p-1.5 text-muted hover:text-[#E8A33D] disabled:opacity-50"
                aria-label={t("Hariri", "Edit")}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                disabled={saving}
                className="p-1.5 text-muted hover:text-[#C1502E] disabled:opacity-50"
                aria-label={t("Ondoa", "Remove")}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// FAQS TAB — async
// ============================================================
function FaqsTab({ lang }) {
  const content = useContent();
  const faqs = content.faqs || [];
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleAdd = () => {
    setForm({ question: { sw: "", en: "" }, answer: { sw: "", en: "" }, active: true });
    setAdding(true);
    setEditing(null);
    setError("");
  };

  const handleEdit = (faq) => {
    setForm({ ...faq });
    setEditing(faq.id);
    setAdding(false);
    setError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const res = adding
      ? await addFaqAsync(form)
      : await updateFaqAsync(editing, form);

    setSaving(false);

    if (res.ok) {
      setAdding(false);
      setEditing(null);
      setForm({});
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi swali.", "Failed to save FAQ.")
      );
    }
  };

  const handleCancel = () => {
    setAdding(false);
    setEditing(null);
    setForm({});
    setError("");
  };

  const handleRemove = async (id) => {
    if (!window.confirm(t("Ondoa swali?", "Remove FAQ?"))) return;

    setError("");
    const res = await removeFaqAsync(id);
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa swali.", "Failed to remove FAQ.")
      );
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      {error && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={adding || !!editing}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={13} />
        {t("Swali Jipya", "New FAQ")}
      </button>

      {(adding || editing) && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3 w-full min-w-0 overflow-hidden"
        >
          <BilingualField
            label={t("Swali", "Question")}
            value={form.question || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, question: v })}
            disabled={saving}
          />
          <BilingualField
            label={t("Jibu", "Answer")}
            value={form.answer || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, answer: v })}
            multiline
            rows={3}
            disabled={saving}
          />
          <FormActions
            onCancel={handleCancel}
            onSave={handleSave}
            lang={lang}
            saving={saving}
          />
        </div>
      )}

      {faqs.map((faq) => (
        <div
          key={faq.id}
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-3 sm:p-4 w-full min-w-0 overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 w-full min-w-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary break-words">
                {faq.question?.[lang] || faq.question?.sw}
              </p>
              <p className="text-xs text-secondary mt-1 leading-relaxed line-clamp-3 break-words">
                {faq.answer?.[lang] || faq.answer?.sw}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleEdit(faq)}
                disabled={saving}
                className="p-1.5 text-muted hover:text-[#E8A33D] disabled:opacity-50"
                aria-label={t("Hariri", "Edit")}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleRemove(faq.id)}
                disabled={saving}
                className="p-1.5 text-muted hover:text-[#C1502E] disabled:opacity-50"
                aria-label={t("Ondoa", "Remove")}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SINGLE-PAGE EDITORS — async
// ============================================================
function SinglePageEditor({ section, lang }) {
  const content = useContent();
  const data = content[section] || {};
  const [form, setForm] = useState({ ...data });
  const [saved, setSaved] = useState(false);
  // ⬇️ MPYA: saving + error
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    let res;
    if (section === "about") res = await updateAboutAsync(form);
    else if (section === "terms") res = await updateTermsAsync(form);
    else if (section === "privacy") res = await updatePrivacyAsync(form);
    else if (section === "help") res = await updateHelpAsync(form);

    setSaving(false);

    if (res?.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } else {
      setError(
        res?.error?.message ||
          t("Imeshindwa kuhifadhi.", "Failed to save.")
      );
    }
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3 w-full min-w-0 overflow-hidden"
    >
      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      <BilingualField
        label={t("Kichwa", "Heading")}
        value={form.heading || { sw: "", en: "" }}
        onChange={(v) => setForm({ ...form, heading: v })}
        disabled={saving}
      />

      {section === "about" && (
        <>
          <BilingualField
            label={t("Maelezo Mafupi", "Subtext")}
            value={form.subtext || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, subtext: v })}
            multiline
            rows={2}
            disabled={saving}
          />
          <BilingualField
            label={t("Dhamira (Mission)", "Mission")}
            value={form.mission || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, mission: v })}
            multiline
            rows={3}
            disabled={saving}
          />
        </>
      )}

      {(section === "terms" || section === "privacy" || section === "help") && (
        <BilingualField
          label={t("Maudhui", "Content")}
          value={form.content || { sw: "", en: "" }}
          onChange={(v) => setForm({ ...form, content: v })}
          multiline
          rows={4}
          disabled={saving}
        />
      )}

      {form.lastUpdated && (
        <p className="text-[10px] text-muted break-words">
          {t("Ilisasishwa", "Last updated")}:{" "}
          {new Date(form.lastUpdated).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US")}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          {saving ? t("Inahifadhi...", "Saving...") : t("Hifadhi", "Save")}
        </button>
        {saved && (
          <span
            style={{ color: COLORS.green }}
            className="flex items-center gap-1 text-xs font-semibold shrink-0"
          >
            <Check size={13} />
            {t("Imehifadhiwa", "Saved")}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN SECTION
// ============================================================
export default function ContentSection() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState("banners");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Usimamizi wa Maudhui", "Content Management")}
        subtitle={t(
          "Badilisha maudhui ya homepage, FAQ, Terms, Privacy, na Help bila developer.",
          "Edit homepage content, FAQs, Terms, Privacy, and Help without a developer."
        )}
      />

      <div className="flex justify-center gap-2 mb-5 overflow-x-auto pb-2 w-full min-w-0">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: isActive ? COLORS.night : "white",
                color: isActive ? COLORS.sand : "var(--text-primary)",
                borderColor: COLORS.sandLine,
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
            >
              <Icon size={13} />
              {label?.[lang] || label?.sw}
            </button>
          );
        })}
      </div>

      <div className="w-full min-w-0">
        {activeTab === "banners" && <BannersTab lang={lang} />}
        {activeTab === "testimonials" && <TestimonialsTab lang={lang} />}
        {activeTab === "faqs" && <FaqsTab lang={lang} />}
        {activeTab === "about" && <SinglePageEditor section="about" lang={lang} />}
        {activeTab === "terms" && <SinglePageEditor section="terms" lang={lang} />}
        {activeTab === "privacy" && <SinglePageEditor section="privacy" lang={lang} />}
        {activeTab === "help" && <SinglePageEditor section="help" lang={lang} />}
      </div>
    </div>
  );
}

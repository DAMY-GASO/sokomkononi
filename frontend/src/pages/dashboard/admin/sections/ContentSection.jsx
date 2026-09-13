// ============================================================
// ContentSection.jsx
// Admin — Content Management (banners, testimonials, FAQs, About,
// Terms, Privacy, Help).
// Bilingual + mobile-responsive.
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
  X,
  Save,
  Check,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useContent,
  addBanner,
  updateBanner,
  removeBanner,
  addTestimonial,
  updateTestimonial,
  removeTestimonial,
  addFaq,
  updateFaq,
  removeFaq,
  updateAbout,
  updateTerms,
  updatePrivacy,
  updateHelp,
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
function BilingualField({ label, value, onChange, multiline = false, rows = 3 }) {
  const swVal = value?.sw || "";
  const enVal = value?.en || "";
  const Input = multiline ? "textarea" : "input";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold text-gray-500">{label}</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] font-semibold text-gray-400 uppercase">
            Kiswahili
          </span>
          <Input
            value={swVal}
            onChange={(e) => onChange({ ...value, sw: e.target.value })}
            rows={multiline ? rows : undefined}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] resize-none"
          />
        </div>
        <div>
          <span className="text-[10px] font-semibold text-gray-400 uppercase">
            English
          </span>
          <Input
            value={enVal}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            rows={multiline ? rows : undefined}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D] resize-none"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BANNERS TAB
// ============================================================
function BannersTab({ lang }) {
  const content = useContent();
  const banners = content.banners || [];
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [adding, setAdding] = useState(false);

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
  };

  const handleEdit = (banner) => {
    setForm({ ...banner });
    setEditing(banner.id);
    setAdding(false);
  };

  const handleSave = () => {
    if (adding) {
      addBanner(form);
      setAdding(false);
    } else if (editing) {
      updateBanner(editing, form);
      setEditing(null);
    }
  };

  const handleCancel = () => {
    setAdding(false);
    setEditing(null);
    setForm({});
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleAdd}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start"
      >
        <Plus size={13} />
        {t("Banner Mpya", "New Banner")}
      </button>

      {(adding || editing) && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-4 flex flex-col gap-3"
        >
          <BilingualField
            label={t("Kichwa", "Title")}
            value={form.title || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, title: v })}
          />
          <BilingualField
            label={t("Maelezo", "Subtitle")}
            value={form.subtitle || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, subtitle: v })}
            multiline
            rows={2}
          />
          <BilingualField
            label={t("Kitufe", "CTA Text")}
            value={form.ctaText || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, ctaText: v })}
          />
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-gray-500">
              {t("Kiungo (URL)", "Link (URL)")}
            </span>
            <input
              value={form.ctaLink || ""}
              onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
              placeholder="/tafuta"
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D]"
            />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded text-[#E8A33D]"
            />
            <span className="text-xs text-gray-600">
              {t("Inaonekana HomePage", "Show on HomePage")}
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600"
            >
              {t("Ghairi", "Cancel")}
            </button>
            <button
              onClick={handleSave}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
            >
              <Save size={13} />
              {t("Hifadhi", "Save")}
            </button>
          </div>
        </div>
      )}

      {banners.map((banner) => (
        <div
          key={banner.id}
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  style={{
                    background: banner.active
                      ? "rgba(47,109,79,0.12)"
                      : "rgba(16,26,46,0.08)",
                    color: banner.active ? COLORS.green : COLORS.night,
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                >
                  {banner.active ? t("Hai", "Active") : t("Imezimwa", "Inactive")}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {banner.title?.[lang] || banner.title?.sw}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {banner.subtitle?.[lang] || banner.subtitle?.sw}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                CTA: {banner.ctaText?.[lang] || banner.ctaText?.sw} → {banner.ctaLink}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleEdit(banner)}
                className="p-1.5 text-gray-400 hover:text-[#E8A33D]"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(t("Ondoa banner?", "Remove banner?"))) {
                    removeBanner(banner.id);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-[#C1502E]"
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
// TESTIMONIALS TAB
// ============================================================
function TestimonialsTab({ lang }) {
  const content = useContent();
  const testimonials = content.testimonials || [];
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleAdd = () => {
    setForm({ name: "", quote: { sw: "", en: "" }, rating: 5, active: true });
    setAdding(true);
    setEditing(null);
  };

  const handleEdit = (item) => {
    setForm({ ...item });
    setEditing(item.id);
    setAdding(false);
  };

  const handleSave = () => {
    if (adding) {
      addTestimonial(form);
      setAdding(false);
    } else if (editing) {
      updateTestimonial(editing, form);
      setEditing(null);
    }
  };

  const handleCancel = () => {
    setAdding(false);
    setEditing(null);
    setForm({});
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleAdd}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start"
      >
        <Plus size={13} />
        {t("Ushuhuda Mpya", "New Testimonial")}
      </button>

      {(adding || editing) && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-4 flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-gray-500">
              {t("Jina", "Name")}
            </span>
            <input
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mary, Dar es Salaam"
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#E8A33D]"
            />
          </label>
          <BilingualField
            label={t("Ushuhuda", "Quote")}
            value={form.quote || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, quote: v })}
            multiline
            rows={3}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600"
            >
              {t("Ghairi", "Cancel")}
            </button>
            <button
              onClick={handleSave}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
            >
              <Save size={13} />
              {t("Hifadhi", "Save")}
            </button>
          </div>
        </div>
      )}

      {testimonials.map((item) => (
        <div
          key={item.id}
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800">{item.name}</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                "{item.quote?.[lang] || item.quote?.sw}"
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleEdit(item)}
                className="p-1.5 text-gray-400 hover:text-[#E8A33D]"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(t("Ondoa ushuhuda?", "Remove testimonial?"))) {
                    removeTestimonial(item.id);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-[#C1502E]"
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
// FAQS TAB
// ============================================================
function FaqsTab({ lang }) {
  const content = useContent();
  const faqs = content.faqs || [];
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleAdd = () => {
    setForm({ question: { sw: "", en: "" }, answer: { sw: "", en: "" }, active: true });
    setAdding(true);
    setEditing(null);
  };

  const handleEdit = (faq) => {
    setForm({ ...faq });
    setEditing(faq.id);
    setAdding(false);
  };

  const handleSave = () => {
    if (adding) {
      addFaq(form);
      setAdding(false);
    } else if (editing) {
      updateFaq(editing, form);
      setEditing(null);
    }
  };

  const handleCancel = () => {
    setAdding(false);
    setEditing(null);
    setForm({});
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleAdd}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start"
      >
        <Plus size={13} />
        {t("Swali Jipya", "New FAQ")}
      </button>

      {(adding || editing) && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-4 flex flex-col gap-3"
        >
          <BilingualField
            label={t("Swali", "Question")}
            value={form.question || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, question: v })}
          />
          <BilingualField
            label={t("Jibu", "Answer")}
            value={form.answer || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, answer: v })}
            multiline
            rows={3}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600"
            >
              {t("Ghairi", "Cancel")}
            </button>
            <button
              onClick={handleSave}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
            >
              <Save size={13} />
              {t("Hifadhi", "Save")}
            </button>
          </div>
        </div>
      )}

      {faqs.map((faq) => (
        <div
          key={faq.id}
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-xl border p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800">
                {faq.question?.[lang] || faq.question?.sw}
              </p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {faq.answer?.[lang] || faq.answer?.sw}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleEdit(faq)}
                className="p-1.5 text-gray-400 hover:text-[#E8A33D]"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(t("Ondoa swali?", "Remove FAQ?"))) {
                    removeFaq(faq.id);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-[#C1502E]"
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
// SINGLE-PAGE EDITORS (About, Terms, Privacy, Help)
// ============================================================
function SinglePageEditor({ section, lang }) {
  const content = useContent();
  const data = content[section] || {};
  const [form, setForm] = useState({ ...data });
  const [saved, setSaved] = useState(false);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleSave = () => {
    if (section === "about") updateAbout(form);
    else if (section === "terms") updateTerms(form);
    else if (section === "privacy") updatePrivacy(form);
    else if (section === "help") updateHelp(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-4 flex flex-col gap-3"
    >
      <BilingualField
        label={t("Kichwa", "Heading")}
        value={form.heading || { sw: "", en: "" }}
        onChange={(v) => setForm({ ...form, heading: v })}
      />

      {section === "about" && (
        <>
          <BilingualField
            label={t("Maelezo Mafupi", "Subtext")}
            value={form.subtext || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, subtext: v })}
            multiline
            rows={2}
          />
          <BilingualField
            label={t("Dhamira (Mission)", "Mission")}
            value={form.mission || { sw: "", en: "" }}
            onChange={(v) => setForm({ ...form, mission: v })}
            multiline
            rows={3}
          />
        </>
      )}

      {(section === "terms" || section === "privacy" || section === "help") && (
        <BilingualField
          label={t("Maudhui", "Content")}
          value={form.content || { sw: "", en: "" }}
          onChange={(v) => setForm({ ...form, content: v })}
          multiline
          rows={8}
        />
      )}

      {form.lastUpdated && (
        <p className="text-[10px] text-gray-400">
          {t("Ilisasishwa", "Last updated")}:{" "}
          {new Date(form.lastUpdated).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US")}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg"
        >
          <Save size={13} />
          {t("Hifadhi", "Save")}
        </button>
        {saved && (
          <span
            style={{ color: COLORS.green }}
            className="flex items-center gap-1 text-xs font-semibold"
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
    <>
      <SectionHeader
        title={t("Usimamizi wa Maudhui", "Content Management")}
        subtitle={t(
          "Badilisha maudhui ya homepage, FAQ, Terms, Privacy, na Help bila developer.",
          "Edit homepage content, FAQs, Terms, Privacy, and Help without a developer."
        )}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: isActive ? COLORS.night : "white",
                color: isActive ? COLORS.sand : COLORS.night,
                borderColor: COLORS.sandLine,
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap shrink-0"
            >
              <Icon size={13} />
              {label?.[lang] || label?.sw}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "banners" && <BannersTab lang={lang} />}
      {activeTab === "testimonials" && <TestimonialsTab lang={lang} />}
      {activeTab === "faqs" && <FaqsTab lang={lang} />}
      {activeTab === "about" && <SinglePageEditor section="about" lang={lang} />}
      {activeTab === "terms" && <SinglePageEditor section="terms" lang={lang} />}
      {activeTab === "privacy" && <SinglePageEditor section="privacy" lang={lang} />}
      {activeTab === "help" && <SinglePageEditor section="help" lang={lang} />}
    </>
  );
}

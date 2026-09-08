import React, { useEffect, useState } from "react";
import { fetchCategories } from "../../api/category.api";
import { createProperty } from "../../api/property.api";
import { useLanguage } from "../../context/LanguageContext.jsx";

// Fomu ya "Weka Mali Yako" — fields za msingi ni fixed, fields za ziada
// zinatokana na category.extraFields (category-specific, si fomu moja kubwa
// kwa kila category — tazama marekebisho ya mteja #3)
export default function PropertyForm({ onCreated }) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    categoryId: "",
    title: "",
    description: "",
    price: "",
    location: "",
    images: [""], // MVP: URL moja au zaidi; upload halisi wa faili — Awamu ya baadaye
    attributes: {},
    contactHidden: true,
  });

  useEffect(() => {
    fetchCategories().then((res) => setCategories(res.data));
  }, []);

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const extraFields = selectedCategory?.extraFields || {};

  function handleAttributeChange(key, value) {
    setForm((f) => ({ ...f, attributes: { ...f.attributes, [key]: value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createProperty({
        ...form,
        price: Number(form.price),
        images: form.images.filter(Boolean),
      });
      onCreated?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Imeshindikana kuweka mali");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-ink-muted/15 rounded-lg p-4 bg-white space-y-3">
      <h3 className="font-semibold text-ink-primary">{t("form_title")}</h3>

      <select
        required
        className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
        value={form.categoryId}
        onChange={(e) => setForm({ ...form, categoryId: e.target.value, attributes: {} })}
      >
        <option value="">{t("form_category")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <input
        required
        className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
        placeholder={t("form_title_field")}
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <textarea
        required
        className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
        placeholder={t("form_description")}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          required
          type="number"
          className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
          placeholder={t("form_price")}
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <input
          required
          className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
          placeholder={t("form_location")}
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
      </div>

      <input
        className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
        placeholder={t("form_image")}
        value={form.images[0]}
        onChange={(e) => setForm({ ...form, images: [e.target.value] })}
      />

      {/* Category-specific fields — zinabadilika kulingana na category iliyochaguliwa */}
      {Object.keys(extraFields).length > 0 && (
        <div className="border-t border-ink-muted/15 pt-3 space-y-3">
          <p className="text-xs font-medium text-ink-muted">
            {t("form_extra_heading", { category: selectedCategory.name })}
          </p>
          {Object.entries(extraFields).map(([key, type]) => (
            <input
              key={key}
              type={type === "number" ? "number" : "text"}
              className="w-full border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
              placeholder={key}
              value={form.attributes[key] || ""}
              onChange={(e) => handleAttributeChange(key, e.target.value)}
            />
          ))}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={form.contactHidden}
          onChange={(e) => setForm({ ...form, contactHidden: e.target.checked })}
        />
        {t("form_contact_hidden")}
      </label>

      {error && <p className="text-rust text-sm">{error}</p>}

      <button
        disabled={saving}
        className="bg-gold hover:bg-gold-dark text-night px-4 py-2 rounded-md text-sm font-semibold"
      >
        {saving ? t("form_submitting") : t("form_submit")}
      </button>

      <p className="text-xs text-ink-muted">{t("form_fee_note")}</p>
    </form>
  );
}

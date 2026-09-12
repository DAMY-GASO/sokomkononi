import React, { useState } from "react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import { AVAILABLE_ICONS } from "../../../../../config/categoriesStore.js";

export default function CategoryForm({
  initial = {},
  isEditing = false,
  onSave,
  onCancel,
}) {
  const { lang } = useLanguage();
  const [form, setForm] = useState({
    key: initial.key || "",
    labelSw: initial.label?.sw || "",
    labelEn: initial.label?.en || "",
    descSw: initial.description?.sw || "",
    descEn: initial.description?.en || "",
    iconKey: initial.iconKey || "Home",
    isPopular: initial.isPopular ?? true,
    active: initial.active ?? true,
  });

  const canSave = form.key.trim() && form.labelSw.trim() && form.labelEn.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) return;

    const slugified = isEditing
      ? form.key
      : form.key
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

    onSave({
      key: slugified,
      label: { sw: form.labelSw.trim(), en: form.labelEn.trim() },
      description: {
        sw: form.descSw.trim() || form.labelSw.trim(),
        en: form.descEn.trim() || form.labelEn.trim(),
      },
      iconKey: form.iconKey,
      isPopular: form.isPopular,
      active: form.active,
      extra: initial.extra || [],
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
      className="border-t rounded-b-lg p-4 flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">
            Key (slug)
          </span>
          <input
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder="mfano: pikipiki"
            disabled={isEditing}
            className="border border-gray-200 rounded-md px-2.5 py-1.5 text-xs outline-none disabled:bg-gray-100 disabled:text-gray-500"
          />
          {!isEditing && (
            <span className="text-[10px] text-gray-400">
              {lang === "sw"
                ? "Herufi ndogo, namba, na `-` pekee."
                : "Lowercase letters, numbers, and `-` only."}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">Icon</span>
          <select
            value={form.iconKey}
            onChange={(e) => setForm({ ...form, iconKey: e.target.value })}
            className="border border-gray-200 rounded-md px-2.5 py-1.5 text-xs outline-none"
          >
            {Object.keys(AVAILABLE_ICONS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">
            {lang === "sw" ? "Jina (Kiswahili)" : "Label (Swahili)"}
          </span>
          <input
            value={form.labelSw}
            onChange={(e) => setForm({ ...form, labelSw: e.target.value })}
            placeholder="mfano: Pikipiki"
            className="border border-gray-200 rounded-md px-2.5 py-1.5 text-xs outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">
            {lang === "sw" ? "Jina (Kiingereza)" : "Label (English)"}
          </span>
          <input
            value={form.labelEn}
            onChange={(e) => setForm({ ...form, labelEn: e.target.value })}
            placeholder="e.g. Motorcycles"
            className="border border-gray-200 rounded-md px-2.5 py-1.5 text-xs outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[11px] font-semibold text-gray-500">
            {lang === "sw" ? "Maelezo (Kiswahili) — hiari" : "Description (Swahili) — optional"}
          </span>
          <input
            value={form.descSw}
            onChange={(e) => setForm({ ...form, descSw: e.target.value })}
            className="border border-gray-200 rounded-md px-2.5 py-1.5 text-xs outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[11px] font-semibold text-gray-500">
            {lang === "sw" ? "Maelezo (Kiingereza) — hiari" : "Description (English) — optional"}
          </span>
          <input
            value={form.descEn}
            onChange={(e) => setForm({ ...form, descEn: e.target.value })}
            className="border border-gray-200 rounded-md px-2.5 py-1.5 text-xs outline-none"
          />
        </label>
      </div>

      <div className="flex items-center gap-4 text-xs flex-wrap">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPopular}
            onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
          />
          {lang === "sw"
            ? "Inaonekana HomePage + Navbar"
            : "Show on HomePage + Navbar"}
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          {lang === "sw" ? "Hai (inapatikana kwa wauzaji)" : "Active (available to sellers)"}
        </label>
      </div>

      {!isEditing && (
        <p style={{ color: COLORS.rust }} className="text-[11px] leading-relaxed">
          {lang === "sw" ? (
            <>
              ⚠️ Baada ya kuunda category hii, <b>LAZIMA</b> uende{" "}
              <b>Revenue &gt; Listing Fee</b> na uongeze fee config yake.
            </>
          ) : (
            <>
              ⚠️ After creating this category, you <b>MUST</b> go to{" "}
              <b>Revenue &gt; Listing Fee</b> and add its fee config.
            </>
          )}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          style={{ borderColor: COLORS.sandLine }}
          className="text-xs font-semibold px-3 py-2 rounded-lg border text-gray-600 hover:bg-white"
        >
          {lang === "sw" ? "Ghairi" : "Cancel"}
        </button>
        <button
          type="submit"
          disabled={!canSave}
          style={{
            background: canSave ? COLORS.night : COLORS.sandLine,
            color: canSave ? COLORS.sand : "rgba(16,26,46,0.4)",
          }}
          className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {isEditing
            ? lang === "sw"
              ? "Hifadhi Mabadiliko"
              : "Save Changes"
            : lang === "sw"
              ? "Ongeza Category"
              : "Add Category"}
        </button>
      </div>
    </form>
  );
}

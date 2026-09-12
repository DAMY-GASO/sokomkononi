// ============================================================
// CategoryForm.jsx
// Form ya kuunda/kuhariri category — picha + fields + flags.
// Bilingual + mobile-responsive + image upload.
// ============================================================

import React, { useState, useRef } from "react";
import { X, ImagePlus } from "lucide-react";
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
    imageUrl: initial.imageUrl || null,
    isPopular: initial.isPopular ?? true,
    active: initial.active ?? true,
  });
  const fileInputRef = useRef(null);

  const canSave = form.key.trim() && form.labelSw.trim() && form.labelEn.trim();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert(lang === "sw" ? "Tafadhali chagua picha." : "Please choose an image.");
      return;
    }
    if (file.size > 1024 * 1024) {
      alert(
        lang === "sw"
          ? "Picha ni kubwa sana (max 1MB)."
          : "Image is too large (max 1MB)."
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setForm((f) => ({ ...f, imageUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      imageUrl: form.imageUrl,
      isPopular: form.isPopular,
      active: form.active,
      extra: initial.extra || [],
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
      className="border-t rounded-b-lg p-3 sm:p-4 flex flex-col gap-3"
    >
      {/* PHOTO UPLOAD */}
      <div>
        <span className="text-[11px] font-semibold text-gray-500 block mb-2">
          {lang === "sw"
            ? "Picha ya Kuwakilisha Category"
            : "Representative Photo"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {form.imageUrl ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <img
              src={form.imageUrl}
              alt="Category preview"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border shrink-0"
              style={{ borderColor: COLORS.sandLine }}
            />
            <div className="flex flex-row sm:flex-col gap-2 sm:gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border"
                style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
              >
                {lang === "sw" ? "Badilisha" : "Change"}
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg border"
                style={{ borderColor: COLORS.sandLine, color: COLORS.rust }}
              >
                <X size={12} />
                {lang === "sw" ? "Ondoa" : "Remove"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ borderColor: COLORS.sandLine, color: "rgba(16,26,46,0.55)" }}
            className="w-full rounded-xl border-2 border-dashed py-4 sm:py-5 flex flex-col items-center gap-1.5 hover:bg-white/50 transition-colors"
          >
            <ImagePlus size={22} color="rgba(16,26,46,0.35)" />
            <span className="text-xs font-medium text-center px-2">
              {lang === "sw"
                ? "Bofya kupakia picha (max 1MB)"
                : "Click to upload photo (max 1MB)"}
            </span>
          </button>
        )}
        <p className="text-[10px] text-gray-400 mt-1">
          {lang === "sw"
            ? "Kama hutaweka picha, icon itatumika kama fallback."
            : "If no photo, icon will be used as fallback."}
        </p>
      </div>

      {/* FIELDS */}
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
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">
            {lang === "sw" ? "Icon (fallback)" : "Icon (fallback)"}
          </span>
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
            {lang === "sw"
              ? "Maelezo (Kiswahili) — hiari"
              : "Description (Swahili) — optional"}
          </span>
          <input
            value={form.descSw}
            onChange={(e) => setForm({ ...form, descSw: e.target.value })}
            className="border border-gray-200 rounded-md px-2.5 py-1.5 text-xs outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-[11px] font-semibold text-gray-500">
            {lang === "sw"
              ? "Maelezo (Kiingereza) — hiari"
              : "Description (English) — optional"}
          </span>
          <input
            value={form.descEn}
            onChange={(e) => setForm({ ...form, descEn: e.target.value })}
            className="border border-gray-200 rounded-md px-2.5 py-1.5 text-xs outline-none"
          />
        </label>
      </div>

      {/* FLAGS */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPopular}
            onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
            className="shrink-0"
          />
          <span>
            {lang === "sw"
              ? "Inaonekana HomePage + Navbar"
              : "Show on HomePage + Navbar"}
          </span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="shrink-0"
          />
          <span>
            {lang === "sw"
              ? "Hai (inapatikana kwa wauzaji)"
              : "Active (available to sellers)"}
          </span>
        </label>
      </div>

      {/* WARNING (only when adding new) */}
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

      {/* ACTIONS */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          style={{ borderColor: COLORS.sandLine }}
          className="text-xs font-semibold px-3 py-2 rounded-lg border text-gray-600 hover:bg-white transition-colors shrink-0"
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
          className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
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

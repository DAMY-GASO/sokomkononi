// ============================================================
// CategoryForm.jsx
// Form ya kuunda/kuhariri category — picha + fields + flags.
// Icon: grid ya icons (sio dropdown) — rahisi kuchagua.
// Bilingual + mobile-responsive + image upload + saving state.
// ============================================================

import React, { useState, useRef } from "react";
import { X, ImagePlus, Loader2, ChevronDown, Search } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import { AVAILABLE_ICONS } from "../../../../../config/categoriesStore.js";
import {
  FIELD_LIBRARY,
  getFieldsByGroup,
  fieldsConfigFromExtra,
  resolveConfiguredFields,
} from "../../../../../config/fieldLibrary.js";
import { categoriesApi } from "../../../../../api/categories.js";
import { useToast } from "../../../../../components/Toast.jsx";
import ImageCropper from "../../../../../components/ImageCropper.jsx";

// ============================================================
// FieldsPicker — admin anatick fields zitakazoonekana kwenye fomu ya posting
// ============================================================
function FieldsPicker({ value, onChange, seedFields, lang, disabled }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [open, setOpen] = useState({});
  const [q, setQ] = useState("");

  const selected = new Map(value.map((c) => [c.key, c]));

  // Fields za awali za category ambazo hazipo kwenye maktaba (key za zamani)
  const legacy = (seedFields || []).filter((f) => !FIELD_LIBRARY[f.key]);
  const groups = [
    ...(legacy.length
      ? [{
          key: "__legacy",
          label: { sw: "Fields za awali za category hii", en: "This category's existing fields" },
          fields: legacy,
        }]
      : []),
    ...getFieldsByGroup(),
  ];

  const label = (f) => f.label?.[lang] || f.label?.sw || f.key;
  const needle = q.trim().toLowerCase();
  const matches = (f) =>
    !needle ||
    f.key.toLowerCase().includes(needle) ||
    (f.label?.sw || "").toLowerCase().includes(needle) ||
    (f.label?.en || "").toLowerCase().includes(needle);

  const toggle = (key) => {
    if (selected.has(key)) onChange(value.filter((c) => c.key !== key));
    else onChange([...value, { key, required: false }]);
  };
  const setRequired = (key, required) =>
    onChange(value.map((c) => (c.key === key ? { ...c, required } : c)));

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[11px] font-semibold text-secondary">
          {t("Fields za Fomu ya Kuweka Tangazo", "Posting Form Fields")}
        </span>
        <span className="text-[11px] text-muted">
          {value.length} {t("zimechaguliwa", "selected")}
          {value.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange([])}
              className="ml-2 underline"
              style={{ color: COLORS.dangerText }}
            >
              {t("Ondoa zote", "Clear all")}
            </button>
          )}
        </span>
      </div>
      <p className="text-[10px] text-muted mb-2">
        {t(
          "Chagua tu vipengele vinavyofaa bidhaa za category hii. Kichwa, maelezo, bei, picha na eneo huwa vipo kila mara.",
          "Pick only what fits this category. Title, description, price, photos and location are always shown."
        )}
      </p>

      <div className="relative mb-2">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("Tafuta field (mfano: GB, rangi, ukubwa)", "Search field (e.g. GB, color, size)")}
          disabled={disabled}
          className="input"
          style={{ paddingLeft: 28 }}
        />
      </div>

      <div
        style={{ borderColor: "rgb(var(--c-hairline))" }}
        className="border rounded-md bg-card max-h-96 overflow-y-auto divide-y"
      >
        {groups.map((g) => {
          const visible = g.fields.filter(matches);
          if (needle && visible.length === 0) return null;
          const count = g.fields.filter((f) => selected.has(f.key)).length;
          const isOpen = needle ? true : !!open[g.key];
          return (
            <div key={g.key} style={{ borderColor: "rgb(var(--c-hairline))" }}>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-ink/5"
              >
                <span className="text-xs font-semibold text-primary">
                  {g.label[lang] || g.label.sw}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {count > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${COLORS.gold}25`, color: COLORS.goldText }}
                    >
                      {count}
                    </span>
                  )}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {isOpen && (
                <ul className="px-2.5 pb-2 flex flex-col gap-1">
                  {visible.map((f) => {
                    const on = selected.has(f.key);
                    return (
                      <li key={f.key} className="flex items-center justify-between gap-2 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer min-w-0">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggle(f.key)}
                            disabled={disabled}
                            className="shrink-0"
                          />
                          <span className="truncate">{label(f)}</span>
                          {f.showIf && (
                            <span className="text-[9px] text-muted shrink-0">
                              ({t("masharti", "conditional")})
                            </span>
                          )}
                        </label>
                        {on && (
                          <label className="flex items-center gap-1 text-[11px] text-secondary shrink-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!selected.get(f.key).required}
                              onChange={(e) => setRequired(f.key, e.target.checked)}
                              disabled={disabled}
                            />
                            {t("Lazima", "Required")}
                          </label>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CategoryForm({
  initial = {},
  isEditing = false,
  onSave,
  onCancel,
  saving = false,
  error = "",
}) {
  const { lang } = useLanguage();
  const toast = useToast();
  const [form, setForm] = useState({
    key: initial.key || "",
    labelSw: initial.label?.sw || "",
    labelEn: initial.label?.en || "",
    descSw: initial.description?.sw || "",
    descEn: initial.description?.en || "",
    iconKey: initial.iconKey || "Home",
    imageUrl: initial.imageUrl || null,
    imagePreview: initial.imageUrl || null,
    imageFile: null,
    isPopular: initial.isPopular ?? true,
    active: initial.active ?? true,
  });
  const [fieldsConfig, setFieldsConfig] = useState(
    () => initial.fieldsConfig || fieldsConfigFromExtra(initial.extra)
  );
  const [fieldsTouched, setFieldsTouched] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const fileInputRef = useRef(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);
  const canSave =
    form.key.trim() && form.labelSw.trim() && form.labelEn.trim() && !saving;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("Tafadhali chagua picha.", "Please choose an image."));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error(
        t("Picha ni kubwa sana (max 15MB).", "Image is too large (max 15MB).")
      );
      return;
    }
    setCropFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropped = (cropped) => {
    setCropFile(null);
    const reader = new FileReader();
    reader.onload = () =>
      setForm((f) => ({ ...f, imagePreview: reader.result, imageFile: cropped }));
    reader.readAsDataURL(cropped);
  };

  const handleRemoveImage = () => {
    setForm((f) => ({
      ...f,
      imageUrl: null,
      imagePreview: null,
      imageFile: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSave || uploadingImage) return;

    let finalImageUrl = form.imageUrl;

    if (form.imageFile) {
      setUploadingImage(true);
      try {
        const fd = new FormData();
        fd.append("image", form.imageFile);
        const res = await categoriesApi.uploadImage(fd);
        finalImageUrl = res?.image_url || res?.url || null;
      } catch (err) {
        console.warn("[CategoryForm] image upload failed:", err);
        toast.error(
          t(
            "Imeshindwa kupakia picha. Jaribu tena.",
            "Failed to upload image. Try again."
          )
        );
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

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
      imageUrl: finalImageUrl,
      isPopular: form.isPopular,
      active: form.active,
      // Kategoria mpya au admin alipobadilisha tick -> hifadhi fields_config.
      // Vinginevyo acha kama ilivyo (seed haifutwi).
      ...(fieldsTouched || !isEditing
        ? {
            fieldsConfig,
            extra: resolveConfiguredFields(fieldsConfig, initial.extra),
          }
        : { extra: initial.extra || [] }),
    });
  };

  // Icon iliyochaguliwa kwa preview
  const SelectedIcon = AVAILABLE_ICONS[form.iconKey];

  return (
    <>
      {cropFile && (
        <ImageCropper
          file={cropFile}
          lang={lang}
          outputSize={800}
          maxBytes={1024 * 1024}
          onConfirm={handleCropped}
          onCancel={() => setCropFile(null)}
        />
      )}
      <form
        onSubmit={handleSubmit}
        className="border-t border-hairline bg-page rounded-b-lg p-3 sm:p-4 flex flex-col gap-3"
      >
        {error && (
          <div
            style={{ background: "rgba(193,80,46,0.1)", color: COLORS.dangerText }}
            className="text-xs font-semibold px-3 py-2 rounded-lg"
          >
            {error}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PHOTO UPLOAD */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div>
          <span className="text-[11px] font-semibold text-secondary block mb-2">
            {t("Picha ya Kuwakilisha Category", "Representative Photo")}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={saving || uploadingImage}
            className="hidden"
          />
          {form.imagePreview ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <img
                src={form.imagePreview}
                alt="Category preview"
                className="w-20 h-20 sm:w-24 sm:h-24 aspect-square rounded-lg object-cover border shrink-0"
                style={{ borderColor: "rgb(var(--c-hairline))" }}
              />
              <div className="flex flex-row sm:flex-col gap-2 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving || uploadingImage}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-50"
                  style={{
                    borderColor: "rgb(var(--c-hairline))",
                    color: "var(--text-primary)",
                  }}
                >
                  {t("Badilisha", "Change")}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={saving || uploadingImage}
                  className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-50"
                  style={{ borderColor: "rgb(var(--c-hairline))", color: COLORS.dangerText }}
                >
                  <X size={12} />
                  {t("Ondoa", "Remove")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving || uploadingImage}
              style={{
                borderColor: "rgb(var(--c-hairline))",
                color: "var(--text-secondary)",
              }}
              className="w-full rounded-xl border-2 border-dashed py-4 sm:py-5 flex flex-col items-center gap-1.5 hover:bg-ink/5 transition-colors disabled:opacity-50"
            >
              <ImagePlus size={22} className="opacity-60" />
              <span className="text-xs font-medium text-center px-2">
                {t(
                  "Bofya kupakia picha (itakatwa kuwa mraba)",
                  "Click to upload photo (will be cropped square)"
                )}
              </span>
            </button>
          )}
          <p className="text-[10px] text-muted mt-1">
            {t(
              "Kama hutaweka picha, icon itatumika kama fallback.",
              "If no photo, icon will be used as fallback."
            )}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FIELDS */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-secondary">
              Key (slug)
            </span>
            <input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="mfano: pikipiki"
              disabled={isEditing || saving}
              className="input"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Jina (Kiswahili)", "Label (Swahili)")}
            </span>
            <input
              value={form.labelSw}
              onChange={(e) => setForm({ ...form, labelSw: e.target.value })}
              placeholder="mfano: Pikipiki"
              disabled={saving}
              className="input"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Jina (Kiingereza)", "Label (English)")}
            </span>
            <input
              value={form.labelEn}
              onChange={(e) => setForm({ ...form, labelEn: e.target.value })}
              placeholder="e.g. Motorcycles"
              disabled={saving}
              className="input"
            />
          </label>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ICON GRID — full width, chini ya fields */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div>
          <span className="text-[11px] font-semibold text-secondary block mb-2">
            {t("Icon (fallback)", "Icon (fallback)")}
          </span>

          {/* Preview ya icon iliyochaguliwa */}
          {SelectedIcon && (
            <div
              style={{ borderColor: "rgb(var(--c-hairline))" }}
              className="flex items-center gap-2 border rounded-md px-2.5 py-2 mb-2 bg-card"
            >
              <div
                style={{
                  background: `${COLORS.gold}15`,
                  borderColor: COLORS.gold,
                }}
                className="w-8 h-8 rounded-md border flex items-center justify-center shrink-0"
              >
                <SelectedIcon size={16} style={{ color: COLORS.goldTextText }} />
              </div>
              <span className="text-xs font-semibold text-primary">
                {form.iconKey}
              </span>
            </div>
          )}

          {/* Grid ya icons */}
          <div
            style={{ borderColor: "rgb(var(--c-hairline))" }}
            className="border rounded-md p-2 max-h-56 overflow-y-auto grid grid-cols-6 sm:grid-cols-8 gap-1.5 bg-card"
          >
            {Object.entries(AVAILABLE_ICONS).map(([key, Icon]) => {
              const isSelected = form.iconKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, iconKey: key })}
                  disabled={saving}
                  title={key}
                  style={{
                    borderColor: isSelected ? COLORS.gold : "transparent",
                    background: isSelected ? `${COLORS.gold}15` : "transparent",
                  }}
                  className="w-full aspect-square rounded-md border-2 flex items-center justify-center hover:bg-ink/5 transition-colors disabled:opacity-50"
                >
                  <Icon
                    size={18}
                    style={{ color: isSelected ? COLORS.goldText : COLORS.ink }}
                  />
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted mt-1">
            {t(
              "Chagua icon inayowakilisha category hii vizuri.",
              "Choose an icon that best represents this category."
            )}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* DESCRIPTIONS */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Maelezo (Kiswahili) — hiari", "Description (Swahili) — optional")}
            </span>
            <input
              value={form.descSw}
              onChange={(e) => setForm({ ...form, descSw: e.target.value })}
              disabled={saving}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Maelezo (Kiingereza) — hiari", "Description (English) — optional")}
            </span>
            <input
              value={form.descEn}
              onChange={(e) => setForm({ ...form, descEn: e.target.value })}
              disabled={saving}
              className="input"
            />
          </label>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* POSTING FIELDS (tick-list) */}
        {/* ═══════════════════════════════════════════════════════ */}
        <FieldsPicker
          value={fieldsConfig}
          onChange={(next) => {
            setFieldsConfig(next);
            setFieldsTouched(true);
          }}
          seedFields={initial.extra}
          lang={lang}
          disabled={saving}
        />

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FLAGS */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPopular}
              onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
              disabled={saving}
              className="shrink-0"
            />
            <span>
              {t("Inaonekana HomePage + Navbar", "Show on HomePage + Navbar")}
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              disabled={saving}
              className="shrink-0"
            />
            <span>
              {t(
                "Hai (inapatikana kwa wauzaji)",
                "Active (available to sellers)"
              )}
            </span>
          </label>
        </div>

        {/* WARNING (only when adding new) */}
        {!isEditing && (
          <p style={{ color: COLORS.dangerText }} className="text-[11px] leading-relaxed">
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

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ACTIONS */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving || uploadingImage}
            style={{ borderColor: "rgb(var(--c-hairline))" }}
            className="text-xs font-semibold px-3 py-2 rounded-lg border text-secondary hover:bg-ink/5 transition-colors shrink-0 disabled:opacity-50"
          >
            {t("Ghairi", "Cancel")}
          </button>
          <button
            type="submit"
            disabled={!canSave || uploadingImage}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:cursor-not-allowed ${
              canSave && !uploadingImage
                ? "bg-night dark:bg-royal text-white"
                : "bg-hairline text-muted"
            }`}
          >
            {(saving || uploadingImage) && (
              <Loader2 size={13} className="animate-spin" />
            )}
            {uploadingImage
              ? t("Inapakia picha...", "Uploading photo...")
              : isEditing
                ? t("Hifadhi Mabadiliko", "Save Changes")
                : t("Ongeza Category", "Add Category")}
          </button>
        </div>
      </form>
    </>
  );
}
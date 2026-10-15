import React, { useRef, useState } from "react";
import { ImagePlus, X, Star } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";

const MAX_FILES = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/**
 * ImageUploader — multi-file picker with previews.
 *
 * The FIRST image is treated as the primary. Files are held in memory;
 * the parent sends them all in a single FormData POST.
 *
 * @param {File[]}   files
 * @param {function} onChange — (File[]) => void
 * @param {number}   [maxFiles=10]
 */
export default function ImageUploader({ files = [], onChange, maxFiles = MAX_FILES }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const handleSelect = (e) => {
    setError("");
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // allow re-selecting the same file

    const combined = [...files, ...picked];
    if (combined.length > maxFiles) {
      setError(t(`Upeo ni picha ${maxFiles}.`, `Maximum ${maxFiles} photos.`));
      return;
    }
    for (const f of picked) {
      if (!ALLOWED.includes(f.type)) {
        setError(t(`${f.name}: tumia JPG, PNG au WEBP.`, `${f.name}: use JPG, PNG or WEBP.`));
        return;
      }
      if (f.size > MAX_BYTES) {
        setError(t(`${f.name}: ukubwa usizidi 5 MB.`, `${f.name}: max size is 5 MB.`));
        return;
      }
    }
    onChange(combined);
  };

  const remove = (idx) => {
    const next = files.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const makePrimary = (idx) => {
    if (idx === 0) return;
    const next = files.slice();
    const [f] = next.splice(idx, 1);
    next.unshift(f);
    onChange(next);
  };

  const previews = files.map((f) => ({
    name: f.name,
    url: URL.createObjectURL(f),
    size: f.size,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
          {files.length} / {maxFiles}
        </span>
        {files.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[color:rgb(var(--c-hairline))]
                       bg-card px-3 py-2 text-xs font-semibold text-primary
                       hover:border-[color:rgb(var(--c-gold)/0.6)] hover:bg-[color:rgb(var(--c-page))]
                       transition-colors"
          >
            <ImagePlus size={14} />
            {t("Ongeza picha", "Add photos")}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleSelect}
        className="hidden"
      />

      {error && (
        <p className="text-[11px] font-medium text-[#C1502E]">{error}</p>
      )}

      {/* Drop target */}
      {previews.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-[color:rgb(var(--c-hairline))]
                     bg-[color:rgb(var(--c-page))] py-10 px-4
                     flex flex-col items-center gap-2
                     hover:border-[color:rgb(var(--c-gold)/0.6)] transition-colors"
        >
          <ImagePlus size={26} className="text-secondary" />
          <span className="text-xs font-medium text-primary">
            {t("Bofya kupakia picha (1–10)", "Click to upload photos (1–10)")}
          </span>
          <span className="text-[11px] text-secondary">
            {t("JPG, PNG au WEBP — max 5 MB kila moja", "JPG, PNG or WEBP — max 5 MB each")}
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {previews.map((p, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card">
              <img
                src={p.url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Primary badge */}
              {i === 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: "#2F6D4F", color: "#FFFFFF" }}>
                  <Star size={9} fill="#FFFFFF" /> {t("KUU", "PRIMARY")}
                </span>
              )}
              {/* Actions */}
              <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(i)}
                    title={t("Fanya kuwa picha kuu", "Make primary")}
                    className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-[#A35F00] hover:bg-white shadow-md"
                  >
                    <Star size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  title={t("Ondoa", "Remove")}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-[#C1502E] hover:bg-white shadow-md"
                >
                  <X size={13} />
                </button>
              </div>
              {/* Filename */}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-[10px] text-white truncate">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] leading-snug text-secondary">
        {t(
          "Picha ya kwanza ni picha kuu. Bofya nyota kwenye picha nyingine kufanya kuwa kuu.",
          "The first photo is the primary. Click the star on any photo to make it primary."
        )}
      </p>
    </div>
  );
}

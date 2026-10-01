// ============================================================
// shared/labelUtils.js
// Universal label picker — eliminates `.label` crashes everywhere.
// Handles: undefined | null | string | { sw, en }
// ============================================================

export function pickLabel(obj, lang = "en", fallback = "") {
  if (obj == null) return fallback;
  if (typeof obj === "string") return obj || fallback;
  if (typeof obj === "object") {
    const v = obj?.[lang] ?? obj?.en ?? obj?.sw;
    if (typeof v === "string" && v.length) return v;
    return fallback;
  }
  return fallback;
}

// Shorthand for bilingual objects specifically
export function pickBilingual(obj, lang = "en", fallback = "") {
  return pickLabel(obj, lang, fallback);
}

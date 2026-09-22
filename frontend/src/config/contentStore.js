// ============================================================
// contentStore.js — API-only via /api/content/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_content_v1";
const EV = "sokomkononi:content-updated";

const EMPTY = {
  banners: [],
  testimonials: [],
  faqs: [],
  about: { heading: { sw: "", en: "" }, subtext: { sw: "", en: "" }, mission: { sw: "", en: "" }, values: [] },
  terms: { heading: { sw: "", en: "" }, content: { sw: "", en: "" } },
  privacy: { heading: { sw: "", en: "" }, content: { sw: "", en: "" } },
  help: { heading: { sw: "", en: "" }, content: { sw: "", en: "" } },
};

function read() {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? { ...EMPTY, ...p } : EMPTY;
  } catch { return EMPTY; }
}
function write(c) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(c));
  window.dispatchEvent(new Event(EV));
}

function normBanner(b) {
  return {
    id: b.id,
    title: b.title || { sw: "", en: "" },
    subtitle: b.subtitle || { sw: "", en: "" },
    ctaText: b.cta_text || b.ctaText || { sw: "", en: "" },
    ctaLink: b.cta_link || b.ctaLink || "",
    imageUrl: b.image_url || b.imageUrl || null,
    active: b.active !== false,
    order: b.ordering ?? b.order ?? 1,
  };
}
function normTestimonial(t) {
  return {
    id: t.id,
    name: t.name || "",
    quote: t.quote || { sw: "", en: "" },
    avatarUrl: t.avatar_url || t.avatarUrl || null,
    rating: t.rating || 5,
    active: t.active !== false,
  };
}
function normFaq(f) {
  return {
    id: f.id,
    question: f.question || { sw: "", en: "" },
    answer: f.answer || { sw: "", en: "" },
    active: f.active !== false,
    order: f.ordering ?? f.order ?? 1,
  };
}
function normPage(b, fallback) {
  if (!b) return fallback;
  return {
    heading: b.heading || fallback.heading,
    content: b.content || fallback.content,
    subtext: b.subtext || fallback.subtext,
    mission: b.mission || fallback.mission,
    values: b.values || fallback.values || [],
    lastUpdated: b.updated_at || b.lastUpdated,
  };
}
function normFull(raw) {
  return {
    banners: (raw.banners || []).map(normBanner),
    testimonials: (raw.testimonials || []).map(normTestimonial),
    faqs: (raw.faqs || []).map(normFaq),
    about: normPage(raw.about, EMPTY.about),
    terms: normPage(raw.terms, EMPTY.terms),
    privacy: normPage(raw.privacy, EMPTY.privacy),
    help: normPage(raw.help, EMPTY.help),
  };
}

export function getContent() { return read(); }
export function getBanners() { return read().banners || []; }
export function getTestimonials() { return read().testimonials || []; }
export function getFaqs() { return read().faqs || []; }
export function getAbout() { return read().about || EMPTY.about; }
export function getTerms() { return read().terms || EMPTY.terms; }
export function getPrivacy() { return read().privacy || EMPTY.privacy; }
export function getHelp() { return read().help || EMPTY.help; }

export async function hydrateContentFromApi() {
  try {
    const data = await api.get("/content/");
    write(normFull(data || {}));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ── Banners ───────────────────────────────────────────────
export async function addBannerAsync(form) {
  try {
    const raw = await api.post("/content/banners/", {
      title: form.title, subtitle: form.subtitle,
      cta_text: form.ctaText, cta_link: form.ctaLink,
      image_url: form.imageUrl, active: form.active !== false,
      ordering: form.order ?? 1,
    });
    const created = normBanner(raw);
    write({ ...read(), banners: [...read().banners, created] });
    return { ok: true, banner: created };
  } catch (err) { return { ok: false, error: err }; }
}
export async function updateBannerAsync(id, patch) {
  try {
    const raw = await api.patch(`/content/banners/${id}/`, {
      ...(patch.title != null ? { title: patch.title } : {}),
      ...(patch.subtitle != null ? { subtitle: patch.subtitle } : {}),
      ...(patch.ctaText != null ? { cta_text: patch.ctaText } : {}),
      ...(patch.ctaLink != null ? { cta_link: patch.ctaLink } : {}),
      ...(patch.imageUrl != null ? { image_url: patch.imageUrl } : {}),
      ...(patch.active != null ? { active: patch.active } : {}),
    });
    const updated = normBanner(raw);
    write({ ...read(), banners: read().banners.map((b) => (b.id === id ? updated : b)) });
    return { ok: true, banner: updated };
  } catch (err) { return { ok: false, error: err }; }
}
export async function removeBannerAsync(id) {
  try {
    await api.delete(`/content/banners/${id}/`);
    write({ ...read(), banners: read().banners.filter((b) => b.id !== id) });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ── Testimonials ──────────────────────────────────────────
export async function addTestimonialAsync(form) {
  try {
    const raw = await api.post("/content/testimonials/", {
      name: form.name, quote: form.quote, rating: form.rating ?? 5, active: form.active !== false,
    });
    const created = normTestimonial(raw);
    write({ ...read(), testimonials: [...read().testimonials, created] });
    return { ok: true, testimonial: created };
  } catch (err) { return { ok: false, error: err }; }
}
export async function updateTestimonialAsync(id, patch) {
  try {
    const raw = await api.patch(`/content/testimonials/${id}/`, patch);
    const updated = normTestimonial(raw);
    write({ ...read(), testimonials: read().testimonials.map((t) => (t.id === id ? updated : t)) });
    return { ok: true, testimonial: updated };
  } catch (err) { return { ok: false, error: err }; }
}
export async function removeTestimonialAsync(id) {
  try {
    await api.delete(`/content/testimonials/${id}/`);
    write({ ...read(), testimonials: read().testimonials.filter((t) => t.id !== id) });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ── FAQs ──────────────────────────────────────────────────
export async function addFaqAsync(form) {
  try {
    const raw = await api.post("/content/faqs/", {
      question: form.question, answer: form.answer, active: form.active !== false,
    });
    const created = normFaq(raw);
    write({ ...read(), faqs: [...read().faqs, created] });
    return { ok: true, faq: created };
  } catch (err) { return { ok: false, error: err }; }
}
export async function updateFaqAsync(id, patch) {
  try {
    const raw = await api.patch(`/content/faqs/${id}/`, patch);
    const updated = normFaq(raw);
    write({ ...read(), faqs: read().faqs.map((f) => (f.id === id ? updated : f)) });
    return { ok: true, faq: updated };
  } catch (err) { return { ok: false, error: err }; }
}
export async function removeFaqAsync(id) {
  try {
    await api.delete(`/content/faqs/${id}/`);
    write({ ...read(), faqs: read().faqs.filter((f) => f.id !== id) });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ── Page editors ──────────────────────────────────────────
async function updatePageAsync(section, patch) {
  try {
    const raw = await api.patch(`/content/${section}/`, patch);
    const updated = normPage(raw, read()[section]);
    write({ ...read(), [section]: updated });
    return { ok: true, section: updated };
  } catch (err) { return { ok: false, error: err }; }
}
export async function updateAboutAsync(p) { return updatePageAsync("about", p); }
export async function updateTermsAsync(p) { return updatePageAsync("terms", p); }
export async function updatePrivacyAsync(p) { return updatePageAsync("privacy", p); }
export async function updateHelpAsync(p) { return updatePageAsync("help", p); }

// ── Hooks ─────────────────────────────────────────────────
export function useContent() {
  const [c, setC] = useState(() => read());
  useEffect(() => {
    hydrateContentFromApi();
    const sync = () => setC(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return c;
}
export function useBanners() { return useContent().banners || []; }
export function useTestimonials() { return useContent().testimonials || []; }
export function useFaqs() { return useContent().faqs || []; }
export function useAbout() { return useContent().about || EMPTY.about; }
export function useTerms() { return useContent().terms || EMPTY.terms; }
export function usePrivacy() { return useContent().privacy || EMPTY.privacy; }
export function useHelp() { return useContent().help || EMPTY.help; }

// Legacy shims
export const DEFAULT_BANNERS = [];
export const DEFAULT_TESTIMONIALS = [];
export const DEFAULT_FAQS = [];
export const DEFAULT_ABOUT = EMPTY.about;
export const DEFAULT_TERMS = EMPTY.terms;
export const DEFAULT_PRIVACY = EMPTY.privacy;
export const DEFAULT_HELP = EMPTY.help;
export const SEED_CONTENT = EMPTY;

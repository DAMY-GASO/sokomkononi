// ============================================================
// contentStore.js — API-only via /api/content/
// + Sections kwa Terms, Privacy, About values + team
// + Testimonials na FAQs zilizoboreshwa
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_content_v1";
const EV = "sokomkononi:content-updated";

const EMPTY = {
  banners: [],
  testimonials: [],
  faqs: [],

  // About — heading, subtext, mission, vision, values (sections), team (sections)
  about: {
    heading: { sw: "", en: "" },
    subtext: { sw: "", en: "" },
    mission: { sw: "", en: "" },
    vision: { sw: "", en: "" },
    values: [],   // sections
    team: [],     // sections
  },

  // Terms — heading, subtitle, sections
  terms: {
    heading: { sw: "Sheria na Masharti", en: "Terms & Conditions" },
    subtitle: { sw: "", en: "" },
    lastUpdated: "",
    sections: [],
  },

  // Privacy — heading, subtitle, sections
  privacy: {
    heading: { sw: "Sera ya Faragha", en: "Privacy Policy" },
    subtitle: { sw: "", en: "" },
    lastUpdated: "",
    sections: [],
  },

  // Help — heading, content
  help: {
    heading: { sw: "", en: "" },
    content: { sw: "", en: "" },
  },
};

// ============================================================
// STORAGE HELPERS
// ============================================================
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

// ============================================================
// NORMALIZERS
// ============================================================
function toBilingual(field, fallback = { sw: "", en: "" }) {
  if (!field) return fallback;
  if (typeof field === "string") return { sw: field, en: field };
  return {
    sw: field.sw || field.en || fallback.sw || "",
    en: field.en || field.sw || fallback.en || "",
  };
}

function normBanner(b) {
  return {
    id: b.id,
    title: toBilingual(b.title),
    subtitle: toBilingual(b.subtitle),
    ctaText: toBilingual(b.cta_text || b.ctaText),
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
    location: t.location || "",
    quote: toBilingual(t.quote),
    avatarUrl: t.avatar_url || t.avatarUrl || null,
    rating: t.rating || 5,
    active: t.active !== false,
    order: t.ordering ?? t.order ?? 0,
  };
}

function normFaq(f) {
  return {
    id: f.id,
    question: toBilingual(f.question),
    answer: toBilingual(f.answer),
    active: f.active !== false,
    order: f.ordering ?? f.order ?? 1,
  };
}

// Section ya Terms/Privacy/About
function normSection(s) {
  if (!s) return null;
  return {
    id: s.id || `section-${Math.random().toString(36).slice(2, 9)}`,
    icon: s.icon || "FileText",
    title: toBilingual(s.title),
    subtitle: toBilingual(s.subtitle),
    content: {
      sw: Array.isArray(s.content?.sw) ? s.content.sw : (s.content?.sw ? [s.content.sw] : []),
      en: Array.isArray(s.content?.en) ? s.content.en : (s.content?.en ? [s.content.en] : []),
    },
  };
}

function normPageWithSections(raw, fallback) {
  if (!raw) return fallback;
  return {
    heading: toBilingual(raw.heading, fallback.heading),
    subtitle: toBilingual(raw.subtitle, fallback.subtitle || { sw: "", en: "" }),
    lastUpdated: raw.lastUpdated || raw.updated_at || "",
    sections: Array.isArray(raw.sections)
      ? raw.sections.map(normSection).filter(Boolean)
      : fallback.sections || [],
  };
}

function normAbout(raw) {
  if (!raw) return EMPTY.about;
  return {
    heading: toBilingual(raw.heading, EMPTY.about.heading),
    subtext: toBilingual(raw.subtext, EMPTY.about.subtext),
    mission: toBilingual(raw.mission, EMPTY.about.mission),
    vision: toBilingual(raw.vision, EMPTY.about.vision),
    values: Array.isArray(raw.values)
      ? raw.values.map(normSection).filter(Boolean)
      : [],
    team: Array.isArray(raw.team)
      ? raw.team.map(normSection).filter(Boolean)
      : [],
    lastUpdated: raw.lastUpdated || raw.updated_at || "",
  };
}

function normHelp(raw) {
  if (!raw) return EMPTY.help;
  return {
    heading: toBilingual(raw.heading, EMPTY.help.heading),
    content: toBilingual(raw.content, EMPTY.help.content),
    lastUpdated: raw.lastUpdated || raw.updated_at || "",
  };
}

function normFull(raw) {
  return {
    banners: (raw.banners || []).map(normBanner),
    testimonials: (raw.testimonials || []).map(normTestimonial),
    faqs: (raw.faqs || []).map(normFaq),
    about: normAbout(raw.about),
    terms: normPageWithSections(raw.terms, EMPTY.terms),
    privacy: normPageWithSections(raw.privacy, EMPTY.privacy),
    help: normHelp(raw.help),
  };
}

// ============================================================
// SYNCHRONOUS READS
// ============================================================
export function getContent() { return read(); }
export function getBanners() { return read().banners || []; }
export function getTestimonials() { return read().testimonials || []; }
export function getFaqs() { return read().faqs || []; }
export function getAbout() { return read().about || EMPTY.about; }
export function getTerms() { return read().terms || EMPTY.terms; }
export function getPrivacy() { return read().privacy || EMPTY.privacy; }
export function getHelp() { return read().help || EMPTY.help; }

// ============================================================
// HYDRATE
// ============================================================
export async function hydrateContentFromApi() {
  try {
    const data = await api.get("/content/");
    write(normFull(data || {}));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// BANNERS
// ============================================================
export async function addBannerAsync(form) {
  try {
    const raw = await api.post("/admin/content/banners/", {
      title: form.title,
      subtitle: form.subtitle,
      cta_text: form.ctaText,
      cta_link: form.ctaLink,
      image_url: form.imageUrl,
      active: form.active !== false,
      ordering: form.order ?? 1,
    });
    const created = normBanner(raw);
    write({ ...read(), banners: [...read().banners, created] });
    return { ok: true, banner: created };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateBannerAsync(id, patch) {
  try {
    const body = {};
    if (patch.title != null) body.title = patch.title;
    if (patch.subtitle != null) body.subtitle = patch.subtitle;
    if (patch.ctaText != null) body.cta_text = patch.ctaText;
    if (patch.ctaLink != null) body.cta_link = patch.ctaLink;
    if (patch.imageUrl != null) body.image_url = patch.imageUrl;
    if (patch.active != null) body.active = patch.active;
    if (patch.order != null) body.ordering = patch.order;

    const raw = await api.patch(`/admin/content/banners/${id}/`, body);
    const updated = normBanner(raw);
    write({ ...read(), banners: read().banners.map((b) => (b.id === id ? updated : b)) });
    return { ok: true, banner: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeBannerAsync(id) {
  try {
    await api.delete(`/admin/content/banners/${id}/`);
    write({ ...read(), banners: read().banners.filter((b) => b.id !== id) });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ============================================================
// TESTIMONIALS
// ============================================================
export async function addTestimonialAsync(form) {
  try {
    const raw = await api.post("/admin/content/testimonials/", {
      name: form.name,
      location: form.location || "",
      quote: form.quote,
      rating: form.rating ?? 5,
      avatar_url: form.avatarUrl || null,
      active: form.active !== false,
    });
    const created = normTestimonial(raw);
    write({ ...read(), testimonials: [...read().testimonials, created] });
    return { ok: true, testimonial: created };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateTestimonialAsync(id, patch) {
  try {
    const body = {};
    if (patch.name != null) body.name = patch.name;
    if (patch.location != null) body.location = patch.location;
    if (patch.quote != null) body.quote = patch.quote;
    if (patch.rating != null) body.rating = patch.rating;
    if (patch.avatarUrl != null) body.avatar_url = patch.avatarUrl;
    if (patch.active != null) body.active = patch.active;

    const raw = await api.patch(`/admin/content/testimonials/${id}/`, body);
    const updated = normTestimonial(raw);
    write({ ...read(), testimonials: read().testimonials.map((t) => (t.id === id ? updated : t)) });
    return { ok: true, testimonial: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeTestimonialAsync(id) {
  try {
    await api.delete(`/admin/content/testimonials/${id}/`);
    write({ ...read(), testimonials: read().testimonials.filter((t) => t.id !== id) });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ============================================================
// FAQS
// ============================================================
export async function addFaqAsync(form) {
  try {
    const raw = await api.post("/admin/content/faqs/", {
      question: form.question,
      answer: form.answer,
      active: form.active !== false,
      ordering: form.order ?? 999,
    });
    const created = normFaq(raw);
    write({ ...read(), faqs: [...read().faqs, created] });
    return { ok: true, faq: created };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateFaqAsync(id, patch) {
  try {
    const body = {};
    if (patch.question != null) body.question = patch.question;
    if (patch.answer != null) body.answer = patch.answer;
    if (patch.active != null) body.active = patch.active;
    if (patch.order != null) body.ordering = patch.order;

    const raw = await api.patch(`/admin/content/faqs/${id}/`, body);
    const updated = normFaq(raw);
    write({ ...read(), faqs: read().faqs.map((f) => (f.id === id ? updated : f)) });
    return { ok: true, faq: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeFaqAsync(id) {
  try {
    await api.delete(`/admin/content/faqs/${id}/`);
    write({ ...read(), faqs: read().faqs.filter((f) => f.id !== id) });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ============================================================
// PAGE EDITORS
// ============================================================
async function updatePageAsync(section, patch) {
  try {
    const raw = await api.patch(`/admin/content/${section}/`, patch);
    let updated;
    if (section === "about") updated = normAbout(raw);
    else if (section === "help") updated = normHelp(raw);
    else updated = normPageWithSections(raw, read()[section]);

    write({ ...read(), [section]: updated });
    return { ok: true, section: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateAboutAsync(p) { return updatePageAsync("about", p); }
export async function updateTermsAsync(p) { return updatePageAsync("terms", p); }
export async function updatePrivacyAsync(p) { return updatePageAsync("privacy", p); }
export async function updateHelpAsync(p) { return updatePageAsync("help", p); }

// ============================================================
// HOOKS
// ============================================================
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

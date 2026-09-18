// ============================================================
// contentStore.js — API-backed via /api/content/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_content_v1";
const UPDATE_EVENT = "sokomkononi:content-updated";

export const DEFAULT_BANNERS = [];
export const DEFAULT_TESTIMONIALS = [];
export const DEFAULT_FAQS = [];

export const DEFAULT_ABOUT = {
  heading: { sw: "Kuhusu SokoMkononi", en: "About SokoMkononi" },
  subtext: { sw: "", en: "" },
  mission: { sw: "", en: "" },
  values: [],
};
export const DEFAULT_TERMS = { heading: { sw: "", en: "" }, content: { sw: "", en: "" } };
export const DEFAULT_PRIVACY = { heading: { sw: "", en: "" }, content: { sw: "", en: "" } };
export const DEFAULT_HELP = { heading: { sw: "", en: "" }, content: { sw: "", en: "" } };

export const SEED_CONTENT = {
  banners: DEFAULT_BANNERS,
  testimonials: DEFAULT_TESTIMONIALS,
  faqs: DEFAULT_FAQS,
  about: DEFAULT_ABOUT,
  terms: DEFAULT_TERMS,
  privacy: DEFAULT_PRIVACY,
  help: DEFAULT_HELP,
};

function readFromStorage() {
  if (typeof window === "undefined") return SEED_CONTENT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_CONTENT;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return SEED_CONTENT;
    return { ...SEED_CONTENT, ...parsed };
  } catch {
    return SEED_CONTENT;
  }
}

function saveAll(content) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function normalizeFromApi(raw) {
  if (!raw || typeof raw !== "object") return SEED_CONTENT;
  const buildKeyBlock = (block) => {
    if (!block) return null;
    return {
      heading: block.heading || { sw: "", en: "" },
      content: block.content || { sw: "", en: "" },
      extra: block.extra || {},
      lastUpdated: block.updated_at,
    };
  };
  return {
    banners: (raw.banners || []).map((b) => ({
      id: b.id,
      title: b.title || { sw: "", en: "" },
      subtitle: b.subtitle || { sw: "", en: "" },
      ctaText: b.ctaText || { sw: "", en: "" },
      ctaLink: b.cta_link || "",
      imageUrl: b.image_url || null,
      active: !!b.active,
      order: b.order ?? 1,
    })),
    testimonials: (raw.testimonials || []).map((t) => ({
      id: t.id,
      name: t.name,
      quote: t.quote || { sw: "", en: "" },
      avatarUrl: t.avatar_url || null,
      rating: t.rating || 5,
      active: !!t.active,
    })),
    faqs: (raw.faqs || []).map((f) => ({
      id: f.id,
      question: f.question || { sw: "", en: "" },
      answer: f.answer || { sw: "", en: "" },
      active: !!f.active,
      order: f.order ?? 1,
    })),
    about: buildKeyBlock(raw.about) || DEFAULT_ABOUT,
    terms: buildKeyBlock(raw.terms) || DEFAULT_TERMS,
    privacy: buildKeyBlock(raw.privacy) || DEFAULT_PRIVACY,
    help: buildKeyBlock(raw.help) || DEFAULT_HELP,
  };
}

export function getContent() {
  return readFromStorage();
}

export async function hydrateContentFromApi() {
  try {
    const data = await api.get("/content/");
    const normalized = normalizeFromApi(data);
    saveAll(normalized);
    return { source: "api" };
  } catch (err) {
    console.warn("[contentStore] hydrate failed:", err);
    return { source: "error" };
  }
}

export function getBanners() { return getContent().banners || []; }
export function getTestimonials() { return getContent().testimonials || []; }
export function getFaqs() { return getContent().faqs || []; }
export function getAbout() { return getContent().about || DEFAULT_ABOUT; }
export function getTerms() { return getContent().terms || DEFAULT_TERMS; }
export function getPrivacy() { return getContent().privacy || DEFAULT_PRIVACY; }
export function getHelp() { return getContent().help || DEFAULT_HELP; }

export function addBanner(banner) {
  const current = getContent();
  const entry = { id: `local_${Date.now()}`, active: true, order: 1, ...banner };
  saveAll({ ...current, banners: [...(current.banners || []), entry] });
  return entry;
}
export function updateBanner(id, patch) {
  const current = getContent();
  const next = { ...current, banners: (current.banners || []).map((b) => b.id === id ? { ...b, ...patch } : b) };
  saveAll(next); return next;
}
export function removeBanner(id) {
  const current = getContent();
  const next = { ...current, banners: (current.banners || []).filter((b) => b.id !== id) };
  saveAll(next); return next;
}
export function addTestimonial(t) {
  const current = getContent();
  const entry = { id: `local_${Date.now()}`, rating: 5, active: true, ...t };
  saveAll({ ...current, testimonials: [...(current.testimonials || []), entry] });
  return entry;
}
export function updateTestimonial(id, patch) {
  const current = getContent();
  const next = { ...current, testimonials: (current.testimonials || []).map((x) => x.id === id ? { ...x, ...patch } : x) };
  saveAll(next); return next;
}
export function removeTestimonial(id) {
  const current = getContent();
  const next = { ...current, testimonials: (current.testimonials || []).filter((x) => x.id !== id) };
  saveAll(next); return next;
}
export function addFaq(f) {
  const current = getContent();
  const entry = { id: `local_${Date.now()}`, active: true, order: 1, ...f };
  saveAll({ ...current, faqs: [...(current.faqs || []), entry] });
  return entry;
}
export function updateFaq(id, patch) {
  const current = getContent();
  const next = { ...current, faqs: (current.faqs || []).map((x) => x.id === id ? { ...x, ...patch } : x) };
  saveAll(next); return next;
}
export function removeFaq(id) {
  const current = getContent();
  const next = { ...current, faqs: (current.faqs || []).filter((x) => x.id !== id) };
  saveAll(next); return next;
}
export function updateAbout(patch) {
  const current = getContent();
  const next = { ...current, about: { ...current.about, ...patch, lastUpdated: new Date().toISOString() } };
  saveAll(next); return next;
}
export function updateTerms(patch) {
  const current = getContent();
  const next = { ...current, terms: { ...current.terms, ...patch, lastUpdated: new Date().toISOString() } };
  saveAll(next); return next;
}
export function updatePrivacy(patch) {
  const current = getContent();
  const next = { ...current, privacy: { ...current.privacy, ...patch, lastUpdated: new Date().toISOString() } };
  saveAll(next); return next;
}
export function updateHelp(patch) {
  const current = getContent();
  const next = { ...current, help: { ...current.help, ...patch, lastUpdated: new Date().toISOString() } };
  saveAll(next); return next;
}

export function useContent() {
  const [content, setContent] = useState(() => getContent());
  useEffect(() => {
    hydrateContentFromApi();
    const sync = () => setContent(getContent());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return content;
}

export function useBanners() { return useContent().banners || []; }
export function useTestimonials() { return useContent().testimonials || []; }
export function useFaqs() { return useContent().faqs || []; }
export function useAbout() { return useContent().about || DEFAULT_ABOUT; }
export function useTerms() { return useContent().terms || DEFAULT_TERMS; }
export function usePrivacy() { return useContent().privacy || DEFAULT_PRIVACY; }
export function useHelp() { return useContent().help || DEFAULT_HELP; }

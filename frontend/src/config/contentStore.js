// ============================================================
// contentStore.js
// CHANZO KIMOJA CHA UKWELI kwa Content Management.
//
// Admin anaweza kubadilisha:
//   - Homepage banners
//   - Testimonials
//   - FAQs
//   - About SokoMkononi
//   - Terms & Conditions
//   - Privacy Policy
//   - Help/Support content
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useContent) hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_content_v1";
const UPDATE_EVENT = "sokomkononi:content-updated";

// ============================================================
// DEFAULT CONTENT — seed kwa kila kipengele
// ============================================================
export const DEFAULT_BANNERS = [
  {
    id: "banner_1",
    imageUrl: null,
    title: { sw: "Karibu SokoMkononi", en: "Welcome to SokoMkononi" },
    subtitle: {
      sw: "Nunua na uza mali kwa urahisi Tanzania",
      en: "Buy and sell property easily in Tanzania",
    },
    ctaText: { sw: "Anza Sasa", en: "Get Started" },
    ctaLink: "/tafuta",
    active: true,
    order: 1,
  },
];

export const DEFAULT_TESTIMONIALS = [
  {
    id: "test_1",
    name: "Mary, Dar es Salaam",
    quote: {
      sw: "Nilinunua nyumba yangu kwa urahisi kupitia SokoMkononi. Mchakato wote ulikuwa rahisi na salama.",
      en: "I bought my house easily through SokoMkononi. The whole process was simple and secure.",
    },
    avatarUrl: null,
    rating: 5,
    active: true,
  },
];

export const DEFAULT_FAQS = [
  {
    id: "faq_1",
    question: { sw: "Je, SokoMkononi ni salama?", en: "Is SokoMkononi safe?" },
    answer: {
      sw: "Ndio, tuna mfumo wa uthibitishaji wa wauzaji na wanunuzi, pamoja na Deal Rooms zinazolindwa.",
      en: "Yes, we have a verification system for sellers and buyers, plus protected Deal Rooms.",
    },
    active: true,
    order: 1,
  },
  {
    id: "faq_2",
    question: { sw: "Ninawezaje kuuza mali yangu?", en: "How can I sell my property?" },
    answer: {
      sw: "Bonyeza 'Uza Sasa', jaza taarifa za mali yako, na lipa Listing Fee ili ichapishwe.",
      en: "Click 'Sell Now', fill in your property details, and pay the Listing Fee to publish it.",
    },
    active: true,
    order: 2,
  },
];

export const DEFAULT_ABOUT = {
  heading: { sw: "Kuhusu SokoMkononi", en: "About SokoMkononi" },
  subtext: {
    sw: "Tunaunganisha wanunuzi na wauzaji wa mali kote Tanzania kwa urahisi na uwazi.",
    en: "We connect property buyers and sellers across Tanzania with ease and transparency.",
  },
  mission: {
    sw: "SokoMkononi ilianzishwa kwa lengo moja: kufanya ununuzi na uuzaji wa mali kuwa rahisi, salama na wa kuaminika kwa kila Mtanzania.",
    en: "SokoMkononi was founded with one goal: to make buying and selling property simple, safe, and trustworthy for every Tanzanian.",
  },
  values: [
    {
      id: "val_1",
      title: { sw: "Uwazi", en: "Transparency" },
      body: {
        sw: "Taarifa zote za mali na bei zinaonyeshwa wazi bila kuficha gharama za ziada.",
        en: "All property details and prices are shown clearly with no hidden extra costs.",
      },
    },
    {
      id: "val_2",
      title: { sw: "Usalama", en: "Safety" },
      body: {
        sw: "Kila muuzaji na mnunuzi anathibitishwa kabla ya kuruhusiwa kufanya muamala.",
        en: "Every seller and buyer is verified before being allowed to complete a transaction.",
      },
    },
    {
      id: "val_3",
      title: { sw: "Ubunifu", en: "Innovation" },
      body: {
        sw: "Tunatumia teknolojia kurahisisha mchakato mzima wa kununua na kuuza mali.",
        en: "We use technology to simplify the entire process of buying and selling property.",
      },
    },
  ],
};

export const DEFAULT_TERMS = {
  heading: { sw: "Vigezo vya Matumizi", en: "Terms of Use" },
  content: {
    sw: "Kwa kutumia SokoMkononi, unakubaliana na vigezo vifuatavyo...\n\n1. Akaunti yako ni ya kibinafsi.\n2. Mali zote zinaheshimu sheria za Tanzania.\n3. Malipo yote yanafanywa kupitia njia salama.",
    en: "By using SokoMkononi, you agree to the following terms...\n\n1. Your account is personal.\n2. All listings comply with Tanzanian law.\n3. All payments are made through secure channels.",
  },
  lastUpdated: new Date().toISOString(),
};

export const DEFAULT_PRIVACY = {
  heading: { sw: "Sera ya Faragha", en: "Privacy Policy" },
  content: {
    sw: "Tunajali faragha yako. Hatuuzi taarifa zako kwa mtu yeyote...",
    en: "We care about your privacy. We don't sell your data to anyone...",
  },
  lastUpdated: new Date().toISOString(),
};

export const DEFAULT_HELP = {
  heading: { sw: "Msaada", en: "Help & Support" },
  content: {
    sw: "Unahitaji msaada? Wasiliana nasi kupitia support@sokomkononi.co.tz au +255 700 000 000.",
    en: "Need help? Contact us at support@sokomkononi.co.tz or +255 700 000 000.",
  },
  lastUpdated: new Date().toISOString(),
};

// ============================================================
// SEED — default values
// ============================================================
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

// ============================================================
// HELPERS — per section
// ============================================================

/** Soma content yote. */
export function getContent() {
  return readFromStorage();
}

// --- Banners ---
export function getBanners() {
  return readFromStorage().banners || [];
}

export function addBanner(banner) {
  const current = getContent();
  const entry = {
    id: `banner_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    imageUrl: null,
    title: { sw: "", en: "" },
    subtitle: { sw: "", en: "" },
    ctaText: { sw: "", en: "" },
    ctaLink: "",
    active: true,
    order: (current.banners?.length || 0) + 1,
    ...banner,
  };
  const next = { ...current, banners: [...(current.banners || []), entry] };
  saveAll(next);
  return entry;
}

export function updateBanner(id, patch) {
  const current = getContent();
  const next = {
    ...current,
    banners: (current.banners || []).map((b) =>
      b.id === id ? { ...b, ...patch } : b
    ),
  };
  saveAll(next);
  return next;
}

export function removeBanner(id) {
  const current = getContent();
  const next = {
    ...current,
    banners: (current.banners || []).filter((b) => b.id !== id),
  };
  saveAll(next);
  return next;
}

// --- Testimonials ---
export function getTestimonials() {
  return readFromStorage().testimonials || [];
}

export function addTestimonial(testimonial) {
  const current = getContent();
  const entry = {
    id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    quote: { sw: "", en: "" },
    avatarUrl: null,
    rating: 5,
    active: true,
    ...testimonial,
  };
  const next = {
    ...current,
    testimonials: [...(current.testimonials || []), entry],
  };
  saveAll(next);
  return entry;
}

export function updateTestimonial(id, patch) {
  const current = getContent();
  const next = {
    ...current,
    testimonials: (current.testimonials || []).map((t) =>
      t.id === id ? { ...t, ...patch } : t
    ),
  };
  saveAll(next);
  return next;
}

export function removeTestimonial(id) {
  const current = getContent();
  const next = {
    ...current,
    testimonials: (current.testimonials || []).filter((t) => t.id !== id),
  };
  saveAll(next);
  return next;
}

// --- FAQs ---
export function getFaqs() {
  return readFromStorage().faqs || [];
}

export function addFaq(faq) {
  const current = getContent();
  const entry = {
    id: `faq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    question: { sw: "", en: "" },
    answer: { sw: "", en: "" },
    active: true,
    order: (current.faqs?.length || 0) + 1,
    ...faq,
  };
  const next = { ...current, faqs: [...(current.faqs || []), entry] };
  saveAll(next);
  return entry;
}

export function updateFaq(id, patch) {
  const current = getContent();
  const next = {
    ...current,
    faqs: (current.faqs || []).map((f) => (f.id === id ? { ...f, ...patch } : f)),
  };
  saveAll(next);
  return next;
}

export function removeFaq(id) {
  const current = getContent();
  const next = {
    ...current,
    faqs: (current.faqs || []).filter((f) => f.id !== id),
  };
  saveAll(next);
  return next;
}

// --- About ---
export function getAbout() {
  return readFromStorage().about || DEFAULT_ABOUT;
}

export function updateAbout(patch) {
  const current = getContent();
  const next = { ...current, about: { ...current.about, ...patch } };
  saveAll(next);
  return next;
}

// --- Terms ---
export function getTerms() {
  return readFromStorage().terms || DEFAULT_TERMS;
}

export function updateTerms(patch) {
  const current = getContent();
  const next = {
    ...current,
    terms: { ...current.terms, ...patch, lastUpdated: new Date().toISOString() },
  };
  saveAll(next);
  return next;
}

// --- Privacy ---
export function getPrivacy() {
  return readFromStorage().privacy || DEFAULT_PRIVACY;
}

export function updatePrivacy(patch) {
  const current = getContent();
  const next = {
    ...current,
    privacy: { ...current.privacy, ...patch, lastUpdated: new Date().toISOString() },
  };
  saveAll(next);
  return next;
}

// --- Help ---
export function getHelp() {
  return readFromStorage().help || DEFAULT_HELP;
}

export function updateHelp(patch) {
  const current = getContent();
  const next = {
    ...current,
    help: { ...current.help, ...patch, lastUpdated: new Date().toISOString() },
  };
  saveAll(next);
  return next;
}

// ============================================================
// HOOKS
// ============================================================
export function useContent() {
  const [content, setContent] = useState(() => getContent());

  useEffect(() => {
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

export function useBanners() {
  return useContent().banners || [];
}

export function useTestimonials() {
  return useContent().testimonials || [];
}

export function useFaqs() {
  return useContent().faqs || [];
}

export function useAbout() {
  return useContent().about || DEFAULT_ABOUT;
}

export function useTerms() {
  return useContent().terms || DEFAULT_TERMS;
}

export function usePrivacy() {
  return useContent().privacy || DEFAULT_PRIVACY;
}

export function useHelp() {
  return useContent().help || DEFAULT_HELP;
}

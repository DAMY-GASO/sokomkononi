// ============================================================
// categoriesStore.js
// FIX: initializeCategories() now seeds from CATEGORY_TRANSLATIONS
//      so a fresh install / offline backend still renders categories.
// FIX: categories zisizo kwenye seed (mf. zilizoongezwa kupitia admin)
//      sasa zinahifadhi jina la Kiingereza (label override) kwa hiyo
//      lugha inabadilika ipasavyo.
// FIX: Translations (name_en, description_en) zinasomwa kutoka
//      `extra` field kwa sababu backend haina fields za lugha mbili.
// NEW: mashine (pekee), fashion, jobs, mali-nyinginezo, huduma.
// ============================================================
import { useEffect, useState } from "react";
import {
  Home, Trees, Car, Briefcase, Wrench, Truck, Bike, Bus, Sofa,
  Tv, PawPrint, Refrigerator, ShoppingBag, Building2, Package,
  Ship, Plane, Store, Factory, Bed,
  Shirt, Users, Boxes, HandHelping,
} from "lucide-react";
import { categoriesApi } from "../api/categories.js";
import { api } from "../api/client.js";
import { CATEGORY_EXTRA, getPostingConfig } from "./categorySchemas.js";

export { getPostingConfig };

const STORAGE_KEY = "sokomkononi_categories_v2";
const LABELS_KEY = "sokomkononi_category_labels_v1"; // { [key]: { label, description } }
const UPDATE_EVENT = "sokomkononi:categories-updated";

const CATEGORY_TRANSLATIONS = {
  nyumba: {
    label: { sw: "Nyumba & Majengo", en: "Houses & Buildings" },
    description: { sw: "Pata nyumba, apartments, na majengo yote Tanzania", en: "Find houses, apartments, and buildings across Tanzania" },
    iconKey: "Home",
    extra: CATEGORY_EXTRA["nyumba"] || [],
  },
  viwanja: {
    label: { sw: "Viwanja & Mashamba", en: "Plots & Land" },
    description: { sw: "Viwanja vya makazi, kilimo, na biashara", en: "Residential, agricultural, and commercial plots" },
    iconKey: "Trees",
    extra: CATEGORY_EXTRA["viwanja"] || [],
  },
  magari: {
    label: { sw: "Magari", en: "Cars" },
    description: { sw: "Magari mapya na yaliyotumika Tanzania", en: "New and used cars in Tanzania" },
    iconKey: "Car",
    extra: CATEGORY_EXTRA["magari"] || [],
  },
  biashara: {
    label: { sw: "Biashara Zinazouzwa", en: "Businesses for Sale" },
    description: { sw: "Biashara zinazouzwa - maduka, migahawa, n.k.", en: "Businesses for sale - shops, restaurants, etc." },
    iconKey: "Briefcase",
    extra: CATEGORY_EXTRA["biashara"] || [],
  },
  mashine: {
    label: { sw: "Mashine", en: "Machinery" },
    description: { sw: "Mashine za kuchapa, kudarizi, kilimo, na viwanda", en: "Printing, embroidering, agricultural, and industrial machinery" },
    iconKey: "Wrench",
    extra: CATEGORY_EXTRA["mashine"] || [],
  },
  "vifaa-vizito": {
    label: { sw: "Vifaa vizito", en: "Heavy Equipment" },
    description: { sw: "Vifaa vizito vya ujenzi, kilimo, na viwanda", en: "Construction, agricultural, and industrial heavy equipment" },
    iconKey: "Wrench",
    extra: CATEGORY_EXTRA["vifaa-vizito"] || [],
  },
  pikipiki: {
    label: { sw: "Pikipiki", en: "Motorcycles" },
    description: { sw: "Pikipiki za aina zote Tanzania", en: "All types of motorcycles in Tanzania" },
    iconKey: "Bike",
    extra: CATEGORY_EXTRA["pikipiki"] || [],
  },
  mabasi: {
    label: { sw: "Mabasi", en: "Buses" },
    description: { sw: "Mabasi ya abiria na mizigo", en: "Passenger and cargo buses" },
    iconKey: "Bus",
    extra: CATEGORY_EXTRA["mabasi"] || [],
  },
  samani: {
    label: { sw: "Samani", en: "Furniture" },
    description: { sw: "Samani za nyumbani na ofisi", en: "Home and office furniture" },
    iconKey: "Sofa",
    extra: CATEGORY_EXTRA["samani"] || [],
  },
  "vifaa-vya-elektroniki": {
    label: { sw: "Vifaa vya Elektroniki", en: "Electronics" },
    description: { sw: "Simu, kompyuta, TV na vifaa vingine", en: "Phones, computers, TVs and other electronics" },
    iconKey: "Tv",
    extra: CATEGORY_EXTRA["vifaa-vya-elektroniki"] || [],
  },
  mifugo: {
    label: { sw: "Mifugo", en: "Livestock" },
    description: { sw: "Ng'ombe, mbuzi, kuku na mifugo mingine", en: "Cows, goats, chickens and other livestock" },
    iconKey: "PawPrint",
    extra: CATEGORY_EXTRA["mifugo"] || [],
  },
  "vifaa-vya-nyumbani": {
    label: { sw: "Vifaa vya Nyumbani", en: "Home Appliances" },
    description: { sw: "Friji, jiko, mashine za kufulia", en: "Fridges, stoves, washing machines" },
    iconKey: "Refrigerator",
    extra: CATEGORY_EXTRA["vifaa-vya-nyumbani"] || [],
  },
  fashion: {
    label: { sw: "Fashion", en: "Fashion" },
    description: { sw: "Nguo, viatu, mikoba na vifaa vya urembo", en: "Clothes, shoes, bags and accessories" },
    iconKey: "Shirt",
    extra: CATEGORY_EXTRA["fashion"] || [],
  },
  jobs: {
    label: { sw: "Ajira", en: "Jobs" },
    description: { sw: "Nafasi za kazi na watafuta kazi Tanzania", en: "Job openings and job seekers in Tanzania" },
    iconKey: "Users",
    extra: CATEGORY_EXTRA["jobs"] || [],
  },
  "mali-nyinginezo": {
    label: { sw: "Mali Nyinginezo", en: "Other Items" },
    description: { sw: "Mali na bidhaa nyingine zisizo kwenye kategoria zilizopo", en: "Other items that don't fit any existing category" },
    iconKey: "Boxes",
    extra: CATEGORY_EXTRA["mali-nyinginezo"] || [],
  },
  huduma: {
    label: { sw: "Huduma", en: "Services" },
    description: { sw: "Huduma za kitaalamu na za kila siku", en: "Professional and everyday services" },
    iconKey: "HandHelping",
    extra: CATEGORY_EXTRA["huduma"] || [],
  },
};

const SEED_LABEL_BY_KEY = Object.fromEntries(Object.entries(CATEGORY_TRANSLATIONS).map(([k, v]) => [k, v.label]));
const SEED_DESCRIPTION_BY_KEY = Object.fromEntries(Object.entries(CATEGORY_TRANSLATIONS).map(([k, v]) => [k, v.description]));
const SEED_ICON_BY_KEY = Object.fromEntries(Object.entries(CATEGORY_TRANSLATIONS).map(([k, v]) => [k, v.iconKey]));
const SEED_EXTRA_BY_KEY = Object.fromEntries(Object.entries(CATEGORY_TRANSLATIONS).map(([k, v]) => [k, v.extra]));

/** The fallback list used on a fresh install / backend 404. */
export const SEED_CATEGORIES = Object.entries(CATEGORY_TRANSLATIONS).map(([key, v], idx) => ({
  id: null,
  key,
  slug: key,
  name: v.label.sw,
  label: v.label,
  description: v.description,
  iconKey: v.iconKey,
  imageUrl: null,
  isPopular: true,
  active: true,
  ordering: idx,
  extra: v.extra,
}));

export const BACKEND_SLUG_TO_SEED_KEY = {
  // Canonical
  "nyumba-majengo": "nyumba",
  "viwanja-mashamba": "viwanja",
  "magari": "magari",
  "biashara-zinazouzwa": "biashara",
  "mashine-heavy-equipment": "mashine",
  "pikipiki": "pikipiki",
  "mabasi": "mabasi",
  "samani": "samani",
  "vifaa-vya-elektroniki": "vifaa-vya-elektroniki",
  "mifugo": "mifugo",
  "vifaa-vya-nyumbani": "vifaa-vya-nyumbani",

  // Aliases from English admin labels
  "houses-buildings": "nyumba",
  "houses--buildings": "nyumba",
  "nyumba--majengo": "nyumba",
  "plots-land": "viwanja",
  "viwanja--mashamba": "viwanja",
  "businesses-for-sale": "biashara",
  "business-for-sale": "biashara",
  "biashara--zinazouzwa": "biashara",
  "machinery-heavy-equipment": "mashine",
  "mashine--heavy-equipment": "mashine",
  "cars": "magari",
  "motorcycles": "pikipiki",
  "buses": "mabasi",
  "furniture": "samani",
  "electronics": "vifaa-vya-elektroniki",
  "livestock": "mifugo",
  "home-appliances": "vifaa-vya-nyumbani",
  "vifaa--vya-elektroniki": "vifaa-vya-elektroniki",
  "vifaa--vya-nyumbani": "vifaa-vya-nyumbani",

  // New categories
  "fashion": "fashion",
  "mavazi": "fashion",
  "jobs": "jobs",
  "job": "jobs",
  "ajira": "jobs",
  "kazi": "jobs",
  "mali-nyinginezo": "mali-nyinginezo",
  "mali-nyingine": "mali-nyinginezo",
  "other": "mali-nyinginezo",
  "others": "mali-nyinginezo",
  "other-items": "mali-nyinginezo",
  "huduma": "huduma",
  "services": "huduma",
  "vifaa-vizito": "vifaa-vizito",
  "heavy-equipment": "vifaa-vizito",
  "service": "huduma",
};

export const AVAILABLE_ICONS = {
  Home, Trees, Car, Briefcase, Wrench, Truck, Bike, Bus, Sofa, Tv,
  PawPrint, Refrigerator, ShoppingBag, Building2, Package, Ship,
  Plane, Store, Factory, Bed,
  Shirt, Users, Boxes, HandHelping,
};

export function getCategoryIcon(iconKey) {
  return AVAILABLE_ICONS[iconKey] || Home;
}

function readFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ── Label overrides: majina ya categories zisizo kwenye seed ─────────
// Backend inahifadhi jina moja tu (`name`). Ili Kiingereza kisipotee,
// tunakihifadhi hapa (localStorage) kwa kila key.
function readLabelOverrides() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LABELS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
}
function saveLabelOverride(key, { label, description }) {
  if (typeof window === "undefined" || !key) return;
  try {
    const all = readLabelOverrides();
    all[key] = { label: label || all[key]?.label, description: description || all[key]?.description };
    window.localStorage.setItem(LABELS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export function getCategories() { return readFromStorage(); }
export function getActiveCategories() { return getCategories().filter((c) => c.active !== false); }
export function getPopularCategories() {
  return getCategories().filter((c) => c.active !== false && c.isPopular === true);
}
export function getCategory(key) {
  if (!key) return null;
  return getCategories().find((c) => c.key === key) || null;
}
export function getCategoryById(id) {
  if (id == null) return null;
  return getCategories().find((c) => c.id === id || String(c.id) === String(id)) || null;
}
export function getCategoryIdByKey(key) {
  const cat = getCategory(key);
  return cat?.id ?? null;
}
export function getCategoryLabel(key, lang = "sw") {
  const cat = getCategory(key);
  if (!cat) return key;
  return cat.label?.[lang] || cat.label?.sw || key;
}
export function getCategoryExtra(key) {
  const cat = getCategory(key);
  if (!cat || !Array.isArray(cat.extra)) return [];
  return cat.extra;
}
export function getCategoryFieldLabel(field, lang = "sw") {
  return field?.label?.[lang] || field?.label?.sw || field?.key || "";
}
export function getCategoryFieldPlaceholder(field, lang = "sw") {
  return field?.placeholder?.[lang] || field?.placeholder?.sw || "";
}
export function getCategoryOptionLabel(option, lang = "sw") {
  return option?.label?.[lang] || option?.label?.sw || option?.value || "";
}

/**
 * FIX: if a list is passed, use it as the initial seed.
 * If nothing is stored yet, fall back to SEED_CATEGORIES.
 */
export function initializeCategories(list) {
  const current = getCategories();
  if (current.length > 0) return current;

  const seed = Array.isArray(list) && list.length > 0 ? list : SEED_CATEGORIES;
  saveAll(seed);
  return seed;
}

export function resetCategories(list) {
  if (!Array.isArray(list)) return getCategories();
  saveAll(list);
  return list;
}

async function tryApi(apiCall, { onSuccess, onFail, optimistic, previous }) {
  try {
    const raw = await apiCall();
    onSuccess(raw);
    return { ok: true, data: raw };
  } catch (err) {
    if (err?.status === 404 || err?.status === 501) {
      console.warn("[categoriesStore] backend haipo — local-only:", err.status);
      return { ok: true, warning: "local_only", data: optimistic };
    }
    onFail(err);
    return { ok: false, error: err };
  }
}

// ── Backend payload ──────────────────────────────────────────────────
// Backend haina `name_en` / `description_en` fields. Tunahifadhi
// translations kwenye `extra` (JSONField) ili admin aweze kuhariri
// lugha zote mbili kupitia admin panel.
function toBackendPayload(category) {
  const existingExtra =
    category.extra && typeof category.extra === "object" && !Array.isArray(category.extra)
      ? category.extra
      : {};

  return {
    name: category.label?.sw || category.key,
    slug: category.key,
    description: category.description?.sw || "",
    icon_key: category.iconKey || "",
    image_url: category.imageUrl || "",
    is_popular: !!category.isPopular,
    is_active: category.active !== false,
    // ⬇️ Translations zimehifadhiwa kwenye extra
    extra: {
      ...existingExtra,
      name_en: category.label?.en || "",
      description_en: category.description?.en || "",
    },
  };
}

export async function addCategoryAsync(category) {
  if (!category?.key) return { ok: false, error: new Error("key inahitajika") };
  const current = getCategories();
  if (current.some((c) => c.key === category.key)) {
    return { ok: false, error: new Error(`Category "${category.key}" ipo tayari`) };
  }
  const optimistic = { imageUrl: null, isPopular: false, active: true, extra: [], ...category };
  saveLabelOverride(category.key, category);
  saveAll([...current, optimistic]);

  return tryApi(
    () => api.post("/categories/", toBackendPayload(category)),
    {
      optimistic, previous: current,
      onSuccess: (raw) => {
        const created = normalizeCategoryFromApi(raw);
        if (created) {
          saveAll([
            ...current.filter((c) => c.key !== category.key),
            { ...created, ...preserveExtras(optimistic, created) },
          ]);
        }
      },
      onFail: () => saveAll(current),
    }
  );
}

export async function updateCategoryAsync(key, patch) {
  const current = getCategories();
  const target = current.find((c) => c.key === key);
  if (!target) return { ok: false, error: new Error("Category haipo") };
  const optimistic = { ...target, ...patch };
  if (patch.label || patch.description) saveLabelOverride(key, optimistic);
  saveAll(current.map((c) => (c.key === key ? optimistic : c)));

  if (!target.id) return { ok: true, warning: "local_only", category: optimistic };

  return tryApi(
    () => api.patch(`/categories/${target.id}/`, toBackendPayload(optimistic)),
    {
      optimistic, previous: current,
      onSuccess: (raw) => {
        const updated = normalizeCategoryFromApi(raw);
        if (updated) {
          saveAll(
            current.map((c) =>
              c.key === key ? { ...updated, ...preserveExtras(optimistic, updated) } : c
            )
          );
        }
      },
      onFail: () => saveAll(current),
    }
  );
}

export async function removeCategoryAsync(key) {
  const current = getCategories();
  const target = current.find((c) => c.key === key);
  if (!target) return { ok: false, error: new Error("Category haipo") };
  saveAll(current.filter((c) => c.key !== key));
  if (!target.id) return { ok: true, warning: "local_only" };

  return tryApi(
    () => api.delete(`/categories/${target.id}/`),
    { optimistic: null, previous: current, onSuccess: () => {}, onFail: () => saveAll(current) }
  );
}

export async function toggleCategoryActiveAsync(key) {
  const target = getCategory(key);
  if (!target) return { ok: false, error: new Error("Category haipo") };
  return updateCategoryAsync(key, { active: !target.active });
}
export async function toggleCategoryPopularAsync(key) {
  const target = getCategory(key);
  if (!target) return { ok: false, error: new Error("Category haipo") };
  return updateCategoryAsync(key, { isPopular: !target.isPopular });
}
export async function updateCategoryImageAsync(key, imageUrl) {
  return updateCategoryAsync(key, { imageUrl });
}

export function addCategory(category) {
  const current = getCategories();
  if (current.some((c) => c.key === category.key)) {
    throw new Error(`Category "${category.key}" already exists`);
  }
  const newCat = { imageUrl: null, isPopular: false, active: true, extra: [], ...category };
  saveAll([...current, newCat]);
  return [...current, newCat];
}
export function updateCategory(key, patch) {
  const current = getCategories();
  const next = current.map((c) => (c.key === key ? { ...c, ...patch } : c));
  saveAll(next);
  return next;
}
export function toggleCategoryActive(key) {
  const current = getCategories();
  const next = current.map((c) =>
    c.key === key ? { ...c, active: c.active === false ? true : false } : c
  );
  saveAll(next);
  return next;
}
export function toggleCategoryPopular(key) {
  const current = getCategories();
  const next = current.map((c) => (c.key === key ? { ...c, isPopular: !c.isPopular } : c));
  saveAll(next);
  return next;
}
export function removeCategory(key, listingsCount = 0) {
  if (listingsCount > 0) {
    return {
      success: false,
      error: "HAS_LISTINGS",
      listingsCount,
      message: `Kuna listings ${listingsCount} zenye category hii. Ondoa/kwamisha listings hizo kwanza.`,
    };
  }
  const current = getCategories();
  const next = current.filter((c) => c.key !== key);
  saveAll(next);
  return { success: true, categories: next };
}
export function updateCategoryImage(key, imageUrl) { return updateCategory(key, { imageUrl }); }
export function hasCategoryImage(category) {
  return Boolean(category?.imageUrl && category.imageUrl.length > 0);
}

function toSlug(str) {
  return String(str || "").trim().toLowerCase()
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function normalizeCategoryFromApi(raw) {
  if (!raw) return null;
  const name = raw.name || "";
  const slug = raw.slug || toSlug(name);
  const seedKey = BACKEND_SLUG_TO_SEED_KEY[slug] || slug;

  // `key` is the frontend-canonical short form (matches SEED_CATEGORIES).
  // `slug` keeps the backend form for API lookups.
  //
  // MAJINA YA ADMIN YANA NGUVU:
  //   sw → jina la backend (admin akihariri, linaonekana)
  //   en → extra.name_en ya backend → override ya admin (localStorage)
  //        → name_en ya backend → seed → name
  // Seed inatumika tu kama admin hajaweka kitu.
  //
  // Kumbuka: Backend haina `name_en` field. Translations zimehifadhiwa
  // kwenye `extra.name_en` na `extra.description_en`.
  const override = readLabelOverrides()[seedKey] || {};
  const seedLabel = SEED_LABEL_BY_KEY[seedKey];
  const seedDesc = SEED_DESCRIPTION_BY_KEY[seedKey];

  // ⬇️ Soma translations kutoka: extra.name_en → raw.name_en → override → seed → name
  const extraData =
    raw.extra && typeof raw.extra === "object" && !Array.isArray(raw.extra)
      ? raw.extra
      : {};
  const nameEn =
    extraData.name_en || raw.name_en || override.label?.en || seedLabel?.en || name;
  const descEn =
    extraData.description_en ||
    raw.description_en ||
    override.description?.en ||
    seedDesc?.en ||
    raw.description ||
    "";

  const label = {
    sw: name || override.label?.sw || seedLabel?.sw || "",
    en: nameEn,
  };
  const description = {
    sw: raw.description || override.description?.sw || seedDesc?.sw || "",
    en: descEn,
  };

  return {
    id: raw.id,
    key: seedKey,
    slug,
    name,
    label,
    description,
    iconKey: raw.icon_key || SEED_ICON_BY_KEY[seedKey] || "Home",
    imageUrl: raw.image_url || null,
    isPopular: !!raw.is_popular,
    active: raw.is_active !== false,
    ordering: raw.ordering ?? 0,
    extra: SEED_EXTRA_BY_KEY[seedKey] || [],
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function preserveExtras(optimistic, fromApi) {
  return {
    extra: optimistic?.extra || fromApi?.extra || [],
    iconKey: optimistic?.iconKey || fromApi?.iconKey || "Home",
    imageUrl: optimistic?.imageUrl || fromApi?.imageUrl || null,
    isPopular: optimistic?.isPopular ?? fromApi?.isPopular ?? false,
    label: optimistic?.label || fromApi?.label,
    description: optimistic?.description || fromApi?.description,
  };
}

export async function hydrateCategoriesFromApi() {
  try {
    const data = await categoriesApi.list({ page_size: 100 });
    const rawList = Array.isArray(data) ? data : data?.results || [];
    if (!rawList.length) {
      const seeded = initializeCategories();
      return { source: "seed", count: seeded.length };
    }

    // Kategoria zilizorudishwa na backend
    const normalized = rawList.map(normalizeCategoryFromApi).filter(Boolean);
    const apiKeys = new Set(normalized.map((c) => c.key));

    // Kategoria za seed ambazo HAZIPO kwenye API (bado backend haijaziweka)
    // Hii inahakikisha kategoria zote zinaonekana hata kama backend haijasasishwa.
    const seedOnly = SEED_CATEGORIES
      .filter((c) => !apiKeys.has(c.key))
      .map((c) => ({ ...c, id: null }));

    // Merge: API + seed-only, bila duplicates
    const merged = [...normalized, ...seedOnly];

    // Panga kwa `ordering`
    merged.sort((a, b) => {
      const ao = a.ordering ?? 999;
      const bo = b.ordering ?? 999;
      if (ao !== bo) return ao - bo;
      return String(a.key).localeCompare(String(b.key));
    });

    saveAll(merged);
    return { source: "api+seed", count: merged.length };
  } catch (err) {
    console.warn("[categoriesStore] hydrate failed:", err);
    const seeded = initializeCategories();
    return { source: "error", count: seeded.length };
  }
}

export function useCategories() {
  const [list, setList] = useState(() => getCategories());
  useEffect(() => {
    if (getCategories().length === 0) initializeCategories();
    hydrateCategoriesFromApi();
    const sync = () => setList(getCategories());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return list;
}

export function useActiveCategories() {
  return useCategories().filter((c) => c.active !== false);
}
export function usePopularCategories() {
  return useCategories().filter((c) => c.active !== false && c.isPopular === true);
}
export function useCategory(key) {
  const list = useCategories();
  if (!key) return null;
  return list.find((c) => c.key === key) || null;
}


/**
 * Convert a backend category slug ("nyumba-majengo") into the
 * frontend-canonical seed key ("nyumba"). Falls back to the slug
 * unchanged when there is no mapping.
 */
export function getSeedKeyFromSlug(slug) {
  if (!slug) return slug;
  // Normalize: lowercase, trim, collapse multiple dashes to one.
  const norm = String(slug).trim().toLowerCase().replace(/-{2,}/g, "-");
  if (BACKEND_SLUG_TO_SEED_KEY[norm]) return BACKEND_SLUG_TO_SEED_KEY[norm];

  // Second pass: strip ALL dashes and try both map keys and seed keys.
  const stripped = norm.replace(/-/g, "");
  for (const [k, v] of Object.entries(BACKEND_SLUG_TO_SEED_KEY)) {
    if (k.replace(/-/g, "") === stripped) return v;
  }

  // Third pass: if the slug already matches a seed key, return it.
  if (SEED_CATEGORIES.some((c) => c.key === norm)) return norm;

  // Give up — return the normalized slug so at least the display is clean.
  return norm;
}

/**
 * True when a fee-rule key (or any slug) belongs to a real category.
 */
export function isKnownCategoryKey(maybeSlug) {
  const seedKey = getSeedKeyFromSlug(maybeSlug);
  return SEED_CATEGORIES.some((c) => c.key === seedKey);
}

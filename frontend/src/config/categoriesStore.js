// ============================================================
// categoriesStore.js
// API-backed + graceful local fallback
// ============================================================
import { useEffect, useState } from "react";
import {
  Home, Trees, Car, Briefcase, Wrench, Truck, Bike, Bus, Sofa,
  Tv, PawPrint, Refrigerator, ShoppingBag, Building2, Package,
  Ship, Plane, Store, Factory, Bed,
} from "lucide-react";
import { categoriesApi } from "../api/categories.js";
import { api } from "../api/client.js";

const STORAGE_KEY = "sokomkononi_categories_v2";
const UPDATE_EVENT = "sokomkononi:categories-updated";

// ============================================================
// OPTIONS ZENYE BILINGUAL — reusable kwenye extra[] fields
// ============================================================
const TITLE_STATUS_OPTIONS = [
  { value: "Hati Miliki", label: { sw: "Hati Miliki", en: "Freehold Title" } },
  { value: "Hati ya Kimila", label: { sw: "Hati ya Kimila", en: "Customary Title" } },
  { value: "Inasubiri Hati", label: { sw: "Inasubiri Hati", en: "Title Pending" } },
  { value: "Hakuna Hati", label: { sw: "Hakuna Hati", en: "No Title" } },
];
const LAND_USE_OPTIONS = [
  { value: "Makazi", label: { sw: "Makazi", en: "Residential" } },
  { value: "Makazi na Biashara", label: { sw: "Makazi na Biashara", en: "Residential and Commercial" } },
  { value: "Kilimo", label: { sw: "Kilimo", en: "Agricultural" } },
  { value: "Biashara", label: { sw: "Biashara", en: "Commercial" } },
  { value: "Viwanda", label: { sw: "Viwanda", en: "Industrial" } },
];
const TRANSMISSION_OPTIONS = [
  { value: "Automatic", label: { sw: "Automatic", en: "Automatic" } },
  { value: "Manual", label: { sw: "Manual", en: "Manual" } },
];
const FUEL_OPTIONS = [
  { value: "Petrol", label: { sw: "Petrol", en: "Petrol" } },
  { value: "Diesel", label: { sw: "Diesel", en: "Diesel" } },
  { value: "Hybrid", label: { sw: "Hybrid", en: "Hybrid" } },
  { value: "Umeme (EV)", label: { sw: "Umeme (EV)", en: "Electric (EV)" } },
];
const CONDITION_OPTIONS = [
  { value: "Mpya", label: { sw: "Mpya", en: "New" } },
  { value: "Nzuri Sana", label: { sw: "Nzuri Sana", en: "Excellent" } },
  { value: "Nzuri", label: { sw: "Nzuri", en: "Good" } },
  { value: "Inahitaji Matengenezo", label: { sw: "Inahitaji Matengenezo", en: "Needs Repair" } },
];

// ============================================================
// BILINGUAL TRANSLATIONS + DEFAULTS — imewekwa hapa moja kwa moja
// (si file tofauti) kwa sababu backend haitumi bilingual (name
// moja tu) wala haihifadhi icon/extra-filter-fields. Hii ndiyo
// "chanzo cha ukweli" cha label/description/iconKey/extra kwa
// categories 11 za awali. Category mpya kabisa (isiyo hapa chini)
// itaendelea kutumia jina moja + icon ya default mpaka backend
// yenyewe iongezewe field hizi.
// ============================================================
const CATEGORY_TRANSLATIONS = {
  nyumba: {
    label: { sw: "Nyumba & Majengo", en: "Houses & Buildings" },
    description: {
      sw: "Pata nyumba, apartments, na majengo yote Tanzania",
      en: "Find houses, apartments, and buildings across Tanzania",
    },
    iconKey: "Home",
    extra: [
      { key: "vyumba", label: { sw: "Vyumba vya kulala", en: "Bedrooms" }, type: "number", placeholder: { sw: "mfano: 3", en: "e.g. 3" } },
      { key: "bafu", label: { sw: "Bafu", en: "Bathrooms" }, type: "number", placeholder: { sw: "mfano: 2", en: "e.g. 2" } },
      { key: "ukubwa", label: { sw: "Ukubwa (sqm)", en: "Size (sqm)" }, type: "text", placeholder: { sw: "mfano: 250 sqm", en: "e.g. 250 sqm" } },
      { key: "title", label: { sw: "Hati (Title Status)", en: "Title Status" }, type: "select", options: TITLE_STATUS_OPTIONS },
    ],
  },
  viwanja: {
    label: { sw: "Viwanja & Mashamba", en: "Plots & Land" },
    description: {
      sw: "Viwanja vya makazi, kilimo, na biashara",
      en: "Residential, agricultural, and commercial plots",
    },
    iconKey: "Trees",
    extra: [
      { key: "ukubwa", label: { sw: "Ukubwa wa Eneo", en: "Plot Size" }, type: "text", placeholder: { sw: "mfano: nusu ekari", en: "e.g. half acre" } },
      { key: "title", label: { sw: "Hati / Title Status", en: "Title Status" }, type: "select", options: TITLE_STATUS_OPTIONS },
      { key: "matumizi", label: { sw: "Matumizi ya Ardhi", en: "Land Use" }, type: "select", options: LAND_USE_OPTIONS },
    ],
  },
  magari: {
    label: { sw: "Magari", en: "Cars" },
    description: {
      sw: "Magari mapya na yaliyotumika Tanzania",
      en: "New and used cars in Tanzania",
    },
    iconKey: "Car",
    extra: [
      { key: "make_model", label: { sw: "Make / Model / Mwaka", en: "Make / Model / Year" }, type: "text", placeholder: { sw: "mfano: Toyota Harrier 2016", en: "e.g. Toyota Harrier 2016" } },
      { key: "mileage", label: { sw: "Mileage (km)", en: "Mileage (km)" }, type: "number", placeholder: { sw: "mfano: 85000", en: "e.g. 85000" } },
      { key: "transmission", label: { sw: "Transmission", en: "Transmission" }, type: "select", options: TRANSMISSION_OPTIONS },
      { key: "mafuta", label: { sw: "Aina ya Mafuta", en: "Fuel Type" }, type: "select", options: FUEL_OPTIONS },
    ],
  },
  biashara: {
    label: { sw: "Biashara Zinazouzwa", en: "Businesses for Sale" },
    description: {
      sw: "Biashara zinazouzwa - maduka, migahawa, n.k.",
      en: "Businesses for sale - shops, restaurants, etc.",
    },
    iconKey: "Briefcase",
    extra: [
      { key: "aina", label: { sw: "Aina ya Biashara", en: "Business Type" }, type: "text", placeholder: { sw: "mfano: Duka la vifaa vya ujenzi", en: "e.g. Hardware store" } },
      { key: "mapato", label: { sw: "Mapato ya Wastani (kwa mwezi)", en: "Average Monthly Revenue" }, type: "text", placeholder: { sw: "TZS ...", en: "TZS ..." } },
      { key: "muda", label: { sw: "Muda Biashara Ikiwepo", en: "Business Age" }, type: "text", placeholder: { sw: "mfano: miaka 4", en: "e.g. 4 years" } },
    ],
  },
  mashine: {
    label: { sw: "Mashine", en: "Machinery" },
    description: {
      sw: "Mashine za kuchapa, na kudarizi",
      en: "Printing, and embroiding machinery",
    },
    iconKey: "Wrench",
    extra: [
      { key: "aina", label: { sw: "Aina ya Mashine", en: "Machine Type" }, type: "text", placeholder: { sw: "mfano: Mashine ya kudarizi", en: "e.g. embroidery machine" } },
      { key: "hours", label: { sw: "Saa za Matumizi", en: "Usage Hours" }, type: "number", placeholder: { sw: "mfano: 3200", en: "e.g. 3200" } },
      { key: "hali", label: { sw: "Hali", en: "Condition" }, type: "select", options: CONDITION_OPTIONS },
    ],
  },
  "vifaa-vizito": {
    label: { sw: "Vifaa vizito", en: "Heavy Equipment" },
    description: {
      sw: "Mashine za kilimo, na viwanda",
      en: "Construction, agricultural, and industrial machinery",
    },
    iconKey: "Wrench",
    extra: [
      { key: "aina", label: { sw: "Aina ya kifaa", en: "Heavy equipment Type" }, type: "text", placeholder: { sw: "mfano: Excavator", en: "e.g. Excavator" } },
      { key: "hours", label: { sw: "Saa za Matumizi", en: "Usage Hours" }, type: "number", placeholder: { sw: "mfano: 3200", en: "e.g. 3200" } },
      { key: "hali", label: { sw: "Hali", en: "Condition" }, type: "select", options: CONDITION_OPTIONS },
    ],
  },
  pikipiki: {
    label: { sw: "Pikipiki", en: "Motorcycles" },
    description: { sw: "Pikipiki za aina zote Tanzania", en: "All types of motorcycles in Tanzania" },
    iconKey: "Bike",
    extra: [],
  },
  mabasi: {
    label: { sw: "Mabasi", en: "Buses" },
    description: { sw: "Mabasi ya abiria na mizigo", en: "Passenger and cargo buses" },
    iconKey: "Bus",
    extra: [],
  },
  samani: {
    label: { sw: "Samani", en: "Furniture" },
    description: { sw: "Samani za nyumbani na ofisi", en: "Home and office furniture" },
    iconKey: "Sofa",
    extra: [],
  },
  "vifaa-vya-elektroniki": {
    label: { sw: "Vifaa vya Elektroniki", en: "Electronics" },
    description: {
      sw: "Simu, kompyuta, TV na vifaa vingine vya elektroniki",
      en: "Phones, computers, TVs and other electronics",
    },
    iconKey: "Tv",
    extra: [],
  },
  mifugo: {
    label: { sw: "Mifugo", en: "Livestock" },
    description: { sw: "Ng'ombe, mbuzi, kuku na mifugo mingine", en: "Cows, goats, chickens and other livestock" },
    iconKey: "PawPrint",
    extra: [],
  },
  "vifaa-vya-nyumbani": {
    label: { sw: "Vifaa vya Nyumbani", en: "Home Appliances" },
    description: {
      sw: "Friji, jiko, mashine za kufulia na vifaa vingine",
      en: "Fridges, stoves, washing machines and other appliances",
    },
    iconKey: "Refrigerator",
    extra: [],
  },
};

const SEED_LABEL_BY_KEY = Object.fromEntries(
  Object.entries(CATEGORY_TRANSLATIONS).map(([key, v]) => [key, v.label])
);
const SEED_DESCRIPTION_BY_KEY = Object.fromEntries(
  Object.entries(CATEGORY_TRANSLATIONS).map(([key, v]) => [key, v.description])
);
const SEED_ICON_BY_KEY = Object.fromEntries(
  Object.entries(CATEGORY_TRANSLATIONS).map(([key, v]) => [key, v.iconKey])
);
const SEED_EXTRA_BY_KEY = Object.fromEntries(
  Object.entries(CATEGORY_TRANSLATIONS).map(([key, v]) => [key, v.extra])
);

// ============================================================
// BACKEND SLUG -> SEED KEY
// Django hutengeneza slug kutoka jina LOTE (ikiwemo "&", "/"),
// kwa hiyo hailingani na key fupi za seed moja kwa moja isipokuwa
// kwa bahati (mfano "magari" === "magari"). Mapping hii ni ya
// mkono kwa sababu hiyo. NB: backend ina "Mashine / Heavy
// Equipment" kama category MOJA inayounganisha "mashine" na
// "vifaa-vizito" za seed — kwa sasa zote zinaelekezwa "mashine".
// Ukigawanya tena backend-side baadaye, ongeza mstari mpya hapa.
// ============================================================
const BACKEND_SLUG_TO_SEED_KEY = {
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
};

// ============================================================
// AVAILABLE ICONS
// ============================================================
export const AVAILABLE_ICONS = {
  Home, Trees, Car, Briefcase, Wrench, Truck, Bike, Bus, Sofa, Tv,
  PawPrint, Refrigerator, ShoppingBag, Building2, Package, Ship,
  Plane, Store, Factory, Bed,
};

export function getCategoryIcon(iconKey) {
  return AVAILABLE_ICONS[iconKey] || Home;
}

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// HELPERS
// ============================================================
export function getCategories() {
  return readFromStorage();
}

export function getActiveCategories() {
  return getCategories().filter((c) => c.active !== false);
}

export function getPopularCategories() {
  return getCategories().filter(
    (c) => c.active !== false && c.isPopular === true
  );
}

export function getCategory(key) {
  if (!key) return null;
  return getCategories().find((c) => c.key === key) || null;
}

export function getCategoryById(id) {
  if (id == null) return null;
  return (
    getCategories().find((c) => c.id === id || String(c.id) === String(id)) ||
    null
  );
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

// ============================================================
// INITIALIZE
// ============================================================
export function initializeCategories(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return getCategories();
  }
  const current = getCategories();
  if (current.length > 0) {
    return current;
  }
  saveAll(list);
  return list;
}

export function resetCategories(list) {
  if (!Array.isArray(list)) return getCategories();
  saveAll(list);
  return list;
}

// ============================================================
// GRACEFUL API HELPER
// Inajaribu API; kama 404 → local-only fallback.
// ============================================================
async function tryApi(apiCall, { onSuccess, onFail, optimistic, previous }) {
  try {
    const raw = await apiCall();
    onSuccess(raw);
    return { ok: true, data: raw };
  } catch (err) {
    if (err?.status === 404 || err?.status === 501) {
      // Backend haipo bado — kaa local-only
      console.warn("[categoriesStore] backend haipo — local-only:", err.status);
      return { ok: true, warning: "local_only", data: optimistic };
    }
    // Error nyingine — rollback
    onFail(err);
    return { ok: false, error: err };
  }
}

// ============================================================
// PAYLOAD MAPPER — internal (bilingual) shape -> backend (flat) shape
// Backend (Django) haina bilingual fields — ina `name`/`description`
// string moja tu, na field names ni snake_case. Tunatumia Kiswahili
// (sw) kama "chanzo cha ukweli" cha `name`/`description` kwa
// backend; Kiingereza kinabaki upande wa frontend pekee (BACKEND_SLUG_TO_SEED_KEY
// / seed lookup) mpaka backend iongezwe field za bilingual (name_en, n.k).
// ============================================================
function toBackendPayload(category) {
  return {
    name: category.label?.sw || category.key,
    slug: category.key,
    description: category.description?.sw || "",
    icon_key: category.iconKey || "",
    image_url: category.imageUrl || "",
    is_popular: !!category.isPopular,
    is_active: category.active !== false,
  };
}

// ============================================================
// ASYNC MUTATIONS — Categories
// ============================================================
export async function addCategoryAsync(category) {
  if (!category?.key) {
    return { ok: false, error: new Error("key inahitajika") };
  }

  const current = getCategories();
  if (current.some((c) => c.key === category.key)) {
    return { ok: false, error: new Error(`Category "${category.key}" ipo tayari`) };
  }

  const optimistic = {
    imageUrl: null,
    isPopular: false,
    active: true,
    extra: [],
    ...category,
  };
  saveAll([...current, optimistic]);

  return tryApi(
    () => api.post("/categories/", toBackendPayload(category)),
    {
      optimistic,
      previous: current,
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
  if (!target) {
    return { ok: false, error: new Error("Category haipo") };
  }

  const optimistic = { ...target, ...patch };
  saveAll(current.map((c) => (c.key === key ? optimistic : c)));

  // Kama haina backend ID — local-only
  if (!target.id) {
    return { ok: true, warning: "local_only", category: optimistic };
  }

  return tryApi(
    () => api.patch(`/categories/${target.id}/`, toBackendPayload(optimistic)),
    {
      optimistic,
      previous: current,
      onSuccess: (raw) => {
        const updated = normalizeCategoryFromApi(raw);
        if (updated) {
          saveAll(
            current.map((c) =>
              c.key === key
                ? { ...updated, ...preserveExtras(optimistic, updated) }
                : c
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
  if (!target) {
    return { ok: false, error: new Error("Category haipo") };
  }

  saveAll(current.filter((c) => c.key !== key));

  if (!target.id) return { ok: true, warning: "local_only" };

  return tryApi(
    () => api.delete(`/categories/${target.id}/`),
    {
      optimistic: null,
      previous: current,
      onSuccess: () => {},
      onFail: () => saveAll(current),
    }
  );
}

export async function toggleCategoryActiveAsync(key) {
  const target = getCategory(key);
  if (!target) return { ok: false, error: new Error("Category haipo") };

  return updateCategoryAsync(key, { active: target.active === false });
}

export async function toggleCategoryPopularAsync(key) {
  const target = getCategory(key);
  if (!target) return { ok: false, error: new Error("Category haipo") };

  return updateCategoryAsync(key, { isPopular: !target.isPopular });
}

export async function updateCategoryImageAsync(key, imageUrl) {
  return updateCategoryAsync(key, { imageUrl });
}

// ============================================================
// LEGACY SYNC (deprecated)
// ============================================================
export function addCategory(category) {
  const current = getCategories();
  if (current.some((c) => c.key === category.key)) {
    throw new Error(`Category "${category.key}" already exists`);
  }
  const newCat = {
    imageUrl: null, isPopular: false, active: true, extra: [], ...category,
  };
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
  const next = current.map((c) =>
    c.key === key ? { ...c, isPopular: !c.isPopular } : c
  );
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

export function updateCategoryImage(key, imageUrl) {
  return updateCategory(key, { imageUrl });
}

export function hasCategoryImage(category) {
  return Boolean(category?.imageUrl && category.imageUrl.length > 0);
}

// ============================================================
// NORMALIZER
// ============================================================
function toSlug(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function normalizeCategoryFromApi(raw) {
  if (!raw) return null;
  const name = raw.name || "";
  const slug = raw.slug || toSlug(name);
  const seedKey = BACKEND_SLUG_TO_SEED_KEY[slug] || slug;
  return {
    id: raw.id,
    key: slug,
    slug,
    name,
    label: SEED_LABEL_BY_KEY[seedKey] || { sw: name, en: name },
    description: SEED_DESCRIPTION_BY_KEY[seedKey] || {
      sw: raw.description || "",
      en: raw.description || "",
    },
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

// Hifadhi extras za seed (iconKey, imageUrl, extra) wakati API inarudisha data
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

// ============================================================
// HYDRATE
// ============================================================
export async function hydrateCategoriesFromApi() {
  try {
    const data = await categoriesApi.list({ page_size: 100 });
    const rawList = Array.isArray(data) ? data : data?.results || [];
    if (!rawList.length) {
      return { source: "seed", count: getCategories().length };
    }

    const normalized = rawList.map(normalizeCategoryFromApi).filter(Boolean);

    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[categoriesStore] hydrate failed:", err);
    return { source: "error", count: getCategories().length };
  }
}

// ============================================================
// HOOKS
// ============================================================
export function useCategories() {
  const [list, setList] = useState(() => getCategories());
  useEffect(() => {
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
  const list = useCategories();
  return list.filter((c) => c.active !== false);
}

export function usePopularCategories() {
  const list = useCategories();
  return list.filter((c) => c.active !== false && c.isPopular === true);
}

export function useCategory(key) {
  const list = useCategories();
  if (!key) return null;
  return list.find((c) => c.key === key) || null;
}

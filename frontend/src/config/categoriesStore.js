// ============================================================
// categoriesStore.js
// CHANZO KIMOJA CHA UKWELI kwa categories za SokoMkononi.
//
// Awali, categories zilikuwa hardcoded sehemu 5 tofauti:
//   - shared.js (CATEGORIES, 5)
//   - CategoryPage.jsx (CATEGORY_INFO, 5)
//   - HomePage.jsx (categories, 10)
//   - Navbar.jsx (defaultCategories, 4)
//   - BrowseProperties.jsx (CATEGORY_ICONS, 5)
//
// Sasa zote zinasoma kutoka hapa. Admin anaweza:
//   - Kuongeza category mpya
//   - Kubadilisha label/description/icon/imageUrl/fields
//   - Kuweka isPopular (inaonekana HomePage + Navbar)
//   - Kuzima (active: false) bila kufuta
//   - Kufuta — LAKINI tu ikiwa hakuna listings zenye category hiyo
//
// PICHA: Kila category ina `imageUrl` (base64 data URL kwa demo,
// Cloudinary/S3 URL baada ya backend). Kama imageUrl ni null, UI
// inaonyesha icon (fallback) kutoka `iconKey`.
//
// LISTING FEE: Kila category mpya LAZIMA iwe na fee config kwenye
// listingFeeStore. Kama haipo, calculateListingFee inarudi
// { fee: null, error: "NO_FEE_CONFIG" } — UI inapaswa kumuelekeza
// Admin kwenye Revenue > Listing Fee.
// ============================================================

import { useEffect, useState } from "react";
import {
  Home,
  Trees,
  Car,
  Briefcase,
  Wrench,
  Truck,
  Bike,
  Bus,
  Sofa,
  Tv,
  PawPrint,
  Refrigerator,
  ShoppingBag,
  Building2,
  Package,
  Ship,
  Plane,
  Store,
  Factory,
  Bed,
} from "lucide-react";

const STORAGE_KEY = "sokomkononi_categories_v1";
const UPDATE_EVENT = "sokomkononi:categories-updated";

// ============================================================
// ICONS ZINAZOPATIKANA kwa Admin kuchagua (fallback)
// ============================================================
export const AVAILABLE_ICONS = {
  Home,
  Trees,
  Car,
  Briefcase,
  Wrench,
  Truck,
  Bike,
  Bus,
  Sofa,
  Tv,
  PawPrint,
  Refrigerator,
  ShoppingBag,
  Building2,
  Package,
  Ship,
  Plane,
  Store,
  Factory,
  Bed,
};

export function getCategoryIcon(iconKey) {
  return AVAILABLE_ICONS[iconKey] || Home;
}

// ============================================================
// SEED CATEGORIES (10)
// ============================================================
export const SEED_CATEGORIES = [
  {
    key: "nyumba",
    imageUrl: null,
    label: { sw: "Nyumba & Majengo", en: "Houses & Buildings" },
    description: {
      sw: "Pata nyumba, apartments, na majengo yote Tanzania",
      en: "Find houses, apartments, and buildings across Tanzania",
    },
    iconKey: "Home",
    isPopular: true,
    active: true,
    extra: [
      { key: "vyumba", label: "Vyumba vya kulala", type: "number", placeholder: "mfano: 3" },
      { key: "bafu", label: "Bafu", type: "number", placeholder: "mfano: 2" },
      { key: "ukubwa", label: "Ukubwa (sqm)", type: "text", placeholder: "mfano: 250 sqm" },
      { key: "title", label: "Hati (Title Status)", type: "select", options: ["Hati Miliki", "Hati ya Kimila", "Inasubiri Hati", "Hakuna Hati"] },
    ],
  },
  {
    key: "viwanja",
    imageUrl: null,
    label: { sw: "Viwanja & Mashamba", en: "Plots & Land" },
    description: {
      sw: "Viwanja vya makazi, kilimo, na biashara",
      en: "Residential, agricultural, and commercial plots",
    },
    iconKey: "Trees",
    isPopular: true,
    active: true,
    extra: [
      { key: "ukubwa", label: "Ukubwa wa Eneo", type: "text", placeholder: "mfano: nusu ekari" },
      { key: "title", label: "Hati / Title Status", type: "select", options: ["Hati Miliki", "Hati ya Kimila", "Inasubiri Hati", "Hakuna Hati"] },
      { key: "matumizi", label: "Matumizi ya Ardhi", type: "select", options: ["Makazi", "Kilimo", "Biashara", "Viwanda"] },
    ],
  },
  {
    key: "magari",
    imageUrl: null,
    label: { sw: "Magari", en: "Cars" },
    description: {
      sw: "Magari mapya na yaliyotumika Tanzania",
      en: "New and used cars in Tanzania",
    },
    iconKey: "Car",
    isPopular: true,
    active: true,
    extra: [
      { key: "make_model", label: "Make / Model / Mwaka", type: "text", placeholder: "mfano: Toyota Harrier 2016" },
      { key: "mileage", label: "Mileage (km)", type: "number", placeholder: "mfano: 85000" },
      { key: "transmission", label: "Transmission", type: "select", options: ["Automatic", "Manual"] },
      { key: "mafuta", label: "Aina ya Mafuta", type: "select", options: ["Petrol", "Diesel", "Hybrid", "Umeme (EV)"] },
    ],
  },
  {
    key: "biashara",
    imageUrl: null,
    label: { sw: "Biashara Zinazouzwa", en: "Businesses for Sale" },
    description: {
      sw: "Biashara zinazouzwa - maduka, migahawa, n.k.",
      en: "Businesses for sale - shops, restaurants, etc.",
    },
    iconKey: "Briefcase",
    isPopular: true,
    active: true,
    extra: [
      { key: "aina", label: "Aina ya Biashara", type: "text", placeholder: "mfano: Duka la vifaa vya ujenzi" },
      { key: "mapato", label: "Mapato ya Wastani (kwa mwezi)", type: "text", placeholder: "TZS ..." },
      { key: "muda", label: "Muda Biashara Ikiwepo", type: "text", placeholder: "mfano: miaka 4" },
    ],
  },
  {
    key: "mashine",
    imageUrl: null,
    label: { sw: "Mashine / Heavy Equipment", en: "Machinery / Heavy Equipment" },
    description: {
      sw: "Mashine za ujenzi, kilimo, na viwanda",
      en: "Construction, agricultural, and industrial machinery",
    },
    iconKey: "Wrench",
    isPopular: true,
    active: true,
    extra: [
      { key: "aina", label: "Aina ya Mashine", type: "text", placeholder: "mfano: Excavator" },
      { key: "hours", label: "Saa za Matumizi", type: "number", placeholder: "mfano: 3200" },
      { key: "hali", label: "Hali", type: "select", options: ["Mpya", "Nzuri Sana", "Nzuri", "Inahitaji Matengenezo"] },
    ],
  },
  {
    key: "pikipiki",
    imageUrl: null,
    label: { sw: "Pikipiki", en: "Motorcycles" },
    description: {
      sw: "Pikipiki za aina zote Tanzania",
      en: "All types of motorcycles in Tanzania",
    },
    iconKey: "Bike",
    isPopular: true,
    active: true,
    extra: [],
  },
  {
    key: "mabasi",
    imageUrl: null,
    label: { sw: "Mabasi", en: "Buses" },
    description: {
      sw: "Mabasi ya abiria na mizigo",
      en: "Passenger and cargo buses",
    },
    iconKey: "Bus",
    isPopular: true,
    active: true,
    extra: [],
  },
  {
    key: "samani",
    imageUrl: null,
    label: { sw: "Samani", en: "Furniture" },
    description: {
      sw: "Samani za nyumbani na ofisi",
      en: "Home and office furniture",
    },
    iconKey: "Sofa",
    isPopular: true,
    active: true,
    extra: [],
  },
  {
    key: "vifaa-vya-elektroniki",
    imageUrl: null,
    label: { sw: "Vifaa vya Elektroniki", en: "Electronics" },
    description: {
      sw: "Simu, kompyuta, TV na vifaa vingine vya elektroniki",
      en: "Phones, computers, TVs and other electronics",
    },
    iconKey: "Tv",
    isPopular: true,
    active: true,
    extra: [],
  },
  {
    key: "mifugo",
    imageUrl: null,
    label: { sw: "Mifugo", en: "Livestock" },
    description: {
      sw: "Ng'ombe, mbuzi, kuku na mifugo mingine",
      en: "Cows, goats, chickens and other livestock",
    },
    iconKey: "PawPrint",
    isPopular: true,
    active: true,
    extra: [],
  },
  {
    key: "vifaa-vya-nyumbani",
    imageUrl: null,
    label: { sw: "Vifaa vya Nyumbani", en: "Home Appliances" },
    description: {
      sw: "Friji, jiko, mashine za kufulia na vifaa vingine",
      en: "Fridges, stoves, washing machines and other appliances",
    },
    iconKey: "Refrigerator",
    isPopular: true,
    active: true,
    extra: [],
  },
];

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return SEED_CATEGORIES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_CATEGORIES;
    return parsed;
  } catch {
    return SEED_CATEGORIES;
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
  return getCategories().filter((c) => c.active !== false && c.isPopular === true);
}

export function getCategory(key) {
  if (!key) return null;
  return getCategories().find((c) => c.key === key) || null;
}

export function getCategoryLabel(key, lang = "sw") {
  const cat = getCategory(key);
  if (!cat) return key;
  return cat.label?.[lang] || cat.label?.sw || key;
}

// ============================================================
// MUTATIONS (Admin pekee anapaswa kuita hizi)
// ============================================================
export function addCategory(category) {
  const current = getCategories();
  const exists = current.some((c) => c.key === category.key);
  if (exists) {
    throw new Error(`Category "${category.key}" already exists`);
  }
  // Hakikisha imageUrl inahifadhiwa (null kama haipo)
  const newCat = {
    imageUrl: null,
    ...category,
  };
  const next = [...current, newCat];
  saveAll(next);
  return next;
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

/**
 * Kufuta category. Inarudi { success: false, error, listingsCount }
 * kama bado kuna listings zenye category hiyo.
 */
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

// ============================================================
// IMAGE HELPERS
// ============================================================
/**
 * Category ina picha? — inatumika na UI kuamua kama ionyeshe
 * <img> au icon fallback.
 */
export function hasCategoryImage(category) {
  return Boolean(category?.imageUrl && category.imageUrl.length > 0);
}

/**
 * Sasisha picha ya category (base64 data URL kwa demo, Cloudinary URL
 * baada ya backend). Admin pekee anaita hii.
 */
export function updateCategoryImage(key, imageUrl) {
  return updateCategory(key, { imageUrl });
}

// ============================================================
// HOOKS
// ============================================================
export function useCategories() {
  const [list, setList] = useState(() => getCategories());
  useEffect(() => {
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

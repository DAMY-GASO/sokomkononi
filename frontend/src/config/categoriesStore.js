// ============================================================
// categoriesStore.js
// CHANZO KIMOJA CHA UKWELI kwa categories za SokoMkononi.
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useCategories, useActiveCategories,
// usePopularCategories) hazitahitaji kubadilika.
//
// LABELS: `label`, `description`, na `extra[].label` zina { sw, en }.
// `extra[].options` ina array ya { value, label: { sw, en } }.
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
// AVAILABLE ICONS
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
// OPTIONS ZENYE BILINGUAL — reusable
// ============================================================
const TITLE_STATUS_OPTIONS = [
  { value: "Hati Miliki", label: { sw: "Hati Miliki", en: "Freehold Title" } },
  { value: "Hati ya Kimila", label: { sw: "Hati ya Kimila", en: "Customary Title" } },
  { value: "Inasubiri Hati", label: { sw: "Inasubiri Hati", en: "Title Pending" } },
  { value: "Hakuna Hati", label: { sw: "Hakuna Hati", en: "No Title" } },
];

const LAND_USE_OPTIONS = [
  { value: "Makazi", label: { sw: "Makazi", en: "Residential" } },
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
  {
    value: "Inahitaji Matengenezo",
    label: { sw: "Inahitaji Matengenezo", en: "Needs Repair" },
  },
];

// ============================================================
// SEED_CATEGORIES (11) — bilingual kamili
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
      {
        key: "vyumba",
        label: { sw: "Vyumba vya kulala", en: "Bedrooms" },
        type: "number",
        placeholder: { sw: "mfano: 3", en: "e.g. 3" },
      },
      {
        key: "bafu",
        label: { sw: "Bafu", en: "Bathrooms" },
        type: "number",
        placeholder: { sw: "mfano: 2", en: "e.g. 2" },
      },
      {
        key: "ukubwa",
        label: { sw: "Ukubwa (sqm)", en: "Size (sqm)" },
        type: "text",
        placeholder: { sw: "mfano: 250 sqm", en: "e.g. 250 sqm" },
      },
      {
        key: "title",
        label: { sw: "Hati (Title Status)", en: "Title Status" },
        type: "select",
        options: TITLE_STATUS_OPTIONS,
      },
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
      {
        key: "ukubwa",
        label: { sw: "Ukubwa wa Eneo", en: "Plot Size" },
        type: "text",
        placeholder: { sw: "mfano: nusu ekari", en: "e.g. half acre" },
      },
      {
        key: "title",
        label: { sw: "Hati / Title Status", en: "Title Status" },
        type: "select",
        options: TITLE_STATUS_OPTIONS,
      },
      {
        key: "matumizi",
        label: { sw: "Matumizi ya Ardhi", en: "Land Use" },
        type: "select",
        options: LAND_USE_OPTIONS,
      },
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
      {
        key: "make_model",
        label: { sw: "Make / Model / Mwaka", en: "Make / Model / Year" },
        type: "text",
        placeholder: { sw: "mfano: Toyota Harrier 2016", en: "e.g. Toyota Harrier 2016" },
      },
      {
        key: "mileage",
        label: { sw: "Mileage (km)", en: "Mileage (km)" },
        type: "number",
        placeholder: { sw: "mfano: 85000", en: "e.g. 85000" },
      },
      {
        key: "transmission",
        label: { sw: "Transmission", en: "Transmission" },
        type: "select",
        options: TRANSMISSION_OPTIONS,
      },
      {
        key: "mafuta",
        label: { sw: "Aina ya Mafuta", en: "Fuel Type" },
        type: "select",
        options: FUEL_OPTIONS,
      },
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
      {
        key: "aina",
        label: { sw: "Aina ya Biashara", en: "Business Type" },
        type: "text",
        placeholder: { sw: "mfano: Duka la vifaa vya ujenzi", en: "e.g. Hardware store" },
      },
      {
        key: "mapato",
        label: { sw: "Mapato ya Wastani (kwa mwezi)", en: "Average Monthly Revenue" },
        type: "text",
        placeholder: { sw: "TZS ...", en: "TZS ..." },
      },
      {
        key: "muda",
        label: { sw: "Muda Biashara Ikiwepo", en: "Business Age" },
        type: "text",
        placeholder: { sw: "mfano: miaka 4", en: "e.g. 4 years" },
      },
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
      {
        key: "aina",
        label: { sw: "Aina ya Mashine", en: "Machine Type" },
        type: "text",
        placeholder: { sw: "mfano: Excavator", en: "e.g. Excavator" },
      },
      {
        key: "hours",
        label: { sw: "Saa za Matumizi", en: "Usage Hours" },
        type: "number",
        placeholder: { sw: "mfano: 3200", en: "e.g. 3200" },
      },
      {
        key: "hali",
        label: { sw: "Hali", en: "Condition" },
        type: "select",
        options: CONDITION_OPTIONS,
      },
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
    if (!Array.isArray(parsed)) return SEED_CATEGORIES;
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
export function hasCategoryImage(category) {
  return Boolean(category?.imageUrl && category.imageUrl.length > 0);
}

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

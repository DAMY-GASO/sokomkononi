

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

const STORAGE_KEY = "sokomkononi_categories_v2";
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
// INITIALIZE — weka categories za awali MARA MOJA TU
// ============================================================
/**
 * initializeCategories(list) — weka categories za awali.
 *
 * MUHIMU: Kama categories zipo tayari (Admin ameongeza/kubadilisha),
 * function hii HAITAFANYA KITU. Inaheshimu mabadiliko ya Admin.
 *
 * Tumia mara moja kwenye App.jsx:
 *
 *   useEffect(() => {
 *     initializeCategories(SEED_CATEGORIES);
 *   }, []);
 */
export function initializeCategories(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return getCategories();
  }

  // 🛑 Kama categories zipo tayari — usiguse (heshimu Admin)
  const current = getCategories();
  if (current.length > 0) {
    return current;
  }

  // ✅ Weka seed mara ya kwanza
  saveAll(list);
  return list;
}

/**
 * resetCategories(list) — Admin pekee. Futa zote na weka upya.
 * Tofauti na initializeCategories, hii HAINA check ya "zipo tayari".
 */
export function resetCategories(list) {
  if (!Array.isArray(list)) return getCategories();
  saveAll(list);
  return list;
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
    isPopular: false,
    active: true,
    extra: [],
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

export function useCategory(key) {
  const list = useCategories();
  if (!key) return null;
  return list.find((c) => c.key === key) || null;
}

import { categoriesApi } from "../api/categories.js";

export async function hydrateCategoriesFromApi() {
  try {
    const data = await categoriesApi.list({ page_size: 100 });
    const list = Array.isArray(data) ? data : data?.results || [];
    if (!list.length) return { source: "seed", count: getCategories().length };
    saveAll(list);
    return { source: "api", count: list.length };
  } catch (err) {
    console.warn("[categoriesStore] hydrate failed:", err);
    return { source: "error", count: getCategories().length };
  }
}

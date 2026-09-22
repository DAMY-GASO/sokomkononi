// ============================================================
// categoriesStore.js — API-only via /api/categories/
// ============================================================
import { useEffect, useState } from "react";
import {
  Home, Trees, Car, Briefcase, Wrench, Truck, Bike, Bus, Sofa,
  Tv, PawPrint, Refrigerator, ShoppingBag, Building2, Package,
  Ship, Plane, Store, Factory, Bed,
} from "lucide-react";
import { categoriesApi } from "../api/categories.js";
import { api } from "../api/client.js";

const KEY = "sokomkononi_categories_v2";
const EV = "sokomkononi:categories-updated";

export const AVAILABLE_ICONS = {
  Home, Trees, Car, Briefcase, Wrench, Truck, Bike, Bus, Sofa, Tv,
  PawPrint, Refrigerator, ShoppingBag, Building2, Package, Ship,
  Plane, Store, Factory, Bed,
};
export function getCategoryIcon(iconKey) { return AVAILABLE_ICONS[iconKey] || Home; }

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}
function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

// ── Reads ─────────────────────────────────────────────────
export function getCategories() { return read(); }
export function getActiveCategories() { return read().filter((c) => c.active !== false); }
export function getPopularCategories() { return read().filter((c) => c.active !== false && c.isPopular === true); }
export function getCategory(key) { return key ? read().find((c) => c.key === key) || null : null; }
export function getCategoryById(id) {
  if (id == null) return null;
  return read().find((c) => c.id === id || String(c.id) === String(id)) || null;
}
export function getCategoryIdByKey(key) { return getCategory(key)?.id ?? null; }
export function getCategoryLabel(key, lang = "sw") {
  const cat = getCategory(key);
  return cat ? cat.label?.[lang] || cat.label?.sw || key : key;
}
export function getCategoryExtra(key) {
  const cat = getCategory(key);
  return cat && Array.isArray(cat.extra) ? cat.extra : [];
}
export function getCategoryFieldLabel(f, lang = "sw") { return f?.label?.[lang] || f?.label?.sw || f?.key || ""; }
export function getCategoryFieldPlaceholder(f, lang = "sw") { return f?.placeholder?.[lang] || f?.placeholder?.sw || ""; }
export function getCategoryOptionLabel(o, lang = "sw") { return o?.label?.[lang] || o?.label?.sw || o?.value || ""; }

export function initializeCategories() { /* no-op: data comes from API */ }
export function resetCategories(list) { write(Array.isArray(list) ? list : []); }

// ── Normalizer ────────────────────────────────────────────
function toSlug(str) {
  return String(str || "").trim().toLowerCase()
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
function norm(raw) {
  if (!raw) return null;
  const name = raw.name || "";
  const slug = raw.slug || toSlug(name);
  return {
    id: raw.id,
    key: slug,
    slug,
    name,
    label: { sw: name, en: name },
    description: { sw: raw.description || "", en: raw.description || "" },
    iconKey: raw.icon_key || "Home",
    imageUrl: raw.image_url || null,
    isPopular: raw.is_popular ?? true,
    active: raw.is_active !== false,
    ordering: raw.ordering ?? 0,
    extra: Array.isArray(raw.extra) ? raw.extra : [],
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ── Hydrate ───────────────────────────────────────────────
export async function hydrateCategoriesFromApi() {
  try {
    const data = await categoriesApi.list({ page_size: 200 });
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(norm).filter(Boolean);
    // Preserve iconKey/imageUrl/extra from existing cache if backend doesn't return them
    const existing = read();
    const merged = normalized.map((c) => {
      const prior = existing.find((p) => p.key === c.key);
      if (!prior) return c;
      return {
        ...c,
        iconKey: c.iconKey && c.iconKey !== "Home" ? c.iconKey : prior.iconKey || "Home",
        imageUrl: c.imageUrl || prior.imageUrl || null,
        extra: c.extra.length ? c.extra : prior.extra || [],
      };
    });
    write(merged);
    return { ok: true, count: merged.length };
  } catch (err) { return { ok: false, error: err }; }
}

// ── Mutations ─────────────────────────────────────────────
function toApiBody(form) {
  return {
    name: form.name || form.label?.en || form.label?.sw || form.key,
    description: form.description?.en || form.description?.sw || "",
    icon_key: form.iconKey || "Home",
    image_url: form.imageUrl || null,
    is_popular: form.isPopular !== false,
    is_active: form.active !== false,
    ordering: form.ordering ?? 0,
    extra: form.extra || [],
  };
}

export async function addCategoryAsync(form) {
  const body = toApiBody(form);
  try {
    const raw = await api.post("/categories/", body);
    const created = norm(raw);
    const prior = form.iconKey ? { ...created, iconKey: form.iconKey } : created;
    write([...read(), prior]);
    return { ok: true, category: prior };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateCategoryAsync(key, patch) {
  const target = getCategory(key);
  if (!target) return { ok: false, error: new Error("Category not found") };
  if (typeof target.id !== "number") {
    return { ok: false, error: new Error("Category has no backend id") };
  }
  const body = {};
  if (patch.name != null || patch.label != null) body.name = patch.name || patch.label?.en || patch.label?.sw;
  if (patch.description != null) body.description = patch.description?.en || patch.description?.sw || "";
  if (patch.iconKey != null) body.icon_key = patch.iconKey;
  if (patch.imageUrl != null) body.image_url = patch.imageUrl;
  if (patch.isPopular != null) body.is_popular = patch.isPopular;
  if (patch.active != null) body.is_active = patch.active;
  if (patch.extra != null) body.extra = patch.extra;
  if (!Object.keys(body).length) return { ok: true, category: target };
  try {
    const raw = await api.patch(`/categories/${target.id}/`, body);
    const updated = norm(raw);
    // Preserve local extras
    const merged = { ...updated, iconKey: updated.iconKey || target.iconKey, imageUrl: updated.imageUrl || target.imageUrl, extra: updated.extra.length ? updated.extra : target.extra };
    write(read().map((c) => (c.key === key ? merged : c)));
    return { ok: true, category: merged };
  } catch (err) { return { ok: false, error: err }; }
}

export async function toggleCategoryActiveAsync(key) {
  const target = getCategory(key);
  if (!target) return { ok: false, error: new Error("Category not found") };
  return updateCategoryAsync(key, { active: target.active === false });
}

export async function toggleCategoryPopularAsync(key) {
  const target = getCategory(key);
  if (!target) return { ok: false, error: new Error("Category not found") };
  return updateCategoryAsync(key, { isPopular: !target.isPopular });
}

export async function updateCategoryImageAsync(key, imageUrl) {
  return updateCategoryAsync(key, { imageUrl });
}

export async function removeCategoryAsync(key) {
  const target = getCategory(key);
  if (!target) return { ok: false, error: new Error("Category not found") };
  try {
    await api.delete(`/categories/${target.id}/`);
    write(read().filter((c) => c.key !== key));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ── Hooks ─────────────────────────────────────────────────
export function useCategories() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateCategoriesFromApi();
    const sync = () => setList(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return list;
}
export function useActiveCategories() { return useCategories().filter((c) => c.active !== false); }
export function usePopularCategories() { return useCategories().filter((c) => c.active !== false && c.isPopular === true); }
export function useCategory(key) {
  const list = useCategories();
  return key ? list.find((c) => c.key === key) || null : null;
}

// LEGACY
export function hasCategoryImage(c) { return Boolean(c?.imageUrl); }
export function updateCategoryImage() {}
export function addCategory() { return []; }
export function updateCategory() {}
export function toggleCategoryActive() {}
export function toggleCategoryPopular() {}
export function removeCategory() { return { success: false }; }

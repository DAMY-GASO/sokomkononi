// ============================================================
// rolesStore.js — API-backed via /api/rbac/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_roles_v1";
const UPDATE_EVENT = "sokomkononi:roles-updated";
const SUBADMINS_KEY = "sokomkononi_subadmins_v1";
const SUBADMINS_EVENT = "sokomkononi:subadmins-updated";

export const PERMISSIONS = [
  { key: "overview", label: { sw: "Muhtasari", en: "Overview" } },
  { key: "users", label: { sw: "Watumiaji", en: "Users" } },
  { key: "moderation", label: { sw: "Uidhinishaji", en: "Moderation" } },
  { key: "verification", label: { sw: "Uthibitisho", en: "Verification" } },
  { key: "deals", label: { sw: "Deals", en: "Deals" } },
  { key: "revenue", label: { sw: "Mapato", en: "Revenue" } },
  { key: "promotions", label: { sw: "Matangazo", en: "Promotions" } },
  { key: "reports", label: { sw: "Ripoti", en: "Reports" } },
  { key: "support", label: { sw: "Huduma kwa Wateja", en: "Support" } },
  { key: "content", label: { sw: "Maudhui", en: "Content" } },
  { key: "audit", label: { sw: "Kumbukumbu", en: "Audit Logs" } },
  { key: "system", label: { sw: "Mipangilio", en: "Settings" } },
  { key: "staff", label: { sw: "Wafanyakazi", en: "Staff" } },
  { key: "bundles", label: { sw: "Vifurushi vya Huduma", en: "Service Bundles" } },
];

export const DEFAULT_ROLES = [];
export const SEED_ROLES = DEFAULT_ROLES;

function readFromStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveAll(key, event, list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new Event(event));
}

function normalizeRoleFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    key: raw.key,
    label: raw.label || { sw: raw.label_sw || raw.key, en: raw.label_en || raw.key },
    description: raw.description || { sw: "", en: "" },
    permissions: raw.permissions || [],
    isSystem: !!raw.is_system,
  };
}

function normalizeStaffFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    userId: raw.user,
    name: raw.name,
    email: raw.email,
    roleKey: raw.role_key,
    active: !!raw.active,
    addedAt: raw.added_at,
  };
}

export function getRoles() {
  return readFromStorage(STORAGE_KEY, SEED_ROLES);
}
export function getRole(key) {
  return getRoles().find((r) => r.key === key) || null;
}
export function getSubAdmins() {
  return readFromStorage(SUBADMINS_KEY, []);
}

export async function hydrateRolesFromApi() {
  try {
    const [rolesData, staffData] = await Promise.all([
      api.get("/rbac/roles/").catch(() => null),
      api.get("/rbac/staff/").catch(() => null),
    ]);
    if (rolesData) {
      const roles = (Array.isArray(rolesData) ? rolesData : []).map(normalizeRoleFromApi).filter(Boolean);
      saveAll(STORAGE_KEY, UPDATE_EVENT, roles);
    }
    if (staffData) {
      const staff = (Array.isArray(staffData) ? staffData : []).map(normalizeStaffFromApi).filter(Boolean);
      saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, staff);
    }
    return { source: "api" };
  } catch (err) {
    console.warn("[rolesStore] hydrate failed:", err);
    return { source: "error" };
  }
}

export function addRole(role) {
  const current = getRoles();
  if (current.some((r) => r.key === role.key)) {
    throw new Error(`Role "${role.key}" already exists`);
  }
  const entry = { ...role, isSystem: false };
  saveAll(STORAGE_KEY, UPDATE_EVENT, [...current, entry]);
  api.post("/rbac/roles/", {
    key: role.key,
    label: role.label,
    description: role.description,
    permissions: role.permissions,
  }).catch(() => {});
  return entry;
}
export function updateRole(key, patch) {
  const next = getRoles().map((r) =>
    r.key === key ? { ...r, ...patch, key: r.key, isSystem: r.isSystem } : r
  );
  saveAll(STORAGE_KEY, UPDATE_EVENT, next);
  const role = next.find((r) => r.key === key);
  if (role && role.id) {
    api.patch(`/rbac/roles/${role.id}/`, {
      label: role.label, description: role.description, permissions: role.permissions,
    }).catch(() => {});
  }
  return next;
}
export function removeRole(key) {
  const role = getRole(key);
  if (role?.isSystem) throw new Error(`Cannot delete system role "${key}"`);
  const next = getRoles().filter((r) => r.key !== key);
  saveAll(STORAGE_KEY, UPDATE_EVENT, next);
  return next;
}
export function hasPermission(roleKey, permission) {
  const role = getRole(roleKey);
  if (!role) return false;
  return role.permissions.includes(permission);
}

export function addSubAdmin({ name, email, roleKey, userId }) {
  const entry = {
    id: `sa_${Date.now()}`,
    userId, name, email, roleKey,
    addedAt: new Date().toISOString(),
    active: true,
  };
  saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, [...getSubAdmins(), entry]);
  if (userId) {
    api.post("/rbac/staff/", { user_id: userId, role_key: roleKey, active: true }).catch(() => {});
  }
  return entry;
}
export function updateSubAdmin(id, patch) {
  const next = getSubAdmins().map((s) => (s.id === id ? { ...s, ...patch } : s));
  saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, next);
  if (typeof id === "number") {
    api.patch(`/rbac/staff/${id}/`, { role_key: patch.roleKey, active: patch.active }).catch(() => {});
  }
  return next;
}
export function removeSubAdmin(id) {
  const next = getSubAdmins().filter((s) => s.id !== id);
  saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, next);
  if (typeof id === "number") {
    api.delete(`/rbac/staff/${id}/`).catch(() => {});
  }
  return next;
}

export function useRoles() {
  const [roles, setRoles] = useState(() => getRoles());
  useEffect(() => {
    hydrateRolesFromApi();
    const sync = () => setRoles(getRoles());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return roles;
}

export function useSubAdminsWithRoles() {
  const [list, setList] = useState(() => getSubAdmins());
  useEffect(() => {
    hydrateRolesFromApi();
    const sync = () => setList(getSubAdmins());
    window.addEventListener("storage", sync);
    window.addEventListener(SUBADMINS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SUBADMINS_EVENT, sync);
    };
  }, []);
  return list;
}

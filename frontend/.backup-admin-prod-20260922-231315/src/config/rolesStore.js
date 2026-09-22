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
  { key: "trash", label: { sw: "Trash", en: "Trash" } }, // ✅ ONGEZWA
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
export function getRoleById(id) {
  return getRoles().find((r) => r.id === id) || null;
}
export function getSubAdmins() {
  return readFromStorage(SUBADMINS_KEY, []);
}
export function getSubAdmin(id) {
  return getSubAdmins().find((s) => s.id === id) || null;
}

export async function hydrateRolesFromApi() {
  const results = { roles: null, staff: null };

  try {
    const rolesData = await api.get("/rbac/roles/");
    const roles = (Array.isArray(rolesData) ? rolesData : rolesData?.results || [])
      .map(normalizeRoleFromApi).filter(Boolean);
    saveAll(STORAGE_KEY, UPDATE_EVENT, roles);
    results.roles = { source: "api", count: roles.length };
  } catch (err) {
    console.warn("[rolesStore] hydrate roles failed:", err);
    results.roles = { source: "error", count: getRoles().length };
  }

  try {
    const staffData = await api.get("/rbac/staff/");
    const staff = (Array.isArray(staffData) ? staffData : staffData?.results || [])
      .map(normalizeStaffFromApi).filter(Boolean);
    saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, staff);
    results.staff = { source: "api", count: staff.length };
  } catch (err) {
    console.warn("[rolesStore] hydrate staff failed:", err);
    results.staff = { source: "error", count: getSubAdmins().length };
  }

  return results;
}

export async function addRoleAsync(role) {
  if (!role?.key) return { ok: false, error: new Error("key inahitajika") };
  const current = getRoles();
  if (current.some((r) => r.key === role.key)) {
    return { ok: false, error: new Error(`Role "${role.key}" ipo tayari`) };
  }
  const optimistic = { ...role, isSystem: false, id: `local_${Date.now()}` };
  saveAll(STORAGE_KEY, UPDATE_EVENT, [...current, optimistic]);
  try {
    const raw = await api.post("/rbac/roles/", {
      key: role.key,
      permissions: role.permissions,
    });
    const created = normalizeRoleFromApi(raw);
    if (created) {
      const now = getRoles();
      saveAll(STORAGE_KEY, UPDATE_EVENT, now.map((r) => (r.id === optimistic.id ? created : r)));
      return { ok: true, role: created };
    }
    return { ok: true, role: optimistic };
  } catch (err) {
    saveAll(STORAGE_KEY, UPDATE_EVENT, current);
    console.warn("[rolesStore] addRole failed:", err);
    return { ok: false, error: err };
  }
}

export async function updateRoleAsync(key, patch) {
  const previous = getRoles();
  const role = previous.find((r) => r.key === key);
  if (!role) return { ok: false, error: new Error("Role haipo") };
  const safePatch = { ...patch };
  delete safePatch.key;
  delete safePatch.isSystem;
  const optimistic = { ...role, ...safePatch };
  saveAll(STORAGE_KEY, UPDATE_EVENT, previous.map((r) => (r.key === key ? optimistic : r)));
  if (!role.id || typeof role.id !== "number") {
    return { ok: true, warning: "local_only" };
  }
  try {
    await api.patch(`/rbac/roles/${role.id}/`, {
      permissions: optimistic.permissions,
    });
    return { ok: true, role: optimistic };
  } catch (err) {
    saveAll(STORAGE_KEY, UPDATE_EVENT, previous);
    console.warn("[rolesStore] updateRole failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeRoleAsync(key) {
  const previous = getRoles();
  const role = previous.find((r) => r.key === key);
  if (!role) return { ok: false, error: new Error("Role haipo") };
  if (role.isSystem) {
    return { ok: false, error: new Error(`Huwezi kufuta system role "${key}"`) };
  }
  saveAll(STORAGE_KEY, UPDATE_EVENT, previous.filter((r) => r.key !== key));
  if (!role.id || typeof role.id !== "number") return { ok: true };
  try {
    await api.delete(`/rbac/roles/${role.id}/`);
    return { ok: true };
  } catch (err) {
    saveAll(STORAGE_KEY, UPDATE_EVENT, previous);
    console.warn("[rolesStore] removeRole failed:", err);
    return { ok: false, error: err };
  }
}

export async function addSubAdminAsync({ name, email, roleId, roleKey, userId }) {
  if (!userId) {
    return { ok: false, error: new Error("userId (numeric) inahitajika") };
  }
  // Resolve roleId: prefer numeric roleId, else look up by roleKey
  let resolvedRoleId = roleId;
  if (!resolvedRoleId && roleKey) {
    const role = getRole(roleKey);
    resolvedRoleId = role?.id;
  }
  if (!resolvedRoleId || typeof resolvedRoleId !== "number") {
    return {
      ok: false,
      error: new Error(
        "roleId (numeric) inahitajika. Backend inatumia role FK, sio roleKey."
      ),
    };
  }

  const previous = getSubAdmins();
  const optimistic = {
    id: `local_${Date.now()}`,
    userId, name, email, roleKey, roleId: resolvedRoleId,
    addedAt: new Date().toISOString(),
    active: true,
  };
  saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, [...previous, optimistic]);

  try {
    const raw = await api.post("/rbac/staff/", {
      user: userId,
      role: resolvedRoleId,
      active: true,
    });
    const created = normalizeStaffFromApi(raw);
    if (created) {
      const now = getSubAdmins();
      saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, now.map((s) => (s.id === optimistic.id ? created : s)));
      return { ok: true, staff: created };
    }
    return { ok: true, staff: optimistic };
  } catch (err) {
    saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, previous);
    console.warn("[rolesStore] addSubAdmin failed:", err);
    return { ok: false, error: err };
  }
}

export async function updateSubAdminAsync(id, patch) {
  const previous = getSubAdmins();
  const target = previous.find((s) => s.id === id);
  if (!target) return { ok: false, error: new Error("Sub-admin hayupo") };

  // Resolve role: prefer numeric roleId, else lookup roleKey
  let resolvedRoleId = patch.roleId;
  if (!resolvedRoleId && patch.roleKey) {
    const role = getRole(patch.roleKey);
    resolvedRoleId = role?.id;
  }

  const optimistic = { ...target, ...patch };
  if (resolvedRoleId) optimistic.roleId = resolvedRoleId;
  saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, previous.map((s) => (s.id === id ? optimistic : s)));

  if (typeof id !== "number") return { ok: true };

  const body = {};
  if (resolvedRoleId != null) body.role = resolvedRoleId;
  if (patch.active != null) body.active = patch.active;

  if (!Object.keys(body).length) return { ok: true };

  try {
    await api.patch(`/rbac/staff/${id}/`, body);
    return { ok: true };
  } catch (err) {
    saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, previous);
    console.warn("[rolesStore] updateSubAdmin failed:", err);
    return { ok: false, error: err };
  }
}

export async function removeSubAdminAsync(id) {
  const previous = getSubAdmins();
  saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, previous.filter((s) => s.id !== id));
  if (typeof id !== "number") return { ok: true };
  try {
    await api.delete(`/rbac/staff/${id}/`);
    return { ok: true };
  } catch (err) {
    saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, previous);
    console.warn("[rolesStore] removeSubAdmin failed:", err);
    return { ok: false, error: err };
  }
}

export function hasPermission(roleKey, permission) {
  const role = getRole(roleKey);
  if (!role) return false;
  return role.permissions.includes(permission);
}

// ---------- LEGACY SYNC ----------
/** @deprecated Use addRoleAsync */
export function addRole(role) {
  const current = getRoles();
  if (current.some((r) => r.key === role.key)) {
    throw new Error(`Role "${role.key}" already exists`);
  }
  const entry = { ...role, isSystem: false };
  saveAll(STORAGE_KEY, UPDATE_EVENT, [...current, entry]);
  api.post("/rbac/roles/", {
    key: role.key, label: role.label,
    description: role.description, permissions: role.permissions,
  }).catch((err) => console.warn("[rolesStore] addRole silent fail:", err));
  return entry;
}

/** @deprecated Use updateRoleAsync */
export function updateRole(key, patch) {
  const next = getRoles().map((r) =>
    r.key === key ? { ...r, ...patch, key: r.key, isSystem: r.isSystem } : r
  );
  saveAll(STORAGE_KEY, UPDATE_EVENT, next);
  const role = next.find((r) => r.key === key);
  if (role?.id && typeof role.id === "number") {
    api.patch(`/rbac/roles/${role.id}/`, {
      label: role.label, description: role.description, permissions: role.permissions,
    }).catch((err) => console.warn("[rolesStore] updateRole silent fail:", err));
  }
  return next;
}

/** @deprecated Use removeRoleAsync */
export function removeRole(key) {
  const role = getRole(key);
  if (role?.isSystem) throw new Error(`Cannot delete system role "${key}"`);
  const next = getRoles().filter((r) => r.key !== key);
  saveAll(STORAGE_KEY, UPDATE_EVENT, next);
  if (role?.id && typeof role.id === "number") {
    api.delete(`/rbac/roles/${role.id}/`)
      .catch((err) => console.warn("[rolesStore] removeRole silent fail:", err));
  }
  return next;
}

/** @deprecated Use addSubAdminAsync */
export function addSubAdmin({ name, email, roleKey, userId }) {
  const entry = {
    id: `sa_${Date.now()}`,
    userId, name, email, roleKey,
    addedAt: new Date().toISOString(),
    active: true,
  };
  saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, [...getSubAdmins(), entry]);
  if (userId) {
    api.post("/rbac/staff/", { user_id: userId, role_key: roleKey, active: true })
      .catch((err) => console.warn("[rolesStore] addSubAdmin silent fail:", err));
  }
  return entry;
}

/** @deprecated Use updateSubAdminAsync */
export function updateSubAdmin(id, patch) {
  const next = getSubAdmins().map((s) => (s.id === id ? { ...s, ...patch } : s));
  saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, next);
  if (typeof id === "number") {
    api.patch(`/rbac/staff/${id}/`, {
      role_key: patch.roleKey, active: patch.active,
    }).catch((err) => console.warn("[rolesStore] updateSubAdmin silent fail:", err));
  }
  return next;
}

/** @deprecated Use removeSubAdminAsync */
export function removeSubAdmin(id) {
  const next = getSubAdmins().filter((s) => s.id !== id);
  saveAll(SUBADMINS_KEY, SUBADMINS_EVENT, next);
  if (typeof id === "number") {
    api.delete(`/rbac/staff/${id}/`)
      .catch((err) => console.warn("[rolesStore] removeSubAdmin silent fail:", err));
  }
  return next;
}

// ---------- HOOKS ----------
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

export function useRole(key) {
  const roles = useRoles();
  if (!key) return null;
  return roles.find((r) => r.key === key) || null;
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

export function useSubAdminsCount() {
  return useSubAdminsWithRoles().length;
}

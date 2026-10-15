// ============================================================
// rolesStore.js — API-only via /api/rbac/
// NOTE: staff storage key changed to avoid collision with
//       systemSettingsStore.js (sub-admins panel).
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const ROLES_KEY = "sokomkononi_roles_v1";
const STAFF_KEY = "sokomkononi_rbac_staff_v1";     // <-- was "sokomkononi_subadmins_v1"
const UPDATE_EVENT = "sokomkononi:roles-updated";
const STAFF_EVENT = "sokomkononi:rbac-staff-updated";

export const PERMISSIONS = [
  { key: "overview", label: { sw: "Muhtasari", en: "Overview" } },
  { key: "users", label: { sw: "Watumiaji", en: "Users" } },
  { key: "moderation", label: { sw: "Uidhinishaji", en: "Moderation" } },
  { key: "verification", label: { sw: "Uthibitisho", en: "Verification" } },
  { key: "deals", label: { sw: "Deals", en: "Deals" } },
  { key: "revenue", label: { sw: "Mapato", en: "Revenue" } },
  { key: "bundles", label: { sw: "Vifurushi", en: "Bundles" } },
  { key: "promotions", label: { sw: "Matangazo", en: "Promotions" } },
  { key: "reports", label: { sw: "Ripoti", en: "Reports" } },
  { key: "support", label: { sw: "Huduma", en: "Support" } },
  { key: "content", label: { sw: "Maudhui", en: "Content" } },
  { key: "audit", label: { sw: "Kumbukumbu", en: "Audit" } },
  { key: "trash", label: { sw: "Trash", en: "Trash" } },
  { key: "system", label: { sw: "Mipangilio", en: "Settings" } },
  { key: "staff", label: { sw: "Wafanyakazi", en: "Staff" } },
];

function read(key, fb) {
  if (typeof window === "undefined") return fb;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fb;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fb;
  } catch { return fb; }
}
function writeRoles(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLES_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}
function writeStaff(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STAFF_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(STAFF_EVENT));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

function normRole(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    key: raw.key,
    label: raw.label || { sw: raw.label_sw || raw.key, en: raw.label_en || raw.key },
    description: raw.description || { sw: "", en: "" },
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    isSystem: !!raw.is_system,
  };
}
function normStaff(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    userId: raw.user,
    name: raw.name || "",
    email: raw.email || "",
    roleId: raw.role,
    roleKey: raw.role_key || null,
    active: !!raw.active,
    addedAt: raw.added_at,
  };
}

export function getRoles() { return read(ROLES_KEY, []); }
export function getRole(key) { return getRoles().find((r) => r.key === key) || null; }
export function getRoleById(id) { return getRoles().find((r) => r.id === id) || null; }
export function getSubAdmins() { return read(STAFF_KEY, []); }
export function getSubAdmin(id) { return getSubAdmins().find((s) => s.id === id) || null; }

async function _hydrateRolesImpl() {
  const out = { roles: null, staff: null, errors: [] };
  try {
    const d = await api.get("/rbac/roles/?page_size=200");
    const list = (Array.isArray(d) ? d : d?.results || []).map(normRole).filter(Boolean);
    writeRoles(list);
    out.roles = { ok: true, count: list.length };
  } catch (err) {
    out.roles = { ok: false, error: err };
    out.errors.push({ slice: "roles", error: err });
  }
  try {
    const d = await api.get("/rbac/staff/?page_size=200");
    const list = (Array.isArray(d) ? d : d?.results || []).map(normStaff).filter(Boolean);
    writeStaff(list);
    out.staff = { ok: true, count: list.length };
  } catch (err) {
    out.staff = { ok: false, error: err };
    out.errors.push({ slice: "staff", error: err });
  }
  return out;
}

let _inflight_hydrateRolesFromApi = null;
export function hydrateRolesFromApi(...args) {
  if (_inflight_hydrateRolesFromApi) return _inflight_hydrateRolesFromApi;
  _inflight_hydrateRolesFromApi = _hydrateRolesImpl(...args).finally(() => { _inflight_hydrateRolesFromApi = null; });
  return _inflight_hydrateRolesFromApi;
}

export async function addRoleAsync({ key, label, description, permissions }) {
  if (!key || !Array.isArray(permissions)) {
    return { ok: false, error: new Error("key + permissions required") };
  }
  const body = { key, permissions };
  if (label) {
    body.label = typeof label === "string"
      ? { sw: label, en: label }
      : { sw: label.sw || "", en: label.en || "" };
  }
  if (description) {
    body.description = typeof description === "string"
      ? { sw: description, en: description }
      : { sw: description.sw || "", en: description.en || "" };
  }
  try {
    const raw = await api.post("/rbac/roles/", body);
    const created = normRole(raw);
    writeRoles([created, ...getRoles()]);
    return { ok: true, role: created };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateRoleAsync(key, { permissions, label, description }) {
  const role = getRole(key);
  if (!role) return { ok: false, error: new Error("Role not found") };
  const body = {};
  if (Array.isArray(permissions)) body.permissions = permissions;
  if (label) {
    body.label = typeof label === "string"
      ? { sw: label, en: label }
      : { sw: label.sw || "", en: label.en || "" };
  }
  if (description) {
    body.description = typeof description === "string"
      ? { sw: description, en: description }
      : { sw: description.sw || "", en: description.en || "" };
  }
  try {
    const raw = await api.patch(`/rbac/roles/${role.id}/`, body);
    const updated = normRole(raw);
    writeRoles(getRoles().map((r) => (r.key === key ? updated : r)));
    return { ok: true, role: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeRoleAsync(key) {
  const role = getRole(key);
  if (!role) return { ok: false, error: new Error("Role not found") };
  if (role.isSystem) return { ok: false, error: new Error("Cannot delete system role") };
  try {
    await api.delete(`/rbac/roles/${role.id}/`);
    writeRoles(getRoles().filter((r) => r.key !== key));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function addStaffAsync({ userId, roleId, active = true }) {
  if (!userId || !roleId) {
    return { ok: false, error: new Error("userId + roleId (numeric) required") };
  }
  try {
    const raw = await api.post("/rbac/staff/", { user: userId, role: roleId, active });
    const created = normStaff(raw);
    writeStaff([created, ...getSubAdmins()]);
    return { ok: true, staff: created };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateStaffAsync(id, { roleId, active }) {
  const existing = getSubAdmin(id);
  if (!existing) return { ok: false, error: new Error("Staff not found") };
  const body = {};
  if (roleId != null) body.role = roleId;
  if (active != null) body.active = active;
  if (!Object.keys(body).length) return { ok: true, staff: existing };
  try {
    const raw = await api.patch(`/rbac/staff/${id}/`, body);
    const updated = normStaff(raw) || { ...existing, ...body };
    writeStaff(getSubAdmins().map((s) => (s.id === id ? updated : s)));
    return { ok: true, staff: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeStaffAsync(id) {
  try {
    await api.delete(`/rbac/staff/${id}/`);
    writeStaff(getSubAdmins().filter((s) => s.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function useRoles() {
  const [list, setList] = useState(() => getRoles());
  useEffect(() => {
    hydrateRolesFromApi();
    const sync = () => setList(getRoles());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return list;
}

export function useRole(key) {
  const roles = useRoles();
  return key ? roles.find((r) => r.key === key) || null : null;
}

export function useSubAdminsWithRoles() {
  const [list, setList] = useState(() => getSubAdmins());
  useEffect(() => {
    hydrateRolesFromApi();
    const sync = () => setList(getSubAdmins());
    window.addEventListener("storage", sync);
    window.addEventListener(STAFF_EVENT, sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(STAFF_EVENT, sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return list;
}

export function useSubAdminsCount() { return useSubAdminsWithRoles().length; }
export function hasPermission(roleKey, perm) {
  const role = getRole(roleKey);
  return !!role && role.permissions.includes(perm);
}

// Legacy shims
export const SEED_ROLES = [];
export const DEFAULT_ROLES = [];
export function addRole() { return null; }
export function updateRole() {}
export function removeRole() {}
export function addSubAdmin() { return null; }
export function updateSubAdmin() {}
export function removeSubAdmin() {}

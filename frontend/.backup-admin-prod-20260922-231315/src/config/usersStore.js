// ============================================================
// usersStore.js — API-backed via /api/admin/users/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_users_v1";
const UPDATE_EVENT = "sokomkononi:users-updated";

export const SEED_USERS = [];

// ---------- STORAGE ----------
function readFromStorage() {
  if (typeof window === "undefined") return SEED_USERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_USERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_USERS;
  } catch {
    return SEED_USERS;
  }
}

function saveAll(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ---------- NORMALIZER ----------
function normalizeFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || "",
    email: raw.email || "",
    phone: raw.phone || "",
    role: raw.is_staff || raw.is_superuser
      ? "Admin"
      : (raw.account_type === "BUSINESS" || raw.is_seller ? "Seller" : "Buyer"),
    status: raw.is_deleted
      ? "suspended"
      : (raw.is_active === false ? "suspended" : "active"),
    joined: raw.date_joined || raw.created_at,
    isStaff: !!raw.is_staff,
    isVerified: !!raw.is_verified,
  };
}

// ---------- READS ----------
export function getUsers() {
  return readFromStorage();
}

export function saveUsers(users) {
  saveAll(users);
}

export function getUser(id) {
  return getUsers().find((u) => u.id === id) || null;
}

export function getUserByEmail(email) {
  if (!email) return null;
  return getUsers().find((u) => u.email === email) || null;
}

// ---------- HYDRATE ----------
export async function hydrateUsersFromApi() {
  try {
    const data = await api.get("/admin/users/?page_size=200");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normalizeFromApi).filter(Boolean);
    saveAll(normalized);
    return { source: "api", count: normalized.length };
  } catch (err) {
    console.warn("[usersStore] hydrate failed:", err);
    return { source: "error", count: getUsers().length };
  }
}

// ============================================================
// ASYNC ACTIONS — with rollback
// ============================================================

/**
 * Suspend user. Backend: POST /admin/users/{id}/suspend/
 */
export async function suspendUserAsync(id) {
  const previous = getUsers();
  const user = previous.find((u) => u.id === id);
  if (!user) return { ok: false, error: new Error("Mtumiaji hayupo") };

  if (user.status === "suspended") {
    return { ok: true, warning: "already_suspended" };
  }

  // Optimistic
  saveAll(previous.map((u) => (u.id === id ? { ...u, status: "suspended" } : u)));

  try {
    await api.post(`/admin/users/${id}/suspend/`, {});
    return { ok: true };
  } catch (err) {
    saveAll(previous); // Rollback
    console.warn("[usersStore] suspend failed:", err);
    return { ok: false, error: err };
  }
}

/**
 * Activate user. Backend: POST /admin/users/{id}/activate/
 */
export async function activateUserAsync(id) {
  const previous = getUsers();
  const user = previous.find((u) => u.id === id);
  if (!user) return { ok: false, error: new Error("Mtumiaji hayupo") };

  if (user.status === "active") {
    return { ok: true, warning: "already_active" };
  }

  saveAll(previous.map((u) => (u.id === id ? { ...u, status: "active" } : u)));

  try {
    await api.post(`/admin/users/${id}/activate/`, {});
    return { ok: true };
  } catch (err) {
    saveAll(previous); // Rollback
    console.warn("[usersStore] activate failed:", err);
    return { ok: false, error: err };
  }
}

/**
 * Toggle — chagua suspend/activate kutokana na hali ya sasa.
 */
export async function toggleUserStatusAsync(id) {
  const user = getUser(id);
  if (!user) return { ok: false, error: new Error("Mtumiaji hayupo") };
  return user.status === "suspended"
    ? activateUserAsync(id)
    : suspendUserAsync(id);
}

/**
 * Update user patch. Hutumia PATCH /admin/users/{id}/
 */
export async function updateUserAsync(id, patch) {
  const previous = getUsers();
  const user = previous.find((u) => u.id === id);
  if (!user) return { ok: false, error: new Error("Mtumiaji hayupo") };

  saveAll(previous.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  try {
    await api.patch(`/admin/users/${id}/`, patch);
    return { ok: true };
  } catch (err) {
    saveAll(previous); // Rollback
    console.warn("[usersStore] update failed:", err);
    return { ok: false, error: err };
  }
}

/**
 * Verify user. Backend: POST /admin/users/{id}/verify/
 */
export async function verifyUserAsync(id) {
  const previous = getUsers();
  saveAll(previous.map((u) => (u.id === id ? { ...u, isVerified: true } : u)));

  try {
    await api.post(`/admin/users/${id}/verify/`, {});
    return { ok: true };
  } catch (err) {
    saveAll(previous);
    console.warn("[usersStore] verify failed:", err);
    return { ok: false, error: err };
  }
}

/**
 * Delete user (soft). Backend: DELETE /admin/users/{id}/
 */
export async function deleteUserAsync(id) {
  const previous = getUsers();
  saveAll(previous.filter((u) => u.id !== id));

  try {
    await api.delete(`/admin/users/${id}/`);
    return { ok: true };
  } catch (err) {
    saveAll(previous); // Rollback
    console.warn("[usersStore] delete failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// LEGACY SYNC (deprecated)
// ============================================================
/** @deprecated Use toggleUserStatusAsync */
export function toggleUserStatus(id) {
  const current = getUsers();
  const user = current.find((u) => u.id === id);
  const next = current.map((u) =>
    u.id === id ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u
  );
  saveAll(next);
  if (user) {
    const endpoint = user.status === "suspended" ? "activate" : "suspend";
    api.post(`/admin/users/${id}/${endpoint}/`, {})
      .catch((err) => console.warn(`[usersStore] ${endpoint} silent fail:`, err));
  }
  return next;
}

/** @deprecated Use updateUserAsync */
export function updateUser(id, patch) {
  const next = getUsers().map((u) => (u.id === id ? { ...u, ...patch } : u));
  saveAll(next);
  api.patch(`/admin/users/${id}/`, patch)
    .catch((err) => console.warn("[usersStore] update silent fail:", err));
  return next;
}

// ============================================================
// HOOKS
// ============================================================
export function useUsers() {
  const [users, setUsers] = useState(() => getUsers());
  useEffect(() => {
    hydrateUsersFromApi();
    const sync = () => setUsers(getUsers());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return users;
}

export function useUser(id) {
  const users = useUsers();
  if (!id) return null;
  return users.find((u) => u.id === id) || null;
}

export function useUsersByRole(role) {
  const users = useUsers();
  if (!role || role === "all") return users;
  return users.filter((u) => u.role === role);
}

export function useActiveUsersCount() {
  return useUsers().filter((u) => u.status === "active").length;
}

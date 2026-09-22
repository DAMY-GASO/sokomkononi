// ============================================================
// usersStore.js — API-only via /api/admin/users/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_users_v1";
const EV = "sokomkononi:users-updated";

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
function norm(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || "",
    email: raw.email || "",
    phone: raw.phone || "",
    role: raw.is_staff || raw.is_superuser
      ? "Admin"
      : (raw.account_type === "BUSINESS" || raw.is_seller ? "Seller" : "Buyer"),
    status: raw.is_deleted ? "suspended" : (raw.is_active === false ? "suspended" : "active"),
    joined: raw.date_joined || raw.created_at,
    isStaff: !!raw.is_staff,
    isVerified: !!raw.is_verified,
  };
}

export function getUsers() { return read(); }
export function getUser(id) { return read().find((u) => u.id === id) || null; }
export function getUserByEmail(email) { return email ? read().find((u) => u.email === email) || null : null; }

export async function hydrateUsersFromApi() {
  try {
    const d = await api.get("/admin/users/?page_size=200");
    const list = Array.isArray(d) ? d : d?.results || [];
    write(list.map(norm).filter(Boolean));
    return { ok: true, count: list.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function suspendUserAsync(id) {
  const u = getUser(id);
  if (!u) return { ok: false, error: new Error("User not found") };
  if (u.status === "suspended") return { ok: true, warning: "already_suspended" };
  try {
    await api.post(`/admin/users/${id}/suspend/`, {});
    write(read().map((x) => (x.id === id ? { ...x, status: "suspended" } : x)));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function activateUserAsync(id) {
  const u = getUser(id);
  if (!u) return { ok: false, error: new Error("User not found") };
  if (u.status === "active") return { ok: true, warning: "already_active" };
  try {
    await api.post(`/admin/users/${id}/activate/`, {});
    write(read().map((x) => (x.id === id ? { ...x, status: "active" } : x)));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function toggleUserStatusAsync(id) {
  const u = getUser(id);
  if (!u) return { ok: false, error: new Error("User not found") };
  return u.status === "suspended" ? activateUserAsync(id) : suspendUserAsync(id);
}

export async function verifyUserAsync(id) {
  try {
    await api.post(`/admin/users/${id}/verify/`, {});
    write(read().map((x) => (x.id === id ? { ...x, isVerified: true } : x)));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function deleteUserAsync(id) {
  try {
    await api.delete(`/admin/users/${id}/`);
    write(read().filter((x) => x.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function useUsers() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateUsersFromApi();
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
export function useUser(id) {
  const list = useUsers();
  return id ? list.find((u) => u.id === id) || null : null;
}

// LEGACY (compat shims)
export const SEED_USERS = [];
export function saveUsers() {}
export function toggleUserStatus() {}
export function updateUser() {}

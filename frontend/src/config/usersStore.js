// ============================================================
// usersStore.js — API-backed via /api/admin/users/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_users_v1";
const UPDATE_EVENT = "sokomkononi:users-updated";

export const SEED_USERS = [];

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

function normalizeFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || "",
    email: raw.email || "",
    phone: raw.phone || "",
    role: raw.is_staff || raw.is_superuser
      ? "Admin"
      : (raw.account_type === "BUSINESS" || raw.is_seller
          ? "Seller"
          : "Buyer"),
    status: raw.is_deleted ? "suspended" : (raw.is_active === false ? "suspended" : "active"),
    joined: raw.date_joined || raw.created_at,
    isStaff: !!raw.is_staff,
    isVerified: !!raw.is_verified,
  };
}

export function getUsers() {
  return readFromStorage();
}

export function saveUsers(users) {
  saveAll(users);
}

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

export function toggleUserStatus(id) {
  const current = getUsers();
  const user = current.find((u) => u.id === id);
  const next = current.map((u) =>
    u.id === id ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u
  );
  saveAll(next);
  if (user) {
    if (user.status === "suspended") {
      api.post(`/admin/users/${id}/activate/`, {}).catch(() => {});
    } else {
      api.post(`/admin/users/${id}/suspend/`, {}).catch(() => {});
    }
  }
  return next;
}

export function updateUser(id, patch) {
  const next = getUsers().map((u) => (u.id === id ? { ...u, ...patch } : u));
  saveAll(next);
  return next;
}

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

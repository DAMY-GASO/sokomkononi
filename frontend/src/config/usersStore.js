// ============================================================
// usersStore.js — API-only via /api/admin/users/
// + Futa Permanently (hard delete)
// + Suspend inahitaji sababu
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
    status: raw.is_active === false ? "suspended" : "active",
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

// ============================================================
// SUSPEND — inahitaji sababu (herufi 5+)
// ============================================================
export async function suspendUserAsync(id, { reason } = {}) {
  const u = getUser(id);
  if (!u) return { ok: false, error: new Error("User not found") };
  if (u.status === "suspended") return { ok: true, warning: "already_suspended" };

  const cleanReason = (reason || "").trim();
  if (cleanReason.length < 5) {
    return { ok: false, error: new Error("Sababu inahitajika (herufi 5+).") };
  }

  try {
    await api.post(`/admin/users/${id}/suspend/`, { reason: cleanReason });
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

export async function toggleUserStatusAsync(id, opts) {
  const u = getUser(id);
  if (!u) return { ok: false, error: new Error("User not found") };
  return u.status === "suspended"
    ? activateUserAsync(id)
    : suspendUserAsync(id, opts);
}

export async function verifyUserAsync(id) {
  try {
    await api.post(`/admin/users/${id}/verify/`, {});
    write(read().map((x) => (x.id === id ? { ...x, isVerified: true } : x)));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ============================================================
// DELETE — soft delete (backend inaamua)
// ============================================================
export async function deleteUserAsync(id) {
  try {
    await api.delete(`/admin/users/${id}/`);
    write(read().filter((x) => x.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

// ============================================================
// PERMANENT DELETE — inahitaji sababu + "DELETE"
// ============================================================
export async function permanentDeleteUserAsync(id, { reason, confirmText } = {}) {
  const u = getUser(id);
  if (!u) return { ok: false, error: new Error("User not found") };

  if (u.isStaff) {
    return {
      ok: false,
      error: new Error("Hauwezi kumfuta admin. Wasiliana na Super Admin."),
    };
  }

  const cleanReason = (reason || "").trim();
  const cleanConfirm = (confirmText || "").trim();

  if (cleanReason.length < 5) {
    return { ok: false, error: new Error("Sababu inahitajika (herufi 5+).") };
  }
  if (cleanConfirm !== "DELETE") {
    return { ok: false, error: new Error('Lazima uandike "DELETE" kuthibitisha.') };
  }

  try {
    await api.delete(`/admin/users/${id}/permanent/`, {
      data: { reason: cleanReason, confirm_text: cleanConfirm },
    });
    write(read().filter((x) => x.id !== id));
    return { ok: true, deleted: true };
  } catch (err) {
    if (err?.status === 404 || err?.status === 405) {
      console.warn("[usersStore] /permanent/ haipo — tumia delete ya kawaida");
      return deleteUserAsync(id);
    }
    return { ok: false, error: err };
  }
}

let _usersHydratePromise = null;
function _dedupedUsersHydrate() {
  if (_usersHydratePromise) return _usersHydratePromise;
  _usersHydratePromise = hydrateUsersFromApi().finally(() => {
    _usersHydratePromise = null;
  });
  return _usersHydratePromise;
}

export function useUsers() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    _dedupedUsersHydrate();
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
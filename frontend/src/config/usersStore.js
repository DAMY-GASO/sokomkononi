// ============================================================
// usersStore.js
// CHANZO KIMOJA CHA UKWELI kwa Watumiaji (User Management).
//
// Kama dealsStore.js na listingsStore.js — demo ya front-end pekee
// inayotumia localStorage + custom event kuiga "backend ya pamoja".
// Backend halisi ikiwepo (mf. AuthContext inayosoma watumiaji halisi),
// badilisha tu functions hizi ziite API; sehemu zinazotumia useUsers()
// na setUserStatus() hazitahitaji kubadilika.
//
// Hii ndiyo pia mahali sahihi pa kuunganisha na AuthContext baadaye —
// mf. mtumiaji "suspended" hapa asiruhusiwe kuingia (login) upande wa
// mfumo mzima, badala ya Admin Dashboard pekee kujua hali yake.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_users_v1";
const UPDATE_EVENT = "sokomkononi:users-updated";

// ============================================================
// SEED_USERS — tupu. Data itakuja kutoka backend baadaye.
// ============================================================
export const SEED_USERS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_USERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_USERS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_USERS;
    return parsed;
  } catch {
    return SEED_USERS;
  }
}

/** Soma watumiaji wa sasa (snapshot moja, si reactive). */
export function getUsers() {
  return readFromStorage();
}

/** Andika orodha mpya kamili ya watumiaji. */
export function saveUsers(users) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Simamisha / washa tena mtumiaji mmoja kwa id yake. */
export function toggleUserStatus(id) {
  const current = getUsers();
  const next = current.map((u) =>
    u.id === id ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u
  );
  saveUsers(next);
  return next;
}

/** Badilisha (merge patch) mtumiaji mmoja moja kwa moja. */
export function updateUser(id, patch) {
  const current = getUsers();
  const next = current.map((u) => (u.id === id ? { ...u, ...patch } : u));
  saveUsers(next);
  return next;
}

/**
 * Hook ya React inayosoma watumiaji na kujisasisha yenyewe kwenye
 * AdminDashboard (User Management) papo hapo, bila reload.
 */
export function useUsers() {
  const [users, setUsers] = useState(() => getUsers());

  useEffect(() => {
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
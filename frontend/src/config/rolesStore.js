// ============================================================
// rolesStore.js
// CHANZO KIMOJA CHA UKWELI kwa Roles & Permissions (RBAC).
//
// Roles zinaonyesha ni sections gani Admin/Staff anaweza kufikia:
//   - Super Admin     → all access
//   - Finance Admin   → revenue, transactions, refunds
//   - Verification    → verification requests
//   - Support         → tickets, complaints
//   - Content Manager → banners, FAQs, Terms, Privacy
//   - Moderator       → listings, users
//
// Kama stores nyingine — demo ya front-end pekee. Backend halisi
// ikiwepo, badilisha functions hizi ziite API.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_roles_v1";
const UPDATE_EVENT = "sokomkononi:roles-updated";

// ============================================================
// PERMISSIONS — kila section ina permission key
// ============================================================
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
];

// ============================================================
// DEFAULT ROLES
// ============================================================
export const DEFAULT_ROLES = [
  {
    key: "super_admin",
    label: { sw: "Msimamizi Mkuu", en: "Super Admin" },
    description: {
      sw: "Ufikiaji kamili wa mfumo wote",
      en: "Full access to the entire system",
    },
    permissions: PERMISSIONS.map((p) => p.key),
    isSystem: true,
  },
  {
    key: "finance_admin",
    label: { sw: "Msimamizi wa Fedha", en: "Finance Admin" },
    description: {
      sw: "Malipo, mapato, na refunds",
      en: "Payments, revenue, and refunds",
    },
    permissions: ["overview", "revenue", "deals", "reports"],
    isSystem: true,
  },
  {
    key: "verification_officer",
    label: { sw: "Afisa Uthibitisho", en: "Verification Officer" },
    description: {
      sw: "Uthibitisho wa wauzaji, wanunuzi, mali, magari",
      en: "Verification of sellers, buyers, properties, vehicles",
    },
    permissions: ["overview", "verification", "users", "moderation"],
    isSystem: true,
  },
  {
    key: "support",
    label: { sw: "Huduma kwa Wateja", en: "Customer Support" },
    description: {
      sw: "Tickets na malalamiko ya watumiaji",
      en: "Tickets and user complaints",
    },
    permissions: ["overview", "support", "users", "deals"],
    isSystem: true,
  },
  {
    key: "content_manager",
    label: { sw: "Msimamizi wa Maudhui", en: "Content Manager" },
    description: {
      sw: "Homepage, banners, FAQs, Terms, Privacy",
      en: "Homepage, banners, FAQs, Terms, Privacy",
    },
    permissions: ["overview", "content", "promotions"],
    isSystem: true,
  },
  {
    key: "moderator",
    label: { sw: "Msimamizi wa Mali", en: "Moderator" },
    description: {
      sw: "Mali na watumiaji",
      en: "Listings and users",
    },
    permissions: ["overview", "moderation", "users", "deals"],
    isSystem: true,
  },
];

// ============================================================
// SEED — roles za default
// ============================================================
export const SEED_ROLES = DEFAULT_ROLES;

function readFromStorage() {
  if (typeof window === "undefined") return SEED_ROLES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_ROLES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_ROLES;
    return parsed;
  } catch {
    return SEED_ROLES;
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

/** Soma roles zote. */
export function getRoles() {
  return readFromStorage();
}

/** Pata role moja kwa key. */
export function getRole(key) {
  return getRoles().find((r) => r.key === key) || null;
}

/** Ongeza role mpya (custom). */
export function addRole(role) {
  const current = getRoles();
  if (current.some((r) => r.key === role.key)) {
    throw new Error(`Role "${role.key}" already exists`);
  }
  const entry = {
    ...role,
    isSystem: false,
  };
  const next = [...current, entry];
  saveAll(next);
  return entry;
}

/** Badilisha role. */
export function updateRole(key, patch) {
  const next = getRoles().map((r) =>
    r.key === key ? { ...r, ...patch, key: r.key, isSystem: r.isSystem } : r
  );
  saveAll(next);
  return next;
}

/** Futa role (custom pekee). */
export function removeRole(key) {
  const role = getRole(key);
  if (role?.isSystem) {
    throw new Error(`Cannot delete system role "${key}"`);
  }
  const next = getRoles().filter((r) => r.key !== key);
  saveAll(next);
  return next;
}

/** Angalia kama role ina permission. */
export function hasPermission(roleKey, permission) {
  const role = getRole(roleKey);
  if (!role) return false;
  return role.permissions.includes(permission);
}

// ============================================================
// SUB-ADMINS + ROLES
// ============================================================
const SUBADMINS_KEY = "sokomkononi_subadmins_v1";
const SUBADMINS_EVENT = "sokomkononi:subadmins-updated";

function readSubAdmins() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SUBADMINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveSubAdmins(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SUBADMINS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(SUBADMINS_EVENT));
}

export function getSubAdmins() {
  return readSubAdmins();
}

export function addSubAdmin({ name, email, roleKey }) {
  const entry = {
    id: `sa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    email,
    roleKey,
    addedAt: new Date().toISOString(),
    active: true,
  };
  const next = [...readSubAdmins(), entry];
  saveSubAdmins(next);
  return entry;
}

export function updateSubAdmin(id, patch) {
  const next = readSubAdmins().map((s) =>
    s.id === id ? { ...s, ...patch } : s
  );
  saveSubAdmins(next);
  return next;
}

export function removeSubAdmin(id) {
  const next = readSubAdmins().filter((s) => s.id !== id);
  saveSubAdmins(next);
  return next;
}

// ============================================================
// HOOKS
// ============================================================
export function useRoles() {
  const [roles, setRoles] = useState(() => getRoles());

  useEffect(() => {
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
  const [list, setList] = useState(() => readSubAdmins());

  useEffect(() => {
    const sync = () => setList(readSubAdmins());
    window.addEventListener("storage", sync);
    window.addEventListener(SUBADMINS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SUBADMINS_EVENT, sync);
    };
  }, []);

  return list;
}

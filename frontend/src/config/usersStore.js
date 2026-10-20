// ============================================================
// usersStore.js — API-only via /api/admin/users/
//
// Marekebisho:
//  - norm(): role sasa inasoma `raw.role` au `raw.user_role`
//    kutoka backend. Fallback: is_seller + is_buyer → Both,
//    Seller, Buyer, Neither. Admins wanabaki Admin.
//  - roleMap inahakikisha casing ni consistent (Admin, Seller,
//    Buyer, Both, Neither) — inalingana na UserManagementSection.
// ============================================================
import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_users_v1";
const EV = "sokomkononi:users-updated";

// ============================================================
// LOCAL STORAGE (cache ya ukurasa wa sasa)
// ============================================================
function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

// ============================================================
// ROLE NORMALIZER
// ============================================================
const ROLE_MAP = {
  admin: "Admin",
  administrator: "Admin",
  super_admin: "Admin",
  staff: "Admin",
  seller: "Seller",
  muuzaji: "Seller",
  buyer: "Buyer",
  mnunuzi: "Buyer",
  both: "Both",
  both_roles: "Both",
  wote_wawili: "Both",
  neither: "Neither",
  wapya: "Neither",
  new: "Neither",
  none: "Neither",
};

function resolveRole(raw) {
  if (!raw) return "Neither";

  // 1) Backend role (preferred)
  const backendRole =
    raw.role ||
    raw.user_role ||
    raw.roleKey ||
    raw.role_key ||
    null;
  if (backendRole) {
    const key = String(backendRole).toLowerCase().replace(/[\s-]/g, "_");
    if (ROLE_MAP[key]) return ROLE_MAP[key];
    // Unknown string but still a valid-looking role
    const title = String(backendRole)
      .toLowerCase()
      .replace(/(^|_)(\w)/g, (_, __, c) => " " + c.toUpperCase())
      .trim();
    if (title === "Admin" || title === "Seller" || title === "Buyer" || title === "Both" || title === "Neither") {
      return title;
    }
  }

  // 2) Admin flags
  if (raw.is_staff || raw.is_superuser || raw.isStaff || raw.isSuperuser) {
    return "Admin";
  }

  // 3) is_seller + is_buyer flags
  const isSeller =
    raw.is_seller === true ||
    raw.isSeller === true ||
    raw.seller === true ||
    raw.has_listings === true ||
    raw.hasListings === true;
  const isBuyer =
    raw.is_buyer === true ||
    raw.isBuyer === true ||
    raw.buyer === true ||
    raw.has_deals === true ||
    raw.hasDeals === true ||
    raw.has_purchases === true ||
    raw.hasPurchases === true;

  if (isSeller && isBuyer) return "Both";
  if (isSeller) return "Seller";
  if (isBuyer) return "Buyer";

  // 4) account_type fallback
  const accType = String(raw.account_type || raw.accountType || "").toUpperCase();
  if (accType === "BUSINESS") return "Seller";

  // 5) Default
  return "Neither";
}

// ============================================================
// NORMALIZE — kutoka backend → frontend shape
// ============================================================
function norm(raw) {
  if (!raw) return null;

  const role = resolveRole(raw);

  return {
    id: raw.id,
    name: raw.name || raw.full_name || raw.fullName || "",
    email: raw.email || "",
    phone: raw.phone || "",
    avatar: raw.avatar || raw.avatar_url || raw.avatarUrl || null,
    role,
    status: raw.is_active === false ? "suspended" : "active",
    joined: raw.date_joined || raw.dateJoined || raw.created_at || raw.createdAt,
    isStaff: !!(raw.is_staff || raw.isStaff || raw.is_superuser || raw.isSuperuser),
    isVerified: !!(raw.is_verified || raw.isVerified),
  };
}

// ============================================================
// READS (kutoka cache ya sasa)
// ============================================================
export function getUsers() {
  return read();
}
export function getUser(id) {
  return read().find((u) => u.id === id) || null;
}
export function getUserByEmail(email) {
  return email ? read().find((u) => u.email === email) || null : null;
}

// ============================================================
// HYDRATE — inarudisha { ok, count, page, totalPages, hasNext, hasPrev }
// ============================================================
export async function hydrateUsersFromApi(opts = {}) {
  const {
    page = 1,
    pageSize = 20,
    q = "",
    role = "all",
    status = "all",
    verified = "all",
  } = opts;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  if (q) params.set("q", q);
  if (role && role !== "all") params.set("role", role);
  if (status && status !== "all") params.set("status", status);
  if (verified && verified !== "all") params.set("verified", verified);

  try {
    const d = await api.get(`/admin/users/?${params.toString()}`);
    const list = Array.isArray(d) ? d : d?.results || [];
    const count = Array.isArray(d) ? list.length : d?.count ?? list.length;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));

    write(list.map(norm).filter(Boolean));

    return {
      ok: true,
      count,
      page,
      pageSize,
      totalPages,
      hasNext: !!d?.next,
      hasPrev: !!d?.previous,
    };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// SUSPEND — inahitaji sababu (herufi 5+)
// ============================================================
export async function suspendUserAsync(id, { reason } = {}) {
  const u = getUser(id);
  if (!u) return { ok: false, error: new Error("User not found") };
  if (u.status === "suspended")
    return { ok: true, warning: "already_suspended" };

  const cleanReason = (reason || "").trim();
  if (cleanReason.length < 5) {
    return {
      ok: false,
      error: new Error("Sababu inahitajika (herufi 5+)."),
    };
  }

  try {
    await api.post(`/admin/users/${id}/suspend/`, { reason: cleanReason });
    write(
      read().map((x) => (x.id === id ? { ...x, status: "suspended" } : x))
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// ACTIVATE
// ============================================================
export async function activateUserAsync(id) {
  const u = getUser(id);
  if (!u) return { ok: false, error: new Error("User not found") };
  if (u.status === "active") return { ok: true, warning: "already_active" };
  try {
    await api.post(`/admin/users/${id}/activate/`, {});
    write(
      read().map((x) => (x.id === id ? { ...x, status: "active" } : x))
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// TOGGLE — moja kwa moja
// ============================================================
export async function toggleUserStatusAsync(id, opts) {
  const u = getUser(id);
  if (!u) return { ok: false, error: new Error("User not found") };
  return u.status === "suspended"
    ? activateUserAsync(id)
    : suspendUserAsync(id, opts);
}

// ============================================================
// VERIFY
// ============================================================
export async function verifyUserAsync(id) {
  try {
    await api.post(`/admin/users/${id}/verify/`, {});
    write(
      read().map((x) => (x.id === id ? { ...x, isVerified: true } : x))
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// ============================================================
// DELETE — soft delete (backend inaamua)
// ============================================================
export async function deleteUserAsync(id) {
  try {
    await api.delete(`/admin/users/${id}/`);
    write(read().filter((x) => x.id !== id));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
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
      error: new Error(
        "Hauwezi kumfuta admin. Wasiliana na Super Admin."
      ),
    };
  }

  const cleanReason = (reason || "").trim();
  const cleanConfirm = (confirmText || "").trim();

  if (cleanReason.length < 5) {
    return {
      ok: false,
      error: new Error("Sababu inahitajika (herufi 5+)."),
    };
  }
  if (cleanConfirm !== "DELETE") {
    return {
      ok: false,
      error: new Error('Lazima uandike "DELETE" kuthibitisha.'),
    };
  }

  try {
    await api.delete(`/admin/users/${id}/permanent/`, {
      data: { reason: cleanReason, confirm_text: cleanConfirm },
    });
    write(read().filter((x) => x.id !== id));
    return { ok: true, deleted: true };
  } catch (err) {
    if (err?.status === 404 || err?.status === 405) {
      return {
        ok: false,
        error: new Error(
          "Permanent delete is not enabled on this server. Contact backend admin."
        ),
      };
    }
    return { ok: false, error: err };
  }
}

// ============================================================
// HOOKS
// ============================================================
let _usersHydratePromise = null;
function _dedupedUsersHydrate(opts) {
  if (_usersHydratePromise) return _usersHydratePromise;
  _usersHydratePromise = hydrateUsersFromApi(opts).finally(() => {
    _usersHydratePromise = null;
  });
  return _usersHydratePromise;
}

/**
 * useUsers — inasikiliza cache + inarudisha list ya users.
 *
 * Kumbuka: kwa default inachukua page 1 (pageSize 20). Kama
 * unahitaji users wote (mfano kwa Overview/Reports), tumia
 * hydrateUsersFromApi({ page: 1, pageSize: 1000 }) au ongeza
 * endpoint ya "all". Hii ni muhimu ili idadi ya users
 * inayorudishwa ilingane na total.
 */
export function useUsers() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    // Fetch page kubwa ili kupata idadi kamili kwa dashboards
    _dedupedUsersHydrate({ page: 1, pageSize: 1000 });
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

/**
 * useUser — inarudisha user mmoja kwa id.
 */
export function useUser(id) {
  const list = useUsers();
  return id ? list.find((u) => u.id === id) || null : null;
}

/**
 * useUsersPaged — hook kamili yenye pagination + filters.
 */
export function useUsersPaged(initial = {}) {
  const [users, setUsers] = useState(() => read());
  const [page, setPage] = useState(initial.page || 1);
  const [pageSize] = useState(initial.pageSize || 20);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    role: initial.role || "all",
    status: initial.status || "all",
    verified: initial.verified || "all",
    q: initial.q || "",
  });

  const fetchPage = useCallback(
    async (p = page, f = filters) => {
      setLoading(true);
      setError(null);
      const res = await hydrateUsersFromApi({
        page: p,
        pageSize,
        q: f.q,
        role: f.role,
        status: f.status,
        verified: f.verified,
      });
      setLoading(false);
      if (res.ok) {
        setUsers(read());
        setPage(res.page);
        setTotalPages(res.totalPages);
        setCount(res.count);
      } else {
        setError(res.error);
      }
      return res;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageSize]
  );

  // Sinc cache
  useEffect(() => {
    const sync = () => setUsers(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);

  useEffect(() => {
    fetchPage(page, filters);
  }, [page, filters]);

  const goToPage = useCallback((p) => setPage(p), []);
  const refresh = useCallback(() => fetchPage(page, filters), [
    fetchPage,
    page,
    filters,
  ]);

  const updateFilters = useCallback((partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  return {
    users,
    page,
    pageSize,
    totalPages,
    count,
    loading,
    error,
    filters,
    setFilters: updateFilters,
    goToPage,
    refresh,
  };
}
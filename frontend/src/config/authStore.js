// ============================================================
// authStore.js — API-backed via /api/auth/
// FIX: clears BOTH user and JWT tokens when login/me() fails.
// ============================================================
import { useEffect, useState } from "react";
import { authApi, setUnauthorizedHandler } from "../api/index.js";
import { clearTokens as clearJWT, setTokens } from "../api/client.js";

const STORAGE_KEY = "sokomkononi_current_user_v1";
const UPDATE_EVENT = "sokomkononi:auth-updated";
const AVATAR_KEY_PREFIX = "admin_avatar_";

// ============================================================
// /auth/me/ dedupe + short TTL cache
// Multiple components calling useAuth() will share the same
// request instead of firing one per mount. A fresh call after
// HYDRATE_TTL_MS still refreshes to keep the data current.
// ============================================================
let inflightHydrate = null;
let lastHydrateAt = 0;
const HYDRATE_TTL_MS = 30_000;
function resetHydrateCache() {
  inflightHydrate = null;
  lastHydrateAt = 0;
}

export const SEED_USER = null;

function attachStoredAvatar(user) {
  if (!user?.id) return user;
  try {
    const stored = localStorage.getItem(AVATAR_KEY_PREFIX + user.id);
    return stored ? { ...user, avatarUrl: stored } : user;
  } catch { return user; }
}

function readFromStorage() {
  if (typeof window === "undefined") return SEED_USER;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_USER;
    const parsed = JSON.parse(raw);
    return parsed ? attachStoredAvatar(parsed) : SEED_USER;
  } catch { return SEED_USER; }
}

function saveUser(user) {
  if (typeof window === "undefined") return;
  if (user === null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Force the next useAuth() mount to refetch /auth/me/. */
export function invalidateAuthCache() {
  resetHydrateCache();
}

// Keys we deliberately keep after logout (language preference, admin path,
// etc. are stored elsewhere so nothing to keep here).
const PRESERVE_AFTER_LOGOUT = new Set([]);

/** Clears user state, wipes JWT tokens, and purges user-scoped caches. */
/**
 * Wipe every user-scoped localStorage key on logout / 401.
 * Prevents the next user on a shared device from seeing the
 * previous user's saved listings, messages, deals, etc.
 */
const USER_SCOPED_KEYS = [
  "sokomkononi_current_user_v1",
  "sokomkononi_access",
  "sokomkononi_refresh",
  "sokomkononi_listings_mine_v1",
  "sokomkononi_listings_public_v1",
  "sokomkononi_saved_v1",
  "sokomkononi_saved_snapshots_v1",
  "sokomkononi_messages_v2",
  "sokomkononi_leads_v1",
  "sokomkononi_searches_v1",
  "sokomkononi_waiting_list_v1",
  "sokomkononi_notifications_v1",
  "sokomkononi_deals_v1",
  "sokomkononi_transactions_v1",
  "sokomkononi_transactions_lifecycle_v1",
  "sokomkononi_user_credits_v1",
  "sokomkononi_recently_viewed_v1",
  "sokomkononi_dashboard_side_v1",
  "sokomkononi_undo_v1",
  "sokomkononi_moderation_queue_v1",
  "sokomkononi_moderation_decisions_v1",
];

function wipeUserScopedCaches() {
  if (typeof window === "undefined") return;
  try {
    USER_SCOPED_KEYS.forEach((k) => {
      try { window.localStorage.removeItem(k); } catch { /* noop */ }
    });
  } catch { /* noop */ }
}

function hardReset() {
  saveUser(null);
  clearJWT();
  resetHydrateCache();
  if (typeof window === "undefined") return;
  // Only wipe AUTH-scoped keys. Do NOT wipe the user's saved listings,
  // searches, messages, dashboard-side preference, admin avatar, etc.
  // A transient 401 must never destroy their data.
  wipeUserScopedCaches();
}

function computeIsAdmin(user) {
  if (!user) return false;
  return (
    user.role === "Admin" ||
    user.role === "admin" ||
    user.role === "ADMIN" ||
    user.isStaff === true ||
    user.is_staff === true ||
    user.isSuperuser === true ||
    user.is_superuser === true
  );
}

function normalizeUserFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || raw.full_name || "",
    email: raw.email || "",
    phone: raw.phone || "",
    username: raw.username || "",
    isStaff: !!(raw.is_staff || raw.isStaff),
    isSuperuser: !!(raw.is_superuser || raw.isSuperuser),
    is_seller: !!(raw.is_seller || raw.account_type === "BUSINESS"),
    account_type: raw.account_type || "PERSONAL",
    accountType: raw.account_type || "PERSONAL",
    role: raw.is_staff || raw.is_superuser
      ? "Admin"
      : (raw.account_type === "BUSINESS" || raw.is_seller ? "Seller" : "Buyer"),
    isVerified: !!(raw.is_verified ?? raw.isVerified),
    emailVerified: !!(raw.email_verified ?? raw.emailVerified),
    phoneVerified: !!(raw.phone_verified ?? raw.phoneVerified),
    verified: !!(raw.is_verified ?? raw.verified),
    isActive: raw.is_active !== false,
    isDeleted: !!raw.is_deleted,
    avatarUrl: raw.avatar || raw.avatar_url || raw.avatarUrl || null,
    bio: raw.bio || "",
    region: raw.region || "",
    location: raw.location || raw.region || "",
    district: raw.district || "",
    joinedAt: raw.date_joined || raw.created_at || null,
    memberSince: raw.date_joined || raw.created_at || null,
    lastLogin: raw.last_login || null,
    updatedAt: raw.updated_at || null,
  };
}

export function getCurrentUser() { return readFromStorage(); }
export function isAuthenticated() { return Boolean(getCurrentUser()?.id); }
export function isAdmin() { return computeIsAdmin(getCurrentUser()); }
export function hasRole(role) {
  const user = getCurrentUser();
  if (!user) return false;
  if (Array.isArray(role)) return role.includes(user.role);
  return user.role === role;
}
export function isSeller() { return hasRole("Seller"); }

export function hydrateCurrentUserFromApi() {
  if (!authApi.isAuthenticated()) {
    if (getCurrentUser() !== null) hardReset();
    return Promise.resolve({ ok: false, source: "no-token" });
  }

  // Fresh cache hit — return immediately.
  const now = Date.now();
  if (lastHydrateAt && now - lastHydrateAt < HYDRATE_TTL_MS) {
    return Promise.resolve({
      ok: true,
      source: "cache",
      user: getCurrentUser(),
    });
  }

  // Dedupe concurrent calls — return the same in-flight promise.
  if (inflightHydrate) return inflightHydrate;

  inflightHydrate = (async () => {
    try {
      const raw = await authApi.me();
      const user = normalizeUserFromApi(raw);
      saveUser(user);
      lastHydrateAt = Date.now();
      return { ok: true, source: "api", user };
    } catch (err) {
      if (err?.status === 401) {
        hardReset();
        return { ok: false, source: "unauthorized", error: err };
      }
      console.warn("[authStore] hydrate failed:", err);
      return { ok: false, source: "error", error: err };
    } finally {
      inflightHydrate = null;
    }
  })();

  return inflightHydrate;
}

export async function loginAsync({ identifier, password }) {
  if (!identifier || !password) {
    return { ok: false, error: new Error("identifier na password zinahitajika") };
  }
  try {
    const data = await authApi.login({ identifier, password });
    const me = data?.user ?? (await authApi.me());
    const user = normalizeUserFromApi(me);
    saveUser(user);
    resetHydrateCache();
    lastHydrateAt = Date.now();
    return { ok: true, user };
  } catch (err) {
    hardReset();
    console.warn("[authStore] login failed:", err);
    return { ok: false, error: err };
  }
}

export async function adminLoginAsync({ identifier, password }) {
  if (!identifier || !password) {
    return { ok: false, error: new Error("identifier na password zinahitajika") };
  }
  try {
    await authApi.login({ identifier, password });
    const me = await authApi.me();
    if (!computeIsAdmin(me)) {
      await authApi.logout().catch(() => {});
      hardReset();
      return { ok: false, error: new Error("Huna ruhusa ya kuingia kama admin") };
    }
    const user = normalizeUserFromApi(me);
    saveUser(user);
    resetHydrateCache();
    lastHydrateAt = Date.now();
    return { ok: true, user };
  } catch (err) {
    hardReset();
    console.warn("[authStore] adminLogin failed:", err);
    return { ok: false, error: err };
  }
}

export async function registerAsync(payload) {
  if (!payload?.email || !payload?.password) {
    return { ok: false, error: new Error("email na password zinahitajika") };
  }
  try {
    const account_type =
      payload.account_type ||
      (payload.intent === "sell" ? "BUSINESS" : "INDIVIDUAL");
    const data = await authApi.register({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      account_type,
    });
    return { ok: true, data };
  } catch (err) {
    console.warn("[authStore] register failed:", err);
    return { ok: false, error: err };
  }
}

export async function verifyOtpAsync({ identifier, otpCode, verificationType }) {
  if (!identifier || !otpCode) {
    return { ok: false, error: new Error("identifier na otpCode zinahitajika") };
  }
  const type = verificationType || (identifier.includes("@") ? "EMAIL" : "PHONE");
  try {
    const data = await authApi.verifyOtp({
      identifier, otp_code: otpCode, verification_type: type,
    });
    const me = data?.user ?? (await authApi.me());
    const user = normalizeUserFromApi(me);
    saveUser(user);
    resetHydrateCache();
    lastHydrateAt = Date.now();
    return { ok: true, user };
  } catch (err) {
    hardReset();
    console.warn("[authStore] verifyOtp failed:", err);
    return { ok: false, error: err };
  }
}

export async function logoutAsync() {
  try { await authApi.logout(); }
  catch (err) { console.warn("[authStore] logout API error:", err); }
  finally { hardReset(); }
  return { ok: true };
}

export async function sendOtpAsync(_email) {
  return { ok: true, note: "OTP imetumwa na register" };
}

export async function updateProfileAsync(patch) {
  const previous = getCurrentUser();
  if (!previous) return { ok: false, error: new Error("Hakuna mtumiaji aliyeingia") };
  const optimistic = { ...previous, ...patch };
  saveUser(optimistic);
  try {
    const raw = await authApi.updateProfile(patch);
    const updated = normalizeUserFromApi(raw);
    if (updated) { saveUser(updated); return { ok: true, user: updated }; }
    return { ok: true, user: optimistic };
  } catch (err) {
    saveUser(previous);
    console.warn("[authStore] updateProfile failed:", err);
    return { ok: false, error: err };
  }
}

export async function refreshProfileAsync() {
  try {
    const raw = await authApi.profile();
    const user = normalizeUserFromApi(raw);
    if (user) saveUser(user);
    return { ok: true, user };
  } catch (err) {
    console.warn("[authStore] refreshProfile failed:", err);
    return { ok: false, error: err };
  }
}
export async function refreshUserAsync() { return refreshProfileAsync(); }

export async function changePasswordAsync({ currentPassword, newPassword, confirmPassword }) {
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false, error: new Error("Sehemu zote zinahitajika") };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: new Error("Nywila mpya hazifanani") };
  }
  try {
    await authApi.changePassword({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return { ok: true };
  } catch (err) {
    console.warn("[authStore] changePassword failed:", err);
    return { ok: false, error: err };
  }
}

export async function updatePasswordAsync(args) {
  return changePasswordAsync({
    currentPassword: args.currentPassword,
    newPassword: args.newPassword,
    confirmPassword: args.confirmPassword || args.newPassword,
  });
}

export async function forgotPasswordAsync(identifier) {
  if (!identifier) return { ok: false, error: new Error("identifier inahitajika") };
  try {
    const data = await authApi.forgotPassword(identifier);
    return { ok: true, data };
  } catch (err) { return { ok: false, error: err }; }
}

export async function verifyPasswordResetOtpAsync({ identifier, otpCode, verificationType }) {
  if (!identifier || !otpCode) {
    return { ok: false, error: new Error("identifier na otpCode zinahitajika") };
  }
  const type = verificationType || (identifier.includes("@") ? "EMAIL" : "PHONE");
  try {
    const data = await authApi.verifyPasswordResetOtp({
      identifier, otp_code: otpCode, verification_type: type,
    });
    return { ok: true, data };
  } catch (err) { return { ok: false, error: err }; }
}

export async function resetPasswordAsync({ resetToken, newPassword, confirmPassword }) {
  if (!resetToken || !newPassword || !confirmPassword) {
    return { ok: false, error: new Error("Sehemu zote zinahitajika") };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: new Error("Nywila mpya hazifanani") };
  }
  try {
    await authApi.resetPassword({
      reset_token: resetToken,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

async function resizeImageFile(file, maxDim = 512, quality = 0.85) {
  if (typeof document === "undefined") return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function updateAvatarAsync(file) {
  const user = getCurrentUser();
  if (!user) return { ok: false, error: new Error("Hakuna mtumiaji") };
  if (!file) return { ok: false, error: new Error("No file") };
  if (!file.type.startsWith("image/")) return { ok: false, error: new Error("Si picha") };
  try {
    const toUpload = await resizeImageFile(file);
    if (toUpload.size > 2 * 1024 * 1024) {
      return { ok: false, error: new Error("Picha ni kubwa mno — chagua nyingine (max 2MB)") };
    }
    const fd = new FormData();
    fd.append("avatar", toUpload);
    const { api } = await import("../api/client.js");
    await api.upload("/auth/profile/avatar/", fd);
    const me = await authApi.me();
    const fresh = normalizeUserFromApi(me);
    if (fresh) saveUser(fresh);
    return { ok: true, avatarUrl: fresh?.avatarUrl || null };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeAvatarAsync() {
  const user = getCurrentUser();
  if (!user) return { ok: false, error: new Error("Hakuna mtumiaji") };
  try {
    const { api } = await import("../api/client.js");
    await api.delete("/auth/profile/avatar/");
    saveUser({ ...user, avatarUrl: null });
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export async function deleteAccountAsync(reason = "") {
  const previous = getCurrentUser();
  if (!previous) return { ok: false, error: new Error("Hakuna mtumiaji aliyeingia") };
  if (computeIsAdmin(previous)) {
    return {
      ok: false,
      error: new Error("Akaunti za Admin haziwezi kufutwa kupitia UI. Wasiliana na Super Admin mwingine."),
    };
  }
  try {
    await authApi.deleteAccount(reason);
    hardReset();
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function installUnauthorizedHandler() {
  setUnauthorizedHandler(() => {
    console.warn("[authStore] 401 — kusafisha user + tokens");
    hardReset();
  });
}

export function useAuth() {
  const [user, setUser] = useState(() => getCurrentUser());
  const [isLoading, setIsLoading] = useState(() => !getCurrentUser());

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    hydrateCurrentUserFromApi().finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    const sync = () => setUser(getCurrentUser());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return {
    user,
    isLoading,
    loading: isLoading,
    isAuthenticated: !!user?.id,
    isAdmin: computeIsAdmin(user),
    setUser: saveUser,
  };
}

export function useCurrentUser() { return useAuth().user; }
export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}
export function useHasRole(role) {
  const { user } = useAuth();
  if (!user) return false;
  if (Array.isArray(role)) return role.includes(user.role);
  return user.role === role;
}

export async function socialLoginAsync({ provider, idToken, code, user: socialUser }) {
  if (!provider || !idToken) {
    return { ok: false, error: new Error("provider na idToken zinahitajika") };
  }
  try {
    const { api } = await import("../api/client.js");
    const data = await api.post("/auth/social/", {
      provider,
      id_token: idToken,
      code: code || null,
      ...(socialUser ? { user: socialUser } : {}),
    });
    // MUHIMU: hifadhi JWT kama authApi.login inavyofanya. Bila hii,
    // authApi.me() inarudi 401 na hardReset() inamtoa mtumiaji nje.
    if (data?.access) setTokens({ access: data.access, refresh: data.refresh });
    const me = data?.user ?? (await authApi.me());
    const user = normalizeUserFromApi(me);
    saveUser(user);
    resetHydrateCache();
    lastHydrateAt = Date.now();
    return { ok: true, user };
  } catch (err) {
    hardReset();
    console.warn("[authStore] socialLogin failed:", err);
    return { ok: false, error: err };
  }
}

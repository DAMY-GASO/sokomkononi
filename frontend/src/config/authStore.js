// ============================================================
// authStore.js — API-backed via /api/auth/
// Backward compatible na AuthContext API
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { authApi, setUnauthorizedHandler } from "../api/index.js";

const STORAGE_KEY = "sokomkononi_current_user_v1";
const UPDATE_EVENT = "sokomkononi:auth-updated";
const AVATAR_KEY_PREFIX = "admin_avatar_";

export const SEED_USER = null;

// ============================================================
// AVATAR HELPERS
// ============================================================
function attachStoredAvatar(user) {
  if (!user?.id) return user;
  try {
    const stored = localStorage.getItem(AVATAR_KEY_PREFIX + user.id);
    return stored ? { ...user, avatarUrl: stored } : user;
  } catch {
    return user;
  }
}

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return SEED_USER;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_USER;
    const parsed = JSON.parse(raw);
    return parsed ? attachStoredAvatar(parsed) : SEED_USER;
  } catch {
    return SEED_USER;
  }
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

// ============================================================
// ROLE HELPERS
// ============================================================
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

// ============================================================
// NORMALIZER
// ============================================================
function normalizeUserFromApi(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || raw.full_name || "",
    email: raw.email || "",
    phone: raw.phone || "",
    username: raw.username || "",

    // Roles — keep both camelCase and snake_case for compat
    isStaff: !!(raw.is_staff || raw.isStaff),
    isSuperuser: !!(raw.is_superuser || raw.isSuperuser),
    is_seller: !!(raw.is_seller || raw.account_type === "BUSINESS"),
    account_type: raw.account_type || "PERSONAL",
    accountType: raw.account_type || "PERSONAL",
    role: raw.is_staff || raw.is_superuser
      ? "Admin"
      : (raw.account_type === "BUSINESS" || raw.is_seller ? "Seller" : "Buyer"),

    // Verification
    isVerified: !!(raw.is_verified ?? raw.isVerified),
    emailVerified: !!(raw.email_verified ?? raw.emailVerified),
    phoneVerified: !!(raw.phone_verified ?? raw.phoneVerified),
    verified: !!(raw.is_verified ?? raw.verified), // alias kwa legacy

    // Status
    isActive: raw.is_active !== false,
    isDeleted: !!raw.is_deleted,

    // Profile
    avatarUrl: raw.avatar || raw.avatar_url || raw.avatarUrl || null,
    bio: raw.bio || "",
    region: raw.region || "",
    location: raw.location || raw.region || "", // alias kwa legacy
    district: raw.district || "",

    // Meta
    joinedAt: raw.date_joined || raw.created_at || null,
    memberSince: raw.date_joined || raw.created_at || null, // alias kwa legacy
    lastLogin: raw.last_login || null,
    updatedAt: raw.updated_at || null,
  };
}

// ============================================================
// READS
// ============================================================
export function getCurrentUser() {
  return readFromStorage();
}

export function isAuthenticated() {
  return Boolean(getCurrentUser()?.id);
}

export function isAdmin() {
  return computeIsAdmin(getCurrentUser());
}

export function hasRole(role) {
  const user = getCurrentUser();
  if (!user) return false;
  if (Array.isArray(role)) return role.includes(user.role);
  return user.role === role;
}

export function isSeller() {
  return hasRole("Seller");
}

// ============================================================
// HYDRATE
// ============================================================
export async function hydrateCurrentUserFromApi() {
  try {
    if (!authApi.isAuthenticated()) {
      if (getCurrentUser() !== null) saveUser(null);
      return { ok: false, source: "no-token" };
    }

    const raw = await authApi.me();
    const user = normalizeUserFromApi(raw);
    saveUser(user);
    return { ok: true, source: "api", user };
  } catch (err) {
    if (err?.status === 401) {
      saveUser(null);
      return { ok: false, source: "unauthorized", error: err };
    }
    console.warn("[authStore] hydrate failed:", err);
    return { ok: false, source: "error", error: err };
  }
}

// ============================================================
// AUTH ACTIONS
// ============================================================
export async function loginAsync({ identifier, password }) {
  if (!identifier || !password) {
    return { ok: false, error: new Error("identifier na password zinahitajika") };
  }

  try {
    const data = await authApi.login({ identifier, password });
    const me = data?.user ?? (await authApi.me());
    const user = normalizeUserFromApi(me);
    saveUser(user);
    return { ok: true, user };
  } catch (err) {
    saveUser(null);
    console.warn("[authStore] login failed:", err);
    return { ok: false, error: err };
  }
}

/**
 * Admin login — inahakikisha ni admin, vinginevyo inatupa tokens zote.
 */
export async function adminLoginAsync({ identifier, password }) {
  if (!identifier || !password) {
    return { ok: false, error: new Error("identifier na password zinahitajika") };
  }

  try {
    await authApi.login({ identifier, password });
    const me = await authApi.me();

    if (!computeIsAdmin(me)) {
      await authApi.logout();
      return {
        ok: false,
        error: new Error("Huna ruhusa ya kuingia kama admin"),
      };
    }

    const user = normalizeUserFromApi(me);
    saveUser(user);
    return { ok: true, user };
  } catch (err) {
    saveUser(null);
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
  // Support legacy positional calls too
  if (typeof identifier === "string" && typeof otpCode === "string" && !verificationType) {
    verificationType = identifier.includes("@") ? "EMAIL" : "PHONE";
  }

  if (!identifier || !otpCode) {
    return { ok: false, error: new Error("identifier na otpCode zinahitajika") };
  }

  // Auto-detect type
  const type = verificationType || (identifier.includes("@") ? "EMAIL" : "PHONE");

  try {
    const data = await authApi.verifyOtp({
      identifier,
      otp_code: otpCode,
      verification_type: type,
    });
    const me = data?.user ?? (await authApi.me());
    const user = normalizeUserFromApi(me);
    saveUser(user);
    return { ok: true, user };
  } catch (err) {
    console.warn("[authStore] verifyOtp failed:", err);
    return { ok: false, error: err };
  }
}

export async function logoutAsync() {
  try {
    await authApi.logout();
  } catch (err) {
    console.warn("[authStore] logout API error (ignored):", err);
  } finally {
    saveUser(null);
  }
  return { ok: true };
}

/** @deprecated OTP inatumwa kiotomatiki na registerAsync */
export async function sendOtpAsync(_email) {
  return { ok: true, note: "OTP imetumwa na register" };
}

// ============================================================
// PROFILE
// ============================================================
export async function updateProfileAsync(patch) {
  const previous = getCurrentUser();
  if (!previous) return { ok: false, error: new Error("Hakuna mtumiaji aliyeingia") };

  const optimistic = { ...previous, ...patch };
  saveUser(optimistic);

  try {
    const raw = await authApi.updateProfile(patch);
    const updated = normalizeUserFromApi(raw);
    if (updated) {
      saveUser(updated);
      return { ok: true, user: updated };
    }
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

/** Alias — jina kutoka AuthContext */
export async function refreshUserAsync() {
  return refreshProfileAsync();
}

// ============================================================
// PASSWORD
// ============================================================
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

/** Alias — jina kutoka AuthContext */
export async function updatePasswordAsync(args) {
  return changePasswordAsync({
    currentPassword: args.currentPassword,
    newPassword: args.newPassword,
    confirmPassword: args.confirmPassword || args.newPassword,
  });
}

export async function forgotPasswordAsync(identifier) {
  if (!identifier) {
    return { ok: false, error: new Error("identifier inahitajika") };
  }
  try {
    const data = await authApi.forgotPassword(identifier);
    return { ok: true, data };
  } catch (err) {
    console.warn("[authStore] forgotPassword failed:", err);
    return { ok: false, error: err };
  }
}

export async function verifyPasswordResetOtpAsync({
  identifier,
  otpCode,
  verificationType,
}) {
  if (!identifier || !otpCode) {
    return { ok: false, error: new Error("identifier na otpCode zinahitajika") };
  }
  const type = verificationType || (identifier.includes("@") ? "EMAIL" : "PHONE");

  try {
    const data = await authApi.verifyPasswordResetOtp({
      identifier,
      otp_code: otpCode,
      verification_type: type,
    });
    return { ok: true, data };
  } catch (err) {
    console.warn("[authStore] verifyPasswordResetOtp failed:", err);
    return { ok: false, error: err };
  }
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
  } catch (err) {
    console.warn("[authStore] resetPassword failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// AVATAR (mock — hadi backend endpoint ipatikane)
// ============================================================
export async function updateAvatarAsync(file) {
  const user = getCurrentUser();
  if (!user) return { ok: false, error: new Error("Hakuna mtumiaji") };
  if (!file) return { ok: false, error: new Error("No file") };
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: new Error("Si picha") };
  }
  if (file.size > 1024 * 1024) {
    return { ok: false, error: new Error("Picha ni kubwa mno (max 1MB)") };
  }

  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    localStorage.setItem(AVATAR_KEY_PREFIX + user.id, dataUrl);
    const next = { ...user, avatarUrl: dataUrl };
    saveUser(next);
    return { ok: true, avatarUrl: dataUrl };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function removeAvatarAsync() {
  const user = getCurrentUser();
  if (!user) return { ok: false, error: new Error("Hakuna mtumiaji") };

  localStorage.removeItem(AVATAR_KEY_PREFIX + user.id);
  const next = { ...user, avatarUrl: null };
  saveUser(next);
  return { ok: true };
}

// ============================================================
// ACCOUNT DELETION
// ============================================================
export async function deleteAccountAsync(reason = "") {
  const previous = getCurrentUser();
  if (!previous) return { ok: false, error: new Error("Hakuna mtumiaji aliyeingia") };

  try {
    await authApi.deleteAccount(reason);
    saveUser(null);
    return { ok: true };
  } catch (err) {
    console.warn("[authStore] deleteAccount failed:", err);
    return { ok: false, error: err };
  }
}

// ============================================================
// 401 HANDLER
// ============================================================
export function installUnauthorizedHandler() {
  setUnauthorizedHandler(() => {
    console.warn("[authStore] 401 — kusafisha user state");
    saveUser(null);
  });
}

// ============================================================
// HOOKS
// ============================================================
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
    loading: isLoading, // alias kwa backward compat na AuthContext
    isAuthenticated: !!user?.id,
    isAdmin: computeIsAdmin(user),
    setUser: saveUser, // ⚠️ BAD PRACTICE — kwa legacy pages tu
  };
}

export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}

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

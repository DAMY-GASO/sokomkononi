// ============================================================
// authStore.js — API-backed via /api/auth/
//
// Inasimamia:
//   - Current user (kutoka /auth/me/)
//   - Login / Register / Logout
//   - Profile updates
//   - Password change / reset (3-step)
//   - Account deletion
//
// Kumbuka: tokens zinasimamiwa na api/client.js (setTokens/clearTokens).
// Store hii inasimamia tu USER STATE, sio tokens.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { authApi, setUnauthorizedHandler } from "../api/auth.js";
import { api } from "../api/client.js";

const STORAGE_KEY = "sokomkononi_current_user_v1";
const UPDATE_EVENT = "sokomkononi:auth-updated";

export const SEED_USER = null;

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return SEED_USER;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_USER;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : SEED_USER;
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

    // Roles
    isStaff: !!raw.is_staff,
    isSuperuser: !!raw.is_superuser,
    isSeller: !!(raw.is_seller || raw.account_type === "BUSINESS"),
    accountType: raw.account_type || "PERSONAL",
    role: raw.is_staff || raw.is_superuser
      ? "Admin"
      : (raw.account_type === "BUSINESS" || raw.is_seller ? "Seller" : "Buyer"),

    // Verification
    isVerified: !!raw.is_verified,
    emailVerified: !!raw.email_verified,
    phoneVerified: !!raw.phone_verified,

    // Status
    isActive: raw.is_active !== false,
    isDeleted: !!raw.is_deleted,

    // Profile
    avatarUrl: raw.avatar || raw.avatar_url || null,
    bio: raw.bio || "",
    region: raw.region || "",
    district: raw.district || "",

    // Meta
    joinedAt: raw.date_joined || raw.created_at || null,
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

export function hasRole(role) {
  const user = getCurrentUser();
  if (!user) return false;
  if (Array.isArray(role)) return role.includes(user.role);
  return user.role === role;
}

export function isAdmin() {
  return hasRole("Admin");
}

export function isSeller() {
  return hasRole("Seller");
}

// ============================================================
// HYDRATE — pitia /auth/me/ kama token ipo
// ============================================================
export async function hydrateCurrentUserFromApi() {
  try {
    // authApi.isAuthenticated() inaangalia token ipo
    if (!authApi.isAuthenticated()) {
      // Hakuna token — safisha user
      if (getCurrentUser() !== null) saveUser(null);
      return { ok: false, source: "no-token" };
    }

    const raw = await authApi.me();
    const user = normalizeUserFromApi(raw);
    saveUser(user);
    return { ok: true, source: "api", user };
  } catch (err) {
    // 401 → token imeisha; safisha user
    if (err?.status === 401) {
      saveUser(null);
      return { ok: false, source: "unauthorized", error: err };
    }
    console.warn("[authStore] hydrate failed:", err);
    return { ok: false, source: "error", error: err };
  }
}

// ============================================================
// ASYNC AUTH ACTIONS
// ============================================================

/**
 * Login — inarudisha { ok, user, error }.
 * Tokens zinasimamiwa na authApi.login() yenyewe.
 */
export async function loginAsync({ identifier, password }) {
  if (!identifier || !password) {
    return { ok: false, error: new Error("identifier na password zinahitajika") };
  }

  try {
    await authApi.login({ identifier, password });
    // Baada ya login, tunahitaji kuchukua user kutoka /auth/me/
    const me = await authApi.me();
    const user = normalizeUserFromApi(me);
    saveUser(user);
    return { ok: true, user };
  } catch (err) {
    console.warn("[authStore] login failed:", err);
    saveUser(null); // Hakikisha user state ni safi
    return { ok: false, error: err };
  }
}

/**
 * Register — inarudisha { ok, data, error }.
 * Baada ya register, mfumo unahitaji OTP verification kabla ya login.
 */
export async function registerAsync(payload) {
  if (!payload?.email || !payload?.password) {
    return { ok: false, error: new Error("email na password zinahitajika") };
  }

  try {
    const data = await authApi.register(payload);
    return { ok: true, data };
  } catch (err) {
    console.warn("[authStore] register failed:", err);
    return { ok: false, error: err };
  }
}

/**
 * Verify OTP — inarudisha { ok, user, error }.
 * Baada ya OTP, tokens zinapokelewa na authApi.verifyOtp().
 */
export async function verifyOtpAsync({ identifier, otpCode, verificationType = "EMAIL" }) {
  if (!identifier || !otpCode) {
    return { ok: false, error: new Error("identifier na otpCode zinahitajika") };
  }

  try {
    await authApi.verifyOtp({
      identifier,
      otp_code: otpCode,
      verification_type: verificationType,
    });
    const me = await authApi.me();
    const user = normalizeUserFromApi(me);
    saveUser(user);
    return { ok: true, user };
  } catch (err) {
    console.warn("[authStore] verifyOtp failed:", err);
    return { ok: false, error: err };
  }
}

/**
 * Logout — inasafisha tokens na user state.
 */
export async function logoutAsync() {
  try {
    await authApi.logout(); // Inasafisha tokens yenyewe
  } catch (err) {
    console.warn("[authStore] logout API error (ignored):", err);
  } finally {
    saveUser(null);
  }
  return { ok: true };
}

// ============================================================
// PROFILE
// ============================================================
export async function updateProfileAsync(patch) {
  const previous = getCurrentUser();
  if (!previous) return { ok: false, error: new Error("Hakuna mtumiaji aliyeingia") };

  // Optimistic
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
    saveUser(previous); // Rollback
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

// ============================================================
// PASSWORD — change (logged-in)
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

// ============================================================
// PASSWORD RESET — 3-step flow
// ============================================================
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
  verificationType = "EMAIL",
}) {
  if (!identifier || !otpCode) {
    return { ok: false, error: new Error("identifier na otpCode zinahitajika") };
  }
  try {
    const data = await authApi.verifyPasswordResetOtp({
      identifier,
      otp_code: otpCode,
      verification_type: verificationType,
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
// DELETE ACCOUNT
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
    // Hakuna rollback — state haikubadilika
    return { ok: false, error: err };
  }
}

// ============================================================
// UNAUTHORIZED HANDLER — inaitwa na api/client.js kwenye 401
// ============================================================
export function installUnauthorizedHandler() {
  setUnauthorizedHandler(() => {
    console.warn("[authStore] 401 detected — kusafisha user state");
    saveUser(null);
    // Unaweza ku-redirect hapa:
    // if (typeof window !== "undefined") window.location.href = "/login";
  });
}

// ============================================================
// HOOKS
// ============================================================
export function useAuth() {
  const [user, setUser] = useState(() => getCurrentUser());
  const [isLoading, setIsLoading] = useState(() => !getCurrentUser());

  useEffect(() => {
    // Hydrate kwenye mount
    let cancelled = false;
    setIsLoading(true);
    hydrateCurrentUserFromApi().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    // Sync kila mabadiliko
    const sync = () => setUser(getCurrentUser());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return { user, isLoading, isAuthenticated: !!user?.id };
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

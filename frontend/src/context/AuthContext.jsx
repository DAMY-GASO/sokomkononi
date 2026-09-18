import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  authApi,
  setTokens,
  clearTokens,
  getAccessToken,
  setUnauthorizedHandler,
  ApiError,
} from "../api";

const AuthContext = createContext();

// ============================================================
// MOCK AVATAR STORAGE (localStorage) — hadi backend itatoa endpoint
// ============================================================
const AVATAR_KEY_PREFIX = "admin_avatar_";

function attachStoredAvatar(user) {
  if (!user?.id) return user;
  const stored = localStorage.getItem(AVATAR_KEY_PREFIX + user.id);
  return stored ? { ...user, avatarUrl: stored } : user;
}

function computeIsAdmin(user) {
  if (!user) return false;
  return (
    user.role === "admin" ||
    user.role === "ADMIN" ||
    user.is_staff === true ||
    user.is_superuser === true ||
    user.roleKey === "super_admin" ||
    user.role_key === "super_admin"
  );
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const setUser = useCallback((u) => {
    setUserState(u ? attachStoredAvatar(u) : null);
    setIsAdmin(computeIsAdmin(u));
  }, []);

  // ---------- 401 global handler ----------
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearTokens();
      setUserState(null);
      setIsAdmin(false);
    });
  }, []);

  // ---------- Bootstrap: kama token ipo, fetch /auth/me/ ----------
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!getAccessToken()) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
        }
        if (!cancelled) {
          setUserState(null);
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  // ============================================================
  // LOGIN (buyer / seller)
  // ============================================================
  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials);
      const me = data.user ?? (await authApi.me());
      setUser(me);
      return me;
    },
    [setUser]
  );

  // ============================================================
  // ADMIN LOGIN
  // ============================================================
  const adminLogin = useCallback(
    async (credentials) => {
      const payload = {
        identifier: credentials.identifier || credentials.email,
        password: credentials.password,
      };

      const data = await authApi.login(payload);
      const me = data.user ?? (await authApi.me());

      if (!computeIsAdmin(me)) {
        await authApi.logout();
        throw new Error("Huna ruhusa ya kuingia kama admin");
      }

      setUser(me);
      return me;
    },
    [setUser]
  );

  // ============================================================
  // REGISTER — inarudisha { detail } pekee (haileti tokens)
  // ============================================================
  const register = useCallback(async (userData) => {
    const account_type =
      userData.account_type ||
      (userData.intent === "sell" ? "BUSINESS" : "INDIVIDUAL");

    return authApi.register({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      account_type,
    });
  }, []);

  // ============================================================
  // VERIFY OTP — inakamilisha usajili na kuingiza user
  //
  // Backend inahitaji verification_type="EMAIL" au "PHONE".
  // Tunachukua moja kwa moja kutoka payload — kama ni phone
  // (haina "@"), tunatuma "PHONE".
  // ============================================================
  const verifyOtp = useCallback(
    async (identifierOrEmail, otpCode, verificationType) => {
      let payload;

      if (typeof identifierOrEmail === "object") {
        payload = { ...identifierOrEmail };
      } else {
        payload = {
          identifier: identifierOrEmail,
          otp_code: otpCode,
        };
      }

      // Auto-detect verification type if not provided
      if (!payload.verification_type) {
        if (verificationType) {
          payload.verification_type = verificationType;
        } else {
          const id = payload.identifier || "";
          payload.verification_type = id.includes("@") ? "EMAIL" : "PHONE";
        }
      }

      const data = await authApi.verifyOtp(payload);
      const me = data.user ?? (await authApi.me());
      setUser(me);
      return me;
    },
    [setUser]
  );

  // ============================================================
  // LOGOUT
  // ============================================================
  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, [setUser]);

  // ============================================================
  // REFRESH USER
  // ============================================================
  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return null;
    const me = await authApi.me();
    setUser(me);
    return me;
  }, [setUser]);

  // ============================================================
  // PROFILE
  // ============================================================
  const updateProfile = useCallback(
    async (patch) => {
      const updated = await authApi.updateProfile(patch);
      const next =
        updated && Object.keys(updated).length
          ? updated
          : { ...user, ...patch };
      setUser(next);
      return next;
    },
    [user, setUser]
  );

  // ============================================================
  // CHANGE PASSWORD (logged-in)
  // ============================================================
  const changePassword = useCallback(
    async ({ currentPassword, newPassword, confirmPassword }) => {
      if (newPassword !== confirmPassword) {
        throw new Error("Manenosiri hayafanani.");
      }
      return authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
    },
    []
  );

  // Alias for backward compatibility with AdminProfile.jsx
  const updatePassword = useCallback(
    async ({ currentPassword, newPassword, confirmPassword }) =>
      changePassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmPassword || newPassword,
      }),
    [changePassword]
  );

  // ============================================================
  // 3-STEP PASSWORD RESET (forgot / verify-otp / reset)
  // ============================================================
  const forgotPassword = useCallback(async (identifier) => {
    return authApi.forgotPassword(identifier);
  }, []);

  const verifyPasswordResetOtp = useCallback(
    async ({ identifier, otp_code, verification_type }) => {
      let type = verification_type;
      if (!type) {
        type = identifier?.includes("@") ? "EMAIL" : "PHONE";
      }
      return authApi.verifyPasswordResetOtp({
        identifier,
        otp_code,
        verification_type: type,
      });
    },
    []
  );

  const resetPassword = useCallback(
    async ({ reset_token, new_password, confirm_password }) => {
      if (new_password !== confirm_password) {
        throw new Error("Manenosiri hayafanani.");
      }
      return authApi.resetPassword({
        reset_token,
        new_password,
        confirm_password,
      });
    },
    []
  );

  // ============================================================
  // AVATAR (mock — backend haitoa endpoint bado)
  // ============================================================
  const updateAvatar = useCallback(
    async (file) => {
      if (!file) throw new Error("No file");
      if (!file.type.startsWith("image/")) throw new Error("Not an image");
      if (file.size > 1024 * 1024)
        throw new Error("Image too large (max 1MB)");

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      localStorage.setItem(AVATAR_KEY_PREFIX + user.id, dataUrl);
      const next = { ...user, avatarUrl: dataUrl };
      setUser(next);
      return dataUrl;
    },
    [user, setUser]
  );

  const removeAvatar = useCallback(async () => {
    localStorage.removeItem(AVATAR_KEY_PREFIX + user.id);
    setUser({ ...user, avatarUrl: null });
  }, [user, setUser]);

  // ============================================================
  // LEGACY ALIASES (kwa pages zilizotumia majina ya awali)
  // ============================================================
  const sendOtp = useCallback(async (_email) => {
    return { success: true, note: "OTP imetumwa na register" };
  }, []);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================
  const value = {
    user,
    setUser,
    loading,
    isAdmin,

    // Auth
    login,
    adminLogin,
    register,
    verifyOtp,
    sendOtp,
    logout,
    refreshUser,

    // Profile
    updateProfile,
    updatePassword,
    changePassword,
    updateAvatar,
    removeAvatar,

    // Password reset (3-step)
    forgotPassword,
    verifyPasswordResetOtp,
    resetPassword,

    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
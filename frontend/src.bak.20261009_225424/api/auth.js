// ============================================================
// api/auth.js — Auth endpoints
// Backend: /api/auth/
// 
// ⚠️ NOTE: Social login is handled by `socialLoginAsync` in
// `authStore.js` (it needs access to `saveUser` and other
// authStore internals). Do NOT duplicate it here.
// ============================================================
import { api, setTokens, clearTokens, getAccessToken, getRefreshToken } from "./client";

export const authApi = {
  // ----- Register / Login / Logout -----
  login: async ({ identifier, password }) => {
    const data = await api.post("/auth/login/", { identifier, password });
    if (data?.access) setTokens({ access: data.access, refresh: data.refresh });
    return data;
  },

  register: (payload) => api.post("/auth/register/", payload),

  verifyOtp: async ({ identifier, otp_code, verification_type = "EMAIL" }) => {
    const data = await api.post("/auth/verify-otp/", {
      identifier,
      otp_code,
      verification_type,
    });
    if (data?.access) setTokens({ access: data.access, refresh: data.refresh });
    return data;
  },

  logout: async () => {
    const refresh = getRefreshToken();
    try {
      await api.post("/auth/logout/", refresh ? { refresh } : {});
    } catch {
      // ignore — token may already be invalid
    } finally {
      clearTokens();
    }
  },

  // ----- Profile -----
  me: () => api.get("/auth/me/"),
  profile: () => api.get("/auth/profile/"),
  updateProfile: (payload) => api.patch("/auth/profile/", payload),

  // ----- Password change (logged-in) -----
  changePassword: ({ current_password, new_password, confirm_password }) =>
    api.post("/auth/password/change/", {
      current_password,
      new_password,
      confirm_password,
    }),

  // ----- 3-step password reset -----
  forgotPassword: (identifier) =>
    api.post("/auth/password/forgot/", { identifier }),

  verifyPasswordResetOtp: ({
    identifier,
    otp_code,
    verification_type = "EMAIL",
  }) =>
    api.post("/auth/password/verify-otp/", {
      identifier,
      otp_code,
      verification_type,
    }),

  resetPassword: ({ reset_token, new_password, confirm_password }) =>
    api.post("/auth/password/reset/", {
      reset_token,
      new_password,
      confirm_password,
    }),

  // ----- Account deletion -----
  deleteAccount: (reason = "") =>
    api.post("/auth/delete-account/", { reason }),

  // ----- Utility -----
  isAuthenticated: () => Boolean(getAccessToken()),
};
// ============================================================
// api/auth.js — Auth endpoints
// ============================================================
import { api, setTokens, clearTokens, getAccessToken, getRefreshToken } from "./client";

export const authApi = {
  // ----- Register / Login / Logout -----
  login: async ({ identifier, password, captcha_token }) => {
    const data = await api.post("/auth/login/", {
      identifier,
      password,
      ...(captcha_token ? { captcha_token } : {}),
    });
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

  resendOtp: (identifier) =>
    api.post("/auth/resend-otp/", { identifier }),

  // ----- Profile -----
  // Backend returns `{user: {...}}` for /auth/me/ and `{message, profile}`
  // for /auth/profile/. Unwrap both so callers always get a user object.
  me: async () => {
    const data = await api.get("/auth/me/");
    return data?.user ?? data;
  },
  profile: async () => {
    const data = await api.get("/auth/profile/");
    return data?.profile ?? data?.user ?? data;
  },
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
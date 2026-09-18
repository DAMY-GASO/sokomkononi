import { api, setTokens, clearTokens, getAccessToken } from "./client";

export const authApi = {
  login: async ({ identifier, password }) => {
    const data = await api.post("/auth/login/", { identifier, password });
    if (data?.access) setTokens({ access: data.access, refresh: data.refresh });
    return data;
  },
  register: (payload) => api.post("/auth/register/", payload),
  verifyOtp: async ({ identifier, otp_code, verification_type = "EMAIL" }) => {
    const data = await api.post("/auth/verify-otp/", { identifier, otp_code, verification_type });
    if (data?.access) setTokens({ access: data.access, refresh: data.refresh });
    return data;
  },
  me: () => api.get("/auth/me/"),
  profile: () => api.get("/auth/profile/"),
  updateProfile: (payload) => api.patch("/auth/profile/", payload),
  logout: async () => {
    try { await api.post("/auth/logout/", {}); } catch {} finally { clearTokens(); }
  },
  isAuthenticated: () => Boolean(getAccessToken()),
};

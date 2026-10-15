// ============================================================
// api/security.js — 2FA + session management
// ============================================================
import { api } from "./client";

export const securityApi = {
  // ── Two-factor authentication ───────────────────────────
  twoFactorStatus: () => api.get("/auth/2fa/status/"),
  twoFactorSetup: () => api.post("/auth/2fa/setup/", {}),
  twoFactorVerify: ({ code }) => api.post("/auth/2fa/verify/", { code }),
  twoFactorDisable: ({ password, code }) =>
    api.post("/auth/2fa/disable/", { password, code }),
  twoFactorRecoveryCodes: () => api.post("/auth/2fa/recovery-codes/", {}),
  // Login step (only if backend returns requires_2fa on /auth/login/)
  twoFactorLogin: ({ temp_token, code }) =>
    api.post("/auth/2fa/login/", { temp_token, code }),

  // ── Active sessions ─────────────────────────────────────
  sessions: () => api.get("/auth/sessions/"),
  revokeSession: (id) => api.delete(`/auth/sessions/${id}/`),
  revokeAllOtherSessions: () => api.post("/auth/sessions/revoke-others/", {}),

  // ── Data privacy ────────────────────────────────────────
  exportData: () => api.post("/auth/me/data-export/", {}),
};

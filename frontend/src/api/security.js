// ============================================================
// api/security.js — 2FA + session management
// ============================================================
import { api, getRefreshToken } from "./client";

// jti ya refresh token ya kifaa cha sasa (kutoka kwenye payload ya JWT).
// Inarudisha "" kama token haipo au si JWT halali.
export function currentRefreshJti() {
  try {
    const token = getRefreshToken();
    if (!token) return "";
    const part = String(token).split(".")[1];
    if (!part) return "";
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return payload?.jti ? String(payload.jti) : "";
  } catch {
    return "";
  }
}

export const securityApi = {
  // ── Two-factor authentication ───────────────────────────
  twoFactorStatus: () => api.get("/auth/2fa/status/"),
  twoFactorSetup: () => api.post("/auth/2fa/setup/", {}),
  twoFactorVerify: ({ code }) => api.post("/auth/2fa/verify/", { code }),
  twoFactorDisable: ({ password, code }) =>
    api.post("/auth/2fa/disable/", { password, code }),
  // Inahitaji code ya sasa ya authenticator
  twoFactorRecoveryCodes: ({ code } = {}) =>
    api.post("/auth/2fa/recovery-codes/", { code }),
  // Login step (only if backend returns requires_2fa on /auth/login/)
  twoFactorLogin: ({ code_token, code }) =>
    api.post("/auth/2fa/login/", { code_token, code }),

  // ── Active sessions ─────────────────────────────────────
  // `currentJti` (hiari) → backend inaweka `is_current` kwa kifaa cha sasa.
  sessions: ({ currentJti } = {}) =>
    api.get(
      currentJti
        ? `/auth/sessions/?current_jti=${encodeURIComponent(currentJti)}`
        : "/auth/sessions/"
    ),
  revokeSession: (id) => api.delete(`/auth/sessions/${id}/`),
  // `refresh` = refresh token ya kifaa cha sasa (backend inasoma jti ili isikitoe).
  revokeAllOtherSessions: ({ refresh } = {}) =>
    api.post("/auth/sessions/revoke-others/", refresh ? { refresh } : {}),

  // ── Data privacy ────────────────────────────────────────
  exportData: () => api.post("/auth/me/data-export/", {}),
};
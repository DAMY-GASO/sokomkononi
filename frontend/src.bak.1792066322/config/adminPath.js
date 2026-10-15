// ============================================================
// adminPath.js
// Secret path prefix kwa admin routes.
//
// - Production REQUIRES VITE_ADMIN_PATH to be set at build time.
// - Dev falls back to a known default so local dev keeps working.
// ============================================================

const ENV_PATH = import.meta.env.VITE_ADMIN_PATH;

if (!ENV_PATH && import.meta.env.PROD) {
  // Fail loudly at runtime rather than silently exposing the default.
  console.error(
    "[adminPath] VITE_ADMIN_PATH is not set in production. " +
      "Set it in your build env (Docker ARG / Vercel env)."
  );
}

export const ADMIN_PATH = ENV_PATH || "/smk-control-9x7k";

// Admin login path (tofauti na dashboard)
export const ADMIN_LOGIN_PATH = `${ADMIN_PATH}/enter`;

// ------------------------------------------------------------
// SESSION SCOPE
// ------------------------------------------------------------
export function getSessionScope() {
  if (typeof window === "undefined") return "user";
  const p = window.location.pathname;
  return p === ADMIN_PATH || p.startsWith(`${ADMIN_PATH}/`) ? "admin" : "user";
}

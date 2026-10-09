// ============================================================
// adminPath.js
// Secret path prefix kwa admin routes.
//
// ⚠️ BADILISHA prefix mara moja kwa mwaka au baada ya incident.
// Weka kwenye .env (production) badala ya hardcode hapa.
// ============================================================

export const ADMIN_PATH =
  import.meta.env.VITE_ADMIN_PATH || "/smk-control-9x7k";

// Admin login path (tofauti na dashboard)
export const ADMIN_LOGIN_PATH = `${ADMIN_PATH}/enter`;

// ------------------------------------------------------------
// SESSION SCOPE
// Admin na mtumiaji wana session TOFAUTI (tokens + user zinahifadhiwa
// kwenye keys tofauti), hivyo browser moja inaweza kuwa na admin tab
// na user tab bila kuingiliana.
//   • path inaanza na ADMIN_PATH  → scope "admin"
//   • nyingine zote               → scope "user"
// ------------------------------------------------------------
export function getSessionScope() {
  if (typeof window === "undefined") return "user";
  const p = window.location.pathname;
  return p === ADMIN_PATH || p.startsWith(`${ADMIN_PATH}/`) ? "admin" : "user";
}
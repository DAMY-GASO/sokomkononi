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

// ============================================================
// AuthContext.jsx — SHIM
// Ina-export useAuth + AuthProvider kutoka authStore.
// Hii inaruhusu files za zamani kuendelea kufanya kazi bila
// kubadilisha imports zao. Baadaye, unaweza kubadilisha files
// moja moja kutumia authStore moja kwa moja.
// ============================================================

import {
  useAuth as useAuthStore,
  getCurrentUser,
  isAuthenticated as isAuthStore,
  isAdmin as isAdminStore,
  installUnauthorizedHandler,
} from "../config/authStore.js";

// ============================================================
// AuthProvider — no-op
// authStore inajisimamia yenyewe, haihitaji Provider
// ============================================================
export function AuthProvider({ children }) {
  return children;
}

// ============================================================
// useAuth — delegate kwa authStore
// ============================================================
export function useAuth() {
  return useAuthStore();
}

// ============================================================
// Aliases — kwa backward compatibility
// ============================================================
export function useCurrentUser() {
  const { user } = useAuthStore();
  return user;
}

export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useAuthStore();
  return { isAuthenticated, isLoading };
}

export function useIsAdmin() {
  const { isAdmin } = useAuthStore();
  return isAdmin;
}

// ============================================================
// Functions za msingi (kwa legacy code)
// ============================================================
export { getCurrentUser, isAuthStore as isAuthenticated, isAdminStore as isAdmin };

// ============================================================
// DEFAULT EXPORT — kwa `import AuthContext from ...`
// ============================================================
const AuthContext = {
  useAuth,
  AuthProvider,
};

export default AuthContext;

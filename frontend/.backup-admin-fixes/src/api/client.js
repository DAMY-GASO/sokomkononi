// ============================================================
// client.js — API Client
// + Public endpoints hazitumii token (fix ya "User not found")
// ============================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) console.warn("[api] VITE_API_BASE_URL haipo");

const ACCESS_KEY = "sokomkononi_access";
const REFRESH_KEY = "sokomkononi_refresh";

let accessToken = localStorage.getItem(ACCESS_KEY);
let refreshToken = localStorage.getItem(REFRESH_KEY);
let onUnauthorized = null;

// ============================================================
// PUBLIC ENDPOINTS — hazihitaji token
// ============================================================
const PUBLIC_ENDPOINTS = [
  "/auth/login/",
  "/auth/register/",
  "/auth/verify-otp/",
  "/auth/password/forgot/",
  "/auth/password/verify-otp/",
  "/auth/password/reset/",
  "/auth/token/refresh/",
  "/contact/",
  "/categories/",           // public read
  "/listings/",             // public read (GET pekee — tuta-check method)
  "/content/",              // public read
  "/announcements/",        // public read
];

function isPublicEndpoint(path, method) {
  // POST/PUT/PATCH/DELETE kwa listings zinahitaji auth
  // GET ni public
  if (path.startsWith("/listings/") && method !== "GET") return false;

  return PUBLIC_ENDPOINTS.some((endpoint) => path.startsWith(endpoint));
}

// ============================================================
// TOKEN MANAGEMENT
// ============================================================
export function setTokens({ access, refresh } = {}) {
  if (access !== undefined) {
    accessToken = access;
    access ? localStorage.setItem(ACCESS_KEY, access) : localStorage.removeItem(ACCESS_KEY);
  }
  if (refresh !== undefined) {
    refreshToken = refresh;
    refresh ? localStorage.setItem(REFRESH_KEY, refresh) : localStorage.removeItem(REFRESH_KEY);
  }
}

export function getAccessToken() { return accessToken; }
export function getRefreshToken() { return refreshToken; }
export function clearTokens() { setTokens({ access: null, refresh: null }); }
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

export class ApiError extends Error {
  constructor(status, data) {
    const msg = (data && (data.detail || data.message || data.error)) || `API error ${status}`;
    super(msg);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ============================================================
// TOKEN REFRESH
// ============================================================
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshToken) throw new ApiError(401, { detail: "No refresh token" });
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      throw new ApiError(401, { detail: "Session expired" });
    }
    const data = await res.json();
    setTokens({ access: data.access, ...(data.refresh ? { refresh: data.refresh } : {}) });
    return data.access;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// ============================================================
// REQUEST
// ============================================================
async function request(path, {
  method = "GET",
  body,
  headers = {},
  retry = true,
  isFormData = false,
} = {}) {

  const isPublic = isPublicEndpoint(path, method);

  const finalHeaders = {
    ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
    // ⬇️ FIX: Usiongeze token kwa public endpoints
    ...(!isPublic && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  // 401 handling — only kama endpoint HAIKUWA public
  if (res.status === 401 && !isPublic && retry && refreshToken) {
    try {
      await refreshAccessToken();
      return request(path, { method, body, headers, retry: false, isFormData });
    } catch (err) {
      onUnauthorized?.();
      throw err;
    }
  }

  // Parse response
  const ct = res.headers.get("content-type") || "";
  let data;
  if (res.status === 204) data = null;
  else if (ct.includes("application/json")) data = await res.json();
  else data = await res.text();

  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// ============================================================
// API EXPORT
// ============================================================
export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
  upload: (path, formData, opts) =>
    request(path, { ...opts, method: "POST", body: formData, isFormData: true }),
};

// ============================================================
// client.js — API Client
// FIXED: precise public-endpoint detection. POST/PATCH/DELETE
// on /categories, /content, /announcements, /listings/admin/*
// now correctly attach the Authorization header.
// ============================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!BASE_URL) console.warn("[api] VITE_API_BASE_URL haipo");

const ACCESS_KEY = "sokomkononi_access";
const REFRESH_KEY = "sokomkononi_refresh";

let accessToken = localStorage.getItem(ACCESS_KEY);
let refreshToken = localStorage.getItem(REFRESH_KEY);
let onUnauthorized = null;

// ============================================================
// PUBLIC ENDPOINTS
// ============================================================
// Fully public POSTs (no token on any method)
const PUBLIC_POST_PREFIX = [
  "/auth/login/",
  "/auth/register/",
  "/auth/verify-otp/",
  "/auth/password/forgot/",
  "/auth/password/verify-otp/",
  "/auth/password/reset/",
  "/auth/token/refresh/",
  "/contact/",
];

// Public GETs (regex). Must NOT match /listings/admin/* or /listings/fee-rules/*
const PUBLIC_GET_PATTERNS = [
  /^\/listings\/?(\?.*)?$/,
  /^\/listings\/(?!admin\/|fee-rules\/)([^/]+)\/?(\?.*)?$/,
  /^\/listings\/(?!admin\/|fee-rules\/)([^/]+)\/images\/?(\?.*)?$/,
  /^\/listings\/(?!admin\/|fee-rules\/)([^/]+)\/images\/([^/]+)\/?(\?.*)?$/,
  /^\/listings\/(?!admin\/|fee-rules\/)([^/]+)\/(property-details|land-details|vehicle-details|business-details|equipment-details)\/detail\/?(\?.*)?$/,
  /^\/categories\/?(\?.*)?$/,
  /^\/categories\/[^/]+\/?(\?.*)?$/,
  /^\/content\/?(\?.*)?$/,
  /^\/content\/(about|terms|privacy|help)\/?(\?.*)?$/,
  /^\/announcements\/?(\?.*)?$/,
  /^\/boosting\/packages\/?(\?.*)?$/,
  /^\/boosting\/packages\/([^/]+)\/?(\?.*)?$/,
  /^\/bundles\/?(\?.*)?$/,
  /^\/bundles\/([^/]+)\/?(\?.*)?$/,
  /^\/banners\/?(\?.*)?$/,
  /^\/reservation-rates\/?(\?.*)?$/,
  /^\/leading-fees\/?(\?.*)?$/,
  /^\/advertisement-fees\/?(\?.*)?$/,
];

function isPublicEndpoint(path, method) {
  const m = (method || "GET").toUpperCase();
  if (m === "GET") {
    return PUBLIC_GET_PATTERNS.some((re) => re.test(path));
  }
  return PUBLIC_POST_PREFIX.some((p) => path.startsWith(p));
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
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

// ============================================================
// REQUEST
// ============================================================
async function request(path, {
  method = "GET", body, headers = {}, retry = true, isFormData = false,
} = {}) {
  const isPublic = isPublicEndpoint(path, method);

  const finalHeaders = {
    ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(!isPublic && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401 && !isPublic && retry && refreshToken) {
    try {
      await refreshAccessToken();
      return request(path, { method, body, headers, retry: false, isFormData });
    } catch (err) {
      onUnauthorized?.();
      throw err;
    }
  }

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
  get:    (path, opts) => request(path, { ...opts, method: "GET" }),
  post:   (path, body, opts) => request(path, { ...opts, method: "POST",   body }),
  patch:  (path, body, opts) => request(path, { ...opts, method: "PATCH",  body }),
  put:    (path, body, opts) => request(path, { ...opts, method: "PUT",    body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
  upload: (path, formData, opts) =>
    request(path, { ...opts, method: "POST", body: formData, isFormData: true }),
};

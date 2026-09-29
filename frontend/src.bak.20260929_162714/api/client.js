// ============================================================
// client.js — API Client
// - AbortController timeout on every request
// - Precise public-endpoint detection
// - No local fallbacks
// ============================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!BASE_URL) throw new Error("[api] VITE_API_BASE_URL is required");

const ACCESS_KEY = "sokomkononi_access";
const REFRESH_KEY = "sokomkononi_refresh";
const DEFAULT_TIMEOUT_MS = 20000;
const UPLOAD_TIMEOUT_MS = 60000;

let accessToken = localStorage.getItem(ACCESS_KEY);
let refreshToken = localStorage.getItem(REFRESH_KEY);
let onUnauthorized = null;

const PUBLIC_POST_PREFIX = [
  "/auth/login/",
  "/auth/register/",
  "/auth/verify-otp/",
  "/auth/password/forgot/",
  "/auth/password/verify-otp/",
  "/auth/password/reset/",
  "/auth/token/refresh/",
  "/contact/",
  "/auth/social/",
];

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
  /^\/credits\/services\/?(\?.*)?$/,
];

function isPublicEndpoint(path, method) {
  const m = (method || "GET").toUpperCase();
  if (m === "GET") return PUBLIC_GET_PATTERNS.some((re) => re.test(path));
  return PUBLIC_POST_PREFIX.some((p) => path.startsWith(p));
}

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
    const msg =
      (data && (data.detail || data.message || data.error)) ||
      (typeof data === "string" ? data : "") ||
      `API error ${status}`;
    super(msg);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function fetchWithTimeout(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new ApiError(408, { detail: "Request timed out. Please try again." });
    }
    throw new ApiError(0, { detail: err.message || "Network error. Check your connection." });
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------
// Retry: transient network / 5xx failures only. Never retries 4xx,
// never retries POSTs that mutate money (see RETRYABLE_METHODS).
// ------------------------------------------------------------
const RETRYABLE_METHODS = new Set(["GET", "HEAD"]);
const RETRY_MAX = 3;
const RETRY_BASE_MS = 600;

function isRetryableError(err) {
  if (!err) return false;
  if (err.status === 0) return true;              // network / timeout
  if (err.status === 408 || err.status === 429) return true;
  if (err.status >= 500 && err.status < 600) return true;
  return false;
}

async function withRetry(fn, method) {
  if (!RETRYABLE_METHODS.has(String(method || "GET").toUpperCase())) {
    return fn();
  }
  let lastErr;
  for (let attempt = 0; attempt < RETRY_MAX; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryableError(err) || attempt === RETRY_MAX - 1) throw err;
      const wait = RETRY_BASE_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

let refreshPromise = null;
async function refreshAccessToken() {
  if (!refreshToken) throw new ApiError(401, { detail: "No refresh token" });
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/token/refresh/`, {
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

async function request(path, {
  method = "GET", body, headers = {}, retry = true, isFormData = false, timeoutMs,
} = {}) {
  const isPublic = isPublicEndpoint(path, method);

  const finalHeaders = {
    ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(!isPublic && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers,
  };

  const res = await withRetry(
    () =>
      fetchWithTimeout(`${BASE_URL}${path}`, {
        method,
        headers: finalHeaders,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      }, timeoutMs),
    method
  );

  if (res.status === 401 && !isPublic && retry && refreshToken) {
    try {
      await refreshAccessToken();
      return request(path, { method, body, headers, retry: false, isFormData, timeoutMs });
    } catch (err) {
      onUnauthorized?.();
      throw err;
    }
  }

  const ct = res.headers.get("content-type") || "";
  let data;
  if (res.status === 204) data = null;
  else if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch (parseErr) {
      // Server claimed JSON but the body wasn't parseable
      data = { detail: `Invalid JSON response (${res.status})` };
    }
  } else if (ct.includes("text/html")) {
    // Django error pages arrive as HTML. Detect the common ones and
    // surface a clean message so the console isn't flooded with markup.
    const html = await res.text();
    let detail = `Server returned HTML (${res.status})`;
    if (/DisallowedHost/i.test(html)) {
      detail =
        "Backend rejected the request: DisallowedHost. " +
        "Add this domain to Django ALLOWED_HOSTS and restart the backend.";
    } else if (/CSRF/i.test(html)) {
      detail =
        "CSRF verification failed. Add this origin to Django CSRF_TRUSTED_ORIGINS.";
    } else if (/<title>([^<]+)<\/title>/i.test(html)) {
      const m = html.match(/<title>([^<]+)<\/title>/i);
      detail = m ? m[1].trim() : detail;
    }
    data = { detail, htmlLength: html.length };
  } else {
    data = await res.text();
  }

  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  get:    (path, opts) => request(path, { ...opts, method: "GET" }),
  post:   (path, body, opts) => request(path, { ...opts, method: "POST",   body }),
  patch:  (path, body, opts) => request(path, { ...opts, method: "PATCH",  body }),
  put:    (path, body, opts) => request(path, { ...opts, method: "PUT",    body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
  upload: (path, formData, opts) =>
    request(path, { ...opts, method: "POST", body: formData, isFormData: true, timeoutMs: UPLOAD_TIMEOUT_MS }),
};

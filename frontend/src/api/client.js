// ============================================================
// client.js — API Client
// ============================================================

import { getSessionScope } from "../config/adminPath.js";

const TOKEN_KEYS = {
  user: { access: "sokomkononi_access", refresh: "sokomkononi_refresh" },
  admin: { access: "sokomkononi_admin_access", refresh: "sokomkononi_admin_refresh" },
};
const keys = () => TOKEN_KEYS[getSessionScope()];

const DEFAULT_TIMEOUT_MS = 20000;
const UPLOAD_TIMEOUT_MS = 60000;

let onUnauthorized = null;
let baseUrlWarned = false;

function getBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (!raw) {
    if (!baseUrlWarned) {
      console.error(
        "[api/client] VITE_API_BASE_URL is not set — falling back to same-origin /api. " +
          "Set it in .env (dev) or your hosting env (prod)."
      );
      baseUrlWarned = true;
    }
    return "/api";
  }
  return raw.replace(/\/+$/, "");
}

// ============================================================
// LANGUAGE (Accept-Language)
// ============================================================
function getLang() {
  if (typeof window === "undefined") return "sw";
  let v = window.__SMK_LANG__;
  // Fallback: maombi ya kwanza yanaweza kutoka kabla LanguageProvider haijaweka __SMK_LANG__
  if (!v) {
    try { v = window.localStorage.getItem("preferred_language"); } catch { /* noop */ }
  }
  return v === "en" ? "en" : "sw";
}

// ============================================================
// CSRF TOKEN
// ============================================================
function getCsrfToken() {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

const PUBLIC_POST_PREFIX = [
  "/auth/login/",
  "/auth/register/",
  "/auth/verify-otp/",
  "/auth/password/forgot/",
  "/auth/password/verify-otp/",
  "/auth/password/reset/",
  "/auth/token/refresh/",
  "/auth/social/",
  "/contact/",
];

const PUBLIC_GET_PATTERNS = [
  /^\/content\/?(\?.*)?$/,
  /^\/content\/(about|terms|privacy|help)\/?(\?.*)?$/,
];

function isPublicEndpoint(path, method) {
  const m = (method || "GET").toUpperCase();
  if (m === "GET") return PUBLIC_GET_PATTERNS.some((re) => re.test(path));
  if (m === "POST") return PUBLIC_POST_PREFIX.some((p) => path.startsWith(p));
  return false;
}

export function setTokens({ access, refresh } = {}) {
  const k = keys();
  if (access !== undefined) {
    access ? localStorage.setItem(k.access, access) : localStorage.removeItem(k.access);
  }
  if (refresh !== undefined) {
    refresh ? localStorage.setItem(k.refresh, refresh) : localStorage.removeItem(k.refresh);
  }
}
export function getAccessToken() { return localStorage.getItem(keys().access); }
export function getRefreshToken() { return localStorage.getItem(keys().refresh); }
export function clearTokens() { setTokens({ access: null, refresh: null }); }
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

function extractFieldMessage(data) {
  if (!data || typeof data !== "object") return "";
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    if (typeof value === "string") return value;
  }
  return "";
}

export class ApiError extends Error {
  constructor(status, data, opts = {}) {
    const env = data?.error && typeof data.error === "object" ? data.error : null;
    const detail = env?.detail || data?.detail;
    const msg =
      (typeof env?.message === "string" && env.message) ||
      (typeof detail === "string" && detail) ||
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      (typeof detail === "object" && detail && JSON.stringify(detail)) ||
      extractFieldMessage(data) ||
      (typeof data === "string" ? data : "") ||
      `API error ${status}`;
    super(msg);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.code = env?.code || null;
    this.field = env?.field || null;
    this.requestId = env?.request_id || opts.requestId || null;
    this.retryAfter =
      opts.retryAfter ??
      (Number(env?.retry_after) || Number(data?.retry_after) || null);
    this.language = env?.language || null;
  }
}

async function fetchWithTimeout(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const external = options?.signal;
  const onAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", onAbort, { once: true });
  }
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
    if (external) external.removeEventListener("abort", onAbort);
  }
}

const RETRYABLE_METHODS = new Set(["GET", "HEAD"]);
const RETRY_MAX = 3;
const RETRY_BASE_MS = 600;

async function parseResponse(res) {
  const ct = res.headers.get("content-type") || "";
  if (res.status === 204) return null;
  if (ct.includes("application/json")) {
    try { return await res.json(); }
    catch { return { detail: `Invalid JSON response (${res.status})` }; }
  }
  if (ct.includes("text/html")) {
    const html = await res.text();
    let detail = `Server returned HTML (${res.status})`;
    if (/DisallowedHost/i.test(html)) {
      detail = "Backend rejected the request: DisallowedHost. Add this domain to Django ALLOWED_HOSTS.";
    } else if (/CSRF/i.test(html)) {
      detail =
        "CSRF verification failed. On the backend, add this origin to " +
        "Django's CSRF_TRUSTED_ORIGINS or remove SessionAuthentication " +
        "from REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES (JWT-only).";
    } else {
      const m = html.match(/<title>([^<]+)<\/title>/i);
      if (m) detail = m[1].trim();
    }
    return { detail, htmlLength: html.length };
  }
  return await res.text();
}

async function withRetry(fn, method) {
  const m = String(method || "GET").toUpperCase();
  if (!RETRYABLE_METHODS.has(m)) return fn();
  let lastErr;
  for (let attempt = 0; attempt < RETRY_MAX; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const s = err?.status;
      const retryable =
        s === 0 || s === 408 || s === 429 || (s >= 500 && s < 600);
      if (!retryable || attempt === RETRY_MAX - 1) throw err;

      const headerWait = err?.retryAfter ? Number(err.retryAfter) * 1000 : 0;
      const backoff = RETRY_BASE_MS * Math.pow(2, attempt) + Math.random() * 200;
      const wait = Math.min(headerWait || backoff, 30000);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

let refreshPromise = null;
async function refreshAccessToken() {
  if (!getRefreshToken()) throw new ApiError(401, { detail: "No refresh token" });
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const res = await fetchWithTimeout(`${getBaseUrl()}/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": getLang(),
      },
      body: JSON.stringify({ refresh: getRefreshToken() }),
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

function makeIdempotencyKey() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* noop */ }
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

const IDEMPOTENT_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const IDEMPOTENT_PATH_HINTS = [
  "/fee/pay/",
  "/reservation/pay/",
  "/boosting/",
  "/banners/",
  "/leading-fees/purchases/",
  "/bundles/purchases/",
  "/finance/success-fee/",
  "/payments/",
  "/credits/consume/",
];

function shouldUseIdempotency(path, method) {
  const m = String(method).toUpperCase();
  if (!IDEMPOTENT_METHODS.has(m)) return false;
  return IDEMPOTENT_PATH_HINTS.some((h) => path.includes(h));
}

async function request(path, {
  method = "GET", body, headers = {}, retry = true, isFormData = false, timeoutMs,
  idempotencyKey = null, signal = null,
} = {}) {
  const isPublic = isPublicEndpoint(path, method);
  const accessToken = getAccessToken();
  const lang = getLang();

  const finalHeaders = {
    ...(shouldUseIdempotency(path, method)
      ? { "Idempotency-Key": idempotencyKey || makeIdempotencyKey() }
      : {}),
    ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    "X-Requested-With": "XMLHttpRequest",
    "Accept-Language": lang, // ⬅️ MPYA — backend itatumia lugha hii
    ...headers,
  };

  // CSRF token kwa unsafe methods
  const methodUpper = String(method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(methodUpper)) {
    const csrf = getCsrfToken();
    if (csrf && !finalHeaders["X-CSRFToken"]) {
      finalHeaders["X-CSRFToken"] = csrf;
    }
  }

  const res = await withRetry(
    async () => {
      const r = await fetchWithTimeout(`${getBaseUrl()}${path}`, {
        method,
        headers: finalHeaders,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        signal: signal || undefined,
      }, timeoutMs);
      if (RETRYABLE_METHODS.has(method.toUpperCase()) && (r.status === 408 || r.status === 429 || (r.status >= 500 && r.status < 600))) {
        const data = await parseResponse(r);
        throw new ApiError(r.status, data);
      }
      return r;
    },
    method
  );

  if (res.status === 401 && !isPublic && retry && getRefreshToken()) {
    try {
      await refreshAccessToken();
      return request(path, { method, body, headers, retry: false, isFormData, timeoutMs });
    } catch (err) {
      onUnauthorized?.();
      throw err;
    }
  }

  if (res.status === 429) {
    const retryAfter =
      Number(res.headers.get("Retry-After")) ||
      Number(res.headers.get("X-RateLimit-Reset")) ||
      null;
    const data = await parseResponse(res);
    throw new ApiError(429, data, { retryAfter });
  }

  const data = await parseResponse(res);
  if (!res.ok) {
    const hadToken = Boolean(getAccessToken() || getRefreshToken());
    if (res.status === 401 && !isPublic && hadToken) onUnauthorized?.();
    throw new ApiError(res.status, data);
  }
  return data;
}

function normalizeBody(body) {
  if (body === undefined || body === null) return undefined;
  if (typeof body === "object" && !Array.isArray(body) && Object.keys(body).length === 0) return undefined;
  return body;
}

export async function downloadFile(path, { signal } = {}) {
  const isPublic = isPublicEndpoint(path, "GET");
  const accessToken = getAccessToken();
  const lang = getLang();
  const headers = {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    "X-Requested-With": "XMLHttpRequest",
    "Accept-Language": lang, // ⬅️ MPYA
  };

  let res = await fetchWithTimeout(
    `${getBaseUrl()}${path}`,
    { method: "GET", headers, signal }
  );

  if (res.status === 401 && !isPublic && getRefreshToken()) {
    try {
      await refreshAccessToken();
      headers.Authorization = `Bearer ${getAccessToken()}`;
      res = await fetchWithTimeout(
        `${getBaseUrl()}${path}`,
        { method: "GET", headers, signal }
      );
    } catch (err) {
      onUnauthorized?.();
      throw err;
    }
  }

  if (!res.ok) {
    const data = await parseResponse(res);
    if (res.status === 401 && !isPublic) onUnauthorized?.();
    throw new ApiError(res.status, data);
  }
  return res.blob();
}

export const api = {
  get:    (path, opts) => request(path, { ...opts, method: "GET" }),
  post:   (path, body, opts) => request(path, { ...opts, method: "POST", body: normalizeBody(body) }),
  patch:  (path, body, opts) => request(path, { ...opts, method: "PATCH", body: normalizeBody(body) }),
  put:    (path, body, opts) => request(path, { ...opts, method: "PUT", body: normalizeBody(body) }),
  delete: (path, body = {}, opts) => request(path, { ...opts, method: "DELETE", body: normalizeBody(body) }),
  upload: (path, formData, opts) =>
    request(path, { ...opts, method: "POST", body: formData, isFormData: true, timeoutMs: UPLOAD_TIMEOUT_MS }),
  makeIdempotencyKey,
};
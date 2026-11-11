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

// ============================================================
// TOKENS + "Remember Me"
// Remember = localStorage (inadumu). Si remember = sessionStorage
// (inaisha kivinjari kikifungwa).
// ============================================================
let rememberPref = true;
const ls = () => { try { return window.localStorage; } catch { return null; } };
const ss = () => { try { return window.sessionStorage; } catch { return null; } };

function hasTokens(store, k) {
  return Boolean(
    store && (store.getItem(k.refresh) !== null || store.getItem(k.access) !== null)
  );
}

// Tokens zikishakuwepo ziache zilipo (refresh rotation isizihamishe).
function tokenStore(k) {
  if (hasTokens(ss(), k)) return ss();
  if (hasTokens(ls(), k)) return ls();
  return rememberPref ? ls() : ss();
}

// True kama session hii ni ya tab/kivinjari hiki tu (si "Nikumbuke").
export function isSessionOnly() {
  return hasTokens(ss(), keys()) || !rememberPref;
}

// Itwe KABLA ya login. Inafuta tokens za zamani ili zisibaki upande mwingine.
export function setRememberPref(remember) {
  rememberPref = remember !== false;
  const k = keys();
  [ls(), ss()].forEach((s) => {
    s?.removeItem(k.access);
    s?.removeItem(k.refresh);
  });
}

export function setTokens({ access, refresh } = {}) {
  const k = keys();
  const target = tokenStore(k);
  const other = target === ss() ? ls() : ss();
  const put = (name, val) => {
    if (val) {
      target?.setItem(name, val);
      other?.removeItem(name);
    } else {
      ls()?.removeItem(name);
      ss()?.removeItem(name);
    }
  };
  if (access !== undefined) put(k.access, access);
  if (refresh !== undefined) put(k.refresh, refresh);
}

const readToken = (name) => ss()?.getItem(name) ?? ls()?.getItem(name) ?? null;
export function getAccessToken() { return readToken(keys().access); }
export function getRefreshToken() { return readToken(keys().refresh); }
export function clearTokens() {
  setTokens({ access: null, refresh: null });
  rememberPref = true; // default baada ya logout
}

// Kwa sehemu zinazohitaji token yoyote iliyopo (admin au user), bila kujali scope ya ukurasa.
export function getAccessTokenAnyScope() {
  return readToken(TOKEN_KEYS.admin.access) || readToken(TOKEN_KEYS.user.access) || null;
}
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
    // Sababu halisi ya validation (field au details) iwe mbele ya ujumbe wa jumla.
    const firstField =
      env?.fields && typeof env.fields === "object"
        ? Object.entries(env.fields)
            .map(([k, v]) => {
              const m = [].concat(v)[0];
              return typeof m === "string" ? `${k}: ${m}` : null;
            })
            .find(Boolean) || null
        : null;
    const firstDetail =
      Array.isArray(env?.details) && typeof env.details[0] === "string" ? env.details[0] : null;
    const msg =
      firstField ||
      firstDetail ||
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

// ============================================================
// ✅ FIX: Tofautisha external abort na timeout
// ============================================================
async function fetchWithTimeout(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const external = options?.signal;
  let timedOut = false;   // ⬅️ flag ya kutofautisha

  const onAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", onAbort, { once: true });
  }
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      // ⬇️ Kama ni external abort (sio timeout), rethrow kama AbortError
      if (external?.aborted || !timedOut) {
        const abortErr = new Error("Aborted");
        abortErr.name = "AbortError";
        throw abortErr;
      }
      // Timeout halisi
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
    "Accept-Language": lang,
    ...headers,
  };

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

// ============================================================
// UPLOAD YENYE PROGRESS (XMLHttpRequest)
// `fetch` haiwezi kuripoti upload progress. Njia hii inatumika TU pale
// `onProgress` inapopitishwa kwenye api.upload; vinginevyo upload inaendelea
// kutumia fetch kama kawaida.
// onProgress({ loaded, total, percent }) — percent ni 0-100.
// Timeout hapa ni "stall timeout": inaanza upya kila byte zinapoendelea
// kutumwa, kwa hiyo picha nyingi kwenye mtandao polepole hazikatwi
// mradi data inaendelea kupita.
// ============================================================
function buildUploadHeaders(extra = {}) {
  const accessToken = getAccessToken();
  const headers = {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    "X-Requested-With": "XMLHttpRequest",
    "Accept-Language": getLang(),
    ...extra,
  };
  const csrf = getCsrfToken();
  if (csrf && !headers["X-CSRFToken"]) headers["X-CSRFToken"] = csrf;
  return headers; // Content-Type huwekwa na kivinjari (multipart boundary)
}

function xhrSend(url, { headers, body, onProgress, signal, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const abortError = () => {
      const e = new Error("Aborted");
      e.name = "AbortError";
      return e;
    };
    if (signal?.aborted) return reject(abortError());

    const xhr = new XMLHttpRequest();
    let timedOut = false;
    let timer = null;
    const armTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timedOut = true;
        xhr.abort();
      }, timeoutMs);
    };
    const onAbort = () => xhr.abort();
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    xhr.open("POST", url, true);
    Object.entries(headers || {}).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.responseType = "text";

    xhr.upload.onprogress = (e) => {
      armTimer();
      if (!onProgress || !e.lengthComputable || !e.total) return;
      try {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.min(100, Math.round((e.loaded / e.total) * 100)),
        });
      } catch { /* callback ya UI isivunje upload */ }
    };
    // Upload ikiisha, seva inachakata (mf. kutengeneza ukubwa wa picha) — anza kuhesabu upya.
    xhr.upload.onload = armTimer;

    xhr.onload = () => {
      cleanup();
      const headersOut = new Headers();
      xhr
        .getAllResponseHeaders()
        .trim()
        .split(/[\r\n]+/)
        .filter(Boolean)
        .forEach((line) => {
          const i = line.indexOf(":");
          if (i > 0) {
            try { headersOut.append(line.slice(0, i).trim(), line.slice(i + 1).trim()); } catch { /* noop */ }
          }
        });
      const noBody = [204, 205, 304].includes(xhr.status);
      resolve(
        new Response(noBody ? null : xhr.responseText, { status: xhr.status, headers: headersOut })
      );
    };
    xhr.onerror = () => {
      cleanup();
      reject(new ApiError(0, { detail: "Network error. Check your connection." }));
    };
    xhr.onabort = () => {
      cleanup();
      if (timedOut) reject(new ApiError(408, { detail: "Request timed out. Please try again." }));
      else reject(abortError());
    };

    armTimer();
    xhr.send(body);
  });
}

async function uploadWithProgress(path, formData, {
  onProgress, signal = null, timeoutMs = UPLOAD_TIMEOUT_MS, headers = {}, retry = true,
} = {}) {
  const isPublic = isPublicEndpoint(path, "POST");
  const res = await xhrSend(`${getBaseUrl()}${path}`, {
    headers: buildUploadHeaders(headers),
    body: formData,
    onProgress,
    signal,
    timeoutMs,
  });

  if (res.status === 401 && !isPublic && retry && getRefreshToken()) {
    try {
      await refreshAccessToken();
    } catch (err) {
      onUnauthorized?.();
      throw err;
    }
    return uploadWithProgress(path, formData, { onProgress, signal, timeoutMs, headers, retry: false });
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
    "Accept-Language": lang,
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
  // opts.onProgress({ loaded, total, percent }) → XHR (progress halisi).
  // Bila onProgress → fetch kama awali.
  upload: (path, formData, opts = {}) =>
    opts.onProgress
      ? uploadWithProgress(path, formData, opts)
      : request(path, { ...opts, method: "POST", body: formData, isFormData: true, timeoutMs: UPLOAD_TIMEOUT_MS }),
  makeIdempotencyKey,
};
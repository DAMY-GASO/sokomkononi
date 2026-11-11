// ============================================================
// uploadWithProgress.js
// Upload faili + fields kwa XHR — upload progress HALISI,
// AbortController, na timeout.
//
// ✅ FIX: Hakuna import ya getAuthToken (haipo kwenye authStore.js).
//    Tunatumia njia kadhaa za kupata token:
//      1. window.__SMK_TOKEN__ (kama ipo)
//      2. localStorage keys kadhaa
//      3. Cookies (withCredentials: true)
// ============================================================

const BASE_URL = import.meta?.env?.VITE_API_URL || "";
const DEFAULT_TIMEOUT_MS = 60_000;

// ✅ Orodha ya localStorage keys zinazoweza kuwa na token
const TOKEN_KEYS = [
  "sokomkononi_token",
  "sokomkononi_access_token",
  "auth_token",
  "access_token",
  "token",
  "jwt",
];

function readTokenFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    // Angalia window global kwanza (kama api/client.js inaweka hapa)
    if (window.__SMK_TOKEN__) return window.__SMK_TOKEN__;
    if (window.__AUTH_TOKEN__) return window.__AUTH_TOKEN__;

    for (const k of TOKEN_KEYS) {
      const v = window.localStorage.getItem(k);
      if (v) return v;
    }
    for (const k of TOKEN_KEYS) {
      const v = window.sessionStorage.getItem(k);
      if (v) return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function uploadWithProgress({
  url,
  method = "POST",
  fields = {},
  files = [],
  onProgress,
  signal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  withCredentials = true,
}) {
  return new Promise((resolve) => {
    const fullUrl = /^https?:\/\//i.test(url) ? url : `${BASE_URL}${url}`;

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    if (signal?.aborted) {
      finish({ ok: false, error: new DOMException("Aborted", "AbortError") });
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, fullUrl, true);
    xhr.timeout = timeoutMs;
    xhr.withCredentials = withCredentials;

    // ✅ FIX: Token kutoka localStorage (bila import ya getAuthToken)
    try {
      const token = readTokenFromStorage();
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
    } catch {
      /* ignore */
    }

    // Progress
    if (typeof onProgress === "function") {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.min(100, Math.max(0, Math.round((e.loaded / e.total) * 100)));
          try { onProgress(pct); } catch { /* ignore */ }
        }
      };
    }

    // Abort
    const onAbort = () => {
      try { xhr.abort(); } catch { /* ignore */ }
      finish({ ok: false, error: new DOMException("Aborted", "AbortError") });
    };
    if (signal) signal.addEventListener("abort", onAbort, { once: true });

    // Response
    xhr.onload = () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      const { status, responseText } = xhr;
      let data = null;
      try { data = responseText ? JSON.parse(responseText) : null; } catch { data = responseText; }

      if (status >= 200 && status < 300) {
        finish({ ok: true, status, data });
      } else {
        const err = new Error(
          (data && (data.detail || data.message || data.error)) || `HTTP ${status}`
        );
        err.status = status;
        err.data = data;
        finish({ ok: false, status, data, error: err });
      }
    };

    xhr.onerror = () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      finish({ ok: false, error: new Error("Network error") });
    };

    xhr.ontimeout = () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      const err = new Error("Upload timeout");
      err.status = 408;
      finish({ ok: false, status: 408, error: err });
    };

    xhr.onabort = () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      finish({ ok: false, error: new DOMException("Aborted", "AbortError") });
    };

    // FormData
    const form = new FormData();
    Object.entries(fields || {}).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (typeof v === "object" && !(v instanceof Blob)) {
        form.append(k, JSON.stringify(v));
      } else {
        form.append(k, v);
      }
    });
    (files || []).forEach(({ field, file, filename }) => {
      if (file) form.append(field, file, filename || file.name || "file");
    });

    try {
      xhr.send(form);
    } catch (err) {
      finish({ ok: false, error: err });
    }
  });
}
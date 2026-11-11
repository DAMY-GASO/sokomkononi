// ============================================================
// uploadWithProgress.js
// ============================================================

import { getAuthToken } from "../config/authStore.js";

const BASE_URL = import.meta?.env?.VITE_API_URL || "";
const DEFAULT_TIMEOUT_MS = 60_000;

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

    // Aborted kabla ya kuanza?
    if (signal?.aborted) {
      finish({ ok: false, error: new DOMException("Aborted", "AbortError") });
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, fullUrl, true);
    xhr.timeout = timeoutMs;
    xhr.withCredentials = withCredentials;

    // Auth
    try {
      const token = getAuthToken?.();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    } catch { /* ignore */ }

    // ✅ Upload progress HALISI
    if (typeof onProgress === "function") {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.min(100, Math.max(0, Math.round((e.loaded / e.total) * 100)));
          try { onProgress(pct); } catch { /* ignore */ }
        }
      };
    }

    // Abort listener
    const onAbort = () => {
      try { xhr.abort(); } catch { /* ignore */ }
      finish({ ok: false, error: new DOMException("Aborted", "AbortError") });
    };
    if (signal) signal.addEventListener("abort", onAbort, { once: true });

    // Response handling
    xhr.onload = () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      const { status, responseText } = xhr;
      let data = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = responseText;
      }

      if (status >= 200 && status < 300) {
        finish({ ok: true, status, data });
      } else {
        const err = new Error(
          (data && (data.detail || data.message || data.error)) ||
          `HTTP ${status}`
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

    // Tengeneza FormData
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
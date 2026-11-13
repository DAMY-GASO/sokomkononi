// ============================================================
// uploadWithProgress.js
// Upload faili + fields kupitia api.upload (client.js).
//
// Kumbuka: inasaidia POST pekee (api.upload ni POST).
// ============================================================
import { api } from "./client.js";

function buildFormData(fields = {}, files = []) {
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

  return form;
}

export async function uploadWithProgress({
  url,
  fields = {},
  files = [],
  onProgress,
  signal,
  timeoutMs,
}) {
  const form = buildFormData(fields, files);

  try {
    const data = await api.upload(url, form, {
      // Lazima iwe function ili client.js itumie XHR (progress halisi)
      onProgress: (p) => {
        if (typeof onProgress === "function") {
          try {
            onProgress(p?.percent ?? 0);
          } catch {
            /* callback ya UI isivunje upload */
          }
        }
      },
      signal: signal || null,
      ...(timeoutMs ? { timeoutMs } : {}),
    });
    return { ok: true, status: 200, data };
  } catch (err) {
    return {
      ok: false,
      status: err?.status,
      data: err?.data ?? null,
      error: err,
    };
  }
}
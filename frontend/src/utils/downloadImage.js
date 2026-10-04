// ============================================================
// src/utils/downloadImage.js
// Download picha kutoka Cloudflare R2 / CDN
// NO JSX — pure JS ili kuepuka vite:define error
// ============================================================

function ensureExtension(filename) {
  if (!filename) return `sokomkononi-${Date.now()}.jpg`;
  if (/\.(jpg|jpeg|png|webp)$/i.test(filename)) return filename;
  return filename + ".jpg";
}

function filenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/");
    const last = parts[parts.length - 1];
    if (last && last.includes(".")) return last;
  } catch {
    // ignore
  }
  return `sokomkononi-${Date.now()}.jpg`;
}

/**
 * Download picha kutoka URL (Cloudflare R2 inasaidia CORS kama imesetiwa).
 *
 * @returns {Promise<boolean>}
 */
export async function downloadImage(url, filename = null) {
  if (!url) return false;

  if (!filename) filename = filenameFromUrl(url);
  filename = ensureExtension(filename);

  // ── Njia 1: fetch + blob ────────────────────────────────
  try {
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      cache: "no-cache",
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const blob = await res.blob();

    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(function () {
      window.URL.revokeObjectURL(blobUrl);
    }, 200);
    return true;
  } catch (err) {
    console.warn("[downloadImage] fetch failed, trying fallback:", err);
  }

  // ── Njia 2: fallback — fungua kwenye tab mpya ───────────
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error("[downloadImage] fallback failed:", err);
    return false;
  }
}

/**
 * Download picha zote kwa interval ndogo.
 */
export async function downloadAllImages(urls, prefix = "sokomkononi") {
  if (!Array.isArray(urls) || urls.length === 0) return 0;

  let success = 0;
  for (let i = 0; i < urls.length; i++) {
    const ok = await downloadImage(urls[i], prefix + "-" + (i + 1) + ".jpg");
    if (ok) success++;
    await new Promise(function (r) {
      setTimeout(r, 400);
    });
  }
  return success;
}

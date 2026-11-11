// ============================================================
// geocodeNominatim.js
// Geocoding kupitia Nominatim (OpenStreetMap) kwa mujibu wa sera:
//   - User-Agent inayotambulisha app
//   - Rate limit: 1 req/sec
//   - Error inayoweza kuonyeshwa (badala ya kimya)
//
// Sera: https://operations.osmfoundation.org/policies/nominatim/
// ============================================================

const USER_AGENT = "SokoMkononi/1.0 (support@sokomkononi.co.tz)";
const MIN_INTERVAL_MS = 1100;
let lastRequestAt = 0;

/**
 * @param {string} query - "Dar es Salaam, Kinondoni"
 * @param {Object} [opts]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{ok: boolean, lat?: number, lng?: number, displayName?: string, error?: Error}>}
 */
export async function geocodeNominatim(query, { signal } = {}) {
  if (!query || !String(query).trim()) {
    return { ok: false, error: new Error("Empty query") };
  }

  // Rate limit
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastRequestAt));
  if (wait > 0) {
    try {
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, wait);
        if (signal) {
          signal.addEventListener("abort", () => {
            clearTimeout(t);
            reject(new DOMException("Aborted", "AbortError"));
          }, { once: true });
        }
      });
    } catch (err) {
      return { ok: false, error: err };
    }
  }
  lastRequestAt = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", String(query).trim());
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "tz");
  url.searchParams.set("addressdetails", "0");

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": USER_AGENT,
      },
      credentials: "omit",
      signal,
    });

    if (!res.ok) {
      return {
        ok: false,
        error: new Error(`Nominatim HTTP ${res.status}`),
      };
    }

    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) {
      return { ok: false, error: new Error("No results") };
    }

    const first = arr[0];
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { ok: false, error: new Error("Invalid coordinates") };
    }

    return {
      ok: true,
      lat,
      lng,
      displayName: first.display_name || "",
    };
  } catch (err) {
    return { ok: false, error: err };
  }
}
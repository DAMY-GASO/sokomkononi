// ============================================================
// leadingFeeStore.js — Leading Fee (API-backed)
// Backend: GET/PATCH /api/leading-fees/
//          POST      /api/leading-fees/toggle/
//
// ✅ FIX #2: FALLBACK.is_enabled = null (haijulikani) + loaded flag.
// ✅ FIX #5: toggle inahydrate baada ya API kufanikiwa.
// ✅ FIX #7: hydrate inatumia guarded() — dedupe, TTL, forceRefresh.
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { guarded } from "./hydrateGuard.js";

const KEY = "sokomkononi_leading_fee_config_v4";
const EV = "sokomkononi:leading-fee-config-updated";

const FALLBACK = {
  is_enabled: null,
  loaded: false,
  label: { sw: "Ada ya Kipaumbele", en: "Leading Fee" },
  desc: { sw: "", en: "" },
  updated_at: null,
};

function read() {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return FALLBACK;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? { ...FALLBACK, ...p } : FALLBACK;
  } catch { return FALLBACK; }
}

function write(cfg) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event(EV));
}

function norm(raw) {
  if (!raw) return null;
  return {
    is_enabled:
      raw.is_enabled === undefined || raw.is_enabled === null
        ? null
        : raw.is_enabled !== false,
    loaded: true,
    label: raw.label || FALLBACK.label,
    desc: raw.desc || FALLBACK.desc,
    updated_at: raw.updated_at || null,
  };
}

export function getLeadingFeeConfig() { return read(); }

// ✅ FIX #7: guarded()
async function _hydrateLeadingFeeFromApi() {
  try {
    const d = await api.get("/leading-fees/");
    const row = Array.isArray(d) ? d[0] : (d?.results?.[0] ?? d);
    const normalized = norm(row);
    if (normalized) {
      write(normalized);
      console.info("[leadingFeeStore] hydrated:", normalized);
    } else {
      write({ ...FALLBACK, loaded: true });
      return { ok: false, error: new Error("Invalid payload") };
    }
    return { ok: true, config: normalized };
  } catch (err) {
    console.warn("[leadingFeeStore] hydrate failed:", err?.message, err?.status);
    write({ ...read(), loaded: true });
    return { ok: false, error: err };
  }
}

export const hydrateLeadingFeeFromApi = guarded(_hydrateLeadingFeeFromApi, {
  key: "leadingFeeStore:hydrate",
});

export async function toggleLeadingFeeAsync() {
  const cur = getLeadingFeeConfig();

  if (!cur.loaded || cur.is_enabled === null) {
    return {
      ok: false,
      error: new Error("Leading fee bado haijapakiwa. Subiri au refresh."),
    };
  }

  const newState = !cur.is_enabled;
  write({ ...cur, is_enabled: newState, loaded: true });

  try {
    const raw = await api.post("/leading-fees/toggle/", {});
    const updated = {
      ...cur,
      is_enabled:
        raw?.is_enabled === undefined || raw?.is_enabled === null
          ? newState
          : raw.is_enabled !== false,
      loaded: true,
    };
    write(updated);

    // ✅ FIX #5 + #7: forceRefresh — backend ndiyo source of truth
    try {
      await hydrateLeadingFeeFromApi.forceRefresh();
    } catch (e) {
      console.warn("[leadingFeeStore] post-toggle hydrate failed:", e?.message);
    }

    return { ok: true, is_enabled: updated.is_enabled };
  } catch (err) {
    write(cur);
    return { ok: false, error: err };
  }
}

export function useLeadingFeeConfig() {
  const [cfg, setCfg] = useState(() => read());
  useEffect(() => {
    hydrateLeadingFeeFromApi();
    const sync = () => setCfg(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return cfg;
}
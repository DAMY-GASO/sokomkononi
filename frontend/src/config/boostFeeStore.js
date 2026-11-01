// ============================================================
// boostFeeStore.js — global Boost Fee on/off switch
// Source of truth: GET/PATCH /api/boosting/fee-config/
// ============================================================
import { useEffect, useState } from "react";
import { boostingApi } from "../api/boosting.js";

const EV = "sokomkononi:boost-fee-updated";
const TTL_MS = 60_000; // usi-refetch kama data ni mpya zaidi ya dakika 1

let state = { loaded: false, enabled: true };
let _loadedAt = 0;

function set(next) {
  const merged = { ...state, ...next };
  const changed =
    merged.loaded !== state.loaded || merged.enabled !== state.enabled;
  if (!changed) return; // ✅ hakuna event wala re-render isiyo na maana
  state = merged;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EV));
  }
}

export function getBoostFee() {
  return state;
}

let _boostFeeHydratePromise = null;
export async function hydrateBoostFeeFromApi({ force = false } = {}) {
  if (!force && state.loaded && Date.now() - _loadedAt < TTL_MS) {
    return { ok: true, enabled: state.enabled, cached: true };
  }
  if (_boostFeeHydratePromise) return _boostFeeHydratePromise;
  _boostFeeHydratePromise = (async () => {
    try {
      const data = await boostingApi.feeConfig();
      const enabled = data?.is_active !== false;
      console.info("[boostFeeStore] hydrated:", { raw: data, enabled });
      set({ loaded: true, enabled });
      _loadedAt = Date.now();
      return { ok: true, enabled };
    } catch (err) {
      console.error("[boostFeeStore] hydrate failed:", err);
      set({ loaded: true }); // _loadedAt haiwekwi — jaribio lijalo litarudia
      return { ok: false, error: err };
    }
  })().finally(() => {
    _boostFeeHydratePromise = null;
  });
  return _boostFeeHydratePromise;
}

export async function toggleBoostFeeAsync() {
  const next = !state.enabled;
  try {
    const data = await boostingApi.updateFeeConfig({ is_active: next });
    const enabled = data?.is_active !== false;
    console.info("[boostFeeStore] toggled:", { raw: data, enabled });
    set({ loaded: true, enabled });
    _loadedAt = Date.now();
    return { ok: true, enabled };
  } catch (err) {
    console.error("[boostFeeStore] toggle failed:", err);
    return { ok: false, error: err };
  }
}

export function useBoostFee() {
  const [snapshot, setSnapshot] = useState(state);

  useEffect(() => {
    const sync = () => setSnapshot(state);
    window.addEventListener(EV, sync);
    sync(); // pata thamani ya sasa (inaweza kuwa imebadilika kabla ya effect)
    hydrateBoostFeeFromApi(); // inaruka yenyewe kama data ni mpya (TTL)
    return () => window.removeEventListener(EV, sync);
  }, []);

  return snapshot;
}
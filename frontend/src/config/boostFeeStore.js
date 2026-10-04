// ============================================================
// boostFeeStore.js — global Boost Fee on/off switch
// Source of truth: GET/PATCH /api/boosting/fee-config/
//
//   enabled = true   -> boosts are paid (flat fee, bundle, credits)
//   enabled = false  -> boosts are free (no payment, no credit used)
//
// Kept in memory only (no localStorage) so a stale cached value can
// never make a paid boost look free. `loaded` is false until the first
// response, so the UI can wait instead of guessing.
// The backend enforces the rule regardless of what the UI shows.
// ============================================================
import { useEffect, useState } from "react";
import { boostingApi } from "../api/boosting.js";

const EV = "sokomkononi:boost-fee-updated";

// Default `enabled: true` = fail closed (assume the fee applies).
let state = { loaded: false, enabled: true };

function set(next) {
  state = { ...state, ...next };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EV));
  }
}

export function getBoostFee() {
  return state;
}

export async function hydrateBoostFeeFromApi() {
  try {
    const data = await boostingApi.feeConfig();
    set({ loaded: true, enabled: data?.is_active !== false });
    return { ok: true, enabled: state.enabled };
  } catch (err) {
    // Keep the last known value; mark loaded so the UI is not stuck.
    set({ loaded: true });
    return { ok: false, error: err };
  }
}

// Admin: flip the switch.
export async function toggleBoostFeeAsync() {
  const next = !state.enabled;
  try {
    const data = await boostingApi.updateFeeConfig({ is_active: next });
    set({ loaded: true, enabled: data?.is_active !== false });
    return { ok: true, enabled: state.enabled };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export function useBoostFee() {
  const [snapshot, setSnapshot] = useState(state);

  useEffect(() => {
    const sync = () => setSnapshot(state);
    window.addEventListener(EV, sync);
    hydrateBoostFeeFromApi();
    return () => window.removeEventListener(EV, sync);
  }, []);

  return snapshot;
}
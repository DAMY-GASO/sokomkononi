// ============================================================
// boostFeeStore.js — global Boost Fee on/off switch
// Source of truth: GET/PATCH /api/boosting/fee-config/
// ============================================================
import { useEffect, useState } from "react";
import { boostingApi } from "../api/boosting.js";

const EV = "sokomkononi:boost-fee-updated";

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
    const enabled = data?.is_active !== false;
    console.info("[boostFeeStore] hydrated:", { raw: data, enabled });
    set({ loaded: true, enabled });
    return { ok: true, enabled };
  } catch (err) {
    console.error("[boostFeeStore] hydrate failed:", err);
    set({ loaded: true });
    return { ok: false, error: err };
  }
}

export async function toggleBoostFeeAsync() {
  const next = !state.enabled;
  try {
    const data = await boostingApi.updateFeeConfig({ is_active: next });
    const enabled = data?.is_active !== false;
    console.info("[boostFeeStore] toggled:", { raw: data, enabled });
    set({ loaded: true, enabled });
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
    hydrateBoostFeeFromApi();
    return () => window.removeEventListener(EV, sync);
  }, []);

  return snapshot;
}
// ============================================================
// boostFeeStore.js — global Boost Fee on/off switch
// Source of truth: GET/PATCH /api/boosting/fee-config/
//
// ✅ FIX #2: enabled = null kabla hydrate (haijulikani).
// ✅ FIX #5: toggle inahydrate baada ya API kufanikiwa.
// ✅ FIX #6: toggle inatumia backend state (PATCH badala ya local flip).
// ✅ FIX #7: hydrate inatumia guarded() — dedupe, TTL, forceRefresh.
// ============================================================
import { useEffect, useState } from "react";
import { boostingApi } from "../api/boosting.js";
import { guarded } from "./hydrateGuard.js";

const EV = "sokomkononi:boost-fee-updated";

let state = { loaded: false, enabled: null };

function set(next) {
  const merged = { ...state, ...next };
  const changed =
    merged.loaded !== state.loaded || merged.enabled !== state.enabled;
  if (!changed) return;
  state = merged;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EV));
  }
}

export function getBoostFee() {
  return state;
}

// ✅ FIX #7: guarded()
async function _hydrateBoostFeeFromApi() {
  try {
    const data = await boostingApi.feeConfig();
    const enabled =
      data?.is_active === undefined || data?.is_active === null
        ? null
        : data.is_active !== false;
    console.info("[boostFeeStore] hydrated:", { raw: data, enabled });
    set({ loaded: true, enabled });
    return { ok: true, enabled };
  } catch (err) {
    console.error("[boostFeeStore] hydrate failed:", err);
    set({ loaded: true });
    return { ok: false, error: err };
  }
}

export const hydrateBoostFeeFromApi = guarded(_hydrateBoostFeeFromApi, {
  key: "boostFeeStore:hydrate",
});

export async function toggleBoostFeeAsync() {
  if (state.enabled === null) {
    return {
      ok: false,
      error: new Error("Boost fee bado haijapakiwa. Subiri au refresh."),
    };
  }

  const next = !state.enabled;
  set({ enabled: next, loaded: true });

  try {
    const data = await boostingApi.updateFeeConfig({ is_active: next });
    const enabled =
      data?.is_active === undefined || data?.is_active === null
        ? next
        : data.is_active !== false;
    console.info("[boostFeeStore] toggled:", { raw: data, enabled });
    set({ loaded: true, enabled });

    // ✅ FIX #5 + #7: forceRefresh
    try {
      await hydrateBoostFeeFromApi.forceRefresh();
    } catch (e) {
      console.warn("[boostFeeStore] post-toggle hydrate failed:", e?.message);
    }

    return { ok: true, enabled };
  } catch (err) {
    console.error("[boostFeeStore] toggle failed:", err);
    set({ enabled: !next, loaded: true });
    return { ok: false, error: err };
  }
}

export function useBoostFee() {
  const [snapshot, setSnapshot] = useState(state);

  useEffect(() => {
    const sync = () => setSnapshot(state);
    window.addEventListener(EV, sync);
    sync();
    hydrateBoostFeeFromApi();
    return () => window.removeEventListener(EV, sync);
  }, []);

  return snapshot;
}
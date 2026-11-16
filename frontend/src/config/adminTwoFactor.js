// ============================================================
// adminTwoFactor.js — hali ya 2FA ya admin aliyeingia (kwa gate ya dashboard)
//
// status:
//   "checking" — bado tunauliza backend
//   "required" — 2FA haijawashwa → admin lazima aiwashe kwanza
//   "ok"       — 2FA imewashwa
//   "unknown"  — backend haikujibu (mtandao/500/404). Tunaruhusu kuendelea
//                (fail-open) ili hitilafu ya muda isimfungie admin nje;
//                ulinzi wa kweli ni wa backend.
// ============================================================
import { useEffect, useState } from "react";
import { securityApi } from "../api/security.js";

const EV = "sokomkononi:admin-2fa-updated";

let state = { userId: null, status: "checking" };
let inflight = null;

function emit(next) {
  state = { ...state, ...next };
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EV));
}

export function refreshAdminTwoFactor(userId) {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const s = await securityApi.twoFactorStatus();
      emit({ userId, status: s?.enabled ? "ok" : "required" });
    } catch {
      emit({ userId, status: "unknown" });
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

// Inaitwa na TwoFactorCard baada ya kuwasha/kuzima 2FA ili gate isasishwe
// papo hapo, bila kusubiri request nyingine.
export function setAdminTwoFactorEnabled(enabled) {
  emit({ status: enabled ? "ok" : "required" });
}

export function useAdminTwoFactor(userId) {
  const [snap, setSnap] = useState(state);

  useEffect(() => {
    const sync = () => setSnap(state);
    window.addEventListener(EV, sync);
    return () => window.removeEventListener(EV, sync);
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (state.userId !== userId) {
      emit({ userId, status: "checking" });
      refreshAdminTwoFactor(userId);
    }
  }, [userId]);

  return {
    status: userId && snap.userId === userId ? snap.status : "checking",
    refresh: () => refreshAdminTwoFactor(userId),
  };
}

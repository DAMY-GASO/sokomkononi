// ============================================================
// dashboardSideStore.js
// Kumbukumbu ndogo ya "upande" wa dashboard unaotumika sasa —
// "buyer" au "seller". DashboardShell ndio inayoiandika (kila
// inapobadilika kutokana na URL au toggle ya Uza/Nunua), na
// vipengele vingine nje ya DashboardShell (mfano BottomNav)
// vinaisoma ili kujua wapi kumpeleka mtumiaji.
//
// Demo ya front-end pekee — localStorage + custom event, sawa na
// stores nyingine.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_dashboard_side_v1";
const UPDATE_EVENT = "sokomkononi:dashboard-side-updated";

/** Soma "side" ya sasa (snapshot moja, si reactive). */
export function getDashboardSide() {
  if (typeof window === "undefined") return "seller";
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "buyer" || value === "seller" ? value : "seller";
  } catch {
    return "seller";
  }
}

/** Andika "side" mpya (buyer au seller). */
export function setDashboardSide(side) {
  if (typeof window === "undefined") return;
  if (side !== "buyer" && side !== "seller") return;
  if (getDashboardSide() === side) return;
  window.localStorage.setItem(STORAGE_KEY, side);
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Hook ya React inayosoma "side" na kujisasisha yenyewe. */
export function useDashboardSide() {
  const [side, setSide] = useState(() => getDashboardSide());
  useEffect(() => {
    const sync = () => setSide(getDashboardSide());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return side;
}

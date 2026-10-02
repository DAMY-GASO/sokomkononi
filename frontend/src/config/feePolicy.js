// ============================================================
// feePolicy.js — Reservation Fee (API-backed)
// Backend: GET/PATCH /api/reservation-rates/
//          POST      /api/reservation-rates/toggle/
// Singleton (pk=1) yenye flat_fee, days, is_enabled.
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_reservation_fee_v3";
const EV = "sokomkononi:reservation-fee-updated";

const FALLBACK = {
  flat_fee: 50000,
  days: 3,
  is_enabled: true,
  updated_at: null,
};

function read() {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return FALLBACK;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? { ...FALLBACK, ...p } : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

function write(cfg) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event(EV));
}

function norm(raw) {
  if (!raw) return null;
  return {
    flat_fee: Number(raw.flat_fee) || 0,
    days: Number(raw.days) || 3,
    is_enabled: raw.is_enabled !== false,
    updated_at: raw.updated_at || null,
  };
}

// ============================================================
// SYNCHRONOUS READS
// ============================================================
export function getReservationFeeConfig() {
  return read();
}

// ============================================================
// HYDRATE FROM API
// ============================================================
export async function hydrateReservationFeeFromApi() {
  try {
    const data = await api.get("/reservation-rates/");
    // Backend returns a single object (singleton) — not a list
    const raw = Array.isArray(data) ? data[0] : data;
    const normalized = norm(raw);
    if (normalized) {
      write(normalized);
      console.info("[feePolicy] hydrated:", normalized);
      return { ok: true, config: normalized };
    }
    return { ok: true, config: null };
  } catch (err) {
    console.warn("[feePolicy] hydrate failed:", err?.message, err?.status);
    return { ok: false, error: err };
  }
}

// ============================================================
// UPDATE FLAT FEE
// ============================================================
export async function updateReservationFeeAsync(flatFee) {
  const num = Number(flatFee);
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: new Error("Fee must be non-negative") };
  }
  const cur = read();

  // Optimistic update
  write({ ...cur, flat_fee: num });

  try {
    const raw = await api.patch("/reservation-rates/", { flat_fee: num });
    const updated = norm(raw) || { ...cur, flat_fee: num };
    write(updated);
    return { ok: true, config: updated };
  } catch (err) {
    // Rollback
    write(cur);
    return { ok: false, error: err };
  }
}

// ============================================================
// UPDATE DAYS
// ============================================================
export async function updateReservationDaysAsync(days) {
  const num = Number(days);
  if (!Number.isFinite(num) || num < 1) {
    return { ok: false, error: new Error("Days must be at least 1") };
  }
  const cur = read();

  write({ ...cur, days: num });

  try {
    const raw = await api.patch("/reservation-rates/", { days: num });
    const updated = norm(raw) || { ...cur, days: num };
    write(updated);
    return { ok: true, config: updated };
  } catch (err) {
    write(cur);
    return { ok: false, error: err };
  }
}

// ============================================================
// TOGGLE ON/OFF
// ============================================================
export async function toggleReservationFeeAsync() {
  const cur = read();
  const newState = !cur.is_enabled;

  // Optimistic
  write({ ...cur, is_enabled: newState });

  try {
    const raw = await api.post("/reservation-rates/toggle/", {});
    const updated = {
      ...cur,
      is_enabled: raw?.is_enabled ?? newState,
    };
    write(updated);
    return { ok: true, is_enabled: updated.is_enabled };
  } catch (err) {
    // Rollback
    write(cur);
    return { ok: false, error: err };
  }
}

// ============================================================
// HOOK
// ============================================================
export function useReservationFeeConfig() {
  const [cfg, setCfg] = useState(() => read());
  useEffect(() => {
    hydrateReservationFeeFromApi();
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

// ============================================================
// CALC RESERVATION FEE — sasa flat
// ============================================================
export function calcReservationFee() {
  const cfg = read();
  if (!cfg.is_enabled) return 0;
  return Number(cfg.flat_fee) || 0;
}

// ============================================================
// LEGACY EXPORTS — ku-support files za zamani
// ============================================================
export function getReservationRates() {
  const cfg = read();
  return [cfg];
}

export function getReservationRate(id) {
  const cfg = read();
  if (id === "CUSTOM" || id === cfg.id || id === 1) return cfg;
  return cfg;
}

export async function updateReservationRateAsync(id, fee) {
  return updateReservationFeeAsync(fee);
}

export function useReservationRates() {
  const cfg = useReservationFeeConfig();
  return [cfg];
}
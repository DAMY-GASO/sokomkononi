// ============================================================
// feePolicy.js — API-only via /api/reservation-rates/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_reservation_rates_v1";
const EV = "sokomkononi:reservation-rates-updated";

const TIER_TO_ID = { H24: "24h", H48: "48h", H72: "72h", CUSTOM: "custom" };

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}
function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

function norm(raw) {
  if (!raw) return null;
  return {
    id: TIER_TO_ID[raw.tier] || (raw.tier || "").toLowerCase(),
    backendId: raw.id,
    tier: raw.tier,
    hours: raw.hours,
    label: raw.label || { sw: raw.label_sw || "", en: raw.label_en || "" },
    sub: raw.sub || (raw.sub_sw ? { sw: raw.sub_sw, en: raw.sub_en } : null),
    fee: Number(raw.fee) || 0,
    ordering: raw.ordering ?? 0,
  };
}

export function getReservationRates() { return read(); }
export function getReservationRate(id) { return read().find((r) => r.id === id) || null; }

export async function hydrateReservationRatesFromApi() {
  try {
    const data = await api.get("/reservation-rates/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(norm).filter(Boolean).sort((a, b) => (a.ordering || 0) - (b.ordering || 0));
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateReservationRateAsync(id, fee) {
  const num = Number(fee);
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: new Error("fee must be a positive number") };
  }
  const target = getReservationRate(id);
  if (!target) return { ok: false, error: new Error(`Rate "${id}" not found`) };
  if (typeof target.backendId !== "number") {
    return { ok: false, error: new Error(`Rate "${id}" has no backend id`) };
  }
  try {
    const raw = await api.patch(`/reservation-rates/${target.backendId}/`, { fee: num });
    const updated = norm(raw) || { ...target, fee: num };
    write(read().map((r) => (r.id === id ? updated : r)));
    return { ok: true, rate: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export function useReservationRates() {
  const [rates, setRates] = useState(() => read());
  useEffect(() => {
    hydrateReservationRatesFromApi();
    const sync = () => setRates(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return rates;
}

export function calcReservationFee(hours) {
  const rates = read();
  const tiers = rates.filter((r) => r.hours != null).sort((a, b) => a.hours - b.hours);
  const custom = rates.find((r) => r.id === "custom");
  const perDay = custom ? Number(custom.fee) : 0;
  for (const t of tiers) if (hours <= t.hours) return Number(t.fee);
  const last = tiers[tiers.length - 1];
  if (!last) return 0;
  const extra = Math.ceil((hours - last.hours) / 24);
  return Number(last.fee) + extra * perDay;
}

// LEGACY
export const DEFAULT_RESERVATION_RATES = [];
export function saveReservationRates() {}
export function updateReservationRate() {}

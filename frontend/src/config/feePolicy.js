// ============================================================
// feePolicy.js — Reservation Rates (API-backed)
// Backend: GET /api/reservation-rates/
//          PATCH /api/reservation-rates/{tier}/  (H24|H48|H72|CUSTOM)
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_reservation_rates_v2";
const EV = "sokomkononi:reservation-rates-updated";

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

// Normalize a bilingual-capable field. Backend may send string OR { sw, en }.
function normalizeLabel(raw) {
  if (!raw) return { sw: "", en: "" };
  if (typeof raw === "string") return { sw: raw, en: raw };
  return { sw: raw.sw || raw.en || "", en: raw.en || raw.sw || "" };
}

function norm(raw) {
  if (!raw) return null;
  return {
    id: raw.tier || raw.id,          // "H24" | "H48" | "H72" | "CUSTOM"
    backendId: raw.id,                // numeric PK fallback
    tier: raw.tier,
    hours: raw.hours ?? null,
    label: normalizeLabel(raw.label),
    sub: normalizeLabel(raw.sub),
    fee: Number(raw.fee) || 0,
    ordering: raw.ordering ?? 0,
  };
}

export function getReservationRates() { return read(); }
export function getReservationRate(id) {
  return read().find((r) => r.id === id || r.tier === id) || null;
}

export async function hydrateReservationRatesFromApi() {
  try {
    const data = await api.get("/reservation-rates/?page_size=100");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list
      .map(norm)
      .filter(Boolean)
      .sort((a, b) => (a.ordering || 0) - (b.ordering || 0));
    write(normalized);
    console.info("[feePolicy] hydrated", normalized.length, "rates");
    return { ok: true, count: normalized.length };
  } catch (err) {
    console.warn("[feePolicy] hydrate failed:", err?.message, err?.status);
    return { ok: false, error: err };
  }
}

export async function updateReservationRateAsync(id, fee) {
  const num = Number(fee);
  if (!Number.isFinite(num) || num < 0) {
    return { ok: false, error: new Error("Fee must be non-negative") };
  }
  const target = getReservationRate(id);
  if (!target) {
    return { ok: false, error: new Error(`Rate "${id}" not found in cache`) };
  }

  // Backend URL accepts tier value ("H24", ...) or numeric PK.
  const candidates = [target.tier, target.id, target.backendId]
    .filter((x) => x !== undefined && x !== null && x !== "");
  let lastErr = null;

  for (const lookup of candidates) {
    try {
      console.info(`[feePolicy] PATCH /reservation-rates/${lookup}/ fee=${num}`);
      const raw = await api.patch(`/reservation-rates/${lookup}/`, { fee: num });
      const updated = norm(raw) || { ...target, fee: num };
      write(read().map((r) => (r.id === id || r.tier === id ? updated : r)));
      return { ok: true, rate: updated };
    } catch (err) {
      lastErr = err;
      // Only retry when the lookup field itself is wrong (404).
      if (err?.status !== 404) break;
    }
  }

  return { ok: false, error: lastErr || new Error("Could not update rate") };
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
  const custom = rates.find((r) => r.tier === "CUSTOM");
  const perDay = custom ? Number(custom.fee) : 0;
  for (const t of tiers) if (hours <= t.hours) return Number(t.fee);
  const last = tiers[tiers.length - 1];
  if (!last) return 0;
  const extra = Math.ceil((hours - last.hours) / 24);
  return Number(last.fee) + extra * perDay;
}


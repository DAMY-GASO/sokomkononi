// ============================================================
// feePolicy.js — API-backed via /api/reservation-rates/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "sokomkononi_reservation_rates_v1";
const UPDATE_EVENT = "sokomkononi:reservation-rates-updated";

export const DEFAULT_RESERVATION_RATES = [
  { id: "24h", hours: 24, label: { sw: "Saa 24", en: "24 Hours" },
    sub: { sw: "Siku 1", en: "1 Day" }, fee: 10000 },
  { id: "48h", hours: 48, label: { sw: "Saa 48", en: "48 Hours" },
    sub: { sw: "Siku 2", en: "2 Days" }, fee: 18000 },
  { id: "72h", hours: 72, label: { sw: "Saa 72", en: "72 Hours" },
    sub: { sw: "Siku 3", en: "3 Days" }, fee: 25000 },
  { id: "custom", hours: null, label: { sw: "Custom (kwa siku)", en: "Custom (per day)" },
    sub: null, fee: 8000 },
];

const TIER_TO_ID = { H24: "24h", H48: "48h", H72: "72h", CUSTOM: "custom" };

// ============================================================
// STORAGE
// ============================================================
function readFromStorage() {
  if (typeof window === "undefined") return DEFAULT_RESERVATION_RATES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RESERVATION_RATES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_RESERVATION_RATES;
    return parsed;
  } catch {
    return DEFAULT_RESERVATION_RATES;
  }
}

function saveLocal(rates) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

// ============================================================
// NORMALIZER
// ============================================================
function normalizeFromApi(rawList) {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return DEFAULT_RESERVATION_RATES;
  }
  return rawList
    .map((r) => ({
      id: TIER_TO_ID[r.tier] || (r.tier || "").toLowerCase(),
      backendId: r.id,  // ⬅️ MUHIMU: hifadhi backend id kwa PATCH
      hours: r.hours,
      label: r.label || { sw: r.label_sw || "", en: r.label_en || "" },
      sub: r.sub || (r.sub_sw ? { sw: r.sub_sw, en: r.sub_en } : null),
      fee: Number(r.fee) || 0,
      ordering: r.ordering ?? 0,
    }))
    .sort((a, b) => (a.ordering || 0) - (b.ordering || 0));
}

// ============================================================
// READS
// ============================================================
export function getReservationRates() {
  return readFromStorage();
}

export function getReservationRate(id) {
  return getReservationRates().find((r) => r.id === id) || null;
}

export function saveReservationRates(rates) {
  saveLocal(rates);
}

// ============================================================
// HYDRATE
// ============================================================
export async function hydrateReservationRatesFromApi() {
  try {
    const data = await api.get("/reservation-rates/");
    const normalized = normalizeFromApi(data);
    saveLocal(normalized);
    return { source: "api", rates: normalized };
  } catch (err) {
    console.warn("[feePolicy] hydrate failed:", err);
    return { source: "error", rates: getReservationRates() };
  }
}

// ============================================================
// ASYNC MUTATIONS — with rollback
// ============================================================
export async function updateReservationRateAsync(id, fee) {
  const numericFee = Number(fee);
  if (!Number.isFinite(numericFee) || numericFee < 0) {
    return { ok: false, error: new Error("Fee lazima iwe namba chanya") };
  }

  const previous = getReservationRates();
  const target = previous.find((r) => r.id === id);
  if (!target) {
    return { ok: false, error: new Error(`Rate "${id}" haipo`) };
  }

  // Optimistic
  const next = previous.map((r) => (r.id === id ? { ...r, fee: numericFee } : r));
  saveLocal(next);

  // Backend id inahitajika
  const backendId = target.backendId;
  if (!backendId) {
    // Hakuna backend id — rate hii ni local tu, hatuwezi PATCH
    console.warn(`[feePolicy] rate "${id}" haina backendId — siwezi ku-sync`);
    return { ok: true, warning: "local-only", rates: next };
  }

  try {
    await api.patch(`/reservation-rates/${backendId}/`, { fee: numericFee });
    return { ok: true, rates: next };
  } catch (err) {
    saveLocal(previous); // Rollback
    console.warn("[feePolicy] updateRate failed:", err);
    return { ok: false, error: err };
  }
}

/**
 * Bulk update — admin anaweza kubadilisha rates zote kwa pamoja.
 * Inarudisha { ok, results } ambapo results ni array ya { id, ok, error }.
 */
export async function updateAllReservationRatesAsync(newRates) {
  const results = [];
  for (const [id, fee] of Object.entries(newRates)) {
    const res = await updateReservationRateAsync(id, fee);
    results.push({ id, ...res });
  }
  const allOk = results.every((r) => r.ok);
  return { ok: allOk, results };
}

// ============================================================
// LEGACY SYNC (deprecated — inabaki kwa backward compat)
// ============================================================
/** @deprecated Use updateReservationRateAsync */
export function updateReservationRate(id, fee) {
  const current = getReservationRates();
  const target = current.find((r) => r.id === id);
  const next = current.map((r) => (r.id === id ? { ...r, fee: Number(fee) } : r));
  saveLocal(next);

  // Tuma kwa backend sasa (fire-and-forget lakini ina log)
  if (target?.backendId) {
    api.patch(`/reservation-rates/${target.backendId}/`, { fee: Number(fee) })
      .catch((err) => console.warn("[feePolicy] sync failed (silent):", err));
  }
  return next;
}

// ============================================================
// HOOKS
// ============================================================
export function useReservationRates() {
  const [rates, setRates] = useState(() => getReservationRates());

  useEffect(() => {
    hydrateReservationRatesFromApi();
    const sync = () => setRates(getReservationRates());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return rates;
}

// ============================================================
// CALCULATOR
// ============================================================
export function calcReservationFee(hours) {
  const rates = getReservationRates();
  const tiers = rates.filter((r) => r.hours != null).sort((a, b) => a.hours - b.hours);
  const custom = rates.find((r) => r.id === "custom");
  const perExtraDay = custom ? Number(custom.fee) : 0;

  for (const t of tiers) {
    if (hours <= t.hours) return Number(t.fee);
  }
  const last = tiers[tiers.length - 1];
  if (!last) return 0;
  const extraBlocks = Math.ceil((hours - last.hours) / 24);
  return Number(last.fee) + extraBlocks * perExtraDay;
}

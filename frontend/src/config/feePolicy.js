// ============================================================
// feePolicy.js
// CHANZO KIMOJA CHA UKWELI (single source of truth) kwa Reservation Fee.
//
// SHERIA: Namba za fee HAZIBADILISHWI popote pengine isipokuwa hapa.
// - Admin Dashboard (Revenue & Financial Settings) ndipo mahali pekee
//   panaporuhusiwa kubadilisha thamani hizi (ndiye "mmiliki" wa bei).
// - DealRooms.jsx na sehemu nyingine yoyote inayohitaji Reservation Fee
//   LAZIMA isome kutoka hapa kwa kutumia getReservationRates() au
//   useReservationRates() — kamwe isiandike namba zake tofauti.
//
// Hii ni demo ya front-end pekee (hakuna backend bado), kwa hiyo
// tunatumia localStorage kuhifadhi mabadiliko ya admin ili DealRooms
// (na tab/ukurasa mwingine wowote) uone bei mpya papo hapo. Backend
// ikiwepo baadaye, badilisha tu functions hizi ziite API badala ya
// localStorage — sehemu zinazotumia hook hazitahitaji kubadilika.
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_reservation_rates_v1";
const UPDATE_EVENT = "sokomkononi:reservation-rates-updated";

// Hizi ndizo thamani rasmi za Admin Dashboard — ndizo zinazotumika
// kama default na pia ndizo zinazoonekana kwenye DealRooms sasa.
export const DEFAULT_RESERVATION_RATES = [
  { id: "24h", hours: 24, label: "Saa 24", sub: "Siku 1", fee: 10000 },
  { id: "48h", hours: 48, label: "Saa 48", sub: "Siku 2", fee: 18000 },
  { id: "72h", hours: 72, label: "Saa 72", sub: "Siku 3", fee: 25000 },
  // "custom" = kiwango cha ziada KWA SIKU kwa muda unaozidi saa 72
  { id: "custom", hours: null, label: "Custom (kwa siku)", fee: 8000 },
];

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

/** Soma rates za sasa (snapshot moja, si reactive). */
export function getReservationRates() {
  return readFromStorage();
}

/** Andika seti mpya kamili ya rates (Admin pekee anapaswa kuita hii). */
export function saveReservationRates(rates) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Badilisha fee ya tier moja tu (kwa mfano "24h") — hii ndiyo
 * inayoitwa na EditableAmount kwenye Admin > Revenue. */
export function updateReservationRate(id, fee) {
  const current = getReservationRates();
  const next = current.map((r) => (r.id === id ? { ...r, fee: Number(fee) } : r));
  saveReservationRates(next);
  return next;
}

/**
 * Hook ya React inayosoma rates na kujisasisha yenyewe kila admin
 * anapobadilisha bei — kwenye tab ileile (custom event) na kwenye
 * tab/dirisha nyingine (storage event).
 */
export function useReservationRates() {
  const [rates, setRates] = useState(() => getReservationRates());

  useEffect(() => {
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

/**
 * Kokotoa Reservation Fee kwa saa yoyote, kwa kutumia rates za sasa
 * kutoka Admin Dashboard. Tiers 24/48/72 zinatumika moja kwa moja;
 * chochote zaidi ya saa 72 kinaongezewa kiwango cha "custom" kwa kila
 * siku (blocks za saa 24) zinazozidi.
 */
export function calcReservationFee(hours) {
  const rates = getReservationRates();
  const tiers = rates
    .filter((r) => r.hours != null)
    .sort((a, b) => a.hours - b.hours);
  const custom = rates.find((r) => r.id === "custom");
  const perExtraDay = custom ? Number(custom.fee) : 0;

  for (const t of tiers) {
    if (hours <= t.hours) return Number(t.fee);
  }

  const last = tiers[tiers.length - 1];
  const extraBlocks = Math.ceil((hours - last.hours) / 24);
  return Number(last.fee) + extraBlocks * perExtraDay;
}

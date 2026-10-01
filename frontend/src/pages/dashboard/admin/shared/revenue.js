// ============================================================
// shared/revenue.js
// Chanzo KIMOJA cha ukweli cha mapato ya jukwaa zima:
//   GET /api/finance/dashboard/?period=all
// Jumla na kila njia ya mapato vinatoka kwenye jibu moja, kwa hiyo
// haviwezi kutofautiana. Overview na Reports zinatumia hook hii hii.
// ============================================================
import { useEffect, useState } from "react";
import { financeApi } from "../../../../api/finance.js";

// key = ufunguo wa ndani, field = jina la field kwenye jibu la backend.
// `optional`: inaonyeshwa tu ikiwa backend imeituma.
export const REVENUE_STREAMS = [
  { key: "listing", label: "Listing Fee", field: "listing_fee_revenue" },
  { key: "reservation", label: "Reservation", field: "reservation_revenue" },
  { key: "boost", label: "Boost", field: "boosting_revenue" },
  { key: "leading", label: "Leading", field: "leading_revenue" },
  { key: "advertise", label: "Ads", field: "advertisement_revenue" },
  { key: "bundle", label: "Bundles", field: "bundle_revenue" },
  { key: "success", label: "Success Fee", field: "success_fee_revenue", optional: true },
];

const DEFAULT_STREAMS = REVENUE_STREAMS.filter((s) => !s.optional);

export function parsePlatformRevenue(raw) {
  const num = (v) => Number(v) || 0;
  const byType = {};
  const streams = [];
  REVENUE_STREAMS.forEach((s) => {
    if (s.optional && raw?.[s.field] == null) return;
    byType[s.key] = num(raw?.[s.field]);
    streams.push(s);
  });
  const sum = streams.reduce((acc, s) => acc + byType[s.key], 0);
  return {
    total: raw?.total_revenue != null ? num(raw.total_revenue) : sum,
    byType,
    streams,
    refunds: num(raw?.refunds),
    net: raw?.net_revenue != null ? num(raw.net_revenue) : sum,
  };
}

export function usePlatformRevenue(period = "all") {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    financeApi
      .dashboard(period)
      .then((raw) => {
        if (!cancelled)
          setState({ loading: false, error: null, data: parsePlatformRevenue(raw) });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const { loading, error, data } = state;
  return {
    loading,
    error,
    total: data?.total ?? 0,
    byType: data?.byType ?? {},
    streams: data?.streams ?? DEFAULT_STREAMS,
    refunds: data?.refunds ?? 0,
    net: data?.net ?? 0,
  };
}

// ---- Msaada wa chati ya siku 7 (miamala ya ndani ya kifaa) ----
export const PLATFORM_FEE_TYPES = [
  "listing_fee",
  "reservation",
  "boost",
  "leading",
  "advertisement",
  "success_fee",
];

export function isRevenueTransaction(t) {
  return !!t && t.status === "completed" && PLATFORM_FEE_TYPES.includes(t.type);
}

/** Ufunguo wa siku kwa saa za ndani ya kifaa (YYYY-MM-DD), si UTC. */
export function localDayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
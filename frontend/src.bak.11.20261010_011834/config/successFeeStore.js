// ============================================================
//   - hydrateSuccessFeeStatusFromApi() — fee fresh kutoka /status/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_success_fee_config_v1";
const STATUS_KEY = "sokomkononi_success_fee_status_v1";
const EV = "sokomkononi:success-fee-config-updated";

const FALLBACK = {
  key: "default",
  label_sw: "Ada ya Mafanikio",
  label_en: "Success Fee",
  desc_sw: "Ada ndogo ya kupakua ripoti ya miamala.",
  desc_en: "Small fee to download transactions report.",
  percentage: 2.0,
  min_fee: 5000,
  max_fee: 500000,
  is_enabled: true,
  updated_at: null,
};

const STATUS_FALLBACK = {
  is_free: false,
  fee: "5000",
  requires_payment: true,
  success_fee_enabled: true,
  percentage: "2.0",
  max_fee: "500000",
  formats: ["pdf", "csv", "doc"],
  loaded_at: null,
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

function readStatus() {
  if (typeof window === "undefined") return STATUS_FALLBACK;
  try {
    const raw = window.localStorage.getItem(STATUS_KEY);
    if (!raw) return STATUS_FALLBACK;
    const p = JSON.parse(raw);
    return p && typeof p === "object"
      ? { ...STATUS_FALLBACK, ...p }
      : STATUS_FALLBACK;
  } catch {
    return STATUS_FALLBACK;
  }
}

function writeStatus(status) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATUS_KEY, JSON.stringify(status));
  window.dispatchEvent(new Event(EV));
}

function norm(raw) {
  if (!raw) return null;
  return {
    key: raw.key || "default",
    label_sw: raw.label_sw || "Ada ya Mafanikio",
    label_en: raw.label_en || "Success Fee",
    desc_sw: raw.desc_sw || "",
    desc_en: raw.desc_en || "",
    percentage: Number(raw.percentage) || 2.0,
    min_fee: Number(raw.min_fee) || 5000,
    max_fee: Number(raw.max_fee) || 500000,
    is_enabled: raw.is_enabled !== false,
    updated_at: raw.updated_at || null,
  };
}

function normStatus(raw) {
  if (!raw) return null;
  return {
    is_free: !!raw.is_free,
    fee: String(raw.fee ?? "5000"),
    requires_payment: raw.requires_payment !== false,
    success_fee_enabled: raw.success_fee_enabled !== false,
    percentage: String(raw.percentage ?? "0"),
    max_fee: String(raw.max_fee ?? "0"),
    formats: Array.isArray(raw.formats) ? raw.formats : ["pdf", "csv", "doc"],
    loaded_at: new Date().toISOString(),
  };
}

// ============================================================
// SYNCHRONOUS READS
// ============================================================
export function getSuccessFeeConfig() {
  return read();
}

export function getSuccessFeeStatus() {
  return readStatus();
}

// ============================================================
// HYDRATE CONFIG
// ============================================================
async function _hydrateSuccessCfgImpl() {
  try {
    const raw = await api.get("/finance/success-fee-config/");
    const normalized = norm(raw);
    if (normalized) {
      write(normalized);
      console.info("[successFeeStore] config hydrated:", normalized);
      return { ok: true, config: normalized };
    }
    return { ok: true, config: null };
  } catch (err) {
    console.warn(
      "[successFeeStore] config hydrate failed:",
      err?.message,
      err?.status
    );
    return { ok: false, error: err };
  }
}

// ============================================================
// HYDRATE STATUS (fee fresh kutoka /status/)
// ============================================================
async function _hydrateSuccessStatusImpl() {
  try {
    const raw = await api.get("/finance/success-fee/status/");
    const normalized = normStatus(raw);
    if (normalized) {
      writeStatus(normalized);
      console.info("[successFeeStore] status hydrated:", normalized);
      return { ok: true, status: normalized };
    }
    return { ok: true, status: null };
  } catch (err) {
    console.warn(
      "[successFeeStore] status hydrate failed:",
      err?.message,
      err?.status
    );
    return { ok: false, error: err };
  }
}

// ============================================================
// MUTATIONS
// ============================================================
let _inflight_hydrateSuccessFeeStatusFromApi = null;
let _inflight_hydrateSuccessFeeFromApi = null;
export function hydrateSuccessFeeFromApi(...args) {
  if (_inflight_hydrateSuccessFeeFromApi) return _inflight_hydrateSuccessFeeFromApi;
  _inflight_hydrateSuccessFeeFromApi = _hydrateSuccessCfgImpl(...args).finally(() => { _inflight_hydrateSuccessFeeFromApi = null; });
  return _inflight_hydrateSuccessFeeFromApi;
}

export function hydrateSuccessFeeStatusFromApi(...args) {
  if (_inflight_hydrateSuccessFeeStatusFromApi) return _inflight_hydrateSuccessFeeStatusFromApi;
  _inflight_hydrateSuccessFeeStatusFromApi = _hydrateSuccessStatusImpl(...args).finally(() => { _inflight_hydrateSuccessFeeStatusFromApi = null; });
  return _inflight_hydrateSuccessFeeStatusFromApi;
}

export async function updateSuccessFeeAsync(patch) {
  const cur = read();
  const optimistic = { ...cur, ...patch };
  write(optimistic);

  try {
    const raw = await api.patch("/finance/success-fee-config/", patch);
    const updated = norm(raw) || optimistic;
    write(updated);
    // Sasisha status pia (fee inaweza kubadilika)
    await hydrateSuccessFeeStatusFromApi();
    return { ok: true, config: updated };
  } catch (err) {
    write(cur); // Rollback
    return { ok: false, error: err };
  }
}

export async function toggleSuccessFeeAsync() {
  const cur = read();
  const newState = !cur.is_enabled;
  write({ ...cur, is_enabled: newState });

  try {
    const raw = await api.post("/finance/success-fee-config/toggle/", {});
    const updated = { ...cur, is_enabled: raw?.is_enabled ?? newState };
    write(updated);
    // Sasisha status pia
    await hydrateSuccessFeeStatusFromApi();
    return { ok: true, is_enabled: updated.is_enabled };
  } catch (err) {
    write(cur);
    return { ok: false, error: err };
  }
}

// ============================================================
// HOOKS
// ============================================================
export function useSuccessFeeConfig() {
  const [cfg, setCfg] = useState(() => read());
  useEffect(() => {
    hydrateSuccessFeeFromApi();
    hydrateSuccessFeeStatusFromApi();
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

// Hook mpya: inarudisha status halisi (fee fresh)
export function useSuccessFeeStatus() {
  const [status, setStatus] = useState(() => readStatus());
  useEffect(() => {
    hydrateSuccessFeeStatusFromApi();
    const sync = () => setStatus(readStatus());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return status;
}

// ============================================================
// CALC FEE
// Kumbuka: download fee ni FLAT = min_fee (kutoka backend).
// percentage na max_fee hazitumiki kwa download.
// ============================================================
export function calcSuccessFee() {
  const status = readStatus();
  if (status.is_free) return 0;
  return Number(status.fee) || 0;
}

// Legacy helper (kwa deal amounts, sio download fee)
export function calcSuccessFeeForDeal(dealAmount) {
  const cfg = read();
  if (!cfg.is_enabled) return 0;
  const amount = Number(dealAmount) || 0;
  const raw = amount * (cfg.percentage / 100);
  let fee = raw;
  if (cfg.min_fee && fee < cfg.min_fee) fee = cfg.min_fee;
  if (cfg.max_fee && fee > cfg.max_fee) fee = cfg.max_fee;
  return Math.round(fee);
}
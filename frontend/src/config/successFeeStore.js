// ============================================================
// successFeeStore.js — Success Fee Config (API-backed)
// Backend: GET/PATCH /api/finance/success-fee-config/
//          POST      /api/finance/success-fee-config/toggle/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_success_fee_config_v1";
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

export function getSuccessFeeConfig() {
  return read();
}

export async function hydrateSuccessFeeFromApi() {
  try {
    const raw = await api.get("/finance/success-fee-config/");
    const normalized = norm(raw);
    if (normalized) {
      write(normalized);
      console.info("[successFeeStore] hydrated:", normalized);
      return { ok: true, config: normalized };
    }
    return { ok: true, config: null };
  } catch (err) {
    console.warn("[successFeeStore] hydrate failed:", err?.message, err?.status);
    return { ok: false, error: err };
  }
}

export async function updateSuccessFeeAsync(patch) {
  const cur = read();
  const optimistic = { ...cur, ...patch };
  write(optimistic);

  try {
    const raw = await api.patch("/finance/success-fee-config/", patch);
    const updated = norm(raw) || optimistic;
    write(updated);
    return { ok: true, config: updated };
  } catch (err) {
    write(cur);  // Rollback
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
    return { ok: true, is_enabled: updated.is_enabled };
  } catch (err) {
    write(cur);
    return { ok: false, error: err };
  }
}

export function useSuccessFeeConfig() {
  const [cfg, setCfg] = useState(() => read());
  useEffect(() => {
    hydrateSuccessFeeFromApi();
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

/**
 * Calculate success fee kwa deal amount.
 * Formula: min(max(deal * percentage / 100, min_fee), max_fee)
 */
export function calcSuccessFee(dealAmount) {
  const cfg = read();
  if (!cfg.is_enabled) return 0;
  const amount = Number(dealAmount) || 0;
  const raw = amount * (cfg.percentage / 100);
  let fee = raw;
  if (cfg.min_fee && fee < cfg.min_fee) fee = cfg.min_fee;
  if (cfg.max_fee && fee > cfg.max_fee) fee = cfg.max_fee;
  return Math.round(fee);
}
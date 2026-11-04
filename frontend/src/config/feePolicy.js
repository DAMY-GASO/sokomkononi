// ============================================================
// feePolicy.js — Reservation Fee (API-backed, tiers-based)
// Backend:
//   GET/PATCH  /api/reservation-settings/        (is_enabled)
//   POST       /api/reservation-settings/toggle/
//   GET/POST   /api/reservation-tiers/
//   PATCH/DEL  /api/reservation-tiers/{id}/
//   POST       /api/reservation-tiers/{id}/toggle/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { guarded } from "./hydrateGuard.js";

const SETTINGS_KEY = "sokomkononi_reservation_settings_v1";
const TIERS_KEY = "sokomkononi_reservation_tiers_v1";
const EV = "sokomkononi:reservation-updated";

const DEFAULT_SETTINGS = {
  is_enabled: true,
  updated_at: null,
};

// Fallback tu — inatumika kama API imeshindikana kabisa
const FALLBACK_TIERS = [
  { id: "t-12", hours: 12, fee: 1000, is_active: true, order: 1 },
  { id: "t-24", hours: 24, fee: 2000, is_active: true, order: 2 },
  { id: "t-36", hours: 36, fee: 3000, is_active: true, order: 3 },
  { id: "t-48", hours: 48, fee: 4000, is_active: true, order: 4 },
  { id: "t-72", hours: 72, fee: 5000, is_active: true, order: 5 },
  { id: "t-96", hours: 96, fee: 6000, is_active: true, order: 6 },
  { id: "t-168", hours: 168, fee: 10000, is_active: true, order: 7 },
];

// ── Storage helpers ──────────────────────────────────────
function readSettings() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const p = JSON.parse(raw);
    return p && typeof p === "object"
      ? { ...DEFAULT_SETTINGS, ...p }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(cfg) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event(EV));
}

function readTiers() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TIERS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeTiers(list) {
  if (typeof window === "undefined") return;
  const sorted = [...list].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.hours - b.hours
  );
  window.localStorage.setItem(TIERS_KEY, JSON.stringify(sorted));
  window.dispatchEvent(new Event(EV));
}

// ── Normalizers ──────────────────────────────────────────
function normSettings(raw) {
  if (!raw) return null;
  return {
    is_enabled: raw.is_enabled !== false,
    updated_at: raw.updated_at || null,
  };
}

function normTier(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    hours: Number(raw.hours) || 0,
    fee: Number(raw.fee) || 0,
    is_active: raw.is_active !== false,
    order: Number(raw.order) || 0,
    updated_at: raw.updated_at || null,
  };
}

// ============================================================
// SYNC READS
// ============================================================
export function getReservationSettings() {
  return readSettings();
}

export function getReservationTiers() {
  return readTiers();
}

// ============================================================
// HYDRATE — deduped, fallback only on failure
// ============================================================
async function _hydrateReservationFromApi() {
  const result = { ok: true, settings: null, tiers: null };

  try {
    const s = await api.get("/reservation-settings/");
    const norm = normSettings(Array.isArray(s) ? s[0] : s);
    if (norm) {
      writeSettings(norm);
      result.settings = norm;
    }
  } catch (err) {
    console.warn("[feePolicy] settings hydrate failed:", err?.message);
    result.ok = false;
  }

  try {
    const t = await api.get("/reservation-tiers/");
    const arr = Array.isArray(t) ? t : t?.results || [];
    const norm = arr.map(normTier).filter(Boolean);
    writeTiers(norm);
    result.tiers = norm;
  } catch (err) {
    console.warn("[feePolicy] tiers hydrate failed:", err?.message);
    // ✅ Fallback TU baada ya API kushindikana na localStorage iko empty
    if (readTiers().length === 0) {
      console.info("[feePolicy] using fallback tiers (API unavailable)");
      writeTiers(FALLBACK_TIERS);
    }
    result.ok = false;
  }

  console.info("[feePolicy] hydrated:", result);
  return result;
}

// ✅ guarded() — dedupes concurrent calls, TTL 1.5s
export const hydrateReservationFromApi = guarded(_hydrateReservationFromApi, {
  key: "feePolicy:hydrate",
});

// ============================================================
// SETTINGS — toggle
// ============================================================
export async function toggleReservationFeeAsync() {
  const cur = readSettings();
  const newState = !cur.is_enabled;
  writeSettings({ ...cur, is_enabled: newState });

  try {
    const raw = await api.post("/reservation-settings/toggle/", {});
    const updated = {
      ...cur,
      is_enabled: raw?.is_enabled ?? newState,
    };
    writeSettings(updated);
    return { ok: true, is_enabled: updated.is_enabled };
  } catch (err) {
    writeSettings(cur);
    return { ok: false, error: err };
  }
}

// ============================================================
// TIERS — CRUD
// ============================================================
export async function addReservationTierAsync({ hours, fee, is_active = true, order }) {
  const h = Number(hours);
  const f = Number(fee);
  if (!Number.isFinite(h) || h < 1) {
    return { ok: false, error: new Error("Hours must be at least 1") };
  }
  if (!Number.isFinite(f) || f < 0) {
    return { ok: false, error: new Error("Fee must be non-negative") };
  }

  try {
    const payload = { hours: h, fee: f, is_active };
    if (Number.isFinite(order)) payload.order = Number(order);
    const raw = await api.post("/reservation-tiers/", payload);
    const created = normTier(raw);
    if (created) {
      writeTiers([...readTiers(), created]);
    }
    return { ok: true, tier: created };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function updateReservationTierAsync(id, patch) {
  const cur = readTiers();
  const idx = cur.findIndex((t) => String(t.id) === String(id));
  if (idx === -1) return { ok: false, error: new Error("Tier not found") };

  const prev = cur[idx];
  const optimistic = { ...prev, ...patch };
  const next = [...cur];
  next[idx] = optimistic;
  writeTiers(next);

  try {
    const raw = await api.patch(`/reservation-tiers/${id}/`, patch);
    const updated = normTier(raw) || optimistic;
    const after = readTiers().map((t) =>
      String(t.id) === String(id) ? updated : t
    );
    writeTiers(after);
    return { ok: true, tier: updated };
  } catch (err) {
    const rollback = readTiers().map((t) =>
      String(t.id) === String(id) ? prev : t
    );
    writeTiers(rollback);
    return { ok: false, error: err };
  }
}

export async function removeReservationTierAsync(id) {
  const cur = readTiers();
  const prev = cur.find((t) => String(t.id) === String(id));
  if (!prev) return { ok: false, error: new Error("Tier not found") };

  writeTiers(cur.filter((t) => String(t.id) !== String(id)));

  try {
    await api.delete(`/reservation-tiers/${id}/`);
    return { ok: true };
  } catch (err) {
    writeTiers([...readTiers(), prev]);
    return { ok: false, error: err };
  }
}

export async function toggleReservationTierAsync(id) {
  const cur = readTiers();
  const idx = cur.findIndex((t) => String(t.id) === String(id));
  if (idx === -1) return { ok: false, error: new Error("Tier not found") };

  const prev = cur[idx];
  const optimistic = { ...prev, is_active: !prev.is_active };
  const next = [...cur];
  next[idx] = optimistic;
  writeTiers(next);

  try {
    const raw = await api.post(`/reservation-tiers/${id}/toggle/`, {});
    const updated = {
      ...optimistic,
      is_active: raw?.is_active ?? optimistic.is_active,
    };
    const after = readTiers().map((t) =>
      String(t.id) === String(id) ? updated : t
    );
    writeTiers(after);
    return { ok: true, tier: updated };
  } catch (err) {
    const rollback = readTiers().map((t) =>
      String(t.id) === String(id) ? prev : t
    );
    writeTiers(rollback);
    return { ok: false, error: err };
  }
}

// ============================================================
// HOOKS — no hydrate call (App.jsx handles bootstrap)
// ============================================================
export function useReservationSettings() {
  const [cfg, setCfg] = useState(() => readSettings());
  useEffect(() => {
    const sync = () => setCfg(readSettings());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return cfg;
}

export function useReservationTiers() {
  const [list, setList] = useState(() => readTiers());
  useEffect(() => {
    const sync = () => setList(readTiers());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return list;
}

// Active tiers pekee, zilizopangwa
export function useActiveReservationTiers() {
  const all = useReservationTiers();
  return all
    .filter((t) => t.is_active)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.hours - b.hours);
}

// ============================================================
// CALC — fee kwa tier fulani (hours) au 0 kama disabled
// ============================================================
export function calcReservationFee(hours) {
  const settings = readSettings();
  if (!settings.is_enabled) return 0;

  const tiers = readTiers();
  const h = Number(hours);
  const match = tiers.find((t) => Number(t.hours) === h && t.is_active);
  if (match) return Number(match.fee) || 0;

  // Fallback: tumia tier ya karibu zaidi chini ya hours
  const sorted = [...tiers]
    .filter((t) => t.is_active && t.hours <= h)
    .sort((a, b) => b.hours - a.hours);
  return sorted[0] ? Number(sorted[0].fee) || 0 : 0;
}
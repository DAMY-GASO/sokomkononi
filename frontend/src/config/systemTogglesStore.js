// ============================================================
// systemTogglesStore.js — System Feature Toggles (API-backed)
// Backend: GET/PATCH /api/finance/toggles/
//          POST      /api/finance/toggles/{key}/toggle/
//          POST      /api/finance/toggles/bulk-toggle/
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";

const KEY = "sokomkononi_system_toggles_v1";
const EV = "sokomkononi:system-toggles-updated";

const FALLBACK = [];

function read() {
  if (typeof window === "undefined") return FALLBACK;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return FALLBACK;
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

function norm(raw) {
  if (!raw) return null;
  return {
    key: raw.key,
    label_sw: raw.label_sw || "",
    label_en: raw.label_en || "",
    desc_sw: raw.desc_sw || "",
    desc_en: raw.desc_en || "",
    is_enabled: raw.is_enabled !== false,
    updated_at: raw.updated_at || null,
  };
}

export function getSystemToggles() {
  return read();
}

export function getSystemToggle(key) {
  if (!key) return null;
  return read().find((t) => t.key === key) || null;
}

export function isFeatureEnabled(key) {
  const toggle = getSystemToggle(key);
  // Kama toggle haipo → feature ipo enabled by default
  return toggle ? toggle.is_enabled !== false : true;
}

export async function hydrateSystemTogglesFromApi() {
  try {
    const data = await api.get("/finance/toggles/");
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(norm).filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) {
    console.warn("[systemTogglesStore] hydrate failed:", err?.message, err?.status);
    return { ok: false, error: err };
  }
}

export async function toggleFeatureAsync(key) {
  const cur = read();
  const target = cur.find((t) => t.key === key);
  if (!target) return { ok: false, error: new Error("Toggle haipo") };

  const newState = !target.is_enabled;
  write(cur.map((t) => (t.key === key ? { ...t, is_enabled: newState } : t)));

  try {
    const raw = await api.post(`/finance/toggles/${key}/toggle/`, {});
    const finalState = raw?.is_enabled ?? newState;
    write(
      cur.map((t) =>
        t.key === key ? { ...t, is_enabled: finalState } : t
      )
    );
    return { ok: true, is_enabled: finalState };
  } catch (err) {
    write(cur);  // Rollback
    return { ok: false, error: err };
  }
}

export async function bulkToggleAsync(updates) {
  const cur = read();
  const optimistic = cur.map((t) =>
    updates[t.key] != null ? { ...t, is_enabled: !!updates[t.key] } : t
  );
  write(optimistic);

  try {
    const raw = await api.post("/finance/toggles/bulk-toggle/", updates);
    await hydrateSystemTogglesFromApi();
    return { ok: true, updated: raw?.updated || [] };
  } catch (err) {
    write(cur);
    return { ok: false, error: err };
  }
}

export function useSystemToggles() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateSystemTogglesFromApi();
    const sync = () => setList(read());
    window.addEventListener("storage", sync);
    window.addEventListener(EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EV, sync);
    };
  }, []);
  return list;
}

export function useFeatureEnabled(key) {
  const list = useSystemToggles();
  const toggle = list.find((t) => t.key === key);
  return toggle ? toggle.is_enabled !== false : true;
}
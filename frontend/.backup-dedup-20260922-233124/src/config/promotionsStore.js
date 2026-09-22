// ============================================================
// promotionsStore.js — API-only via /api/promotions/
// ============================================================
import { useEffect, useState } from "react";
import { promotionsApi } from "../api/promotions.js";

const A_KEY = "sokomkononi_promotions_analytics_v1";
const C_KEY = "sokomkononi_promotions_campaigns_v1";
const A_EV = "sokomkononi:promotions-analytics-updated";
const C_EV = "sokomkononi:campaigns-updated";

const EMPTY_ANALYTICS = {
  boostedListings: [], leadingListings: [], advertisedListings: [],
  counts: { boosted: 0, leading: 0, advertised: 0, campaigns: 0, totalActive: 0 },
  revenueByType: { boost: 0, leading: 0, advertise: 0 },
  totalPromotionRevenue: 0,
  topPromotedSellers: [],
  source: "empty",
};

function readJson(key, fb) {
  if (typeof window === "undefined") return fb;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fb;
    const p = JSON.parse(raw);
    return p ?? fb;
  } catch { return fb; }
}
function writeJson(key, ev, v) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(v));
  window.dispatchEvent(new Event(ev));
}

export function getPromotionsAnalyticsCache() { return readJson(A_KEY, null); }
export function getCampaigns() { return readJson(C_KEY, []); }

export async function hydratePromotionsAnalyticsFromApi() {
  try {
    const data = await promotionsApi.analytics();
    writeJson(A_KEY, A_EV, data);
    return { ok: true, data };
  } catch (err) { return { ok: false, error: err }; }
}

function normCampaign(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || { sw: "", en: "" },
    description: raw.description || { sw: "", en: "" },
    discountPercent: Number(raw.discountPercent ?? raw.discount_percent) || 0,
    startDate: raw.startDate || raw.start_date,
    endDate: raw.endDate || raw.end_date,
    active: raw.active !== false,
    createdAt: raw.createdAt || raw.created_at,
  };
}

export async function hydrateCampaignsFromApi() {
  try {
    const data = await promotionsApi.campaigns.list();
    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(normCampaign).filter(Boolean);
    writeJson(C_KEY, C_EV, normalized);
    return { ok: true, count: normalized.length };
  } catch (err) { return { ok: false, error: err }; }
}

export async function addCampaignAsync(form) {
  if (!form?.name) return { ok: false, error: new Error("name required") };
  try {
    const raw = await promotionsApi.campaigns.create({
      name: form.name, description: form.description,
      discount_percent: form.discountPercent || 0,
      start_date: form.startDate, end_date: form.endDate,
      active: form.active !== false,
    });
    const created = normCampaign(raw);
    writeJson(C_KEY, C_EV, [created, ...getCampaigns()]);
    return { ok: true, campaign: created };
  } catch (err) { return { ok: false, error: err }; }
}

export async function updateCampaignAsync(id, patch) {
  try {
    const body = {};
    if (patch.name != null) body.name = patch.name;
    if (patch.description != null) body.description = patch.description;
    if (patch.discountPercent != null) body.discount_percent = patch.discountPercent;
    if (patch.startDate != null) body.start_date = patch.startDate;
    if (patch.endDate != null) body.end_date = patch.endDate;
    if (patch.active != null) body.active = patch.active;
    const raw = await promotionsApi.campaigns.update(id, body);
    const updated = normCampaign(raw);
    writeJson(C_KEY, C_EV, getCampaigns().map((c) => (c.id === id ? updated : c)));
    return { ok: true, campaign: updated };
  } catch (err) { return { ok: false, error: err }; }
}

export async function removeCampaignAsync(id) {
  try {
    await promotionsApi.campaigns.remove(id);
    writeJson(C_KEY, C_EV, getCampaigns().filter((c) => c.id !== id));
    return { ok: true };
  } catch (err) { return { ok: false, error: err }; }
}

export function usePromotions() {
  const [a, setA] = useState(() => readJson(A_KEY, null));
  const [c, setC] = useState(() => getCampaigns());
  useEffect(() => {
    hydratePromotionsAnalyticsFromApi();
    hydrateCampaignsFromApi();
    const sa = () => setA(readJson(A_KEY, null));
    const sc = () => setC(getCampaigns());
    window.addEventListener("storage", sa);
    window.addEventListener(A_EV, sa);
    window.addEventListener("storage", sc);
    window.addEventListener(C_EV, sc);
    return () => {
      window.removeEventListener("storage", sa);
      window.removeEventListener(A_EV, sa);
      window.removeEventListener("storage", sc);
      window.removeEventListener(C_EV, sc);
    };
  }, []);
  const base = a && typeof a === "object" ? { ...EMPTY_ANALYTICS, ...a } : EMPTY_ANALYTICS;
  return { ...base, campaigns: c, source: a ? "api" : "empty" };
}

export function useCampaigns() {
  const [list, setList] = useState(() => getCampaigns());
  useEffect(() => {
    hydrateCampaignsFromApi();
    const sync = () => setList(getCampaigns());
    window.addEventListener("storage", sync);
    window.addEventListener(C_EV, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(C_EV, sync);
    };
  }, []);
  return list;
}
export function useActiveCampaigns() {
  const now = Date.now();
  return useCampaigns().filter((c) => {
    if (!c.active) return false;
    if (c.startDate && new Date(c.startDate).getTime() > now) return false;
    if (c.endDate && new Date(c.endDate).getTime() < now) return false;
    return true;
  });
}

// LEGACY
export const SEED_CAMPAIGNS = [];
export function addCampaign() { return null; }
export function updateCampaign() {}
export function removeCampaign() {}

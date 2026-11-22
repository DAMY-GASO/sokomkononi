// src/config/leadingPackagesStore.js
// ============================================================
// ✅ FIX #11 (race): hydrate ya zamani HAIANDIKI juu ya mabadiliko mapya.
//    hydrateGuard inazuia tu cache ya matokeo; write() hutokea ndani ya
//    _hydrate... kabla guard haijaona generation. mutationVersion +
//    pendingMutations: kama mutation ilianza/iliisha wakati GET ilikuwa
//    njiani, GET hiyo inaachwa.
// ============================================================
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { guarded } from "./hydrateGuard.js";

const KEY = "sokomkononi_leading_packages_v1";
const EV = "sokomkononi:leading-packages-updated";
const BASE = "/leading-fees/packages/";

// ── Mutation tracking (FIX #11) ──────────────────────────────
let mutationVersion = 0;
let pendingMutations = 0;

async function tracked(fn) {
  pendingMutations += 1;
  mutationVersion += 1;
  try {
    return await fn();
  } finally {
    mutationVersion += 1;
    pendingMutations -= 1;
  }
}

// ============================================================
// LOCAL STORAGE
// ============================================================
function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function write(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EV));
}

// ============================================================
// NORMALIZER
// ============================================================
function norm(raw) {
  if (!raw) return null;
  const hours = Number(raw.duration_hours) || 0;
  return {
    id: raw.id,
    name: raw.name,
    hours,
    days: Math.round(hours / 24) || 1,
    price: Number(raw.price) || 0,
    pricing: raw.pricing || null,
    description: raw.description || "",
    isActive: raw.is_active !== false,
    ordering: Number(raw.ordering) || 0,
  };
}

// ============================================================
// SYNCHRONOUS READS
// ============================================================
export function getLeadingPackages() {
  return read();
}

// ============================================================
// HYDRATE — deduped via guarded() + stale-write protection
// ============================================================
async function _hydrateLeadingPackagesFromApi() {
  const versionAtStart = mutationVersion;
  try {
    const d = await api.get(`${BASE}?page_size=200`);

    if (pendingMutations > 0 || mutationVersion !== versionAtStart) {
      console.info("[leadingPackagesStore] stale hydrate ignored (mutation during fetch)");
      return { ok: true, skipped: true };
    }

    const list = Array.isArray(d) ? d : d?.results || [];
    write(list.map(norm).filter(Boolean));
    return { ok: true, count: list.length };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export const hydrateLeadingPackagesFromApi = guarded(
  _hydrateLeadingPackagesFromApi,
  { key: "leadingPackagesStore:hydrate" }
);

// ============================================================
// ADD
// ============================================================
export function addLeadingPackageAsync({ name, hours, price, ordering }) {
  return tracked(async () => {
    const cleanName = (name || "").trim();
    if (!cleanName) {
      return { ok: false, error: new Error("Name required") };
    }
    const cleanHours = Number(hours) || 24;
    const cleanPrice = Number(price) || 0;
    if (cleanPrice < 0) {
      return { ok: false, error: new Error("Price must be >= 0") };
    }

    try {
      const raw = await api.post(BASE, {
        name: cleanName,
        duration_hours: cleanHours,
        price: cleanPrice,
        is_active: true,
        ordering: Number(ordering) || 0,
      });

      const created = norm(raw);

      if (!created) {
        try {
          await hydrateLeadingPackagesFromApi.forceRefresh();
        } catch {
          /* ignore */
        }
        return {
          ok: false,
          error: new Error("Backend returned invalid package payload"),
        };
      }

      write([...read(), created]);
      return { ok: true, package: created };
    } catch (err) {
      return { ok: false, error: err };
    }
  });
}

// ============================================================
// UPDATE — generic updater
// ============================================================
export function updateLeadingPackageAsync(id, patch) {
  return tracked(async () => {
    try {
      const body = {};
      if (patch.name != null) body.name = patch.name;
      if (patch.hours != null) body.duration_hours = Number(patch.hours);
      if (patch.price != null) body.price = Number(patch.price);
      if (patch.ordering != null) body.ordering = Number(patch.ordering);
      if (patch.isActive != null) body.is_active = patch.isActive;
      const raw = await api.patch(`${BASE}${id}/`, body);
      const updated = norm(raw);
      if (updated) {
        write(read().map((p) => (p.id === id ? updated : p)));
      }
      return { ok: true, package: updated };
    } catch (err) {
      return { ok: false, error: err };
    }
  });
}

// ============================================================
// RENAME
// ============================================================
export async function renameLeadingPackageAsync(id, name) {
  const clean = (name || "").trim();
  if (!clean) return { ok: false, error: new Error("Name required") };
  return updateLeadingPackageAsync(id, { name: clean });
}

// ============================================================
// REMOVE
// ============================================================
export function removeLeadingPackageAsync(id) {
  return tracked(async () => {
    try {
      await api.delete(`${BASE}${id}/`);
      write(read().filter((p) => p.id !== id));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err };
    }
  });
}

// ============================================================
// TOGGLE — washa/zima (server-side flip kupitia /toggle/)
// ============================================================
export function toggleLeadingPackageAsync(id) {
  return tracked(async () => {
    try {
      const raw = await api.post(`${BASE}${id}/toggle/`, {});
      const current = read().find((p) => p.id === id);
      if (!current) {
        return { ok: false, error: new Error("Package not found in cache") };
      }
      const updated = {
        ...current,
        isActive: raw?.is_active ?? !current.isActive,
      };
      write(read().map((p) => (p.id === id ? updated : p)));
      return { ok: true, isActive: updated.isActive };
    } catch (err) {
      return { ok: false, error: err };
    }
  });
}

// ============================================================
// HOOK
// ============================================================
export function useLeadingPackages() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateLeadingPackagesFromApi();
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
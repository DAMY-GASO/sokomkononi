// ============================================================
// boostPackagesStore.js — API-only via /api/boosting/packages/
//
// ✅ FIX #7: hydrate inatumia guarded() — dedupe, TTL, forceRefresh.
// ✅ FIX #11 (race): hydrate ya zamani HAIANDIKI juu ya mabadiliko mapya.
//    hydrateGuard inazuia tu cache ya matokeo, lakini write() inatokea
//    ndani ya _hydrate... kabla guard haijaona generation. Hapa tunatumia
//    mutationVersion + pendingMutations: kama kuna PATCH/POST/DELETE
//    iliyoanza au kuisha wakati GET ilikuwa njiani, GET inaachwa.
// ✅ FIX #12: toggle inakagua kuwa seva imerudisha is_active uliyotuma.
// ============================================================
import { useEffect, useState } from "react";
import { boostingApi } from "../api/boosting.js";
import { boostPackagesApi } from "../api/boostPackages.js";
import { guarded } from "./hydrateGuard.js";

const KEY = "sokomkononi_boost_packages_v1";
const EV = "sokomkononi:boost-packages-updated";

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

function norm(raw) {
  if (!raw) return null;
  const slug = (raw.code || raw.name || "")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  const hours = Number(raw.duration_hours) || 0;
  const days = Math.round(hours / 24) || 1;
  return {
    id: raw.id,
    key: slug,
    name: raw.name,
    label: { sw: raw.name, en: raw.name },
    days,
    hours,
    price: Number(raw.price) || 0,
    pricing: raw.pricing || null,
    description: raw.description || "",
    benefits: { sw: [], en: [] },
    isActive: raw.is_active !== false,
    ordering: Number(raw.ordering) || 0,
  };
}

export function getBoostPackages() {
  return read();
}

export function getBoostPackage(key) {
  return read().find((p) => p.key === key);
}

// ✅ FIX #7: guarded()  +  ✅ FIX #11: stale-write protection
async function _hydrateBoostPackagesFromApi() {
  const versionAtStart = mutationVersion;
  try {
    const data = await boostingApi.packages({ page_size: 200 });

    if (pendingMutations > 0 || mutationVersion !== versionAtStart) {
      console.info(
        "[boostPackagesStore] stale hydrate ignored (mutation during fetch)"
      );
      return { ok: true, skipped: true };
    }

    const list = Array.isArray(data) ? data : data?.results || [];
    const normalized = list.map(norm).filter(Boolean);
    write(normalized);
    return { ok: true, count: normalized.length };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export const hydrateBoostPackagesFromApi = guarded(
  _hydrateBoostPackagesFromApi,
  { key: "boostPackagesStore:hydrate" }
);

export function addBoostPackageAsync({ name, hours, price, ordering }) {
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
      const raw = await boostPackagesApi.create({
        name: cleanName,
        duration_hours: cleanHours,
        price: cleanPrice,
        is_active: true,
        ordering: Number(ordering) || 0,
      });
      const created = norm(raw);
      if (created) {
        write([...read(), created]);
      }
      return { ok: true, package: created };
    } catch (err) {
      return { ok: false, error: err };
    }
  });
}

export function updateBoostPackageAsync(id, patch) {
  return tracked(async () => {
    try {
      const body = {};
      if (patch.name != null) body.name = patch.name;
      if (patch.hours != null) body.duration_hours = Number(patch.hours);
      if (patch.price != null) body.price = Number(patch.price);
      if (patch.ordering != null) body.ordering = Number(patch.ordering);
      if (patch.isActive != null) body.is_active = patch.isActive;
      const raw = await boostPackagesApi.update(id, body);
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

export function updateBoostPackagePriceAsync(key, price) {
  return tracked(async () => {
    const num = Number(price);
    if (!Number.isFinite(num) || num < 0) {
      return { ok: false, error: new Error("price must be a positive number") };
    }
    const target = getBoostPackage(key);
    if (!target) {
      return { ok: false, error: new Error(`Package "${key}" not found`) };
    }
    if (typeof target.id !== "number") {
      return {
        ok: false,
        error: new Error(`Package "${key}" has no backend id — hydrate first`),
      };
    }
    try {
      const raw = await boostPackagesApi.update(target.id, { price: num });
      const updated = norm(raw) || { ...target, price: num };
      write(read().map((p) => (p.key === key ? updated : p)));
      return { ok: true, package: updated };
    } catch (err) {
      return { ok: false, error: err };
    }
  });
}

export function renameBoostPackageAsync(key, name) {
  return tracked(async () => {
    const clean = (name || "").trim();
    if (!clean) return { ok: false, error: new Error("Name required") };

    const target = getBoostPackage(key);
    if (!target)
      return { ok: false, error: new Error(`Package "${key}" not found`) };
    if (typeof target.id !== "number") {
      return { ok: false, error: new Error("Package has no backend id") };
    }

    write(read().map((p) => (p.key === key ? { ...p, name: clean } : p)));

    try {
      const raw = await boostPackagesApi.update(target.id, { name: clean });
      const updated = norm(raw);
      if (updated) {
        write(read().map((p) => (p.key === key ? updated : p)));
      }
      return { ok: true, package: updated || { ...target, name: clean } };
    } catch (err) {
      write(read().map((p) => (p.key === key ? target : p)));
      return { ok: false, error: err };
    }
  });
}

export function toggleBoostPackageActiveAsync(key) {
  return tracked(async () => {
    const target = getBoostPackage(key);
    if (!target) {
      return { ok: false, error: new Error(`Package "${key}" not found`) };
    }
    if (typeof target.id !== "number") {
      return {
        ok: false,
        error: new Error(`Package "${key}" has no backend id — hydrate first`),
      };
    }
    try {
      const nextActive = !target.isActive;
      const raw = await boostPackagesApi.update(target.id, {
        is_active: nextActive,
      });
      const updated = norm(raw) || { ...target, isActive: nextActive };

      // ✅ FIX #12: seva haikuhifadhi tulichotuma? Onyesha kosa wazi.
      if (updated.isActive !== nextActive) {
        console.error("[boostPackagesStore] server did not persist is_active", {
          sent: nextActive,
          raw,
        });
        write(read().map((p) => (p.key === key ? updated : p)));
        return {
          ok: false,
          error: new Error(
            "Seva haikuhifadhi hali mpya ya package (is_active). Jaribu tena."
          ),
        };
      }

      write(read().map((p) => (p.key === key ? updated : p)));
      return { ok: true, package: updated };
    } catch (err) {
      return { ok: false, error: err };
    }
  });
}

export function removeBoostPackageAsync(key) {
  return tracked(async () => {
    const target = getBoostPackage(key);
    if (!target) {
      return { ok: false, error: new Error(`Package "${key}" not found`) };
    }
    if (typeof target.id !== "number") {
      return {
        ok: false,
        error: new Error(`Package "${key}" has no backend id — hydrate first`),
      };
    }
    const previous = read();
    write(previous.filter((p) => p.key !== key));
    try {
      await boostPackagesApi.remove(target.id);
      return { ok: true };
    } catch (err) {
      write(previous);
      return { ok: false, error: err };
    }
  });
}

export function useBoostPackages() {
  const [list, setList] = useState(() => read());
  useEffect(() => {
    hydrateBoostPackagesFromApi();
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

export function useActiveBoostPackages() {
  return useBoostPackages().filter((p) => p.isActive);
}
// ============================================================
// hydrateGuard.js — cross-store hydrate dedupe
// ============================================================

const inflight = new Map();
const lastCompleted = new Map();
const DEFAULT_TTL_MS = 1500;

export function guarded(fn, opts = {}) {
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const name = opts.key || fn.name || "hydrate";

  const wrapped = async (...args) => {
    const k = `${name}::${JSON.stringify(args)}`;

    if (inflight.has(k)) return inflight.get(k);

    const last = lastCompleted.get(k);
    if (last && Date.now() - last.at < ttlMs) return last.result;

    const p = Promise.resolve(fn(...args))
      .then((res) => {
        lastCompleted.set(k, { at: Date.now(), result: res });
        return res;
      })
      .finally(() => inflight.delete(k));

    inflight.set(k, p);
    return p;
  };

  // ✅ Bypass cache — kwa manual refresh
  wrapped.forceRefresh = async (...args) => {
    const k = `${name}::${JSON.stringify(args)}`;
    inflight.delete(k);
    lastCompleted.delete(k);
    return wrapped(...args);
  };

  // ✅ Clear cache yote (kwa logout, n.k.)
  wrapped.clearCache = () => {
    inflight.clear();
    lastCompleted.clear();
  };

  return wrapped;
}

export function resetHydrateGuard() {
  inflight.clear();
  lastCompleted.clear();
}
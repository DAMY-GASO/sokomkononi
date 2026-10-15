// ============================================================
// hydrateGuard.js — cross-store hydrate dedupe
//
// Wraps a hydrate function so concurrent calls (from many
// components mounting at once) share a single in-flight promise.
// Short TTL prevents hammering the backend on rapid remounts.
// ============================================================

const inflight = new Map();
const lastCompleted = new Map();
const DEFAULT_TTL_MS = 1500;

export function guarded(fn, opts = {}) {
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const name = opts.key || fn.name || "hydrate";

  return async (...args) => {
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
}

export function resetHydrateGuard() {
  inflight.clear();
  lastCompleted.clear();
}

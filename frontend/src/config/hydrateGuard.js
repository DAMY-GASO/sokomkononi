// ============================================================
// hydrateGuard.js — cross-store hydrate dedupe
//
// ✅ FIX #1 (real): forceRefresh sasa inatumia generation counter
//    ili matokeo ya request ya zamani (stale) yasije yakaandika
//    lastCompleted juu ya data mpya. Hii inazuia "toggle inarudi ON"
//    kwa sababu ya race kati ya hydrate ya zamani na forceRefresh.
//
// ✅ FIX #1b: wrapped() inakubali { force: true } — sawa na forceRefresh.
//
// ✅ FIX #1c: undefined haicachewi kwenye lastCompleted.
// ============================================================

const inflight = new Map();
const lastCompleted = new Map();
const generation = new Map(); // key -> namba (inaongezeka kwa forceRefresh)
const DEFAULT_TTL_MS = 1500;

export function guarded(fn, opts = {}) {
  const ttlMs = opts.ttlMs ?? DEFAULT_TTL_MS;
  const name = opts.key || fn.name || "hydrate";

  const keyFor = (args) => `${name}::${JSON.stringify(args)}`;

  const bumpGeneration = (k) => {
    const g = (generation.get(k) || 0) + 1;
    generation.set(k, g);
    return g;
  };

  const wrapped = async (...args) => {
    // ✅ FIX #1b: inakubali { force: true } kama first arg
    const force =
      args.length > 0 &&
      args[0] &&
      typeof args[0] === "object" &&
      args[0].force === true;

    // Ondoa `force` kwenye args kabla ya ku-hash key
    const realArgs = force ? args.slice(1) : args;
    const k = keyFor(realArgs);

    if (force) {
      // ✅ FIX #1: bump generation — matokeo ya zamani hayatapokelewa
      bumpGeneration(k);
      inflight.delete(k);
      lastCompleted.delete(k);
    } else {
      if (inflight.has(k)) return inflight.get(k);

      const last = lastCompleted.get(k);
      if (last && Date.now() - last.at < ttlMs) return last.result;
    }

    const myGen = generation.get(k) || 0;

    const p = Promise.resolve(fn(...realArgs))
      .then((res) => {
        // ✅ FIX #1: andika tu kama generation haijabadilika
        if ((generation.get(k) || 0) === myGen) {
          // ✅ FIX #1c: usicache undefined
          if (res !== undefined) {
            lastCompleted.set(k, { at: Date.now(), result: res });
          }
        } else {
          // Matokeo ya zamani — yamepitwa na forceRefresh; puuza
          console.info(
            `[hydrateGuard] stale result ignored for "${k}" (gen ${myGen} → ${generation.get(k)})`
          );
        }
        return res;
      })
      .finally(() => {
        // Ondoa inflight tu kama bado ni ile ya generation hii
        if (inflight.get(k) === p) {
          inflight.delete(k);
        }
      });

    inflight.set(k, p);
    return p;
  };

  // ✅ Bypass cache — kwa manual refresh
  wrapped.forceRefresh = (...args) => wrapped({ force: true }, ...args);

  // ✅ Clear cache yote (kwa logout, n.k.)
  wrapped.clearCache = () => {
    inflight.clear();
    lastCompleted.clear();
    generation.clear();
  };

  return wrapped;
}

export function resetHydrateGuard() {
  inflight.clear();
  lastCompleted.clear();
  generation.clear();
}
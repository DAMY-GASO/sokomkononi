// ============================================================
// src/config/listingRanking.js
// MAHALI PAMOJA pa kuamua nani anapewa kipaumbele (Leading / Boost)
// na jinsi ya kuzungusha kwa haki. Inatumika na HomePage na AllListingsPage.
//
// ⚠️ Majina ya fields hayajathibitishwa na listingsStore — kama sehemu ya
// "Zinazopendekezwa" inatoka tupu, rekebisha HAPA tu (isLeadingListing,
// leadingTier, boostTier).
// ============================================================

export const ROTATION_WINDOW_MS = 10 * 60 * 1000; // mzunguko unabadilika kila dakika 10
export const currentRotationSeed = () => Math.floor(Date.now() / ROTATION_WINDOW_MS);

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Mali yenye "search priority" (imelipiwa Leading Fee)
export function isLeadingListing(l) {
  if (!l) return false;
  if (
    l.isLeading === true ||
    l.is_leading === true ||
    l.leading === true ||
    l.leadingActive === true ||
    l.hasSearchPriority === true ||
    l.searchPriority === true
  ) {
    return true;
  }
  const until =
    l.leadingUntil ||
    l.leading_until ||
    l.leadingExpiresAt ||
    l.leading_expires_at;
  if (until) {
    const ts = new Date(until).getTime();
    return Number.isFinite(ts) && ts > Date.now();
  }
  return false;
}

export function leadingTier(l) {
  return num(
    l.leadingPriority ?? l.leading_priority ?? l.leadingTier ??
    l.leadingPackage?.priority ?? l.leadingPackage?.price ??
    l.leadingPrice ?? l.leading_price
  );
}

export function boostTier(l) {
  return num(
    l.boostPriority ?? l.boost_priority ?? l.boostTier ??
    l.boostPackage?.priority ?? l.boostPackage?.price ??
    l.boostPrice ?? l.boost_price
  );
}

// PRNG yenye seed (mulberry32) — matokeo ni thabiti ndani ya dirisha moja
function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(arr, rand) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Tier ya juu kwanza; ndani ya tier moja mpangilio unazunguka kwa haki.
export function rotateByTier(list, getTier, seed, limit = Infinity) {
  const groups = new Map();
  list.forEach((l) => {
    const t = getTier(l);
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t).push(l);
  });
  const rand = mulberry32(seed);
  const out = [];
  for (const t of Array.from(groups.keys()).sort((a, b) => b - a)) {
    out.push(...shuffled(groups.get(t), rand));
    if (out.length >= limit) break;
  }
  return out.slice(0, limit);
}

// Kwa kurasa za orodha (/mali-zote): leading kwanza (zinazunguka), kisha zingine mpya → za zamani.
export function rankListings(list, seed) {
  const leading = list.filter(isLeadingListing);
  const rest = list
    .filter((l) => !isLeadingListing(l))
    .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));
  return [...rotateByTier(leading, leadingTier, seed), ...rest];
}
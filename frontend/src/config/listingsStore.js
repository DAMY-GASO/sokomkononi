// ============================================================
// listingsStore.js
// CHANZO KIMOJA CHA UKWELI kwa Listings (mali/matangazo).
//
// Kabla ya hii, DashboardShell.jsx (My Listings ya muuzaji) ilikuwa na
// SEED_LISTINGS yake, na AdminDashboard.jsx (Listing & Ads Moderation)
// ilikuwa na INITIAL_LISTINGS TOFAUTI kabisa — hata tangazo lenye jina
// lilelile ("Kiwanja Ubungo") lilikuwa na status tofauti pande zote
// mbili (rejected upande wa Admin, in_review upande wa muuzaji). Sasa
// zote mbili zinasoma/kuandika hapa, kama ilivyo kwenye dealsStore.js.
//
// Hii ni demo ya front-end pekee — tunatumia localStorage + custom
// event kuiga "backend ya pamoja". Backend halisi ikiwepo, badilisha
// tu functions hizi ziite API; sehemu zinazotumia useListings() na
// updateListing() hazitahitaji kubadilika.
//
// STATUS VOCABULARY (canonical, kama ilivyotumika na MyListings.jsx):
//   in_review -> inasubiri uamuzi wa Admin (haijachapishwa)
//   live      -> imeidhinishwa na Admin, inaonekana hadharani
//   rejected  -> Admin amekataa tangazo hili
//   sold      -> mali imeuzwa (baada ya deal kukamilika)
//   expired   -> muda wa tangazo umeisha
// ============================================================

import { useEffect, useState } from "react";

const STORAGE_KEY = "sokomkononi_listings_v1";
const UPDATE_EVENT = "sokomkononi:listings-updated";

export const SEED_LISTINGS = [
  {
    id: "l1",
    title: "Nyumba ya Ghorofa Mbezi Beach",
    category: "nyumba",
    seller: "John Doe",
    price: 85000000,
    location: "Mbezi Beach, Dar es Salaam",
    region: "Dar es Salaam",
    status: "live",
    verified: true,
    postedAt: "2026-08-28T00:00:00.000Z",
    views: 214,
    inquiries: 6,
    boostTier: "featured",
    boostExpiresAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    bedrooms: 4,
    bathrooms: 3,
    area: "350 sqm",
    titleStatus: "Hati Miliki",
  },
  {
    id: "l2",
    title: "Toyota Harrier 2016",
    category: "magari",
    seller: "Jane Mushi",
    price: 42000000,
    location: "Kinondoni, Dar es Salaam",
    region: "Dar es Salaam",
    status: "live",
    verified: true,
    postedAt: "2026-09-09T00:00:00.000Z",
    views: 567,
    inquiries: 9,
    make: "Toyota",
    model: "Harrier",
    year: 2016,
    mileage: "85,000 km",
  },
  {
    id: "l3",
    title: "Kiwanja Ubungo — Hati Miliki",
    category: "viwanja",
    seller: "Mary Mwangi",
    price: 28000000,
    location: "Ubungo, Dar es Salaam",
    region: "Dar es Salaam",
    status: "in_review",
    verified: false,
    postedAt: "2026-09-08T00:00:00.000Z",
    views: 0,
    inquiries: 0,
    area: "600 sqm",
    titleStatus: "Hati Miliki",
  },
  {
    id: "l4",
    title: "Duka la Vifaa vya Ujenzi — Kariakoo",
    category: "biashara",
    seller: "John Doe",
    price: 15000000,
    location: "Kariakoo, Dar es Salaam",
    region: "Dar es Salaam",
    status: "sold",
    verified: true,
    postedAt: "2026-07-14T00:00:00.000Z",
    views: 389,
    inquiries: 11,
    type: "Duka",
  },
  {
    id: "l5",
    title: "Excavator CAT 320D",
    category: "mashine",
    seller: "John Doe",
    price: 120000000,
    location: "Chalinze, Pwani",
    region: "Pwani",
    status: "expired",
    verified: true,
    postedAt: "2026-06-02T00:00:00.000Z",
    views: 97,
    inquiries: 2,
    type: "Excavator",
    hours: "3,200 hrs",
  },
  // ------------------------------------------------------------
  // Zifuatazo zilikuwa SEED_PROPERTIES za ndani za BrowseProperties.jsx
  // (p6–p12) — hazikuwepo huku kabisa, ndiyo maana mnunuzi hakuweza
  // kamwe kuona listing mpya za muuzaji wala maamuzi ya Moderation.
  // Zimehamishiwa hapa kama listing "live" halisi.
  // ------------------------------------------------------------
  {
    id: "l6",
    title: "Apartment ya Kisasa Masaki",
    category: "nyumba",
    seller: "Amina Rashid",
    price: 150000000,
    location: "Masaki, Dar es Salaam",
    region: "Dar es Salaam",
    status: "live",
    verified: true,
    postedAt: "2026-08-25T00:00:00.000Z",
    views: 456,
    inquiries: 14,
    boostTier: "featured",
    boostExpiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    bedrooms: 3,
    bathrooms: 2,
    area: "180 sqm",
  },
  {
    id: "l7",
    title: "Nissan X-Trail 2015",
    category: "magari",
    seller: "Michael Kato",
    price: 28000000,
    location: "Mwanza",
    region: "Mwanza",
    status: "live",
    verified: false,
    postedAt: "2026-08-20T00:00:00.000Z",
    views: 234,
    inquiries: 3,
    make: "Nissan",
    model: "X-Trail",
    year: 2015,
    mileage: "120,000 km",
  },
  {
    id: "l8",
    title: "Shamba la Kilimo Kilosa",
    category: "viwanja",
    seller: "Peter Lema",
    price: 1500000,
    location: "Kilosa, Morogoro",
    region: "Morogoro",
    status: "live",
    verified: false,
    postedAt: "2026-08-25T00:00:00.000Z",
    views: 234,
    inquiries: 2,
    area: "5 ekari",
    titleStatus: "Hati ya Kimila",
  },
  {
    id: "l9",
    title: "Mgahawa wa Kisasa — Mikocheni",
    category: "biashara",
    seller: "Jane Mushi",
    price: 45000000,
    location: "Mikocheni, Dar es Salaam",
    region: "Dar es Salaam",
    status: "live",
    verified: true,
    postedAt: "2026-08-25T00:00:00.000Z",
    views: 567,
    inquiries: 19,
    boostTier: "featured",
    boostExpiresAt: new Date(Date.now() + 6 * 86400000).toISOString(),
    type: "Mgahawa",
  },
  {
    id: "l10",
    title: "Trekta la Kilimo John Deere",
    category: "mashine",
    seller: "Mary Mwangi",
    price: 68000000,
    location: "Mbeya",
    region: "Mbeya",
    status: "live",
    verified: true,
    postedAt: "2026-08-25T00:00:00.000Z",
    views: 345,
    inquiries: 5,
    type: "Trekta",
    hours: "1,500 hrs",
  },
  {
    id: "l11",
    title: "Nyumba ya Vyumba 3, Njiro",
    category: "nyumba",
    seller: "John Doe",
    price: 45000000,
    location: "Njiro, Arusha",
    region: "Arusha",
    status: "live",
    verified: true,
    postedAt: "2026-08-20T00:00:00.000Z",
    views: 178,
    inquiries: 4,
    bedrooms: 3,
    bathrooms: 2,
    area: "200 sqm",
  },
  {
    id: "l12",
    title: "Toyota Land Cruiser Prado 2018",
    category: "magari",
    seller: "Amina Rashid",
    price: 95000000,
    location: "Masaki, Dar es Salaam",
    region: "Dar es Salaam",
    status: "live",
    verified: true,
    postedAt: "2026-08-25T00:00:00.000Z",
    views: 892,
    inquiries: 27,
    boostTier: "featured",
    boostExpiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    make: "Toyota",
    model: "Prado",
    year: 2018,
    mileage: "45,000 km",
  },
];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_LISTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LISTINGS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_LISTINGS;
    return parsed;
  } catch {
    return SEED_LISTINGS;
  }
}

/** Soma listings za sasa (snapshot moja, si reactive). */
export function getListings() {
  return readFromStorage();
}

/** Andika orodha mpya kamili ya listings. */
export function saveListings(listings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/** Ongeza tangazo jipya (mf. kutoka PostPropertyForm). */
export function addListing(listing) {
  const current = getListings();
  const next = [listing, ...current];
  saveListings(next);
  return next;
}

/** Ondoa tangazo (mf. muuzaji akifuta). */
export function removeListing(id) {
  const current = getListings();
  const next = current.filter((l) => l.id !== id);
  saveListings(next);
  return next;
}

/** Badilisha (merge patch) tangazo moja tu kwa id yake. */
export function updateListing(id, patch) {
  const current = getListings();
  const next = current.map((l) => (l.id === id ? { ...l, ...patch } : l));
  saveListings(next);
  return next;
}

/**
 * Uamuzi wa Admin kwenye Moderation (Idhinisha / Kataa).
 * status: "live" | "rejected"
 */
export function decideListing(id, status) {
  return updateListing(id, { status });
}

/**
 * Hook ya React inayosoma listings na kujisasisha yenyewe — kwenye
 * DashboardShell (My Listings ya muuzaji), AdminDashboard (Listing &
 * Ads Moderation), na BrowseProperties (feed ya mnunuzi) papo hapo,
 * bila reload.
 */
export function useListings() {
  const [listings, setListings] = useState(() => getListings());

  useEffect(() => {
    const sync = () => setListings(getListings());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  return listings;
}

/**
 * Listing zinazoonekana hadharani kwa wanunuzi (BrowseProperties) —
 * zile pekee zilizoidhinishwa na Admin (status "live"). in_review,
 * rejected, sold, na expired hazionekani kwenye feed ya default.
 */
export function useLiveListings() {
  const listings = useListings();
  return listings.filter((l) => l.status === "live");
}

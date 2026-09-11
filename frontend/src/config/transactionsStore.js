// ============================================================
// transactionsStore.js
// CHANZO KIMOJA CHA UKWELI kwa transactions (My Transactions +
// Admin revenue analytics + overview aggregates).
//
// Kabla ya hii, DashboardShell ilikuwa na `useState(SEED_TRANSACTIONS)`
// ya ndani, na MyTransactionsPage ilikuwa na `SEED_TRANSACTIONS` yake
// TOFAUTI — Admin hakuweza kuona jumla halisi ya mapato, na miamala
// ilipotea kila refresh.
//
// Sasa: kila emitter ya malipo (Listing Fee, Boost, Leading,
// Advertisement, Reservation, Sale/Purchase) inaita `addTransaction()`
// hapa, na MyTransactionsPage/AdminDashboard/OverviewSection zote
// zinasoma kutoka hapa.
//
// TYPES (canonical, zinalingana na Muongozo §6):
//   listing_fee | reservation | boost | leading | advertisement | sale | purchase
// ============================================================

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "sokomkononi_transactions_v1";
const UPDATE_EVENT = "sokomkononi:transactions-updated";

// Seeding kwa demo — miamala ya mwanzo ili dashboard isiwe tupu.
export const SEED_TRANSACTIONS = [
  {
    id: "t1",
    ref: "SM-2026-0001",
    type: "listing_fee",
    title: "Listing Fee — Nyumba ya Ghorofa Mbezi Beach",
    property: "Nyumba ya Ghorofa Mbezi Beach",
    amount: 300000,
    status: "completed",
    method: "M-Pesa",
    at: "2026-08-28T10:00:00.000Z",
  },
  {
    id: "t2",
    ref: "SM-2026-0002",
    type: "boost",
    title: "Featured Boost — Nyumba ya Ghorofa Mbezi Beach",
    property: "Nyumba ya Ghorofa Mbezi Beach",
    amount: 12000,
    status: "completed",
    method: "Tigo Pesa",
    at: "2026-09-01T14:30:00.000Z",
  },
  {
    id: "t3",
    ref: "SM-2026-0003",
    type: "listing_fee",
    title: "Listing Fee — Toyota Harrier 2016",
    property: "Toyota Harrier 2016",
    amount: 150000,
    status: "pending",
    method: "Airtel Money",
    at: "2026-09-07T09:15:00.000Z",
  },
  {
    id: "t4",
    ref: "SM-2026-0004",
    type: "sale",
    title: "Mauzo — Duka la Vifaa vya Ujenzi Kariakoo",
    property: "Duka la Vifaa vya Ujenzi — Kariakoo",
    amount: 14200000,
    status: "completed",
    method: "Benki (CRDB)",
    at: "2026-08-15T16:00:00.000Z",
  },
  {
    id: "t5",
    ref: "SM-2026-0005",
    type: "reservation",
    title: "Reservation Fee — Kiwanja Ubungo",
    property: "Kiwanja Ubungo — Hati Miliki",
    amount: 50000,
    status: "completed",
    method: "HaloPesa",
    at: "2026-09-05T11:00:00.000Z",
  },
];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_TRANSACTIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_TRANSACTIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_TRANSACTIONS;
    return parsed;
  } catch {
    return SEED_TRANSACTIONS;
  }
}

export function getTransactions() {
  return readFromStorage();
}

export function saveTransactions(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function addTransaction(txn) {
  const next = [
    {
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ref: txn.ref || `SM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      at: new Date().toISOString(),
      ...txn,
    },
    ...getTransactions(),
  ];
  saveTransactions(next);
  return next;
}

export function useTransactions() {
  const [list, setList] = useState(() => getTransactions());
  useEffect(() => {
    const sync = () => setList(getTransactions());
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);
  return list;
}

/**
 * Aggregates kwa Admin Overview:
 *   - revenue: jumla ya fee types zote (listing_fee, reservation, boost,
 *     leading, advertisement) zilizolipwa + sale zote (kama revenue pia,
 *     kwa sababu SokoMkononi inahesabu "sale completed" kama txn ya user,
 *     ila kwa Admin revenue halisi ni FEE pekee — hapa tunachukua fee
 *     types tu kama revenue ya platform)
 *   - spent: user ame-lipa nini (kwa MyTransactions summary)
 *   - earned: user amepokea nini (sale)
 *   - totalCount: idadi ya miamala yote
 */
export function useMyTransactionsAggregate() {
  const list = useTransactions();
  return useMemo(() => {
    const FEE_TYPES = ["listing_fee", "reservation", "boost", "leading", "advertisement"];
    const revenue = list
      .filter((t) => t.status === "completed" && FEE_TYPES.includes(t.type))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const spent = list
      .filter((t) => t.status === "completed" && FEE_TYPES.includes(t.type))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const earned = list
      .filter((t) => t.status === "completed" && t.type === "sale")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { revenue, spent, earned, totalCount: list.length };
  }, [list]);
}

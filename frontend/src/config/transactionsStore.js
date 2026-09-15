// ============================================================
// transactionsStore.js
// CHANZO KIMOJA CHA UKWELI kwa transactions (My Transactions +
// Admin revenue analytics + overview aggregates).
//
// Kama stores nyingine — demo ya front-end pekee, localStorage +
// custom event. Backend halisi ikiwepo, badilisha functions hizi
// ziite API; hooks (useTransactions) hazitahitaji kubadilika.
//
// TYPES (canonical, zinalingana na Muongozo §6):
//   listing_fee | reservation | boost | leading | advertisement | sale | purchase
// ============================================================

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "sokomkononi_transactions_v1";
const UPDATE_EVENT = "sokomkononi:transactions-updated";

// ============================================================
// SEED_TRANSACTIONS — tupu. Data itakuja kutoka backend baadaye.
// ============================================================
export const SEED_TRANSACTIONS = [];

function readFromStorage() {
  if (typeof window === "undefined") return SEED_TRANSACTIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_TRANSACTIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_TRANSACTIONS;
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
  const entry = {
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ref: txn.ref || `SM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    at: new Date().toISOString(),
    ...txn,
  };
  const next = [entry, ...getTransactions()];
  saveTransactions(next);

  // TAHADHARI: "sale"/"purchase" HAZINA notify hapa kwa makusudi —
  // huja pekee kutoka DealRooms.handleProofConfirm(), ambayo tayari
  // inaita updateDeal(id, { status: "completed" }) kabla ya hapa;
  // dealsStore.js inatuma notifyDealCompleted kwa tukio hilohilo.
  // Kutuma taarifa hapa pia kungerudia (double notification).
  // notifyPaymentConfirmed() inabaki kwenye notificationsStore.js
  // endapo itahitajika kwa njia nyingine ya malipo isiyopitia deal.

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
 * Aggregates kwa Admin Overview.
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

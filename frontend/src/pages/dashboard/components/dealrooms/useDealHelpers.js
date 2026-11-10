import { callApiOrFallback } from "./apiHelpers.js";
import { createTransactionAsync } from "../../../../config/transactionsStore.js";
import { dealsApi } from "../../../../api/deals.js";
import {
  fetchDealDetailAsync,
  updateDeal as updateDealInStore,
} from "../../../../config/dealsStore.js";
import { mergeServerDeal } from "./messageHelpers.js";

export function useDealHelpers({
  deals,
  setOfflineMode,
  setTransactionIds,
  transactionIds,
  updateDeal,
}) {
  // Tafuta transaction id bila kuunda mpya. Seller mara nyingi hana
  // `transactionId` kwenye deal iliyohifadhiwa, kwa hiyo tunaiuliza seva.
  const resolveTxId = async (deal) => {
    let txId = transactionIds[deal.id] || deal.transactionId;
    if (txId) return txId;
    const roomId = deal.dealRoomId || deal.id;
    const remember = (v) => {
      if (!v) return null;
      setTransactionIds((prev) => ({ ...prev, [deal.id]: v }));
      updateDeal(deal.id, { transactionId: v });
      return v;
    };
    try {
      const d = await dealsApi.detail(roomId);
      const t =
        d?.transaction_id ??
        d?.transaction?.id ??
        (typeof d?.transaction === "number" ||
        typeof d?.transaction === "string"
          ? d.transaction
          : null);
      if (remember(t)) return t;
    } catch {
      /* noop */
    }
    try {
      if (typeof dealsApi.paymentProof === "function") {
        const pp = await dealsApi.paymentProof(roomId);
        if (remember(pp?.id)) return pp.id;
      }
    } catch {
      /* noop */
    }
    return null;
  };

  const ensureTransactionId = async (deal) => {
    let txId = transactionIds[deal.id] || deal.transactionId;
    if (txId) return txId;

    const res = await callApiOrFallback(() =>
      createTransactionAsync(deal.dealRoomId || deal.id),
    );
    if (res.offline) {
      setOfflineMode(true);
      return null;
    }

    if (!res.ok) {
      const errMsg = String(
        res.error?.message || res.error?.data?.detail || "",
      );
      const isAlreadyCreated =
        errMsg.toLowerCase().includes("tayari imeundwa") ||
        errMsg.toLowerCase().includes("already") ||
        res.error?.status === 400;

      if (isAlreadyCreated) {
        try {
          const detailRes = await dealsApi.detail(deal.dealRoomId || deal.id);
          const existingTxId =
            detailRes?.transaction_id ?? detailRes?.transaction?.id;
          if (existingTxId) {
            setTransactionIds((prev) => ({
              ...prev,
              [deal.id]: existingTxId,
            }));
            updateDeal(deal.id, { transactionId: existingTxId });
            return existingTxId;
          }
        } catch {
          /* noop */
        }
      }
      return null;
    }

    txId = res.transaction?.id;
    if (txId) {
      setTransactionIds((prev) => ({ ...prev, [deal.id]: txId }));
    }
    return txId;
  };

  // Vuta ujumbe wa mfumo (SYSTEM) kutoka seva baada ya hatua kubadilika
  const refreshDeal = async (id) => {
    const d = deals.find((x) => String(x.id) === String(id));
    if (!d) return;
    try {
      const res = await fetchDealDetailAsync(d.dealRoomId || d.id);
      if (res?.ok && res.deal) {
        updateDealInStore(id, (prev) => mergeServerDeal(prev, res.deal));
      }
    } catch {
      /* noop */
    }
  };

  return { resolveTxId, ensureTransactionId, refreshDeal };
}

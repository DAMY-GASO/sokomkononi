import { callApiOrFallback } from "./apiHelpers.js";
import {
  cancelTransactionAsync,
  submitDecisionAsync,
} from "../../../../config/transactionsStore.js";
import { dealsApi } from "../../../../api/deals.js";

export function useInspectionActions({
  deals,
  lang,
  refreshDeal,
  setTransactionIds,
  transactionIds,
  updateDeal,
}) {
  const handleInspectionResolve = async (id, outcome, note) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;

    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kuchukua hatua."
          : "Room is suspended — you cannot take action.",
      );
      return;
    }

    let txId = transactionIds[id] || deal.transactionId;

    if (!txId) {
      try {
        const detailRes = await dealsApi.detail(deal.dealRoomId || deal.id);
        txId = detailRes?.transaction_id ?? detailRes?.transaction?.id;
        if (txId) {
          setTransactionIds((prev) => ({ ...prev, [id]: txId }));
          updateDeal(id, { transactionId: txId });
        }
      } catch {
        /* noop */
      }
    }

    if (!txId) {
      alert(
        lang === "sw"
          ? "Transaction haipatikani kwa deal hii."
          : "Transaction not found for this deal.",
      );
      return;
    }

    let apiRes;
    if (outcome === "READY_FOR_FINAL_PAYMENT") {
      apiRes = await callApiOrFallback(() =>
        submitDecisionAsync(txId, {
          buyerDecision: "ACCEPT",
          buyerDecisionNote: note || "",
        }),
      );
    } else if (outcome === "REQUEST_NEGOTIATION") {
      apiRes = await callApiOrFallback(() =>
        submitDecisionAsync(txId, {
          buyerDecision: "REQUEST_NEGOTIATION",
          buyerDecisionNote: note || "",
        }),
      );
    } else if (outcome === "NOT_AS_DESCRIBED") {
      apiRes = await callApiOrFallback(() =>
        submitDecisionAsync(txId, {
          buyerDecision: "REJECT",
          buyerDecisionNote: note || "",
        }),
      );
    } else if (outcome === "CANCEL") {
      apiRes = await callApiOrFallback(() =>
        cancelTransactionAsync(txId, note || ""),
      );
    }

    if (apiRes && !apiRes.offline && !apiRes.ok) {
      alert(
        apiRes.error?.message ||
          (lang === "sw" ? "Imeshindwa kusasisha." : "Failed to update."),
      );
      return;
    }

    const baseNote =
      {
        READY_FOR_FINAL_PAYMENT:
          lang === "sw"
            ? "Mnunuzi ameridhika na ukaguzi — tayari kwa malipo ya mwisho."
            : "Buyer is satisfied with the inspection — ready for final payment.",
        REQUEST_NEGOTIATION:
          lang === "sw"
            ? "Mnunuzi ameomba negotiation nyingine baada ya ukaguzi."
            : "Buyer requested another negotiation after inspection.",
        NOT_AS_DESCRIBED:
          lang === "sw"
            ? "Mnunuzi ameripoti: bidhaa/mali sio kama ilivyoelezwa."
            : "Buyer reported: the property is not as described.",
        CANCEL:
          lang === "sw"
            ? "Mnunuzi ameghairi deal baada ya ukaguzi."
            : "Buyer cancelled the deal after inspection.",
      }[outcome] || "";

    const fullNote = note
      ? `${baseNote} ${lang === "sw" ? "Sababu" : "Reason"}: ${note}`
      : baseNote;

    // Mtandaoni: seva inaunda ujumbe wa SYSTEM. Ujumbe wa ndani ni wa offline tu.
    const localMessages = apiRes?.offline
      ? {
          messages: [
            ...deal.messages,
            {
              id: `m_${Date.now()}`,
              sender: "me",
              kind: "USER",
              isHidden: false,
              text: fullNote,
              at: new Date().toISOString(),
            },
          ],
        }
      : {};

    if (outcome === "READY_FOR_FINAL_PAYMENT") {
      updateDeal(id, {
        status: "awaiting_final_payment",
        ...localMessages,
      });
    } else if (outcome === "REQUEST_NEGOTIATION") {
      updateDeal(id, {
        status: "disputed",
        disputeNote: note,
        ...localMessages,
      });
    } else if (outcome === "NOT_AS_DESCRIBED") {
      updateDeal(id, {
        status: "disputed",
        disputeNote: note,
        ...localMessages,
      });
    } else if (outcome === "CANCEL") {
      updateDeal(id, {
        status: "cancelled",
        cancelNote: note,
        ...localMessages,
      });
    }
    await refreshDeal(id);
  };

  return { handleInspectionResolve };
}

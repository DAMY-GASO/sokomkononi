import { callApiOrFallback } from "./apiHelpers.js";
import {
  confirmPaymentAsync,
  uploadFinalPaymentAsync,
} from "../../../../config/transactionsStore.js";
import { transactionsApi } from "../../../../api/transactions.js";

export function usePaymentProofActions({
  deals,
  lang,
  onFinalPaymentConfirmed,
  refreshDeal,
  resolveTxId,
  side,
  updateDeal,
}) {
  const handleProofSubmit = async (id, proof) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;
    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kupakia uthibitisho."
          : "Room is suspended — cannot upload proof.",
      );
      return;
    }
    const txId = await resolveTxId(deal);
    if (!txId) {
      alert(
        lang === "sw"
          ? "Muamala haujapatikana. Fungua upya ukurasa kisha jaribu tena."
          : "Transaction not found. Reload the page and try again.",
      );
      return;
    }

    try {
      const apiRes = await uploadFinalPaymentAsync(txId, {
        finalPaymentProof: proof.file,
        finalPaymentReference: proof.reference,
      });
      if (apiRes && apiRes.ok === false) {
        alert(
          apiRes.error?.message ||
            (lang === "sw"
              ? "Imeshindwa kupakia uthibitisho."
              : "Failed to upload proof."),
        );
        return;
      }
    } catch (err) {
      alert(
        err?.message ||
          (lang === "sw"
            ? "Imeshindwa kupakia uthibitisho."
            : "Failed to upload proof."),
      );
      return;
    }

    updateDeal(id, {
      status: "payment_proof_submitted",
      paymentProof: {
        reference: proof.reference,
        dataUrl: proof.dataUrl || null,
        submittedAt: new Date().toISOString(),
      },
    });
    await refreshDeal(id);
  };

  const handleProofConfirm = async (id) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;
    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kuthibitisha malipo."
          : "Room is suspended — cannot confirm payment.",
      );
      return;
    }
    const txId = await resolveTxId(deal);
    if (!txId) {
      alert(
        lang === "sw"
          ? "Muamala haujapatikana. Fungua upya ukurasa kisha jaribu tena."
          : "Transaction not found. Reload the page and try again.",
      );
      return;
    }

    const apiRes = await callApiOrFallback(() => confirmPaymentAsync(txId, ""));
    if (!apiRes.offline && !apiRes.ok) {
      alert(
        apiRes.error?.message ||
          (lang === "sw"
            ? "Imeshindwa kuthibitisha malipo."
            : "Failed to confirm payment."),
      );
      return;
    }

    updateDeal(id, { status: "completed" });
    await refreshDeal(id);

    onFinalPaymentConfirmed?.(deal, side, {
      method: "",
      reference: deal.paymentProof?.reference,
    });
  };

  const handleProofReject = async (id, reason) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;
    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kutuma."
          : "Room is suspended — cannot send.",
      );
      return;
    }
    const txId = await resolveTxId(deal);
    if (!txId) {
      alert(
        lang === "sw"
          ? "Muamala haujapatikana. Fungua upya ukurasa kisha jaribu tena."
          : "Transaction not found. Reload the page and try again.",
      );
      return;
    }

    try {
      await transactionsApi.rejectPaymentProof(txId, reason || "");
    } catch (err) {
      alert(
        err?.message ||
          (lang === "sw" ? "Imeshindwa kutuma." : "Failed to send."),
      );
      return;
    }

    updateDeal(id, {
      status: "awaiting_final_payment",
      paymentProof: null,
    });
    await refreshDeal(id);
  };

  return { handleProofSubmit, handleProofConfirm, handleProofReject };
}

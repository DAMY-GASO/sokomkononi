import {
  TX_STATUS,
  createReservationAsync,
  payReservationAsync,
  pollReservationStatusAsync,
} from "../../../../config/transactionsStore.js";
import { callApiOrFallback } from "./apiHelpers.js";
import { isBankMethod, isMobileMoneyMethod } from "./paymentInputHelpers.js";

export function useReservationActions({
  deals,
  detailError,
  ensureTransactionId,
  lang,
  onReservationPaid,
  refreshDeal,
  transactionIds,
  updateDeal,
}) {
  const finalizeLocalReservation = (
    id,
    deal,
    { hours, fee, method, expiresAt },
  ) => {
    const nowExpiresAt =
      expiresAt || new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    updateDeal(id, {
      status: "reserved",
      transactionId: deal.transactionId || transactionIds[id] || null,
      reservationHours: hours,
      reservationFee: fee,
      reservationMethod: method,
      reservationExpiresAt: nowExpiresAt,
      reservationPaidAt: new Date().toISOString(),
      pendingPayment: null,
    });

    refreshDeal(id);

    onReservationPaid?.(deal, {
      hours,
      fee,
      method,
      expiresAt: nowExpiresAt,
    });
  };

  const handleReserveConfirm = async (
    id,
    { hours, fee, method, phone, cardNumber },
  ) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return { ok: false, error: new Error("Deal haipo") };

    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kureserve kwa sasa."
          : "Room is suspended — cannot reserve right now.",
      );
      return { ok: false };
    }

    if (detailError[id] === "not_found") {
      alert(
        lang === "sw"
          ? "Deal hii haipo kwenye mfumo. Tafadhali refresh ukurasa."
          : "This deal no longer exists. Please refresh the page.",
      );
      return { ok: false };
    }

    let txId = deal.transactionId;
    if (!txId) txId = await ensureTransactionId(deal);

    if (!txId) {
      alert(
        lang === "sw"
          ? "Imeshindwa kuunda transaction. Jaribu tena."
          : "Failed to create transaction. Please try again.",
      );
      return { ok: false };
    }

    if (method === "credits") {
      try {
        const payRes = await callApiOrFallback(() =>
          payReservationAsync(txId, { paymentReference: "credits" }),
        );
        if (!payRes.offline && !payRes.ok) {
          alert(
            payRes.error?.message ||
              (lang === "sw"
                ? "Imeshindwa kutumia credit."
                : "Failed to use credit."),
          );
          return { ok: false };
        }
        const expiresAt =
          payRes.transaction?.reservationExpiresAt ||
          new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        finalizeLocalReservation(id, deal, {
          hours,
          fee: 0,
          method: "credits",
          expiresAt,
        });
        return { ok: true };
      } catch (err) {
        alert(
          err?.message ||
            (lang === "sw"
              ? "Imeshindwa kutumia credit."
              : "Failed to use credit."),
        );
        return { ok: false };
      }
    }

    const reserveRes = await callApiOrFallback(() =>
      createReservationAsync(txId, hours),
    );
    if (reserveRes.offline) {
      alert(
        lang === "sw"
          ? "Backend haipatikani. Jaribu tena baadaye."
          : "Backend unavailable. Try again later.",
      );
      return { ok: false };
    }
    if (!reserveRes.ok) {
      alert(
        reserveRes.error?.message ||
          (lang === "sw"
            ? "Imeshindwa kuweka reservation."
            : "Failed to create reservation."),
      );
      return { ok: false };
    }

    const activatedStatus = reserveRes.transaction?.status;
    if (activatedStatus === TX_STATUS.RESERVED_PAID) {
      const expiresAt =
        reserveRes.transaction.reservationExpiresAt ||
        new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      finalizeLocalReservation(id, deal, {
        hours,
        fee: 0,
        method: "free",
        expiresAt,
      });
      return { ok: true };
    }

    const isMobile = isMobileMoneyMethod(method);
    const isBank = isBankMethod(method);
    const paymentMethodKey = isBank ? "card" : isMobile ? "mobile" : "";

    const payRes = await callApiOrFallback(() =>
      payReservationAsync(txId, {
        paymentReference: null,
        paymentMethod: paymentMethodKey,
        phone: isMobile ? phone || "" : "",
      }),
    );

    if (!payRes.offline && !payRes.ok) {
      alert(
        payRes.error?.message ||
          (lang === "sw"
            ? "Imeshindwa kulipa reservation."
            : "Failed to pay reservation."),
      );
      return { ok: false };
    }

    if (payRes.pending) {
      updateDeal(id, {
        status: "accepted",
        pendingPayment: {
          orderId: payRes.orderId,
          reference: payRes.reference,
          checkoutUrl: payRes.checkoutUrl,
          amount: fee,
          method,
        },
        messages: [
          ...deal.messages,
          {
            id: `m_${Date.now()}`,
            sender: "me",
            kind: "USER",
            isHidden: false,
            text:
              lang === "sw"
                ? `Malipo ya Reservation yameanzishwa (${method}). Kumbukumbu: ${payRes.reference}. Tafadhali kamilisha malipo.`
                : `Reservation payment initiated (${method}). Reference: ${payRes.reference}. Please complete payment.`,
            at: new Date().toISOString(),
          },
        ],
      });

      if (payRes.checkoutUrl) {
        try {
          window.open(payRes.checkoutUrl, "_blank", "noopener,noreferrer");
        } catch {
          /* noop */
        }
      }

      const pollRes = await pollReservationStatusAsync(txId, {
        attempts: 15,
        intervalMs: 4000,
      });

      if (pollRes.ok) {
        const expiresAt = pollRes.transaction.reservationExpiresAt || null;
        finalizeLocalReservation(id, deal, {
          hours,
          fee,
          method,
          expiresAt,
        });
        return { ok: true };
      } else {
        alert(
          lang === "sw"
            ? "Malipo bado hayajathibitishwa. Angalia 'My Transactions' baadaye."
            : "Payment is not yet confirmed. Please check 'My Transactions' shortly.",
        );
        return { ok: false };
      }
    }

    const expiresAt =
      payRes.transaction?.reservationExpiresAt ||
      new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    finalizeLocalReservation(id, deal, {
      hours,
      fee,
      method,
      expiresAt,
    });
    return { ok: true };
  };

  return { handleReserveConfirm };
}

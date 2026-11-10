import {
  acceptOfferAsync,
  fetchDealDetailAsync,
  sendOfferAsync,
  updateDeal as updateDealInStore,
} from "../../../../config/dealsStore.js";
import { dealsApi } from "../../../../api/deals.js";
import { formatTZS } from "../shared";
import { reopenDealRoom } from "../../../../api/dealReopen.js";

export function useOfferActions({ deals, lang, updateDeal, user }) {
  const handleSendOffer = async (id, amount) => {
    const deal = deals.find((d) => d.id === id);
    if (deal?.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kutuma ofa."
          : "Room is suspended — you cannot send offers.",
      );
      return;
    }
    const res = await sendOfferAsync(id, amount, "", null, user?.id);
    if (!res.ok) {
      alert(
        res.error?.message ||
          (lang === "sw"
            ? "Imeshindwa kutuma ofa. Jaribu tena."
            : "Failed to send offer. Try again."),
      );
    }
  };

  const handleRespond = async (id, newStatus) => {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;

    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa — huwezi kukubali/kukataa ofa."
          : "Room is suspended — you cannot accept/decline offers.",
      );
      return;
    }

    const lastOffer = [...(deal.messages || [])]
      .reverse()
      .find(
        (m) =>
          m.offerAmount &&
          !["declined", "rejected", "cancelled"].includes(
            String(m.status || "").toLowerCase(),
          ),
      );
    if (!lastOffer || lastOffer.sender === "me") return;

    if (newStatus === "accepted") {
      const res = await acceptOfferAsync(id, lastOffer.id, user?.id);
      if (!res.ok) {
        alert(
          res.error?.message ||
            (lang === "sw"
              ? "Imeshindwa kukubali ofa."
              : "Failed to accept offer."),
        );
      }
      return;
    }

    if (newStatus === "declined") {
      const roomId = deal.dealRoomId || deal.id;
      updateDeal(id, (prev) => ({
        ...prev,
        currentOffer: 0,
        messages: (prev.messages || []).map((m) =>
          String(m.id) === String(lastOffer.id)
            ? { ...m, status: "declined" }
            : m,
        ),
      }));
      try {
        try {
          await dealsApi.declineOffer(roomId, lastOffer.id);
        } catch (declineErr) {
          if (declineErr?.status !== 404 && declineErr?.status !== 501) {
            throw declineErr;
          }
        }
        await dealsApi.sendDealMessage(roomId, {
          text:
            lang === "sw"
              ? `Ofa ya ${formatTZS(lastOffer.offerAmount)} ilikataliwa.`
              : `The offer of ${formatTZS(
                  lastOffer.offerAmount,
                )} was declined.`,
        });
      } catch {
        /* noop */
      }
    }
  };

  const handleReopen = async (id) => {
    const deal = deals.find((d) => String(d.id) === String(id));
    if (!deal) return { ok: false };

    if (deal.cancelledByAdmin) {
      return {
        ok: false,
        error: new Error(
          lang === "sw"
            ? "Deal hii ilighairiwa na msimamizi — haiwezi kufufuliwa."
            : "This deal was cancelled by admin — cannot be reopened.",
        ),
      };
    }

    if (deal.adminLocked) {
      return {
        ok: false,
        error: new Error(
          lang === "sw"
            ? "Room imesimamishwa na msimamizi — haiwezi kufufuliwa kwa sasa."
            : "Room is suspended by admin — cannot be reopened right now.",
        ),
      };
    }

    const roomId = deal.dealRoomId || deal.id;
    try {
      await reopenDealRoom(roomId);
      const detail = await fetchDealDetailAsync(roomId);
      if (detail?.ok && detail.deal) {
        updateDealInStore(id, detail.deal);
      } else {
        updateDealInStore(id, (prev) => ({
          ...prev,
          status: "negotiating",
          currentOffer: 0,
        }));
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  return { handleSendOffer, handleRespond, handleReopen };
}

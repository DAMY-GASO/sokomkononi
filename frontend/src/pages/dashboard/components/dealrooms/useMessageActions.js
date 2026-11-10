import { dealsApi } from "../../../../api/deals.js";
import {
  fetchDealDetailAsync,
  updateDeal as updateDealInStore,
} from "../../../../config/dealsStore.js";
import { mergeServerDeal } from "./messageHelpers.js";

export function useMessageActions({ deals, lang, sendingRef, updateDeal }) {
  const handleSendMessage = async (id, text, file = null) => {
    const deal = deals.find((d) => String(d.id) === String(id));
    if (!deal) return;

    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa na msimamizi — huwezi kutuma ujumbe."
          : "Room is suspended by admin — you cannot send messages.",
      );
      return;
    }

    const tempId = `m_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: "me",
      text,
      imageUrl: file ? URL.createObjectURL(file) : null,
      attachmentFile: file || null,
      kind: "USER",
      isHidden: false,
      sendStatus: "sending",
      at: new Date().toISOString(),
    };
    updateDeal(id, (prev) => ({
      ...prev,
      messages: [...(prev.messages || []), optimisticMsg],
    }));

    await deliverMessage(deal, id, tempId, text, optimisticMsg);
  };

  // Hutuma ujumbe kwa seva na kusasisha hali yake (sending → sent / failed).
  const deliverMessage = async (deal, id, tempId, text, optimisticMsg) => {
    sendingRef.current += 1;
    try {
      let payload = { text };
      if (optimisticMsg?.attachmentFile) {
        payload = new FormData();
        payload.append("text", text || "");
        payload.append("attachment", optimisticMsg.attachmentFile);
      }
      const res = await dealsApi.sendDealMessage(
        deal.dealRoomId || deal.id,
        payload,
      );
      updateDeal(id, (prev) => {
        const list = prev.messages || [];
        const serverId = res?.id;
        const serverAt = res?.created_at;
        // Kawaida: badilisha ujumbe wa muda na wa seva
        if (list.some((m) => m.id === tempId)) {
          return {
            ...prev,
            messages: list.map((m) =>
              m.id === tempId
                ? {
                    ...m,
                    id: serverId ?? m.id,
                    at: serverAt || m.at,
                    imageUrl: res?.attachment_url || m.imageUrl || null,
                    attachmentFile: null,
                    sendStatus: "sent",
                  }
                : m,
            ),
          };
        }
        // Polling ilishaleta ujumbe huu — usiurudie
        if (
          serverId != null &&
          list.some((m) => String(m.id) === String(serverId))
        ) {
          return prev;
        }
        // Polling ilifuta ujumbe wa muda — urudishe wa seva
        return {
          ...prev,
          messages: [
            ...list,
            {
              ...optimisticMsg,
              id: serverId ?? tempId,
              at: serverAt || optimisticMsg.at,
              sendStatus: "sent",
            },
          ],
        };
      });
    } catch (err) {
      // Usiufute — uonyeshwe "Haikutumwa" na kitufe cha Jaribu tena
      updateDeal(id, (prev) => ({
        ...prev,
        messages: (prev.messages || []).map((m) =>
          m.id === tempId ? { ...m, sendStatus: "failed" } : m,
        ),
      }));
      // Admin amesimamisha room wakati mtumiaji yuko ndani — sasisha UI sasa
      if (err?.data?.code === "DEAL_LOCKED" || err?.code === "DEAL_LOCKED") {
        fetchDealDetailAsync(deal.dealRoomId || deal.id)
          .then((r) => {
            if (r?.ok && r.deal)
              updateDealInStore(id, (prev) => mergeServerDeal(prev, r.deal));
          })
          .catch(() => {});
        alert(
          err?.data?.detail ||
            err?.message ||
            (lang === "sw"
              ? "Room imesimamishwa na msimamizi."
              : "Room is suspended by admin."),
        );
      }
    } finally {
      sendingRef.current = Math.max(0, sendingRef.current - 1);
    }
  };

  const handleRetryMessage = async (id, msgId) => {
    const deal = deals.find((d) => String(d.id) === String(id));
    if (!deal) return;
    const failed = (deal.messages || []).find(
      (m) => String(m.id) === String(msgId) && m.sendStatus === "failed",
    );
    if (!failed) return;

    // Faili la picha halihifadhiwi kwenye localStorage: baada ya refresh
    // lingetumwa ujumbe bila picha huku likionekana limefanikiwa.
    if (failed.imageUrl && !(failed.attachmentFile instanceof File)) {
      updateDeal(id, (prev) => ({
        ...prev,
        messages: (prev.messages || []).filter((m) => m.id !== failed.id),
      }));
      alert(
        lang === "sw"
          ? "Picha haipo tena kwenye kifaa. Tafadhali ichague upya kisha utume."
          : "The image is no longer available. Please select it again and resend.",
      );
      return;
    }

    if (deal.adminLocked) {
      alert(
        lang === "sw"
          ? "Room imesimamishwa na msimamizi — huwezi kutuma ujumbe."
          : "Room is suspended by admin — you cannot send messages.",
      );
      return;
    }

    const retried = { ...failed, sendStatus: "sending" };
    updateDeal(id, (prev) => ({
      ...prev,
      messages: (prev.messages || []).map((m) =>
        m.id === failed.id ? retried : m,
      ),
    }));
    await deliverMessage(deal, id, failed.id, failed.text, retried);
  };

  return { handleSendMessage, handleRetryMessage };
}

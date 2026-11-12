// ============================================================
// src/pages/dashboard/components/DealRooms.jsx
//
// Marekebisho:
//  ✅ MPYA: prop `openReserveModalOnMount` — inatumwa kwa DealDetail
//     wakati `?action=reserve` ipo kwenye URL (kutoka WaitingListPage).
//  ✅ MPYA: WebSocket client kwa updates za papo hapo (badala ya polling).
//  ✅ MPYA: typing indicator — inaonyesha "mtumiaji anaandika…".
//  ✅ MPYA: WebSocketStatusBadge — inaonyesha hali ya muunganisho.
//  ✅ MPYA: broadcast payload inatumiwa moja kwa moja kwa message/offer;
//     `deal_update` pekee inaita `fetchDealDetailAsync`.
//  ✅ MPYA: unread count kwa kila chumba + browser notification.
// ============================================================
import React, { useEffect, useRef, useState, useCallback } from "react";
import { COLORS } from "./shared";
import DealDetail from "./dealrooms/DealDetail.jsx";
import DealListItem from "./dealrooms/DealListItem.jsx";
import ReservationSuccessModal from "./dealrooms/ReservationSuccessModal.jsx";
import WebSocketStatusBadge from "./dealrooms/WebSocketStatusBadge.jsx";
import { dealsApi } from "../../../api/deals.js";
import {
  fetchDealDetailAsync,
  updateDeal as updateDealInStore,
  useDeals,
} from "../../../config/dealsStore.js";
import { mergeServerDeal } from "./dealrooms/messageHelpers.js";
import { useAuth } from "../../../config/authStore.js";
import { useDealHelpers } from "./dealrooms/useDealHelpers.js";
import { useDealWebSocket } from "./dealrooms/useDealWebSocket.js";
import { useInspectionActions } from "./dealrooms/useInspectionActions.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useMessageActions } from "./dealrooms/useMessageActions.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOfferActions } from "./dealrooms/useOfferActions.js";
import { usePaymentProofActions } from "./dealrooms/usePaymentProofActions.js";
import { useReservationActions } from "./dealrooms/useReservationActions.js";

export default function DealRooms({
  side = "seller",
  initialDealId = null,
  onReservationPaid,
  onFinalPaymentConfirmed,
}) {
  const { user } = useAuth();
  const deals = useDeals(user?.id, side);
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(initialDealId);
  const [mobileShowDetail, setMobileShowDetail] = useState(
    Boolean(initialDealId),
  );
  const [transactionIds, setTransactionIds] = useState({});
  const [offlineMode, setOfflineMode] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [openReserveOnMount, setOpenReserveOnMount] = useState(false);

  // ── WebSocket state ──
  const token = localStorage.getItem("sokomkononi_access");
  const [typingByRoom, setTypingByRoom] = useState({});
  const typingTimeoutRef = useRef({});

  // ── Unread + notifications ──
  const [unreadByRoom, setUnreadByRoom] = useState({});
  const notificationPermissionRef = useRef(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  const listingIdParam = searchParams.get("listing");
  const actionParam = searchParams.get("action");

  useEffect(() => {
    if (initialDealId) {
      setSelectedId(initialDealId);
      setMobileShowDetail(true);
    }
  }, [initialDealId]);

  useEffect(() => {
    if (actionParam !== "reserve" || !listingIdParam) return;
    const targetDeal = deals.find(
      (d) => String(d.listingId) === String(listingIdParam),
    );
    if (targetDeal) {
      setSelectedId(targetDeal.id);
      setMobileShowDetail(true);
      setOpenReserveOnMount(true);
    }
  }, [deals, actionParam, listingIdParam]);

  const selectedDeal =
    deals.find((d) => String(d.id) === String(selectedId)) || deals[0];
  const updateDeal = (id, patchOrUpdater) => {
    updateDealInStore(id, patchOrUpdater);
  };
  const handleSelect = (id) => {
    setSelectedId(id);
    setMobileShowDetail(true);
    setOpenReserveOnMount(false);
    // ✅ futa unread kwa chumba hiki
    setUnreadByRoom((prev) => ({ ...prev, [id]: 0 }));
  };

  const [detailFetchedAt, setDetailFetchedAt] = useState({});
  const [detailError, setDetailError] = useState({});
  const sendingRef = useRef(0);

  useEffect(() => {
    if (!selectedDeal?.id) return;
    const lastFetch = detailFetchedAt[selectedDeal.id];
    if (lastFetch && Date.now() - lastFetch < 5000) return;
    if (detailError[selectedDeal.id] === "not_found") return;

    setDetailFetchedAt((prev) => ({
      ...prev,
      [selectedDeal.id]: Date.now(),
    }));

    fetchDealDetailAsync(selectedDeal.dealRoomId || selectedDeal.id)
      .then((res) => {
        if (res?.ok && res.deal) {
          updateDealInStore(selectedDeal.id, (prev) =>
            mergeServerDeal(prev, res.deal),
          );
        } else if (res?.error) {
          const status = res.error?.status;
          if (status === 404) {
            setDetailError((prev) => ({
              ...prev,
              [selectedDeal.id]: "not_found",
            }));
          }
        }
      })
      .catch(() => {
        /* noop */
      });
  }, [selectedDeal?.id]);

  // ── WebSocket incoming ──
  const handleIncomingWs = useCallback(
    (data) => {
      const roomId =
        data.room_id ?? selectedDeal?.dealRoomId ?? selectedDeal?.id;
      if (!roomId) return;

      // ── Typing ──
      if (data.type === "typing") {
        setTypingByRoom((prev) => ({ ...prev, [roomId]: data }));
        clearTimeout(typingTimeoutRef.current[roomId]);
        typingTimeoutRef.current[roomId] = setTimeout(() => {
          setTypingByRoom((prev) => ({ ...prev, [roomId]: null }));
        }, 3000);
        return;
      }

      const dealId = selectedDeal?.id;
      if (!dealId) return;

      // ── Message / Offer mpya — ongeza moja kwa moja kwenye store ──
      if (
        data.type === "message" ||
        data.type === "offer" ||
        data.type === "offer_update"
      ) {
        const p = data.payload;
        if (!p || p.sender_id === user?.id) {
          return;
        }

        updateDealInStore(dealId, (prev) => {
          const list = prev.messages || [];
          if (list.some((m) => String(m.id) === String(p.id))) {
            return prev;
          }
          return {
            ...prev,
            messages: [
              ...list,
              {
                id: p.id,
                sender: "them",
                text: p.text || "",
                imageUrl: p.attachment_url || null,
                offerAmount: p.offer_amount
                  ? parseFloat(p.offer_amount)
                  : null,
                kind: p.kind || "USER",
                at: p.created_at,
                sendStatus: "sent",
                system_code: p.system_code,
                system_data: p.system_data,
              },
            ],
          };
        });

        // ✅ ongeza unread kama si chumba active
        if (String(roomId) !== String(wsRoomId)) {
          setUnreadByRoom((prev) => ({
            ...prev,
            [roomId]: (prev[roomId] || 0) + 1,
          }));
        }

        // ✅ browser notification kama ruhusa imetolewa
        if (
          notificationPermissionRef.current === "granted" &&
          String(roomId) !== String(wsRoomId)
        ) {
          try {
            new Notification(p.sender_name || "Ujumbe mpya", {
              body: p.text?.slice(0, 120) || "📎 Picha",
              icon: "/logo.webp",
              tag: `deal-${roomId}`,
            });
          } catch (err) {
            console.warn("[notify] browser notification failed:", err);
          }
        }
        return;
      }

      // ── deal_update — fetch kamili ──
      if (data.type === "deal_update") {
        fetchDealDetailAsync(roomId)
          .then((res) => {
            if (res?.ok && res.deal && sendingRef.current === 0) {
              updateDealInStore(dealId, (prev) =>
                mergeServerDeal(prev, res.deal),
              );
            }
          })
          .catch(() => {});
      }
    },
    [selectedDeal?.id, selectedDeal?.dealRoomId, user?.id],
  );

  const wsRoomId = selectedDeal?.dealRoomId || selectedDeal?.id || null;
  const { status: wsStatus, sendTyping } = useDealWebSocket({
    roomId: wsRoomId,
    token,
    onIncoming: handleIncomingWs,
  });

  // ── Alama ya "imesomwa" ──
  const markedReadRef = useRef({});
  const selectedRoomId = selectedDeal?.dealRoomId || selectedDeal?.id;
  const latestUnreadIncomingId = (() => {
    const list = selectedDeal?.messages || [];
    for (let i = list.length - 1; i >= 0; i--) {
      const m = list[i];
      if (
        m.sender !== "me" &&
        m.sender !== "admin" &&
        m.sender !== "system" &&
        m.kind !== "ADMIN" &&
        m.kind !== "SYSTEM" &&
        !m.offerAmount &&
        !m.isRead &&
        !m.readAt &&
        !String(m.id).startsWith("m_")
      ) {
        return m.id;
      }
    }
    return null;
  })();

  useEffect(() => {
    if (!selectedRoomId || latestUnreadIncomingId == null) return;
    if (typeof dealsApi.markRead !== "function") return;

    const send = () => {
      const isMobileView =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 767px)").matches;
      const detailVisible = !isMobileView || mobileShowDetail;
      if (!detailVisible) return;
      if (document.visibilityState === "hidden") return;
      if (markedReadRef.current[selectedRoomId] === latestUnreadIncomingId) {
        return;
      }
      markedReadRef.current[selectedRoomId] = latestUnreadIncomingId;
      dealsApi.markRead(selectedRoomId).catch(() => {
        delete markedReadRef.current[selectedRoomId];
      });
      // ✅ futa unread kwa chumba hiki
      setUnreadByRoom((prev) => ({ ...prev, [selectedRoomId]: 0 }));
    };

    send();
    document.addEventListener("visibilitychange", send);
    return () => document.removeEventListener("visibilitychange", send);
  }, [selectedRoomId, latestUnreadIncomingId, mobileShowDetail]);

  const { resolveTxId, ensureTransactionId, refreshDeal } = useDealHelpers({
    deals,
    setOfflineMode,
    setTransactionIds,
    transactionIds,
    updateDeal,
  });

  const { handleSendMessage, handleRetryMessage } = useMessageActions({
    deals,
    lang,
    sendingRef,
    updateDeal,
  });

  const { handleSendOffer, handleRespond, handleReopen } = useOfferActions({
    deals,
    lang,
    updateDeal,
    user,
  });

  const { handleReserveConfirm } = useReservationActions({
    deals,
    detailError,
    ensureTransactionId,
    lang,
    onReservationPaid,
    refreshDeal,
    transactionIds,
    updateDeal,
  });

  const { handleInspectionResolve } = useInspectionActions({
    deals,
    lang,
    refreshDeal,
    setTransactionIds,
    transactionIds,
    updateDeal,
  });

  const { handleProofSubmit, handleProofConfirm, handleProofReject } =
    usePaymentProofActions({
      deals,
      lang,
      onFinalPaymentConfirmed,
      refreshDeal,
      resolveTxId,
      side,
      updateDeal,
    });

  return (
    <div
      style={{ background: COLORS.sand, minHeight: "600px" }}
      className="w-full"
    >
      <div className="p-4 sm:p-6 pb-0 text-center">
        <h1 className="h-title">
          {lang === "sw" ? "Vyumba vya Majadiliano" : "Deal Rooms"}
        </h1>
        <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
          {side === "seller"
            ? lang === "sw"
              ? "Negotiate moja kwa moja na wanunuzi wenye nia ya mali yako."
              : "Negotiate directly with buyers interested in your property."
            : lang === "sw"
              ? "Negotiate moja kwa moja na wauzaji wa mali unazovutiwa nazo."
              : "Negotiate directly with sellers of properties you're interested in."}
        </p>
        {selectedDeal && (
          <div className="flex items-center gap-2 justify-center mt-2">
            <WebSocketStatusBadge status={wsStatus} />
          </div>
        )}
        {offlineMode && (
          <p
            style={{ color: COLORS.rust }}
            className="text-body-sm mt-2 max-w-xl mx-auto"
          >
            {lang === "sw"
              ? "⚠️ Backend haipatikani."
              : "⚠️ Backend unavailable."}
          </p>
        )}
      </div>

      <div
        className="flex"
        style={{ height: "clamp(480px, calc(100dvh - 200px), 760px)" }}
      >
        <div
          style={{ borderColor: COLORS.sandLine }}
          className={`${
            mobileShowDetail ? "hidden" : "flex"
          } md:flex flex-col w-full md:w-80 shrink-0 border-r px-3 sm:px-4 pb-4 gap-2 overflow-y-auto`}
        >
          {deals.map((d) => (
            <DealListItem
              key={d.id}
              deal={d}
              active={d.id === selectedDeal?.id}
              onSelect={handleSelect}
              lang={lang}
              unreadCount={unreadByRoom[d.id] || 0}
            />
          ))}
        </div>

        <div
          className={`${
            mobileShowDetail ? "flex" : "hidden"
          } md:flex flex-1 min-w-0 flex-col`}
        >
          {selectedDeal ? (
            <DealDetail
              deal={selectedDeal}
              side={side}
              lang={lang}
              user={user}
              onBack={() => setMobileShowDetail(false)}
              onRefreshDeal={() => refreshDeal(selectedDeal.id)}
              onSendMessage={handleSendMessage}
              onRetryMessage={handleRetryMessage}
              onSendOffer={handleSendOffer}
              onRespond={handleRespond}
              onReopen={handleReopen}
              onReserveConfirm={handleReserveConfirm}
              onInspectionResolve={handleInspectionResolve}
              onProofSubmit={handleProofSubmit}
              onProofConfirm={handleProofConfirm}
              onProofReject={handleProofReject}
              onShowSuccess={() => setSuccessModalOpen(true)}
              openReserveModal={openReserveOnMount}
              onReserveModalOpened={() => setOpenReserveOnMount(false)}
              typing={typingByRoom[wsRoomId]}
              onTyping={sendTyping}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted text-sm">
                {lang === "sw"
                  ? "Chagua deal room kuanza mazungumzo."
                  : "Select a deal room to start chatting."}
              </p>
            </div>
          )}
        </div>
      </div>

      <ReservationSuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        onContinueDeal={() => setSuccessModalOpen(false)}
        onGoToReservations={() => {
          setSuccessModalOpen(false);
          navigate("/dashboard/buyer/reservations");
        }}
        lang={lang}
      />
    </div>
  );
}
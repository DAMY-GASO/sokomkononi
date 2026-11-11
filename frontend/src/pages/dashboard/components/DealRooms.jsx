// ============================================================
// src/pages/dashboard/components/DealRooms.jsx
//
// Marekebisho:
//  ✅ MPYA: prop `openReserveModalOnMount` — inatumwa kwa DealDetail
//     wakati `?action=reserve` ipo kwenye URL (kutoka WaitingListPage).
//  ✅ Kila kitu kingine kimebaki kama kilivyo.
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { COLORS } from "./shared";
import DealDetail from "./dealrooms/DealDetail.jsx";
import DealListItem from "./dealrooms/DealListItem.jsx";
import ReservationSuccessModal from "./dealrooms/ReservationSuccessModal.jsx";
import { dealsApi } from "../../../api/deals.js";
import {
  fetchDealDetailAsync,
  updateDeal as updateDealInStore,
  useDeals,
} from "../../../config/dealsStore.js";
import { mergeServerDeal } from "./dealrooms/messageHelpers.js";
import { useAuth } from "../../../config/authStore.js";
import { useDealHelpers } from "./dealrooms/useDealHelpers.js";
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
  // ✅ MPYA: hali ya kufungua reservation modal moja kwa moja
  const [openReserveOnMount, setOpenReserveOnMount] = useState(false);

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
      // ✅ MPYA: fungua reservation modal moja kwa moja
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
    // ✅ MPYA: kama mtumiaji anachagua deal nyingine, usifungue modal
    setOpenReserveOnMount(false);
  };

  const [detailFetchedAt, setDetailFetchedAt] = useState({});
  const [detailError, setDetailError] = useState({});
  // Idadi ya ujumbe unaotumwa sasa hivi — polling inasubiri ili isifute
  // ujumbe wa muda (optimistic) kabla seva haijajibu.
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

  // ── Polling nyepesi ──
  useEffect(() => {
    const id = selectedDeal?.id;
    if (!id) return;
    const roomId = selectedDeal.dealRoomId || id;

    const timer = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      if (sendingRef.current > 0) return;
      fetchDealDetailAsync(roomId)
        .then((res) => {
          if (res?.error?.status === 404) {
            clearInterval(timer);
            return;
          }
          if (res?.ok && res.deal && sendingRef.current === 0) {
            updateDealInStore(id, (prev) => mergeServerDeal(prev, res.deal));
          }
        })
        .catch(() => {
          /* noop */
        });
    }, 15000);

    return () => clearInterval(timer);
  }, [selectedDeal?.id, selectedDeal?.dealRoomId]);

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
              // ✅ MPYA: pitisha hali ya kufungua modal
              openReserveModal={openReserveOnMount}
              onReserveModalOpened={() => setOpenReserveOnMount(false)}
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
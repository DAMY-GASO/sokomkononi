// ============================================================
// DealDetail.jsx
//
// Marekebisho:
//  ✅ MPYA: props `openReserveModal` + `onReserveModalOpened`
//     — inafungua ReservationModal kwenye mount kama ni true.
//     Baada ya kufungua, inaita `onReserveModalOpened()` ili
//     DealRooms iweze ku-reset state.
//  ✅ Kila kitu kingine kimebaki kama kilivyo.
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { COLORS, formatTZS, getCategory } from "../shared";
import DealActionPanels from "./DealActionPanels.jsx";
import DealBanners from "./DealBanners.jsx";
import DealComposer from "./DealComposer.jsx";
import DealDetailHeader from "./DealDetailHeader.jsx";
import DealDetailModals from "./DealDetailModals.jsx";
import DealMessageList from "./DealMessageList.jsx";
import PaymentStatusStrip from "./PaymentStatusStrip.jsx";
import { FALLBACK_DEAL_STATUS, getDealStatus } from "./dealStatus.js";
import { cleanMoneyInput } from "./paymentInputHelpers.js";
import { dealsApi } from "../../../../api/deals.js";
import { explainApiError } from "../../../../api/apiErrors.js";
import { getCategoryIcon } from "../../../../config/categoriesStore.js";
import { useActiveReservationTiers, useReservationSettings } from "../../../../config/feePolicy.js";
import { useNavigate } from "react-router-dom";

// ============================================================
// DEAL DETAIL
// ============================================================
export default function DealDetail({
  deal,
  side,
  onBack,
  onRefreshDeal,
  onSendMessage,
  onRetryMessage,
  onSendOffer,
  onRespond,
  onReopen,
  onReserveConfirm,
  onInspectionResolve,
  onProofSubmit,
  onProofConfirm,
  onProofReject,
  lang,
  user,
  onShowSuccess,
  // ✅ MPYA
  openReserveModal = false,
  onReserveModalOpened,
}) {
  const [text, setText] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [freeReserving, setFreeReserving] = useState(false);
  const [chatError, setChatError] = useState("");
  const [attachFile, setAttachFile] = useState(null);
  const [attachPreview, setAttachPreview] = useState(null);
  const attachInputRef = useRef(null);

  // ✅ MPYA: fungua ReservationModal moja kwa moja kama openReserveModal ni true
  useEffect(() => {
    if (!openReserveModal) return;
    // Subiri hadi deal ipakiwe kikamilifu (au angalau sekunde 100)
    const timer = setTimeout(() => {
      setReserveModalOpen(true);
      if (typeof onReserveModalOpened === "function") {
        onReserveModalOpened();
      }
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openReserveModal]);

  const clearAttachment = () => {
    if (attachPreview) URL.revokeObjectURL(attachPreview);
    setAttachFile(null);
    setAttachPreview(null);
    if (attachInputRef.current) attachInputRef.current.value = "";
  };

  const handleAttachChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setChatError(
        lang === "sw" ? "Chagua picha pekee." : "Please choose an image."
      );
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setChatError(
        lang === "sw"
          ? "Picha ni kubwa mno (kiwango ni MB 8)."
          : "Image is too large (max 8 MB)."
      );
      return;
    }
    setChatError("");
    if (attachPreview) URL.revokeObjectURL(attachPreview);
    setAttachFile(f);
    setAttachPreview(URL.createObjectURL(f));
  };

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("FRAUD");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [contactDrawerOpen, setContactDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [reopenInfo, setReopenInfo] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const category = getCategory(deal.category);
  const CategoryIcon = getCategoryIcon(category?.iconKey);
  const status =
    getDealStatus(lang)[deal.status] ||
    FALLBACK_DEAL_STATUS(lang, deal.status);
  const counterpartyLabel =
    side === "seller"
      ? lang === "sw"
        ? "Mnunuzi"
        : "Buyer"
      : lang === "sw"
        ? "Muuzaji"
        : "Seller";

  const isBuyer = side === "buyer";
  const isSeller = side === "seller";

  const isLocked = !!deal.adminLocked && deal.status !== "cancelled";
  const isCancelledByAdmin = !!deal.cancelledByAdmin;
  const canInteract = !isLocked && deal.status !== "cancelled";

  const lastOffer = [...(deal.messages || [])]
    .reverse()
    .find(
      (m) =>
        m.offerAmount &&
        !["declined", "rejected", "cancelled"].includes(
          String(m.status || "").toLowerCase()
        )
    );
  const iMadeLastOffer = lastOffer?.sender === "me";

  const showAcceptedNotice =
    deal.status === "accepted" &&
    !isLocked &&
    (isSeller ||
      (isBuyer && !deal.reservationPaidAt && !deal.transactionId));
  const acceptedAnchorId = lastOffer?.id ?? null;
  const acceptedAnchorExists =
    acceptedAnchorId != null &&
    (deal.messages || []).some(
      (m) => String(m.id) === String(acceptedAnchorId)
    );

  const acceptedNotice = showAcceptedNotice ? (
    <div key="accepted-notice" className="flex justify-center my-1">
      <div
        style={{
          background: isSeller
            ? "rgba(232,163,61,0.14)"
            : "rgba(47,109,79,0.08)",
          color: isSeller ? "#8A5A16" : COLORS.green,
          borderColor: COLORS.sandLine,
        }}
        className="border rounded-xl px-3.5 py-2 max-w-[90%] text-body-sm text-center font-medium"
      >
        {isSeller
          ? lang === "sw"
            ? `Mmekubaliana kwenye ${formatTZS(
                deal.currentOffer
              )}. Mnunuzi ataendelea na hatua inayofuata.`
            : `You agreed at ${formatTZS(
                deal.currentOffer
              )}. The buyer will proceed with the next step.`
          : lang === "sw"
            ? `Mmekubaliana bei ya ${formatTZS(
                deal.currentOffer
              )}. Endelea kuwasiliana na muuzaji hapa.`
            : `You've agreed at ${formatTZS(
                deal.currentOffer
              )}. Continue chatting with the seller here.`}
      </div>
    </div>
  ) : null;
  const canRespond =
    canInteract &&
    deal.currentOffer > 0 &&
    !!lastOffer &&
    !iMadeLastOffer;

  const waitingText = iMadeLastOffer
    ? lang === "sw"
      ? `Ofa yako ya ${formatTZS(
          deal.currentOffer
        )} imetumwa — unasubiri upande wa pili ukubali au ukatae.`
      : `Your offer of ${formatTZS(
          deal.currentOffer
        )} was sent — waiting for the other party to accept or decline.`
    : deal.currentOffer > 0
      ? lang === "sw"
        ? `Ofa ya ${formatTZS(
            deal.currentOffer
          )} imepokelewa — unaweza kukubali au kukataa.`
        : `Offer of ${formatTZS(
            deal.currentOffer
          )} received — you can accept or decline.`
      : lang === "sw"
        ? "Hakuna ofa bado — toa ofa yako ya kwanza."
        : "No offer yet — make your first offer.";

  const sellerPhone =
    deal.sellerPhone ??
    deal.seller_phone ??
    deal.counterpartyPhone ??
    null;
  const sellerEmail =
    deal.sellerEmail ??
    deal.seller_email ??
    deal.counterpartyEmail ??
    null;
  const buyerPhone = deal.buyerPhone ?? null;
  const buyerEmail = deal.buyerEmail ?? null;

  const reservationPaidStatuses = [
    "reserved",
    "awaiting_final_payment",
    "payment_proof_submitted",
    "completed",
  ];
  const reservationPaid = reservationPaidStatuses.includes(deal.status);

  const reservationSettings = useReservationSettings();
  const reservationTiers = useActiveReservationTiers();
  const reservationEnabled = reservationSettings?.is_enabled !== false;
  const FREE_RESERVATION_FALLBACK_HOURS = 48;

  const canReserve =
    canInteract &&
    isBuyer &&
    ["negotiating", "offer_sent", "accepted"].includes(deal.status) &&
    !deal.pendingPayment &&
    !deal.reservationPaidAt;

  const showReservedBanner = isBuyer && reservationPaid;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !attachFile) return;
    setChatError("");
    onSendMessage(deal.id, trimmed, attachFile);
    setText("");
    clearAttachment();
  };

  const handleExit = () => {
    setMenuOpen(false);
    const params = new URLSearchParams(window.location.search);
    const enteredViaLink = params.has("deal") || params.has("listing");
    const isMobileView =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches;
    const idx = window.history.state?.idx;
    const hasHistory =
      typeof idx === "number" ? idx > 0 : window.history.length > 1;
    if (isMobileView && !enteredViaLink) onBack();
    else if (hasHistory) navigate(-1);
    else onBack();
  };

  const handleReopenClick = async () => {
    if (!onReopen || reopening) return;
    setReopening(true);
    setReopenInfo(null);
    const res = await onReopen(deal.id);
    if (!res?.ok) {
      setReopenInfo(
        explainApiError(res?.error, {
          lang,
          action: "reopen_deal",
          fallback:
            lang === "sw"
              ? "Imeshindwa kufufua mazungumzo."
              : "Could not reopen the conversation.",
        })
      );
    }
    setReopening(false);
  };

  const handleOffer = () => {
    const value = parseInt(cleanMoneyInput(offerAmount), 10);
    if (!value) return;
    onSendOffer(deal.id, value);
    setOfferAmount("");
    setOfferOpen(false);
  };

  const handleReserveSuccess = async (details) => {
    setReserveModalOpen(false);
    const result = await onReserveConfirm(deal.id, details);
    if (result?.ok) {
      onShowSuccess?.();
    }
  };

  const handleFreeReserve = async () => {
    if (freeReserving) return;
    setFreeReserving(true);
    try {
      await handleReserveSuccess({
        hours:
          reservationTiers?.[0]?.hours ?? FREE_RESERVATION_FALLBACK_HOURS,
        fee: 0,
        method: "free",
        phone: null,
        cardNumber: null,
      });
    } finally {
      setFreeReserving(false);
    }
  };

  const handleReportSubmit = async () => {
    if (reportDetails.trim().length < 10) return;
    setReportBusy(true);
    try {
      const reportedUserId =
        side === "buyer" ? deal.sellerId : deal.buyerId;
      let dealRoomId = deal.dealRoomId;
      if (!dealRoomId) {
        try {
          const detailRes = await dealsApi.detail(deal.id);
          dealRoomId =
            detailRes?.id ?? detailRes?.deal_room_id ?? deal.id;
        } catch {
          dealRoomId = deal.id;
        }
      }
      await dealsApi.report(dealRoomId, {
        reported_user_id: reportedUserId,
        reason: reportReason,
        details: reportDetails.trim(),
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportOpen(false);
        setReportSuccess(false);
        setReportDetails("");
        setReportReason("FRAUD");
      }, 3500);
    } catch (err) {
      alert(
        err?.message ||
          (lang === "sw"
            ? "Imeshindwa kutuma ripoti. Jaribu tena."
            : "Failed to send report. Try again.")
      );
    } finally {
      setReportBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <DealDetailHeader CategoryIcon={CategoryIcon} counterpartyLabel={counterpartyLabel} deal={deal} handleExit={handleExit} isBuyer={isBuyer} isLocked={isLocked} lang={lang} menuOpen={menuOpen} menuRef={menuRef} onBack={onBack} onInspectionResolve={onInspectionResolve} setContactDrawerOpen={setContactDrawerOpen} setMenuOpen={setMenuOpen} setReportOpen={setReportOpen} side={side} status={status} />
      <PaymentStatusStrip deal={deal} side={side} lang={lang} onRefresh={onRefreshDeal} />
      <DealBanners canReserve={canReserve} deal={deal} freeReserving={freeReserving} handleFreeReserve={handleFreeReserve} isBuyer={isBuyer} isLocked={isLocked} lang={lang} navigate={navigate} reservationEnabled={reservationEnabled} reserveModalOpen={reserveModalOpen} setReserveModalOpen={setReserveModalOpen} showReservedBanner={showReservedBanner} />
      <DealMessageList acceptedAnchorExists={acceptedAnchorExists} acceptedAnchorId={acceptedAnchorId} acceptedNotice={acceptedNotice} deal={deal} lang={lang} onRetryMessage={onRetryMessage} />
      <DealActionPanels canRespond={canRespond} chatError={chatError} deal={deal} handleOffer={handleOffer} handleReopenClick={handleReopenClick} isBuyer={isBuyer} isCancelledByAdmin={isCancelledByAdmin} isLocked={isLocked} isSeller={isSeller} lang={lang} offerAmount={offerAmount} offerOpen={offerOpen} onInspectionResolve={onInspectionResolve} onProofConfirm={onProofConfirm} onProofReject={onProofReject} onProofSubmit={onProofSubmit} onReopen={onReopen} onRespond={onRespond} reopenInfo={reopenInfo} reopening={reopening} setOfferAmount={setOfferAmount} setOfferOpen={setOfferOpen} side={side} waitingText={waitingText} />
      <DealComposer attachInputRef={attachInputRef} attachPreview={attachPreview} chatError={chatError} clearAttachment={clearAttachment} deal={deal} handleAttachChange={handleAttachChange} handleSend={handleSend} isLocked={isLocked} lang={lang} setChatError={setChatError} setText={setText} text={text} />
      <DealDetailModals buyerEmail={buyerEmail} buyerPhone={buyerPhone} contactDrawerOpen={contactDrawerOpen} deal={deal} handleReportSubmit={handleReportSubmit} handleReserveSuccess={handleReserveSuccess} isBuyer={isBuyer} lang={lang} reportBusy={reportBusy} reportDetails={reportDetails} reportOpen={reportOpen} reportReason={reportReason} reportSuccess={reportSuccess} reserveModalOpen={reserveModalOpen} sellerEmail={sellerEmail} sellerPhone={sellerPhone} setContactDrawerOpen={setContactDrawerOpen} setReportDetails={setReportDetails} setReportOpen={setReportOpen} setReportReason={setReportReason} setReserveModalOpen={setReserveModalOpen} side={side} user={user} />
    </div>
  );
}
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getDealRoom, sendDealMessage, agreeOnPrice } from "../api/dealroom.api";
import { createReservation } from "../api/reservation.api";

export default function DealRoomPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [dealRoom, setDealRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [agreeing, setAgreeing] = useState(false);
  const [creatingTx, setCreatingTx] = useState(false);
  const [error, setError] = useState("");
  const threadEndRef = useRef(null);

  function load() {
    return getDealRoom(id)
      .then((res) => setDealRoom(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dealRoom?.messages?.length]);

  if (loading) {
    return <p className="p-8 text-center text-ink-muted text-sm">{t("dealroom_loading")}</p>;
  }
  if (!dealRoom) {
    return <p className="p-8 text-center text-ink-muted text-sm">{t("dealroom_not_found")}</p>;
  }

  const isBuyer = user.id === dealRoom.buyerId;
  const messages = dealRoom.messages || [];
  const lastMessage = messages[messages.length - 1];
  const canAgreeToLast =
    !dealRoom.isAgreed &&
    lastMessage?.offerAmount &&
    lastMessage.senderId !== user.id;

  async function handleSend(e) {
    e.preventDefault();
    if (!messageText.trim() && !offerAmount) return;
    setError("");
    setSending(true);
    try {
      await sendDealMessage(id, {
        message: messageText.trim() || `Offer: TZS ${Number(offerAmount).toLocaleString()}`,
        ...(offerAmount && { offerAmount: Number(offerAmount) }),
      });
      setMessageText("");
      setOfferAmount("");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || t("dealroom_send_error"));
    } finally {
      setSending(false);
    }
  }

  async function handleAgree() {
    setError("");
    setAgreeing(true);
    try {
      await agreeOnPrice(id, Number(lastMessage.offerAmount));
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || t("dealroom_agree_error"));
    } finally {
      setAgreeing(false);
    }
  }

  async function handleCreateTransaction() {
    setCreatingTx(true);
    try {
      await createReservation({ dealRoomId: id, durationHours: 48 });
    } catch (err) {
      alert(err?.response?.data?.message || t("dealroom_transaction_pending_note"));
    } finally {
      setCreatingTx(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      {/* PRODUCT */}
      <div className="flex gap-3 border border-ink-muted/15 rounded-lg p-3 bg-white">
        <div className="w-16 h-16 rounded-md bg-sand shrink-0 overflow-hidden">
          {dealRoom.property.images?.[0] && (
            <img src={dealRoom.property.images[0]} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-ink-muted tracking-wide">
            {t("dealroom_product_label")}
          </p>
          <h1 className="font-semibold text-ink-primary text-sm">{dealRoom.property.title}</h1>
          <p className="text-price text-ink-primary text-lg mt-0.5">
            TZS {Number(dealRoom.property.price).toLocaleString()}
          </p>
        </div>
      </div>

      {/* SELLER / BUYER */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <PartyCard
          label={t("dealroom_seller_label")}
          name={dealRoom.seller.name}
          isYou={!isBuyer}
          you={t("dealroom_you_suffix")}
        />
        <PartyCard
          label={t("dealroom_buyer_label")}
          name={dealRoom.buyer.name}
          isYou={isBuyer}
          you={t("dealroom_you_suffix")}
        />
      </div>

      {/* AGREED PRICE banner */}
      {dealRoom.isAgreed && (
        <div className="mt-4 bg-market/10 border border-market/30 rounded-lg p-4 text-center">
          <p className="text-market-dark font-bold text-lg tabular-nums">
            {t("dealroom_agreed_banner", { price: Number(dealRoom.agreedPrice).toLocaleString() })}
          </p>
          <button
            onClick={handleCreateTransaction}
            disabled={creatingTx}
            className="mt-3 bg-gold hover:bg-gold-dark text-night font-semibold text-sm px-6 py-2.5 rounded-md"
          >
            {creatingTx ? t("dealroom_creating_transaction") : t("dealroom_create_transaction")}
          </button>
          <p className="text-[11px] text-ink-muted mt-2">{t("dealroom_transaction_pending_note")}</p>
        </div>
      )}

      {/* NEGOTIATION THREAD */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold text-ink-muted tracking-wide mb-2">
          {t("dealroom_negotiation_heading")}
        </p>

        <div className="border border-ink-muted/15 rounded-lg bg-white p-3 max-h-80 overflow-y-auto space-y-2.5">
          {messages.length === 0 && (
            <p className="text-ink-muted text-sm text-center py-6">{t("dealroom_empty_thread")}</p>
          )}

          {messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    mine ? "bg-gold/15 text-ink-primary" : "bg-sand text-ink-primary"
                  }`}
                >
                  <p className="text-[10px] text-ink-muted font-medium mb-0.5">
                    {m.sender.name}
                  </p>
                  {m.offerAmount && (
                    <p className="text-price text-base">
                      TZS {Number(m.offerAmount).toLocaleString()}
                    </p>
                  )}
                  {m.message && <p>{m.message}</p>}
                </div>
              </div>
            );
          })}
          <div ref={threadEndRef} />
        </div>

        {canAgreeToLast && (
          <button
            onClick={handleAgree}
            disabled={agreeing}
            className="mt-3 w-full border border-market text-market bg-market/10 hover:bg-market/20 font-semibold text-sm py-2.5 rounded-md"
          >
            {agreeing
              ? t("dealroom_agreeing")
              : `${t("dealroom_agree_button")} — TZS ${Number(lastMessage.offerAmount).toLocaleString()}`}
          </button>
        )}

        {error && <p className="text-rust text-sm mt-2">{error}</p>}

        {dealRoom.isAgreed ? (
          <p className="text-xs text-ink-muted text-center mt-3">{t("dealroom_agreed_locked")}</p>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-2 mt-3">
            <input
              className="flex-1 border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
              placeholder={t("dealroom_message_placeholder")}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <input
              type="number"
              className="border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm sm:w-40"
              placeholder={t("dealroom_offer_placeholder")}
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
            />
            <button
              disabled={sending}
              className="bg-gold hover:bg-gold-dark text-night font-semibold text-sm px-5 py-2.5 rounded-md whitespace-nowrap"
            >
              {sending ? t("dealroom_sending") : t("dealroom_send")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PartyCard({ label, name, isYou, you }) {
  return (
    <div className="border border-ink-muted/15 rounded-lg p-3 bg-white">
      <p className="text-[11px] font-semibold text-ink-muted tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-ink-primary mt-0.5">
        {name} {isYou && <span className="text-ink-muted font-normal">{you}</span>}
      </p>
    </div>
  );
}

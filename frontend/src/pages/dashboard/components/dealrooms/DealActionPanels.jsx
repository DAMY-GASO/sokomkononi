import React from "react";
import { ArrowRight, Ban, Check, ChevronDown, HandCoins, Loader2, RotateCcw, X } from "lucide-react";
import { COLORS, formatTZS } from "../shared";
import ErrorCallout from "../../../../components/ErrorCallout.jsx";
import { Link } from "react-router-dom";
import PaymentProofPanel from "./PaymentProofPanel.jsx";
import PaymentProofReview from "./PaymentProofReview.jsx";
import { REVIVABLE_STATUSES } from "./dealStatus.js";
import { cleanMoneyInput, formatMoneyInput } from "./paymentInputHelpers.js";

export default function DealActionPanels({ canRespond, chatError, deal, handleOffer, handleReopenClick, isBuyer, isCancelledByAdmin, isLocked, isSeller, lang, offerAmount, offerOpen, onInspectionResolve, onProofConfirm, onProofReject, onProofSubmit, onReopen, onRespond, reopenInfo, reopening, setOfferAmount, setOfferOpen, side, waitingText }) {
  return (
    <>
{/* Negotiation actions */}
      {(deal.status === "negotiating" || deal.status === "offer_sent") &&
        !isLocked && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-t flex-wrap"
        >
          {canRespond ? (
            <>
              <button
                onClick={() => onRespond(deal.id, "accepted")}
                style={{ background: COLORS.green, color: "white" }}
                className="flex items-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg"
              >
                <Check size={13} />{" "}
                {lang === "sw"
                  ? `Kubali Ofa ya ${formatTZS(deal.currentOffer)}`
                  : `Accept Offer of ${formatTZS(deal.currentOffer)}`}
              </button>
              <button
                onClick={() => onRespond(deal.id, "declined")}
                style={{
                  borderColor: "rgba(193,80,46,0.35)",
                  color: COLORS.rust,
                }}
                className="flex items-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg border"
              >
                <X size={13} /> {lang === "sw" ? "Kataa" : "Decline"}
              </button>
            </>
          ) : (
            <span
              style={{ color: "var(--text-muted)" }}
              className="text-body-sm italic flex-1"
            >
              {waitingText}
            </span>
          )}
          {(isBuyer || isSeller) && (
            <button
              onClick={() => setOfferOpen((v) => !v)}
              style={{
                borderColor: COLORS.sandLine,
                color: COLORS.night,
              }}
              className="flex items-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg border ml-auto"
            >
              <HandCoins size={13} />{" "}
              {deal.currentOffer > 0
                ? lang === "sw"
                  ? "Toa Ofa Nyingine"
                  : "Make Another Offer"
                : lang === "sw"
                  ? "Toa Ofa"
                  : "Make an Offer"}
              <ChevronDown
                size={12}
                style={{
                  transform: offerOpen ? "rotate(180deg)" : "none",
                }}
              />
            </button>
          )}
        </div>
      )}

      {/* Offer input */}
      {(isBuyer || isSeller) && offerOpen && !isLocked && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-t"
        >
          <input
            style={{
              background: COLORS.sand,
              borderColor: COLORS.sandLine,
              color: COLORS.night,
            }}
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none text-center"
            placeholder={
              lang === "sw"
                ? "Kiasi cha ofa (TZS)"
                : "Offer amount (TZS)"
            }
            type="text"
            inputMode="numeric"
            value={formatMoneyInput(offerAmount)}
            onChange={(e) =>
              setOfferAmount(cleanMoneyInput(e.target.value))
            }
          />
          <button
            onClick={handleOffer}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="text-body-sm font-semibold px-3 py-2 rounded-lg shrink-0"
          >
            {lang === "sw" ? "Tuma Ofa" : "Send Offer"}
          </button>
        </div>
      )}

      {deal.status === "reserved" && side === "buyer" && !isLocked && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex justify-center px-3 sm:px-4 py-2.5 border-t"
        >
          <button
            onClick={() =>
              onInspectionResolve(deal.id, "READY_FOR_FINAL_PAYMENT", "")
            }
            style={{
              borderColor: COLORS.green,
              color: COLORS.green,
              background: "transparent",
            }}
            className="text-body-sm font-semibold px-3 py-1.5 rounded-lg border"
          >
            {lang === "sw" ? "Nimeridhika — Endelea" : "I'm satisfied — Continue"}
          </button>
        </div>
      )}

      {deal.status === "awaiting_final_payment" && side === "buyer" && !isLocked && (
        <PaymentProofPanel
          deal={deal}
          lang={lang}
          onSubmit={(proof) => onProofSubmit(deal.id, proof)}
        />
      )}

      {deal.status === "payment_proof_submitted" && side === "seller" && !isLocked && (
        <PaymentProofReview
          deal={deal}
          lang={lang}
          onConfirm={() => onProofConfirm(deal.id)}
          onReject={(reason) => onProofReject(deal.id, reason)}
        />
      )}

      {deal.status === "completed" && isSeller && deal.listingId && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="flex justify-center px-3 sm:px-4 py-2.5 border-t"
        >
          <Link
            to={`/mali/${deal.listingId}`}
            style={{ background: COLORS.green, color: "white" }}
            className="flex items-center gap-1.5 text-body-sm font-semibold px-4 py-2 rounded-lg"
          >
            {lang === "sw" ? "Nenda kwenye Tangazo" : "Go to Listing"}{" "}
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {REVIVABLE_STATUSES.includes(deal.status) && (
        <div
          style={{
            borderColor: COLORS.sandLine,
            background: "rgba(16,26,46,0.04)",
          }}
          className="flex flex-col items-center text-center gap-3 px-3 sm:px-4 py-4 border-t"
        >
          <Ban size={16} color={COLORS.night} />
          <div className="max-w-md space-y-1">
            <p className="text-primary text-body-sm font-medium">
              {deal.status === "cancelled"
                ? lang === "sw"
                  ? "Deal hii imeghairiwa."
                  : "This deal has been cancelled."
                : lang === "sw"
                  ? "Deal hii imefungwa."
                  : "This deal is closed."}
            </p>
            {!isCancelledByAdmin && (
              <p className="text-secondary text-body-sm">
                {lang === "sw"
                  ? "Mazungumzo yenu yote yamehifadhiwa. Mmoja wenu akifufua, mnaendelea kujadiliana kutoka mlipoishia."
                  : "Your whole conversation is saved. If either of you reopens it, you continue from where you left off."}
              </p>
            )}
            {deal.status === "cancelled" && (
              <p className="text-muted text-xs">
                {lang === "sw"
                  ? "Reservation Fee iliyolipwa haitarejeshwa. Ukihitaji kureserve tena, utaanza mchakato huo upya."
                  : "Any Reservation Fee already paid is non-refundable. If you need to reserve again, that step starts over."}
              </p>
            )}
          </div>

          {/* ── MPYA: admin alighairi — onyesha support, ficha "Fufua" ── */}
          {isCancelledByAdmin ? (
            <div
              style={{
                background: "rgba(193,80,46,0.08)",
                color: COLORS.rust,
                borderColor: "rgba(193,80,46,0.35)",
              }}
              className="max-w-md w-full rounded-lg border px-3 py-2.5 text-xs text-center"
            >
              <p className="font-semibold mb-1">
                {lang === "sw"
                  ? "Imeghairiwa na Msimamizi"
                  : "Cancelled by Administrator"}
              </p>
              <p>
                {lang === "sw"
                  ? "Deal hii ilighairiwa na msimamizi na haiwezi kufufuliwa. Wasiliana na support@sokomkononi.co.tz ukihitaji msaada."
                  : "This deal was cancelled by an administrator and cannot be reopened. Contact support@sokomkononi.co.tz if you need help."}
              </p>
            </div>
          ) : (
            <>
              {onReopen &&
                !isLocked &&
                deal.canReopen !== false &&
                deal.can_reopen !== false && (
                  <button
                    type="button"
                    onClick={handleReopenClick}
                    disabled={reopening}
                    className="btn btn-primary btn-sm inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    {reopening ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RotateCcw size={14} />
                    )}
                    {lang === "sw" ? "Fufua mazungumzo" : "Reopen conversation"}
                  </button>
                )}
              {(deal.canReopen === false || deal.can_reopen === false) && (
                <p className="text-muted text-xs max-w-md">
                  {lang === "sw"
                    ? "Deal hii haiwezi kufufuliwa moja kwa moja. Wasiliana na support@sokomkononi.co.tz ukihitaji msaada."
                    : "This deal can't be reopened directly. Contact support@sokomkononi.co.tz if you need help."}
                </p>
              )}
            </>
          )}

          {reopenInfo && (
            <div className="w-full max-w-md">
              <ErrorCallout info={reopenInfo} />
            </div>
          )}
        </div>
      )}

      {chatError && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
            borderColor: COLORS.sandLine,
          }}
          className="border-t px-3 sm:px-4 py-2 text-body-sm font-medium text-center"
        >
          {chatError}
        </div>
      )}
    </>
  );
}

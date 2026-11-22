import { useState } from "react";
import { Clock, LifeBuoy } from "lucide-react";
import { COLORS } from "../shared";
import { transactionsApi } from "../../../../api/transactions.js";
import { useCountdown } from "./useCountdown.js";

// ============================================================
// PAYMENT STATUS STRIP — "zamu ya nani" kwa malipo ya nje ya mfumo
// (mtindo wa Binance P2P): kijani = zamu yako, kijivu = unasubiri.
// ============================================================
const HIDDEN_STAGES = ["", "negotiating", "completed", "cancelled"];

function stageText(stage, side, lang) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const buyer = side === "buyer";
  switch (stage) {
    case "reservation_due":
      return buyer
        ? t("Lipa Reservation", "Pay the reservation")
        : t("Inasubiri mnunuzi alipe reservation", "Waiting for the buyer to pay the reservation");
    case "inspection":
      return buyer
        ? t("Kagua mali, kisha amua", "Inspect the property, then decide")
        : t("Mnunuzi anakagua mali", "The buyer is inspecting");
    case "final_payment_due":
      return buyer
        ? t("Lipa nje ya mfumo, kisha pakia uthibitisho", "Pay outside the platform, then upload proof")
        : t("Inasubiri malipo ya mnunuzi", "Waiting for the buyer's payment");
    case "proof_submitted":
      return buyer
        ? t("Inasubiri muuzaji athibitishe malipo", "Waiting for the seller to confirm payment")
        : t("Thibitisha umepokea malipo", "Confirm you received the payment");
    case "disputed":
      return t("Timu ya SokoMkononi inapitia rufaa", "SokoMkononi is reviewing the appeal");
    default:
      return "";
  }
}

export default function PaymentStatusStrip({ deal, side, lang, onRefresh }) {
  const ps = deal?.paymentState;
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const showSellerTimer = ps?.stage === "proof_submitted";
  const timerIso = showSellerTimer
    ? ps?.sellerResponseDueAt
    : ps?.stage === "final_payment_due"
      ? ps?.finalPaymentDueAt
      : null;
  const { ms, label } = useCountdown(timerIso);

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!ps || HIDDEN_STAGES.includes(ps.stage)) return null;

  const mine = !!ps.awaitingMe;
  const canAppeal =
    !!deal.transactionId &&
    !deal.adminLocked &&
    (ps.stage === "proof_submitted" ||
      (ps.stage === "final_payment_due" && ps.proofAttempts > 0));

  const submitAppeal = async () => {
    if (busy || !reason.trim()) return;
    setBusy(true);
    setError("");
    try {
      await transactionsApi.appeal(deal.transactionId, reason.trim());
      setOpen(false);
      setReason("");
      await onRefresh?.();
    } catch (err) {
      setError(
        err?.data?.error?.message ||
          err?.message ||
          t("Imeshindwa kutuma rufaa.", "Failed to send the appeal.")
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine }}
      className="border-b bg-card px-3 sm:px-4 py-2.5"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          style={{
            background: mine ? COLORS.green : "rgba(120,120,120,0.18)",
            color: mine ? "white" : undefined,
          }}
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-secondary"
        >
          {ps.stage === "disputed"
            ? t("Rufaa", "Appeal")
            : mine
              ? t("Zamu yako", "Your turn")
              : t("Unasubiri", "Waiting")}
        </span>
        <p className="text-primary text-body-sm font-semibold min-w-0 flex-1">
          {stageText(ps.stage, side, lang)}
        </p>
        {timerIso && (
          <span
            style={{ color: ms != null && ms <= 0 ? COLORS.rust : undefined }}
            className="inline-flex items-center gap-1 text-body-sm font-semibold tabular-nums text-primary"
          >
            <Clock size={12} />
            {label}
          </span>
        )}
      </div>

      {ps.stage === "disputed" && (
        <p className="text-muted text-body-sm mt-1">
          {t("Sababu", "Reason")}:{" "}
          {ps.disputeReason === "SELLER_NO_RESPONSE"
            ? t("muuzaji hakujibu kwa wakati", "the seller did not respond in time")
            : ps.disputeReason === "PROOF_REJECTED_MAX"
              ? t("uthibitisho umekataliwa mara 3", "proof was rejected 3 times")
              : ps.disputeReason === "PAYMENT_APPEAL"
                ? `${
                    ps.disputeOpenedBy === "seller"
                      ? t("muuzaji", "the seller")
                      : t("mnunuzi", "the buyer")
                  } ${t("ameomba msaada", "asked for help")}${ps.disputeNote ? `: “${ps.disputeNote}”` : ""}`
                : ps.buyerDecisionNote || t("mgogoro umefunguliwa", "a dispute was opened")}
        </p>
      )}

      {ps.stage === "final_payment_due" && ps.proofAttempts > 0 && (
        <p className="text-muted text-body-sm mt-1">
          {t("Majaribio yaliyobaki", "Attempts left")}: {ps.proofAttemptsLeft}/3
        </p>
      )}

      {canAppeal && !open && (
        <button
          onClick={() => setOpen(true)}
          className="mt-2 inline-flex items-center gap-1 text-body-sm font-semibold underline text-secondary"
        >
          <LifeBuoy size={12} />
          {t("Omba msaada (rufaa)", "Ask for help (appeal)")}
        </button>
      )}

      {open && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={t("Eleza tatizo lako...", "Describe the problem...")}
            style={{ borderColor: COLORS.sandLine }}
            className="w-full rounded-lg border bg-card text-primary px-3 py-2 text-xs outline-none resize-none"
          />
          {error && (
            <p className="text-[11px]" style={{ color: COLORS.rust }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              disabled={busy}
              style={{ borderColor: COLORS.sandLine }}
              className="flex-1 border text-xs font-semibold px-3 py-1.5 rounded-lg text-primary disabled:opacity-50"
            >
              {t("Ghairi", "Cancel")}
            </button>
            <button
              onClick={submitAppeal}
              disabled={busy || !reason.trim()}
              style={{ background: COLORS.rust, color: "white" }}
              className="flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              {busy ? t("Inatuma...", "Sending...") : t("Tuma rufaa", "Send appeal")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

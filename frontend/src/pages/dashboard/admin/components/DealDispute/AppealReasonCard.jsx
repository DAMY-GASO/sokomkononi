// ============================================================
// AppealReasonCard.jsx — sababu ya rufaa/mgogoro kwa admin
// ============================================================
import React from "react";
import { AlertTriangle } from "lucide-react";
import { COLORS } from "../../shared/constants.js";

function reasonOf(ps, lang) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const by = ps.disputeOpenedBy;
  const who =
    by === "buyer" ? t("Mnunuzi", "Buyer") : by === "seller" ? t("Muuzaji", "Seller") : "";

  switch (ps.disputeReason) {
    case "PAYMENT_APPEAL":
      return {
        title: t(`${who || "Mtumiaji"} amefungua rufaa ya malipo`, `${who || "A user"} opened a payment appeal`),
        detail: t("Malipo yanafanyika nje ya mfumo; mhusika ameomba admin aingilie kati.", "Payment happens outside the platform; a party asked the admin to step in."),
      };
    case "PROOF_REJECTED_MAX":
      return {
        title: t("Uthibitisho umekataliwa mara 3", "Proof rejected 3 times"),
        detail: t("Mnunuzi ametumia majaribio yote; muuzaji bado anasema hajapokea malipo.", "The buyer used all attempts; the seller still says payment was not received."),
      };
    case "SELLER_NO_RESPONSE":
      return {
        title: t("Muuzaji hakujibu kwa wakati", "Seller did not respond in time"),
        detail: t("Hakuna jibu ndani ya saa 1 baada ya mnunuzi kupakia uthibitisho.", "No response within 1 hour after the buyer uploaded proof."),
      };
    default:
      break;
  }
  if (ps.buyerDecision === "NOT_AS_DESCRIBED")
    return {
      title: t("Mnunuzi anasema mali si kama ilivyoelezwa", "Buyer says the property is not as described"),
      detail: ps.buyerDecisionNote || "",
    };
  if (ps.buyerDecision === "REQUEST_NEGOTIATION")
    return {
      title: t("Mnunuzi ameomba kujadiliana tena baada ya ukaguzi", "Buyer asked to renegotiate after inspection"),
      detail: ps.buyerDecisionNote || "",
    };
  return { title: t("Mgogoro umefunguliwa", "A dispute was opened"), detail: "" };
}

export default function AppealReasonCard({ deal, lang }) {
  const raw = deal?.paymentState || null;
  if (!raw || raw.awaiting !== "admin") return null;
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const r = reasonOf(raw, lang);

  return (
    <div
      style={{ borderColor: "rgba(193,80,46,0.4)", background: "rgba(193,80,46,0.08)" }}
      className="border rounded-lg px-3 py-2.5"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <AlertTriangle size={13} color={COLORS.rust} />
        <p className="text-[11px] font-bold uppercase" style={{ color: COLORS.rust }}>
          {t("Sababu ya Rufaa", "Appeal Reason")}
        </p>
      </div>
      <p className="text-xs font-semibold text-primary">{r.title}</p>
      {r.detail && <p className="text-[11px] text-secondary mt-0.5">{r.detail}</p>}
      {raw.disputeNote && (
        <p className="text-[11px] text-primary mt-1.5 rounded-md border border-[color:rgb(var(--c-hairline))] bg-card px-2 py-1.5">
          “{raw.disputeNote}”
        </p>
      )}
      <p className="text-[10px] text-muted mt-1.5">
        {t("Majaribio ya uthibitisho", "Proof attempts")}: {raw.proofAttempts ?? 0}/3
      </p>
    </div>
  );
}

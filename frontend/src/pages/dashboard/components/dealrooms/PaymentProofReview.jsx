import React, { useEffect, useState } from "react";
import { COLORS, formatTZS, timeAgo } from "../shared";
import { Check, Paperclip, ThumbsDown } from "lucide-react";
import { dealsApi } from "../../../../api/deals.js";

// ============================================================
// PAYMENT PROOF REVIEW
// ============================================================
export default function PaymentProofReview({ deal, onConfirm, onReject, lang }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [remote, setRemote] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [proofError, setProofError] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const stored = deal.paymentProof;
  const roomId = deal.dealRoomId || deal.id;

  // Picha ya uthibitisho haiji kwenye orodha ya deal — ipakie kutoka
  // endpoint ya payment-proof ya seva.
  useEffect(() => {
    let alive = true;
    if (typeof dealsApi.paymentProof !== "function") return undefined;
    setLoadingProof(true);
    setProofError(false);
    dealsApi
      .paymentProof(roomId)
      .then((res) => {
        if (alive) setRemote(res || null);
      })
      .catch(() => {
        if (alive) setProofError(true);
      })
      .finally(() => {
        if (alive) setLoadingProof(false);
      });
    return () => {
      alive = false;
    };
  }, [roomId, stored?.submittedAt]);

  const proof =
    stored || remote
      ? {
          reference: stored?.reference || remote?.reference || "",
          submittedAt: stored?.submittedAt || remote?.uploaded_at || null,
          imageUrl: remote?.url || stored?.dataUrl || null,
        }
      : null;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    try {
      await onReject(reason.trim());
      setRejecting(false);
      setReason("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="border-t px-3 sm:px-4 py-3 flex flex-col gap-3"
    >
      <div className="flex flex-col items-center text-center gap-2">
        <Paperclip size={14} color={COLORS.night} />
        <p className="text-primary text-body-sm font-semibold">
          {lang === "sw"
            ? "Uthibitisho wa Malipo kutoka kwa Mnunuzi"
            : "Payment Proof from Buyer"}
        </p>
      </div>

      {loadingProof && !proof?.imageUrl && (
        <p className="text-muted text-body-sm text-center">
          {lang === "sw" ? "Inapakia picha..." : "Loading image..."}
        </p>
      )}
      {proofError && !proof?.imageUrl && (
        <p style={{ color: COLORS.rust }} className="text-body-sm text-center">
          {lang === "sw"
            ? "Imeshindwa kupakia picha ya uthibitisho. Jaribu tena baadaye."
            : "Could not load the proof image. Try again later."}
        </p>
      )}

      {proof && (
        <div
          style={{
            borderColor: COLORS.sandLine,
            background: COLORS.sand,
          }}
          className="rounded-xl border p-3 flex items-center gap-3"
        >
          {proof.imageUrl && (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="shrink-0"
              aria-label={lang === "sw" ? "Fungua picha" : "Open image"}
            >
              <img
                src={proof.imageUrl}
                alt="Payment receipt"
                className="w-16 h-16 rounded-lg object-cover"
              />
            </button>
          )}
          <div className="min-w-0 text-body-sm">
            <p className="text-primary font-semibold">
              {formatTZS(deal.currentOffer)}
            </p>
            {proof.reference && (
              <p className="text-secondary mt-0.5">
                Ref: <span className="font-mono">{proof.reference}</span>
              </p>
            )}
            {proof.submittedAt && (
              <p className="text-muted mt-0.5">
                {lang === "sw" ? "Zimetumwa" : "Submitted"}{" "}
                {timeAgo(proof.submittedAt, lang)}
              </p>
            )}
            {proof.imageUrl && (
              <a
                href={proof.imageUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: COLORS.green }}
                className="font-semibold"
              >
                {lang === "sw" ? "Fungua picha kubwa" : "Open full image"}
              </a>
            )}
          </div>
        </div>
      )}

      {lightbox && proof?.imageUrl && (
        <div
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
        >
          <img
            src={proof.imageUrl}
            alt="Payment receipt"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}

      {!rejecting ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRejecting(true)}
            disabled={busy}
            style={{
              borderColor: "rgba(193,80,46,0.35)",
              color: COLORS.rust,
            }}
            className="flex items-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg border disabled:opacity-50"
          >
            <ThumbsDown size={13} />{" "}
            {lang === "sw" ? "Bado Sijapokea" : "Not Received Yet"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            style={{ background: COLORS.green, color: "white" }}
            className="flex-1 flex items-center justify-center gap-1.5 text-body-sm font-semibold px-3 py-2.5 rounded-lg disabled:opacity-70"
          >
            <Check size={14} />{" "}
            {busy
              ? lang === "sw"
                ? "Inathibitisha..."
                : "Confirming..."
              : lang === "sw"
                ? "Nimepokea Malipo — Kamilisha"
                : "Payment Received — Complete"}
          </button>
        </div>
      ) : (
        <>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              lang === "sw"
                ? "Kwa nini bado hujapokea? (hiari)"
                : "Why haven't you received it? (optional)"
            }
            rows={2}
            style={{
              background: COLORS.sand,
              borderColor: COLORS.sandLine,
              color: COLORS.night,
            }}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none text-center"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRejecting(false)}
              disabled={busy}
              style={{
                borderColor: COLORS.sandLine,
                color: COLORS.night,
              }}
              className="text-body-sm font-semibold px-3 py-2 rounded-lg border disabled:opacity-50"
            >
              {lang === "sw" ? "Ghairi" : "Cancel"}
            </button>
            <button
              onClick={handleReject}
              disabled={busy}
              style={{ background: COLORS.rust, color: "white" }}
              className="flex-1 text-body-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-60"
            >
              {lang === "sw"
                ? "Tuma — Muulize Mnunuzi Apakie Tena"
                : "Send — Ask Buyer to Re-upload"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

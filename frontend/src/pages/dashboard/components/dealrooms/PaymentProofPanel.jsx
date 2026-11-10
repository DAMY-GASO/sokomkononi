import React, { useRef, useState } from "react";
import { COLORS, formatTZS } from "../shared";
import { FileImage, Upload } from "lucide-react";

// ============================================================
// PAYMENT PROOF PANEL
// ============================================================
export default function PaymentProofPanel({ deal, onSubmit, lang }) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const canSubmit = !!file && reference.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        file,
        fileName,
        dataUrl: preview,
        reference: reference.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="border-t px-3 sm:px-4 py-3 flex flex-col gap-3"
    >
      <div className="flex flex-col items-center text-center gap-2">
        <Upload size={14} color={COLORS.night} />
        <p className="text-primary text-body-sm font-semibold">
          {lang === "sw"
            ? `Pakia Uthibitisho wa Malipo ya Mwisho — ${formatTZS(
                deal.currentOffer
              )}`
            : `Upload Final Payment Proof — ${formatTZS(
                deal.currentOffer
              )}`}
        </p>
        <p className="text-secondary text-body-sm max-w-md mx-auto">
          {lang === "sw"
            ? `Lipa ${formatTZS(
                deal.currentOffer
              )} moja kwa moja kwa muuzaji , kisha pakia risiti au screenshot ya malipo hapa.`
            : `Pay ${formatTZS(
                deal.currentOffer
              )} directly to the seller , then upload the receipt or payment screenshot here.`}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div
          style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
          className="rounded-xl border p-2.5 flex items-center gap-3"
        >
          <img
            src={preview}
            alt="Receipt"
            className="w-14 h-14 rounded-lg object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-primary text-body-sm font-medium truncate">
              {fileName}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ color: COLORS.green }}
              className="text-body-sm font-semibold"
            >
              {lang === "sw" ? "Badilisha picha" : "Change image"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            borderColor: COLORS.sandLine,
            color: "rgba(16,26,46,0.55)",
          }}
          className="rounded-xl border-2 border-dashed py-5 flex flex-col items-center gap-1.5"
        >
          <FileImage size={22} color="rgba(16,26,46,0.35)" />
          <span className="text-body-sm font-medium">
            {lang === "sw"
              ? "Bofya kupakia risiti/screenshot"
              : "Click to upload receipt/screenshot"}
          </span>
        </button>
      )}

      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder={
          lang === "sw"
            ? "Namba ya muamala / Reference (mf. QGH7X92K1)"
            : "Transaction number / Reference (e.g. QGH7X92K1)"
        }
        style={{
          background: COLORS.sand,
          borderColor: COLORS.sandLine,
          color: COLORS.night,
        }}
        className="w-full rounded-lg border px-3 py-2 text-sm outline-none text-center"
      />

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          background: canSubmit ? COLORS.green : COLORS.sandLine,
          color: canSubmit ? "white" : "rgba(16,26,46,0.4)",
        }}
        className="text-body-sm font-semibold px-3 py-2.5 rounded-lg disabled:cursor-not-allowed"
      >
        {submitting
          ? lang === "sw"
            ? "Inatuma..."
            : "Submitting..."
          : lang === "sw"
            ? "Tuma Uthibitisho wa Malipo"
            : "Submit Payment Proof"}
      </button>
    </div>
  );
}

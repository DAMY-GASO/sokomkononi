import React, { useState } from "react";
import { Ban, Loader2, X } from "lucide-react";
import { COLORS } from "./constants.js";
import { useLanguage } from "../../../../context/LanguageContext.jsx";

export default function SuspendUserModal({ user, onClose, onConfirm, busy }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [reason, setReason] = useState("");

  const reasonOk = reason.trim().length >= 5;
  const canSubmit = reasonOk && !busy;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onConfirm({ reason: reason.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-hairline">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(193,80,46,0.12)" }}
            >
              <Ban size={18} style={{ color: COLORS.dangerText }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary">
                {t("Simamisha Mtumiaji?", "Suspend User?")}
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                {t(
                  "Mtumiaji hataweza kuingia wala kuweka mali mpya.",
                  "User will not be able to log in or post new listings."
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-secondary">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-page border border-hairline p-3">
            <p className="text-xs font-semibold text-primary">
              {t("Mtumiaji:", "User:")}
            </p>
            <p className="text-sm font-bold text-primary mt-1">{user.name}</p>
            <p className="text-xs text-secondary">{user.email}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary mb-1.5">
              {t("Sababu ya kusimamisha", "Reason for suspension")}{" "}
              <span style={{ color: COLORS.dangerText }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t(
                "Mfano: Malalamiko mengi, udanganyifu, ukiukaji wa sheria...",
                "E.g. Multiple complaints, fraud, rule violation..."
              )}
              className="textarea resize-none"
            />
            <p className="text-[11px] text-muted mt-1">
              {t("Herufi 5+ zinahitajika", "5+ characters required")} ({reason.trim().length})
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-hairline">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-secondary hover:bg-ink/5 disabled:opacity-50"
          >
            {t("Ghairi", "Cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              background: canSubmit ? COLORS.rust : "rgba(193,80,46,0.4)",
              color: "white",
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("Inasimamisha...", "Suspending...")}
              </>
            ) : (
              <>
                <Ban size={14} />
                {t("Simamisha", "Suspend")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
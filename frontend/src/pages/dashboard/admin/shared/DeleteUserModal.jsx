import React, { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { COLORS } from "./constants.js";
import { useLanguage } from "../../../../context/LanguageContext.jsx";

export default function DeleteUserModal({ user, onClose, onConfirm, busy }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const reasonOk = reason.trim().length >= 5;
  const confirmOk = confirmText.trim() === "DELETE";
  const canSubmit = reasonOk && confirmOk && !busy;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onConfirm({
      reason: reason.trim(),
      confirmText: confirmText.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(193,80,46,0.12)" }}
            >
              <AlertTriangle size={18} color={COLORS.rust} />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary">
                {t("Futa Mtumiaji Kabisa?", "Permanently Delete User?")}
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                {t("Hatua hii HAIWEZI kurudishwa.", "This action CANNOT be undone.")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-secondary">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-100 p-3">
            <p className="text-xs font-semibold text-primary">
              {t("Utakayemfuta:", "You are about to delete:")}
            </p>
            <p className="text-sm font-bold text-primary mt-1">{user.name}</p>
            <p className="text-xs text-secondary">{user.email}</p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-primary mb-1.5">
              {t("Sababu ya kufuta", "Reason for deletion")}{" "}
              <span style={{ color: COLORS.rust }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t(
                "Mfano: Akaunti fake, udanganyifu, ombi la mtumiaji...",
                "E.g. Fake account, fraud, user request..."
              )}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold resize-none"
            />
            <p className="text-[11px] text-muted mt-1">
              {t("Herufi 5+ zinahitajika", "5+ characters required")} ({reason.trim().length})
            </p>
          </div>

          {/* Confirm text */}
          <div>
            <label className="block text-xs font-semibold text-primary mb-1.5">
              {t('Andika "DELETE" kuthibitisha', 'Type "DELETE" to confirm')}{" "}
              <span style={{ color: COLORS.rust }}>*</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-secondary hover:bg-gray-50 disabled:opacity-50"
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
                {t("Inafuta...", "Deleting...")}
              </>
            ) : (
              <>
                <Trash2 size={14} />
                {t("Futa Kabisa", "Delete Permanently")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
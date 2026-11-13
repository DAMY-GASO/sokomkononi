import React from "react";
import { COLORS } from "../shared";
import { Check } from "lucide-react";

// ============================================================
// RESERVATION SUCCESS MODAL
// ============================================================
export default function ReservationSuccessModal({ open, onClose, onContinueDeal, onGoToReservations, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: COLORS.green }}
        >
          <Check color="white" size={32} />
        </div>
        <h3 className="text-lg font-bold text-primary mb-2">
          {t("Reservation imekamilika!", "Reservation Complete!")}
        </h3>
        <p className="text-sm text-secondary mb-5 leading-relaxed">
          {t(
            "Mali imehifadhiwa kwa ajili yako. Muuzaji hawezi kuuza kwa mtu mwingine hadi muda uishe. Unaweza kuendelea na mazungumzo au uangalie My Reservations.",
            "The property is held for you. The seller can't sell to someone else until the time ends. You can continue chatting or check My Reservations."
          )}
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onContinueDeal}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-colors hover:opacity-90"
            style={{ background: COLORS.gold, color: COLORS.night }}
          >
            {t("Endelea na Deal Room", "Continue to Deal Room")}
          </button>
          <button
            onClick={onGoToReservations}
            className="w-full py-3 rounded-xl font-semibold text-sm border transition-colors hover:bg-gray-50"
            style={{
              borderColor: COLORS.sandLine,
              color: COLORS.night,
              background: "white",
            }}
          >
            {t("Nenda kwenye My Reservations", "Go to My Reservations")}
          </button>
        </div>
      </div>
    </div>
  );
}

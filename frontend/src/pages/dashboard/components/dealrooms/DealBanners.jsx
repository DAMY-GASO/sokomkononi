import React from "react";
import { ArrowRight, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { COLORS } from "../shared";

export default function DealBanners({ canReserve, deal, freeReserving, handleFreeReserve, isBuyer, isLocked, lang, navigate, reservationEnabled, reserveModalOpen, setReserveModalOpen, showReservedBanner }) {
  return (
    <>
{/* ── MPYA: Lock banner (juu kabisa, inaonekana kwa pande zote) ── */}
      {isLocked && (
        <div
          className="border-b px-3 sm:px-4 py-3 flex items-start gap-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(232,163,61,0.18) 0%, rgba(232,163,61,0.08) 100%)",
            borderColor: "rgba(232,163,61,0.4)",
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#8A5A16" }}
          >
            <Lock size={16} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "#8A5A16" }}>
              {lang === "sw"
                ? "Room Imesimamishwa na Msimamizi"
                : "Room Suspended by Admin"}
            </p>
            <p className="text-xs text-secondary mt-0.5 leading-relaxed">
              {deal.lockedReason
                ? lang === "sw"
                  ? `Sababu: ${deal.lockedReason}`
                  : `Reason: ${deal.lockedReason}`
                : lang === "sw"
                  ? "Ujumbe na ofa hazipokelewi hadi ukaguzi ukamilike."
                  : "Messages and offers are paused until review is complete."}
            </p>
            {deal.lockedByName && (
              <p className="text-[11px] text-muted mt-0.5">
                {lang === "sw" ? "Na" : "By"}: {deal.lockedByName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 🛠️ RESERVE BANNER — wazi kwa buyer, canReserve */}
      {isBuyer && canReserve && !reserveModalOpen && (
        <div
          className="border-b px-3 sm:px-4 py-3 flex items-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(47,109,79,0.12) 0%, rgba(37,107,68,0.08) 100%)",
            borderColor: "rgba(47,109,79,0.25)",
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: COLORS.green }}
          >
            <ShieldCheck size={18} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold"
              style={{ color: COLORS.green }}
            >
              {lang === "sw"
                ? "Hifadhi Mali Hii"
                : "Reserve This Property"}
            </p>
            <p className="text-xs text-secondary mt-0.5">
              {reservationEnabled
                ? lang === "sw"
                  ? "Lipia Reservation Fee ili muuzaji asiiuze kwa mtu mwingine."
                  : "Pay the Reservation Fee so the seller can't sell to someone else."
                : lang === "sw"
                  ? "Reservation ni BURE kwa sasa — hifadhi mali ili muuzaji asiiuze kwa mtu mwingine."
                  : "Reservation is FREE right now — hold the property so the seller can't sell to someone else."}
            </p>
          </div>
          <button
            onClick={
              reservationEnabled
                ? () => setReserveModalOpen(true)
                : handleFreeReserve
            }
            disabled={freeReserving}
            style={{ background: COLORS.green, color: "white" }}
            className="shrink-0 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {freeReserving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : reservationEnabled ? (
              <CreditCard size={13} />
            ) : (
              <ShieldCheck size={13} />
            )}
            {reservationEnabled
              ? lang === "sw"
                ? "Reserve Sasa"
                : "Reserve Now"
              : lang === "sw"
                ? "Hifadhi Bure"
                : "Reserve Free"}
          </button>
        </div>
      )}

      {/* 🛠️ PROPERTY RESERVED BANNER */}
      {showReservedBanner && deal.status === "reserved" && (
        <div
          className="border-b px-3 sm:px-4 py-3 flex items-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(30,58,138,0.08) 100%)",
            borderColor: "rgba(37,99,235,0.25)",
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#2563EB" }}
          >
            <ShieldCheck size={18} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "#1E3A8A" }}>
              {lang === "sw"
                ? "Mali Imehifadhiwa kwa Ajili Yako"
                : "Property Reserved for You"}
            </p>
            <p className="text-xs text-secondary mt-0.5">
              {lang === "sw"
                ? `Inaisha ${new Date(
                    deal.reservationExpiresAt || Date.now() + 24 * 3600000
                  ).toLocaleString("sw-TZ")}`
                : `Ends ${new Date(
                    deal.reservationExpiresAt || Date.now() + 24 * 3600000
                  ).toLocaleString("en-US")}`}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/buyer/reservations")}
            style={{ background: "#2563EB", color: "white" }}
            className="shrink-0 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <ArrowRight size={13} />
            {lang === "sw" ? "Ona Reservations" : "View Reservations"}
          </button>
        </div>
      )}
    </>
  );
}

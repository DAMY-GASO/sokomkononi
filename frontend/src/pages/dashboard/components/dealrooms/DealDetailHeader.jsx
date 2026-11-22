import React from "react";
import { ArrowLeft, CheckCircle2, Flag, LogOut, MapPin, MoreVertical, UserRound } from "lucide-react";
import { COLORS, formatTZS } from "../shared";
import { Link } from "react-router-dom";

export default function DealDetailHeader({ CategoryIcon, counterpartyLabel, deal, handleExit, isBuyer, isLocked, lang, menuOpen, menuRef, onBack, onInspectionResolve, setContactDrawerOpen, setMenuOpen, setReportOpen, side, status }) {
  return (
    <>
{/* Header */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "rgb(var(--c-card))" }}
        className="flex items-center gap-3 border-b p-3 sm:p-4"
      >
        <button onClick={onBack} className="md:hidden shrink-0" aria-label="Back">
          <ArrowLeft size={18} color={COLORS.night} />
        </button>
        <div
          style={{ background: COLORS.night }}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        >
          {CategoryIcon && <CategoryIcon size={16} color={COLORS.gold} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-primary text-sm font-semibold truncate">
            {deal.counterpartyName}{" "}
            <span className="text-muted font-normal">· {counterpartyLabel}</span>
          </p>
          {deal.listingId ? (
            <Link
              to={`/mali/${deal.listingId}`}
              className="text-secondary text-body-sm truncate flex items-center gap-1 hover:text-gold-ink transition-colors"
            >
              <MapPin size={10} /> {deal.listingTitle}
            </Link>
          ) : (
            <p className="text-secondary text-body-sm truncate flex items-center gap-1">
              <MapPin size={10} /> {deal.listingTitle}
            </p>
          )}
        </div>
        <span
          style={{
            background: status?.bg || COLORS.sand,
            color: status?.fg || COLORS.night,
          }}
          className="text-body-sm font-semibold px-2.5 py-1 rounded-full shrink-0"
        >
          {status?.label || deal.status || "—"}
        </span>

        <button
          onClick={() => setReportOpen(true)}
          style={{ color: COLORS.rust }}
          className="shrink-0 p-1.5 rounded-full hover:bg-rust/10 transition-colors"
          title={
            side === "buyer"
              ? lang === "sw"
                ? "Ripoti Muuzaji"
                : "Report Seller"
              : lang === "sw"
                ? "Ripoti Mnunuzi"
                : "Report Buyer"
          }
        >
          <Flag size={16} />
        </button>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{ color: COLORS.night }}
            className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
            aria-label={lang === "sw" ? "Menyu" : "Menu"}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              style={{
                background: "rgb(var(--c-card))",
                borderColor: COLORS.sandLine,
                boxShadow: "0 12px 32px rgba(1,25,87,0.18)",
              }}
              className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border py-1.5"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setContactDrawerOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-black/5"
                style={{ color: COLORS.night }}
              >
                <UserRound size={16} />
                {isBuyer
                  ? lang === "sw"
                    ? "Profile ya Muuzaji"
                    : "Seller's Profile"
                  : lang === "sw"
                    ? "Profile ya Mnunuzi"
                    : "Buyer's Profile"}
              </button>

              {isBuyer && deal.status === "reserved" && !isLocked && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onInspectionResolve(
                      deal.id,
                      "READY_FOR_FINAL_PAYMENT",
                      ""
                    );
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-black/5"
                  style={{ color: COLORS.green }}
                >
                  <CheckCircle2 size={16} />
                  {lang === "sw"
                    ? "Nimeridhika — Kamilisha Deal"
                    : "I'm satisfied — Finalize Deal"}
                </button>
              )}

              <div
                style={{ borderColor: COLORS.sandLine }}
                className="my-1 border-t"
              />

              <button
                role="menuitem"
                onClick={handleExit}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-black/5"
                style={{ color: COLORS.rust }}
              >
                <LogOut size={16} />
                {lang === "sw" ? "Toka kwenye Deal Room" : "Exit this deal room"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Price strip */}
      <div
        style={{ background: COLORS.sandLine }}
        className="flex items-center justify-between px-4 py-2 text-body-sm"
      >
        <span className="text-secondary">
          {lang === "sw" ? "Bei Iliyowekwa" : "Asking Price"}:{" "}
          {formatTZS(deal.askingPrice)}
        </span>
        <span style={{ color: COLORS.rust }} className="font-semibold">
          {lang === "sw" ? "Ofa ya Sasa" : "Current Offer"}:{" "}
          {formatTZS(deal.currentOffer)}
        </span>
      </div>
    </>
  );
}

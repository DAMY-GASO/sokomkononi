import React, { useState, useEffect } from "react";
import { TrendingUp, Check, MapPin, Search, Clock } from "lucide-react";
import {
  COLORS,
  FONTS,
  getCategory,
  formatTZS,
  isLeadingActive,
  leadingDaysRemaining,
  applyLeading,
} from "./shared";
import { useLeadingFeeConfig } from "../../../config/leadingFeeStore.js";
import { notifyLeadingPurchased } from "../../../config/notificationsStore.js";
import { addTransaction } from "../../../config/transactionsStore.js"; 
import PaymentGateway from "./PaymentGateway";

function ListingPicker({ listings, selectedId, onSelect }) {
  if (listings.length === 0) {
    return (
      <div
        style={{ borderColor: COLORS.sandLine }}
        className="rounded-2xl border-2 border-dashed p-8 text-center"
      >
        <p style={{ color: "rgba(16,26,46,0.45)" }} className="text-sm">
          Huna mali yoyote iliyo Live kwa sasa. Leading Fee inapatikana tu
          kwa mali zilizochapishwa.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {listings.map((l) => {
        const category = getCategory(l.category);
        const Icon = category?.icon;
        const active = l.id === selectedId;
        const leading = isLeadingActive(l);
        return (
          <button
            key={l.id}
            onClick={() => onSelect(l.id)}
            style={{
              borderColor: active ? COLORS.gold : COLORS.sandLine,
              background: active ? "rgba(232,163,61,0.08)" : "white",
            }}
            className="flex items-center gap-3 p-3 rounded-xl border text-left transition-colors"
          >
            <div
              style={{ background: COLORS.night }}
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
            >
              {Icon && <Icon size={18} color={COLORS.gold} />}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: COLORS.night }} className="text-sm font-semibold truncate">
                {l.title}
              </p>
              <p style={{ color: "rgba(16,26,46,0.5)" }} className="flex items-center gap-1 text-xs">
                <MapPin size={11} /> {l.location}
              </p>
            </div>
            {leading && (
              <span
                style={{ background: "rgba(47,109,79,0.14)", color: COLORS.green }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full shrink-0"
              >
                <TrendingUp size={11} /> Siku {leadingDaysRemaining(l)} zimebaki
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function LeadingSasa({ listings = [], initialListingId = null, onLead = () => {} }) {
  const liveListings = listings.filter((l) => l.status === "live");
  const leadingFee = useLeadingFeeConfig();
  const [selectedId, setSelectedId] = useState(
    initialListingId && liveListings.some((l) => l.id === initialListingId)
      ? initialListingId
      : liveListings[0]?.id ?? null
  );
  const [stage, setStage] = useState("select"); // select | paying | done
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (initialListingId && liveListings.some((l) => l.id === initialListingId)) {
      setSelectedId(initialListingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialListingId]);

  const selectedListing = liveListings.find((l) => l.id === selectedId);
  const canLead = Boolean(selectedListing);

  const handleConfirm = () => {
    if (!canLead) return;
    setStage("paying");
  };

  const handlePaymentSuccess = () => {
    const patch = applyLeading(selectedListing);
    onLead(selectedListing.id, patch);

    // 1) Taarifa (user + admin)
    notifyLeadingPurchased({
      listingId: selectedListing.id,
      listingTitle: selectedListing.title,
      expiresAt: patch.leadingExpiresAt,
      amount: leadingFee.price,
    });

    // 2) === MPYA: rekodi transaction kwenye My Transactions ===
    addTransaction({
      type: "leading",
      title: `${leadingFee.label} — ${selectedListing.title}`,
      property: selectedListing.title,
      amount: leadingFee.price,
      status: "completed",
      method: "M-Pesa", // PaymentGateway bado halirudishi method halisi
      listingId: selectedListing.id,
    });

    setDone({ listing: selectedListing, expiresAt: patch.leadingExpiresAt });
    setStage("done");
  };

  if (stage === "done" && done) {
    return (
      <div
        style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "600px" }}
        className="w-full flex items-center justify-center p-6"
      >
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="max-w-md w-full text-center bg-white rounded-2xl border p-8"
        >
          <div
            style={{ background: COLORS.green }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <TrendingUp color="white" size={24} />
          </div>
          <h2 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl font-semibold mb-2">
            Leading Fee Imewekwa
          </h2>
          <p style={{ color: "rgba(16,26,46,0.65)" }} className="text-sm mb-5">
            "{done.listing.title}" sasa itaonekana JUU ya matokeo ya
            utafutaji na kivinjari (browse) hadi{" "}
            {new Date(done.expiresAt).toLocaleDateString("sw-TZ", {
              day: "numeric",
              month: "long",
            })}
            .
          </p>
          <button
            onClick={() => {
              setDone(null);
              setStage("select");
            }}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            Weka Leading Nyingine
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "600px" }} className="w-full p-4 sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-2xl mx-auto">
        <h1 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl sm:text-3xl font-semibold mb-1">
          Leading Fee
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-6">
          Pandisha bidhaa yako JUU kabisa ya matokeo ya utafutaji kwa
          wanunuzi wote — kipaumbele maalum, si tu "featured".
        </p>

        {stage !== "paying" && (
          <>
            <div className="flex flex-col gap-2 mb-3">
              <span style={{ color: COLORS.night }} className="text-sm font-medium">
                Chagua Mali (Live pekee)
              </span>
            </div>
            <div className="mb-6">
              <ListingPicker listings={liveListings} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </>
        )}

        {liveListings.length > 0 && (
          <>
            {stage === "paying" ? (
              <PaymentGateway
                amount={leadingFee.price}
                title={leadingFee.label}
                description={`Leading Fee kwa "${selectedListing.title}" — siku ${leadingFee.days}`}
                onCancel={() => setStage("select")}
                onSuccess={handlePaymentSuccess}
              />
            ) : (
              <>
                <div
                  style={{ borderColor: COLORS.sandLine, background: "white" }}
                  className="rounded-2xl border p-4 flex items-start gap-3 mb-4"
                >
                  <div
                    style={{ background: `${COLORS.green}15` }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Search size={18} color={COLORS.green} />
                  </div>
                  <div>
                    <p style={{ color: COLORS.night }} className="text-sm font-semibold mb-0.5">
                      {leadingFee.label} — siku {leadingFee.days}
                    </p>
                    <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs">
                      {leadingFee.desc}
                    </p>
                  </div>
                </div>

                {selectedListing && isLeadingActive(selectedListing) && (
                  <div
                    style={{ background: "rgba(47,109,79,0.1)", color: COLORS.green }}
                    className="flex items-center gap-2 text-xs rounded-lg px-3 py-2.5 mb-4"
                  >
                    <Clock size={14} />
                    Mali hii tayari ina Leading inayoisha baada ya siku{" "}
                    {leadingDaysRemaining(selectedListing)} — ukiendelea, siku{" "}
                    {leadingFee.days} zaidi zitaongezwa baada ya hapo.
                  </div>
                )}

                <div
                  style={{ borderColor: COLORS.sandLine, background: "white" }}
                  className="rounded-2xl border p-4 flex items-center justify-between mb-4"
                >
                  <div>
                    <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs mb-0.5">
                      Jumla ya Malipo
                    </p>
                    <p style={{ color: COLORS.rust }} className="text-lg font-bold">
                      {formatTZS(leadingFee.price)}
                    </p>
                  </div>
                  <button
                    onClick={handleConfirm}
                    disabled={!canLead}
                    style={{
                      background: canLead ? COLORS.gold : COLORS.sandLine,
                      color: canLead ? COLORS.night : "rgba(16,26,46,0.4)",
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
                  >
                    <TrendingUp size={15} />
                    Lipa na Panda Juu
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LeadingSasa.jsx
// Leading — inatumia credits kama user ana, vinginevyo cash.
// Bilingual kamili + centered + credits integration.
// ============================================================

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Check,
  MapPin,
  Search,
  Clock,
  Wallet,
} from "lucide-react";
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
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  checkCredit,
  consumeCredit,
} from "../../../config/userCreditsStore.js";
import PaymentGateway from "./PaymentGateway";

// ============================================================
// HELPER — kuchagua lugha sahihi kwa field inayoweza kuwa { sw, en }
// ============================================================
function getLocalized(field, lang) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field?.[lang] || field?.sw || "";
}

function ListingPicker({ listings, selectedId, onSelect, lang }) {
  if (listings.length === 0) {
    return (
      <div
        style={{ borderColor: COLORS.sandLine }}
        className="rounded-2xl border-2 border-dashed p-8 text-center"
      >
        <p style={{ color: "rgba(16,26,46,0.45)" }} className="text-sm">
          {lang === "sw"
            ? "Huna mali yoyote iliyo Live kwa sasa. Leading Fee inapatikana tu kwa mali zilizochapishwa."
            : "You don't have any Live listings right now. Leading Fee is only available for published properties."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {listings.map((l) => {
        const category = getCategory(l.category);
        const Icon = getCategoryIcon(category?.iconKey);
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
              <p
                style={{ color: COLORS.night }}
                className="text-sm font-semibold truncate"
              >
                {l.title}
              </p>
              <p
                style={{ color: "rgba(16,26,46,0.5)" }}
                className="flex items-center gap-1 text-xs"
              >
                <MapPin size={11} /> {l.location}
              </p>
            </div>
            {leading && (
              <span
                style={{
                  background: "rgba(47,109,79,0.14)",
                  color: COLORS.green,
                }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full shrink-0"
              >
                <TrendingUp size={11} />{" "}
                {lang === "sw"
                  ? `Siku ${leadingDaysRemaining(l)} zimebaki`
                  : `${leadingDaysRemaining(l)} days left`}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function LeadingSasa({
  listings = [],
  initialListingId = null,
  onLead = () => {},
}) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const liveListings = listings.filter((l) => l.status === "live");
  const leadingFee = useLeadingFeeConfig();
  const [selectedId, setSelectedId] = useState(
    initialListingId && liveListings.some((l) => l.id === initialListingId)
      ? initialListingId
      : liveListings[0]?.id ?? null
  );
  const [stage, setStage] = useState("select"); // select | paying | done
  const [done, setDone] = useState(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (
      initialListingId &&
      liveListings.some((l) => l.id === initialListingId)
    ) {
      setSelectedId(initialListingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialListingId]);

  const selectedListing = liveListings.find((l) => l.id === selectedId);
  const canLead = Boolean(selectedListing);

  // ============================================================
  // CREDITS — angalia kama user ana leading credits
  // ============================================================
  const creditInfo = checkCredit(user?.id, "leading");
  const hasCredit = creditInfo.hasCredit;

  const leadingLabel = getLocalized(leadingFee.label, lang);
  const leadingDesc = getLocalized(leadingFee.desc, lang);

  const handleConfirm = () => {
    if (!canLead) return;
    setStage("paying");
  };

  // ============================================================
  // USE CREDIT
  // ============================================================
  const handleUseCredit = () => {
    if (!canLead || !user) return;

    const result = consumeCredit(user.id, "leading");
    if (!result.success) {
      setStage("paying");
      return;
    }

    handlePaymentSuccess("credits");
  };

  const handlePaymentSuccess = (method = "cash") => {
    const patch = applyLeading(selectedListing);
    onLead(selectedListing.id, patch);

    // Taarifa
    notifyLeadingPurchased({
      listingId: selectedListing.id,
      listingTitle: selectedListing.title,
      expiresAt: patch.leadingExpiresAt,
      amount: method === "credits" ? 0 : leadingFee.price,
      paidWith: method,
    });

    // Rekodi transaction
    if (method === "cash") {
      addTransaction({
        type: "leading",
        title: `${leadingLabel} — ${selectedListing.title}`,
        property: selectedListing.title,
        amount: leadingFee.price,
        status: "completed",
        method: "M-Pesa",
        listingId: selectedListing.id,
      });
    } else {
      addTransaction({
        type: "leading",
        title: `${leadingLabel} — ${selectedListing.title} (Credits)`,
        property: selectedListing.title,
        amount: 0,
        status: "completed",
        method: "Credits",
        listingId: selectedListing.id,
      });
    }

    setDone({
      listing: selectedListing,
      expiresAt: patch.leadingExpiresAt,
      paidWith: method,
    });
    setStage("done");
  };

  // ============================================================
  // DONE STATE
  // ============================================================
  if (stage === "done" && done) {
    return (
      <div
        style={{
          background: COLORS.sand,
          fontFamily: FONTS.body,
          minHeight: "600px",
        }}
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
          <h2
            style={{ fontFamily: FONTS.display, color: COLORS.night }}
            className="text-2xl font-semibold mb-2"
          >
            {t("Leading Fee Imewekwa", "Leading Fee Applied")}
          </h2>
          <p
            style={{ color: "rgba(16,26,46,0.65)" }}
            className="text-sm mb-5"
          >
            {lang === "sw" ? (
              <>
                "{done.listing.title}" sasa itaonekana JUU ya matokeo ya
                utafutaji na kivinjari (browse) hadi{" "}
                {new Date(done.expiresAt).toLocaleDateString("sw-TZ", {
                  day: "numeric",
                  month: "long",
                })}
                .
              </>
            ) : (
              <>
                "{done.listing.title}" will now appear at the TOP of search and
                browse results until{" "}
                {new Date(done.expiresAt).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                })}
                .
              </>
            )}
          </p>
          {done.paidWith === "credits" && (
            <p className="text-xs text-[#2F6D4F] mb-4">
              {t(
                `Umetumia credit 1 — balance: ${creditInfo.remaining - 1}`,
                `Used 1 credit — balance: ${creditInfo.remaining - 1}`
              )}
            </p>
          )}
          <button
            onClick={() => {
              setDone(null);
              setStage("select");
            }}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            {t("Weka Leading Nyingine", "Apply Leading to Another")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: COLORS.sand,
        fontFamily: FONTS.body,
        minHeight: "600px",
      }}
      className="w-full p-4 sm:p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* HEADER — CENTERED */}
        <div className="mb-6 text-center">
          <h1
            style={{ fontFamily: FONTS.display, color: COLORS.night }}
            className="text-2xl sm:text-3xl font-semibold"
          >
            {t("Ada ya Kipaumbele", "Leading Fee")}
          </h1>
          <p
            style={{ color: "rgba(16,26,46,0.6)" }}
            className="text-sm mt-2 max-w-xl mx-auto"
          >
            {t(
              'Pandisha bidhaa yako JUU kabisa ya matokeo ya utafutaji kwa wanunuzi wote — kipaumbele maalum, si tu "featured".',
              'Push your listing to the very TOP of search results for all buyers — real priority, not just "featured".'
            )}
          </p>
        </div>

        {/* CREDITS BANNER */}
        {hasCredit && stage !== "paying" && (
          <div className="rounded-xl bg-[#2F6D4F]/10 border border-[#2F6D4F]/25 px-4 py-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Wallet size={16} color={COLORS.green} />
              <span className="text-sm text-[#2F6D4F] font-medium">
                {t(
                  `Una Leading Credits ${creditInfo.remaining} — tumia bila kulipa`,
                  `You have ${creditInfo.remaining} Leading Credits — use for free`
                )}
              </span>
            </div>
            <button
              onClick={handleUseCredit}
              disabled={!canLead}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#2F6D4F] text-white disabled:opacity-50"
            >
              {t("Tumia Credit", "Use Credit")}
            </button>
          </div>
        )}

        {stage !== "paying" && (
          <>
            <div className="flex flex-col gap-2 mb-3 text-center">
              <span
                style={{ color: COLORS.night }}
                className="text-sm font-medium"
              >
                {t("Chagua Mali (Live pekee)", "Select Property (Live only)")}
              </span>
            </div>
            <div className="mb-6">
              <ListingPicker
                listings={liveListings}
                selectedId={selectedId}
                onSelect={setSelectedId}
                lang={lang}
              />
            </div>
          </>
        )}

        {liveListings.length > 0 && (
          <>
            {stage === "paying" ? (
              <PaymentGateway
                amount={leadingFee.price}
                title={leadingLabel}
                description={t(
                  `${leadingLabel} kwa "${selectedListing.title}" — siku ${leadingFee.days}`,
                  `${leadingLabel} for "${selectedListing.title}" — ${leadingFee.days} days`
                )}
                onCancel={() => setStage("select")}
                onSuccess={() => handlePaymentSuccess("cash")}
              />
            ) : (
              <>
                {/* Info card — centered */}
                <div
                  style={{ borderColor: COLORS.sandLine, background: "white" }}
                  className="rounded-2xl border p-4 flex flex-col items-center text-center gap-2 mb-4"
                >
                  <div
                    style={{ background: `${COLORS.green}15` }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Search size={18} color={COLORS.green} />
                  </div>
                  <div>
                    <p
                      style={{ color: COLORS.night }}
                      className="text-sm font-semibold mb-0.5"
                    >
                      {leadingLabel} —{" "}
                      {t(`siku ${leadingFee.days}`, `${leadingFee.days} days`)}
                    </p>
                    <p
                      style={{ color: "rgba(16,26,46,0.55)" }}
                      className="text-xs max-w-md mx-auto"
                    >
                      {leadingDesc}
                    </p>
                  </div>
                </div>

                {/* Warning — centered */}
                {selectedListing && isLeadingActive(selectedListing) && (
                  <div
                    style={{
                      background: "rgba(47,109,79,0.1)",
                      color: COLORS.green,
                    }}
                    className="flex flex-col items-center text-center gap-2 text-xs rounded-lg px-3 py-3 mb-4"
                  >
                    <Clock size={14} />
                    <span className="max-w-md">
                      {lang === "sw" ? (
                        <>
                          Mali hii tayari ina Leading inayoisha baada ya siku{" "}
                          {leadingDaysRemaining(selectedListing)} — ukiendelea,
                          siku {leadingFee.days} zaidi zitaongezwa baada ya
                          hapo.
                        </>
                      ) : (
                        <>
                          This listing already has Leading expiring in{" "}
                          {leadingDaysRemaining(selectedListing)} days — if you
                          continue, {leadingFee.days} more days will be added
                          after that.
                        </>
                      )}
                    </span>
                  </div>
                )}

                {/* Total + Buttons — centered */}
                <div
                  style={{ borderColor: COLORS.sandLine, background: "white" }}
                  className="rounded-2xl border p-4 flex flex-col items-center text-center gap-3 mb-4"
                >
                  <div>
                    <p
                      style={{ color: "rgba(16,26,46,0.55)" }}
                      className="text-xs mb-0.5"
                    >
                      {t("Jumla ya Malipo", "Total Payment")}
                    </p>
                    <p
                      style={{ color: COLORS.rust }}
                      className="text-lg font-bold"
                    >
                      {formatTZS(leadingFee.price)}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                    {hasCredit && (
                      <button
                        onClick={handleUseCredit}
                        disabled={!canLead}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-[#2F6D4F] text-white disabled:cursor-not-allowed"
                      >
                        <Wallet size={15} />
                        {t("Tumia Credit", "Use Credit")}
                      </button>
                    )}
                    <button
                      onClick={handleConfirm}
                      disabled={!canLead}
                      style={{
                        background: canLead ? COLORS.gold : COLORS.sandLine,
                        color: canLead ? COLORS.night : "rgba(16,26,46,0.4)",
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
                    >
                      <TrendingUp size={15} />
                      {t("Lipa na Panda Juu", "Pay and Promote")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
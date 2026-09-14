// ============================================================
// AdvertiseSasa.jsx
// Advertise — inatumia ads credits kama user ana, vinginevyo cash.
// Bilingual kamili + centered + credits integration.
// ============================================================

import React, { useState, useEffect } from "react";
import { Megaphone, MapPin, Clock, Sparkles, Wallet } from "lucide-react";
import { COLORS, FONTS, getCategory, formatTZS } from "./shared";
import { useAdvertisementFeeConfig } from "../../../config/advertisementFeeStore.js";
import {
  useActiveBannerAds,
  addBannerAd,
  bannerDaysRemaining,
} from "../../../config/bannerAdsStore.js";
import { notifyAdvertisementPurchased } from "../../../config/notificationsStore.js";
import { addTransaction } from "../../../config/transactionsStore.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  checkCredit,
  consumeCredit,
} from "../../../config/userCreditsStore.js";
import PaymentGateway from "./PaymentGateway";

function getLocalized(field, lang) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field?.[lang] || field?.sw || "";
}

function ListingPicker({
  listings,
  selectedId,
  onSelect,
  activeBannerListingIds,
  lang,
}) {
  if (listings.length === 0) {
    return (
      <div
        style={{ borderColor: COLORS.sandLine }}
        className="rounded-2xl border-2 border-dashed p-8 text-center"
      >
        <p style={{ color: "rgba(16,26,46,0.45)" }} className="text-sm">
          {lang === "sw"
            ? "Huna mali yoyote iliyo Live kwa sasa. Advertisement Fee inapatikana tu kwa mali zilizochapishwa."
            : "You don't have any Live listings right now. Advertisement Fee is only available for published properties."}
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
        const advertising = activeBannerListingIds.has(l.id);
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
            {advertising && (
              <span
                style={{
                  background: "rgba(193,80,46,0.14)",
                  color: COLORS.rust,
                }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full shrink-0"
              >
                <Megaphone size={11} />{" "}
                {lang === "sw" ? "Tayari inatangazwa" : "Already advertised"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function AdvertiseSasa({
  listings = [],
  initialListingId = null,
  onAdvertised = () => {},
}) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const liveListings = listings.filter((l) => l.status === "live");
  const adFee = useAdvertisementFeeConfig();
  const activeBanners = useActiveBannerAds();
  const activeBannerListingIds = new Set(
    activeBanners.map((b) => b.listingId)
  );

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
  const alreadyAdvertising = selectedListing
    ? activeBannerListingIds.has(selectedListing.id)
    : false;
  const canAdvertise = Boolean(selectedListing) && !alreadyAdvertising;

  // ============================================================
  // CREDITS — ads credits ni TZS value (wallet)
  // ============================================================
  const creditInfo = checkCredit(user?.id, "ads");
  const adsCreditRemaining = creditInfo.remaining || 0;
  const hasEnoughCredit = adsCreditRemaining >= adFee.price;
  const hasCredit = adsCreditRemaining > 0;

  const adLabel = getLocalized(adFee.label, lang);
  const adDesc = getLocalized(adFee.desc, lang);

  const handleConfirm = () => {
    if (!canAdvertise) return;
    setStage("paying");
  };

  // ============================================================
  // USE CREDIT — punguza kiasi cha ads credit
  // ============================================================
  const handleUseCredit = () => {
    if (!canAdvertise || !user) return;

    // Kama ads credit haitoshi — punguza kiasi tu (partial)
    // au lipa kwa cash. Hapa tunatumia credit kama inatosha.
    if (!hasEnoughCredit) {
      // Hana credit ya kutosha — lipa kwa cash
      setStage("paying");
      return;
    }

    const result = consumeCredit(user.id, "ads", adFee.price);
    if (!result.success) {
      setStage("paying");
      return;
    }

    handlePaymentSuccess("credits");
  };

  const handlePaymentSuccess = (method = "cash") => {
    const banner = addBannerAd(selectedListing, adFee.days);
    onAdvertised(selectedListing.id, banner);

    notifyAdvertisementPurchased({
      listingId: selectedListing.id,
      listingTitle: selectedListing.title,
      placement: t(
        "Banner inayozunguka (Dashboard)",
        "Rotating banner (Dashboard)"
      ),
      amount: method === "credits" ? 0 : adFee.price,
      expiresAt: banner.expiresAt,
      paidWith: method,
    });

    if (method === "cash") {
      addTransaction({
        type: "advertisement",
        title: `${adLabel} — ${selectedListing.title}`,
        property: selectedListing.title,
        amount: adFee.price,
        status: "completed",
        method: "M-Pesa",
        listingId: selectedListing.id,
        bannerId: banner.id,
      });
    } else {
      addTransaction({
        type: "advertisement",
        title: `${adLabel} — ${selectedListing.title} (Credits)`,
        property: selectedListing.title,
        amount: 0,
        status: "completed",
        method: "Credits",
        listingId: selectedListing.id,
        bannerId: banner.id,
      });
    }

    setDone({ listing: selectedListing, banner, paidWith: method });
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
            style={{ background: COLORS.rust }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Megaphone color="white" size={24} />
          </div>
          <h2
            style={{ fontFamily: FONTS.display, color: COLORS.night }}
            className="text-2xl font-semibold mb-2"
          >
            {t("Banner Imewekwa", "Banner Published")}
          </h2>
          <p
            style={{ color: "rgba(16,26,46,0.65)" }}
            className="text-sm mb-5"
          >
            {lang === "sw" ? (
              <>
                "{done.listing.title}" sasa itaonekana kwenye banner
                inayozunguka ya Dashboard (buyer na seller) hadi{" "}
                {new Date(done.banner.expiresAt).toLocaleDateString("sw-TZ", {
                  day: "numeric",
                  month: "long",
                })}
                .
              </>
            ) : (
              <>
                "{done.listing.title}" will now appear in the rotating Dashboard
                banner (buyer and seller) until{" "}
                {new Date(done.banner.expiresAt).toLocaleDateString("en-US", {
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
                `Umetumia ${formatTZS(adFee.price)} kwenye Ads credit — balance: ${formatTZS(
                  adsCreditRemaining - adFee.price
                )}`,
                `Used ${formatTZS(adFee.price)} from Ads credit — balance: ${formatTZS(
                  adsCreditRemaining - adFee.price
                )}`
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
            {t("Tangaza Mali Nyingine", "Advertise Another Listing")}
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
            {t("Tangaza Sasa", "Advertise Now")}
          </h1>
          <p
            style={{ color: "rgba(16,26,46,0.6)" }}
            className="text-sm mt-2 max-w-xl mx-auto"
          >
            {t(
              "Weka bidhaa yako kwenye banner inayozunguka ya Dashboard — buyer na seller wote wataiona wanapoingia.",
              "Place your product on the rotating Dashboard banner — all buyers and sellers will see it when they log in."
            )}
          </p>
        </div>

        {/* CREDITS BANNER — Ads credits */}
        {hasCredit && stage !== "paying" && (
          <div className="rounded-xl bg-[#2F6D4F]/10 border border-[#2F6D4F]/25 px-4 py-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Wallet size={16} color={COLORS.green} />
              <span className="text-sm text-[#2F6D4F] font-medium">
                {t(
                  `Ads Credit: ${formatTZS(adsCreditRemaining)} — ${
                    hasEnoughCredit
                      ? "inatosha kwa tangazo hili"
                      : "haifiki kwa tangazo hili"
                  }`,
                  `Ads Credit: ${formatTZS(adsCreditRemaining)} — ${
                    hasEnoughCredit
                      ? "enough for this ad"
                      : "not enough for this ad"
                  }`
                )}
              </span>
            </div>
            {hasEnoughCredit && (
              <button
                onClick={handleUseCredit}
                disabled={!canAdvertise}
                className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#2F6D4F] text-white disabled:opacity-50"
              >
                {t("Tumia Credit", "Use Credit")}
              </button>
            )}
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
                activeBannerListingIds={activeBannerListingIds}
                lang={lang}
              />
            </div>
          </>
        )}

        {liveListings.length > 0 && (
          <>
            {stage === "paying" ? (
              <PaymentGateway
                amount={adFee.price}
                title={adLabel}
                description={t(
                  `${adLabel} kwa "${selectedListing.title}" — siku ${adFee.days}`,
                  `${adLabel} for "${selectedListing.title}" — ${adFee.days} days`
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
                    style={{ background: `${COLORS.rust}15` }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Sparkles size={18} color={COLORS.rust} />
                  </div>
                  <div>
                    <p
                      style={{ color: COLORS.night }}
                      className="text-sm font-semibold mb-0.5"
                    >
                      {adLabel} —{" "}
                      {t(`siku ${adFee.days}`, `${adFee.days} days`)}
                    </p>
                    <p
                      style={{ color: "rgba(16,26,46,0.55)" }}
                      className="text-xs max-w-md mx-auto"
                    >
                      {adDesc}
                    </p>
                  </div>
                </div>

                {/* Warning — centered */}
                {alreadyAdvertising && (
                  <div
                    style={{
                      background: "rgba(193,80,46,0.1)",
                      color: COLORS.rust,
                    }}
                    className="flex flex-col items-center text-center gap-2 text-xs rounded-lg px-3 py-3 mb-4"
                  >
                    <Clock size={14} />
                    <span className="max-w-md">
                      {lang === "sw" ? (
                        <>
                          Mali hii tayari ina banner inayotumika siku{" "}
                          {bannerDaysRemaining(
                            activeBanners.find(
                              (b) => b.listingId === selectedListing.id
                            )
                          )}{" "}
                          zilizobaki. Subiri iishe kabla ya kununua nyingine.
                        </>
                      ) : (
                        <>
                          This listing already has an active banner with{" "}
                          {bannerDaysRemaining(
                            activeBanners.find(
                              (b) => b.listingId === selectedListing.id
                            )
                          )}{" "}
                          days remaining. Wait for it to expire before buying
                          another.
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
                      {formatTZS(adFee.price)}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                    {hasEnoughCredit && (
                      <button
                        onClick={handleUseCredit}
                        disabled={!canAdvertise}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-[#2F6D4F] text-white disabled:cursor-not-allowed"
                      >
                        <Wallet size={15} />
                        {t("Tumia Ads Credit", "Use Ads Credit")}
                      </button>
                    )}
                    <button
                      onClick={handleConfirm}
                      disabled={!canAdvertise}
                      style={{
                        background: canAdvertise
                          ? COLORS.gold
                          : COLORS.sandLine,
                        color: canAdvertise
                          ? COLORS.night
                          : "rgba(16,26,46,0.4)",
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
                    >
                      <Megaphone size={15} />
                      {t("Lipa na Tangaza", "Pay and Advertise")}
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
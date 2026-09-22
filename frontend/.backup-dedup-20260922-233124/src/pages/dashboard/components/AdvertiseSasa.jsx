// ============================================================
// AdvertiseSasa.jsx (production)
// Backend: POST /banners/ { listing, payment_reference }
// ============================================================
import React, { useState, useEffect } from "react";
import { Megaphone, MapPin, Sparkles, Loader2, AlertTriangle, Wallet } from "lucide-react";
import { COLORS, getCategory, formatTZS } from "./shared";
import { useAdvertisementFeeConfig } from "../../../config/advertisementFeeStore.js";
import { useActiveBannerAds, bannerDaysRemaining } from "../../../config/bannerAdsStore.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { checkCredit, consumeCredit } from "../../../config/userCreditsStore.js";
import { createBannerAdAsync } from "../../../config/bannerAdsStore.js";

function getLocalized(field, lang) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field?.[lang] || field?.sw || "";
}

function ListingPicker({ listings, selectedId, onSelect, activeBannerListingIds, lang }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed p-8 text-center" style={{ borderColor: COLORS.sandLine }}>
        <p className="text-muted text-sm">
          {lang === "sw"
            ? "Huna mali yoyote iliyo Live kwa sasa."
            : "You don't have any Live listings right now."}
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
            <div style={{ background: COLORS.night }} className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0">
              {Icon && <Icon size={18} color={COLORS.gold} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary text-sm font-semibold truncate">{l.title}</p>
              <p className="text-secondary flex items-center gap-1 text-body-sm">
                <MapPin size={11} /> {l.location}
              </p>
            </div>
            {advertising && (
              <span
                style={{ background: "rgba(193,80,46,0.14)", color: COLORS.rust }}
                className="flex items-center gap-1 text-body-sm font-semibold px-2 py-1 rounded-full shrink-0"
              >
                <Megaphone size={11} /> {lang === "sw" ? "Tayari inatangazwa" : "Already advertised"}
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
  const activeBannerListingIds = new Set(activeBanners.map((b) => b.listingId));

  const [selectedId, setSelectedId] = useState(
    initialListingId && liveListings.some((l) => l.id === initialListingId)
      ? initialListingId
      : liveListings[0]?.id ?? null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (initialListingId && liveListings.some((l) => l.id === initialListingId)) {
      setSelectedId(initialListingId);
    }
  }, [initialListingId, liveListings]);

  const selectedListing = liveListings.find((l) => l.id === selectedId);
  const alreadyAdvertising = selectedListing ? activeBannerListingIds.has(selectedListing.id) : false;
  const canAdvertise = Boolean(selectedListing) && !alreadyAdvertising;

  const creditInfo = checkCredit(user?.id, "ads");
  const adsCreditRemaining = creditInfo.remaining || 0;
  const hasEnoughCredit = adsCreditRemaining >= adFee.price;

  const adLabel = getLocalized(adFee.label, lang);
  const adDesc = getLocalized(adFee.desc, lang);

  const submitAd = async (reference) => {
    setBusy(true);
    setError("");
    try {
      const res = await createBannerAdAsync(selectedListing.id, reference || "manual");
      if (!res.ok) throw res.error;
      onAdvertised(selectedListing.id, res.banner);
      setDone({ listing: selectedListing, banner: res.banner });
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kutangaza. Jaribu tena.", "Failed to advertise. Try again.")
      );
    } finally {
      setBusy(false);
    }
  };

  const handleUseCredit = async () => {
    if (!canAdvertise || !user) return;
    if (!hasEnoughCredit) return submitAd(null);
    const consume = consumeCredit(user.id, "ads", adFee.price);
    if (!consume.success) return submitAd(null);
    return submitAd("credits");
  };

  if (done) {
    return (
      <div className="w-full flex items-center justify-center p-6" style={{ background: COLORS.sand, minHeight: "600px" }}>
        <div className="max-w-md w-full text-center bg-white rounded-2xl border p-8" style={{ borderColor: COLORS.sandLine }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: COLORS.rust }}>
            <Megaphone color="white" size={24} />
          </div>
          <h2 className="h-title mb-2">{t("Banner Imewekwa", "Banner Published")}</h2>
          <p className="text-secondary text-sm mb-5">
            {t("Listing yako sasa inaonekana kwenye banner.", "Your listing now appears in the banner.")}
          </p>
          <button
            onClick={() => setDone(null)}
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
    <div style={{ background: COLORS.sand, minHeight: "600px" }} className="w-full p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="h-title">{t("Tangaza Sasa", "Advertise Now")}</h1>
          <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
            {t(
              "Weka bidhaa yako kwenye banner inayozunguka ya Dashboard.",
              "Place your product on the rotating Dashboard banner."
            )}
          </p>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sm"
               style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {creditInfo.remaining > 0 && (
          <div className="rounded-xl bg-[#2F6D4F]/10 border border-[#2F6D4F]/25 px-4 py-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Wallet size={16} color={COLORS.green} />
              <span className="text-sm text-[#2F6D4F] font-medium">
                {t(
                  `Ads Credit: ${formatTZS(adsCreditRemaining)}`,
                  `Ads Credit: ${formatTZS(adsCreditRemaining)}`
                )}
              </span>
            </div>
            {hasEnoughCredit && (
              <button
                onClick={handleUseCredit}
                disabled={!canAdvertise || busy}
                className="text-body-sm font-semibold px-3 py-2 rounded-lg bg-[#2F6D4F] text-white disabled:opacity-50"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : t("Tumia Credit", "Use Credit")}
              </button>
            )}
          </div>
        )}

        <p className="text-primary text-sm font-medium mb-3 text-center">
          {t("Chagua Mali (Live pekee)", "Select Property (Live only)")}
        </p>
        <div className="mb-6">
          <ListingPicker
            listings={liveListings}
            selectedId={selectedId}
            onSelect={setSelectedId}
            activeBannerListingIds={activeBannerListingIds}
            lang={lang}
          />
        </div>

        <div className="rounded-2xl border p-4 flex flex-col items-center text-center gap-2 mb-4"
             style={{ borderColor: COLORS.sandLine, background: "white" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
               style={{ background: `${COLORS.rust}15` }}>
            <Sparkles size={18} color={COLORS.rust} />
          </div>
          <p className="text-primary text-sm font-semibold mb-0.5">
            {adLabel} — {t(`siku ${adFee.days}`, `${adFee.days} days`)}
          </p>
          <p className="text-secondary text-body-sm max-w-md mx-auto">{adDesc}</p>
          <p className="text-lg font-bold mt-2" style={{ color: COLORS.rust }}>
            {formatTZS(adFee.price)}
          </p>
        </div>

        <button
          onClick={() => submitAd(null)}
          disabled={!canAdvertise || busy}
          style={{
            background: canAdvertise && !busy ? COLORS.gold : COLORS.sandLine,
            color: canAdvertise && !busy ? COLORS.night : "rgba(16,26,46,0.4)",
          }}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />}
          {t("Tangaza Sasa", "Advertise Now")}
        </button>
      </div>
    </div>
  );
}

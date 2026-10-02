// ============================================================
// AdvertiseSasa.jsx (production + bundle + credits + skip-fee)
// Flow:
//   A. Skip (is_enabled=false) → POST /banners/ → POST /banners/{id}/pay/
//                                {payment_reference: "free"}
//   B. Flat fee  → POST /banners/ → /pay/ (FimiPay)
//   C. Bundle    → POST /bundles/purchases/ → /pay/ → credits added
//                  kisha POST /banners/ → /pay/ {payment_reference: "credits"}
//   D. Credit    → POST /banners/ → /pay/ {payment_reference: "credits"}
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import {
  Megaphone, MapPin, Sparkles, Loader2, AlertTriangle,
  Wallet, Package, Check,
} from "lucide-react";
import { COLORS, getCategory, formatTZS } from "./shared";
import { useAdvertisementFeeConfig } from "../../../config/advertisementFeeStore.js";
import { useActiveBannerAds, bannerDaysRemaining } from "../../../config/bannerAdsStore.js";
import { useActiveBundles } from "../../../config/bundlesStore.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { checkCredit, consumeCreditAsync } from "../../../config/userCreditsStore.js";
import { createBannerAdAsync, payBannerAdAsync } from "../../../config/bannerAdsStore.js";
import { api } from "../../../api/client.js";
import PaymentGateway from "./PaymentGateway";

function getLocalized(field, lang) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field?.[lang] || field?.sw || "";
}

// ============================================================
// LISTING PICKER
// ============================================================
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

// ============================================================
// ADS BUNDLE CARD
// ============================================================
function AdsBundleCard({ bundle, selected, onSelect, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const other = lang === "sw" ? "en" : "sw";
  const name =
    bundle.name?.[lang] || bundle.name?.[other] || t("Kifurushi", "Bundle");
  const description =
    bundle.description?.[lang] || bundle.description?.[other] || "";

  return (
    <button
      onClick={() => onSelect(bundle.id)}
      style={{
        borderColor: selected ? COLORS.gold : COLORS.sandLine,
        background: "white",
      }}
      className="relative flex flex-col items-center text-center gap-3 p-4 rounded-2xl border w-full"
    >
      {bundle.featured && (
        <span
          style={{ background: COLORS.rust, color: "white" }}
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-body-sm font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
        >
          {t("Maarufu Zaidi", "Most Popular")}
        </span>
      )}
      <div className="flex items-center justify-center gap-2 w-full">
        <Package size={16} color={COLORS.gold} />
        <span className="text-primary text-sm font-bold">{name}</span>
        <span
          style={{ background: selected ? COLORS.gold : COLORS.sandLine, borderColor: COLORS.gold }}
          className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
        >
          {selected && <Check size={12} color={COLORS.night} />}
        </span>
      </div>
      {description && (
        <p className="text-secondary text-body-sm line-clamp-2">{description}</p>
      )}
      <div className="flex items-baseline justify-center gap-1.5">
        <span style={{ color: COLORS.rust }} className="text-lg font-bold">
          {formatTZS(bundle.price)}
        </span>
        {bundle.validityDays && (
          <span className="text-secondary text-body-sm">
            / {lang === "sw" ? `siku ${bundle.validityDays}` : `${bundle.validityDays} days`}
          </span>
        )}
      </div>
      {bundle.discountPercent > 0 && (
        <span
          style={{ background: "rgba(47,109,79,0.12)", color: COLORS.green }}
          className="text-body-sm font-semibold px-2 py-0.5 rounded-full"
        >
          {t(`Okoa ${bundle.discountPercent}%`, `Save ${bundle.discountPercent}%`)}
        </span>
      )}
    </button>
  );
}

// ============================================================
// MAIN
// ============================================================
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

  const adsBundles = useActiveBundles().filter((b) => b.type === "ads");

  const [selectedId, setSelectedId] = useState(
    initialListingId && liveListings.some((l) => l.id === initialListingId)
      ? initialListingId
      : liveListings[0]?.id ?? null
  );

  const [paymentMode, setPaymentMode] = useState("flat"); // "flat" | "bundle"
  const [bundleId, setBundleId] = useState(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [stage, setStage] = useState("select"); // select | paying
  const [pendingBanner, setPendingBanner] = useState(null);
  const [pendingBundlePurchase, setPendingBundlePurchase] = useState(null);
  const pendingBannerIdRef = useRef(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (initialListingId && liveListings.some((l) => l.id === initialListingId)) {
      setSelectedId(initialListingId);
    }
  }, [initialListingId, liveListings]);

  useEffect(() => {
    if (!bundleId && adsBundles.length) {
      setBundleId(adsBundles[0].id);
    }
  }, [adsBundles, bundleId]);

  const selectedListing = liveListings.find((l) => l.id === selectedId);
  const alreadyAdvertising = selectedListing ? activeBannerListingIds.has(selectedListing.id) : false;
  const canAdvertise = Boolean(selectedListing) && !alreadyAdvertising;

  const creditInfo = checkCredit(user?.id, "ads");
  const adsCreditRemaining = creditInfo.remaining || 0;
  const hasCredit = creditInfo.hasCredit;

  const adFeeEnabled = adFee.is_enabled !== false;
  const selectedBundle = adsBundles.find((b) => b.id === bundleId);

  const canProceed =
    canAdvertise &&
    (paymentMode === "flat" || (paymentMode === "bundle" && selectedBundle));

  const adLabel = getLocalized(adFee.label, lang) || "Advertisement";
  const adDesc = getLocalized(adFee.desc, lang);

  // ══════════════════════════════════════════════════════════
  // CREATE PENDING BANNER
  // ══════════════════════════════════════════════════════════
  const createPendingBanner = async () => {
    const created = await createBannerAdAsync(selectedListing.id);
    if (!created.ok) throw created.error;
    const bannerId = created.banner?.id;
    if (!bannerId) {
      throw new Error(
        t(
          "Backend haikurudisha banner id. Jaribu tena.",
          "Backend did not return a banner id. Try again."
        )
      );
    }
    return { bannerId, banner: created.banner };
  };

  // ══════════════════════════════════════════════════════════
  // PATH A: SKIP FEE (is_enabled = false)
  // ══════════════════════════════════════════════════════════
  const handleSkipFee = async () => {
    if (!canAdvertise || busy) return;
    setBusy(true);
    setError("");
    try {
      const { bannerId } = await createPendingBanner();
      await api.post(`/banners/${bannerId}/pay/`, {
        payment_reference: "free",
      });
      onAdvertised(selectedListing.id, null);
      setDone({ listing: selectedListing, banner: null });
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kuweka tangazo.", "Failed to publish ad.")
      );
    } finally {
      setBusy(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // PATH B: FLAT FEE
  // ══════════════════════════════════════════════════════════
  const handleBeginFlatPayment = async () => {
    if (!canAdvertise || busy) return;
    setBusy(true);
    setError("");
    try {
      const { bannerId } = await createPendingBanner();
      pendingBannerIdRef.current = bannerId;
      setPendingBanner({ id: bannerId, listing: selectedListing });
      setStage("paying");
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kuunda tangazo. Jaribu tena.", "Could not create ad. Try again.")
      );
    } finally {
      setBusy(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // PATH C: BUNDLE PURCHASE
  // ══════════════════════════════════════════════════════════
  const handleBeginBundlePayment = async () => {
    if (!selectedBundle || busy) return;
    setBusy(true);
    setError("");
    try {
      const purchase = await api.post("/bundles/purchases/", {
        bundle: selectedBundle.id,
      });
      const purchaseId = purchase?.id || purchase?.purchase_id || purchase?.purchaseId;
      if (!purchaseId) throw new Error("Backend did not return purchase id.");
      setPendingBundlePurchase({ id: purchaseId, bundle: selectedBundle });
      setStage("paying");
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kununua kifurushi. Jaribu tena.", "Could not purchase bundle. Try again.")
      );
    } finally {
      setBusy(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // PATH D: USE CREDIT
  // ══════════════════════════════════════════════════════════
  const handleUseCredit = async () => {
    if (!canAdvertise || busy || !user) return;
    setBusy(true);
    setError("");
    try {
      const { bannerId } = await createPendingBanner();
      const raw = await api.post(`/banners/${bannerId}/pay/`, {
        payment_reference: "credits",
      });
      onAdvertised(selectedListing.id, null);
      setDone({ listing: selectedListing, banner: raw?.banner || null });
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kutumia credit.", "Failed to use credit.")
      );
    } finally {
      setBusy(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // PAYMENT GATEWAY INITIATE
  // ══════════════════════════════════════════════════════════
  const handlePaymentInitiate = async ({ methodKey, phone } = {}) => {
    // Path B: Flat fee
    if (paymentMode === "flat" && pendingBanner) {
      try {
        const raw = await api.post(`/banners/${pendingBanner.id}/pay/`, {
          payment_method: methodKey || "",
          phone: phone || "",
        });
        const candidates = [raw?.fimipay, raw?.data?.fimipay, raw?.data, raw].filter(Boolean);
        const payload = candidates.find((c) => c && (c.order_id || c.payment_status)) || {};
        return {
          ok: true,
          orderId: payload.order_id || null,
          paymentStatus: (payload.payment_status || "").toUpperCase() || null,
          transid: payload.transid || null,
          gatewayUrl: payload.payment_gateway_url || null,
          simulated: !!payload.simulated,
          environment: payload.environment || "live",
        };
      } catch (err) {
        return { ok: false, error: err };
      }
    }

    // Path C: Bundle purchase
    if (paymentMode === "bundle" && pendingBundlePurchase) {
      try {
        const paid = await api.post(
          `/bundles/purchases/${pendingBundlePurchase.id}/pay/`,
          {
            payment_method: methodKey || "",
            phone: phone || "",
          }
        );
        const fimipay = paid?.fimipay || paid?.data?.fimipay || {};
        return {
          ok: true,
          orderId: fimipay.order_id,
          gatewayUrl: fimipay.payment_gateway_url || null,
          simulated: !!fimipay.simulated,
          environment: fimipay.environment || "live",
        };
      } catch (err) {
        return { ok: false, error: err };
      }
    }

    return { ok: false, error: new Error("invalid payment mode") };
  };

  // ══════════════════════════════════════════════════════════
  // PAYMENT SUCCESS
  // ══════════════════════════════════════════════════════════
  const handlePaymentSuccess = async () => {
    if (paymentMode === "flat" && pendingBanner) {
      onAdvertised(pendingBanner.listing.id, null);
      setDone({ listing: pendingBanner.listing, banner: null });
      return;
    }

    if (paymentMode === "bundle" && pendingBundlePurchase) {
      try {
        // Unda banner + lipa kwa credits
        const { bannerId } = await createPendingBanner();
        await api.post(`/banners/${bannerId}/pay/`, {
          payment_reference: "credits",
        });
        onAdvertised(selectedListing.id, null);
        setDone({ listing: selectedListing, banner: null, mode: "bundle" });
      } catch (err) {
        console.warn("[AdvertiseSasa] activate after bundle failed:", err);
        setDone({ listing: selectedListing, mode: "bundle-only" });
      }
      return;
    }
  };

  const resetAll = () => {
    setDone(null);
    setStage("select");
    setPendingBanner(null);
    setPendingBundlePurchase(null);
    setError("");
  };

  // ══════════════════════════════════════════════════════════
  // DONE SCREEN
  // ══════════════════════════════════════════════════════════
  if (done) {
    const doneTitle =
      done.mode === "bundle-only"
        ? t("Kifurushi Kimeongezwa", "Bundle Added")
        : t("Banner Imewekwa", "Banner Published");
    const doneMsg =
      done.mode === "bundle-only"
        ? t(
            "Kifurushi kimeongezwa kwenye akaunti yako. Tumia credits kutangaza mali yako.",
            "Bundle has been added to your account. Use credits to advertise your listing."
          )
        : t(
            "Listing yako sasa inaonekana kwenye banner.",
            "Your listing now appears in the banner."
          );

    return (
      <div className="w-full flex items-center justify-center p-6" style={{ background: COLORS.sand, minHeight: "600px" }}>
        <div className="max-w-md w-full text-center bg-white rounded-2xl border p-8" style={{ borderColor: COLORS.sandLine }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: COLORS.rust }}>
            <Megaphone color="white" size={24} />
          </div>
          <h2 className="h-title mb-2">{doneTitle}</h2>
          <p className="text-secondary text-sm mb-5">{doneMsg}</p>
          <button
            onClick={resetAll}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            {t("Tangaza Mali Nyingine", "Advertise Another Listing")}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════
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

        {/* Fee disabled banner */}
        {!adFeeEnabled && stage !== "paying" && (
          <div className="rounded-xl border px-4 py-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left"
               style={{ background: "rgba(47,109,79,0.1)", borderColor: "rgba(47,109,79,0.35)", color: COLORS.green }}>
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span className="text-sm font-semibold">
                {t("Kutangaza ni BURE kwa sasa!", "Advertising is FREE right now!")}
              </span>
            </div>
          </div>
        )}

        {/* Credit banner */}
        {hasCredit && adFeeEnabled && stage !== "paying" && (
          <div className="rounded-xl bg-[#2F6D4F]/10 border border-[#2F6D4F]/25 px-4 py-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Wallet size={16} color={COLORS.green} />
              <span className="text-sm text-[#2F6D4F] font-medium">
                {t(
                  `Una Ads Credits ${adsCreditRemaining}`,
                  `You have ${adsCreditRemaining} Ads Credits`
                )}
              </span>
            </div>
            <button
              onClick={handleUseCredit}
              disabled={!canAdvertise || busy}
              className="text-body-sm font-semibold px-3 py-2 rounded-lg bg-[#2F6D4F] text-white disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : t("Tumia Credit", "Use Credit")}
            </button>
          </div>
        )}

        {/* 1. Chagua Mali */}
        {stage !== "paying" && (
          <>
            <p className="text-primary text-sm font-medium mb-3 text-center">
              1. {t("Chagua Mali (Live pekee)", "Select Property (Live only)")}
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
          </>
        )}

        {/* 2. Flat vs Bundle (kama fee enabled) */}
        {liveListings.length > 0 && stage !== "paying" && adFeeEnabled && (
          <>
            <p className="text-primary text-sm font-medium mb-3 text-center">
              2. {t("Chagua Njia ya Malipo", "Choose Payment Option")}
            </p>

            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setPaymentMode("flat")}
                className="flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-full border transition-colors"
                style={{
                  background: paymentMode === "flat" ? COLORS.night : "white",
                  color: paymentMode === "flat" ? COLORS.sand : COLORS.night,
                  borderColor: paymentMode === "flat" ? COLORS.night : COLORS.sandLine,
                }}
              >
                {t("Ada ya Kawaida", "Flat Fee")}
              </button>
              {adsBundles.length > 0 && (
                <button
                  onClick={() => setPaymentMode("bundle")}
                  className="flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-full border transition-colors"
                  style={{
                    background: paymentMode === "bundle" ? COLORS.night : "white",
                    color: paymentMode === "bundle" ? COLORS.sand : COLORS.night,
                    borderColor: paymentMode === "bundle" ? COLORS.night : COLORS.sandLine,
                  }}
                >
                  {t("Kifurushi (Bundle)", "Bundle Package")}
                </button>
              )}
            </div>

            {/* Flat fee card */}
            {paymentMode === "flat" && (
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
            )}

            {/* Bundle cards */}
            {paymentMode === "bundle" && (
              <>
                {adsBundles.length === 0 ? (
                  <p className="text-muted text-sm text-center py-6">
                    {t("Hakuna vifurushi vya matangazo.", "No ad bundles available.")}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {adsBundles.map((b) => (
                      <AdsBundleCard
                        key={b.id}
                        bundle={b}
                        selected={b.id === bundleId}
                        onSelect={setBundleId}
                        lang={lang}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Total + CTA */}
            <div className="rounded-2xl border p-4 flex flex-col items-center text-center gap-3 mb-4"
                 style={{ borderColor: COLORS.sandLine, background: "white" }}>
              <div>
                <p className="text-secondary text-body-sm mb-0.5">{t("Jumla ya Malipo", "Total Payment")}</p>
                <p className="text-lg font-bold" style={{ color: COLORS.rust }}>
                  {formatTZS(
                    paymentMode === "flat"
                      ? adFee.price
                      : selectedBundle?.price || 0
                  )}
                </p>
              </div>
              <button
                onClick={paymentMode === "flat" ? handleBeginFlatPayment : handleBeginBundlePayment}
                disabled={!canProceed || busy}
                style={{
                  background: canProceed && !busy ? COLORS.gold : COLORS.sandLine,
                  color: canProceed && !busy ? COLORS.night : "rgba(16,26,46,0.4)",
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
              >
                {busy ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : paymentMode === "flat" ? (
                  <Megaphone size={15} />
                ) : (
                  <Package size={15} />
                )}
                {paymentMode === "flat"
                  ? t("Tangaza Sasa", "Advertise Now")
                  : t("Nunua Kifurushi", "Buy Bundle")}
              </button>
            </div>
          </>
        )}

        {/* Kama fee imezimwa — kitufe kimoja cha bure */}
        {liveListings.length > 0 && stage !== "paying" && !adFeeEnabled && (
          <button
            onClick={handleSkipFee}
            disabled={!canAdvertise || busy}
            style={{
              background: canAdvertise && !busy ? COLORS.gold : COLORS.sandLine,
              color: canAdvertise && !busy ? COLORS.night : "rgba(16,26,46,0.4)",
            }}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />}
            {t("Tangaza Sasa (BURE)", "Advertise Now (FREE)")}
          </button>
        )}

        {/* Payment Gateway */}
        {stage === "paying" && (
          <PaymentGateway
            amount={
              paymentMode === "flat"
                ? adFee.price
                : pendingBundlePurchase?.bundle?.price || 0
            }
            title={
              paymentMode === "flat"
                ? adLabel || "Advertisement"
                : t("Nunua Kifurushi cha Matangazo", "Buy Ads Bundle")
            }
            description={
              paymentMode === "flat"
                ? t(
                    `Tangazo kwa "${pendingBanner?.listing?.title}"`,
                    `Advertisement for "${pendingBanner?.listing?.title}"`
                  )
                : t(
                    `${pendingBundlePurchase?.bundle?.name?.[lang] || ""} — credits zitaingizwa`,
                    `${pendingBundlePurchase?.bundle?.name?.[lang] || ""} — credits will be added`
                  )
            }
            onInitiate={handlePaymentInitiate}
            onSuccess={handlePaymentSuccess}
            onCancel={() => {
              setStage("select");
              setPendingBanner(null);
              setPendingBundlePurchase(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
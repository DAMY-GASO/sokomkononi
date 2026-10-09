// ============================================================
// BoostSasa.jsx (production + bundle + credits support)
// + Inaonyesha discount ya campaign kwenye packages
// ============================================================
import React, { useState, useEffect } from "react";
import {
  Rocket, Check, MapPin, TrendingUp, Clock, Loader2,
  AlertTriangle, Wallet, Package, Sparkles,
} from "lucide-react";
import {
  COLORS, getCategory, formatTZS, isBoostActive, boostDaysRemaining,
} from "./shared";
import { useActiveBoostPackages, hydrateBoostPackagesFromApi } from "../../../config/boostPackagesStore.js";
import { useBoostFee, hydrateBoostFeeFromApi } from "../../../config/boostFeeStore.js";
import { useActiveBundles } from "../../../config/bundlesStore.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { checkCredit } from "../../../config/userCreditsStore.js";
import { boostingApi } from "../../../api/boosting.js";
import { api } from "../../../api/client.js";
import PaymentGateway from "./PaymentGateway";

// ============================================================
// HELPERS
// ============================================================
function getLocalized(field, lang) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field?.[lang] || field?.sw || "";
}
function getLocalizedArray(field, lang) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  return field?.[lang] || field?.sw || [];
}

// ============================================================
// LISTING PICKER
// ============================================================
function ListingPicker({ listings, selectedId, onSelect, lang }) {
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
        const boosted = isBoostActive(l);
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
            {boosted && (
              <span
                style={{ background: "rgba(232,163,61,0.16)", color: "#8A5A16" }}
                className="flex items-center gap-1 text-body-sm font-semibold px-2 py-1 rounded-full shrink-0"
              >
                <Rocket size={11} />{" "}
                {lang === "sw" ? `Siku ${boostDaysRemaining(l)} zimebaki` : `${boostDaysRemaining(l)} days left`}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// FLAT PACKAGE CARD — inaonyesha discount kama ipo
// ============================================================
function FlatPackageCard({ pkg, selected, onSelect, lang, free = false }) {
  const isFeatured = pkg.key === "featured";
  const label = getLocalized(pkg.label, lang);
  const benefits = getLocalizedArray(pkg.benefits, lang);

  const hasDiscount = !free && pkg.pricing && Number(pkg.pricing.discount_percent) > 0;
  const basePrice = hasDiscount ? pkg.pricing.base_price : pkg.price;
  const finalPrice = hasDiscount ? pkg.pricing.final_price : pkg.price;

  return (
    <button
      onClick={() => onSelect(pkg.id)}
      style={{
        borderColor: selected ? COLORS.gold : COLORS.sandLine,
        background: "white",
      }}
      className="relative flex flex-col items-center text-center gap-3 p-4 rounded-2xl border w-full"
    >
      {isFeatured && (
        <span
          style={{ background: COLORS.rust, color: "white" }}
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-body-sm font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
        >
          {lang === "sw" ? "Maarufu Zaidi" : "Most Popular"}
        </span>
      )}

      {hasDiscount && (
        <span
          style={{ background: COLORS.rust, color: "white" }}
          className="absolute -top-2 right-2 text-body-sm font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
        >
          -{pkg.pricing.discount_percent}%
        </span>
      )}

      <div className="flex items-center justify-center gap-2 w-full">
        <span className="text-primary text-sm font-bold">{label}</span>
        <span
          style={{ background: selected ? COLORS.gold : COLORS.sandLine, borderColor: COLORS.gold }}
          className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
        >
          {selected && <Check size={12} color={COLORS.night} />}
        </span>
      </div>

      <div className="flex flex-col items-center gap-0.5">
        {hasDiscount && (
          <span className="text-secondary text-body-sm line-through">
            {formatTZS(basePrice)}
          </span>
        )}
        <div className="flex items-baseline justify-center gap-1.5">
          <span style={{ color: COLORS.rust }} className="text-lg font-bold">
            {free ? (lang === "sw" ? "Bure" : "Free") : formatTZS(finalPrice)}
          </span>
          <span className="text-secondary text-body-sm">
            / {lang === "sw" ? `siku ${pkg.days}` : `${pkg.days} days`}
          </span>
        </div>
      </div>

      {benefits.length > 0 && (
        <ul className="flex flex-col gap-1.5 w-full text-left">
          {benefits.map((b, i) => (
            <li key={i} className="text-secondary flex items-start gap-1.5 text-body-sm">
              <TrendingUp size={12} className="shrink-0 mt-0.5" color={COLORS.green} />
              {b}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

// ============================================================
// BOOST BUNDLE CARD
// ============================================================
function BoostBundleCard({ bundle, selected, onSelect, lang }) {
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
export default function BoostSasa({
  listings = [],
  initialListingId = null,
  onBoosted = () => {},
}) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const liveListings = listings.filter((l) => l.status === "live");
  const boostPackages = useActiveBoostPackages();
  const { loaded: feeLoaded, enabled: feeEnabled } = useBoostFee();
  const feeFree = feeLoaded && !feeEnabled;
  const boostBundles = useActiveBundles().filter((b) => b.type === "boost");

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      hydrateBoostFeeFromApi(),
      hydrateBoostPackagesFromApi(),
    ]).then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, []);

  const [selectedId, setSelectedId] = useState(
    initialListingId && liveListings.some((l) => l.id === initialListingId)
      ? initialListingId
      : liveListings[0]?.id ?? null
  );

  const [paymentMode, setPaymentMode] = useState("flat");
  const [flatPackageId, setFlatPackageId] = useState(null);
  const [bundleId, setBundleId] = useState(null);

  const [stage, setStage] = useState("select");
  const [done, setDone] = useState(null);
  const [creating, setCreating] = useState(false);
  const [pendingBoost, setPendingBoost] = useState(null);
  const [pendingBundlePurchase, setPendingBundlePurchase] = useState(null);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (!boostPackages.length) {
      if (flatPackageId !== null) setFlatPackageId(null);
      return;
    }
    if (!boostPackages.some((p) => p.id === flatPackageId)) {
      setFlatPackageId(boostPackages[0].id);
    }
  }, [boostPackages, flatPackageId]);

  useEffect(() => {
    if (feeFree && paymentMode !== "flat") setPaymentMode("flat");
  }, [feeFree, paymentMode]);

  useEffect(() => {
    if (!bundleId && boostBundles.length) {
      setBundleId(boostBundles[0].id);
    }
  }, [boostBundles, bundleId]);

  useEffect(() => {
    if (initialListingId && liveListings.some((l) => l.id === initialListingId)) {
      setSelectedId(initialListingId);
    }
  }, [initialListingId, liveListings]);

  const selectedListing = liveListings.find((l) => l.id === selectedId);
  const flatPackage = boostPackages.find((p) => p.id === flatPackageId);
  const selectedBundle = boostBundles.find((b) => b.id === bundleId);

  const creditInfo = checkCredit(user?.id, "boost");
  const hasCredit = !feeFree && creditInfo.hasCredit;
  const boostCreditRemaining = creditInfo.remaining || 0;

  const canBoost =
    feeLoaded &&
    Boolean(selectedListing) &&
    (feeFree
      ? Boolean(flatPackage)
      : (paymentMode === "flat" && Boolean(flatPackage)) ||
        (paymentMode === "bundle" && Boolean(selectedBundle)));

  const createBoostOnBackend = async () => {
    if (!flatPackage?.id) {
      throw new Error(
        t(
          "Hakuna boost package inayopatikana kwa sasa.",
          "No boost package is available right now."
        )
      );
    }
    const raw = await boostingApi.create({
      listing: selectedListing.id,
      package: flatPackage.id,
    });
    return raw;
  };

  const handleBeginFlatPayment = async () => {
    if (!selectedListing || !flatPackage || creating) return;
    setCreating(true);
    setError("");
    try {
      const raw = await createBoostOnBackend();
      setPendingBoost({ id: raw.id, listing: selectedListing, package: flatPackage });
      setStage("paying");
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kuunda boost. Jaribu tena.", "Could not create boost. Try again.")
      );
    } finally {
      setCreating(false);
    }
  };

  const handleBeginBundlePayment = async () => {
    if (!selectedBundle || creating) return;
    setCreating(true);
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
      setCreating(false);
    }
  };

  const handleUseCredit = async () => {
    if (!selectedListing || !user) return;
    setCreating(true);
    setError("");
    try {
      const raw = await createBoostOnBackend();
      const paid = await boostingApi.pay(raw.id, { payment_reference: "credits" });
      const activated = paid?.boost || (await boostingApi.activate(raw.id).catch(() => null));
      setDone({
        listing: selectedListing,
        pkg: flatPackage,
        boost: activated,
        mode: "credit",
      });
      setStage("done");
      onBoosted(selectedListing.id, {
        boostTier: flatPackage?.key || "credits",
        boostExpiresAt: activated?.expires_at,
      });
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kutumia credit.", "Failed to use credit.")
      );
    } finally {
      setCreating(false);
    }
  };

  const handlePaymentInitiate = async ({ methodKey, phone } = {}) => {
    if (paymentMode === "flat" && pendingBoost) {
      try {
        const res = await boostingApi.pay(pendingBoost.id, {
          payment_method: methodKey || "",
          phone: phone || "",
        });
        const candidates = [res?.fimipay, res?.data?.fimipay, res?.data, res].filter(Boolean);
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

  const handlePaymentSuccess = async () => {
    if (paymentMode === "flat" && pendingBoost) {
      try {
        const activated = await boostingApi.activate(pendingBoost.id);
        setDone({ listing: pendingBoost.listing, pkg: pendingBoost.package, boost: activated, mode: "flat" });
        setStage("done");
        onBoosted(pendingBoost.listing.id, {
          boostTier: pendingBoost.package.key,
          boostExpiresAt: activated?.expires_at,
        });
      } catch (err) {
        console.warn("[BoostSasa] activate after flat payment failed:", err);
        setDone({ listing: pendingBoost.listing, pkg: pendingBoost.package, boost: null, mode: "flat" });
        setStage("done");
        onBoosted(pendingBoost.listing.id, { boostTier: pendingBoost.package.key });
      }
      return;
    }

    if (paymentMode === "bundle" && pendingBundlePurchase) {
      try {
        const raw = await createBoostOnBackend();
        const paid = await boostingApi.pay(raw.id, { payment_reference: "credits" });
        const activated = paid?.boost || (await boostingApi.activate(raw.id).catch(() => null));
        setDone({ listing: selectedListing, pkg: flatPackage, boost: activated, mode: "bundle" });
        setStage("done");
        onBoosted(selectedListing.id, {
          boostTier: flatPackage?.key || "bundle",
          boostExpiresAt: activated?.expires_at,
        });
      } catch (err) {
        console.warn("[BoostSasa] activate after bundle payment failed:", err);
        setDone({ listing: selectedListing, pkg: null, boost: null, mode: "bundle-only" });
        setStage("done");
      }
      return;
    }
  };

  const handleFreeBoost = async () => {
    if (!selectedListing || !flatPackage || creating) return;
    setCreating(true);
    setError("");
    try {
      const raw = await createBoostOnBackend();
      const paid = await boostingApi.pay(raw.id, { payment_reference: "free" });
      const activated =
        paid?.boost || (await boostingApi.activate(raw.id).catch(() => null));
      setDone({
        listing: selectedListing,
        pkg: flatPackage,
        boost: activated,
        mode: "free",
      });
      setStage("done");
      onBoosted(selectedListing.id, {
        boostTier: flatPackage.key,
        boostExpiresAt: activated?.expires_at,
      });
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kuweka Angaza. Jaribu tena.", "Could not apply boost. Try again.")
      );
    } finally {
      setCreating(false);
    }
  };

  const resetAll = () => {
    setDone(null);
    setStage("select");
    setPendingBoost(null);
    setPendingBundlePurchase(null);
    setError("");
  };

  if (stage === "done" && done) {
    const doneTitle =
      done.mode === "bundle-only"
        ? t("Kifurushi Kimeongezwa", "Bundle Added")
        : t("Angaza Imewekwa", "Boost Applied");
    const doneMsg =
      done.mode === "bundle-only"
        ? t(
            "Kifurushi kimeongezwa kwenye akaunti yako. Tumia credits ku-boost mali yako.",
            "Bundle has been added to your account. Use credits to boost your listing."
          )
        : t("Boost imeanza kufanya kazi.", "Your boost is now active.");

    return (
      <div className="w-full flex items-center justify-center p-6" style={{ background: COLORS.sand, minHeight: "600px" }}>
        <div className="max-w-md w-full text-center bg-white rounded-2xl border p-8" style={{ borderColor: COLORS.sandLine }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: COLORS.gold }}>
            <Rocket color={COLORS.night} size={24} />
          </div>
          <h2 className="h-title mb-2">{doneTitle}</h2>
          <p className="text-secondary text-sm mb-5">{doneMsg}</p>
          <button
            onClick={resetAll}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            {t("Boost Mali Nyingine", "Boost Another Listing")}
          </button>
        </div>
      </div>
    );
  }

  if (!feeLoaded) {
    return (
      <div style={{ background: COLORS.sand, minHeight: "600px" }} className="w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={28} className="animate-spin" color={COLORS.gold} />
          <p className="text-secondary text-sm">
            {t("Inapakia mipangilio...", "Loading settings...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.sand, minHeight: "600px" }} className="w-full p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="h-title">{t("Boost Sasa", "Boost Now")}</h1>
          <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
            {t(
              "Ongeza mwonekano wa mali yako kwa wanunuzi wengi zaidi.",
              "Increase your property's visibility to more buyers."
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

        {hasCredit && stage !== "paying" && (
          <div className="rounded-xl bg-[#2F6D4F]/10 border border-[#2F6D4F]/25 px-4 py-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Wallet size={16} color={COLORS.green} />
              <span className="text-sm text-[#2F6D4F] font-medium">
                {t(
                  `Una Boost Credits ${boostCreditRemaining}`,
                  `You have ${boostCreditRemaining} Boost Credits`
                )}
              </span>
            </div>
            <button
              onClick={handleUseCredit}
              disabled={!selectedListing || creating}
              className="text-body-sm font-semibold px-3 py-2 rounded-lg bg-[#2F6D4F] text-white disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : t("Tumia Credit", "Use Credit")}
            </button>
          </div>
        )}

        {stage !== "paying" && (
          <>
            <p className="text-primary text-sm font-medium mb-3 text-center">
              1. {t("Chagua Mali (iliyo Hai pekee)", "Select Property (Live only)")}
            </p>
            <div className="mb-6">
              <ListingPicker listings={liveListings} selectedId={selectedId} onSelect={setSelectedId} lang={lang} />
            </div>
          </>
        )}

        {liveListings.length > 0 && stage !== "paying" && (
          <>
            <p className="text-primary text-sm font-medium mb-3 text-center">
              2.{" "}
              {feeFree
                ? t("Chagua kifurushi (Bure)", "Choose Package (Free)")
                : t("Chagua Njia ya Malipo", "Choose Payment Option")}
            </p>

            <div className={`flex justify-center gap-2 mb-4${feeFree ? " hidden" : ""}`}>
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
              {boostBundles.length > 0 && (
                <button
                  onClick={() => setPaymentMode("bundle")}
                  className="flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-full border transition-colors"
                  style={{
                    background: paymentMode === "bundle" ? COLORS.night : "white",
                    color: paymentMode === "bundle" ? COLORS.sand : COLORS.night,
                    borderColor: paymentMode === "bundle" ? COLORS.night : COLORS.sandLine,
                  }}
                >
                  {t("Kifurushi", "Bundle Package")}
                </button>
              )}
            </div>

            {paymentMode === "flat" && (
              <>
                {boostPackages.length === 0 ? (
                  <p className="text-muted text-sm text-center py-6">
                    {t("Hakuna vifurushi vya kuangaza.", "No boost packages available.")}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {boostPackages.map((pkg) => (
                      <FlatPackageCard
                        key={pkg.id}
                        pkg={pkg}
                        selected={pkg.id === flatPackageId}
                        onSelect={setFlatPackageId}
                        free={feeFree}
                        lang={lang}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {paymentMode === "bundle" && (
              <>
                {boostBundles.length === 0 ? (
                  <p className="text-muted text-sm text-center py-6">
                    {t("Hakuna vifurushi vya Kuangaza.", "No boost bundles available.")}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {boostBundles.map((b) => (
                      <BoostBundleCard
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

            <div className="rounded-2xl border p-4 flex flex-col items-center text-center gap-3 mb-4"
                 style={{ borderColor: COLORS.sandLine, background: "white" }}>
              <div>
                <p className="text-secondary text-body-sm mb-0.5">{t("Jumla ya Malipo", "Total Payment")}</p>
                <p className="text-lg font-bold" style={{ color: COLORS.rust }}>
                  {feeFree
                    ? t("Bure", "Free")
                    : formatTZS(
                        paymentMode === "flat"
                          ? (flatPackage?.pricing?.discount_percent > 0
                              ? flatPackage.pricing.final_price
                              : flatPackage?.price || 0)
                          : selectedBundle?.price || 0
                      )}
                </p>
              </div>
              <button
                onClick={
                  feeFree
                    ? handleFreeBoost
                    : paymentMode === "flat"
                      ? handleBeginFlatPayment
                      : handleBeginBundlePayment
                }
                disabled={!canBoost || creating}
                style={{
                  background: canBoost && !creating ? COLORS.gold : COLORS.sandLine,
                  color: canBoost && !creating ? COLORS.night : "rgba(16,26,46,0.4)",
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
              >
                {creating ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : paymentMode === "flat" ? (
                  <Rocket size={15} />
                ) : (
                  <Package size={15} />
                )}
                {feeFree
                  ? t("Angaza Bure", "Boost for Free")
                  : paymentMode === "flat"
                    ? t("Endelea Kulipa", "Continue to Payment")
                    : t("Nunua Kifurushi", "Buy Bundle")}
              </button>
            </div>
          </>
        )}

        {stage === "paying" && (
          <PaymentGateway
            scope="boost"
            amount={
              paymentMode === "flat"
                ? pendingBoost?.package?.price || 0
                : pendingBundlePurchase?.bundle?.price || 0
            }
            title={
              paymentMode === "flat"
                ? getLocalized(pendingBoost?.package?.label, lang)
                : t("Nunua Kifurushi cha kuangazia", "Buy Boost Bundle")
            }
            description={
              paymentMode === "flat"
                ? t(
                    `Angaza kwa "${pendingBoost?.listing?.title}"`,
                    `Boost for "${pendingBoost?.listing?.title}"`
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
              setPendingBoost(null);
              setPendingBundlePurchase(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
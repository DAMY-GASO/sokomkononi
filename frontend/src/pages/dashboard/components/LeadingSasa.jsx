// ============================================================
// LeadingSasa.jsx (production + bundle + credits + skip-fee)
// Flow:
//   A. Skip (is_enabled=false) → POST /leading-fees/purchases/apply/
//                                → POST /leading-fees/purchases/{id}/pay/
//                                  {payment_reference: "free"}
//   B. Flat fee  → apply → pay (FimiPay)
//   C. Bundle    → POST /bundles/purchases/ → /pay/ → credits added
//                  kisha apply → pay {payment_reference: "credits"}
//   D. Credit    → apply → pay {payment_reference: "credits"}
// ============================================================
import React, { useState, useEffect } from "react";
import {
  TrendingUp, MapPin, Search, Loader2, AlertTriangle,
  Wallet, Package, Check,
} from "lucide-react";
import {
  COLORS, getCategory, formatTZS, isLeadingActive, leadingDaysRemaining,
} from "./shared";
import { useLeadingFeeConfig } from "../../../config/leadingFeeStore.js";
import { useActiveBundles } from "../../../config/bundlesStore.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { checkCredit, consumeCreditAsync } from "../../../config/userCreditsStore.js";
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
            <div style={{ background: COLORS.night }} className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0">
              {Icon && <Icon size={18} color={COLORS.gold} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary text-sm font-semibold truncate">{l.title}</p>
              <p className="text-secondary flex items-center gap-1 text-body-sm">
                <MapPin size={11} /> {l.location}
              </p>
            </div>
            {leading && (
              <span
                style={{ background: "rgba(47,109,79,0.14)", color: COLORS.green }}
                className="flex items-center gap-1 text-body-sm font-semibold px-2 py-1 rounded-full shrink-0"
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

// ============================================================
// BUNDLE CARD
// ============================================================
function LeadingBundleCard({ bundle, selected, onSelect, lang }) {
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
export default function LeadingSasa({
  listings = [],
  initialListingId = null,
  onLead = () => {},
}) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const liveListings = listings.filter((l) => l.status === "live");
  const leadingFee = useLeadingFeeConfig();
  const leadingBundles = useActiveBundles().filter((b) => b.type === "leading");

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
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [pendingBundlePurchase, setPendingBundlePurchase] = useState(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (initialListingId && liveListings.some((l) => l.id === initialListingId)) {
      setSelectedId(initialListingId);
    }
  }, [initialListingId, liveListings]);

  useEffect(() => {
    if (!bundleId && leadingBundles.length) {
      setBundleId(leadingBundles[0].id);
    }
  }, [leadingBundles, bundleId]);

  const selectedListing = liveListings.find((l) => l.id === selectedId);
  const selectedBundle = leadingBundles.find((b) => b.id === bundleId);

  const creditInfo = checkCredit(user?.id, "leading");
  const hasCredit = creditInfo.hasCredit;
  const leadingCreditRemaining = creditInfo.remaining || 0;

  const feeEnabled = leadingFee.is_enabled !== false;

  const canLead =
    Boolean(selectedListing) &&
    (paymentMode === "flat" || (paymentMode === "bundle" && selectedBundle));

  // ── Create pending leading purchase ────────────────────────
  const createPendingPurchase = async () => {
    const purchase = await api.post("/leading-fees/purchases/apply/", {
      listing: selectedListing.id,
    });
    const purchaseId =
      purchase?.id || purchase?.purchase_id || purchase?.purchaseId;
    if (!purchaseId) {
      throw new Error(
        t(
          "Backend haikurudisha purchase id. Jaribu tena.",
          "Backend did not return a purchase id. Try again."
        )
      );
    }
    return purchaseId;
  };

  // ══════════════════════════════════════════════════════════
  // PATH A: SKIP FEE (is_enabled = false)
  // ══════════════════════════════════════════════════════════
  const handleSkipFee = async () => {
    if (!canLead || busy) return;
    setBusy(true);
    setError("");
    try {
      const purchaseId = await createPendingPurchase();
      await api.post(`/leading-fees/purchases/${purchaseId}/pay/`, {
        payment_reference: "free",
      });
      const expiresAt = new Date(
        Date.now() + (leadingFee.days || 7) * 86400000
      ).toISOString();
      onLead(selectedListing.id, { leadingExpiresAt: expiresAt });
      setDone({ listing: selectedListing });
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kuweka leading.", "Failed to apply leading.")
      );
    } finally {
      setBusy(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // PATH B: FLAT FEE
  // ══════════════════════════════════════════════════════════
  const handleBeginFlatPayment = async () => {
    if (!canLead || busy) return;
    setBusy(true);
    setError("");
    try {
      const purchaseId = await createPendingPurchase();
      setPendingPurchase({ id: purchaseId, listing: selectedListing });
      setStage("paying");
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kuunda leading. Jaribu tena.", "Could not create leading. Try again.")
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
    if (!canLead || !user) return;
    setBusy(true);
    setError("");
    try {
      const purchaseId = await createPendingPurchase();
      await api.post(`/leading-fees/purchases/${purchaseId}/pay/`, {
        payment_reference: "credits",
      });
      const expiresAt = new Date(
        Date.now() + (leadingFee.days || 7) * 86400000
      ).toISOString();
      onLead(selectedListing.id, { leadingExpiresAt: expiresAt });
      setDone({ listing: selectedListing });
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
    if (paymentMode === "flat" && pendingPurchase) {
      try {
        const paid = await api.post(
          `/leading-fees/purchases/${pendingPurchase.id}/pay/`,
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
    if (paymentMode === "flat" && pendingPurchase) {
      const expiresAt = new Date(
        Date.now() + (leadingFee.days || 7) * 86400000
      ).toISOString();
      onLead(pendingPurchase.listing.id, { leadingExpiresAt: expiresAt });
      setDone({ listing: pendingPurchase.listing });
      return;
    }

    if (paymentMode === "bundle" && pendingBundlePurchase) {
      try {
        const purchaseId = await createPendingPurchase();
        await api.post(`/leading-fees/purchases/${purchaseId}/pay/`, {
          payment_reference: "credits",
        });
        const expiresAt = new Date(
          Date.now() + (leadingFee.days || 7) * 86400000
        ).toISOString();
        onLead(selectedListing.id, { leadingExpiresAt: expiresAt });
        setDone({ listing: selectedListing, mode: "bundle" });
      } catch (err) {
        console.warn("[LeadingSasa] apply after bundle failed:", err);
        setDone({ listing: selectedListing, mode: "bundle-only" });
      }
      return;
    }
  };

  const resetAll = () => {
    setDone(null);
    setStage("select");
    setPendingPurchase(null);
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
        : t("Leading Imewekwa", "Leading Applied");
    const doneMsg =
      done.mode === "bundle-only"
        ? t(
            "Kifurushi kimeongezwa kwenye akaunti yako. Tumia credits kuweka leading.",
            "Bundle has been added to your account. Use credits to apply leading."
          )
        : t(
            "Listing yako itaonekana juu ya matokeo ya utafutaji.",
            "Your listing will appear at the top of search results."
          );

    return (
      <div className="w-full flex items-center justify-center p-6" style={{ background: COLORS.sand, minHeight: "600px" }}>
        <div className="max-w-md w-full text-center bg-white rounded-2xl border p-8" style={{ borderColor: COLORS.sandLine }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: COLORS.green }}>
            <TrendingUp color="white" size={24} />
          </div>
          <h2 className="h-title mb-2">{doneTitle}</h2>
          <p className="text-secondary text-sm mb-5">{doneMsg}</p>
          <button
            onClick={resetAll}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            {t("Weka Leading Nyingine", "Apply Leading to Another")}
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
          <h1 className="h-title">{t("Ada ya Kipaumbele", "Leading Fee")}</h1>
          <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
            {t(
              "Pandisha bidhaa yako JUU kabisa ya matokeo ya utafutaji.",
              "Push your listing to the very TOP of search results."
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
        {!feeEnabled && stage !== "paying" && (
          <div className="rounded-xl border px-4 py-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left"
               style={{ background: "rgba(47,109,79,0.1)", borderColor: "rgba(47,109,79,0.35)", color: COLORS.green }}>
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span className="text-sm font-semibold">
                {t("Leading ni BURE kwa sasa!", "Leading is FREE right now!")}
              </span>
            </div>
          </div>
        )}

        {/* Credit banner */}
        {hasCredit && feeEnabled && stage !== "paying" && (
          <div className="rounded-xl bg-[#2F6D4F]/10 border border-[#2F6D4F]/25 px-4 py-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Wallet size={16} color={COLORS.green} />
              <span className="text-sm text-[#2F6D4F] font-medium">
                {t(
                  `Una Leading Credits ${leadingCreditRemaining}`,
                  `You have ${leadingCreditRemaining} Leading Credits`
                )}
              </span>
            </div>
            <button
              onClick={handleUseCredit}
              disabled={!canLead || busy}
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
              <ListingPicker listings={liveListings} selectedId={selectedId} onSelect={setSelectedId} lang={lang} />
            </div>
          </>
        )}

        {/* 2. Flat vs Bundle toggle (kama fee enabled) */}
        {liveListings.length > 0 && stage !== "paying" && feeEnabled && (
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
              {leadingBundles.length > 0 && (
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
                     style={{ background: `${COLORS.green}15` }}>
                  <Search size={18} color={COLORS.green} />
                </div>
                <p className="text-primary text-sm font-semibold mb-0.5">
                  {getLocalized(leadingFee.label, lang) || "Leading"} — {t(`siku ${leadingFee.days}`, `${leadingFee.days} days`)}
                </p>
                <p className="text-secondary text-body-sm max-w-md mx-auto">{getLocalized(leadingFee.desc, lang)}</p>
                <p className="text-lg font-bold mt-2" style={{ color: COLORS.rust }}>
                  {formatTZS(leadingFee.price)}
                </p>
              </div>
            )}

            {/* Bundle cards */}
            {paymentMode === "bundle" && (
              <>
                {leadingBundles.length === 0 ? (
                  <p className="text-muted text-sm text-center py-6">
                    {t("Hakuna vifurushi vya leading.", "No leading bundles available.")}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {leadingBundles.map((b) => (
                      <LeadingBundleCard
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
                      ? leadingFee.price
                      : selectedBundle?.price || 0
                  )}
                </p>
              </div>
              <button
                onClick={paymentMode === "flat" ? handleBeginFlatPayment : handleBeginBundlePayment}
                disabled={!canLead || busy}
                style={{
                  background: canLead && !busy ? COLORS.gold : COLORS.sandLine,
                  color: canLead && !busy ? COLORS.night : "rgba(16,26,46,0.4)",
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
              >
                {busy ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : paymentMode === "flat" ? (
                  <TrendingUp size={15} />
                ) : (
                  <Package size={15} />
                )}
                {paymentMode === "flat"
                  ? t("Endelea Kulipa", "Continue to Payment")
                  : t("Nunua Kifurushi", "Buy Bundle")}
              </button>
            </div>
          </>
        )}

        {/* Kama fee imezimwa — kitufe kimoja cha bure */}
        {liveListings.length > 0 && stage !== "paying" && !feeEnabled && (
          <button
            onClick={handleSkipFee}
            disabled={!canLead || busy}
            style={{
              background: canLead && !busy ? COLORS.gold : COLORS.sandLine,
              color: canLead && !busy ? COLORS.night : "rgba(16,26,46,0.4)",
            }}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <TrendingUp size={15} />}
            {t("Weka Leading (BURE)", "Apply Leading (FREE)")}
          </button>
        )}

        {/* Payment Gateway */}
        {stage === "paying" && (
          <PaymentGateway
            amount={
              paymentMode === "flat"
                ? leadingFee.price
                : pendingBundlePurchase?.bundle?.price || 0
            }
            title={
              paymentMode === "flat"
                ? getLocalized(leadingFee.label, lang) || "Leading"
                : t("Nunua Kifurushi cha Leading", "Buy Leading Bundle")
            }
            description={
              paymentMode === "flat"
                ? t(
                    `Leading kwa "${pendingPurchase?.listing?.title}"`,
                    `Leading for "${pendingPurchase?.listing?.title}"`
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
              setPendingPurchase(null);
              setPendingBundlePurchase(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
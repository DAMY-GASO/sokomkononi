// ============================================================
// LeadingSasa.jsx — production
// Backend flow:
//   POST /api/leading-fees/purchases/apply/  { listing: <id> }  → returns { id, ... }
//   POST /api/leading-fees/purchases/{id}/pay/ { payment_reference } → activates
// ============================================================
import React, { useState, useEffect } from "react";
import {
  TrendingUp, MapPin, Search, Loader2, AlertTriangle, Wallet,
} from "lucide-react";
import {
  COLORS, getCategory, formatTZS, isLeadingActive, leadingDaysRemaining,
} from "./shared";
import { useLeadingFeeConfig } from "../../../config/leadingFeeStore.js";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [stage, setStage] = useState("select"); // select | paying

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (initialListingId && liveListings.some((l) => l.id === initialListingId)) {
      setSelectedId(initialListingId);
    }
  }, [initialListingId, liveListings]);

  const selectedListing = liveListings.find((l) => l.id === selectedId);
  const canLead = Boolean(selectedListing);

  const creditInfo = checkCredit(user?.id, "leading");
  const hasCredit = creditInfo.hasCredit;

  const leadingLabel = getLocalized(leadingFee.label, lang);
  const leadingDesc = getLocalized(leadingFee.desc, lang);

  // ============================================================
  // CORRECT FLOW: apply → pay
  // ============================================================
  // ── Step 1: create the PENDING leading purchase ────────────
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

  // ── Step 2a: initiate FimiPay (called by PaymentGateway) ────
  const handlePaymentInitiate = async ({ methodKey, methodLabel, phone } = {}) => {
    if (!selectedListing) return { ok: false, error: new Error("no listing") };
    setBusy(true);
    setError("");
    try {
      const purchaseId = await createPendingPurchase();
      const paid = await api.post(
        `/leading-fees/purchases/${purchaseId}/pay/`,
        {
          method: methodKey,
          method_label: methodLabel,
          phone,
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
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kuanzisha malipo.", "Failed to start payment.")
      );
      return { ok: false, error: err };
    } finally {
      setBusy(false);
    }
  };

  // ── Step 2b: FimiPay confirms SUCCESS ───────────────────────
  const handlePaymentSuccess = async () => {
    if (!selectedListing) return;
    const expiresAt = new Date(
      Date.now() + (leadingFee.days || 7) * 86400000
    ).toISOString();
    onLead(selectedListing.id, { leadingExpiresAt: expiresAt });
    setDone({ listing: selectedListing });
  };

  // ── Credit path stays the same (both steps run at once) ─────
  const handleUseCredit = async () => {
    if (!canLead || !user) return;
    setBusy(true);
    setError("");
    try {
      const consume = await consumeCreditAsync(user.id, "leading");
      if (!consume.success) {
        setBusy(false);
        return handlePaymentInitiate().then((res) => {
          // Credit failed → user goes through FimiPay via the parent UI.
          // The parent's onInitiate is only called from PaymentGateway,
          // so we simply reset the stage. As a fallback, do the whole flow:
          // this branch should rarely run if credits are shown correctly.
          return res;
        });
      }
      const purchaseId = await createPendingPurchase();
      // When paying with credits the backend treats "credits" as the ref
      // and skips the gateway.
      const paid = await api.post(
        `/leading-fees/purchases/${purchaseId}/pay/`,
        { payment_reference: "credits" }
      );
      const expiresAt =
        paid?.expires_at ||
        new Date(Date.now() + (leadingFee.days || 7) * 86400000).toISOString();
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

  if (done) {
    return (
      <div className="w-full flex items-center justify-center p-6" style={{ background: COLORS.sand, minHeight: "600px" }}>
        <div className="max-w-md w-full text-center bg-white rounded-2xl border p-8" style={{ borderColor: COLORS.sandLine }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: COLORS.green }}>
            <TrendingUp color="white" size={24} />
          </div>
          <h2 className="h-title mb-2">{t("Leading Imewekwa", "Leading Applied")}</h2>
          <p className="text-secondary text-sm mb-5">
            {t(
              "Listing yako itaonekana juu ya matokeo ya utafutaji.",
              "Your listing will appear at the top of search results."
            )}
          </p>
          <button
            onClick={() => setDone(null)}
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
          <div
            className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sm"
            style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {hasCredit && (
          <div className="rounded-xl bg-[#2F6D4F]/10 border border-[#2F6D4F]/25 px-4 py-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Wallet size={16} color={COLORS.green} />
              <span className="text-sm text-[#2F6D4F] font-medium">
                {t(
                  `Una Leading Credits ${creditInfo.remaining}`,
                  `You have ${creditInfo.remaining} Leading Credits`
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

        <p className="text-primary text-sm font-medium mb-3 text-center">
          {t("Chagua Mali (Live pekee)", "Select Property (Live only)")}
        </p>
        <div className="mb-6">
          <ListingPicker
            listings={liveListings}
            selectedId={selectedId}
            onSelect={setSelectedId}
            lang={lang}
          />
        </div>

        <div
          className="rounded-2xl border p-4 flex flex-col items-center text-center gap-2 mb-4"
          style={{ borderColor: COLORS.sandLine, background: "white" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${COLORS.green}15` }}
          >
            <Search size={18} color={COLORS.green} />
          </div>
          <p className="text-primary text-sm font-semibold mb-0.5">
            {leadingLabel} — {t(`siku ${leadingFee.days}`, `${leadingFee.days} days`)}
          </p>
          <p className="text-secondary text-body-sm max-w-md mx-auto">{leadingDesc}</p>
          <p className="text-lg font-bold mt-2" style={{ color: COLORS.rust }}>
            {formatTZS(leadingFee.price)}
          </p>
        </div>

        {stage === "select" && (
          <button
            onClick={() => setStage("paying")}
            disabled={!canLead || busy}
            style={{
              background: canLead && !busy ? COLORS.gold : COLORS.sandLine,
              color: canLead && !busy ? COLORS.night : "rgba(16,26,46,0.4)",
            }}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <TrendingUp size={15} />}
            {t("Weka Leading", "Apply Leading")}
          </button>
        )}

        {stage === "paying" && selectedListing && (
          <PaymentGateway
            amount={leadingFee.price}
            title={leadingLabel || "Leading"}
            description={t(
              `Leading kwa "${selectedListing.title}"`,
              `Leading for "${selectedListing.title}"`
            )}
            onInitiate={handlePaymentInitiate}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setStage("select")}
          />
        )}
      </div>
    </div>
  );
}

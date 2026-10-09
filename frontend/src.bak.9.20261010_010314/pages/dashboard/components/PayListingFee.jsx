// ============================================================
// PayListingFee.jsx
// Dedicated page for paying a single listing's fee.
// Route: /dashboard/pay-listing?id=<listingId>
//
// Reads ?id= from the query string, fetches that listing + its fee,
// shows the amount, offers credits (if any) or FimiPay, then routes
// the seller back to My Listings on success.
// ============================================================
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Wallet, AlertTriangle, CheckCircle2, Loader2,
  FileText, CreditCard, Receipt,
} from "lucide-react";
import { COLORS, formatTZS, getCategory, timeAgo } from "./shared";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { api } from "../../../api/client.js";
import { useAuth } from "../../../config/authStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { checkCredit, consumeCreditAsync } from "../../../config/userCreditsStore.js";
import PaymentGateway from "./PaymentGateway";
import ListingImage from "../../../components/ListingImage.jsx";

export default function PayListingFee() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const listingId = new URLSearchParams(location.search).get("id");

  const [stage, setStage] = useState("loading"); // loading | ready | already_paid | not_payable | success | error
  const [listing, setListing] = useState(null);
  const [fee, setFee] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ── Fetch listing + fee on mount ───────────────────────────
  useEffect(() => {
    if (!listingId) {
      setStage("error");
      setError(t(
        "Hakuna listing iliyochaguliwa.",
        "No listing selected."
      ));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [listingRes, feeRes] = await Promise.all([
          api.get(`/listings/${listingId}/`),
          api.get(`/listings/${listingId}/fee/`).catch((err) => {
            // fee endpoint might 404 for legacy listings — carry on
            console.warn("[PayListingFee] fee fetch failed:", err);
            return null;
          }),
        ]);
        if (cancelled) return;

        setListing(listingRes);

        // Fetch already-paid guard
        const paymentStatus = (feeRes?.payment_status || "").toUpperCase();

        if (paymentStatus === "PAID") {
          setFee(feeRes);
          setStage("already_paid");
          return;
        }

        // Determine if listing is in a payable state
        const status = (listingRes?.status || "").toUpperCase();
        if (status === "PENDING_APPROVAL" || status === "LIVE" ||
            status === "RESERVED" || status === "SOLD") {
          setFee(feeRes);
          setStage("already_paid");
          return;
        }

        if (status !== "PENDING_PAYMENT" && status !== "DRAFT") {
          setFee(feeRes);
          setStage("not_payable");
          return;
        }

        setFee(feeRes || { amount: listingRes?.fee_amount || 0 });
        setStage("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("[PayListingFee] load failed:", err);
        setError(
          err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kupakia listing.", "Failed to load listing.")
        );
        setStage("error");
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  // ── Owner check ────────────────────────────────────────────
  useEffect(() => {
    if (!listing || !user) return;
    const ownerId =
      listing.sellerId ?? listing.seller_id ?? listing.seller?.id ?? null;
    if (ownerId != null && String(ownerId) !== String(user.id)) {
      setStage("error");
      setError(t(
        "Hili si tangazo lako — huwezi kulipia ada yake.",
        "This isn\'t your listing — you cannot pay its fee."
      ));
    }
  }, [listing, user]);

  // ── Fee amount resolution ──────────────────────────────────
  const feeAmount = Number(fee?.amount ?? fee?.fee_amount ?? 0);

  // ── Credits ────────────────────────────────────────────────
  const creditInfo = checkCredit(user?.id, "listing");
  const hasCredit = creditInfo.hasCredit && creditInfo.remaining > 0;

  // ═══════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════

  // FimiPay initiate — passed to <PaymentGateway />
  const handleInitiate = async ({ methodKey, phone } = {}) => {
    try {
      const res = await api.post(`/listings/${listingId}/fee/pay/`, {
        payment_method: methodKey || "",
        phone: phone || "",
      });
      const candidates = [
        res?.fimipay, res?.data?.fimipay, res?.data, res,
      ].filter(Boolean);
      const payload =
        candidates.find((c) => c && (c.order_id || c.payment_status)) || {};
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
  };

  // Called by PaymentGateway when the poll returns SUCCESS
  const handleGatewaySuccess = () => {
    setStage("success");
    setTimeout(() => navigate("/dashboard/listings"), 2600);
  };

  // Credits path
  const handleUseCredits = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const consume = await consumeCreditAsync(user?.id, "listing");
      if (!consume.success) {
        setError(t(
          "Credit haitoshi au imeisha muda.",
          "Credit not available or expired."
        ));
        setBusy(false);
        return;
      }
      await api.post(`/listings/${listingId}/fee/pay/`, {
        payment_reference: "credits",
      });
      setStage("success");
      setTimeout(() => navigate("/dashboard/listings"), 2600);
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

  // Free path — no fee required for this category
  const handleFreeSubmit = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/listings/${listingId}/fee/pay/`, {
        payment_reference: "free",
      });
      setStage("success");
      setTimeout(() => navigate("/dashboard/listings"), 2600);
    } catch (err) {
      setError(
        err?.data?.detail ||
        err?.message ||
        t("Imeshindwa kuwasilisha.", "Failed to submit.")
      );
    } finally {
      setBusy(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  // ── LOADING ────────────────────────────────────────────────
  if (stage === "loading") {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={28} className="animate-spin" color={COLORS.gold} />
          <p className="text-sm text-secondary">
            {t("Inapakia...", "Loading...")}
          </p>
        </div>
      </div>
    );
  }

  // ── SUCCESS ────────────────────────────────────────────────
  if (stage === "success") {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(47,109,79,0.12)" }}
        >
          <CheckCircle2 size={32} color={COLORS.green} />
        </div>
        <h1 className="text-xl font-bold text-primary mb-2">
          {t("Malipo Yamefanikiwa!", "Payment Successful!")}
        </h1>
        <p className="text-sm text-secondary mb-4">
          {t(
            "Listing yako imewasilishwa kwa admin kuidhinisha. Utapata taarifa mara itakapoidhinishwa.",
            "Your listing has been submitted to admin for approval. You will be notified once it is reviewed."
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => navigate("/dashboard/listings")}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm"
          >
            {t("Mali Zangu", "My Listings")}
          </button>
          <button
            onClick={() => navigate("/dashboard/overview")}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm border"
            style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
          >
            {t("Muhtasari", "Overview")}
          </button>
        </div>
      </div>
    );
  }

  // ── ALREADY PAID / NOT PAYABLE / ERROR ─────────────────────
  if (stage === "already_paid" || stage === "not_payable" || stage === "error") {
    const title =
      stage === "already_paid"
        ? t("Ada Imelipwa Tayari", "Fee Already Paid")
        : stage === "not_payable"
          ? t("Listing Hailipiki", "Listing Not Payable")
          : t("Hitilafu", "Error");
    const message =
      stage === "already_paid"
        ? t(
            "Listing hii imelipwa ada. Haihitaji malipo zaidi.",
            "This listing\'s fee is already paid. No further payment needed."
          )
        : stage === "not_payable"
          ? t(
              "Listing hii ipo katika hali isiyoruhusu kulipia ada sasa.",
              "This listing is not in a state where the fee can be paid now."
            )
          : error;

    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background:
              stage === "already_paid"
                ? "rgba(47,109,79,0.12)"
                : "rgba(193,80,46,0.12)",
          }}
        >
          {stage === "already_paid" ? (
            <CheckCircle2 size={32} color={COLORS.green} />
          ) : (
            <AlertTriangle size={32} color={COLORS.rust} />
          )}
        </div>
        <h1 className="text-lg font-bold text-primary mb-2">{title}</h1>
        <p className="text-sm text-secondary mb-5 break-words">{message}</p>
        <Link
          to="/dashboard/listings"
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="inline-block px-5 py-2.5 rounded-xl font-semibold text-sm"
        >
          {t("Rudi kwenye Mali Zangu", "Back to My Listings")}
        </Link>
      </div>
    );
  }

  // ── READY — payment form ───────────────────────────────────
  const category = getCategory(listing?.category);
  const CatIcon = getCategoryIcon(category?.iconKey);
  const imageUrl = (listing?.photos || [])[0] || listing?.imageUrl || null;
  const isFree = feeAmount === 0;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/dashboard/listings")}
        className="flex items-center gap-1.5 text-sm font-medium mb-4"
        style={{ color: COLORS.night }}
      >
        <ArrowLeft size={16} />
        {t("Rudi kwenye Mali Zangu", "Back to My Listings")}
      </button>

      {/* Header */}
      <div className="text-center mb-5">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
          style={{ background: `${COLORS.gold}20` }}
        >
          <Receipt size={22} color={COLORS.gold} />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">
          {t("Lipa Ada ya Kuchapisha", "Pay Listing Fee")}
        </h1>
        <p className="text-sm text-secondary mt-1 max-w-lg mx-auto">
          {t(
            "Lipa ada ili listing yako iwasilishwe kwa admin kuidhinisha.",
            "Pay the fee so your listing is submitted to admin for approval."
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

      {/* Listing summary card */}
      <div
        className="rounded-2xl border bg-white p-3 sm:p-4 mb-4 flex items-start gap-3"
        style={{ borderColor: COLORS.sandLine }}
      >
        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden">
          <ListingImage
            src={imageUrl}
            variant="thumb"
            alt={listing?.title}
            ratio="aspect-square"
            fallback={
              CatIcon ? <CatIcon size={28} color={COLORS.night} /> : null
            }
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary line-clamp-2">
            {listing?.title}
          </p>
          <p className="text-xs text-secondary mt-0.5 truncate">
            {category?.label?.[lang] || category?.label?.sw || listing?.category}
            {listing?.location ? ` · ${listing.location}` : ""}
          </p>
          {listing?.price > 0 && (
            <p className="text-base font-bold mt-1" style={{ color: COLORS.night }}>
              {formatTZS(listing.price)}
            </p>
          )}
          {listing?.postedAt && (
            <p className="text-[11px] text-muted mt-0.5">
              {timeAgo(listing.postedAt, lang)}
            </p>
          )}
        </div>
      </div>

      {/* Fee amount card */}
      <div
        className="rounded-2xl border-2 p-4 sm:p-5 mb-4 text-center"
        style={{
          borderColor: `${COLORS.gold}60`,
          background: `${COLORS.gold}08`,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
          {t("Ada ya Kuchapisha", "Listing Fee")}
        </p>
        <p
          className="text-3xl sm:text-4xl font-bold mt-1"
          style={{ color: COLORS.rust }}
        >
          {isFree ? t("Bure", "Free") : formatTZS(feeAmount)}
        </p>
        <p className="text-[11px] text-secondary mt-1">
          {t(
            "Ada hii inalipwa mara moja tu kwa listing hii.",
            "This fee is paid once for this listing."
          )}
        </p>
      </div>

      {/* Free path — direct submit */}
      {isFree && (
        <button
          onClick={handleFreeSubmit}
          disabled={busy}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {t("Tuma kwa Admin", "Submit to Admin")}
        </button>
      )}

      {/* Credits path */}
      {!isFree && hasCredit && (
        <div
          className="rounded-xl border px-4 py-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{
            background: "rgba(47,109,79,0.08)",
            borderColor: "rgba(47,109,79,0.25)",
          }}
        >
          <div className="flex items-center gap-2 text-sm">
            <Wallet size={16} color={COLORS.green} />
            <span style={{ color: COLORS.green }} className="font-medium">
              {t(
                `Una Credits ${creditInfo.remaining} za kuchapisha`,
                `You have ${creditInfo.remaining} listing credit(s)`
              )}
            </span>
          </div>
          <button
            onClick={handleUseCredits}
            disabled={busy}
            style={{ background: COLORS.green, color: "white" }}
            className="w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busy ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Wallet size={12} />
            )}
            {t("Tumia Credit", "Use Credit")}
          </button>
        </div>
      )}

      {/* FimiPay path */}
      {!isFree && (
        <PaymentGateway
          amount={feeAmount}
          title={t("Ada ya Kuchapisha", "Listing Fee")}
          description={t(
            `Kuchapisha "${listing?.title || ""}"`,
            `Publishing "${listing?.title || ""}"`
          )}
          onInitiate={handleInitiate}
          onSuccess={handleGatewaySuccess}
          onCancel={() => navigate("/dashboard/listings")}
          lang={lang}
        />
      )}
    </div>
  );
}

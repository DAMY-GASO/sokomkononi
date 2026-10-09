// ============================================================
// BundlesPage.jsx
// User anaona na kununua bundles/vifurushi vya huduma.
// Bilingual kamili + mobile-responsive.
// Types: listing, reservation, success, package, boost, leading,
//        ads, premium
// ============================================================

import React, { useState, useRef } from "react";
import {
  Package,
  ListChecks,
  Rocket,
  TrendingUp,
  Clock3,
  Megaphone,
  Star,
  Building2,
  Check,
  Sparkles,
  Wallet,
  FileText,
  Crown,
} from "lucide-react";

import { COLORS, formatTZS } from "./dashboard/components/shared";
import PaymentGateway from "./dashboard/components/PaymentGateway";
import { useActiveBundles } from "../config/bundlesStore.js";
import {
  useUserCredits,
  hydrateUserCreditsFromApi,
} from "../config/userCreditsStore.js";
import { useAuth } from "../config/authStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { api } from "../api/client.js";

// Icon resolver — lazima iwe na icons zote zinazotumika kwenye bundles
const ICON_MAP = {
  ListChecks,
  Rocket,
  TrendingUp,
  Clock3,
  Megaphone,
  Star,
  Package,
  Building2,
  FileText,
  Sparkles,
  Crown,
};

// ============================================================
// BILINGUAL — service label za credits
// ============================================================
const CREDIT_LABELS = {
  listing: { sw: "Kuweka Mali", en: "Listing" },
  leading: { sw: "Kuongoza", en: "Leading" },
  boost: { sw: "Kukuza", en: "Boost" },
  reservation: { sw: "Kuhifadhi", en: "Reservation" },
  success: { sw: "Ripoti", en: "Reports" },
  ads: { sw: "Matangazo", en: "Ads" },
  premium: { sw: "Hadhi ya Juu", en: "Premium" },
};

// ============================================================
// BILINGUAL — bundle type labels
// Mpangilio: msingi → combo → mwonekano → combo ya mwonekano
// ============================================================
const TYPE_LABELS = {
  all: { sw: "Zote", en: "All" },
  listing: { sw: "Kuweka Mali", en: "Listings" },
  reservation: { sw: "Kuhifadhi", en: "Reservation" },
  success: { sw: "Ripoti", en: "Reports" },
  package: { sw: "Vifurushi Maalum", en: "Packages" },
  boost: { sw: "Kukuza", en: "Boost" },
  leading: { sw: "Kuongoza", en: "Leading" },
  ads: { sw: "Matangazo", en: "Ads" },
  premium: { sw: "Hadhi ya Juu", en: "Premium" },
};

function BundleCard({ bundle, lang, onBuy, owned }) {
  const Icon = ICON_MAP[bundle.icon] || Package;
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const other = lang === "sw" ? "en" : "sw";
  const name =
    bundle.name?.[lang] || bundle.name?.[other] || t("Kifurushi", "Bundle");
  const description =
    bundle.description?.[lang] || bundle.description?.[other] || "";

  // Credits display — inaonyesha credits zote zilizomo kwenye bundle
  const creditsList =
    bundle.credits && typeof bundle.credits === "object"
      ? Object.entries(bundle.credits)
          .filter(([_, v]) => Number(v) > 0)
          .map(([k, v]) => {
            const label = CREDIT_LABELS[k];
            const lbl = label ? label[lang] || label.sw : k;
            return `${v}× ${lbl}`;
          })
      : [];

  return (
    <div
      className={`relative bg-white rounded-2xl border-2 p-4 sm:p-5 flex flex-col items-center text-center gap-3 transition-all ${
        bundle.featured ? "border-[#E8A33D] shadow-lg" : "border-gray-100"
      }`}
    >
      {bundle.featured && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#E8A33D] text-[#101A2E] text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
          {t("Maarufu Zaidi", "Most Popular")}
        </span>
      )}

      <div className="w-12 h-12 rounded-xl bg-[#E8A33D]/10 flex items-center justify-center">
        <Icon size={22} color={COLORS.gold} />
      </div>

      <div className="min-w-0 w-full">
        <h3 className="font-bold text-primary text-sm sm:text-base">
          {name}
        </h3>
        <p className="text-[11px] sm:text-xs text-secondary mt-1 line-clamp-2">
          {description}
        </p>
      </div>

      {/* Credits breakdown — kwa combo bundles */}
      {creditsList.length > 0 && (
        <div className="w-full flex flex-wrap justify-center gap-1.5">
          {creditsList.map((c, i) => (
            <span
              key={i}
              className="text-[10px] font-medium bg-[#F5F3EC] text-secondary px-2 py-0.5 rounded-full"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-baseline justify-center gap-1 flex-wrap">
        <span className="text-xl sm:text-2xl font-bold text-[#C1502E]">
          {formatTZS(bundle.price)}
        </span>
        {bundle.validityDays && (
          <span className="text-[10px] sm:text-xs text-secondary">
            /{" "}
            {t(
              `siku ${bundle.validityDays}`,
              `${bundle.validityDays} days`
            )}
          </span>
        )}
      </div>

      {bundle.discountPercent > 0 && (
        <span className="text-[10px] sm:text-xs font-semibold text-[#2F6D4F] bg-[#2F6D4F]/10 px-2.5 py-1 rounded-full">
          {t(
            `Okoa ${bundle.discountPercent}%`,
            `Save ${bundle.discountPercent}%`
          )}
        </span>
      )}

      <button
        onClick={() => onBuy(bundle)}
        disabled={owned}
        className={`w-full py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-colors ${
          owned
            ? "bg-gray-100 text-muted cursor-not-allowed"
            : "bg-[#E8A33D] hover:bg-[#B87A1F] text-[#101A2E]"
        }`}
      >
        {owned ? t("Tayari Unayo", "Already Owned") : t("Nunua Sasa", "Buy Now")}
      </button>
    </div>
  );
}

export default function BundlesPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const bundles = useActiveBundles();
  const userCredits = useUserCredits(user?.id);

  const [selectedType, setSelectedType] = useState("all");
  const [payingBundle, setPayingBundle] = useState(null);
  const lastPurchaseIdRef = useRef(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const types = Object.entries(TYPE_LABELS).map(([key, label]) => ({
    key,
    label: label[lang] || label.sw,
  }));

  const filtered =
    selectedType === "all"
      ? bundles
      : bundles.filter((b) => b.type === selectedType);

  const handleBuy = (bundle) => {
    if (!user) return;
    setPayingBundle(bundle);
  };

  const handlePaymentSuccess = async () => {
    if (!user || !payingBundle) return;
    // FimiPay's webhook to the backend may land a few seconds after the
    // poll reports SUCCESS. Retry up to 4 times with 2s gaps so the
    // user actually sees their new balance.
    const delays = [0, 2000, 4000, 6000];
    for (const ms of delays) {
      if (ms) await new Promise((r) => setTimeout(r, ms));
      try {
        const r = await hydrateUserCreditsFromApi(user.id);
        if (r?.ok) {
          const hasCredits =
            r.credits && Object.keys(r.credits).some(
              (k) => k !== "services" && (r.credits[k]?.remaining || 0) > 0
            );
          if (hasCredits) break;
        }
      } catch (err) {
        console.warn("[BundlesPage] credit refresh retry failed:", err);
      }
    }
    setPayingBundle(null);
  };

  // Credits zote zilizo na balance > 0
  const activeCredits = userCredits
    ? Object.entries(CREDIT_LABELS)
        .filter(([key]) => key !== "premium")
        .map(([key, label]) => ({
          key,
          label: label[lang] || label.sw,
          remaining: userCredits[key]?.remaining || 0,
        }))
        .filter((c) => c.remaining > 0)
    : [];

  return (
    <div
      style={{
        background: COLORS.sand,
        minHeight: "100%",
      }}
      className="w-full p-3 sm:p-4 md:p-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* ============================================================ */}
        {/* HEADER — CENTERED */}
        {/* ============================================================ */}
        <div className="mb-5 sm:mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={20} color={COLORS.gold} className="sm:w-6 sm:h-6" />
            <h1
              style={{ color: "var(--text-primary)" }}
              className="text-xl sm:text-2xl md:text-3xl font-semibold"
            >
              {t("Vifurushi vya Huduma", "Service Bundles")}
            </h1>
          </div>
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-xs sm:text-sm max-w-xl mx-auto px-2"
          >
            {t(
              "Nunua vifurushi na uokoe pesa. Salio linaingizwa kwenye akaunti yako papo hapo.",
              "Buy bundles and save money. Credits are added to your account instantly."
            )}
          </p>
        </div>

        {/* ============================================================ */}
        {/* CREDITS BALANCE — responsive grid */}
        {/* ============================================================ */}
        {activeCredits.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 mb-5 sm:mb-6 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Wallet size={14} color={COLORS.green} />
              <h3 className="text-xs font-semibold text-secondary">
                {t("Salio Lako", "Your Credits")}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              {activeCredits.map((c) => (
                <div
                  key={c.key}
                  className="bg-[#F5F3EC] rounded-lg p-2 min-w-0"
                >
                  <p className="text-base sm:text-lg font-bold text-primary">
                    {c.remaining}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-secondary truncate">
                    {c.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TYPE FILTER — centered, scrollable kwenye mobile */}
        {/* ============================================================ */}
        <div className="flex justify-start sm:justify-center gap-2 mb-4 sm:mb-5 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          {types.map((ty) => (
            <button
              key={ty.key}
              onClick={() => setSelectedType(ty.key)}
              className={`text-[11px] sm:text-xs font-semibold px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border whitespace-nowrap shrink-0 transition-colors ${
                selectedType === ty.key
                  ? "bg-[#101A2E] text-[#F5F3EC] border-[#101A2E]"
                  : "bg-white text-[#101A2E] border-gray-200"
              }`}
            >
              {ty.label}
            </button>
          ))}
        </div>

        {/* ============================================================ */}
        {/* BUNDLES GRID */}
        {/* ============================================================ */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 sm:p-12 text-center bg-white">
            <Package
              size={40}
              className="mx-auto text-muted mb-3 sm:w-12 sm:h-12"
            />
            <p className="text-xs sm:text-sm text-secondary">
              {t(
                "Hakuna vifurushi kwenye category hii.",
                "No bundles in this category."
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((b) => (
              <BundleCard
                key={b.id}
                bundle={b}
                lang={lang}
                onBuy={handleBuy}
                owned={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* PAYMENT MODAL — responsive */}
      {/* ============================================================ */}
      {payingBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <PaymentGateway
              amount={payingBundle.price}
              title={
                payingBundle.name?.[lang] ||
                payingBundle.name?.[lang === "sw" ? "en" : "sw"] ||
                t("Kifurushi", "Bundle")
              }
              description={t(
                "Nunua kifurushi — salio litaingizwa papo hapo",
                "Buy bundle — credits will be added instantly"
              )}
              onInitiate={async () => {
                try {
                  const purchase = await api.post("/bundles/purchases/", {
                    bundle: payingBundle.id,
                  });
                  const purchaseId =
                    purchase?.id ||
                    purchase?.purchase_id ||
                    purchase?.purchaseId;
                  if (!purchaseId) {
                    throw new Error("Backend did not return purchase id.");
                  }
                  lastPurchaseIdRef.current = purchaseId;
                  const paid = await api.post(
                    `/bundles/purchases/${purchaseId}/pay/`,
                    {}
                  );
                  const fimipay = paid?.fimipay || paid?.data?.fimipay || {};
                  try {
                    if (fimipay?.order_id) {
                      sessionStorage.setItem("pending_order_id", String(fimipay.order_id));
                      sessionStorage.setItem("pending_order_amount", String(payingBundle?.price || ""));
                    }
                  } catch { /* noop */ }
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
              }}
              onCancel={() => setPayingBundle(null)}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
// ============================================================
// BundlesPage.jsx
// User anaona na kununua bundles/vifurushi vya huduma.
// Bilingual kamili + mobile-responsive.
// ============================================================

import React, { useState } from "react";
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
} from "lucide-react";

import {
  COLORS,
  FONTS,
  formatTZS,
} from "./dashboard/components/shared";
import PaymentGateway from "./dashboard/components/PaymentGateway";
import { useActiveBundles } from "../config/bundlesStore.js";
import {
  useUserCredits,
  addBundleCredits,
} from "../config/userCreditsStore.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

// Icon resolver
const ICON_MAP = {
  ListChecks,
  Rocket,
  TrendingUp,
  Clock3,
  Megaphone,
  Star,
  Package,
  Building2,
};

// ============================================================
// BILINGUAL — service label za credits
// ============================================================
const CREDIT_LABELS = {
  listing: { sw: "Kuweka Mali", en: "Listing" },
  leading: { sw: "Kuongoza", en: "Leading" },
  boost: { sw: "Kukuza", en: "Boost" },
  reservation: { sw: "Kuhifadhi", en: "Reservation" },
  ads: { sw: "Matangazo", en: "Ads" },
  premium: { sw: "Hadhi ya Juu", en: "Premium" },
};

// ============================================================
// BILINGUAL — bundle type labels
// ============================================================
const TYPE_LABELS = {
  all: { sw: "Zote", en: "All" },
  listing: { sw: "Kuweka Mali", en: "Listings" },
  leading: { sw: "Kuongoza", en: "Leading" },
  boost: { sw: "Kukuza", en: "Boost" },
  reservation: { sw: "Kuhifadhi", en: "Reservation" },
  ads: { sw: "Matangazo", en: "Ads" },
  premium: { sw: "Hadhi ya Juu", en: "Premium" },
  package: { sw: "Vifurushi", en: "Packages" },
};

function BundleCard({ bundle, lang, onBuy, owned }) {
  const Icon = ICON_MAP[bundle.icon] || Package;
  const t = (sw, en) => (lang === "sw" ? sw : en);
  // Fallback chain: lugha iliyochaguliwa → lugha nyingine → neno la jumla
  // kwa lugha iliyochaguliwa (sio Kiswahili daima).
  const other = lang === "sw" ? "en" : "sw";
  const name =
    bundle.name?.[lang] || bundle.name?.[other] || t("Kifurushi", "Bundle");
  const description =
    bundle.description?.[lang] || bundle.description?.[other] || "";

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
        <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">
          {name}
        </h3>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-1 line-clamp-2">
          {description}
        </p>
      </div>

      <div className="flex items-baseline justify-center gap-1 flex-wrap">
        <span className="text-xl sm:text-2xl font-bold text-[#C1502E]">
          {formatTZS(bundle.price)}
        </span>
        {bundle.validityDays && (
          <span className="text-[10px] sm:text-xs text-gray-500">
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
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
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

  const handlePaymentSuccess = () => {
    if (!user || !payingBundle) return;
    addBundleCredits(user.id, payingBundle);
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
        fontFamily: FONTS.body,
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
              style={{ fontFamily: FONTS.display, color: COLORS.night }}
              className="text-xl sm:text-2xl md:text-3xl font-semibold"
            >
              {t("Vifurushi vya Huduma", "Service Bundles")}
            </h1>
          </div>
          <p
            style={{ color: "rgba(16,26,46,0.6)" }}
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
              <h3 className="text-xs font-semibold text-gray-500">
                {t("Salio Lako", "Your Credits")}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              {activeCredits.map((c) => (
                <div
                  key={c.key}
                  className="bg-[#F5F3EC] rounded-lg p-2 min-w-0"
                >
                  <p className="text-base sm:text-lg font-bold text-gray-800">
                    {c.remaining}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">
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
              className="mx-auto text-gray-300 mb-3 sm:w-12 sm:h-12"
            />
            <p className="text-xs sm:text-sm text-gray-500">
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
              onCancel={() => setPayingBundle(null)}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}

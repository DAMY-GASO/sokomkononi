// ============================================================
// RevenueSection.jsx
// Mapato & Fedha — fees zote 5 + Categories Bila Fee Config.
// Bilingual + image support kwenye categories.
// ============================================================

import React, { useState } from "react";
import {
  Home,
  Clock,
  Rocket,
  Search,
  Smartphone,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import EditableAmount from "../components/Revenue/EditableAmount.jsx";
import EditablePercent from "../components/Revenue/EditablePercent.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useReservationRates, updateReservationRate } from "../../../../config/feePolicy.js";
import { useBoostPackages, updateBoostPackagePrice } from "../../../../config/boostPackagesStore.js";
import {
  useListingFeeConfigs,
  updateListingFeeConfig,
  addFeeConfig,
  hasFeeConfig,
} from "../../../../config/listingFeeStore.js";
import { useLeadingFeeConfig, updateLeadingFeePrice } from "../../../../config/leadingFeeStore.js";
import { useAdvertisementFeeConfig, updateAdvertisementFeePrice } from "../../../../config/advertisementFeeStore.js";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../../../../config/categoriesStore.js";

export default function RevenueSection() {
  const { lang } = useLanguage();
  const listingFeeConfigs = useListingFeeConfigs();
  const reservationRates = useReservationRates();
  const boostPackages = useBoostPackages();
  const leadingFee = useLeadingFeeConfig();
  const adFee = useAdvertisementFeeConfig();
  const activeCategories = useActiveCategories();
  const [saved, setSaved] = useState(false);
  const [flash, setFlash] = useState(null);

  const showFlash = (msg, type = "success") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 3500);
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const updateListingFeeRate = (key, rate) => {
    updateListingFeeConfig(key, { rate });
    flashSaved();
  };
  const updateListingFeeMin = (key, min) => {
    updateListingFeeConfig(key, { min });
    flashSaved();
  };
  const updateListingFeeMax = (key, max) => {
    updateListingFeeConfig(key, { max });
    flashSaved();
  };
  const updateReservationFee = (id, fee) => {
    updateReservationRate(id, fee);
    flashSaved();
  };
  const updateBoostPrice = (key, price) => {
    updateBoostPackagePrice(key, price);
    flashSaved();
  };
  const updateLeadingPrice = (price) => {
    updateLeadingFeePrice(price);
    flashSaved();
  };
  const updateAdvertisementPrice = (price) => {
    updateAdvertisementFeePrice(price);
    flashSaved();
  };

  const missingFeeCategories = activeCategories.filter(
    (c) => !hasFeeConfig(c.key)
  );

  const handleAddFeeConfig = (cat) => {
    try {
      addFeeConfig(cat.key, cat.label?.sw || cat.key);
      showFlash(
        lang === "sw"
          ? `Fee config ya "${cat.key}" imeongezwa kwa default (1%, min 10,000, max 100,000). Hariri hapa chini kubadilisha.`
          : `Fee config for "${cat.key}" added with default (1%, min 10,000, max 100,000). Edit below to change.`
      );
    } catch (e) {
      showFlash(e.message, "error");
    }
  };

  return (
    <>
      <SectionHeader
        title={
          lang === "sw" ? "Mapato & Fedha" : "Revenue & Financial Settings"
        }
        subtitle={
          lang === "sw"
            ? "Vyanzo vyote 5 vya mapato — bofya kiasi kubadilisha"
            : "All 5 revenue streams — tap amount to edit"
        }
      />
      {saved && (
        <div
          style={{ background: `${COLORS.green}15`, color: COLORS.green }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4 inline-block"
        >
          {lang === "sw" ? "Imehifadhiwa" : "Saved"}
        </div>
      )}
      {flash && (
        <div
          style={{
            background:
              flash.type === "error" ? `${COLORS.rust}15` : `${COLORS.green}15`,
            color: flash.type === "error" ? COLORS.rust : COLORS.green,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4 inline-block"
        >
          {flash.msg}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* CATEGORIES BILA FEE CONFIG */}
        {missingFeeCategories.length > 0 && (
          <div
            className="bg-white rounded-xl border p-5"
            style={{ borderColor: COLORS.rust, borderWidth: "2px" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                style={{ background: `${COLORS.rust}15` }}
                className="w-9 h-9 rounded-lg flex items-center justify-center"
              >
                <AlertTriangle size={16} color={COLORS.rust} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {lang === "sw"
                    ? `Categories Bila Fee Config (${missingFeeCategories.length})`
                    : `Categories Without Fee Config (${missingFeeCategories.length})`}
                </p>
                <p className="text-xs text-gray-500">
                  {lang === "sw"
                    ? 'Categories hizi ni hai lakini wauzaji hawawezi kuunda listing — bofya "Ongeza Fee" kwa kila moja'
                    : 'These categories are active but sellers cannot create listings — click "Add Fee" for each'}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {missingFeeCategories.map((cat) => {
                const Icon = getCategoryIcon(cat.iconKey);
                const hasPhoto = Boolean(cat.imageUrl);
                return (
                  <div
                    key={cat.key}
                    style={{ borderColor: COLORS.sandLine }}
                    className="flex items-center gap-3 border rounded-lg px-3 py-2"
                  >
                    {/* PHOTO / ICON */}
                    {hasPhoto ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.label?.sw || cat.key}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div
                        style={{ background: COLORS.night }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      >
                        <Icon size={14} color={COLORS.gold} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {cat.label?.sw || cat.key}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {cat.key}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddFeeConfig(cat)}
                      style={{ background: COLORS.rust, color: "white" }}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
                    >
                      <Plus size={12} />{" "}
                      {lang === "sw" ? "Ongeza Fee" : "Add Fee"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 1. Listing Fee */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div
              style={{ background: `${COLORS.gold}15` }}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
            >
              <Home size={16} color={COLORS.gold} />
            </div>
            <p className="text-sm font-semibold text-gray-800">Listing Fee</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            {lang === "sw"
              ? "Asilimia ya bei ya mali kwa category, na ukomo wa chini/juu"
              : "Percentage of property price per category, with min/max caps"}
          </p>
          <div className="divide-y divide-gray-100">
            {listingFeeConfigs.map((c) => (
              <div
                key={c.key}
                className="flex items-center justify-between py-2.5 gap-3 flex-wrap"
              >
                <span className="text-sm text-gray-600 min-w-[120px]">
                  {c.label}
                </span>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-400">Rate</span>
                    <EditablePercent
                      value={c.rate}
                      onSave={(v) => updateListingFeeRate(c.key, v)}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-400">Min</span>
                    <EditableAmount
                      value={c.min}
                      onSave={(v) => updateListingFeeMin(c.key, v)}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-400">Max</span>
                    <EditableAmount
                      value={c.max}
                      onSave={(v) => updateListingFeeMax(c.key, v)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Reservation Fee */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div
              style={{ background: `${COLORS.green}15` }}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
            >
              <Clock size={16} color={COLORS.green} />
            </div>
            <p className="text-sm font-semibold text-gray-800">
              Reservation Fee
            </p>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            {lang === "sw"
              ? "100% mapato ya SokoMkononi — hakuna 50/50 split"
              : "100% SokoMkononi revenue — no 50/50 split"}
          </p>
          <div className="divide-y divide-gray-100">
            {reservationRates.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2.5"
              >
                <span className="text-sm text-gray-600">{r.label}</span>
                <EditableAmount
                  value={r.fee}
                  onSave={(v) => updateReservationFee(r.id, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 3. Boost Packages */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-1">
            <div
              style={{ background: `${COLORS.rust}15` }}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
            >
              <Rocket size={16} color={COLORS.rust} />
            </div>
            <p className="text-sm font-semibold text-gray-800">
              Boost Packages
            </p>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            {lang === "sw"
              ? "Bei za Boost Sasa (Basic/Featured/Premium)"
              : "Boost Now prices (Basic/Featured/Premium)"}
          </p>
          <div className="divide-y divide-gray-100">
            {boostPackages.map((pkg) => (
              <div
                key={pkg.key}
                className="flex items-center justify-between py-2.5"
              >
                <span className="text-sm text-gray-600">
                  {pkg.label}{" "}
                  <span className="text-gray-400">
                    ({pkg.days} {lang === "sw" ? "siku" : "days"})
                  </span>
                </span>
                <EditableAmount
                  value={pkg.price}
                  onSave={(v) => updateBoostPrice(pkg.key, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 4 + 5. Leading Fee na Advertisement Fee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
            <div
              style={{ background: `${COLORS.rust}15` }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
            >
              <Search size={18} color={COLORS.rust} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {leadingFee.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{leadingFee.desc}</p>
            </div>
            <EditableAmount
              value={leadingFee.price}
              onSave={updateLeadingPrice}
            />
            <span className="text-[11px] text-gray-400 -mt-2">
              / {lang === "sw" ? `siku ${leadingFee.days}` : `${leadingFee.days} days`}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
            <div
              style={{ background: `${COLORS.rust}15` }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
            >
              <Smartphone size={18} color={COLORS.rust} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {adFee.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{adFee.desc}</p>
            </div>
            <EditableAmount
              value={adFee.price}
              onSave={updateAdvertisementPrice}
            />
            <span className="text-[11px] text-gray-400 -mt-2">
              / {lang === "sw" ? `siku ${adFee.days}` : `${adFee.days} days`}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

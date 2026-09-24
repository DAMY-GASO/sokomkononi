// ============================================================
// RevenueSection.jsx
// Mapato & Fedha — fees zote 5 + Categories Bila Fee Config.
// ASYNC via API for all editable fields (with rollback).
// ============================================================
import React, { useState } from "react";
import {
  Home, Clock, Rocket, Search, Smartphone, Plus, AlertTriangle, Pencil, Info, Loader2,
} from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import EditableAmount from "../components/Revenue/EditableAmount.jsx";
import EditablePercent from "../components/Revenue/EditablePercent.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useReservationRates,
  updateReservationRateAsync,
} from "../../../../config/feePolicy.js";
import {
  useBoostPackages,
  updateBoostPackagePriceAsync,
} from "../../../../config/boostPackagesStore.js";
import {
  useListingFeeConfigs,
  updateListingFeeConfigAsync,
  addFeeConfigAsync,
  hasFeeConfig,
} from "../../../../config/listingFeeStore.js";
import {
  useLeadingFeeConfig,
  updateLeadingFeePriceAsync,
} from "../../../../config/leadingFeeStore.js";
import {
  useAdvertisementFeeConfig,
  updateAdvertisementFeePriceAsync,
} from "../../../../config/advertisementFeeStore.js";
import {
  useActiveCategories,
  getCategory,
  getCategoryIcon,
} from "../../../../config/categoriesStore.js";

function getLocalized(field, lang) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field?.[lang] || field?.sw || "";
}

function RevenueCard({ accentColor, children }) {
  return (
    <div
      className="bg-white rounded-xl border-2 p-4 sm:p-5 transition-all hover:shadow-md"
      style={{ borderColor: `${accentColor}30` }}
    >
      {children}
    </div>
  );
}

function EditHint({ lang, accentColor = COLORS.gold }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  return (
    <p className="text-[11px] font-medium mb-3 flex items-center gap-1.5"
       style={{ color: accentColor }}>
      <Pencil size={11} />
      {t("Bofya kiasi chochote kuhariri", "Click any amount to edit")}
    </p>
  );
}

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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState({});

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const showFlash = (msg, type = "success") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 3500);
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const withBusy = async (key, fn) => {
    if (busy[key]) return;
    setBusy((b) => ({ ...b, [key]: true }));
    setError("");
    try {
      const res = await fn();
      if (res && res.ok === false) {
        setError(
          res.error?.message ||
            t("Imeshindwa kuhifadhi.", "Failed to save.")
        );
      }
      return res;
    } catch (e) {
      setError(e?.message || t("Hitilafu isiyojulikana.", "Unexpected error."));
      return { ok: false, error: e };
    } finally {
      setBusy((b) => { const n = { ...b }; delete n[key]; return n; });
    }
  };

  // ============================================================
  // LISTING FEE — ASYNC
  // ============================================================
  const updateListingFeeRate = (key, rate) =>
    withBusy(`lf-rate-${key}`, async () => {
      const res = await updateListingFeeConfigAsync(key, { rate });
      if (res.ok) flashSaved();
      else setError(res.error?.message || t("Imeshindwa kuhifadhi kiwango.", "Failed to save rate."));
    });

  const updateListingFeeMin = (key, min) =>
    withBusy(`lf-min-${key}`, async () => {
      const res = await updateListingFeeConfigAsync(key, { min });
      if (res.ok) flashSaved();
      else setError(res.error?.message || t("Imeshindwa kuhifadhi kiwango cha chini.", "Failed to save min."));
    });

  const updateListingFeeMax = (key, max) =>
    withBusy(`lf-max-${key}`, async () => {
      const res = await updateListingFeeConfigAsync(key, { max });
      if (res.ok) flashSaved();
      else setError(res.error?.message || t("Imeshindwa kuhifadhi kiwango cha juu.", "Failed to save max."));
    });

  // ============================================================
  // RESERVATION — ASYNC
  // ============================================================
  const updateReservationFee = (id, fee) =>
    withBusy(`res-${id}`, async () => {
      const res = await updateReservationRateAsync(id, fee);
      if (res.ok) flashSaved();
      else setError(res.error?.message || t("Imeshindwa kuhifadhi ada ya reservation.", "Failed to save reservation fee."));
    });

  // ============================================================
  // BOOST — ASYNC
  // ============================================================
  const updateBoostPrice = (key, price) =>
    withBusy(`boost-${key}`, async () => {
      const res = await updateBoostPackagePriceAsync(key, price);
      if (res.ok) flashSaved();
      else setError(res.error?.message || t("Imeshindwa kuhifadhi bei ya boost.", "Failed to save boost price."));
    });

  // ============================================================
  // LEADING — ASYNC
  // ============================================================
  const updateLeadingPrice = (price) =>
    withBusy("leading", async () => {
      const res = await updateLeadingFeePriceAsync(price);
      if (res.ok) flashSaved();
      else setError(res.error?.message || t("Imeshindwa kuhifadhi ada ya leading.", "Failed to save leading fee."));
    });

  // ============================================================
  // ADVERTISEMENT — ASYNC
  // ============================================================
  const updateAdvertisementPrice = (price) =>
    withBusy("advertisement", async () => {
      const res = await updateAdvertisementFeePriceAsync(price);
      if (res.ok) flashSaved();
      else setError(res.error?.message || t("Imeshindwa kuhifadhi ada ya matangazo.", "Failed to save advertisement fee."));
    });

  const missingFeeCategories = activeCategories.filter((c) => !hasFeeConfig(c.key));

  const handleAddFeeConfig = (cat) =>
    withBusy(`add-fee-${cat.key}`, async () => {
      // Backend expects { name, percentage, min_price, max_price, priority }
      const nameForApi =
        cat?.label?.en || cat?.label?.sw || cat?.key || "New Category";
      const res = await addFeeConfigAsync({
        name: nameForApi,
        percentage: 1.0,
        min_price: 10000,
        max_price: 100000,
        priority: 0,
      });
      if (res.ok) {
        showFlash(
          t(
            `Fee config ya "${cat.key}" imeongezwa (1%, min 10,000, max 100,000).`,
            `Fee config for "${cat.key}" added (1%, min 10,000, max 100,000).`
          )
        );
      } else {
        setError(res.error?.message || t("Imeshindwa kuongeza fee config.", "Failed to add fee config."));
      }
    });

  return (
    <>
      <SectionHeader
        title={t("Mapato & Fedha", "Revenue & Financial Settings")}
        subtitle={t(
          "Vyanzo vyote 5 vya mapato — bofya kiasi kubadilisha",
          "All 5 revenue streams — tap amount to edit"
        )}
      />

      {(saved || flash || error) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {saved && (
            <div style={{ background: `${COLORS.green}15`, color: COLORS.green }}
                 className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5">
              ✓ {t("Imehifadhiwa", "Saved")}
            </div>
          )}
          {flash && (
            <div style={{
              background: flash.type === "error" ? `${COLORS.rust}15` : `${COLORS.green}15`,
              color: flash.type === "error" ? COLORS.rust : COLORS.green,
            }} className="text-xs font-semibold px-3 py-2 rounded-lg">
              {flash.msg}
            </div>
          )}
          {error && (
            <div style={{ background: `${COLORS.rust}15`, color: COLORS.rust }}
                 className="text-xs font-semibold px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* MISSING FEE CONFIGS */}
        {missingFeeCategories.length > 0 && (
          <div className="rounded-xl border-2 p-4 sm:p-5"
               style={{ borderColor: COLORS.rust, background: `${COLORS.rust}05` }}>
            <div className="flex items-start gap-3 mb-4">
              <div style={{ background: `${COLORS.rust}20` }}
                   className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle size={18} color={COLORS.rust} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">
                  {t(`Categories Bila Fee Config (${missingFeeCategories.length})`,
                     `Categories Without Fee Config (${missingFeeCategories.length})`)}
                </p>
                <p className="text-xs text-secondary mt-0.5">
                  {t(
                    'Categories hizi ni hai lakini wauzaji hawawezi kuunda listing — bofya "Ongeza Fee" kwa kila moja',
                    'These categories are active but sellers cannot create listings — click "Add Fee" for each'
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {missingFeeCategories.map((cat) => {
                const Icon = getCategoryIcon(cat.iconKey);
                const hasPhoto = Boolean(cat.imageUrl);
                const catLabel = cat.label?.[lang] || cat.label?.sw || cat.key;
                const isBusy = !!busy[`add-fee-${cat.key}`];
                return (
                  <div key={cat.key}
                       style={{ borderColor: COLORS.sandLine }}
                       className="flex items-center gap-2 sm:gap-3 border rounded-lg px-2.5 sm:px-3 py-2 bg-white">
                    {hasPhoto ? (
                      <img src={cat.imageUrl} alt={catLabel} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div style={{ background: COLORS.night }}
                           className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                        <Icon size={14} color={COLORS.gold} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{catLabel}</p>
                      <p className="text-[11px] text-muted font-mono truncate">{cat.key}</p>
                    </div>
                    <button onClick={() => handleAddFeeConfig(cat)} disabled={isBusy}
                            style={{ background: COLORS.rust, color: "white" }}
                            className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg shrink-0 hover:opacity-90 transition-opacity disabled:opacity-50">
                      {isBusy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      <span className="hidden sm:inline">{t("Ongeza Fee", "Add Fee")}</span>
                      <span className="sm:hidden">{t("Ongeza", "Add")}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 1. LISTING FEE */}
        <RevenueCard accentColor={COLORS.gold}>
          <div className="flex items-center gap-3 mb-1">
            <div style={{ background: `${COLORS.gold}15` }}
                 className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
              <Home size={18} color={COLORS.gold} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">
                {t("Ada ya Kuchapisha", "Listing Fee")}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {t("Asilimia ya bei ya mali kwa category", "Percentage of property price per category")}
              </p>
            </div>
          </div>
          <EditHint lang={lang} accentColor={COLORS.gold} />
          <div className="divide-y divide-gray-100">
            {listingFeeConfigs.map((c) => {
              const category = getCategory(c.key);
              const catLabel = category?.label?.[lang] || category?.label?.sw || c.key;
              return (
                <div key={c.key} className="py-3">
                  <p className="text-sm font-medium text-primary mb-2">{catLabel}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                        {t("Kiwango", "Rate")}
                      </span>
                      <div className="w-full min-w-0">
                        <EditablePercent value={c.rate} onSave={(v) => updateListingFeeRate(c.key, v)} />
                      </div>
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                        {t("Chini", "Min")}
                      </span>
                      <div className="w-full min-w-0">
                        <EditableAmount value={c.min} onSave={(v) => updateListingFeeMin(c.key, v)} />
                      </div>
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                        {t("Juu", "Max")}
                      </span>
                      <div className="w-full min-w-0">
                        <EditableAmount value={c.max} onSave={(v) => updateListingFeeMax(c.key, v)} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </RevenueCard>

        {/* 2. RESERVATION */}
        <RevenueCard accentColor={COLORS.green}>
          <div className="flex items-center gap-3 mb-1">
            <div style={{ background: `${COLORS.green}15` }}
                 className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
              <Clock size={18} color={COLORS.green} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">
                {t("Ada ya Reservation", "Reservation Fee")}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {t("100% mapato ya SokoMkononi", "100% SokoMkononi revenue")}
              </p>
            </div>
          </div>
          <EditHint lang={lang} accentColor={COLORS.green} />
          <div className="divide-y divide-gray-100">
            {reservationRates.map((r) => (
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2.5">
                <span className="text-sm text-secondary min-w-0 truncate">
                  {r.label?.[lang] || r.label?.sw || r.id}
                </span>
                <div className="w-full sm:w-40 shrink-0">
                  <EditableAmount value={r.fee} onSave={(v) => updateReservationFee(r.id, v)} />
                </div>
              </div>
            ))}
          </div>
        </RevenueCard>

        {/* 3. BOOST */}
        <RevenueCard accentColor={COLORS.rust}>
          <div className="flex items-center gap-3 mb-1">
            <div style={{ background: `${COLORS.rust}15` }}
                 className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
              <Rocket size={18} color={COLORS.rust} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">
                {t("Vifurushi vya Boost", "Boost Packages")}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {t("Bei za Boost Sasa", "Boost Now prices")}
              </p>
            </div>
          </div>
          <EditHint lang={lang} accentColor={COLORS.rust} />
          <div className="divide-y divide-gray-100">
            {boostPackages.map((pkg) => (
              <div key={pkg.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2.5">
                <span className="text-sm text-secondary min-w-0 truncate">
                  {pkg.label?.[lang] || pkg.label?.sw || pkg.key}{" "}
                  <span className="text-muted">({pkg.days} {t("siku", "days")})</span>
                </span>
                <div className="w-full sm:w-40 shrink-0">
                  <EditableAmount value={pkg.price} onSave={(v) => updateBoostPrice(pkg.key, v)} />
                </div>
              </div>
            ))}
          </div>
        </RevenueCard>

        {/* 4 + 5. LEADING + ADVERTISEMENT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RevenueCard accentColor={COLORS.rust}>
            <div style={{ background: `${COLORS.rust}15` }}
                 className="w-10 h-10 rounded-xl flex items-center justify-center mb-3">
              <Search size={18} color={COLORS.rust} />
            </div>
            <div className="mb-3">
              <p className="text-sm font-semibold text-primary">
                {getLocalized(leadingFee.label, lang)}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {getLocalized(leadingFee.desc, lang)}
              </p>
            </div>
            <EditHint lang={lang} accentColor={COLORS.rust} />
            <EditableAmount value={leadingFee.price} onSave={updateLeadingPrice} />
            <span className="text-[11px] text-muted mt-1.5 block">
              / {t(`siku ${leadingFee.days}`, `${leadingFee.days} days`)}
            </span>
          </RevenueCard>

          <RevenueCard accentColor={COLORS.rust}>
            <div style={{ background: `${COLORS.rust}15` }}
                 className="w-10 h-10 rounded-xl flex items-center justify-center mb-3">
              <Smartphone size={18} color={COLORS.rust} />
            </div>
            <div className="mb-3">
              <p className="text-sm font-semibold text-primary">
                {getLocalized(adFee.label, lang)}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {getLocalized(adFee.desc, lang)}
              </p>
            </div>
            <EditHint lang={lang} accentColor={COLORS.rust} />
            <EditableAmount value={adFee.price} onSave={updateAdvertisementPrice} />
            <span className="text-[11px] text-muted mt-1.5 block">
              / {t(`siku ${adFee.days}`, `${adFee.days} days`)}
            </span>
          </RevenueCard>
        </div>

        <div className="rounded-xl border px-4 py-3 flex items-start gap-2.5"
             style={{ background: `${COLORS.gold}08`, borderColor: `${COLORS.gold}30` }}>
          <Info size={16} color={COLORS.gold} className="shrink-0 mt-0.5" />
          <p className="text-xs text-secondary leading-relaxed">
            {t(
              "Mabadiliko yote yanahifadhiwa papo hapo kwenye backend. Kama endpoint fulani haipo bado, mabadiliko yanahifadhiwa local na kusawazishwa baadaye.",
              "All changes are saved to the backend instantly. If an endpoint isn't ready yet, changes are kept locally and synced later."
            )}
          </p>
        </div>
      </div>
    </>
  );
}

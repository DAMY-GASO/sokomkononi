// ============================================================
// RevenueSection.jsx — fully backend-synced
// Flat fees: listing, reservation (tiers), success.
// Packages: boost, leading, advertisement (Add/Edit/Delete/Toggle).
// ============================================================
import React, { useState, useRef } from "react";
import {
  Home, Clock, Rocket, Search, Smartphone, Plus, AlertTriangle,
  Pencil, Info, Loader2, RefreshCw, Trash2, Wallet,
  TrendingUp,
} from "lucide-react";
import { COLORS } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import EditableAmount from "../components/Revenue/EditableAmount.jsx";
import EditablePercent from "../components/Revenue/EditablePercent.jsx";
import EditableNumber from "../components/Revenue/EditableNumber.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  useReservationSettings,
  useReservationTiers,
  toggleReservationFeeAsync,
  addReservationTierAsync,
  updateReservationTierAsync,
  removeReservationTierAsync,
  toggleReservationTierAsync,
  hydrateReservationFromApi,
} from "../../../../config/feePolicy.js";
import {
  useListingFeeConfigs, updateListingFeeConfigAsync, addFeeConfigAsync,
  hasFeeConfig, hydrateListingFeeConfigsFromApi, removeFeeConfigAsync,
  cleanupOrphanFeeConfigsAsync, updateListingFeeFlatAsync,
  updateListingFeeModeAsync, toggleListingFeeActiveAsync,
} from "../../../../config/listingFeeStore.js";
import {
  useLeadingFeeConfig,
  toggleLeadingFeeAsync,
  hydrateLeadingFeeFromApi,
} from "../../../../config/leadingFeeStore.js";
import {
  useLeadingPackages,
  hydrateLeadingPackagesFromApi,
  addLeadingPackageAsync,
  updateLeadingPackageAsync,
  removeLeadingPackageAsync,
  toggleLeadingPackageAsync,
} from "../../../../config/leadingPackagesStore.js";
import {
  useAdvertisementFeeConfig,
  toggleAdvertisementFeeAsync,
  hydrateAdvertisementFeeFromApi,
} from "../../../../config/advertisementFeeStore.js";
import {
  useAdvertisementPackages,
  hydrateAdvertisementPackagesFromApi,
  addAdvertisementPackageAsync,
  updateAdvertisementPackageAsync,
  removeAdvertisementPackageAsync,
  toggleAdvertisementPackageAsync,
} from "../../../../config/advertisementPackagesStore.js";
import {
  useSuccessFeeConfig, updateSuccessFeeAsync, toggleSuccessFeeAsync,
  hydrateSuccessFeeFromApi,
} from "../../../../config/successFeeStore.js";
import {
  useBoostPackages,
  hydrateBoostPackagesFromApi,
  updateBoostPackagePriceAsync,
  toggleBoostPackageActiveAsync,
} from "../../../../config/boostPackagesStore.js";
import {
  useBoostFee,
  hydrateBoostFeeFromApi,
  toggleBoostFeeAsync,
} from "../../../../config/boostFeeStore.js";
import {
  useActiveCategories, getCategory, getCategoryIcon,
} from "../../../../config/categoriesStore.js";

// ── Helpers ───────────────────────────────────────────────
function getLocalized(field, lang) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field?.[lang] || field?.sw || field?.en || "";
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
    <p
      className="text-[11px] font-medium mb-3 flex items-center gap-1.5"
      style={{ color: accentColor }}
    >
      <Pencil size={11} />
      {t("Bofya kiasi chochote kuhariri", "Click any amount to edit")}
    </p>
  );
}

// ── Toggle Switch (ON = kulia, OFF = kushoto) ────────────
function ToggleSwitch({ enabled, onToggle, disabled, lang, compact = false }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const w = compact ? "w-9" : "w-11";
  const h = compact ? "h-5" : "h-6";
  const knob = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  const travel = compact ? "translateX(18px)" : "translateX(24px)";
  const rest = compact ? "translateX(3px)" : "translateX(4px)";

  return (
    <div className="flex items-center gap-2 shrink-0">
      {!compact && (
        <span
          className="text-[10px] font-bold uppercase tracking-wide"
          style={{ color: enabled ? COLORS.green : COLORS.rust }}
        >
          {enabled ? t("IMEWASHWA", "ON") : t("IMEZIMWA", "OFF")}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex items-center ${h} ${w} rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0`}
        style={{ background: enabled ? COLORS.green : "#D1D5DB" }}
      >
        <span
          className={`inline-block ${knob} rounded-full bg-white shadow transform transition-transform`}
          style={{ transform: enabled ? travel : rest }}
        />
      </button>
    </div>
  );
}

// ============================================================
// PACKAGE ROW — inatumika kwa Boost, Leading, Advertisement
// ============================================================
function PackageRow({
  pkg,
  lang,
  onUpdatePrice,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
  accentColor,
  t,
}) {
  return (
    <div className="py-3 flex items-center gap-2 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary truncate">
          {pkg.name}
        </p>
        <p className="text-[10px] text-muted">
          {pkg.hours}h ({pkg.days} {t("siku", "days")})
          {pkg.pricing?.discount_percent > 0 && (
            <span
              style={{ background: `${COLORS.rust}15`, color: COLORS.rust }}
              className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            >
              -{pkg.pricing.discount_percent}%
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end gap-0.5">
          {pkg.pricing?.discount_percent > 0 && (
            <span className="text-[10px] text-muted line-through">
              {formatTZSSimple(pkg.pricing.base_price)}
            </span>
          )}
          <EditableAmount
            value={pkg.pricing?.discount_percent > 0 ? pkg.pricing.final_price : pkg.price}
            onSave={onUpdatePrice}
          />
        </div>
        <ToggleSwitch
          enabled={pkg.isActive}
          onToggle={onToggle}
          disabled={isToggling}
          lang={lang}
          compact
        />
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1.5 text-muted hover:text-[#C1502E] rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Trash2 size={12} />
          )}
        </button>
      </div>
    </div>
  );
}

function formatTZSSimple(amount) {
  return "TZS " + Math.round(Number(amount) || 0).toLocaleString("en-US");
}

export default function RevenueSection() {
  const { lang } = useLanguage();
  const listingFeeConfigs = useListingFeeConfigs();
  const reservationSettings = useReservationSettings();
  const reservationTiers = useReservationTiers();
  const leadingFee = useLeadingFeeConfig();
  const leadingPackages = useLeadingPackages();
  const adFee = useAdvertisementFeeConfig();
  const advertisementPackages = useAdvertisementPackages();
  const successFee = useSuccessFeeConfig();
  const boostPackages = useBoostPackages();
  const boostFee = useBoostFee();
  const activeCategories = useActiveCategories();

  const [flash, setFlash] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const showFlash = (msg, type = "success") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 3500);
  };

  // ── Global refresh from backend ─────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const results = await Promise.allSettled([
        hydrateReservationFromApi(),
        hydrateListingFeeConfigsFromApi(),
        hydrateLeadingFeeFromApi(),
        hydrateLeadingPackagesFromApi(),
        hydrateAdvertisementFeeFromApi(),
        hydrateAdvertisementPackagesFromApi(),
        hydrateSuccessFeeFromApi(),
        hydrateBoostPackagesFromApi(),
        hydrateBoostFeeFromApi(),
      ]);
      const failed = results.filter(
        (r) => r.status === "rejected" || r.value?.ok === false
      );
      setLastSync(new Date());
      if (failed.length) {
        showFlash(
          t(
            `Imeshindwa kupakia sehemu ${failed.length}`,
            `Failed to load ${failed.length} section(s)`
          ),
          "error"
        );
      } else {
        showFlash(
          t(
            "Data imesasishwa kutoka backend",
            "Data refreshed from backend"
          )
        );
      }
    } finally {
      setRefreshing(false);
    }
  };

  const inflightRef = useRef(new Set());

  const withBusy = async (key, fn) => {
    if (inflightRef.current.has(key)) return;
    inflightRef.current.add(key);
    setBusy((b) => ({ ...b, [key]: true }));
    setError("");
    try {
      const res = await fn();
      if (res && res.ok === false) {
        setError(
          res.error?.data?.detail ||
            res.error?.message ||
            t("Imeshindwa kuhifadhi.", "Failed to save.")
        );
        return { ok: false, error: res.error };
      }
      return res || { ok: true };
    } catch (e) {
      setError(
        e?.data?.detail || e?.message || t("Hitilafu.", "Error.")
      );
      return { ok: false, error: e };
    } finally {
      inflightRef.current.delete(key);
      setBusy((b) => {
        const n = { ...b };
        delete n[key];
        return n;
      });
    }
  };

  const flashSaved = () => showFlash(t("Imehifadhiwa", "Saved"));

  // ═══════════════════════════════════════════════════════════
  // LISTING FEE
  // ═══════════════════════════════════════════════════════════
  const updateListingFeeRate = (key, rate) =>
    withBusy(`lf-rate-${key}`, async () => {
      const res = await updateListingFeeConfigAsync(key, { rate });
      if (res.ok) flashSaved();
      return res;
    });

  const updateListingFeeFlat = (key, flatFee) =>
    withBusy(`lf-flat-${key}`, async () => {
      const res = await updateListingFeeFlatAsync(key, flatFee);
      if (res.ok) flashSaved();
      return res;
    });

  const updateListingFeeMode = (key, mode) =>
    withBusy(`lf-mode-${key}`, async () => {
      const res = await updateListingFeeModeAsync(key, mode);
      if (res.ok) flashSaved();
      return res;
    });

  const toggleListingFee = (key) =>
    withBusy(`lf-toggle-${key}`, async () => {
      const res = await toggleListingFeeActiveAsync(key);
      if (res.ok) flashSaved();
      return res;
    });

  const updateListingFeeMin = (key, min) =>
    withBusy(`lf-min-${key}`, async () => {
      const res = await updateListingFeeConfigAsync(key, { min });
      if (res.ok) flashSaved();
      return res;
    });

  const updateListingFeeMax = (key, max) =>
    withBusy(`lf-max-${key}`, async () => {
      const res = await updateListingFeeConfigAsync(key, { max });
      if (res.ok) flashSaved();
      return res;
    });

  // ═══════════════════════════════════════════════════════════
  // RESERVATION — Settings (toggle) + Tiers CRUD
  // ═══════════════════════════════════════════════════════════
  const toggleReservation = () =>
    withBusy("res-toggle", async () => {
      const res = await toggleReservationFeeAsync();
      if (res.ok) flashSaved();
      return res;
    });

  const handleAddTier = () =>
    withBusy("res-add-tier", async () => {
      const nextOrder =
        reservationTiers.length > 0
          ? Math.max(...reservationTiers.map((t) => t.order || 0)) + 1
          : 1;
      const nextHours =
        reservationTiers.length > 0
          ? Math.max(...reservationTiers.map((t) => t.hours || 0)) + 12
          : 12;
      const res = await addReservationTierAsync({
        hours: nextHours,
        fee: 1000,
        is_active: true,
        order: nextOrder,
      });
      if (res.ok) flashSaved();
      return res;
    });

  const updateTierHours = (id, hours) =>
    withBusy(`res-tier-h-${id}`, async () => {
      const res = await updateReservationTierAsync(id, { hours });
      if (res.ok) flashSaved();
      return res;
    });

  const updateTierFee = (id, fee) =>
    withBusy(`res-tier-f-${id}`, async () => {
      const res = await updateReservationTierAsync(id, { fee });
      if (res.ok) flashSaved();
      return res;
    });

  const toggleTier = (id) =>
    withBusy(`res-tier-t-${id}`, async () => {
      const res = await toggleReservationTierAsync(id);
      if (res.ok) flashSaved();
      return res;
    });

  const handleDeleteTier = (tier) => {
    if (
      !window.confirm(
        t(
          `Futa tier ya saa ${tier.hours}?`,
          `Delete tier for ${tier.hours} hours?`
        )
      )
    )
      return;
    withBusy(`res-tier-d-${tier.id}`, async () => {
      const res = await removeReservationTierAsync(tier.id);
      if (res.ok) {
        showFlash(t("Tier imefutwa.", "Tier deleted."));
      }
      return res;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // SUCCESS FEE — Singleton
  // ═══════════════════════════════════════════════════════════
  const updateSuccessPercentage = (pct) =>
    withBusy("success-pct", async () => {
      const res = await updateSuccessFeeAsync({ percentage: pct });
      if (res.ok) flashSaved();
      return res;
    });

  const updateSuccessMin = (min) =>
    withBusy("success-min", async () => {
      const res = await updateSuccessFeeAsync({ min_fee: min });
      if (res.ok) flashSaved();
      return res;
    });

  const updateSuccessMax = (max) =>
    withBusy("success-max", async () => {
      const res = await updateSuccessFeeAsync({ max_fee: max });
      if (res.ok) flashSaved();
      return res;
    });

  const toggleSuccess = () =>
    withBusy("success-toggle", async () => {
      const res = await toggleSuccessFeeAsync();
      if (res.ok) flashSaved();
      return res;
    });

  // ═══════════════════════════════════════════════════════════
  // LEADING — Toggle + Packages CRUD
  // ═══════════════════════════════════════════════════════════
  const toggleLeading = () =>
    withBusy("leading-toggle", async () => {
      const res = await toggleLeadingFeeAsync();
      if (res.ok) flashSaved();
      return res;
    });

  const handleAddLeadingPackage = () =>
    withBusy("leading-add-pkg", async () => {
      const nextOrder =
        leadingPackages.length > 0
          ? Math.max(...leadingPackages.map((p) => p.ordering || 0)) + 1
          : 1;
      const res = await addLeadingPackageAsync({
        name: t("Mpya", "New"),
        hours: 24,
        price: 3000,
        ordering: nextOrder,
      });
      if (res.ok) flashSaved();
      return res;
    });

  const updateLeadingPackagePrice = (id, price) =>
    withBusy(`leading-pkg-p-${id}`, async () => {
      const res = await updateLeadingPackageAsync(id, { price });
      if (res.ok) flashSaved();
      return res;
    });

  const toggleLeadingPackage = (id) =>
    withBusy(`leading-pkg-t-${id}`, async () => {
      const res = await toggleLeadingPackageAsync(id);
      if (res.ok) flashSaved();
      return res;
    });

  const handleDeleteLeadingPackage = (pkg) => {
    if (!window.confirm(t(`Futa package "${pkg.name}"?`, `Delete package "${pkg.name}"?`))) return;
    withBusy(`leading-pkg-d-${pkg.id}`, async () => {
      const res = await removeLeadingPackageAsync(pkg.id);
      if (res.ok) showFlash(t("Package imefutwa.", "Package deleted."));
      return res;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // ADVERTISEMENT — Toggle + Packages CRUD
  // ═══════════════════════════════════════════════════════════
  const toggleAdvertisement = () =>
    withBusy("advertisement-toggle", async () => {
      const res = await toggleAdvertisementFeeAsync();
      if (res.ok) flashSaved();
      return res;
    });

  const handleAddAdvertisementPackage = () =>
    withBusy("ad-add-pkg", async () => {
      const nextOrder =
        advertisementPackages.length > 0
          ? Math.max(...advertisementPackages.map((p) => p.ordering || 0)) + 1
          : 1;
      const res = await addAdvertisementPackageAsync({
        name: t("Mpya", "New"),
        hours: 24,
        price: 5000,
        ordering: nextOrder,
      });
      if (res.ok) flashSaved();
      return res;
    });

  const updateAdvertisementPackagePrice = (id, price) =>
    withBusy(`ad-pkg-p-${id}`, async () => {
      const res = await updateAdvertisementPackageAsync(id, { price });
      if (res.ok) flashSaved();
      return res;
    });

  const toggleAdvertisementPackage = (id) =>
    withBusy(`ad-pkg-t-${id}`, async () => {
      const res = await toggleAdvertisementPackageAsync(id);
      if (res.ok) flashSaved();
      return res;
    });

  const handleDeleteAdvertisementPackage = (pkg) => {
    if (!window.confirm(t(`Futa package "${pkg.name}"?`, `Delete package "${pkg.name}"?`))) return;
    withBusy(`ad-pkg-d-${pkg.id}`, async () => {
      const res = await removeAdvertisementPackageAsync(pkg.id);
      if (res.ok) showFlash(t("Package imefutwa.", "Package deleted."));
      return res;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // BOOST PACKAGES
  // ═══════════════════════════════════════════════════════════
  const updateBoostPrice = (key, price) =>
    withBusy(`boost-${key}`, async () => {
      const res = await updateBoostPackagePriceAsync(key, price);
      if (res.ok) flashSaved();
      return res;
    });

  const toggleBoost = (key) =>
    withBusy(`boost-toggle-${key}`, async () => {
      const res = await toggleBoostPackageActiveAsync(key);
      if (res.ok) flashSaved();
      return res;
    });

  const toggleBoostFee = () =>
    withBusy("boost-fee-toggle", async () => {
      const res = await toggleBoostFeeAsync();
      if (res.ok) flashSaved();
      return res;
    });

  // ── Fee config management ───────────────────────────────
  const missingFeeCategories = activeCategories.filter(
    (c) => !hasFeeConfig(c.key)
  );

  const handleAddFeeConfig = (cat) =>
    withBusy(`add-fee-${cat.key}`, async () => {
      const nameForApi =
        cat?.label?.en || cat?.label?.sw || cat?.key || "New Category";
      const res = await addFeeConfigAsync({
        category_key: cat.key,
        name: nameForApi,
        fee_mode: "FLAT",
        flat_fee: 3000,
        percentage: 0,
        min_price: 10000,
        max_price: 100000,
        priority: 0,
      });
      if (res.ok) {
        showFlash(
          t(
            `Fee config ya "${cat.key}" imeongezwa. Bofya kiasi kuhariri.`,
            `Fee config for "${cat.key}" added. Click amount to edit.`
          )
        );
        await hydrateListingFeeConfigsFromApi();
      }
      return res;
    });

  const orphanCount = listingFeeConfigs.filter((c) => c.orphan).length;

  const handleCleanupOrphans = async () => {
    const orphans = listingFeeConfigs.filter((c) => c.orphan);
    if (orphans.length === 0) return;
    const preview = orphans
      .map((c) => `  • ${c.backendKey || c.key} — ${c.name || "?"}`)
      .join("\n");
    const ok = window.confirm(
      t(
        `Futa fee rules ${orphanCount}:\n\n${preview}\n\nHatua hii haiwezi kurudishwa.`,
        `Delete ${orphanCount} orphan fee rules:\n\n${preview}\n\nThis cannot be undone.`
      )
    );
    if (!ok) return;
    setError("");
    const res = await cleanupOrphanFeeConfigsAsync();
    if (res.ok) {
      showFlash(
        t(
          `Imetolewa ${res.removed}/${res.total} fee rules zisizohitajika.`,
          `Removed ${res.removed}/${res.total} orphan fee rules.`
        )
      );
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kusafisha.", "Failed to clean up.")
      );
    }
  };

  const handleDeleteFeeConfig = (config) => {
    if (
      !window.confirm(
        t(
          `Futa fee rule ya "${config.backendKey || config.key}"?`,
          `Delete fee rule for "${config.backendKey || config.key}"?`
        )
      )
    )
      return;
    withBusy(`lf-del-${config.id}`, async () => {
      const res = await removeFeeConfigAsync(config.key);
      if (res.ok) {
        showFlash(t(`Fee rule imefutwa.`, `Fee rule deleted.`));
      }
      return res;
    });
  };

  return (
    <>
      <SectionHeader
        title={t("Mapato & Fedha", "Revenue & Financial Settings")}
        subtitle={t(
          "Flat fees na packages — bofya kiasi kubadilisha, tumia toggle kuwasha/kuzima.",
          "Flat fees and packages — click any amount to edit, use toggle to on/off."
        )}
      />

      {/* Global status row */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        {orphanCount > 0 && (
          <button
            onClick={handleCleanupOrphans}
            disabled={refreshing || !!busy["cleanup-orphans"]}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors"
            style={{
              borderColor: `${COLORS.rust}55`,
              color: COLORS.rust,
              background: "white",
            }}
          >
            <Trash2 size={13} />
            {t(
              `Safisha Zisizohitajika (${orphanCount})`,
              `Clean Up Orphans (${orphanCount})`
            )}
          </button>
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors disabled:opacity-60"
          style={{
            borderColor: COLORS.sandLine,
            color: COLORS.night,
            background: "white",
          }}
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          {refreshing
            ? t("Inasasisha...", "Refreshing...")
            : t("Sasisha kutoka Backend", "Refresh from Backend")}
        </button>
        {lastSync && (
          <span className="text-[11px] text-muted">
            {t("Mwisho", "Last")}:{" "}
            {lastSync.toLocaleTimeString(lang === "sw" ? "sw-TZ" : "en-US")}
          </span>
        )}
      </div>

      {/* Flash + Error */}
      {(flash || error) && (
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {flash && (
            <div
              style={{
                background:
                  flash.type === "error"
                    ? `${COLORS.rust}15`
                    : `${COLORS.green}15`,
                color: flash.type === "error" ? COLORS.rust : COLORS.green,
              }}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
            >
              {flash.msg}
            </div>
          )}
          {error && (
            <div
              style={{ background: `${COLORS.rust}15`, color: COLORS.rust }}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
            >
              {error}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Missing fee configs */}
        {missingFeeCategories.length > 0 && (
          <div
            className="rounded-xl border-2 p-4 sm:p-5"
            style={{ borderColor: COLORS.rust, background: `${COLORS.rust}05` }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                style={{ background: `${COLORS.rust}20` }}
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              >
                <AlertTriangle size={18} color={COLORS.rust} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">
                  {t(
                    `Categories Bila Fee Config (${missingFeeCategories.length})`,
                    `Categories Without Fee Config (${missingFeeCategories.length})`
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
                  <div
                    key={cat.key}
                    style={{ borderColor: COLORS.sandLine }}
                    className="flex items-center gap-2 sm:gap-3 border rounded-lg px-2.5 sm:px-3 py-2 bg-white"
                  >
                    {hasPhoto ? (
                      <img
                        src={cat.imageUrl}
                        alt={catLabel}
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
                      <p className="text-sm font-semibold text-primary truncate">
                        {catLabel}
                      </p>
                      <p className="text-[11px] text-muted font-mono truncate">
                        {cat.key}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddFeeConfig(cat)}
                      disabled={isBusy}
                      style={{ background: COLORS.rust, color: "white" }}
                      className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg shrink-0 disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Plus size={12} />
                      )}
                      <span className="hidden sm:inline">
                        {t("Ongeza Fee", "Add Fee")}
                      </span>
                      <span className="sm:hidden">{t("Ongeza", "Add")}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 1. LISTING FEE */}
        {/* ═══════════════════════════════════════════════════════ */}
        <RevenueCard accentColor={COLORS.gold}>
          <div className="flex items-center gap-3 mb-1">
            <div
              style={{ background: `${COLORS.gold}15` }}
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            >
              <Home size={18} color={COLORS.gold} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">
                {t("Ada ya Kuchapisha", "Listing Fee")}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {t(
                  "Kwa category — flat au percentage",
                  "Per category — flat or percentage"
                )}
              </p>
            </div>
          </div>
          <EditHint lang={lang} accentColor={COLORS.gold} />
          <div className="divide-y divide-gray-100">
            {listingFeeConfigs.map((c) => {
              const category = getCategory(c.key);
              const catLabel =
                category?.label?.[lang] ||
                category?.label?.sw ||
                c.name ||
                c.backendKey ||
                c.key;
              const isOrphan = !!c.orphan;
              const isDeleting = !!busy[`lf-del-${c.id}`];
              const isToggling = !!busy[`lf-toggle-${c.key}`];
              const isModeBusy = !!busy[`lf-mode-${c.key}`];
              const isFlat = c.feeMode === "FLAT";
              return (
                <div key={c.id ?? c.key} className="py-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-sm font-medium text-primary">
                      {catLabel}
                    </p>
                    {isOrphan && (
                      <span
                        style={{
                          background: "rgba(193,80,46,0.12)",
                          color: COLORS.rust,
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      >
                        {t("BILA CATEGORY", "ORPHAN")}
                      </span>
                    )}
                    {c.backendKey && c.backendKey !== c.key && (
                      <span className="text-[10px] text-muted font-mono">
                        ({c.backendKey})
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1.5">
                      <ToggleSwitch
                        enabled={c.isActive}
                        onToggle={() => toggleListingFee(c.key)}
                        disabled={isToggling || busy.saving}
                        lang={lang}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteFeeConfig(c)}
                        disabled={isDeleting || busy.saving}
                        className="p-1.5 text-muted hover:text-[#C1502E] rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateListingFeeMode(c.key, "PERCENTAGE")
                      }
                      disabled={isModeBusy || isFlat === false}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50"
                      style={{
                        background: !isFlat ? COLORS.gold : "white",
                        color: !isFlat
                          ? COLORS.night
                          : "var(--text-secondary)",
                        borderColor: COLORS.sandLine,
                      }}
                    >
                      {t("Asilimia (%)", "Percentage (%)")}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateListingFeeMode(c.key, "FLAT")}
                      disabled={isModeBusy || isFlat === true}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50"
                      style={{
                        background: isFlat ? COLORS.gold : "white",
                        color: isFlat
                          ? COLORS.night
                          : "var(--text-secondary)",
                        borderColor: COLORS.sandLine,
                      }}
                    >
                      {t("Flat (TZS)", "Flat (TZS)")}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    {isFlat ? (
                      <div className="flex flex-col items-start min-w-0 sm:col-span-3">
                        <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                          {t("Flat Fee (TZS)", "Flat Fee (TZS)")}
                        </span>
                        <div className="w-full min-w-0">
                          <EditableAmount
                            value={c.flatFee}
                            onSave={(v) => updateListingFeeFlat(c.key, v)}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col items-start min-w-0">
                          <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                            {t("Kiwango", "Rate")}
                          </span>
                          <div className="w-full min-w-0">
                            <EditablePercent
                              value={c.rate}
                              onSave={(v) =>
                                updateListingFeeRate(c.key, v)
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                          <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                            {t("Chini", "Min")}
                          </span>
                          <div className="w-full min-w-0">
                            <EditableAmount
                              value={c.min}
                              onSave={(v) => updateListingFeeMin(c.key, v)}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                          <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                            {t("Juu", "Max")}
                          </span>
                          <div className="w-full min-w-0">
                            <EditableAmount
                              value={c.max}
                              onSave={(v) => updateListingFeeMax(c.key, v)}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </RevenueCard>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 2. RESERVATION — Settings + Tiers */}
        {/* ═══════════════════════════════════════════════════════ */}
        <RevenueCard accentColor={COLORS.green}>
          <div className="flex items-center gap-3 mb-1">
            <div
              style={{ background: `${COLORS.green}15` }}
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            >
              <Clock size={18} color={COLORS.green} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">
                {t("Ada ya Reservation", "Reservation Fee")}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {t(
                  "Tiers kwa muda tofauti — admin anaweza kuongeza/kufuta",
                  "Tiers for different durations — admin can add/remove"
                )}
              </p>
            </div>
            <ToggleSwitch
              enabled={reservationSettings.is_enabled}
              onToggle={toggleReservation}
              disabled={!!busy["res-toggle"]}
              lang={lang}
            />
          </div>

          {!reservationSettings.is_enabled && (
            <p
              className="text-xs text-center rounded-lg px-3 py-2 mb-3"
              style={{ background: `${COLORS.rust}15`, color: COLORS.rust }}
            >
              {t(
                "Reservation Fee imezimwa — tiers zote ni BURE kwa watumiaji.",
                "Reservation Fee is disabled — all tiers are FREE for users."
              )}
            </p>
          )}

          <EditHint lang={lang} accentColor={COLORS.green} />

          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Tiers", "Tiers")} ({reservationTiers.length})
            </span>
            <button
              type="button"
              onClick={handleAddTier}
              disabled={!!busy["res-add-tier"]}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
            >
              {busy["res-add-tier"] ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Plus size={12} />
              )}
              {t("Ongeza Tier", "Add Tier")}
            </button>
          </div>

          {reservationTiers.length === 0 ? (
            <p className="text-xs text-muted text-center py-3">
              {t(
                "Hakuna tiers. Bofya 'Ongeza Tier' kuanza.",
                "No tiers yet. Click 'Add Tier' to start."
              )}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {reservationTiers.map((tier) => {
                const isToggling = !!busy[`res-tier-t-${tier.id}`];
                const isDeleting = !!busy[`res-tier-d-${tier.id}`];
                const days = tier.hours % 24 === 0 ? tier.hours / 24 : null;
                const label = days
                  ? t(
                      `Siku ${days}`,
                      `${days} ${days === 1 ? "Day" : "Days"}`
                    )
                  : t(`Saa ${tier.hours}`, `${tier.hours} hrs`);
                return (
                  <div key={tier.id} className="py-3">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <p className="text-sm font-semibold text-primary">
                        {label}
                      </p>
                      {!tier.is_active && (
                        <span
                          style={{
                            background: "rgba(16,26,46,0.08)",
                            color: COLORS.night,
                          }}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        >
                          {t("IMEZIMWA", "INACTIVE")}
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-1.5">
                        <ToggleSwitch
                          enabled={tier.is_active}
                          onToggle={() => toggleTier(tier.id)}
                          disabled={isToggling}
                          lang={lang}
                          compact
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteTier(tier)}
                          disabled={isDeleting}
                          className="p-1.5 text-muted hover:text-[#C1502E] rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                          {t("Muda (Saa)", "Duration (Hours)")}
                        </span>
                        <div className="w-full min-w-0">
                          <EditableNumber
                            value={tier.hours}
                            onSave={(v) => updateTierHours(tier.id, v)}
                            min={1}
                            max={8760}
                            suffix={t("saa", "hrs")}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                          {t("Bei (TZS)", "Fee (TZS)")}
                        </span>
                        <div className="w-full min-w-0">
                          <EditableAmount
                            value={tier.fee}
                            onSave={(v) => updateTierFee(tier.id, v)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </RevenueCard>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 3. SUCCESS FEE — Singleton */}
        {/* ═══════════════════════════════════════════════════════ */}
        <RevenueCard accentColor={COLORS.green}>
          <div className="flex items-center gap-3 mb-1">
            <div
              style={{ background: `${COLORS.green}15` }}
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            >
              <TrendingUp size={18} color={COLORS.green} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">
                {getLocalized(
                  { sw: successFee.label_sw, en: successFee.label_en },
                  lang
                ) || t("Ada ya Mafanikio", "Success Fee")}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {getLocalized(
                  { sw: successFee.desc_sw, en: successFee.desc_en },
                  lang
                ) ||
                  t(
                    "Ada ya kupakua ripoti ya miamala",
                    "Fee to download transactions report"
                  )}
              </p>
            </div>
            <ToggleSwitch
              enabled={successFee.is_enabled}
              onToggle={toggleSuccess}
              disabled={!!busy["success-toggle"]}
              lang={lang}
            />
          </div>
          <EditHint lang={lang} accentColor={COLORS.green} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                {t("Asilimia (%)", "Percentage (%)")}
              </span>
              <div className="w-full min-w-0">
                <EditablePercent
                  value={(successFee.percentage || 0) / 100}
                  onSave={(v) => updateSuccessPercentage(v * 100)}
                />
              </div>
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                {t("Chini (TZS)", "Min (TZS)")}
              </span>
              <div className="w-full min-w-0">
                <EditableAmount
                  value={successFee.min_fee || 0}
                  onSave={updateSuccessMin}
                />
              </div>
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] text-muted uppercase tracking-wide font-semibold mb-1">
                {t("Juu (TZS)", "Max (TZS)")}
              </span>
              <div className="w-full min-w-0">
                <EditableAmount
                  value={successFee.max_fee || 0}
                  onSave={updateSuccessMax}
                />
              </div>
            </div>
          </div>
        </RevenueCard>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 4. BOOST PACKAGES */}
        {/* ═══════════════════════════════════════════════════════ */}
        <RevenueCard accentColor={COLORS.gold}>
          <div className="flex items-center gap-3 mb-1">
            <div
              style={{ background: `${COLORS.gold}15` }}
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            >
              <Rocket size={18} color={COLORS.gold} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">
                {t("Ada ya Boost", "Boost Fee")}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {t(
                  "Packages za kuongeza mwonekano wa listing",
                  "Packages to increase listing visibility"
                )}
              </p>
            </div>
            <ToggleSwitch
              enabled={boostFee.enabled}
              onToggle={toggleBoostFee}
              disabled={!boostFee.loaded || !!busy["boost-fee-toggle"]}
              lang={lang}
            />
          </div>
          {boostFee.loaded && !boostFee.enabled && (
            <p
              className="text-xs text-center rounded-lg px-3 py-2 mb-2"
              style={{ background: `${COLORS.rust}15`, color: COLORS.rust }}
            >
              {t(
                "Ada ya Boost imezimwa — boost ni BURE kwa watumiaji wote.",
                "Boost fee is disabled — boosting is FREE for everyone."
              )}
            </p>
          )}
          <EditHint lang={lang} accentColor={COLORS.gold} />
          {boostPackages.length === 0 ? (
            <p className="text-xs text-muted text-center py-3">
              {t(
                "Hakuna boost packages. Wasiliana na developer.",
                "No boost packages. Contact developer."
              )}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {boostPackages.map((pkg) => (
                <PackageRow
                  key={pkg.id}
                  pkg={pkg}
                  lang={lang}
                  onUpdatePrice={(v) => updateBoostPrice(pkg.key, v)}
                  onToggle={() => toggleBoost(pkg.key)}
                  onDelete={() => {
                    // Boost haina delete kwa sasa — angalia backend
                  }}
                  isToggling={!!busy[`boost-toggle-${pkg.key}`]}
                  isDeleting={false}
                  accentColor={COLORS.gold}
                  t={t}
                />
              ))}
            </div>
          )}
        </RevenueCard>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 5. LEADING PACKAGES */}
        {/* ═══════════════════════════════════════════════════════ */}
        <RevenueCard accentColor={COLORS.rust}>
          <div className="flex items-center gap-3 mb-1">
            <div
              style={{ background: `${COLORS.rust}15` }}
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            >
              <Search size={18} color={COLORS.rust} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">
                {getLocalized(leadingFee.label, lang) ||
                  t("Ada ya Kipaumbele", "Leading Fee")}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {getLocalized(leadingFee.desc, lang) ||
                  t(
                    "Packages za kupandisha listing juu ya matokeo",
                    "Packages to boost listing to top of results"
                  )}
              </p>
            </div>
            <ToggleSwitch
              enabled={leadingFee.is_enabled}
              onToggle={toggleLeading}
              disabled={!!busy["leading-toggle"]}
              lang={lang}
            />
          </div>

          {!leadingFee.is_enabled && (
            <p
              className="text-xs text-center rounded-lg px-3 py-2 mb-3"
              style={{ background: `${COLORS.rust}15`, color: COLORS.rust }}
            >
              {t(
                "Ada ya Leading imezimwa — leading ni BURE kwa watumiaji wote.",
                "Leading fee is disabled — leading is FREE for everyone."
              )}
            </p>
          )}

          <EditHint lang={lang} accentColor={COLORS.rust} />

          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Packages", "Packages")} ({leadingPackages.length})
            </span>
            <button
              type="button"
              onClick={handleAddLeadingPackage}
              disabled={!!busy["leading-add-pkg"]}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
            >
              {busy["leading-add-pkg"] ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Plus size={12} />
              )}
              {t("Ongeza Package", "Add Package")}
            </button>
          </div>

          {leadingPackages.length === 0 ? (
            <p className="text-xs text-muted text-center py-3">
              {t(
                "Hakuna packages. Bofya 'Ongeza Package' kuanza.",
                "No packages yet. Click 'Add Package' to start."
              )}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {leadingPackages.map((pkg) => (
                <PackageRow
                  key={pkg.id}
                  pkg={pkg}
                  lang={lang}
                  onUpdatePrice={(v) => updateLeadingPackagePrice(pkg.id, v)}
                  onToggle={() => toggleLeadingPackage(pkg.id)}
                  onDelete={() => handleDeleteLeadingPackage(pkg)}
                  isToggling={!!busy[`leading-pkg-t-${pkg.id}`]}
                  isDeleting={!!busy[`leading-pkg-d-${pkg.id}`]}
                  accentColor={COLORS.rust}
                  t={t}
                />
              ))}
            </div>
          )}
        </RevenueCard>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 6. ADVERTISEMENT PACKAGES */}
        {/* ═══════════════════════════════════════════════════════ */}
        <RevenueCard accentColor={COLORS.rust}>
          <div className="flex items-center gap-3 mb-1">
            <div
              style={{ background: `${COLORS.rust}15` }}
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            >
              <Smartphone size={18} color={COLORS.rust} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-primary">
                {getLocalized(adFee.label, lang) ||
                  t("Ada ya Matangazo", "Advertisement Fee")}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {getLocalized(adFee.desc, lang) ||
                  t(
                    "Packages za tangazo kwenye Dashboard",
                    "Packages for dashboard banner ads"
                  )}
              </p>
            </div>
            <ToggleSwitch
              enabled={adFee.is_enabled}
              onToggle={toggleAdvertisement}
              disabled={!!busy["advertisement-toggle"]}
              lang={lang}
            />
          </div>

          {!adFee.is_enabled && (
            <p
              className="text-xs text-center rounded-lg px-3 py-2 mb-3"
              style={{ background: `${COLORS.rust}15`, color: COLORS.rust }}
            >
              {t(
                "Ada ya Matangazo imezimwa — matangazo ni BURE kwa watumiaji wote.",
                "Advertisement fee is disabled — ads are FREE for everyone."
              )}
            </p>
          )}

          <EditHint lang={lang} accentColor={COLORS.rust} />

          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-semibold text-secondary">
              {t("Packages", "Packages")} ({advertisementPackages.length})
            </span>
            <button
              type="button"
              onClick={handleAddAdvertisementPackage}
              disabled={!!busy["ad-add-pkg"]}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
            >
              {busy["ad-add-pkg"] ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Plus size={12} />
              )}
              {t("Ongeza Package", "Add Package")}
            </button>
          </div>

          {advertisementPackages.length === 0 ? (
            <p className="text-xs text-muted text-center py-3">
              {t(
                "Hakuna packages. Bofya 'Ongeza Package' kuanza.",
                "No packages yet. Click 'Add Package' to start."
              )}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {advertisementPackages.map((pkg) => (
                <PackageRow
                  key={pkg.id}
                  pkg={pkg}
                  lang={lang}
                  onUpdatePrice={(v) =>
                    updateAdvertisementPackagePrice(pkg.id, v)
                  }
                  onToggle={() => toggleAdvertisementPackage(pkg.id)}
                  onDelete={() => handleDeleteAdvertisementPackage(pkg)}
                  isToggling={!!busy[`ad-pkg-t-${pkg.id}`]}
                  isDeleting={!!busy[`ad-pkg-d-${pkg.id}`]}
                  accentColor={COLORS.rust}
                  t={t}
                />
              ))}
            </div>
          )}
        </RevenueCard>

        <div
          className="rounded-xl border px-4 py-3 flex items-start gap-2.5"
          style={{
            background: `${COLORS.gold}08`,
            borderColor: `${COLORS.gold}30`,
          }}
        >
          <Info size={16} color={COLORS.gold} className="shrink-0 mt-0.5" />
          <p className="text-xs text-secondary leading-relaxed">
            {t(
              "Flat fees zote zinahifadhiwa papo hapo kwenye backend. Packages (Boost, Leading, Advertisement) zinahifadhiwa moja kwa moja.",
              "All flat fees save to the backend instantly. Packages (Boost, Leading, Advertisement) save directly."
            )}
          </p>
        </div>
      </div>
    </>
  );
}
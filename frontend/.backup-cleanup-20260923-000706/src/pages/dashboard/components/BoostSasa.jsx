// ============================================================
// BoostSasa.jsx (production)
// Flow: POST /boosting/ {listing, package} → POST /boosting/{id}/pay/ →
//       POST /boosting/{id}/activate/
// ============================================================
import React, { useState, useEffect } from "react";
import { Rocket, Check, MapPin, TrendingUp, Clock, Loader2, AlertTriangle, Wallet } from "lucide-react";
import { COLORS, getCategory, formatTZS, isBoostActive, boostDaysRemaining } from "./shared";
import { useBoostPackages } from "../../../config/boostPackagesStore.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { checkCredit, consumeCredit } from "../../../config/userCreditsStore.js";
import { boostingApi } from "../../../api/boosting.js";
import PaymentGateway from "./PaymentGateway";

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

function PackageCard({ pkg, selected, onSelect, lang }) {
  const isFeatured = pkg.key === "featured";
  const label = getLocalized(pkg.label, lang);
  const benefits = getLocalizedArray(pkg.benefits, lang);
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
      <div className="flex items-center justify-center gap-2 w-full">
        <span className="text-primary text-sm font-bold">{label}</span>
        <span
          style={{ background: selected ? COLORS.gold : COLORS.sandLine, borderColor: COLORS.gold }}
          className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
        >
          {selected && <Check size={12} color={COLORS.night} />}
        </span>
      </div>
      <div className="flex items-baseline justify-center gap-1.5">
        <span style={{ color: COLORS.rust }} className="text-lg font-bold">
          {formatTZS(pkg.price)}
        </span>
        <span className="text-secondary text-body-sm">
          / {lang === "sw" ? `siku ${pkg.days}` : `${pkg.days} days`}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5 w-full text-left">
        {benefits.map((b, i) => (
          <li key={i} className="text-secondary flex items-start gap-1.5 text-body-sm">
            <TrendingUp size={12} className="shrink-0 mt-0.5" color={COLORS.green} />
            {b}
          </li>
        ))}
      </ul>
    </button>
  );
}

export default function BoostSasa({
  listings = [],
  initialListingId = null,
  onBoosted = () => {},
}) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const liveListings = listings.filter((l) => l.status === "live");
  const boostPackages = useBoostPackages();

  const [selectedId, setSelectedId] = useState(
    initialListingId && liveListings.some((l) => l.id === initialListingId)
      ? initialListingId
      : liveListings[0]?.id ?? null
  );
  const [packageId, setPackageId] = useState(null);
  const [stage, setStage] = useState("select"); // select | paying | done
  const [done, setDone] = useState(null);
  const [creating, setCreating] = useState(false);
  const [pendingBoost, setPendingBoost] = useState(null); // { id, listing, package }
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => {
    if (!packageId && boostPackages.length) {
      setPackageId(boostPackages[0].id);
    }
  }, [boostPackages, packageId]);

  useEffect(() => {
    if (initialListingId && liveListings.some((l) => l.id === initialListingId)) {
      setSelectedId(initialListingId);
    }
  }, [initialListingId, liveListings]);

  const selectedListing = liveListings.find((l) => l.id === selectedId);
  const selectedPackage = boostPackages.find((p) => p.id === packageId);
  const canBoost = Boolean(selectedListing && selectedPackage);

  const creditInfo = checkCredit(user?.id, "boost");
  const hasCredit = creditInfo.hasCredit;

  // ── Step 1: create the boost on backend ─────────────────
  const handleBeginPayment = async () => {
    if (!canBoost || creating) return;
    setCreating(true);
    setError("");
    try {
      const raw = await boostingApi.create({
        listing: selectedListing.id,
        package: selectedPackage.id,
      });
      setPendingBoost({ id: raw.id, listing: selectedListing, package: selectedPackage });
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

  // ── Step 2: submit payment reference (payment provider callback came in) ──
  const handlePaymentSubmit = async ({ reference }) => {
    if (!pendingBoost) return { ok: false, error: new Error("no pending boost") };
    try {
      const paid = await boostingApi.pay(pendingBoost.id, reference || "");
      const activated = await boostingApi.activate(pendingBoost.id);
      setDone({
        listing: pendingBoost.listing,
        pkg: pendingBoost.package,
        boost: activated || paid,
      });
      setStage("done");
      onBoosted(pendingBoost.listing.id, {
        boostTier: pendingBoost.package.key,
        boostExpiresAt: activated?.expires_at || paid?.expires_at,
      });
      return { ok: true, data: activated };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  // ── Credit path: consume a bundle-issued credit via backend ──
  const handleUseCredit = async () => {
    if (!canBoost || !user) return;
    setCreating(true);
    setError("");
    try {
      const consume = consumeCredit(user.id, "boost");
      if (!consume.success) {
        setCreating(false);
        return handleBeginPayment();
      }
      // Backend must also create + activate the boost. We pass the reference "credits" so
      // the backend knows to skip payment and consume a credit.
      const raw = await boostingApi.create({
        listing: selectedListing.id,
        package: selectedPackage.id,
      });
      await boostingApi.pay(raw.id, "credits");
      const activated = await boostingApi.activate(raw.id);
      setDone({ listing: selectedListing, pkg: selectedPackage, boost: activated });
      setStage("done");
      onBoosted(selectedListing.id, {
        boostTier: selectedPackage.key,
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

  if (stage === "done" && done) {
    return (
      <div className="w-full flex items-center justify-center p-6" style={{ background: COLORS.sand, minHeight: "600px" }}>
        <div className="max-w-md w-full text-center bg-white rounded-2xl border p-8" style={{ borderColor: COLORS.sandLine }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: COLORS.gold }}>
            <Rocket color={COLORS.night} size={24} />
          </div>
          <h2 className="h-title mb-2">{t("Boost Imewekwa", "Boost Applied")}</h2>
          <p className="text-secondary text-sm mb-5">
            {t("Boost imeanza kufanya kazi.", "Your boost is now active.")}
          </p>
          <button
            onClick={() => { setDone(null); setStage("select"); setPendingBoost(null); }}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            {t("Boost Mali Nyingine", "Boost Another Listing")}
          </button>
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
                  `Una Boost Credits ${creditInfo.remaining}`,
                  `You have ${creditInfo.remaining} Boost Credits`
                )}
              </span>
            </div>
            <button
              onClick={handleUseCredit}
              disabled={!canBoost || creating}
              className="text-body-sm font-semibold px-3 py-2 rounded-lg bg-[#2F6D4F] text-white disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : t("Tumia Credit", "Use Credit")}
            </button>
          </div>
        )}

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

        {liveListings.length > 0 && stage !== "paying" && (
          <>
            <p className="text-primary text-sm font-medium mb-3 text-center">
              2. {t("Chagua Package", "Choose Package")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {boostPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  selected={pkg.id === packageId}
                  onSelect={setPackageId}
                  lang={lang}
                />
              ))}
            </div>

            <div className="rounded-2xl border p-4 flex flex-col items-center text-center gap-3 mb-4"
                 style={{ borderColor: COLORS.sandLine, background: "white" }}>
              <div>
                <p className="text-secondary text-body-sm mb-0.5">{t("Jumla ya Malipo", "Total Payment")}</p>
                <p className="text-lg font-bold" style={{ color: COLORS.rust }}>
                  {formatTZS(selectedPackage?.price || 0)}
                </p>
              </div>
              <button
                onClick={handleBeginPayment}
                disabled={!canBoost || creating}
                style={{
                  background: canBoost && !creating ? COLORS.gold : COLORS.sandLine,
                  color: canBoost && !creating ? COLORS.night : "rgba(16,26,46,0.4)",
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm disabled:cursor-not-allowed"
              >
                {creating ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
                {t("Endelea Kulipa", "Continue to Payment")}
              </button>
            </div>
          </>
        )}

        {stage === "paying" && pendingBoost && (
          <PaymentGateway
            amount={pendingBoost.package.price}
            title={getLocalized(pendingBoost.package.label, lang)}
            description={t(
              `Boost kwa "${pendingBoost.listing.title}"`,
              `Boost for "${pendingBoost.listing.title}"`
            )}
            requireReference
            onSubmit={handlePaymentSubmit}
            onCancel={() => setStage("select")}
          />
        )}
      </div>
    </div>
  );
}

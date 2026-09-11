
import React, { useState, useEffect } from "react";
import { Rocket, Check, MapPin, TrendingUp, Clock } from "lucide-react";
import {
  COLORS,
  FONTS,
  getCategory,
  formatTZS,
  isBoostActive,
  boostDaysRemaining,
  applyBoost,
} from "./shared";
import { useBoostPackages } from "../../config/boostPackagesStore.js";
import { notifyBoostPurchased } from "../../config/notificationsStore.js";
import PaymentGateway from "./PaymentGateway";

function ListingPicker({ listings, selectedId, onSelect }) {
  if (listings.length === 0) {
    return (
      <div
        style={{ borderColor: COLORS.sandLine }}
        className="rounded-2xl border-2 border-dashed p-8 text-center"
      >
        <p style={{ color: "rgba(16,26,46,0.45)" }} className="text-sm">
          Huna mali yoyote iliyo Live kwa sasa. Boost inapatikana tu kwa mali
          zilizochapishwa.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {listings.map((l) => {
        const category = getCategory(l.category);
        const Icon = category?.icon;
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
            <div
              style={{ background: COLORS.night }}
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
            >
              {Icon && <Icon size={18} color={COLORS.gold} />}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: COLORS.night }} className="text-sm font-semibold truncate">
                {l.title}
              </p>
              <p style={{ color: "rgba(16,26,46,0.5)" }} className="flex items-center gap-1 text-xs">
                <MapPin size={11} /> {l.location}
              </p>
            </div>
            {boosted && (
              <span
                style={{ background: "rgba(232,163,61,0.16)", color: "#8A5A16" }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full shrink-0"
              >
                <Rocket size={11} /> Siku {boostDaysRemaining(l)} zimebaki
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PackageCard({ pkg, selected, onSelect }) {
  const isFeatured = pkg.key === "featured";
  return (
    <button
      onClick={() => onSelect(pkg.key)}
      style={{
        borderColor: selected ? COLORS.gold : COLORS.sandLine,
        background: "white",
      }}
      className="relative flex flex-col gap-3 p-4 rounded-2xl border text-left w-full"
    >
      {isFeatured && (
        <span
          style={{ background: COLORS.rust, color: "white" }}
          className="absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full"
        >
          Maarufu Zaidi
        </span>
      )}
      <div className="flex items-center justify-between">
        <span style={{ color: COLORS.night }} className="text-sm font-bold">
          {pkg.label}
        </span>
        <span
          style={{
            background: selected ? COLORS.gold : COLORS.sandLine,
            borderColor: COLORS.gold,
          }}
          className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
        >
          {selected && <Check size={12} color={COLORS.night} />}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span style={{ color: COLORS.rust }} className="text-lg font-bold">
          {formatTZS(pkg.price)}
        </span>
        <span style={{ color: "rgba(16,26,46,0.5)" }} className="text-xs">
          / siku {pkg.days}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {pkg.benefits.map((b, i) => (
          <li
            key={i}
            style={{ color: "rgba(16,26,46,0.65)" }}
            className="flex items-start gap-1.5 text-xs"
          >
            <TrendingUp size={12} className="shrink-0 mt-0.5" color={COLORS.green} />
            {b}
          </li>
        ))}
      </ul>
    </button>
  );
}

export default function BoostSasa({ listings = [], initialListingId = null, onBoosted = () => {} }) {
  const liveListings = listings.filter((l) => l.status === "live");
  const boostPackages = useBoostPackages();
  const [selectedId, setSelectedId] = useState(
    initialListingId && liveListings.some((l) => l.id === initialListingId)
      ? initialListingId
      : liveListings[0]?.id ?? null
  );
  const [packageKey, setPackageKey] = useState("featured");
  const [stage, setStage] = useState("select"); // select | paying | done
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (initialListingId && liveListings.some((l) => l.id === initialListingId)) {
      setSelectedId(initialListingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialListingId]);

  const selectedListing = liveListings.find((l) => l.id === selectedId);
  const selectedPackage = boostPackages.find((p) => p.key === packageKey);
  const canBoost = Boolean(selectedListing && selectedPackage);

  const handleConfirm = () => {
    if (!canBoost) return;
    setStage("paying");
  };

  const handlePaymentSuccess = () => {
    const patch = applyBoost(selectedListing, packageKey);
    onBoosted(selectedListing.id, patch);
    notifyBoostPurchased({
      listingId: selectedListing.id,
      listingTitle: selectedListing.title,
      packageLabel: selectedPackage.label,
      expiresAt: patch.boostExpiresAt,
      amount: selectedPackage.price,
    });
    setDone({ listing: selectedListing, pkg: selectedPackage, expiresAt: patch.boostExpiresAt });
    setStage("done");
  };

  if (stage === "done" && done) {
    return (
      <div
        style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "600px" }}
        className="w-full flex items-center justify-center p-6"
      >
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="max-w-md w-full text-center bg-white rounded-2xl border p-8"
        >
          <div
            style={{ background: COLORS.gold }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Rocket color={COLORS.night} size={24} />
          </div>
          <h2 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl font-semibold mb-2">
            Boost Imewekwa
          </h2>
          <p style={{ color: "rgba(16,26,46,0.65)" }} className="text-sm mb-5">
            "{done.listing.title}" sasa ina <b>{done.pkg.label}</b> na itaonekana zaidi
            kwa wanunuzi hadi{" "}
            {new Date(done.expiresAt).toLocaleDateString("sw-TZ", {
              day: "numeric",
              month: "long",
            })}
            .
          </p>
          <button
            onClick={() => {
              setDone(null);
              setStage("select");
            }}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            Boost Mali Nyingine
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "600px" }} className="w-full p-4 sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-2xl mx-auto">
        <h1 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl sm:text-3xl font-semibold mb-1">
          Boost Sasa
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-6">
          Ongeza mwonekano wa mali yako kwa wanunuzi wengi zaidi.
        </p>

        {stage !== "paying" && (
          <>
            <div className="flex flex-col gap-2 mb-3">
              <span style={{ color: COLORS.night }} className="text-sm font-medium">
                1. Chagua Mali (Live pekee)
              </span>
            </div>
            <div className="mb-6">
              <ListingPicker listings={liveListings} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </>
        )}

        {liveListings.length > 0 && (
          <>
            {stage !== "paying" && (
              <>
                <div className="flex flex-col gap-2 mb-3">
                  <span style={{ color: COLORS.night }} className="text-sm font-medium">
                    2. Chagua Package
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {boostPackages.map((pkg) => (
                    <PackageCard
                      key={pkg.key}
                      pkg={pkg}
                      selected={pkg.key === packageKey}
                      onSelect={setPackageKey}
                    />
                  ))}
                </div>
              </>
            )}

            {stage === "paying" ? (
              <PaymentGateway
                amount={selectedPackage.price}
                title={selectedPackage.label}
                description={`Boost kwa "${selectedListing.title}"`}
                onCancel={() => setStage("select")}
                onSuccess={handlePaymentSuccess}
              />
            ) : (
              <>
                {selectedListing && isBoostActive(selectedListing) && (
                  <div
                    style={{ background: "rgba(232,163,61,0.1)", color: "#8A5A16" }}
                    className="flex items-center gap-2 text-xs rounded-lg px-3 py-2.5 mb-4"
                  >
                    <Clock size={14} />
                    Mali hii tayari ina Boost inayoisha baada ya siku{" "}
                    {boostDaysRemaining(selectedListing)} — ukiendelea, siku {selectedPackage.days} za{" "}
                    {selectedPackage.label} zitaongezwa baada ya hapo.
                  </div>
                )}

                <div
                  style={{ borderColor: COLORS.sandLine, background: "white" }}
                  className="rounded-2xl border p-4 flex items-center justify-between mb-4"
                >
                  <div>
                    <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs mb-0.5">
                      Jumla ya Malipo
                    </p>
                    <p style={{ color: COLORS.rust }} className="text-lg font-bold">
                      {formatTZS(selectedPackage.price)}
                    </p>
                  </div>
                  <button
                    onClick={handleConfirm}
                    disabled={!canBoost}
                    style={{
                      background: canBoost ? COLORS.gold : COLORS.sandLine,
                      color: canBoost ? COLORS.night : "rgba(16,26,46,0.4)",
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
                  >
                    <Rocket size={15} />
                    Lipa na Boost
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

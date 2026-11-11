// ============================================================
// ExpiringCreditsBanner.jsx
// Onyesha banner kwa credits zinazoisha ndani ya siku 7.
// Inatumia data kutoka `useUserCredits()` (expiresAt ipo kwenye norm()).
// ============================================================

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock3, ChevronRight, X } from "lucide-react";
import { COLORS } from "./shared.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";

// ============================================================
// SERVICE LABELS
// ============================================================
const SERVICE_LABELS = {
  listing: { sw: "Kuweka Mali", en: "Listings" },
  leading: { sw: "Kuongoza", en: "Leading" },
  boost: { sw: "Kukuza", en: "Boost" },
  reservation: { sw: "Kuhifadhi", en: "Reservation" },
  success: { sw: "Mafanikio", en: "Success" },
  ads: { sw: "Matangazo", en: "Ads" },
  premium: { sw: "Hadhi ya Juu", en: "Premium" },
};

const EXPIRY_WARNING_DAYS = 7;

// ============================================================
// HOOK — pata credits zinazoisha
// ============================================================
export function useExpiringCredits(userCredits) {
  return useMemo(() => {
    if (!userCredits || typeof userCredits !== "object") return [];

    const now = Date.now();
    const thresholdMs = EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000;

    const out = [];
    for (const [service, entry] of Object.entries(userCredits)) {
      if (service === "services") continue;
      if (!entry || typeof entry !== "object") continue;
      if (!entry.expiresAt) continue;
      if (!entry.remaining || entry.remaining <= 0) continue;

      const expiresAt = new Date(entry.expiresAt).getTime();
      if (Number.isNaN(expiresAt)) continue;

      const diffMs = expiresAt - now;
      if (diffMs <= 0) continue; // imeisha tayari (backend ina-zero)
      if (diffMs > thresholdMs) continue; // mbali sana

      const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      out.push({
        service,
        remaining: entry.remaining,
        expiresAt: entry.expiresAt,
        daysLeft,
        isFinal: daysLeft <= 1,
        bundleName: entry.lastBundleName || null,
      });
    }

    // Panga kwa `daysLeft` (ndogo kwanza)
    return out.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [userCredits]);
}

// ============================================================
// BANNER
// ============================================================
export default function ExpiringCreditsBanner({ userCredits, onDismiss }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const expiring = useExpiringCredits(userCredits);

  if (expiring.length === 0) return null;

  const isUrgent = expiring.some((c) => c.isFinal);
  const totalRemaining = expiring.reduce((s, c) => s + c.remaining, 0);

  return (
    <div
      className="max-w-lg mx-auto mb-5 rounded-xl border px-3 py-3 flex items-start gap-2.5"
      style={{
        background: isUrgent ? "rgba(193,80,46,0.10)" : "rgba(232,163,61,0.12)",
        borderColor: isUrgent ? "rgba(193,80,46,0.35)" : "rgba(232,163,61,0.4)",
      }}
    >
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{
          background: isUrgent ? COLORS.rust : "#8A5A16",
        }}
      >
        {isUrgent ? (
          <AlertTriangle size={15} color="white" />
        ) : (
          <Clock3 size={15} color="white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-bold"
          style={{ color: isUrgent ? COLORS.rust : "#8A5A16" }}
        >
          {isUrgent
            ? t("Vifurushi vyako vinaisha KESHO!", "Your credits expire TOMORROW!")
            : t(
                "Vifurushi vyako vinaisha hivi karibuni",
                "Your credits expire soon"
              )}
        </p>
        <p className="text-xs text-secondary mt-1 leading-relaxed">
          {expiring.map((c) => {
            const label = SERVICE_LABELS[c.service];
            const serviceLabel = label
              ? label[lang] || label.sw
              : c.service;
            return t(
              `${c.remaining}× ${serviceLabel} — siku ${c.daysLeft}`,
              `${c.remaining}× ${serviceLabel} — ${c.daysLeft} day${c.daysLeft === 1 ? "" : "s"}`
            );
          }).join(" · ")}
        </p>
        <p className="text-[11px] text-muted mt-1">
          {t(
            `Jumla ya ${totalRemaining} credits zinaisha. Zitumie kabla hazijapotea.`,
            `Total of ${totalRemaining} credits expiring. Use them before they're gone.`
          )}
        </p>

        <button
          onClick={() => navigate("/dashboard/bundles")}
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold"
          style={{ color: isUrgent ? COLORS.rust : "#8A5A16" }}
        >
          {t("Nunua Vifurushi Vipya", "Buy New Bundles")}
          <ChevronRight size={12} />
        </button>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label={t("Funga", "Dismiss")}
          className="shrink-0 text-muted hover:text-secondary p-1"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
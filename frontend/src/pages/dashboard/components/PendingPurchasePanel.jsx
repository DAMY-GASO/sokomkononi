import React, { useState } from "react";
import { Clock, Check, X, Loader2 } from "lucide-react";
import { COLORS, formatTZS } from "./shared";
import { cancelPendingPurchase } from "../../../api/purchaseStatus.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";

export default function PendingPurchasePanel({
  module,           // "boosting" | "banners" | "leading"
  pending,          // { id, package_name, amount, created_at, ... }
  onComplete,       // callback ya kukamilisha malipo
  onCancelled,      // callback baada ya kufuta
}) {
  const { lang } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const labels = {
    boosting: t("Boost", "Boost"),
    banners: t("Tangazo", "Banner"),
    leading: t("Leading", "Leading"),
  };

  const handleCancel = async () => {
    if (!window.confirm(
      t(
        `Una uhakika unataka kufuta ${labels[module]} iliyosubiri malipo?`,
        `Are you sure you want to cancel the pending ${labels[module]}?`
      )
    )) return;

    setBusy(true);
    setError("");
    try {
      await cancelPendingPurchase(module, pending.id);
      onCancelled?.();
    } catch (err) {
      setError(
        err?.message ||
          t("Imeshindwa kufuta. Jaribu tena.", "Failed to cancel. Try again.")
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-xl border px-4 py-3 mb-4"
      style={{ background: "rgba(232,163,61,0.1)", borderColor: COLORS.gold }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock size={16} color="#8A5A16" />
        <span className="font-semibold text-sm" style={{ color: "#8A5A16" }}>
          {t(
            `Una ${labels[module]} inayosubiri malipo`,
            `You have a pending ${labels[module]}`
          )}
        </span>
      </div>
      <p className="text-secondary text-sm mb-3">
        {t(
          `Ilianzishwa ${new Date(pending.created_at).toLocaleString("sw-TZ")}`,
          `Started ${new Date(pending.created_at).toLocaleString("en-US")}`
        )}
        {pending.amount && ` · ${formatTZS(pending.amount)}`}
      </p>

      {error && (
        <p style={{ color: COLORS.rust }} className="text-sm mb-2">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onComplete?.(pending)}
          disabled={busy}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
        >
          <Check size={14} />
          {t("Kamilisha Malipo", "Complete Payment")}
        </button>
        <button
          onClick={handleCancel}
          disabled={busy}
          style={{ borderColor: COLORS.rust, color: COLORS.rust }}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          {t("Futa", "Cancel")}
        </button>
      </div>
    </div>
  );
}
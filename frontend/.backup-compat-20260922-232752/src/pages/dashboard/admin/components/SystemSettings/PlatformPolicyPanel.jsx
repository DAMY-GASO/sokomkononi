// ============================================================
// PlatformPolicyPanel.jsx
// Platform Policy management — listing lifetime days, n.k.
// Bilingual + mobile-responsive + Async save na rollback.
// ============================================================

import React, { useState, useEffect } from "react";
import { Clock, Save, Check, Info, Loader2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
// ⬇️ MABADILIKO: tumia async update
import {
  usePlatformPolicy,
  updatePlatformPolicyAsync,
} from "../../../../../config/systemSettingsStore.js";

export default function PlatformPolicyPanel() {
  const { lang } = useLanguage();
  const [policy] = usePlatformPolicy();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState(policy.listingLifetimeDays);
  // ⬇️ MPYA: busy + error
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // SYNC — kama policy inabadilika, sasisha draft
  // ============================================================
  useEffect(() => {
    setDraft(policy.listingLifetimeDays);
  }, [policy.listingLifetimeDays]);

  // ============================================================
  // HANDLER — async save
  // ============================================================
  const handleSave = async () => {
    if (saving) return;

    const days = Math.max(1, Math.min(365, Number(draft) || 60));

    setSaving(true);
    setError("");
    setSaved(false);

    const res = await updatePlatformPolicyAsync({
      listingLifetimeDays: days,
    });

    setSaving(false);

    if (res.ok) {
      setDraft(days);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi sera.", "Failed to save policy.")
      );
    }
  };

  const hasChanges = Number(draft) !== policy.listingLifetimeDays;
  const canSave =
    hasChanges &&
    Number(draft) >= 1 &&
    Number(draft) <= 365 &&
    !saving;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        >
          <Clock size={16} color={COLORS.night} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary truncate">
            {t("Sera za Mfumo", "Platform Policy")}
          </p>
          <p className="text-xs text-secondary truncate">
            {t("Kanuni za jumla za mfumo", "General platform rules")}
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* Field */}
      <label className="flex flex-col gap-1.5 min-w-0">
        <span className="text-xs font-medium text-secondary">
          {t("Muda wa Listing Kuishi (siku)", "Listing Lifetime (days)")}
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={365}
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave) handleSave();
            }}
            disabled={saving}
            className="w-20 sm:w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D] min-w-0 disabled:opacity-50"
          />
          <span className="text-xs text-secondary shrink-0">
            {t("siku", "days")}
          </span>
        </div>
        <span className="text-[11px] text-muted flex items-start gap-1 leading-snug">
          <Info size={11} className="shrink-0 mt-0.5" />
          <span>
            {t(
              'Listing "live" inakuwa "expired" baada ya siku hizi. Min: 1, Max: 365.',
              'Listings become "expired" after this many days. Min: 1, Max: 365.'
            )}
          </span>
        </span>
      </label>

      {/* Save row */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            background: canSave ? COLORS.gold : COLORS.sandLine,
            color: canSave ? COLORS.night : "var(--text-muted)",
          }}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-4 py-2 w-full sm:w-auto transition-colors disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          {saving
            ? t("Inahifadhi...", "Saving...")
            : t("Hifadhi", "Save")}
        </button>

        {saved && (
          <span
            style={{ color: COLORS.green }}
            className="text-xs font-semibold flex items-center gap-1"
          >
            <Check size={13} />
            {t("Imehifadhiwa", "Saved")}
          </span>
        )}
      </div>
    </div>
  );
}

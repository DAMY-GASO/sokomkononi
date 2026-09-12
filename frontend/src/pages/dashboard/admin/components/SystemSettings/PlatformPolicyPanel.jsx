// ============================================================
// PlatformPolicyPanel.jsx
// Platform Policy management — listing lifetime days, n.k.
// Bilingual + mobile-responsive.
// ============================================================

import React, { useState, useEffect } from "react";
import { Clock, Save, Check, Info } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import {
  usePlatformPolicy,
  updatePlatformPolicy,
} from "../../../../../config/systemSettingsStore.js";

export default function PlatformPolicyPanel() {
  const { lang } = useLanguage();
  const [policy] = usePlatformPolicy();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState(policy.listingLifetimeDays);

  // ============================================================
  // SYNC — kama policy inabadilika (kutoka tab nyingine au
  // update nyingine), sasisha draft. Hii inaepusha "stale draft".
  // ============================================================
  useEffect(() => {
    setDraft(policy.listingLifetimeDays);
  }, [policy.listingLifetimeDays]);

  const save = () => {
    const days = Math.max(1, Math.min(365, Number(draft) || 60));
    updatePlatformPolicy({ listingLifetimeDays: days });
    setDraft(days);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  // ============================================================
  // CHANGES CHECK — kama kuna tofauti kati ya draft na policy
  // ============================================================
  const hasChanges = Number(draft) !== policy.listingLifetimeDays;
  const canSave = hasChanges && Number(draft) >= 1 && Number(draft) <= 365;

  const t = (sw, en) => (lang === "sw" ? sw : en);

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
          <p className="text-sm font-semibold text-gray-800 truncate">
            {t("Sera za Mfumo", "Platform Policy")}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {t("Kanuni za jumla za mfumo", "General platform rules")}
          </p>
        </div>
      </div>

      {/* Field */}
      <label className="flex flex-col gap-1.5 min-w-0">
        <span className="text-xs font-medium text-gray-600">
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
              if (e.key === "Enter" && canSave) save();
            }}
            className="w-20 sm:w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D] min-w-0"
          />
          <span className="text-xs text-gray-500 shrink-0">
            {t("siku", "days")}
          </span>
        </div>
        <span className="text-[11px] text-gray-400 flex items-start gap-1 leading-snug">
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
          onClick={save}
          disabled={!canSave}
          style={{
            background: canSave ? COLORS.gold : COLORS.sandLine,
            color: canSave ? COLORS.night : "rgba(16,26,46,0.4)",
          }}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-4 py-2 w-full sm:w-auto transition-colors"
        >
          <Save size={13} />
          {t("Hifadhi", "Save")}
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

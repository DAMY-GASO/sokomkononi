import React, { useState } from "react";
import { Clock, Save } from "lucide-react";
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

  const save = () => {
    const days = Math.max(1, Math.min(365, Number(draft) || 60));
    updatePlatformPolicy({ listingLifetimeDays: days });
    setDraft(days);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          style={{ background: `${COLORS.night}0D` }}
          className="w-9 h-9 rounded-lg flex items-center justify-center"
        >
          <Clock size={16} color={COLORS.night} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {lang === "sw" ? "Sera za Mfumo" : "Platform Policy"}
          </p>
          <p className="text-xs text-gray-500">
            {lang === "sw"
              ? "Kanuni za jumla za mfumo"
              : "General platform rules"}
          </p>
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">
          {lang === "sw"
            ? "Muda wa Listing Kuishi (siku)"
            : "Listing Lifetime (days)"}
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={365}
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
            className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
          />
          <span className="text-xs text-gray-500">
            {lang === "sw" ? "siku" : "days"}
          </span>
        </div>
        <span className="text-[11px] text-gray-400">
          {lang === "sw"
            ? 'Listing "live" inakuwa "expired" baada ya siku hizi. Min: 1, Max: 365.'
            : 'Listings become "expired" after this many days. Min: 1, Max: 365.'}
        </span>
      </label>

      <button
        onClick={save}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 self-start"
      >
        <Save size={13} /> {lang === "sw" ? "Hifadhi" : "Save"}
      </button>
      {saved && (
        <span style={{ color: COLORS.green }} className="text-xs font-semibold">
          {lang === "sw" ? "Imehifadhiwa" : "Saved"}
        </span>
      )}
    </div>
  );
}

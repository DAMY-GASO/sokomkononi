// ============================================================
// AppStoreLinksPanel.jsx — FIX: snapshot sync after hydrate.
// ============================================================
import React, { useState, useEffect } from "react";
import { Smartphone, Link2, Save, Check, Loader2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import {
  useAppStoreLinks,
  saveAppStoreLinksAsync,
} from "../../../../../config/systemSettingsStore.js";

export default function AppStoreLinksPanel() {
  const { lang } = useLanguage();
  const [links, setLinksLocal] = useAppStoreLinks();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const setField = (patch) => {
    setLinksLocal({ ...links, ...patch });
    setDirty(true);
  };

  const handleSave = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await saveAppStoreLinksAsync(links);
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } else {
      setError(res.error?.message || t("Imeshindwa kuhifadhi links.", "Failed to save links."));
    }
  };

  const hasChanges = dirty;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex flex-col gap-4 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${COLORS.night}0D` }}>
          <Smartphone size={16} color={COLORS.night} />
        </div>
        <p className="text-sm font-semibold text-primary truncate">
          {t("Viungo vya App Store", "App Store Links")}
        </p>
      </div>

      {error && (
        <div style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          className="text-xs font-semibold px-3 py-2 rounded-lg">{error}</div>
      )}

      <label className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-medium text-secondary flex items-center gap-1">
          <Link2 size={12} className="shrink-0" /> Google Play Store
        </span>
        <input value={links.play} onChange={(e) => setField({ play: e.target.value })}
          placeholder="https://play.google.com/store/apps/details?id=..." disabled={saving}
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D] min-w-0 disabled:opacity-50"
          type="url" />
      </label>

      <label className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-medium text-secondary flex items-center gap-1">
          <Link2 size={12} className="shrink-0" /> Apple App Store
        </span>
        <input value={links.appstore} onChange={(e) => setField({ appstore: e.target.value })}
          placeholder="https://apps.apple.com/app/..." disabled={saving}
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8A33D] min-w-0 disabled:opacity-50"
          type="url" />
      </label>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleSave} disabled={!hasChanges || saving}
          style={{
            background: hasChanges && !saving ? COLORS.gold : COLORS.sandLine,
            color: hasChanges && !saving ? COLORS.night : "var(--text-muted)",
          }}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg px-4 py-2 w-full sm:w-auto transition-colors disabled:cursor-not-allowed">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? t("Inahifadhi...", "Saving...") : t("Hifadhi", "Save")}
        </button>
        {saved && (
          <span style={{ color: COLORS.green }} className="text-xs font-semibold flex items-center gap-1">
            <Check size={13} /> {t("Imehifadhiwa", "Saved")}
          </span>
        )}
      </div>
    </div>
  );
}

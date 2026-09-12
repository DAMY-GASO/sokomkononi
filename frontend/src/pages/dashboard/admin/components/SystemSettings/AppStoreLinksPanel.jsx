import React, { useState } from "react";
import { Smartphone, Link2, Save } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import {
  useAppStoreLinks,
  saveAppStoreLinks,
} from "../../../../../config/systemSettingsStore.js";

export default function AppStoreLinksPanel() {
  const { lang } = useLanguage();
  const [links, setLinksLocal] = useAppStoreLinks();
  const [saved, setSaved] = useState(false);

  const setLinks = (next) => setLinksLocal(next);

  const save = () => {
    saveAppStoreLinks(links);
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
          <Smartphone size={16} color={COLORS.night} />
        </div>
        <p className="text-sm font-semibold text-gray-800">
          {lang === "sw" ? "Viungo vya App Store" : "App Store Links"}
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
          <Link2 size={12} /> Google Play Store
        </span>
        <input
          value={links.play}
          onChange={(e) => setLinks({ ...links, play: e.target.value })}
          placeholder="https://play.google.com/store/apps/details?id=..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
          <Link2 size={12} /> Apple App Store
        </span>
        <input
          value={links.appstore}
          onChange={(e) => setLinks({ ...links, appstore: e.target.value })}
          placeholder="https://apps.apple.com/app/..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
        />
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

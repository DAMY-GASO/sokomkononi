import React, { useMemo, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useSentAnnouncements } from "../config/announcementsStore.js";

const DISMISS_KEY = "sokomkononi_announcement_dismissed_v1";

function readDismissedId() {
  try { return window.localStorage.getItem(DISMISS_KEY); } catch { return null; }
}
function writeDismissedId(id) {
  try { window.localStorage.setItem(DISMISS_KEY, String(id)); } catch {}
}

export default function AnnouncementBar() {
  const { lang } = useLanguage();
  const announcements = useSentAnnouncements();
  const [dismissedId, setDismissed] = useState(() => readDismissedId());

  const current = useMemo(() => {
    if (!Array.isArray(announcements) || announcements.length === 0) return null;
    const sorted = [...announcements].sort((a, b) => {
      const at = new Date(a.createdAt || 0).getTime();
      const bt = new Date(b.createdAt || 0).getTime();
      return bt - at;
    });
    return sorted[0];
  }, [announcements]);

  if (!current) return null;
  if (String(current.id) === String(dismissedId)) return null;

  const title   = (lang === "en" && current.titleEn)   ? current.titleEn   : current.title;
  const message = (lang === "en" && current.messageEn) ? current.messageEn : current.message;
  const text    = message || title || "";
  if (!text) return null;

  const handleDismiss = () => {
    setDismissed(current.id);
    writeDismissedId(current.id);
  };

  return (
    <div
      style={{
        background:
          "linear-gradient(90deg, #011957 0%, #042475 50%, #0062FD 100%)",
      }}
      className="w-full text-white text-xs sm:text-sm"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-center gap-2 sm:gap-3">
        <Megaphone size={13} className="shrink-0 text-[#FEA406]" />
        <span className="truncate text-center">{text}</span>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={lang === "sw" ? "Funga" : "Dismiss"}
          className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

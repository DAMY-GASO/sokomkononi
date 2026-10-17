import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";

function diff(target) {
  const ms = Math.max(0, target - Date.now());
  return { days: Math.floor(ms / 86400000), hours: Math.floor((ms % 86400000) / 3600000), minutes: Math.floor((ms % 3600000) / 60000), seconds: Math.floor((ms % 60000) / 1000) };
}

export default function CountdownTimer({ targetMs, tone = "auto" }) {
  const { lang } = useLanguage();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [d, setD] = useState(() => diff(targetMs));
  useEffect(() => { const iv = setInterval(() => setD(diff(targetMs)), 1000); return () => clearInterval(iv); }, [targetMs]);
  const cells = [
    { v: d.days, l: t("Siku", "Days") }, { v: d.hours, l: t("Saa", "Hours") },
    { v: d.minutes, l: t("Dakika", "Min") }, { v: d.seconds, l: t("Sekunde", "Sec") },
  ];
  const onNavy = tone === "navy";
  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      {cells.map((c, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className={`w-11 h-11 sm:w-14 sm:h-14 grid place-items-center rounded-lg text-lg sm:text-2xl font-bold tabular-nums ${onNavy ? "bg-white/10 text-white" : "bg-[color:rgb(var(--c-night))] text-[rgb(254,164,6)]"}`}>
            {String(c.v).padStart(2, "0")}
          </span>
          <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider mt-1 ${onNavy ? "text-white/55" : "text-muted"}`}>{c.l}</span>
        </div>
      ))}
    </div>
  );
}

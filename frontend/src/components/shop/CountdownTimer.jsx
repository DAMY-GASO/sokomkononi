import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";

function diff(target) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
    done: ms === 0,
  };
}

export default function CountdownTimer({ targetMs }) {
  const { lang } = useLanguage();
  const [t, setT] = useState(() => diff(targetMs));

  useEffect(() => {
    const iv = setInterval(() => setT(diff(targetMs)), 1000);
    return () => clearInterval(iv);
  }, [targetMs]);

  const t_ = (sw, en) => (lang === "sw" ? sw : en);
  const cells = [
    { v: t.days,    l: t_("Siku", "Days") },
    { v: t.hours,   l: t_("Saa", "Hours") },
    { v: t.minutes, l: t_("Dakika", "Min") },
    { v: t.seconds, l: t_("Sekunde", "Sec") },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {cells.map((c, i) => (
        <div key={i} className="flex flex-col items-center">
          <span
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center text-lg sm:text-2xl font-bold tabular-nums
                       bg-night text-[#FEA406]
                       dark:bg-white/10 dark:text-white"
          >
            {String(c.v).padStart(2, "0")}
          </span>
          <span className="text-[9px] sm:text-[10px] uppercase tracking-wide mt-1 text-muted dark:text-white/60">
            {c.l}
          </span>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";

// Kipima muda kinachohesabu hadi tarehe ya mwisho (ISO). ms <= 0 => muda umeisha.
export function useCountdown(iso) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!iso) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [iso]);

  const target = iso ? new Date(iso).getTime() : NaN;
  const ms = Number.isNaN(target) ? null : target - now;
  return { ms, label: formatRemaining(ms, "sw") };
}

export function formatRemaining(ms, lang = "sw") {
  if (ms == null) return "";
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (days > 0) {
    return lang === "sw" ? `Siku ${days} Saa ${h}` : `${days}d ${h}h`;
  }
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

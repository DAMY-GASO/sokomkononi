// ============================================================
// SlaCountdown.jsx
// Onyesha muda uliobaki wa SLA (kutoka `sla_deadline`).
// Live timer kila sekunde 60 (isitoshe kwa dakika, si sekunde).
// ============================================================

import React, { useEffect, useState } from "react";
import { Clock3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { COLORS } from "./shared.js";

function formatRemaining(ms, lang) {
  if (ms <= 0) return lang === "sw" ? "Imeisha" : "Expired";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const restHours = hours % 24;
    return lang === "sw"
      ? `Siku ${days}, saa ${restHours}`
      : `${days}d ${restHours}h`;
  }
  if (hours >= 1) {
    return lang === "sw" ? `Saa ${hours}, dakika ${minutes}` : `${hours}h ${minutes}m`;
  }
  return lang === "sw" ? `Dakika ${minutes}` : `${minutes}m`;
}

function formatOverdue(ms, lang) {
  if (ms <= 0) return "";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return lang === "sw" ? `Siku ${days}` : `${days}d`;
  }
  if (hours >= 1) {
    return lang === "sw" ? `Saa ${hours}` : `${hours}h`;
  }
  return lang === "sw" ? `Dakika ${minutes}` : `${minutes}m`;
}

export default function SlaCountdown({ deadline, status, overdue, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return undefined;
    const id = setInterval(() => setNow(Date.now()), 60000); // kila dakika
    return () => clearInterval(id);
  }, [deadline]);

  // Ticket imefungwa au imetatuliwa — hakuna SLA
  const closed =
    status === "closed" || status === "resolved" || status === "in_progress";

  if (closed) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary">
        <CheckCircle2 size={11} color={COLORS.green} />
        {status === "resolved"
          ? t("Imetatuliwa", "Resolved")
          : status === "in_progress"
          ? t("Inaendelea", "In progress")
          : t("Imefungwa", "Closed")}
      </span>
    );
  }

  if (!deadline) return null;

  const target = new Date(deadline).getTime();
  if (Number.isNaN(target)) return null;

  const diff = target - now;
  const isOverdue = overdue || diff <= 0;

  if (isOverdue) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-bold"
        style={{ color: COLORS.rust }}
        title={t(
          "Muda wa kujibiwa umepitiliza",
          "Response deadline has passed"
        )}
      >
        <AlertTriangle size={11} />
        {t("SLA imepitiliza", "SLA overdue")} · {formatOverdue(Math.abs(diff), lang)}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium"
      style={{ color: diff < 3600000 ? COLORS.rust : "#8A5A16" }}
      title={t("Muda uliobaki wa kujibiwa", "Time left to respond")}
    >
      <Clock3 size={11} />
      {formatRemaining(diff, lang)}
    </span>
  );
}
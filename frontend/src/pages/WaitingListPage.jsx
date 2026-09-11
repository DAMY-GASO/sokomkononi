import React, { useState } from "react";
import {
  Clock3,
  Bell,
  BellRing,
  XCircle,
  Hourglass,
  MapPin,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { COLORS, FONTS, getCategory, formatTZS, timeAgo } from "./dashboard/components/shared";
import { useWaitingList, leaveWaitingList as leaveWaitingListStore } from "../config/waitingListStore.js";

// Waiting List = mnunuzi anajiunga na foleni ya mali ambayo tayari ina
// reservation/imeuzwa, ili apate taarifa endapo nafasi itafunguka tena
// (mf. deal nyingine ikighairiwa kwenye Deal Rooms).
export const WAITING_STATUS = {
  pending: {
    label: "Kwenye Foleni",
    color: "#8A5A16",
    bg: "rgba(232,163,61,0.16)",
    icon: Hourglass,
  },
  notified: {
    label: "Nafasi Wazi — Umetaarifiwa",
    color: COLORS.green,
    bg: "rgba(47,109,79,0.14)",
    icon: BellRing,
  },
  expired: {
    label: "Muda wa Kuchukua Nafasi Umeisha",
    color: COLORS.night,
    bg: "rgba(16,26,46,0.08)",
    icon: XCircle,
  },
};

function WaitingListItem({ entry, onLeave, onGoToDeals }) {
  const category = getCategory(entry.category);
  const Icon = category?.icon;
  const status = WAITING_STATUS[entry.status] || WAITING_STATUS.pending;
  const StatusIcon = status.icon;

  return (
    <div
      style={{ background: "white", borderColor: COLORS.sandLine }}
      className="rounded-xl border p-4 flex items-start gap-3"
    >
      <div
        style={{ background: COLORS.night }}
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      >
        {Icon && <Icon size={18} color={COLORS.gold} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <p style={{ color: COLORS.night }} className="text-sm font-semibold truncate">
              {entry.property}
            </p>
            <p style={{ color: "rgba(16,26,46,0.5)" }} className="text-xs mt-0.5 flex items-center gap-1">
              <MapPin size={10} /> {entry.location}
            </p>
          </div>
          <span
            style={{ background: status.bg, color: status.color }}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full shrink-0"
          >
            <StatusIcon size={11} />
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
          <span style={{ color: COLORS.rust }} className="font-bold text-sm">
            {formatTZS(entry.price)}
          </span>
          {entry.status === "pending" && entry.position && (
            <span style={{ color: "rgba(16,26,46,0.55)" }}>
              • Nafasi yako: <strong>#{entry.position}</strong> kwenye foleni
            </span>
          )}
          <span style={{ color: "rgba(16,26,46,0.4)" }}>• Umejiunga {timeAgo(entry.joinedAt)}</span>
        </div>

        {entry.status === "notified" && (
          <div
            style={{ background: "rgba(47,109,79,0.08)", borderColor: "rgba(47,109,79,0.25)" }}
            className="mt-3 rounded-lg border px-3 py-2 flex items-center justify-between gap-2 flex-wrap"
          >
            <span style={{ color: COLORS.green }} className="text-[11px] font-medium">
              Nafasi imefunguka! Una hadi{" "}
              {entry.respondBy ? new Date(entry.respondBy).toLocaleString("sw-TZ") : "muda fulani"}{" "}
              kuanza mazungumzo kabla nafasi kupewa mtu mwingine.
            </span>
            <button
              onClick={onGoToDeals}
              style={{ background: COLORS.green, color: "white" }}
              className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg shrink-0"
            >
              Nenda Deal Room <ArrowRight size={12} />
            </button>
          </div>
        )}

        {(entry.status === "pending" || entry.status === "notified") && (
          <button
            onClick={() => onLeave(entry.id)}
            style={{ color: COLORS.rust }}
            className="flex items-center gap-1 text-[11px] font-semibold mt-2.5"
          >
            <LogOut size={11} /> Ondoka kwenye Foleni
          </button>
        )}
      </div>
    </div>
  );
}

export default function WaitingListPage({ entries: entriesProp, onLeave, onGoToDeals }) {
  const storeEntries = useWaitingList();
  const entries = entriesProp ?? storeEntries;
  const [filter, setFilter] = useState("all");

  const handleLeave = (id) => {
    if (onLeave) {
      onLeave(id);
    } else {
      leaveWaitingListStore(id);
    }
  };

  const filters = [
    { key: "all", label: "Zote" },
    { key: "pending", label: "Kwenye Foleni" },
    { key: "notified", label: "Umetaarifiwa" },
    { key: "expired", label: "Imeisha Muda" },
  ];

  const filtered = entries.filter((e) => filter === "all" || e.status === filter);
  const notifiedCount = entries.filter((e) => e.status === "notified").length;

  return (
    <div style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "100%" }} className="w-full p-4 sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Clock3 size={22} color={COLORS.gold} />
          <h1 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl sm:text-3xl font-semibold">
            Waiting List
          </h1>
        </div>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-5">
          Mali ambazo tayari zina Reservation/zimeuzwa — utapata taarifa endapo nafasi itafunguka
          tena.
        </p>

        {notifiedCount > 0 && (
          <div
            style={{ background: "rgba(47,109,79,0.1)", borderColor: "rgba(47,109,79,0.3)" }}
            className="rounded-xl border px-4 py-3 mb-4 flex items-center gap-2"
          >
            <Bell size={16} color={COLORS.green} />
            <p style={{ color: COLORS.green }} className="text-sm font-medium">
              Una {notifiedCount} nafasi {notifiedCount === 1 ? "iliyofunguka" : "zilizofunguka"} —
              chukua hatua kabla muda haujaisha.
            </p>
          </div>
        )}

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? COLORS.night : "white",
                color: filter === f.key ? COLORS.sand : COLORS.night,
                borderColor: COLORS.sandLine,
              }}
              className="text-xs font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap shrink-0"
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div
            style={{ borderColor: COLORS.sandLine }}
            className="rounded-2xl border-2 border-dashed p-12 text-center bg-white"
          >
            <Clock3 size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 style={{ color: COLORS.night }} className="font-semibold mb-1">
              Hujajiunga na waiting list yoyote
            </h3>
            <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-sm">
              Ukiona mali iliyo na Reservation/imeuzwa, bofya "Jiunge na Waiting List" kwenye
              tangazo lake ili tukutaarifu nafasi ikifunguka.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((e) => (
              <WaitingListItem key={e.id} entry={e} onLeave={handleLeave} onGoToDeals={onGoToDeals} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

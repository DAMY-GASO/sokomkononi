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
import { useLanguage } from "../context/LanguageContext.jsx";

// Waiting List = mnunuzi anajiunga na foleni ya mali ambayo tayari ina
// reservation/imeuzwa, ili apate taarifa endapo nafasi itafunguka tena.
const getWaitingStatus = (lang) => ({
  pending: {
    label: lang === "sw" ? "Kwenye Foleni" : "In Queue",
    color: "#8A5A16",
    bg: "rgba(232,163,61,0.16)",
    icon: Hourglass,
  },
  notified: {
    label: lang === "sw" ? "Nafasi Wazi — Umetaarifiwa" : "Slot Open — You're Notified",
    color: COLORS.green,
    bg: "rgba(47,109,79,0.14)",
    icon: BellRing,
  },
  expired: {
    label: lang === "sw" ? "Muda wa Kuchukua Nafasi Umeisha" : "Slot Claim Window Expired",
    color: COLORS.night,
    bg: "rgba(16,26,46,0.08)",
    icon: XCircle,
  },
});

function WaitingListItem({ entry, onLeave, onGoToDeals, lang }) {
  const category = getCategory(entry.category);
  const Icon = category?.icon;
  const status = getWaitingStatus(lang)[entry.status] || getWaitingStatus(lang).pending;
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
            <p
              style={{ color: "rgba(16,26,46,0.5)" }}
              className="text-xs mt-0.5 flex items-center gap-1"
            >
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
              • {lang === "sw" ? "Nafasi yako" : "Your position"}: <strong>#{entry.position}</strong>{" "}
              {lang === "sw" ? "kwenye foleni" : "in queue"}
            </span>
          )}
          <span style={{ color: "rgba(16,26,46,0.4)" }}>
            • {lang === "sw" ? "Umejiunga" : "Joined"} {timeAgo(entry.joinedAt)}
          </span>
        </div>

        {entry.status === "notified" && (
          <div
            style={{ background: "rgba(47,109,79,0.08)", borderColor: "rgba(47,109,79,0.25)" }}
            className="mt-3 rounded-lg border px-3 py-2 flex items-center justify-between gap-2 flex-wrap"
          >
            <span style={{ color: COLORS.green }} className="text-[11px] font-medium">
              {lang === "sw" ? (
                <>
                  Nafasi imefunguka! Una hadi{" "}
                  {entry.respondBy
                    ? new Date(entry.respondBy).toLocaleString("sw-TZ")
                    : "muda fulani"}{" "}
                  kuanza mazungumzo kabla nafasi kupewa mtu mwingine.
                </>
              ) : (
                <>
                  A slot opened! You have until{" "}
                  {entry.respondBy
                    ? new Date(entry.respondBy).toLocaleString("en-US")
                    : "some time"}{" "}
                  to start negotiations before it's given to someone else.
                </>
              )}
            </span>
            <button
              onClick={onGoToDeals}
              style={{ background: COLORS.green, color: "white" }}
              className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg shrink-0"
            >
              {lang === "sw" ? "Nenda Deal Room" : "Go to Deal Room"} <ArrowRight size={12} />
            </button>
          </div>
        )}

        {(entry.status === "pending" || entry.status === "notified") && (
          <button
            onClick={() => onLeave(entry.id)}
            style={{ color: COLORS.rust }}
            className="flex items-center gap-1 text-[11px] font-semibold mt-2.5"
          >
            <LogOut size={11} /> {lang === "sw" ? "Ondoka kwenye Foleni" : "Leave Queue"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function WaitingListPage({ entries: entriesProp, onLeave, onGoToDeals }) {
  const storeEntries = useWaitingList();
  const { lang } = useLanguage();
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
    { key: "all", label: lang === "sw" ? "Zote" : "All" },
    { key: "pending", label: lang === "sw" ? "Kwenye Foleni" : "In Queue" },
    { key: "notified", label: lang === "sw" ? "Umetaarifiwa" : "Notified" },
    { key: "expired", label: lang === "sw" ? "Imeisha Muda" : "Expired" },
  ];

  const filtered = entries.filter((e) => filter === "all" || e.status === filter);
  const notifiedCount = entries.filter((e) => e.status === "notified").length;

  return (
    <div
      style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "100%" }}
      className="w-full p-4 sm:p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Clock3 size={22} color={COLORS.gold} />
          <h1
            style={{ fontFamily: FONTS.display, color: COLORS.night }}
            className="text-2xl sm:text-3xl font-semibold"
          >
            {lang === "sw" ? "Waiting List" : "Waiting List"}
          </h1>
        </div>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-5">
          {lang === "sw"
            ? "Mali ambazo tayari zina Reservation/zimeuzwa — utapata taarifa endapo nafasi itafunguka tena."
            : "Properties currently Reserved/Sold — you'll be notified if a slot opens up."}
        </p>

        {notifiedCount > 0 && (
          <div
            style={{ background: "rgba(47,109,79,0.1)", borderColor: "rgba(47,109,79,0.3)" }}
            className="rounded-xl border px-4 py-3 mb-4 flex items-center gap-2"
          >
            <Bell size={16} color={COLORS.green} />
            <p style={{ color: COLORS.green }} className="text-sm font-medium">
              {lang === "sw" ? (
                <>
                  Una {notifiedCount} nafasi{" "}
                  {notifiedCount === 1 ? "iliyofunguka" : "zilizofunguka"} — chukua hatua kabla muda
                  haujaisha.
                </>
              ) : (
                <>
                  You have {notifiedCount} open slot{notifiedCount === 1 ? "" : "s"} — take action
                  before time runs out.
                </>
              )}
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
              {lang === "sw"
                ? "Hujajiunga na waiting list yoyote"
                : "You haven't joined any waiting list"}
            </h3>
            <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-sm">
              {lang === "sw"
                ? 'Ukiona mali iliyo na Reservation/imeuzwa, bofya "Jiunge na Waiting List" kwenye tangazo lake ili tukutaarifu nafasi ikifunguka.'
                : 'When you see a Reserved/Sold property, click "Join Waiting List" on its listing so we can notify you if a slot opens up.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((e) => (
              <WaitingListItem
                key={e.id}
                entry={e}
                onLeave={handleLeave}
                onGoToDeals={onGoToDeals}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

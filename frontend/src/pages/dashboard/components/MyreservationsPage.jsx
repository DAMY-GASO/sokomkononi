// ============================================================
// MyReservationsPage.jsx — Mali alizolipia Reservation (buyer)
// Chanzo cha data: deals za mnunuzi huyu ambazo reservation
// imeshalipwa (reserved → completed, au disputed).
// ============================================================
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Clock3,
  MapPin,
  ArrowRight,
  Inbox,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { COLORS, getCategory, formatTZS } from "./shared.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useDeals } from "../../../config/dealsStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";

const RESERVED_STATUSES = [
  "reserved",
  "awaiting_final_payment",
  "payment_proof_submitted",
  "completed",
  "disputed",
];

const getStatus = (lang) => ({
  reserved: {
    label: lang === "sw" ? "Kipindi cha Ukaguzi" : "Inspection Period",
    bg: "rgba(16,26,46,0.08)",
    fg: COLORS.night,
  },
  awaiting_final_payment: {
    label: lang === "sw" ? "Tayari kwa Malipo ya Mwisho" : "Ready for Final Payment",
    bg: "rgba(37,99,235,0.12)",
    fg: "#2563EB",
  },
  payment_proof_submitted: {
    label: lang === "sw" ? "Uthibitisho Umetumwa" : "Proof Submitted",
    bg: "rgba(232,163,61,0.16)",
    fg: "#8A5A16",
  },
  completed: {
    label: lang === "sw" ? "Imekamilika" : "Completed",
    bg: "rgba(47,109,79,0.18)",
    fg: COLORS.green,
  },
  disputed: {
    label: lang === "sw" ? "Mgogoro — Chini ya Ukaguzi" : "Dispute — Under Review",
    bg: "rgba(193,80,46,0.16)",
    fg: COLORS.rust,
  },
});

function countdown(expiresAt, lang) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return { text: lang === "sw" ? "Muda umeisha" : "Expired", expired: true };
  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const d = Math.floor(hrs / 24);
  const text =
    d >= 1
      ? lang === "sw"
        ? `Siku ${d}, saa ${hrs % 24} zimebaki`
        : `${d}d ${hrs % 24}h left`
      : lang === "sw"
        ? `Saa ${hrs}, dakika ${mins} zimebaki`
        : `${hrs}h ${mins}m left`;
  return { text, expired: false };
}

function ReservationCard({ deal, lang, onOpen }) {
  const category = getCategory(deal.category);
  const Icon = getCategoryIcon(category?.iconKey);
  const status = getStatus(lang)[deal.status];
  const cd = deal.status === "reserved" ? countdown(deal.reservationExpiresAt, lang) : null;
  const price = deal.agreedPrice || deal.currentOffer || deal.askingPrice || 0;

  return (
    <div
      className="bg-white rounded-2xl border p-4"
      style={{ borderColor: COLORS.sandLine }}
    >
      <div className="flex items-start gap-3">
        <div
          style={{ background: COLORS.night }}
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        >
          {Icon && <Icon size={18} color={COLORS.gold} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-primary text-sm font-semibold truncate">
            {deal.listingTitle || "—"}
          </p>
          {deal.location && (
            <p className="text-secondary text-body-sm flex items-center gap-1 mt-0.5">
              <MapPin size={11} /> <span className="truncate">{deal.location}</span>
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {status && (
              <span
                style={{ background: status.bg, color: status.fg }}
                className="text-body-sm font-semibold px-2 py-0.5 rounded-full"
              >
                {status.label}
              </span>
            )}
            {cd && (
              <span
                style={{ color: cd.expired ? COLORS.rust : "#8A5A16" }}
                className="text-body-sm font-semibold flex items-center gap-1"
              >
                <Clock3 size={11} /> {cd.text}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t"
        style={{ borderColor: COLORS.sandLine }}
      >
        <div>
          <p className="text-[11px] font-semibold text-secondary uppercase">
            {lang === "sw" ? "Bei Mliyokubaliana" : "Agreed Price"}
          </p>
          <p className="text-sm font-semibold text-primary">{formatTZS(price)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-secondary uppercase">
            {lang === "sw" ? "Reservation Fee" : "Reservation Fee"}
          </p>
          <p className="text-sm font-semibold text-primary">
            {deal.reservationFee > 0
              ? formatTZS(deal.reservationFee)
              : lang === "sw"
                ? "Bure"
                : "Free"}
          </p>
        </div>
      </div>

      <button
        onClick={() => onOpen(deal.id)}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg"
      >
        {lang === "sw" ? "Fungua Deal Room" : "Open Deal Room"} <ArrowRight size={13} />
      </button>
    </div>
  );
}

export default function MyReservationsPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const deals = useDeals(user?.id);

  const reservations = useMemo(() => {
    const mine = (deals || []).filter(
      (d) =>
        String(d.buyerId) === String(user?.id) &&
        (d.reservationPaidAt || RESERVED_STATUSES.includes(d.status))
    );
    const stamp = (d) =>
      new Date(d.reservationPaidAt || d.reservationExpiresAt || d.agreedAt || 0).getTime() || 0;
    return mine.sort((a, b) => stamp(b) - stamp(a));
  }, [deals, user?.id]);

  const active = reservations.filter((d) =>
    ["reserved", "awaiting_final_payment", "payment_proof_submitted"].includes(d.status)
  );
  const past = reservations.filter((d) => !active.includes(d));

  const openDeal = (id) => navigate(`/dashboard/buyer/deals?deal=${id}`);

  return (
    <div style={{ background: COLORS.sand, minHeight: "100%" }} className="w-full p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="h-title">
            {lang === "sw" ? "Reservation Zangu" : "My Reservations"}
          </h1>
          <p className="text-body-sm text-secondary mt-2 max-w-xl mx-auto">
            {lang === "sw"
              ? "Mali ulizolipia Reservation Fee. Muda wa ukaguzi na hatua zinazofuata zinaonekana hapa."
              : "Properties you've paid a Reservation Fee for. Inspection time and next steps show here."}
          </p>
        </div>

        {reservations.length === 0 ? (
          <div
            className="rounded-2xl border-2 border-dashed p-10 text-center bg-white"
            style={{ borderColor: COLORS.sandLine }}
          >
            <Inbox size={30} className="mx-auto text-muted mb-2" />
            <p className="text-sm text-muted">
              {lang === "sw"
                ? "Hujalipia reservation yoyote bado."
                : "You haven't paid for any reservation yet."}
            </p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-6">
                <h2 className="h-card mb-3 flex items-center gap-2">
                  <CalendarCheck size={16} />
                  {lang === "sw" ? "Zinazoendelea" : "Active"} ({active.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {active.map((d) => (
                    <ReservationCard key={d.id} deal={d} lang={lang} onOpen={openDeal} />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="h-card mb-3 flex items-center gap-2">
                  {past.some((d) => d.status === "disputed") ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {lang === "sw" ? "Zilizopita" : "Past"} ({past.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {past.map((d) => (
                    <ReservationCard key={d.id} deal={d} lang={lang} onOpen={openDeal} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
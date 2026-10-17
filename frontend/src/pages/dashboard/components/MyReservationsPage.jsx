// ============================================================
// MyReservationsPage.jsx — Mali alizolipia Reservation (buyer)
//
// SASISHO:
//  - isReservationPaid() helper
//  - Vitufe 4: Fungua Deal Room, Angalia Mali, Waitlist, Ondoa
//  - Waitlist → /dashboard/buyer/waiting (WaitingListPage)
//  - Angalia Mali → /mali/{listingId} (PropertyDetailPage)
// ============================================================
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Clock3,
  MapPin,
  ArrowRight,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  Plus,
  XCircle,
  Loader2,
  ExternalLink,
  Users,
} from "lucide-react";
import { COLORS, getCategory, formatTZS } from "./shared.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import {
  useDeals,
  updateDeal as updateDealInStore,
} from "../../../config/dealsStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { transactionsApi } from "../../../api/transactions.js";

// ============================================================
// RESERVED STATUSES
// ============================================================
const RESERVED_STATUSES = [
  "reserved",
  "awaiting_final_payment",
  "payment_proof_submitted",
  "completed",
  "disputed",
];

function isReservationPaid(deal) {
  if (!deal) return false;
  if (deal.reservationPaidAt) return true;
  if (RESERVED_STATUSES.includes(deal.status)) return true;
  if (deal.reservationFee > 0 && deal.transactionId) return true;
  return false;
}

// ============================================================
// STATUS LABELS
// ============================================================
const getStatus = (lang) => ({
  reserved: {
    label: lang === "sw" ? "Kipindi cha Ukaguzi" : "Inspection Period",
    bg: "rgba(16,26,46,0.08)",
    fg: COLORS.night,
  },
  awaiting_final_payment: {
    label:
      lang === "sw"
        ? "Tayari kwa Malipo ya Mwisho"
        : "Ready for Final Payment",
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
    label:
      lang === "sw"
        ? "Mgogoro — Chini ya Ukaguzi"
        : "Dispute — Under Review",
    bg: "rgba(193,80,46,0.16)",
    fg: COLORS.rust,
  },
});

// ============================================================
// COUNTDOWN
// ============================================================
function countdown(expiresAt, lang) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0)
    return { text: lang === "sw" ? "Muda umeisha" : "Expired", expired: true };
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

// ============================================================
// RESERVATION CARD
// ============================================================
function ReservationCard({ deal, lang, onOpen, onRefresh }) {
  const navigate = useNavigate();
  const category = getCategory(deal.category);
  const Icon = getCategoryIcon(category?.iconKey);
  const status = getStatus(lang)[deal.status];
  const cd =
    deal.status === "reserved"
      ? countdown(deal.reservationExpiresAt, lang)
      : null;
  const price = deal.agreedPrice || deal.currentOffer || deal.askingPrice || 0;

  const [actionBusy, setActionBusy] = useState(null);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ── Extend Reservation ──
  const handleExtend = async () => {
    setError("");
    const input = prompt(
      t(
        "Ongeza saa ngapi? (mf. 24, 48, 72)",
        "Add how many hours? (e.g. 24, 48, 72)"
      ),
      "24"
    );
    if (!input) return;
    const additionalHours = parseInt(input, 10);
    if (!additionalHours || additionalHours < 1) {
      setError(t("Muda si sahihi.", "Invalid duration."));
      return;
    }
    if (!deal.transactionId) {
      setError(t("Transaction haipatikani.", "Transaction not found."));
      return;
    }
    setActionBusy("extend");
    try {
      await transactionsApi.extendReservation(
        deal.transactionId,
        additionalHours
      );
      alert(
        t(
          `Muda umeongezwa kwa saa ${additionalHours}.`,
          `Extended by ${additionalHours} hours.`
        )
      );
      onRefresh?.();
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kuongeza muda.", "Failed to extend.")
      );
    } finally {
      setActionBusy(null);
    }
  };

  // ── Finalize Deal → nenda Deal Room ──
  const handleFinalize = () => {
    onOpen(deal.id);
  };

  // ── Remove Reservation ──
  const handleRemove = async () => {
    setError("");
    if (
      !confirm(
        t(
          "Una uhakika unataka kuondoa reservation hii? Reservation Fee HAITAREJESHWA.",
          "Are you sure you want to remove this reservation? The Reservation Fee is NON-REFUNDABLE."
        )
      )
    )
      return;
    if (!deal.transactionId) {
      setError(t("Transaction haipatikani.", "Transaction not found."));
      return;
    }
    setActionBusy("remove");
    try {
      await transactionsApi.removeReservation(deal.transactionId);
      alert(
        t(
          "Reservation imeondolewa. Mali imerudi sokoni.",
          "Reservation removed. The listing is back on the market."
        )
      );
      onRefresh?.();
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kuondoa.", "Failed to remove.")
      );
    } finally {
      setActionBusy(null);
    }
  };

  // ── Angalia Mali → PropertyDetailPage ──
  const handleViewListing = () => {
    if (deal.listingId) {
      navigate(`/mali/${deal.listingId}`);
    }
  };

  // ── Waitlist → WaitingListPage ──
  const handleViewWaitlist = () => {
    navigate("/dashboard/buyer/waiting");
  };

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
              <MapPin size={11} />{" "}
              <span className="truncate">{deal.location}</span>
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
          <p className="text-sm font-semibold text-primary">
            {formatTZS(price)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-secondary uppercase">
            {t("Reservation Fee", "Reservation Fee")}
          </p>
          <p className="text-sm font-semibold text-primary">
            {deal.reservationFee > 0
              ? formatTZS(deal.reservationFee)
              : t("Bure", "Free")}
          </p>
        </div>
      </div>

      {error && (
        <div
          className="mt-3 text-xs font-semibold px-3 py-2 rounded-lg"
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
        >
          {error}
        </div>
      )}

      {/* Primary action — Open Deal Room */}
      <button
        onClick={() => onOpen(deal.id)}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg"
      >
        {t("Fungua Deal Room", "Open Deal Room")} <ArrowRight size={13} />
      </button>

      {/* ── Vitufe 3: Angalia Mali, Waitlist, Ondoa ── */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {/* 1. Angalia Mali → /mali/{listingId} */}
        <button
          onClick={handleViewListing}
          disabled={!deal.listingId}
          style={{
            borderColor: COLORS.sandLine,
            color: COLORS.night,
          }}
          className="text-xs font-semibold px-2 py-2 rounded-lg border bg-white flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ExternalLink size={12} />
          <span className="hidden sm:inline">
            {t("Angalia", "View")}
          </span>
        </button>

        {/* 2. Waitlist → /dashboard/buyer/waiting */}
        <button
          onClick={handleViewWaitlist}
          style={{
            borderColor: COLORS.sandLine,
            color: COLORS.night,
          }}
          className="text-xs font-semibold px-2 py-2 rounded-lg border bg-white flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
        >
          <Users size={12} />
          <span className="hidden sm:inline">
            {t("Waitlist", "Waitlist")}
          </span>
        </button>

        {/* 3. Ondoa → removeReservation */}
        <button
          onClick={handleRemove}
          disabled={!!actionBusy || !deal.transactionId}
          style={{
            borderColor: "rgba(193,80,46,0.35)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-2 py-2 rounded-lg border bg-white flex items-center justify-center gap-1 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {actionBusy === "remove" ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <XCircle size={12} />
          )}
          <span className="hidden sm:inline">
            {t("Ondoa", "Remove")}
          </span>
        </button>
      </div>

      {/* ── Vitendo vya reservation (status = reserved pekee): Ongeza / Kamilisha ── */}
      {deal.status === "reserved" && deal.transactionId && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={handleExtend}
            disabled={!!actionBusy}
            style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
            className="text-xs font-semibold px-2 py-2 rounded-lg border bg-white flex items-center justify-center gap-1 disabled:opacity-50"
            title={t("Ongeza muda", "Extend time")}
          >
            {actionBusy === "extend" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Plus size={12} />
            )}
            <span className="hidden sm:inline">
              {t("Ongeza Muda", "Extend")}
            </span>
          </button>

          <button
            onClick={handleFinalize}
            disabled={!!actionBusy}
            style={{ background: COLORS.green, color: "white" }}
            className="text-xs font-semibold px-2 py-2 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
            title={t("Kamilisha deal", "Finalize deal")}
          >
            <CheckCircle2 size={12} />
            <span className="hidden sm:inline">
              {t("Kamilisha", "Finalize")}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function MyReservationsPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const deals = useDeals(user?.id);

  const reservations = useMemo(() => {
    const mine = (deals || []).filter(
      (d) =>
        String(d.buyerId) === String(user?.id) && isReservationPaid(d)
    );
    const stamp = (d) =>
      new Date(
        d.reservationPaidAt || d.reservationExpiresAt || d.agreedAt || 0
      ).getTime() || 0;
    return mine.sort((a, b) => stamp(b) - stamp(a));
  }, [deals, user?.id]);

  const active = reservations.filter((d) =>
    ["reserved", "awaiting_final_payment", "payment_proof_submitted"].includes(
      d.status
    )
  );
  const past = reservations.filter((d) => !active.includes(d));

  const openDeal = (id) => navigate(`/dashboard/buyer/deals?deal=${id}`);

  const handleRefresh = async () => {
    try {
      const { hydrateDealsFromApi } = await import(
        "../../../config/dealsStore.js"
      );
      await hydrateDealsFromApi(user?.id, "buyer");
    } catch (err) {
      console.warn("[MyReservationsPage] refresh failed:", err);
    }
  };

  return (
    <div
      style={{ background: COLORS.sand, minHeight: "100%" }}
      className="w-full p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="h-title">
            {lang === "sw" ? "Mali Nilizoshikilia" : "My Reservations"}
          </h1>
          <p className="text-body-sm text-secondary mt-2 max-w-xl mx-auto">
            {lang === "sw"
              ? "Mali ulizolipia ada ya kushikilia. Muda wa ukaguzi na hatua zinazofuata zinaonekana hapa."
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
                ? "Bado hujalipia ada yoyote ya kushikilia mali."
                : "You haven't paid for any reservation yet."}
            </p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-6">
                <h2 className="h-card mb-3 flex items-center gap-2">
                  <CalendarCheck size={16} />
                  {lang === "sw" ? "Zinazoendelea" : "Active"} (
                  {active.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {active.map((d) => (
                    <ReservationCard
                      key={d.id}
                      deal={d}
                      lang={lang}
                      onOpen={openDeal}
                      onRefresh={handleRefresh}
                    />
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
                    <ReservationCard
                      key={d.id}
                      deal={d}
                      lang={lang}
                      onOpen={openDeal}
                      onRefresh={handleRefresh}
                    />
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
// ============================================================
// MyReservationsPage.jsx — Mali alizolipia Reservation (buyer)
//
// SASISHO:
//  - Live countdown (kila sekunde) kwa muda wa reservation
//  - Popup ya "Renew / Cancel" dakika 5 kabla ya expire
//  - Vitufe 4: Fungua Deal Room, Angalia Mali, Waitlist, Ondoa
// ============================================================
import React, { useMemo, useState, useEffect } from "react";
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
  getReservationTiers,
  calcReservationFee,
} from "../../../config/feePolicy.js";
import { checkCredit } from "../../../config/userCreditsStore.js";
import {
  extendReservationAsync,
  pollExtensionAsync,
} from "../../../config/transactionsStore.js";
import {
  useDeals,
  updateDeal as updateDealInStore,
  hydrateDealsFromApi,
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
    label: lang === "sw" ? "Kipindi cha Ukaguzi" : "Reservation Period",
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
// LIVE COUNTDOWN
// ============================================================
function useCountdown(expiresAt, lang) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (Number.isNaN(ms)) return null;
  if (ms <= 0)
    return {
      text: lang === "sw" ? "Muda umeisha" : "Expired",
      expired: true,
    };

  const hrs = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const d = Math.floor(hrs / 24);

  const text =
    d >= 1
      ? lang === "sw"
        ? `Siku ${d}, saa ${hrs % 24}, dakika ${mins}`
        : `${d}d ${hrs % 24}h ${mins}m`
      : lang === "sw"
        ? `Saa ${hrs}, dakika ${mins}, sekunde ${secs}`
        : `${hrs}h ${mins}m ${secs}s`;

  return { text, expired: false, hrs, mins, secs, d };
}

// ============================================================
// EXTEND (ada inalipwa KWANZA, kisha muda unaongezwa)
// ============================================================
async function runExtension({ deal, hours, user, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const fee = calcReservationFee(hours);
  let opts = {};

  if (fee > 0) {
    const credit = checkCredit(user?.id, "reservation");
    if (
      credit?.hasCredit &&
      confirm(
        t(
          `Tumia reservation credit 1 kuongeza saa ${hours}?`,
          `Use 1 reservation credit to extend by ${hours} hours?`
        )
      )
    ) {
      opts = { paymentReference: "credits" };
    } else {
      const ok = confirm(
        t(
          `Ada ya kuongeza saa ${hours} ni ${formatTZS(fee)}. Endelea kulipa?`,
          `The fee to extend by ${hours} hours is ${formatTZS(fee)}. Continue to pay?`
        )
      );
      if (!ok) return { cancelled: true };
      const phone = prompt(
        t(
          "Namba ya simu ya Mobile Money (mf. 255712345678)",
          "Mobile Money phone number (e.g. 255712345678)"
        ),
        user?.phone || deal.buyerPhone || ""
      );
      if (!phone) return { cancelled: true };
      opts = { paymentMethod: "mobile", phone };
    }
  }

  const res = await extendReservationAsync(deal.transactionId, hours, opts);
  if (!res.ok) throw res.error;

  if (!res.pending) return { paid: true };

  if (res.checkoutUrl) {
    try {
      window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
    } catch {
      /* noop */
    }
  }
  alert(
    t(
      "Malipo yameanzishwa. Kamilisha malipo; muda utaongezwa mara moja baada ya malipo kuthibitishwa.",
      "Payment started. Complete the payment; the time is added as soon as it is confirmed."
    )
  );
  const poll = await pollExtensionAsync(
    deal.transactionId,
    deal.reservationExpiresAt
  );
  return { paid: poll.ok, pending: !poll.ok };
}

// ============================================================
// RESERVATION CARD
// ============================================================
function ReservationCard({ deal, lang, onOpen, onRefresh }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const category = getCategory(deal.category);
  const Icon = getCategoryIcon(category?.iconKey);
  const status = getStatus(lang)[deal.status];
  const cd = useCountdown(
    ["reserved", "awaiting_final_payment", "payment_proof_submitted"].includes(
      deal.status
    )
      ? deal.reservationExpiresAt
      : null,
    lang
  );
  const price =
    deal.agreedPrice || deal.currentOffer || deal.askingPrice || 0;

  const [actionBusy, setActionBusy] = useState(null);
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

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
      const r = await runExtension({
        deal,
        hours: additionalHours,
        user,
        lang,
      });
      if (r.cancelled) return;
      alert(
        r.paid
          ? t(
              `Muda umeongezwa kwa saa ${additionalHours}.`,
              `Extended by ${additionalHours} hours.`
            )
          : t(
              "Malipo bado hayajathibitishwa. Angalia tena baadaye.",
              "Payment not confirmed yet. Please check again shortly."
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

  const handleFinalize = () => {
    onOpen(deal.id);
  };

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

  const handleViewListing = () => {
    if (deal.listingId) {
      navigate(`/mali/${deal.listingId}`);
    }
  };

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
                style={{
                  color: cd.expired ? COLORS.rust : "#8A5A16",
                }}
                className="text-body-sm font-semibold flex items-center gap-1 tabular-nums"
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

      <button
        onClick={() => onOpen(deal.id)}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg"
      >
        {t("Fungua Deal Room", "Open Deal Room")}{" "}
        <ArrowRight size={13} />
      </button>

      <div className="grid grid-cols-3 gap-2 mt-2">
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

      {deal.status === "reserved" && deal.transactionId && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={handleExtend}
            disabled={!!actionBusy}
            style={{
              borderColor: COLORS.sandLine,
              color: COLORS.night,
            }}
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
// EXPIRING MODAL
// ============================================================
function ExpiringModal({ deal, lang, onRenew, onCancel }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  if (!deal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-5"
        style={{ borderColor: COLORS.sandLine }}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "rgba(193,80,46,0.12)" }}
          >
            <Clock3 size={24} color={COLORS.rust} />
          </div>
          <h3 className="text-primary text-base font-bold">
            {t(
              "Reservation inaisha hivi karibuni",
              "Reservation is about to expire"
            )}
          </h3>
          <p className="text-secondary text-sm">
            {t(
              `Reservation yako ya "${deal.listingTitle}" inaisha ndani ya dakika 5. Unataka ku-renew?`,
              `Your reservation for "${deal.listingTitle}" expires in 5 minutes. Renew?`
            )}
          </p>
          <div className="flex items-center gap-2 w-full mt-2">
            <button
              onClick={onCancel}
              style={{
                borderColor: COLORS.sandLine,
                color: COLORS.rust,
              }}
              className="flex-1 text-sm font-semibold px-3 py-2.5 rounded-lg border bg-white"
            >
              {t("Cancel", "Cancel")}
            </button>
            <button
              onClick={onRenew}
              style={{ background: COLORS.green, color: "white" }}
              className="flex-1 text-sm font-semibold px-3 py-2.5 rounded-lg"
            >
              {t("Renew Sasa", "Renew Now")}
            </button>
          </div>
        </div>
      </div>
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

  const [expiringDeal, setExpiringDeal] = useState(null);
  const [dismissed, setDismissed] = useState({});

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
      await hydrateDealsFromApi(user?.id, "buyer");
    } catch (err) {
      console.warn("[MyReservationsPage] refresh failed:", err);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // EXPIRING MODAL — check kila sekunde 10
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const expiring = reservations.find((d) => {
        if (d.status !== "reserved") return false;
        if (!d.reservationExpiresAt) return false;
        if (dismissed[d.id]) return false;
        const ms = new Date(d.reservationExpiresAt).getTime() - now;
        return ms > 0 && ms <= 5 * 60 * 1000;
      });
      if (
        expiring &&
        (!expiringDeal || expiringDeal.id !== expiring.id)
      ) {
        setExpiringDeal(expiring);
      }
    };
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, [reservations, dismissed, expiringDeal]);

  const handleDismissModal = (id) => {
    setDismissed((prev) => ({ ...prev, [id]: true }));
    setExpiringDeal(null);
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

        {/* Expiring Modal */}
        <ExpiringModal
          deal={expiringDeal}
          lang={lang}
          onRenew={async () => {
            if (!expiringDeal) return;
            const target = expiringDeal;
            handleDismissModal(target.id);
            if (!target.transactionId) return;
            try {
              // Tumia tier halali (backend inakataa saa zisizo kwenye tiers)
              const active = getReservationTiers()
                .filter((x) => x.is_active)
                .sort((a, b) => a.hours - b.hours);
              const tier = active.find((x) => x.hours === 24) || active[0];
              if (!tier) throw new Error(
                lang === "sw" ? "Hakuna muda wa kuongeza uliopo." : "No extension tier available."
              );
              const r = await runExtension({
                deal: target,
                hours: tier.hours,
                user,
                lang,
              });
              if (r.cancelled) return;
              await handleRefresh();
            } catch (err) {
              alert(
                err?.data?.detail ||
                  err?.message ||
                  (lang === "sw"
                    ? "Imeshindwa kuongeza muda."
                    : "Failed to extend.")
              );
            }
          }}
          onCancel={() => {
            if (expiringDeal) handleDismissModal(expiringDeal.id);
          }}
        />
      </div>
    </div>
  );
}
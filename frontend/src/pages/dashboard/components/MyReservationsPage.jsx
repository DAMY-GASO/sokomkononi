// ============================================================
// MyReservationsPage.jsx — Mali alizolipia Reservation (buyer)
// Inaonyesha reservations pekee (sio Deal Rooms).
// ============================================================
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CalendarCheck, Clock3, MapPin, ArrowRight, Inbox, CheckCircle2,
  AlertTriangle, Plus, XCircle, Loader2, ExternalLink, RefreshCw,
} from "lucide-react";
import { COLORS, getCategory, formatTZS, timeAgo } from "./shared.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { api } from "../../../api/client.js";

// ============================================================
// RAMANI YA STATUS
// ============================================================
const RESERVATION_STATUS = {
  pending_payment: {
    label: { sw: "Inasubiri Malipo", en: "Awaiting Payment" },
    color: "#D97706", bg: "rgba(217,119,6,0.12)",
  },
  active: {
    label: { sw: "Inatumika", en: "Active" },
    color: COLORS.green, bg: "rgba(47,109,79,0.12)",
  },
  reserved: {
    label: { sw: "Kipindi cha Ukaguzi", en: "Inspection Period" },
    color: COLORS.night, bg: "rgba(16,26,46,0.08)",
  },
  awaiting_final_payment: {
    label: { sw: "Tayari kwa Malipo ya Mwisho", en: "Ready for Final Payment" },
    color: "#2563EB", bg: "rgba(37,99,235,0.12)",
  },
  payment_proof_submitted: {
    label: { sw: "Uthibitisho Umetumwa", en: "Proof Submitted" },
    color: "#8A5A16", bg: "rgba(232,163,61,0.16)",
  },
  completed: {
    label: { sw: "Imekamilika", en: "Completed" },
    color: COLORS.green, bg: "rgba(47,109,79,0.16)",
  },
  expired: {
    label: { sw: "Imeisha Muda", en: "Expired" },
    color: COLORS.rust, bg: "rgba(193,80,46,0.12)",
  },
  cancelled: {
    label: { sw: "Imeghairiwa", en: "Cancelled" },
    color: COLORS.night, bg: "rgba(16,26,46,0.08)",
  },
  disputed: {
    label: { sw: "Mgogoro — Chini ya Ukaguzi", en: "Dispute — Under Review" },
    color: COLORS.rust, bg: "rgba(193,80,46,0.16)",
  },
};

const ACTIVE_STATUSES = [
  "pending_payment",
  "active",
  "reserved",
  "awaiting_final_payment",
  "payment_proof_submitted",
];

// ============================================================
// HELPERS
// ============================================================
function formatDate(dateStr, lang) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString(lang === "sw" ? "sw-TZ" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function useCountdown(expiresAt, lang) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return { text: lang === "sw" ? "Muda umeisha" : "Expired", expired: true };

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
// RESERVATION CARD
// ============================================================
function ReservationCard({ reservation, lang, onOpenDeal, onRefresh }) {
  const navigate = useNavigate();
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const status = RESERVATION_STATUS[reservation.status] || RESERVATION_STATUS.pending_payment;
  const isActive = ACTIVE_STATUSES.includes(reservation.status);
  const cd = isActive ? useCountdown(reservation.expires_at, lang) : null;

  // Pata taarifa za tangazo
  const listingTitle =
    reservation.listing_title ||
    reservation.transaction?.listing_title ||
    reservation.listing?.title ||
    t("Mali", "Property");
  const listingLocation =
    reservation.listing_location ||
    reservation.transaction?.listing_location ||
    reservation.listing?.location ||
    "";
  const listingId =
    reservation.listing_id || reservation.transaction?.listing_id || reservation.listing?.id;
  const categoryKey =
    reservation.listing_category || reservation.transaction?.listing_category || null;

  const category = categoryKey ? getCategory(categoryKey) : null;
  const CategoryIcon = getCategoryIcon(category?.iconKey || "Home");

  // ---------- HANDLERS ----------
  const handleOpenDeal = () => {
    if (reservation.deal_room_id) {
      navigate(`/dashboard/buyer/deals?deal=${reservation.deal_room_id}`);
    } else {
      onOpenDeal?.(reservation);
    }
  };

  const handleViewListing = () => {
    if (listingId) navigate(`/mali/${listingId}`);
  };

  const handleExtend = async () => {
    setError("");
    if (!reservation.id) {
      setError(t("Reservation haipatikani.", "Reservation not found."));
      return;
    }
    const input = prompt(
      t("Ongeza saa ngapi? (mf. 24, 48, 72)", "Add how many hours? (e.g. 24, 48, 72)"),
      "24"
    );
    if (!input) return;
    const hours = parseInt(input, 10);
    if (!hours || hours < 1) {
      setError(t("Muda si sahihi.", "Invalid duration."));
      return;
    }
    setBusy("extend");
    try {
      // Tuma ombi la kuongeza muda
      await api.post(`/transactions/reservations/${reservation.id}/extend/`, { hours });
      alert(t(`Muda umeongezwa kwa saa ${hours}.`, `Extended by ${hours} hours.`));
      onRefresh?.();
    } catch (err) {
      setError(err?.data?.detail || err?.message || t("Imeshindwa kuongeza muda.", "Failed to extend."));
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    setError("");
    if (!reservation.id) return;
    const confirmed = confirm(
      t(
        "Una uhakika unataka kuondoa reservation hii? Reservation Fee HAITAREJESHWA.",
        "Are you sure you want to remove this reservation? The Reservation Fee is NON-REFUNDABLE."
      )
    );
    if (!confirmed) return;
    setBusy("cancel");
    try {
      await api.post(`/transactions/reservations/${reservation.id}/cancel/`, {});
      alert(t("Reservation imeondolewa.", "Reservation removed."));
      onRefresh?.();
    } catch (err) {
      setError(err?.data?.detail || err?.message || t("Imeshindwa kuondoa.", "Failed to remove."));
    } finally {
      setBusy(null);
    }
  };

  // ---------- RENDER ----------
  return (
    <div style={{ background: "white", borderColor: COLORS.sandLine }} className="rounded-2xl border p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div style={{ background: COLORS.night }} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
          <CategoryIcon size={18} color={COLORS.gold} />
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={listingId ? `/mali/${listingId}` : "#"}
            className="text-primary text-sm font-semibold hover:text-[#FEA406] transition-colors line-clamp-2"
          >
            {listingTitle}
          </Link>
          {listingLocation && (
            <p className="text-secondary text-xs flex items-center gap-1 mt-0.5">
              <MapPin size={11} />
              <span className="truncate">{listingLocation}</span>
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span
              style={{ background: status.bg, color: status.color }}
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
            >
              {status.label[lang]}
            </span>
            {cd && (
              <span
                style={{ color: cd.expired ? COLORS.rust : "#8A5A16" }}
                className="text-xs font-semibold flex items-center gap-1 tabular-nums"
              >
                <Clock3 size={11} /> {cd.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t" style={{ borderColor: COLORS.sandLine }}>
        <div>
          <p className="text-[11px] font-semibold text-secondary uppercase">
            {t("Muda wa Reservation", "Reservation Duration")}
          </p>
          <p className="text-sm font-semibold text-primary">
            {reservation.duration_hours ? `${reservation.duration_hours} ${t("saa", "hrs")}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-secondary uppercase">
            {t("Ada ya Reservation", "Reservation Fee")}
          </p>
          <p className="text-sm font-semibold text-primary">
            {reservation.deposit_amount && Number(reservation.deposit_amount) > 0
              ? formatTZS(Number(reservation.deposit_amount))
              : t("Bure", "Free")}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-secondary uppercase">
            {t("Inaisha", "Expires")}
          </p>
          <p className="text-xs font-medium text-primary">
            {reservation.expires_at ? formatDate(reservation.expires_at, lang) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-secondary uppercase">
            {t("Iliwekwa", "Placed")}
          </p>
          <p className="text-xs font-medium text-primary">
            {reservation.created_at ? timeAgo(reservation.created_at, lang) : "—"}
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          className="mt-3 text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleOpenDeal}
        style={{ background: COLORS.gold, color: COLORS.night }}
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
      >
        {t("Fungua Deal Room", "Open Deal Room")} <ArrowRight size={13} />
      </button>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <button
          onClick={handleViewListing}
          disabled={!listingId}
          style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
          className="text-xs font-semibold px-2 py-2 rounded-lg border bg-white flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ExternalLink size={12} />
          <span className="hidden sm:inline">{t("Angalia", "View")}</span>
        </button>
        <button
          onClick={handleExtend}
          disabled={!isActive || busy === "extend"}
          style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
          className="text-xs font-semibold px-2 py-2 rounded-lg border bg-white flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {busy === "extend" ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          <span className="hidden sm:inline">{t("Ongeza Muda", "Extend")}</span>
        </button>
        <button
          onClick={handleCancel}
          disabled={!isActive || busy === "cancel"}
          style={{ borderColor: "rgba(193,80,46,0.35)", color: COLORS.rust }}
          className="text-xs font-semibold px-2 py-2 rounded-lg border bg-white flex items-center justify-center gap-1 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {busy === "cancel" ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
          <span className="hidden sm:inline">{t("Ondoa", "Remove")}</span>
        </button>
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
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReservations = async () => {
    setLoading(true);
    setError("");
    try {
      // Jaribu endpoints kadhaa
      let data = null;
      const endpoints = [
        "/transactions/reservations/",
        "/reservations/",
        "/transactions/?status=reserved",
      ];
      let lastError = null;
      for (const ep of endpoints) {
        try {
          data = await api.get(`${ep}${ep.includes("?") ? "&" : "?"}page_size=100`);
          break;
        } catch (err) {
          lastError = err;
          if (err?.status !== 404) throw err;
        }
      }
      if (data === null && lastError) throw lastError;

      const list = Array.isArray(data) ? data : data?.results || data?.data || [];
      setReservations(list);
    } catch (err) {
      setError(err?.data?.detail || err?.message || t("Imeshindwa kupakia reservations.", "Failed to load reservations."));
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const now = new Date();
  const active = useMemo(
    () =>
      reservations.filter(
        (r) =>
          ACTIVE_STATUSES.includes(r.status) &&
          (!r.expires_at || new Date(r.expires_at) > now)
      ),
    [reservations, now]
  );
  const past = useMemo(
    () =>
      reservations.filter(
        (r) => !ACTIVE_STATUSES.includes(r.status) || (r.expires_at && new Date(r.expires_at) <= now)
      ),
    [reservations, now]
  );

  return (
    <div style={{ background: COLORS.sand, minHeight: "100%" }} className="w-full p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="h-title flex items-center gap-2">
              <CalendarCheck size={22} color={COLORS.gold} />
              {t("Mali Nilizoshikilia", "My Reservations")}
            </h1>
            <p className="text-sm text-secondary mt-2 max-w-xl">
              {t(
                "Mali ulizolipia ada ya kushikilia. Muda wa ukaguzi na hatua zinazofuata zinaonekana hapa.",
                "Properties you've paid a Reservation Fee for. Inspection time and next steps show here."
              )}
            </p>
          </div>
          <button
            onClick={fetchReservations}
            disabled={loading}
            style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
            className="text-xs font-semibold px-3 py-2 rounded-lg border flex items-center gap-1.5 disabled:opacity-50 bg-white"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            {t("Sasisha", "Refresh")}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
            className="rounded-xl px-3 py-2 mb-4 text-sm flex items-center gap-2"
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && reservations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="animate-spin" color={COLORS.gold} />
            <p className="text-sm text-secondary">
              {t("Inapakia reservations...", "Loading reservations...")}
            </p>
          </div>
        )}

        {/* Active */}
        {!loading && active.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} color={COLORS.green} />
              {t("Zinazoendelea", "Active")} ({active.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {active.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  lang={lang}
                  onOpenDeal={(deal) => navigate(`/dashboard/buyer/deals?deal=${deal.id}`)}
                  onRefresh={fetchReservations}
                />
              ))}
            </div>
          </section>
        )}

        {/* History */}
        {!loading && past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Clock3 size={14} color={COLORS.night} />
              {t("Historia", "History")} ({past.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {past.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  lang={lang}
                  onOpenDeal={(deal) => navigate(`/dashboard/buyer/deals?deal=${deal.id}`)}
                  onRefresh={fetchReservations}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty */}
        {!loading && reservations.length === 0 && !error && (
          <div
            style={{ borderColor: COLORS.sandLine, background: "white" }}
            className="rounded-2xl border-2 border-dashed p-10 text-center"
          >
            <Inbox size={44} className="mx-auto mb-3" color="rgba(16,26,46,0.25)" />
            <p className="text-sm font-semibold text-primary mb-1">
              {t("Hakuna reservations bado.", "No reservations yet.")}
            </p>
            <p className="text-xs text-muted max-w-sm mx-auto mb-4">
              {t(
                "Ukiingia kwenye Deal Room na ukalipia Reservation Fee, mali itaonekana hapa.",
                "Once you enter a Deal Room and pay the Reservation Fee, the property will appear here."
              )}
            </p>
            <Link
              to="/dashboard/buyer/deals"
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-lg"
            >
              {t("Nenda kwenye Deal Rooms", "Go to Deal Rooms")}
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
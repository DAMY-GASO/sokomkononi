// ============================================================
// MyListings.jsx — seller's listing management
// Redesigned to match the homepage aesthetic:
//   - eyebrow labels + bold headings
//   - rounded cards with soft hover lift
//   - real images (falls back to category image, then icon)
//   - two-row action layout with clear primary/secondary hierarchy
// ============================================================
import React, { useState, useMemo } from "react";
import {
  Eye, Rocket, Pencil, Trash2, Clock, CreditCard, RefreshCw, MapPin,
  Inbox, TrendingUp, Megaphone, Pause, Play, CheckCircle, Plus,
  MoreHorizontal, X, Search, Grid3x3, List as ListIcon,
} from "lucide-react";
import {
  COLORS,
  calculateListingFee,
  getCategory,
  formatTZS,
  timeAgo,
  isBoostActive,
  boostDaysRemaining,
  isLeadingActive,
  leadingDaysRemaining,
} from "./shared";
import { useActiveBannerAds, bannerDaysRemaining } from "../../../config/bannerAdsStore.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { api } from "../../../api/client.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import PaymentGateway from "./PaymentGateway";

// ============================================================
// STATUS BADGE — bilingual, consistent with the rest of the app
// ============================================================
const STATUS_CONFIG = {
  live:              { bg: "rgba(47,109,79,0.1)",  fg: "#2F6D4F", label: { sw: "Hai",              en: "Live" } },
  paused:            { bg: "rgba(232,163,61,0.12)", fg: "#8A5A16", label: { sw: "Imesimamishwa",   en: "Paused" } },
  reserved:          { bg: "rgba(232,163,61,0.12)", fg: "#8A5A16", label: { sw: "Imehifadhiwa",   en: "Reserved" } },
  sold:              { bg: "rgba(16,26,46,0.06)",   fg: "#101A2E", label: { sw: "Imeuzwa",        en: "Sold" } },
  pending_payment:   { bg: "rgba(232,163,61,0.12)", fg: "#8A5A16", label: { sw: "Inasubiri Malipo", en: "Pending" } },
  in_review:         { bg: "rgba(16,26,46,0.06)",   fg: "#101A2E", label: { sw: "Inakaguliwa",    en: "In Review" } },
  expired:           { bg: "rgba(193,80,46,0.1)",   fg: "#C1502E", label: { sw: "Imeisha Muda",   en: "Expired" } },
  rejected:          { bg: "rgba(193,80,46,0.1)",   fg: "#C1502E", label: { sw: "Imekataliwa",    en: "Rejected" } },
};

function StatusBadge({ status, lang }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending_payment;
  return (
    <span
      style={{ background: s.bg, color: s.fg }}
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
    >
      <span className="w-1 h-1 rounded-full" style={{ background: s.fg }} />
      {s.label[lang] || s.label.sw}
    </span>
  );
}

// ============================================================
// IMAGE RESOLVER — listing image → category image → null
// ============================================================
function resolveListingImage(listing, category) {
  if (listing?.imageUrl) return listing.imageUrl;
  if (Array.isArray(listing?.photos) && listing.photos[0]) {
    const p = listing.photos[0];
    if (typeof p === "string") return p;
    return p?.image_url || p?.url || p?.image || null;
  }
  if (category?.imageUrl) return category.imageUrl;
  return null;
}

// ============================================================
// ACTION BUTTONS — three visual tiers
// ============================================================
function PrimaryAction({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: COLORS.gold, color: COLORS.night }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all hover:brightness-95 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function SecondaryAction({ icon: Icon, label, onClick, disabled, tone = "neutral" }) {
  const color = tone === "danger" ? COLORS.rust : "var(--text-primary)";
  const border = tone === "danger" ? "rgba(193,80,46,0.3)" : "var(--sand-line, #E6E2D6)";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ color, borderColor: border }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border bg-white transition-all hover:bg-gray-50 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function IconOnlyAction({ icon: Icon, label, onClick, disabled, tone = "neutral" }) {
  const color = tone === "danger" ? COLORS.rust : "var(--text-secondary, #6B7280)";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{ color }}
      className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center transition-all hover:bg-gray-50 active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
    >
      <Icon size={14} />
    </button>
  );
}

// ============================================================
// LISTING CARD
// ============================================================
function ListingCard({
  listing,
  lang,
  onRemove,
  onBoost,
  onLeading,
  onAdvertise,
  onPause,
  onResume,
  onMarkSold,
  activeBanner,
  isPaying,
  onStartPay,
  onCancelPay,
  onPaySuccess,
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const category = getCategory(listing.category);
  const Icon = getCategoryIcon(category?.iconKey);
  const categoryLabel = category?.label?.[lang] || category?.label?.sw || listing.category;
  const img = resolveListingImage(listing, category);

  const isFaded = listing.status === "sold" || listing.status === "expired";
  const isLive = listing.status === "live";
  const isPaused = listing.status === "paused";
  const isReserved = listing.status === "reserved";
  const isPendingPayment = listing.status === "pending_payment";
  const isInReview = listing.status === "in_review";

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.14)]">
      <div className="flex flex-col sm:flex-row">
        {/* ── Image ───────────────────────────────────── */}
        <div className="relative w-full sm:w-44 h-40 sm:h-auto shrink-0 bg-[#F5F3EC] overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={listing.title}
              loading="lazy"
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                isFaded ? "opacity-60" : ""
              }`}
              onError={(e) => { e.target.style.display = "none"; e.target.parentElement.classList.add("fallback-show"); }}
            />
          ) : null}
          {/* Fallback icon shown when img fails or is absent */}
          {!img && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon size={40} color={COLORS.gold} className="opacity-70" />
            </div>
          )}
          {/* Overlay pills */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            {isLeadingActive(listing) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2F6D4F] text-white">
                <TrendingUp size={9} />
                {leadingDaysRemaining(listing)}d
              </span>
            )}
            {isBoostActive(listing) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8A33D] text-[#101A2E]">
                <Rocket size={9} />
                {boostDaysRemaining(listing)}d
              </span>
            )}
            {activeBanner && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C1502E] text-white">
                <Megaphone size={9} />
                {bannerDaysRemaining(activeBanner)}d
              </span>
            )}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────── */}
        <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col">
          {/* Top row: status + price */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <StatusBadge status={listing.status} lang={lang} />
              <h3 className={`text-[15px] sm:text-base font-semibold text-primary mt-2 leading-snug line-clamp-2 ${
                isFaded ? "opacity-70" : ""
              }`}>
                {listing.title}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-secondary">
                {t("Bei", "Price")}
              </p>
              <p style={{ color: isFaded ? "rgba(193,80,46,0.6)" : COLORS.rust }} className="text-base sm:text-lg font-bold leading-tight">
                {formatTZS(listing.price)}
              </p>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary mb-3">
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} />
              <span className="truncate max-w-[140px]">{listing.location || "—"}</span>
            </span>
            <span className="text-muted">·</span>
            <span className="truncate">{categoryLabel}</span>
            <span className="text-muted">·</span>
            <span>{timeAgo(listing.postedAt, lang)}</span>
          </div>

          {/* Stats */}
          {(isLive || isReserved || isPaused || isFaded) && (
            <div className="flex items-center gap-4 text-xs mb-3">
              <span className="inline-flex items-center gap-1.5 text-secondary">
                <Eye size={12} />
                <strong className="text-primary font-semibold">{listing.views ?? 0}</strong>
                {t("mionekano", "views")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-secondary">
                <Inbox size={12} />
                <strong className="text-primary font-semibold">{listing.inquiries ?? 0}</strong>
                {t("maswali", "inquiries")}
              </span>
            </div>
          )}

          {/* Status-specific banners */}
          {isPendingPayment && !isPaying && (
            <div className="rounded-xl px-3 py-2.5 mb-3 text-xs" style={{ background: "rgba(232,163,61,0.1)", color: "#8A5A16" }}>
              <p className="font-semibold mb-0.5">{t("Inasubiri malipo", "Awaiting payment")}</p>
              <p className="leading-relaxed">
                {lang === "sw"
                  ? <>Lipa <strong>{formatTZS(listing.listingFee)}</strong> ili tangazo lako lianze kuonekana kwa wanunuzi.</>
                  : <>Pay <strong>{formatTZS(listing.listingFee)}</strong> so your listing goes live for buyers.</>}
              </p>
            </div>
          )}
          {isInReview && (
            <div className="rounded-xl px-3 py-2.5 mb-3 text-xs flex items-center gap-2" style={{ background: "rgba(16,26,46,0.05)", color: "#101A2E" }}>
              <Clock size={13} className="shrink-0" />
              <span>
                {t(
                  "Timu yetu inakagua tangazo lako — kwa kawaida chini ya saa 24.",
                  "Our team is reviewing your listing — usually within 24 hours."
                )}
              </span>
            </div>
          )}
          {isReserved && (
            <div className="rounded-xl px-3 py-2.5 mb-3 text-xs flex items-center gap-2" style={{ background: "rgba(232,163,61,0.1)", color: "#8A5A16" }}>
              <Clock size={13} className="shrink-0" />
              <span>
                {t(
                  "Ina Reservation hai — wanunuzi wengine wanaona kama RESERVED.",
                  "Has an active reservation — other buyers see it as RESERVED."
                )}
              </span>
            </div>
          )}
          {isPaused && (
            <div className="rounded-xl px-3 py-2.5 mb-3 text-xs flex items-center gap-2" style={{ background: "rgba(232,163,61,0.1)", color: "#8A5A16" }}>
              <Pause size={13} className="shrink-0" />
              <span>
                {t(
                  "Imesimamishwa — haionekani kwa wanunuzi.",
                  "Paused — hidden from buyers."
                )}
              </span>
            </div>
          )}

          {/* Payment Gateway (inline for pending_payment) */}
          {isPendingPayment && isPaying && (
            <div className="mb-3">
              <PaymentGateway
                amount={
                  Number(listing.listingFee) ||
                  Number(calculateListingFee(listing.category, listing.price)?.fee) ||
                  0
                }
                title={t("Ada ya Kuchapisha", "Listing Fee")}
                description={t(`Kuchapisha "${listing.title}"`, `Publishing "${listing.title}"`)}
                onInitiate={async ({ methodKey, phone } = {}) => {
                  try {
                    const res = await api.post(`/listings/${listing.id}/fee/pay/`, {
                      payment_method: methodKey || "",
                      phone: phone || "",
                    });
                    const candidates = [res?.fimipay, res?.data?.fimipay, res?.data, res].filter(Boolean);
                    const payload = candidates.find((c) => c && (c.order_id || c.payment_status)) || {};
                    return {
                      ok: true,
                      orderId: payload.order_id || null,
                      paymentStatus: (payload.payment_status || "").toUpperCase() || null,
                      transid: payload.transid || null,
                      gatewayUrl: payload.payment_gateway_url || null,
                      simulated: !!payload.simulated,
                      environment: payload.environment || "live",
                    };
                  } catch (err) {
                    return { ok: false, error: err };
                  }
                }}
                onCancel={onCancelPay}
                onSuccess={() => onPaySuccess(listing.id)}
              />
            </div>
          )}

          {/* ── Actions ─────────────────────────────────── */}
          {!isPaying && (
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-gray-100 mt-auto">
              {isLive && (
                <>
                  <SecondaryAction icon={Eye} label={t("Angalia", "View")} />
                  <PrimaryAction icon={Rocket} label={t("Boost", "Boost")} onClick={() => onBoost(listing.id)} />
                  <SecondaryAction icon={TrendingUp} label={t("Promote", "Promote")} onClick={() => onLeading(listing.id)} />
                  <SecondaryAction
                    icon={Megaphone}
                    label={activeBanner ? t("Inatangazwa", "Advertising") : t("Advertise", "Advertise")}
                    onClick={() => onAdvertise(listing.id)}
                  />
                  <div className="ml-auto flex items-center gap-1.5">
                    <IconOnlyAction icon={Pencil} label={t("Hariri", "Edit")} />
                    <IconOnlyAction icon={Pause} label={t("Simamisha", "Pause")} onClick={() => onPause(listing.id)} />
                    <IconOnlyAction
                      icon={CheckCircle}
                      label={t("Weka kama imeuzwa", "Mark as sold")}
                      onClick={() => {
                        if (window.confirm(t(
                          "Weka mali hii kama IMEUZWA?",
                          "Mark this listing as SOLD?"
                        ))) onMarkSold(listing.id);
                      }}
                    />
                    <IconOnlyAction
                      icon={Trash2}
                      label={t("Futa", "Delete")}
                      tone="danger"
                      onClick={() => onRemove(listing.id)}
                    />
                  </div>
                </>
              )}

              {isPaused && (
                <>
                  <PrimaryAction icon={Play} label={t("Endeleza", "Resume")} onClick={() => onResume(listing.id)} />
                  <SecondaryAction icon={Pencil} label={t("Hariri", "Edit")} />
                  <div className="ml-auto">
                    <IconOnlyAction icon={Trash2} label={t("Futa", "Delete")} tone="danger" onClick={() => onRemove(listing.id)} />
                  </div>
                </>
              )}

              {isReserved && (
                <>
                  <SecondaryAction icon={Eye} label={t("Angalia", "View")} />
                  <SecondaryAction icon={Pencil} label={t("Hariri", "Edit")} />
                </>
              )}

              {isPendingPayment && !isPaying && (
                <>
                  <PrimaryAction
                    icon={CreditCard}
                    label={t(`Lipa ${formatTZS(listing.listingFee)}`, `Pay ${formatTZS(listing.listingFee)}`)}
                    onClick={() => onStartPay(listing.id)}
                  />
                  <div className="ml-auto">
                    <IconOnlyAction icon={Trash2} label={t("Futa", "Delete")} tone="danger" onClick={() => onRemove(listing.id)} />
                  </div>
                </>
              )}

              {isInReview && (
                <>
                  <SecondaryAction icon={Pencil} label={t("Hariri", "Edit")} />
                </>
              )}

              {listing.status === "sold" && (
                <>
                  <SecondaryAction icon={Eye} label={t("Angalia", "View")} />
                </>
              )}

              {listing.status === "expired" && (
                <>
                  <PrimaryAction icon={RefreshCw} label={t("Chapisha Tena", "Republish")} />
                  <div className="ml-auto">
                    <IconOnlyAction icon={Trash2} label={t("Futa", "Delete")} tone="danger" onClick={() => onRemove(listing.id)} />
                  </div>
                </>
              )}

              {listing.status === "rejected" && (
                <>
                  <SecondaryAction icon={Pencil} label={t("Hariri", "Edit")} />
                  <div className="ml-auto">
                    <IconOnlyAction icon={Trash2} label={t("Futa", "Delete")} tone="danger" onClick={() => onRemove(listing.id)} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function MyListings({
  listings = [],
  onRemove = () => {},
  onBoost = () => {},
  onLeading = () => {},
  onAdvertise = () => {},
  onPaid = () => {},
  onPause = () => {},
  onResume = () => {},
  onMarkSold = () => {},
  onPostNew = () => {},
}) {
  const { lang } = useLanguage();
  const [tab, setTab] = useState("all");
  const [payingId, setPayingId] = useState(null);
  const [view, setView] = useState("grid"); // "grid" | "list"
  const [query, setQuery] = useState("");
  const activeBanners = useActiveBannerAds();

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // Tab list — every status, plus "all"
  const TABS = [
    { key: "all",             label: { sw: "Zote",            en: "All" } },
    { key: "live",            label: { sw: "Hai",             en: "Live" } },
    { key: "paused",          label: { sw: "Imesimamishwa",   en: "Paused" } },
    { key: "reserved",        label: { sw: "Imehifadhiwa",    en: "Reserved" } },
    { key: "pending_payment", label: { sw: "Malipo",          en: "Pending" } },
    { key: "in_review",       label: { sw: "Inakaguliwa",     en: "In Review" } },
    { key: "sold",            label: { sw: "Imeuzwa",         en: "Sold" } },
    { key: "expired",         label: { sw: "Imeisha Muda",    en: "Expired" } },
    { key: "rejected",        label: { sw: "Imekataliwa",     en: "Rejected" } },
  ];

  const counts = useMemo(() => {
    const c = {};
    TABS.forEach((tb) => {
      c[tb.key] = tb.key === "all" ? listings.length : listings.filter((l) => l.status === tb.key).length;
    });
    return c;
  }, [listings]);

  const filtered = useMemo(() => {
    let out = tab === "all" ? listings : listings.filter((l) => l.status === tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (l) =>
          (l.title || "").toLowerCase().includes(q) ||
          (l.location || "").toLowerCase().includes(q) ||
          (l.category || "").toLowerCase().includes(q)
      );
    }
    return out;
  }, [listings, tab, query]);

  // Primary CTA shown when there are no listings at all
  const isEmpty = listings.length === 0;

  return (
    <div style={{ background: COLORS.sand }} className="w-full min-h-[600px] p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* ═══════════════════════════════════════════════════ */}
        {/* HEADER                                              */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-[#E8A33D] uppercase tracking-[0.2em]">
              {t("Mali Zangu", "My Listings")}
            </span>
            <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-primary mt-2 tracking-[-0.015em]">
              {t("Dhibiti mali zako", "Manage your properties")}
            </h1>
            <p className="text-sm text-secondary mt-1.5 max-w-lg">
              {t(
                "Fuatilia hali ya kila tangazo, lipa ada, na ongeza mali mpya.",
                "Track the status of every listing, pay fees, and add new properties."
              )}
            </p>
          </div>
          <button
            onClick={onPostNew}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0 self-start sm:self-end"
            style={{ background: COLORS.gold, color: COLORS.night, boxShadow: "0 8px 24px -10px rgba(232,163,61,0.6)" }}
          >
            <Plus size={15} />
            {t("Ongeza Mali", "Add Property")}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* FILTER BAR                                          */}
        {/* ═══════════════════════════════════════════════════ */}
        {!isEmpty && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Tafuta kwenye mali zako...", "Search your listings...")}
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:border-[#E8A33D] transition-colors"
              />
            </div>
            <div className="flex items-center gap-1 border border-gray-200 bg-white rounded-xl p-1 shrink-0">
              <button
                onClick={() => setView("grid")}
                aria-label={t("Grid", "Grid")}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  view === "grid" ? "text-[#101A2E]" : "text-muted hover:text-secondary"
                }`}
                style={{ background: view === "grid" ? COLORS.sand : "transparent" }}
              >
                <Grid3x3 size={15} />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label={t("Orodha", "List")}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  view === "list" ? "text-[#101A2E]" : "text-muted hover:text-secondary"
                }`}
                style={{ background: view === "list" ? COLORS.sand : "transparent" }}
              >
                <ListIcon size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TABS                                                */}
        {/* ═══════════════════════════════════════════════════ */}
        {!isEmpty && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
            {TABS.map((tb) => {
              const active = tab === tb.key;
              const count = counts[tb.key];
              const label = tb.label[lang] || tb.label.sw;
              return (
                <button
                  key={tb.key}
                  onClick={() => setTab(tb.key)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full whitespace-nowrap transition-all shrink-0 ${
                    active
                      ? "text-white shadow-sm"
                      : "text-secondary bg-white border border-gray-200 hover:border-gray-300"
                  }`}
                  style={active ? { background: COLORS.night } : undefined}
                >
                  {label}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                      active ? "bg-white/15 text-white" : "bg-gray-100 text-secondary"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* EMPTY STATES                                        */}
        {/* ═══════════════════════════════════════════════════ */}
        {isEmpty && (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 py-16 px-6 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(232,163,61,0.12)" }}
            >
              <Plus size={28} color={COLORS.gold} />
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">
              {t("Anza kuuza leo", "Start selling today")}
            </h3>
            <p className="text-sm text-secondary max-w-md mx-auto mb-6">
              {t(
                "Huna tangazo lolote bado. Ongeza mali yako ya kwanza ili wanunuzi waanze kuiona.",
                "You have no listings yet. Add your first property so buyers can start discovering it."
              )}
            </p>
            <button
              onClick={onPostNew}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: COLORS.gold, color: COLORS.night }}
            >
              <Plus size={16} />
              {t("Ongeza Mali ya Kwanza", "Add Your First Property")}
            </button>
          </div>
        )}

        {!isEmpty && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Search size={40} className="mx-auto text-muted mb-3" />
            <h3 className="font-semibold text-primary mb-1">
              {query
                ? t("Hakuna matokeo", "No results")
                : t(`Hakuna mali yenye hali hii`, "No listings with this status")}
            </h3>
            <p className="text-sm text-secondary">
              {query
                ? t("Jaribu neno lingine la utafutaji.", "Try a different search term.")
                : t("Badilisha kichujio cha hali kuona mali zingine.", "Switch the status filter to see other listings.")}
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* LISTINGS                                            */}
        {/* ═══════════════════════════════════════════════════ */}
        {!isEmpty && filtered.length > 0 && (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 lg:grid-cols-2 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {filtered.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                lang={lang}
                onRemove={onRemove}
                onBoost={onBoost}
                onLeading={onLeading}
                onAdvertise={onAdvertise}
                onPause={onPause}
                onResume={onResume}
                onMarkSold={onMarkSold}
                activeBanner={activeBanners.find((b) => b.listingId === l.id)}
                isPaying={payingId === l.id}
                onStartPay={setPayingId}
                onCancelPay={() => setPayingId(null)}
                onPaySuccess={(id) => {
                  onPaid(id, { alreadyPaid: true });
                  setPayingId(null);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

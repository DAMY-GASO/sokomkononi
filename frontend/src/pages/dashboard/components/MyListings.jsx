// ============================================================
// MyListings.jsx
// Mali Zangu — tabs, views, enquiries, actions.
// Bilingual kamili + Pause/Resume/Mark as Sold + KILA KITU CENTERED.
// ============================================================

import React, { useState } from "react";
import {
  Eye,
  Rocket,
  Pencil,
  Trash2,
  Clock,
  CreditCard,
  RefreshCw,
  MapPin,
  Inbox,
  TrendingUp,
  Megaphone,
  Pause,
  Play,
  CheckCircle,
} from "lucide-react";
import {
  COLORS,
  getCategory,
  formatTZS,
  timeAgo,
  STATUS,
  isBoostActive,
  boostDaysRemaining,
  isLeadingActive,
  leadingDaysRemaining,
} from "./shared";
import {
  useActiveBannerAds,
  bannerDaysRemaining,
} from "../../../config/bannerAdsStore.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { api } from "../../../api/client.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import PaymentGateway from "./PaymentGateway";

// ============================================================
// STATUS BADGE — bilingual kamili
// ============================================================
function StatusBadge({ status, lang }) {
  const config = {
    live: {
      label: { sw: "Hai", en: "Live" },
      bg: "rgba(47,109,79,0.12)",
      fg: COLORS.green,
    },
    paused: {
      label: { sw: "Imesimamishwa", en: "Paused" },
      bg: "rgba(232,163,61,0.16)",
      fg: "#8A5A16",
    },
    reserved: {
      label: { sw: "Imehifadhiwa", en: "Reserved" },
      bg: "rgba(232,163,61,0.16)",
      fg: "#8A5A16",
    },
    sold: {
      label: { sw: "Imeuzwa", en: "Sold" },
      bg: "rgba(16,26,46,0.08)",
      fg: COLORS.night,
    },
    pending_payment: {
      label: { sw: "Inasubiri Malipo", en: "Pending Payment" },
      bg: "rgba(232,163,61,0.16)",
      fg: "#8A5A16",
    },
    in_review: {
      label: { sw: "Inakaguliwa", en: "In Review" },
      bg: "rgba(16,26,46,0.08)",
      fg: COLORS.night,
    },
    expired: {
      label: { sw: "Imeisha Muda", en: "Expired" },
      bg: "rgba(193,80,46,0.12)",
      fg: COLORS.rust,
    },
    rejected: {
      label: { sw: "Imekataliwa", en: "Rejected" },
      bg: "rgba(193,80,46,0.12)",
      fg: COLORS.rust,
    },
  };
  const s = config[status] || config.pending_payment;
  const label = s.label?.[lang] || s.label?.sw;
  return (
    <span
      style={{ background: s.bg, color: s.fg }}
      className="text-body-sm font-semibold px-2.5 py-1 rounded-full shrink-0"
    >
      {label}
    </span>
  );
}

function ActionButton({ icon: Icon, label, onClick, tone = "default" }) {
  const styles =
    tone === "primary"
      ? { background: COLORS.gold, color: COLORS.night }
      : tone === "success"
        ? { background: COLORS.green, color: "white" }
        : tone === "danger"
          ? {
              background: "transparent",
              color: COLORS.rust,
              borderColor: "rgba(193,80,46,0.35)",
            }
          : {
              background: "transparent",
              color: COLORS.night,
              borderColor: COLORS.sandLine,
            };

  return (
    <button
      onClick={onClick}
      style={styles}
      className={`flex items-center gap-1.5 text-body-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
        tone === "primary" || tone === "success" ? "" : "border"
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function ListingCard({
  listing,
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
  lang,
}) {
  const category = getCategory(listing.category);
  const Icon = getCategoryIcon(category?.iconKey);
  const categoryLabel =
    category?.label?.[lang] || category?.label?.sw || listing.category;
  const isFaded = listing.status === "sold" || listing.status === "expired";
  const isReserved = listing.status === "reserved";

  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-2xl border p-4 flex flex-col sm:flex-row gap-4"
    >
      <div
        style={{ background: COLORS.night }}
        className="w-full sm:w-24 h-24 rounded-xl flex items-center justify-center shrink-0"
      >
        {Icon && (
          <Icon
            size={26}
            color={COLORS.gold}
            style={{ opacity: isFaded ? 0.5 : 1 }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3
            style={{ color: COLORS.night, opacity: isFaded ? 0.6 : 1 }}
            className="text-sm font-semibold leading-snug"
          >
            {listing.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {isLeadingActive(listing) && (
              <span
                style={{
                  background: "rgba(47,109,79,0.14)",
                  color: COLORS.green,
                }}
                className="flex items-center gap-1 text-body-sm font-semibold px-2 py-1 rounded-full"
              >
                <TrendingUp size={11} /> {leadingDaysRemaining(listing)}d
              </span>
            )}
            {activeBanner && (
              <span
                style={{
                  background: "rgba(193,80,46,0.14)",
                  color: COLORS.rust,
                }}
                className="flex items-center gap-1 text-body-sm font-semibold px-2 py-1 rounded-full"
              >
                <Megaphone size={11} /> {bannerDaysRemaining(activeBanner)}d
              </span>
            )}
            {isBoostActive(listing) && (
              <span
                style={{
                  background: "rgba(232,163,61,0.16)",
                  color: "#8A5A16",
                }}
                className="flex items-center gap-1 text-body-sm font-semibold px-2 py-1 rounded-full"
              >
                <Rocket size={11} /> {boostDaysRemaining(listing)}d
              </span>
            )}
            <StatusBadge status={listing.status} lang={lang} />
          </div>
        </div>

        <p className="text-secondary text-body-sm mb-2">
          {categoryLabel}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
          <span
            style={{ color: isFaded ? "rgba(16,26,46,0.5)" : COLORS.rust }}
            className="text-sm font-bold"
          >
            {formatTZS(listing.price)}
          </span>
          <span
            className="text-secondary flex items-center gap-1 text-body-sm"
          >
            <MapPin size={12} />
            {listing.location}
          </span>
          <span className="text-muted text-body-sm">
            {timeAgo(listing.postedAt, lang)}
          </span>
        </div>

        {(listing.status === "live" ||
          listing.status === "reserved" ||
          listing.status === "paused" ||
          isFaded) && (
          <div
            className="text-secondary flex items-center gap-4 text-body-sm mb-3"
          >
            <span className="flex items-center gap-1">
              <Eye size={13} /> {listing.views ?? 0} {t("walioangalia", "views")}
            </span>
            <span className="flex items-center gap-1">
              <Inbox size={13} /> {listing.inquiries ?? 0}{" "}
              {t("maswali", "inquiries")}
            </span>
          </div>
        )}

        {listing.status === "pending_payment" && isPaying && (
          <div className="mb-3">
            <PaymentGateway
              amount={listing.listingFee}
              title={t("Ada ya Kuchapisha", "Listing Fee")}
              description={t(
                `Kuchapisha "${listing.title}"`,
                `Publishing "${listing.title}"`
              )}
              onSubmit={async ({ reference }) => {
                try {
                  await api.post(`/listings/${listing.id}/fee/pay/`, {
                    payment_reference: reference,
                  });
                  return { ok: true };
                } catch (err) {
                  return { ok: false, error: err };
                }
              }}
              onCancel={onCancelPay}
              onSuccess={onPaySuccess}
            />
          </div>
        )}

        {listing.status === "pending_payment" && !isPaying && (
          <div
            style={{ background: "rgba(232,163,61,0.1)", color: "#8A5A16" }}
            className="text-body-sm rounded-lg px-3 py-2 mb-3"
          >
            {lang === "sw" ? (
              <>
                Lipa <b>{formatTZS(listing.listingFee)}</b> ili mali hii ianze
                kuonekana kwa wanunuzi.
              </>
            ) : (
              <>
                Pay <b>{formatTZS(listing.listingFee)}</b> so this listing starts
                being visible to buyers.
              </>
            )}
          </div>
        )}

        {listing.status === "in_review" && (
          <div
            className="text-secondary flex items-center gap-1.5 text-body-sm mb-3"
          >
            <Clock size={13} />{" "}
            {t(
              "Timu yetu inakagua taarifa zako — kwa kawaida chini ya saa 24.",
              "Our team is reviewing your listing — usually within 24 hours."
            )}
          </div>
        )}

        {listing.status === "reserved" && (
          <div
            style={{ background: "rgba(232,163,61,0.1)", color: "#8A5A16" }}
            className="flex items-center gap-1.5 text-body-sm rounded-lg px-3 py-2 mb-3"
          >
            <Clock size={13} />{" "}
            {t(
              "Mali hii ina Reservation hai — inaonekana kwa wanunuzi wengine kama RESERVED.",
              "This listing has an active reservation — other buyers see it as RESERVED."
            )}
          </div>
        )}

        {listing.status === "paused" && (
          <div
            style={{ background: "rgba(232,163,61,0.1)", color: "#8A5A16" }}
            className="flex items-center gap-1.5 text-body-sm rounded-lg px-3 py-2 mb-3"
          >
            <Pause size={13} />{" "}
            {t(
              "Mali hii imesimamishwa — haionekani kwa wanunuzi. Unaweza kuiendeleza wakati wowote.",
              "This listing is paused — it's hidden from buyers. You can resume it anytime."
            )}
          </div>
        )}

        {!isPaying && (
          <div className="flex flex-wrap gap-2">
            {listing.status === "live" && (
              <>
                <ActionButton icon={Eye} label={t("Angalia", "View")} />
                <ActionButton
                  icon={Rocket}
                  label={t("Boost Sasa", "Boost Now")}
                  tone="primary"
                  onClick={() => onBoost(listing.id)}
                />
                <ActionButton
                  icon={TrendingUp}
                  label={t("Panda Juu", "Promote")}
                  onClick={() => onLeading(listing.id)}
                />
                <ActionButton
                  icon={Megaphone}
                  label={
                    activeBanner
                      ? t("Inatangazwa", "Advertising")
                      : t("Tangaza", "Advertise")
                  }
                  onClick={() => onAdvertise(listing.id)}
                />
                <ActionButton icon={Pencil} label={t("Hariri", "Edit")} />
                <ActionButton
                  icon={Pause}
                  label={t("Simamisha", "Pause")}
                  onClick={() => onPause(listing.id)}
                />
                <ActionButton
                  icon={CheckCircle}
                  label={t("Imeuzwa", "Mark Sold")}
                  tone="success"
                  onClick={() => {
                    if (
                      window.confirm(
                        t(
                          "Weka mali hii kama IMEUZWA? Itaonekana kwa wanunuzi kama SOLD.",
                          "Mark this listing as SOLD? It will show to buyers as SOLD."
                        )
                      )
                    ) {
                      onMarkSold(listing.id);
                    }
                  }}
                />
                <ActionButton
                  icon={Trash2}
                  label={t("Ondoa", "Remove")}
                  tone="danger"
                  onClick={() => onRemove(listing.id)}
                />
              </>
            )}
            {listing.status === "paused" && (
              <>
                <ActionButton
                  icon={Play}
                  label={t("Endeleza", "Resume")}
                  tone="success"
                  onClick={() => onResume(listing.id)}
                />
                <ActionButton icon={Pencil} label={t("Hariri", "Edit")} />
                <ActionButton
                  icon={Trash2}
                  label={t("Futa", "Delete")}
                  tone="danger"
                  onClick={() => onRemove(listing.id)}
                />
              </>
            )}
            {listing.status === "reserved" && (
              <>
                <ActionButton icon={Eye} label={t("Angalia", "View")} />
                <ActionButton icon={Pencil} label={t("Hariri", "Edit")} />
              </>
            )}
            {listing.status === "pending_payment" && (
              <>
                <ActionButton
                  icon={CreditCard}
                  label={t(
                    `Lipa ${formatTZS(listing.listingFee)}`,
                    `Pay ${formatTZS(listing.listingFee)}`
                  )}
                  tone="primary"
                  onClick={() => onStartPay(listing.id)}
                />
                <ActionButton
                  icon={Trash2}
                  label={t("Futa", "Delete")}
                  tone="danger"
                  onClick={() => onRemove(listing.id)}
                />
              </>
            )}
            {listing.status === "in_review" && (
              <ActionButton icon={Pencil} label={t("Hariri", "Edit")} />
            )}
            {listing.status === "sold" && (
              <ActionButton icon={Eye} label={t("Angalia", "View")} />
            )}
            {listing.status === "expired" && (
              <>
                <ActionButton
                  icon={RefreshCw}
                  label={t("Chapisha Tena", "Republish")}
                  tone="primary"
                />
                <ActionButton
                  icon={Trash2}
                  label={t("Futa", "Delete")}
                  tone="danger"
                  onClick={() => onRemove(listing.id)}
                />
              </>
            )}
            {listing.status === "rejected" && (
              <>
                <ActionButton icon={Pencil} label={t("Hariri", "Edit")} />
                <ActionButton
                  icon={Trash2}
                  label={t("Futa", "Delete")}
                  tone="danger"
                  onClick={() => onRemove(listing.id)}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
}) {
  const { lang } = useLanguage();
  const [tab, setTab] = useState("all");
  const [payingId, setPayingId] = useState(null);
  const activeBanners = useActiveBannerAds();

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // TABS — bilingual kamili (+ paused)
  // ============================================================
  const TABS = [
    { key: "all", label: { sw: "Zote", en: "All" } },
    { key: "live", label: { sw: "Hai", en: "Live" } },
    { key: "paused", label: { sw: "Imesimamishwa", en: "Paused" } },
    { key: "reserved", label: { sw: "Imehifadhiwa", en: "Reserved" } },
    {
      key: "pending_payment",
      label: { sw: "Inasubiri Malipo", en: "Pending" },
    },
    { key: "in_review", label: { sw: "Inakaguliwa", en: "In Review" } },
    { key: "sold", label: { sw: "Imeuzwa", en: "Sold" } },
    { key: "expired", label: { sw: "Imeisha Muda", en: "Expired" } },
    { key: "rejected", label: { sw: "Imekataliwa", en: "Rejected" } },
  ];

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] =
      t.key === "all"
        ? listings.length
        : listings.filter((l) => l.status === t.key).length;
    return acc;
  }, {});

  const filtered =
    tab === "all" ? listings : listings.filter((l) => l.status === tab);

  return (
    <div
      style={{
        background: COLORS.sand,
        minHeight: "600px",
      }}
      className="w-full p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto">
        {/* ============================================================ */}
        {/* HEADER — CENTERED */}
        {/* ============================================================ */}
        <div className="mb-5 text-center">
          <h1
            className="h-title"
          >
            {t("Mali Zangu", "My Listings")}
          </h1>
          <p
            className="text-secondary text-sm mt-2 max-w-xl mx-auto"
          >
            {t(
              "Dhibiti mali zako zote ulizoziweka na fuatilia status ya kila moja.",
              "Manage all your listings and track the status of each one."
            )}
          </p>
        </div>

        {/* ============================================================ */}
        {/* TABS — CENTERED */}
        {/* ============================================================ */}
        <div className="flex justify-center gap-2 mb-5 overflow-x-auto pb-1">
          {TABS.map((tabItem) => {
            const active = tab === tabItem.key;
            const label = tabItem.label?.[lang] || tabItem.label?.sw;
            return (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                style={{
                  background: active ? COLORS.night : "white",
                  color: active ? COLORS.sand : COLORS.night,
                  borderColor: COLORS.sandLine,
                }}
                className="flex items-center gap-1.5 text-body-sm font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap shrink-0"
              >
                {label}
                <span
                  style={{
                    background: active
                      ? "rgba(245,243,236,0.18)"
                      : COLORS.sandLine,
                    color: active ? COLORS.sand : COLORS.night,
                  }}
                  className="text-body-sm font-bold px-1.5 py-0.5 rounded-full"
                >
                  {counts[tabItem.key]}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
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
                onPaySuccess={() => {
                  onPaid(l.id);
                  setPayingId(null);
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{ borderColor: COLORS.sandLine }}
            className="rounded-2xl border-2 border-dashed p-10 text-center"
          >
            <p className="text-muted text-sm">
              {t(
                "Huna mali yoyote yenye status hii kwa sasa.",
                "You don't have any listing with this status yet."
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

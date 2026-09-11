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
} from "lucide-react";
import {
  COLORS,
  FONTS,
  getCategory,
  formatTZS,
  timeAgo,
  STATUS,
  isBoostActive,
  boostDaysRemaining,
  isLeadingActive,
  leadingDaysRemaining,
} from "./shared";
import { useActiveBannerAds, bannerDaysRemaining } from "../../../config/bannerAdsStore.js";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import PaymentGateway from "./PaymentGateway";

function StatusBadge({ status, lang }) {
  const config = {
    live: { label: lang === "sw" ? "Live" : "Live", bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
    reserved: { label: lang === "sw" ? "Ina Reservation" : "Reserved", bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
    sold: { label: lang === "sw" ? "Imeuzwa" : "Sold", bg: "rgba(16,26,46,0.08)", fg: COLORS.night },
    pending_payment: { label: lang === "sw" ? "Inasubiri Malipo" : "Pending Payment", bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
    in_review: { label: lang === "sw" ? "Inakaguliwa" : "In Review", bg: "rgba(16,26,46,0.08)", fg: COLORS.night },
    expired: { label: lang === "sw" ? "Imeisha Muda" : "Expired", bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
    rejected: { label: lang === "sw" ? "Imekataliwa" : "Rejected", bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
  };
  const s = config[status] || config.pending_payment;
  return (
    <span
      style={{ background: s.bg, color: s.fg }}
      className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
    >
      {s.label}
    </span>
  );
}

function ActionButton({ icon: Icon, label, onClick, tone = "default" }) {
  const styles =
    tone === "primary"
      ? { background: COLORS.gold, color: COLORS.night }
      : tone === "danger"
        ? { background: "transparent", color: COLORS.rust, borderColor: "rgba(193,80,46,0.35)" }
        : { background: "transparent", color: COLORS.night, borderColor: COLORS.sandLine };

  return (
    <button
      onClick={onClick}
      style={styles}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
        tone === "primary" ? "" : "border"
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
  activeBanner,
  isPaying,
  onStartPay,
  onCancelPay,
  onPaySuccess,
  lang,
}) {
  const category = getCategory(listing.category);
  const Icon = getCategoryIcon(category?.iconKey);
  const categoryLabel = category?.label?.[lang] || category?.label?.sw || listing.category;
  const isFaded = listing.status === "sold" || listing.status === "expired";
  const isReserved = listing.status === "reserved";

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-2xl border p-4 flex flex-col sm:flex-row gap-4"
    >
      <div
        style={{ background: COLORS.night }}
        className="w-full sm:w-24 h-24 rounded-xl flex items-center justify-center shrink-0"
      >
        {Icon && <Icon size={26} color={COLORS.gold} style={{ opacity: isFaded ? 0.5 : 1 }} />}
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
                style={{ background: "rgba(47,109,79,0.14)", color: COLORS.green }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full"
              >
                <TrendingUp size={11} /> {leadingDaysRemaining(listing)}d
              </span>
            )}
            {activeBanner && (
              <span
                style={{ background: "rgba(193,80,46,0.14)", color: COLORS.rust }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full"
              >
                <Megaphone size={11} /> {bannerDaysRemaining(activeBanner)}d
              </span>
            )}
            {isBoostActive(listing) && (
              <span
                style={{ background: "rgba(232,163,61,0.16)", color: "#8A5A16" }}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full"
              >
                <Rocket size={11} /> {boostDaysRemaining(listing)}d
              </span>
            )}
            <StatusBadge status={listing.status} lang={lang} />
          </div>
        </div>

        <p style={{ color: "rgba(16,26,46,0.5)" }} className="text-xs mb-2">
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
            style={{ color: "rgba(16,26,46,0.55)" }}
            className="flex items-center gap-1 text-xs"
          >
            <MapPin size={12} />
            {listing.location}
          </span>
          <span style={{ color: "rgba(16,26,46,0.4)" }} className="text-xs">
            {timeAgo(listing.postedAt, lang)}
          </span>
        </div>

        {(listing.status === "live" || listing.status === "reserved" || isFaded) && (
          <div
            style={{ color: "rgba(16,26,46,0.55)" }}
            className="flex items-center gap-4 text-xs mb-3"
          >
            <span className="flex items-center gap-1">
              <Eye size={13} /> {listing.views ?? 0} {lang === "sw" ? "walioangalia" : "views"}
            </span>
            <span className="flex items-center gap-1">
              <Inbox size={13} /> {listing.inquiries ?? 0} {lang === "sw" ? "maswali" : "inquiries"}
            </span>
          </div>
        )}

        {listing.status === "pending_payment" && isPaying && (
          <div className="mb-3">
            <PaymentGateway
              amount={listing.listingFee}
              title={lang === "sw" ? "Listing Fee" : "Listing Fee"}
              description={
                lang === "sw"
                  ? `Kuchapisha "${listing.title}"`
                  : `Publishing "${listing.title}"`
              }
              onCancel={onCancelPay}
              onSuccess={onPaySuccess}
            />
          </div>
        )}

        {listing.status === "pending_payment" && !isPaying && (
          <div
            style={{ background: "rgba(232,163,61,0.1)", color: "#8A5A16" }}
            className="text-xs rounded-lg px-3 py-2 mb-3"
          >
            {lang === "sw" ? (
              <>
                Lipa <b>{formatTZS(listing.listingFee)}</b> ili mali hii ianze kuonekana kwa
                wanunuzi.
              </>
            ) : (
              <>
                Pay <b>{formatTZS(listing.listingFee)}</b> so this listing starts being visible to
                buyers.
              </>
            )}
          </div>
        )}

        {listing.status === "in_review" && (
          <div
            style={{ color: "rgba(16,26,46,0.55)" }}
            className="flex items-center gap-1.5 text-xs mb-3"
          >
            <Clock size={13} />{" "}
            {lang === "sw"
              ? "Timu yetu inakagua taarifa zako — kwa kawaida chini ya saa 24."
              : "Our team is reviewing your listing — usually within 24 hours."}
          </div>
        )}

        {listing.status === "reserved" && (
          <div
            style={{ background: "rgba(232,163,61,0.1)", color: "#8A5A16" }}
            className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-2 mb-3"
          >
            <Clock size={13} />{" "}
            {lang === "sw"
              ? "Mali hii ina Reservation hai — inaonekana kwa wanunuzi wengine kama RESERVED."
              : "This listing has an active reservation — other buyers see it as RESERVED."}
          </div>
        )}

        {!isPaying && (
          <div className="flex flex-wrap gap-2">
            {listing.status === "live" && (
              <>
                <ActionButton icon={Eye} label={lang === "sw" ? "Angalia" : "View"} />
                <ActionButton
                  icon={Rocket}
                  label={lang === "sw" ? "Boost Sasa" : "Boost Now"}
                  tone="primary"
                  onClick={() => onBoost(listing.id)}
                />
                <ActionButton
                  icon={TrendingUp}
                  label={lang === "sw" ? "Panda Juu" : "Promote"}
                  onClick={() => onLeading(listing.id)}
                />
                <ActionButton
                  icon={Megaphone}
                  label={
                    activeBanner
                      ? lang === "sw" ? "Inatangazwa" : "Advertising"
                      : lang === "sw" ? "Tangaza" : "Advertise"
                  }
                  onClick={() => onAdvertise(listing.id)}
                />
                <ActionButton icon={Pencil} label={lang === "sw" ? "Hariri" : "Edit"} />
                <ActionButton
                  icon={Trash2}
                  label={lang === "sw" ? "Ondoa" : "Remove"}
                  tone="danger"
                  onClick={() => onRemove(listing.id)}
                />
              </>
            )}
            {listing.status === "reserved" && (
              <>
                <ActionButton icon={Eye} label={lang === "sw" ? "Angalia" : "View"} />
                <ActionButton icon={Pencil} label={lang === "sw" ? "Hariri" : "Edit"} />
              </>
            )}
            {listing.status === "pending_payment" && (
              <>
                <ActionButton
                  icon={CreditCard}
                  label={
                    lang === "sw"
                      ? `Lipa ${formatTZS(listing.listingFee)}`
                      : `Pay ${formatTZS(listing.listingFee)}`
                  }
                  tone="primary"
                  onClick={() => onStartPay(listing.id)}
                />
                <ActionButton
                  icon={Trash2}
                  label={lang === "sw" ? "Futa" : "Delete"}
                  tone="danger"
                  onClick={() => onRemove(listing.id)}
                />
              </>
            )}
            {listing.status === "in_review" && (
              <ActionButton icon={Pencil} label={lang === "sw" ? "Hariri" : "Edit"} />
            )}
            {listing.status === "sold" && (
              <ActionButton icon={Eye} label={lang === "sw" ? "Angalia" : "View"} />
            )}
            {listing.status === "expired" && (
              <>
                <ActionButton
                  icon={RefreshCw}
                  label={lang === "sw" ? "Chapisha Tena" : "Republish"}
                  tone="primary"
                />
                <ActionButton
                  icon={Trash2}
                  label={lang === "sw" ? "Futa" : "Delete"}
                  tone="danger"
                  onClick={() => onRemove(listing.id)}
                />
              </>
            )}
            {listing.status === "rejected" && (
              <>
                <ActionButton icon={Pencil} label={lang === "sw" ? "Hariri" : "Edit"} />
                <ActionButton
                  icon={Trash2}
                  label={lang === "sw" ? "Futa" : "Delete"}
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
}) {
  const { lang } = useLanguage();
  const [tab, setTab] = useState("all");
  const [payingId, setPayingId] = useState(null);
  const activeBanners = useActiveBannerAds();

  const TABS = [
    { key: "all", label: lang === "sw" ? "Zote" : "All" },
    { key: "live", label: "Live" },
    { key: "reserved", label: lang === "sw" ? "Ina Reservation" : "Reserved" },
    { key: "pending_payment", label: lang === "sw" ? "Inasubiri Malipo" : "Pending" },
    { key: "in_review", label: lang === "sw" ? "Inakaguliwa" : "In Review" },
    { key: "sold", label: lang === "sw" ? "Imeuzwa" : "Sold" },
    { key: "expired", label: lang === "sw" ? "Imeisha Muda" : "Expired" },
    { key: "rejected", label: lang === "sw" ? "Imekataliwa" : "Rejected" },
  ];

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] =
      t.key === "all" ? listings.length : listings.filter((l) => l.status === t.key).length;
    return acc;
  }, {});

  const filtered = tab === "all" ? listings : listings.filter((l) => l.status === tab);

  return (
    <div
      style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "600px" }}
      className="w-full p-4 sm:p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-3xl mx-auto">
        <h1
          style={{ fontFamily: FONTS.display, color: COLORS.night }}
          className="text-2xl sm:text-3xl font-semibold mb-1"
        >
          {lang === "sw" ? "Mali Zangu" : "My Listings"}
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-5">
          {lang === "sw"
            ? "Dhibiti mali zako zote ulizoziweka na fuatilia status ya kila moja."
            : "Manage all your listings and track the status of each one."}
        </p>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: active ? COLORS.night : "white",
                  color: active ? COLORS.sand : COLORS.night,
                  borderColor: COLORS.sandLine,
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border whitespace-nowrap shrink-0"
              >
                {t.label}
                <span
                  style={{
                    background: active ? "rgba(245,243,236,0.18)" : COLORS.sandLine,
                    color: active ? COLORS.sand : COLORS.night,
                  }}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                >
                  {counts[t.key]}
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
            <p style={{ color: "rgba(16,26,46,0.45)" }} className="text-sm">
              {lang === "sw"
                ? "Huna mali yoyote yenye status hii kwa sasa."
                : "You don't have any listing with this status yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

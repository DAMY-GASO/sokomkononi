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
import { useActiveBannerAds, bannerDaysRemaining } from "../../config/bannerAdsStore.js";
import PaymentGateway from "./PaymentGateway";

const TABS = [
  { key: "all", label: "Zote" },
  { key: "live", label: "Live" },
  { key: "pending_payment", label: "Inasubiri Malipo" },
  { key: "in_review", label: "Inakaguliwa" },
  { key: "sold", label: "Imeuzwa" },
  { key: "expired", label: "Imeisha Muda" },
];

function StatusBadge({ status }) {
  const s = STATUS[status];
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

function ListingCard({ listing, onRemove, onBoost, onLeading, onAdvertise, activeBanner, isPaying, onStartPay, onCancelPay, onPaySuccess }) {
  const category = getCategory(listing.category);
  const Icon = category?.icon;
  const isFaded = listing.status === "sold" || listing.status === "expired";

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
          <div className="flex items-center gap-1.5 shrink-0">
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
            <StatusBadge status={listing.status} />
          </div>
        </div>

        <p style={{ color: "rgba(16,26,46,0.5)" }} className="text-xs mb-2">
          {category?.label}
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
            {timeAgo(listing.postedAt)}
          </span>
        </div>

        {(listing.status === "live" || isFaded) && (
          <div
            style={{ color: "rgba(16,26,46,0.55)" }}
            className="flex items-center gap-4 text-xs mb-3"
          >
            <span className="flex items-center gap-1">
              <Eye size={13} /> {listing.views ?? 0} walioangalia
            </span>
            <span className="flex items-center gap-1">
              <Inbox size={13} /> {listing.inquiries ?? 0} maswali
            </span>
          </div>
        )}

        {listing.status === "pending_payment" && isPaying && (
          <div className="mb-3">
            <PaymentGateway
              amount={listing.listingFee}
              title="Listing Fee"
              description={`Kuchapisha "${listing.title}"`}
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
            Lipa <b>{formatTZS(listing.listingFee)}</b> ili mali hii ianze kuonekana kwa
            wanunuzi.
          </div>
        )}

        {listing.status === "in_review" && (
          <div
            style={{ color: "rgba(16,26,46,0.55)" }}
            className="flex items-center gap-1.5 text-xs mb-3"
          >
            <Clock size={13} /> Timu yetu inakagua taarifa zako — kwa kawaida chini ya saa
            24.
          </div>
        )}

        {!isPaying && (
          <div className="flex flex-wrap gap-2">
            {listing.status === "live" && (
              <>
                <ActionButton icon={Eye} label="Angalia" />
                <ActionButton icon={Rocket} label="Boost Sasa" tone="primary" onClick={() => onBoost(listing.id)} />
                <ActionButton icon={TrendingUp} label="Panda Juu" onClick={() => onLeading(listing.id)} />
                <ActionButton
                  icon={Megaphone}
                  label={activeBanner ? "Inatangazwa" : "Tangaza"}
                  onClick={() => onAdvertise(listing.id)}
                />
                <ActionButton icon={Pencil} label="Hariri" />
                <ActionButton icon={Trash2} label="Ondoa" tone="danger" onClick={() => onRemove(listing.id)} />
              </>
            )}
            {listing.status === "pending_payment" && (
              <>
                <ActionButton
                  icon={CreditCard}
                  label={`Lipa ${formatTZS(listing.listingFee)}`}
                  tone="primary"
                  onClick={() => onStartPay(listing.id)}
                />
                <ActionButton icon={Trash2} label="Futa" tone="danger" onClick={() => onRemove(listing.id)} />
              </>
            )}
            {listing.status === "in_review" && <ActionButton icon={Pencil} label="Hariri" />}
            {listing.status === "sold" && <ActionButton icon={Eye} label="Angalia" />}
            {listing.status === "expired" && (
              <>
                <ActionButton icon={RefreshCw} label="Chapisha Tena" tone="primary" />
                <ActionButton icon={Trash2} label="Futa" tone="danger" onClick={() => onRemove(listing.id)} />
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
  const [tab, setTab] = useState("all");
  const [payingId, setPayingId] = useState(null);
  const activeBanners = useActiveBannerAds();

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === "all" ? listings.length : listings.filter((l) => l.status === t.key).length;
    return acc;
  }, {});

  const filtered = tab === "all" ? listings : listings.filter((l) => l.status === tab);

  return (
    <div style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "600px" }} className="w-full p-4 sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-3xl mx-auto">
        <h1 style={{ fontFamily: FONTS.display, color: COLORS.night }} className="text-2xl sm:text-3xl font-semibold mb-1">
          My Listings
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-5">
          Dhibiti mali zako zote ulizoziweka na fuatilia status ya kila moja.
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
              Huna mali yoyote yenye status hii kwa sasa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

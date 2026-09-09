import React, { useState } from "react";
import {
  Home,
  Trees,
  Car,
  Briefcase,
  Wrench,
  Eye,
  Rocket,
  Pencil,
  Trash2,
  Clock,
  CreditCard,
  RefreshCw,
  MapPin,
  Inbox,
} from "lucide-react";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  nightSoft: "#1B2740",
  sandLine: "#E6E2D6",
};

const FONTS = {
  display: "'Fraunces', serif",
  body: "'Manrope', sans-serif",
};

const CATEGORY_ICONS = {
  nyumba: Home,
  viwanja: Trees,
  magari: Car,
  biashara: Briefcase,
  mashine: Wrench,
};

const CATEGORY_LABELS = {
  nyumba: "Nyumba & Majengo",
  viwanja: "Viwanja & Mashamba",
  magari: "Magari",
  biashara: "Biashara",
  mashine: "Mashine/Equipment",
};

const STATUS = {
  live: { label: "Live", bg: "rgba(47,109,79,0.12)", fg: COLORS.green },
  pending_payment: { label: "Inasubiri Malipo", bg: "rgba(232,163,61,0.16)", fg: "#8A5A16" },
  in_review: { label: "Inakaguliwa", bg: "rgba(16,26,46,0.08)", fg: COLORS.night },
  sold: { label: "Imeuzwa", bg: "rgba(16,26,46,0.06)", fg: "rgba(16,26,46,0.5)" },
  expired: { label: "Imeisha Muda", bg: "rgba(193,80,46,0.12)", fg: COLORS.rust },
};

const TABS = [
  { key: "all", label: "Zote" },
  { key: "live", label: "Live" },
  { key: "pending_payment", label: "Inasubiri Malipo" },
  { key: "in_review", label: "Inakaguliwa" },
  { key: "sold", label: "Imeuzwa" },
  { key: "expired", label: "Imeisha Muda" },
];

// Mock data - hii itabadilishwa na data kutoka backend
const LISTINGS = [
  {
    id: "l1",
    title: "Nyumba ya Ghorofa Mbezi Beach",
    category: "nyumba",
    price: 85000000,
    location: "Mbezi Beach, Dar es Salaam",
    status: "live",
    postedAt: "2026-08-28",
    views: 214,
    inquiries: 6,
  },
  {
    id: "l2",
    title: "Toyota Harrier 2016",
    category: "magari",
    price: 42000000,
    location: "Kinondoni, Dar es Salaam",
    status: "pending_payment",
    postedAt: "2026-09-07",
    listingFee: 150000,
    views: 0,
    inquiries: 0,
  },
  {
    id: "l3",
    title: "Kiwanja Ubungo — Hati Miliki",
    category: "viwanja",
    price: 28000000,
    location: "Ubungo, Dar es Salaam",
    status: "in_review",
    postedAt: "2026-09-08",
    views: 0,
    inquiries: 0,
  },
  {
    id: "l4",
    title: "Duka la Vifaa vya Ujenzi — Kariakoo",
    category: "biashara",
    price: 15000000,
    location: "Kariakoo, Dar es Salaam",
    status: "sold",
    postedAt: "2026-07-14",
    views: 389,
    inquiries: 11,
  },
  {
    id: "l5",
    title: "Excavator CAT 320D",
    category: "mashine",
    price: 120000000,
    location: "Chalinze, Pwani",
    status: "expired",
    postedAt: "2026-06-02",
    views: 97,
    inquiries: 2,
  },
];

function formatTZS(amount) {
  return "TZS " + Math.round(amount).toLocaleString("en-US");
}

function timeAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return "Leo";
  if (days === 1) return "Jana";
  if (days < 30) return `Siku ${days} zilizopita`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Mwezi 1 uliopita" : `Miezi ${months} iliyopita`;
}

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

function ListingCard({ listing, onRemove }) {
  const Icon = CATEGORY_ICONS[listing.category];
  const isFaded = listing.status === "sold" || listing.status === "expired";

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-2xl border p-4 flex flex-col sm:flex-row gap-4"
    >
      {/* Thumbnail placeholder */}
      <div
        style={{ background: COLORS.night }}
        className="w-full sm:w-24 h-24 rounded-xl flex items-center justify-center shrink-0"
      >
        <Icon size={26} color={COLORS.gold} style={{ opacity: isFaded ? 0.5 : 1 }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3
            style={{ color: COLORS.night, opacity: isFaded ? 0.6 : 1 }}
            className="text-sm font-semibold leading-snug"
          >
            {listing.title}
          </h3>
          <StatusBadge status={listing.status} />
        </div>

        <p style={{ color: "rgba(16,26,46,0.5)" }} className="text-xs mb-2">
          {CATEGORY_LABELS[listing.category]}
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
              <Eye size={13} /> {listing.views} walioangalia
            </span>
            <span className="flex items-center gap-1">
              <Inbox size={13} /> {listing.inquiries} maswali
            </span>
          </div>
        )}

        {listing.status === "pending_payment" && (
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

        <div className="flex flex-wrap gap-2">
          {listing.status === "live" && (
            <>
              <ActionButton icon={Eye} label="Angalia" />
              <ActionButton icon={Rocket} label="Boost Sasa" tone="primary" />
              <ActionButton icon={Pencil} label="Hariri" />
              <ActionButton icon={Trash2} label="Ondoa" tone="danger" onClick={() => onRemove(listing.id)} />
            </>
          )}
          {listing.status === "pending_payment" && (
            <>
              <ActionButton icon={CreditCard} label={`Lipa ${formatTZS(listing.listingFee)}`} tone="primary" />
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
      </div>
    </div>
  );
}

export default function MyListings({ listings: externalListings, onRemove: externalOnRemove }) {
  const [internalListings, setInternalListings] = useState(LISTINGS);
  const [tab, setTab] = useState("all");

  // Tumia external data ikiwa imetolewa, vinginevyo tumia internal
  const listings = externalListings || internalListings;
  
  const handleRemove = (id) => {
    if (externalOnRemove) {
      externalOnRemove(id);
    } else {
      setInternalListings((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === "all" ? listings.length : listings.filter((l) => l.status === t.key).length;
    return acc;
  }, {});

  const filtered = tab === "all" ? listings : listings.filter((l) => l.status === tab);

  return (
    <div style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "400px" }} className="w-full">
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

        {/* Tabs */}
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

        {/* List */}
        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} onRemove={handleRemove} />
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

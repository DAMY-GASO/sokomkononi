// ============================================================
// MyListings.jsx
// Seller — orodha ya mali zake (listings).
// - Preview, boost, leading, advertise, mark sold, pause/resume
// - Delete (soft) + undo window + admin notification
// - Picha za mraba (aspect-square) kwa grid na cards
// ============================================================
import React, { useState, useMemo } from "react";
import {
  PlusCircle,
  Edit3,
  Trash2,
  Pause,
  Play,
  CheckCircle2,
  Rocket,
  TrendingUp,
  Megaphone,
  Eye,
  MapPin,
  Tag,
  Search,
  Loader2,
  AlertTriangle,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  COLORS,
  formatTZS,
  timeAgo,
  getCategory,
  isBoostActive,
  isLeadingActive,
} from "./shared.js";
import { Link } from "react-router-dom";
import StatusBadge from "../admin/shared/StatusBadge";
import ListingImage from "../../../components/ListingImage.jsx";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { useToast } from "../../../components/Toast.jsx";
import { startUndo } from "../../../config/undoStore.js";
import { notifyAdminAboutDeletion } from "../../../config/notificationsStore.js";
import { restoreListingAsync } from "../../../config/listingsStore.js";

// ============================================================
// isUnpaid — module-scope helper so both ListingCard and MyListings
// can use it. A listing is "unpaid" when it's still in a pre-payment
// state OR the backend explicitly says is_paid === false.
// ============================================================
function isUnpaid(listing) {
  if (!listing) return false;
  if (listing.status === "PENDING_PAYMENT" || listing.status === "DRAFT") {
    return true;
  }
  if (listing.isPaid === false) return true;
  return false;
}

// ============================================================
// ACTION BUTTON — kitufe kidogo chenye icon, kina ukubwa mmoja kila mahali
// ============================================================
function ActionBtn({ icon: Icon, label, color, onClick, disabled, danger, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        danger ? "hover:bg-red-50" : "hover:bg-sand"
      } ${className}`}
      style={{
        borderColor: danger ? "rgba(193,80,46,0.3)" : COLORS.sandLine,
        color,
      }}
    >
      <Icon size={12} className="shrink-0" />
      {label}
    </button>
  );
}

// ============================================================
// LISTING CARD — frame ile ile ya ListingCard ya umma:
// border nyembamba, gold kwenye hover, gold ya kudumu kwa Featured.
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
  onPay,
  busy,
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const category = getCategory(listing.category);
  const CategoryIcon = getCategoryIcon(category?.iconKey) || Tag;
  const catLabel =
    category?.label?.[lang] || category?.label?.sw || listing.category || "—";
  const isBusy = busy === "delete";

  const imageUrl =
    listing.imageUrl ||
    (listing.photos && listing.photos[0]) ||
    null;

  const isLiveOrReserved =
    listing.status === "live" || listing.status === "reserved";
  const featured = isBoostActive(listing);
  const leading = isLeadingActive(listing);
  const viewable = ["live", "reserved", "paused", "sold"].includes(listing.status);
  const detailTo = `/mali/${listing.id}`;

  const Thumb = (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
      <ListingImage
        src={imageUrl}
        alt={listing.title}
        ratio="aspect-square"
        fallback={<CategoryIcon size={24} color={COLORS.night} />}
      />
    </div>
  );

  const Title = (
    <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-primary">
      {listing.title}
    </p>
  );

  return (
    <div
      className={`w-full min-w-0 max-w-full overflow-hidden rounded-2xl border-[1.5px] bg-white p-2 shadow-[0_1px_2px_rgba(1,25,87,0.04)] transition-all duration-200 hover:border-gold sm:p-2.5 ${
        featured ? "border-gold" : "border-sandline"
      } ${listing.status === "sold" ? "opacity-80" : ""}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        {viewable ? <Link to={detailTo} className="shrink-0">{Thumb}</Link> : Thumb}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {viewable ? (
              <Link to={detailTo} className="min-w-0 flex-1 hover:text-gold-ink">
                {Title}
              </Link>
            ) : (
              <div className="min-w-0 flex-1">{Title}</div>
            )}
            <StatusBadge status={listing.status} lang={lang} />
          </div>

          <p className="mt-1 text-base font-bold leading-tight text-night">
            {formatTZS(listing.price)}
          </p>

          {isUnpaid(listing) && listing.feeAmount > 0 && (
            <div
              className="mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5"
              style={{
                background: "rgba(193,80,46,0.10)",
                color: COLORS.rust,
              }}
            >
              <AlertCircle size={12} className="shrink-0" />
              <span className="text-[11px] font-semibold leading-tight">
                {t("Haijalipwa", "Unpaid")} ·{" "}
                {formatTZS(listing.feeAmount)}
              </span>
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-secondary">
            <span className="flex min-w-0 items-center gap-1">
              <CategoryIcon size={11} className="shrink-0" />
              <span className="truncate">{catLabel}</span>
            </span>
            {listing.location && (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{listing.location}</span>
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <Eye size={10} />
              {listing.views || 0}
            </span>
            <span>•</span>
            <span>{timeAgo(listing.postedAt, lang)}</span>
            {featured && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-night">
                {t("Imeangaziwa", "Featured")}
              </span>
            )}
            {leading && (
              <span className="rounded-full bg-green px-2 py-0.5 text-[10px] font-semibold text-white">
                {t("Kipaumbele", "Priority")}
              </span>
            )}
          </div>

          {listing.status === "rejected" && listing.rejectionReason && (
            <p
              style={{ color: COLORS.rust }}
              className="mt-1.5 line-clamp-2 rounded-lg bg-red-50 px-2 py-1 text-[11px]"
            >
              {listing.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-sandline pt-2.5">
        {isUnpaid(listing) && (
          <button
            type="button"
            onClick={() => onPay?.(listing.id)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            style={{ background: COLORS.rust, color: "white" }}
          >
            <Wallet size={12} />
            {t("Lipa Sasa", "Pay Now")}
          </button>
        )}

        {isLiveOrReserved && (
          <>
            <ActionBtn icon={Rocket} label={t("Angaza", "Boost")} color={COLORS.goldInk} onClick={() => onBoost(listing.id)} disabled={isBusy} />
            <ActionBtn icon={TrendingUp} label={t("Kipaumbele", "Priority")} color={COLORS.green} onClick={() => onLeading(listing.id)} disabled={isBusy} />
            <ActionBtn icon={Megaphone} label={t("Tangaza", "Advertise")} color={COLORS.rust} onClick={() => onAdvertise(listing.id)} disabled={isBusy} />
          </>
        )}

        {listing.status === "live" && (
          <ActionBtn icon={Pause} label={t("Simamisha", "Pause")} color={COLORS.night} onClick={() => onPause(listing.id)} disabled={isBusy} />
        )}
        {listing.status === "paused" && (
          <ActionBtn icon={Play} label={t("Endelea", "Resume")} color={COLORS.green} onClick={() => onResume(listing.id)} disabled={isBusy} />
        )}
        {isLiveOrReserved && (
          <ActionBtn icon={CheckCircle2} label={t("Imeuzwa", "Sold")} color={COLORS.green} onClick={() => onMarkSold(listing.id)} disabled={isBusy} />
        )}

        <ActionBtn
          icon={isBusy ? Loader2 : Trash2}
          label={t("Futa", "Delete")}
          color={COLORS.rust}
          onClick={() => onRemove(listing.id)}
          disabled={isBusy}
          danger
          className="ml-auto"
        />
      </div>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function MyListings({
  listings = [],
  onRemove,
  onBoost,
  onLeading,
  onAdvertise,
  onPaid,
  onPause,
  onResume,
  onMarkSold,
  onPostNew,
}) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const goToPayment = (id) => navigate(`/dashboard/pay-listing?id=${id}`);

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState({});

  // ── Kichujio + utafutaji ────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...listings];

    if (filter !== "all") {
      list = list.filter((l) => l.status === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.title?.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q) ||
          l.category?.toLowerCase().includes(q)
      );
    }

    return list.sort(
      (a, b) =>
        new Date(b.postedAt || 0).getTime() -
        new Date(a.postedAt || 0).getTime()
    );
  }, [listings, filter, searchQuery]);

  const filters = [
    { key: "all", label: { sw: "Zote", en: "All" } },
    { key: "live", label: { sw: "Hai", en: "Live" } },
    { key: "in_review", label: { sw: "Inasubiri", en: "In Review" } },
    { key: "reserved", label: { sw: "Imehifadhiwa", en: "Reserved" } },
    { key: "sold", label: { sw: "Imeuzwa", en: "Sold" } },
    { key: "paused", label: { sw: "Imesimama", en: "Paused" } },
    { key: "rejected", label: { sw: "Imekataliwa", en: "Rejected" } },
  ];

  // ============================================================
// HANDLE REMOVE — undo window + admin notification
// ============================================================
const handleRemove = async (id) => {
  if (busy[id]) return;
  const listing = listings.find((l) => String(l.id) === String(id));
  if (!listing) return;

  setBusy((b) => ({ ...b, [id]: "delete" }));

  // 1. Futa (soft delete) kwa API
  const res = await onRemove(id);
  setBusy((b) => {
    const n = { ...b };
    delete n[id];
    return n;
  });

  if (!res?.ok) {
    toast.error(
      res?.error?.message || t("Imeshindikana kufuta", "Failed to delete")
    );
    return;
  }

  // 2. Anzisha undo window
  startUndo({
    type: "listing",
    id,
    title: listing.title,
    message: t(
      `"${listing.title}" imefutwa. Unaweza kuirejesha.`,
      `"${listing.title}" deleted. You can undo.`
    ),
    onRestore: async () => {
      await restoreListingAsync(id);
    },
  });

  // 3. Tuma notification kwa admin (fire-and-forget, lakini inaonekana kwenye console)
  //    ⬇️ TUNA TUMA `listing` YENYEWE, sio object mpya
  notifyAdminAboutDeletion({
    ...listing,
    id, // hakikisha id ni ile halisi (String vs Number)
    deleted_by: user, // hiari — kama unataka kumjulisha admin ni nani alifuta
  }).catch((err) => {
    console.warn("[handleRemove] Admin notification failed:", err);
  });

  // 4. Toast ya kawaida
  toast.success(t("Tangazo limefutwa", "Listing deleted"), {
    duration: 2000,
  });
};

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-primary">
            {t("Mali Zangu", "My Listings")}
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            {t(
              `${listings.length} matangazo`,
              `${listings.length} listings`
            )}
          </p>
        </div>
        <button
          onClick={onPostNew}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 hover:opacity-90 transition-opacity"
        >
          <PlusCircle size={14} />
          {t("Weka Mpya", "Post New")}
        </button>
      </div>

      {/* ── Filters + Search ─────────────────────────────── */}
      {listings.length > 0 && (
        <>
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 mb-3 w-full"
               style={{ borderColor: COLORS.sandLine }}>
            <Search size={14} className="text-muted shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                "Tafuta kwa jina, mahali, au category...",
                "Search by title, location, or category..."
              )}
              className="outline-none text-xs flex-1 min-w-0"
            />
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {filters.map((f) => {
              const count = listings.filter((l) =>
                f.key === "all" ? true : l.status === f.key
              ).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    background: filter === f.key ? COLORS.night : "white",
                    color:
                      filter === f.key ? COLORS.sand : "var(--text-primary)",
                    borderColor: COLORS.sandLine,
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
                >
                  {f.label[lang]} ({count})
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── List ─────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center"
        >
          <Tag size={40} className="mx-auto text-muted mb-3" />
          <h3 className="font-semibold text-primary mb-1">
            {searchQuery || filter !== "all"
              ? t("Hakuna matokeo", "No results")
              : t("Hakuna mali bado", "No listings yet")}
          </h3>
          <p className="text-sm text-secondary mb-4">
            {searchQuery || filter !== "all"
              ? t(
                  "Jaribu kubadilisha vichujio au utafutaji.",
                  "Try changing filters or search."
                )
              : t(
                  "Weka tangazo lako la kwanza ili wanunuzi wakuone.",
                  "Post your first listing so buyers can find you."
                )}
          </p>
          {!searchQuery && filter === "all" && (
            <button
              onClick={onPostNew}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              <PlusCircle size={14} />
              {t("Weka Mali Yako", "Post Property")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {filtered.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              lang={lang}
              onRemove={handleRemove}
              onBoost={onBoost}
              onLeading={onLeading}
              onAdvertise={onAdvertise}
              onPause={onPause}
              onResume={onResume}
              onMarkSold={onMarkSold}
              onPay={goToPayment}
              busy={busy[l.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
